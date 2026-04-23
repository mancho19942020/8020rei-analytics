/**
 * DM Campaign Daily Digest — Next.js API Route
 *
 * Sends a daily Slack digest to #dm-campaign-alerts using threaded messages:
 *   - Main message: compact summary (severity counts, new vs persistent)
 *   - Thread replies: one per alert, new alerts first (full detail), then persistent (brief)
 *
 * Falls back to a single flat message if the Slack Bot Token is not configured.
 *
 * Usage:
 *   POST /api/rapid-response/slack-alerts           — daily digest
 *   POST /api/rapid-response/slack-alerts?force=true — send ALL alerts with full detail
 *
 * Designed to be called Mon-Fri at 9:00 AM EST by GitHub Actions cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { queryOnHoldAges, ON_HOLD_STALE_THRESHOLD_DAYS } from '@/lib/on-hold-ages';
import {
  sendSlackMessage,
  sendSlackThreadReply,
  isSlackConfigured,
  isThreadingSupported,
} from '@/lib/slack';
import type { SlackBlock } from '@/lib/slack';
import type { RrAlert } from '@/types/rapid-response';
import fs from 'fs';
import path from 'path';
// Test-domain exclusion — canonical source. Any change applies everywhere simultaneously.
import { TEST_DOMAINS_SQL as SEED_DOMAINS, EXCLUDE_TEST_DOMAINS_SQL as EXCLUDE_SEED } from '@/lib/domain-filter';
import { getCachedPcmOrdersSlim, type PcmOrderSlim } from '@/app/api/dm-overview/compute';
import { pcmRate, currentPcmRates } from '@/lib/pcm-pricing-eras';
// Campaign / client lifecycle alerts — shared with the CS (business) digest
// so both channels surface the same events with the same IDs.
import { queryRecentCampaignStops, queryRecentClientDeactivations } from '@/lib/campaign-lifecycle';

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  if (!isAuroraConfigured()) {
    return NextResponse.json({ success: false, error: 'Aurora not configured' }, { status: 503 });
  }
  if (!isSlackConfigured()) {
    return NextResponse.json({ success: false, error: 'Slack not configured' }, { status: 503 });
  }

  const force = request.nextUrl.searchParams.get('force') === 'true';

  try {
    // Fetch current alerts
    const alerts = await fetchCurrentAlerts();

    // Load yesterday's state — prefer body payload (from GitHub Actions cache),
    // fall back to local /tmp file
    let yesterdayState: AlertStateEntry[] = [];
    try {
      const body = await request.json();
      if (Array.isArray(body?.previousState)) {
        yesterdayState = body.previousState;
      }
    } catch {
      yesterdayState = loadAlertState();
    }

    // Classify alerts as persistent or new
    const yesterdayIds = new Set(yesterdayState.map(a => a.id));
    const persistentAlerts = alerts.filter(a => yesterdayIds.has(a.id));
    const newAlerts = alerts.filter(a => !yesterdayIds.has(a.id));

    // Build context for persistent alerts — check if metrics changed
    const yesterdayMap = new Map(yesterdayState.map(a => [a.id, a]));
    const persistentWithDelta = persistentAlerts.map(a => {
      const prev = yesterdayMap.get(a.id);
      const prevCurrent = prev?.metricCurrent;
      const nowCurrent = a.metrics?.current;
      let delta: string | null = null;
      if (prevCurrent != null && nowCurrent != null && prevCurrent !== nowCurrent) {
        const diff = nowCurrent - prevCurrent;
        const arrow = diff > 0 ? '\u2191' : '\u2193';
        delta = `${arrow} was ${formatNum(prevCurrent)}, now ${formatNum(nowCurrent)}`;
      }
      return { alert: a, delta };
    });

    // If no alerts, send "all clear"
    if (alerts.length === 0) {
      await sendSlackMessage({
        text: 'DM Campaign: All clear — no alerts today',
        blocks: formatAllClearBlocks(),
        unfurl_links: false,
      });
      saveAlertState([]);
      return NextResponse.json({ success: true, message: 'All clear — no alerts', sent: 0 });
    }

    // Send the digest
    if (isThreadingSupported()) {
      await sendThreadedDigest(newAlerts, persistentWithDelta, alerts.length, force);
    } else {
      // Fallback: single flat message (legacy webhook)
      await sendFlatDigest(newAlerts, persistentWithDelta, alerts.length, force);
    }

    // Save state for tomorrow
    saveAlertState(alerts);

    // Build current state for caller to cache
    const currentState: AlertStateEntry[] = alerts.map(a => ({
      id: a.id,
      severity: a.severity,
      metricCurrent: a.metrics?.current,
      entity: a.entity,
    }));

    return NextResponse.json({
      success: true,
      message: `Digest sent: ${newAlerts.length} new, ${persistentAlerts.length} persistent`,
      new: newAlerts.length,
      persistent: persistentAlerts.length,
      total: alerts.length,
      threaded: isThreadingSupported(),
      currentState,
    });
  } catch (err) {
    console.error('[Slack Digest] Error:', err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Internal error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

// ---------------------------------------------------------------------------
// Threaded Digest (Web API)
// ---------------------------------------------------------------------------

const SEVERITY_EMOJI: Record<string, string> = {
  critical: ':red_circle:',
  warning: ':large_yellow_circle:',
  info: ':large_blue_circle:',
};

async function sendThreadedDigest(
  newAlerts: RrAlert[],
  persistent: { alert: RrAlert; delta: string | null }[],
  totalCount: number,
  force: boolean,
): Promise<void> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const allAlerts = [...newAlerts, ...persistent.map(p => p.alert)];
  const criticalCount = allAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = allAlerts.filter(a => a.severity === 'warning').length;

  // Build summary line
  const parts = [
    criticalCount > 0 ? `:red_circle: *${criticalCount} critical*` : null,
    warningCount > 0 ? `:large_yellow_circle: *${warningCount} warning*` : null,
    `${totalCount} total active`,
  ];
  if (!force) {
    if (newAlerts.length > 0) parts.push(`*${newAlerts.length} new*`);
    if (persistent.length > 0) parts.push(`${persistent.length} persistent`);
  }

  // 1. Post main message (summary only)
  const summaryBlocks: SlackBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `DM Campaign daily digest — ${today}`, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: parts.filter(Boolean).join('  ·  ') },
    },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: ':thread: Details in thread  ·  :bar_chart: <https://metrics-hub.8020rei.com/features/features-rei/dm-campaign/operational-health|View in Metrics Hub>',
      }],
    },
  ];

  const threadTs = await sendSlackMessage({
    text: `DM Campaign daily digest — ${criticalCount} critical, ${warningCount} warning`,
    blocks: summaryBlocks,
    unfurl_links: false,
  });

  if (!threadTs || threadTs === 'webhook') return;

  // 2. Post each NEW alert as a thread reply (full detail)
  if (newAlerts.length > 0) {
    await sendSlackThreadReply(threadTs, {
      text: 'New alerts',
      blocks: [{
        type: 'section',
        text: { type: 'mrkdwn', text: ':new: *New alerts*' },
      }],
    });

    for (const alert of newAlerts) {
      await sendSlackThreadReply(threadTs, {
        text: `${alert.name}: ${alert.description}`,
        blocks: formatAlertDetailBlocks(alert),
      });
    }
  }

  // 3. Post each PERSISTENT alert as a thread reply (brief or full if force)
  if (persistent.length > 0) {
    await sendSlackThreadReply(threadTs, {
      text: 'Persistent alerts',
      blocks: [{
        type: 'section',
        text: { type: 'mrkdwn', text: ':repeat: *Persistent alerts* (still active from previous days)' },
      }],
    });

    if (force) {
      for (const { alert } of persistent) {
        await sendSlackThreadReply(threadTs, {
          text: `${alert.name}: ${alert.description}`,
          blocks: formatAlertDetailBlocks(alert),
        });
      }
    } else {
      // Brief summary of all persistent alerts in one message
      const lines = persistent.map(({ alert, delta }) => {
        const emoji = SEVERITY_EMOJI[alert.severity] || ':white_circle:';
        const metricStr = alert.metrics?.current !== undefined
          ? ` — ${formatNum(alert.metrics.current)}`
          : '';
        const deltaStr = delta ? ` (${delta})` : '';
        return `${emoji} *${alert.name}*${metricStr}${deltaStr}`;
      });

      await sendSlackThreadReply(threadTs, {
        text: lines.join('\n'),
        blocks: [{
          type: 'section',
          text: { type: 'mrkdwn', text: lines.join('\n') },
        }],
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Alert Detail Blocks (used in thread replies)
// ---------------------------------------------------------------------------

function formatAlertDetailBlocks(alert: RrAlert): SlackBlock[] {
  const emoji = SEVERITY_EMOJI[alert.severity] || ':white_circle:';
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `${emoji} *${alert.name}*`,
          alert.description,
          '',
          `*Action:* ${alert.action}`,
        ].join('\n'),
      },
    },
  ];

  if (alert.metrics) {
    const parts: string[] = [];
    if (alert.metrics.current !== undefined) parts.push(`Current: *${formatNum(alert.metrics.current)}*`);
    if (alert.metrics.baseline !== undefined) parts.push(`Threshold: *${formatNum(alert.metrics.baseline)}*`);
    if (parts.length > 0) {
      blocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: parts.join('  ·  ') }],
      });
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Flat Digest (legacy webhook fallback)
// ---------------------------------------------------------------------------

async function sendFlatDigest(
  newAlerts: RrAlert[],
  persistent: { alert: RrAlert; delta: string | null }[],
  totalCount: number,
  force: boolean,
): Promise<void> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const allAlerts = [...newAlerts, ...persistent.map(p => p.alert)];
  const criticalCount = allAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = allAlerts.filter(a => a.severity === 'warning').length;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `DM Campaign daily digest — ${today}`, emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          criticalCount > 0 ? `:red_circle: *${criticalCount} critical*` : null,
          warningCount > 0 ? `:large_yellow_circle: *${warningCount} warning*` : null,
          `${totalCount} total active`,
        ].filter(Boolean).join('  ·  '),
      },
    },
  ];

  // New alerts (full detail)
  if (newAlerts.length > 0) {
    blocks.push({ type: 'divider' });
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: ':new: *New alerts*' } });
    for (const alert of newAlerts) {
      blocks.push(...formatAlertDetailBlocks(alert));
    }
  }

  // Persistent alerts (brief)
  if (persistent.length > 0 && !force) {
    blocks.push({ type: 'divider' });
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: ':repeat: *Persistent alerts*' } });
    const lines = persistent.map(({ alert, delta }) => {
      const emoji = SEVERITY_EMOJI[alert.severity] || ':white_circle:';
      const metricStr = alert.metrics?.current !== undefined ? ` — ${formatNum(alert.metrics.current)}` : '';
      const deltaStr = delta ? ` (${delta})` : '';
      return `${emoji} *${alert.name}*${metricStr}${deltaStr}`;
    });
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } });
  }

  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'context',
    elements: [{
      type: 'mrkdwn',
      text: ':bar_chart: <https://metrics-hub.8020rei.com/features/features-rei/dm-campaign/operational-health|View in Metrics Hub>',
    }],
  });

  await sendSlackMessage({
    text: `DM Campaign daily digest — ${criticalCount} critical, ${warningCount} warning`,
    blocks,
    unfurl_links: false,
  });
}

// ---------------------------------------------------------------------------
// All Clear
// ---------------------------------------------------------------------------

function formatAllClearBlocks(): SlackBlock[] {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `DM Campaign daily digest — ${today}`, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: ':white_check_mark: *All clear* — no active alerts today.' },
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: ':bar_chart: <https://metrics-hub.8020rei.com/features/features-rei/dm-campaign/operational-health|View in Metrics Hub>',
      }],
    },
  ];
}

// ---------------------------------------------------------------------------
// Alert State Persistence
// ---------------------------------------------------------------------------

interface AlertStateEntry {
  id: string;
  severity: string;
  metricCurrent?: number;
  entity?: string;
}

const STATE_FILE = path.join('/tmp', 'rr-alert-daily-state.json');

function loadAlertState(): AlertStateEntry[] {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      const today = new Date().toISOString().slice(0, 10);
      if (raw.date !== today && Array.isArray(raw.alerts)) {
        return raw.alerts;
      }
      if (raw.previousAlerts && Array.isArray(raw.previousAlerts)) {
        return raw.previousAlerts;
      }
    }
  } catch { /* ignore */ }
  return [];
}

function saveAlertState(alerts: RrAlert[]): void {
  const today = new Date().toISOString().slice(0, 10);
  const state: AlertStateEntry[] = alerts.map(a => ({
    id: a.id,
    severity: a.severity,
    metricCurrent: a.metrics?.current,
    entity: a.entity,
  }));

  let previousAlerts: AlertStateEntry[] = [];
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (raw.date !== today && Array.isArray(raw.alerts)) {
        previousAlerts = raw.alerts;
      } else if (Array.isArray(raw.previousAlerts)) {
        previousAlerts = raw.previousAlerts;
      }
    }
  } catch { /* ignore */ }

  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ date: today, alerts: state, previousAlerts }));
  } catch (err) {
    console.warn('[Slack Digest] Could not write state file:', err);
  }
}

// ---------------------------------------------------------------------------
// Alert fetching (same queries as the main alerts endpoint)
// ---------------------------------------------------------------------------

async function fetchCurrentAlerts(): Promise<RrAlert[]> {
  const days = 30;
  const [pulseRows, qualityRows, pcmRows, todayRows, onHold7dAgoRows] = await Promise.all([
    runAuroraQuery(`
      SELECT DISTINCT ON (domain, campaign_id)
        campaign_id, campaign_name, domain, status, on_hold_count, snapshot_at
      FROM rr_campaign_snapshots
      WHERE ${EXCLUDE_SEED}
      ORDER BY domain, campaign_id, snapshot_at DESC
    `),
    runAuroraQuery(`
      SELECT
        COALESCE(SUM(sends_total), 0) as sends_total,
        COALESCE(SUM(sends_error), 0) as sends_error,
        COALESCE(AVG(delivery_rate_30d), 0) as avg_delivery_rate,
        COALESCE(AVG(pcm_submission_rate), 0) as avg_pcm_rate
      FROM rr_daily_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      AND ${EXCLUDE_SEED}
    `),
    runAuroraQuery(`
      SELECT DISTINCT ON (domain)
        domain, stale_sent_count, orphaned_orders_count, oldest_stale_days,
        delivery_lag_median_days, back_office_sync_gap, undeliverable_rate_7d, checked_at
      FROM rr_pcm_alignment
      WHERE ${EXCLUDE_SEED}
      ORDER BY domain, checked_at DESC
    `),
    runAuroraQuery(`
      SELECT COALESCE(SUM(sends_total), 0) as sends_today
      FROM rr_daily_metrics
      WHERE date = CURRENT_DATE AND ${EXCLUDE_SEED}
    `),
    // On-hold 9-day comparison: get the total on-hold from ~9 days ago to detect timer effect
    // Uses 9 days (not 7) to give a 2-day buffer after the monolith's 7-day auto-conversion window
    runAuroraQuery(`
      WITH latest_per_campaign AS (
        SELECT DISTINCT ON (domain, campaign_id)
          domain, campaign_id, on_hold_count
        FROM rr_campaign_snapshots
        WHERE ${EXCLUDE_SEED}
          AND snapshot_at::date = (
            SELECT MAX(snapshot_at::date) FROM rr_campaign_snapshots
            WHERE snapshot_at::date <= CURRENT_DATE - INTERVAL '9 days'
          )
        ORDER BY domain, campaign_id, snapshot_at DESC
      )
      SELECT COALESCE(SUM(on_hold_count), 0) as on_hold_9d_ago
      FROM latest_per_campaign
    `),
  ]);

  const alerts: RrAlert[] = [];
  const now = new Date().toISOString();

  const activeCampaigns = pulseRows.filter((r: Record<string, unknown>) => r.status === 'active');
  const sendsToday = Number(todayRows[0]?.sends_today || 0);
  const q = qualityRows[0] || {};

  const totalStale = pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.stale_sent_count || 0), 0);
  const totalOrphaned = pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.orphaned_orders_count || 0), 0);

  // No sends
  if (activeCampaigns.length > 0 && sendsToday === 0) {
    const details = activeCampaigns
      .map((r: Record<string, unknown>) => `${String(r.campaign_name || 'Unnamed')} (${String(r.domain || 'unknown')})`)
      .join(', ');
    alerts.push({
      id: 'rr-no-sends',
      name: 'No sends detected',
      severity: 'critical',
      category: 'rapid-response',
      description: `${activeCampaigns.length} campaigns are active but zero sends today. Affected: ${details}.`,
      entity: details,
      metrics: { current: sendsToday, baseline: activeCampaigns.length },
      detected_at: now,
      action: 'Check the dispatch job logs and verify the cron is running.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // PCM stale
  if (totalStale > 0) {
    const breakdown = pcmRows
      .filter((r: Record<string, unknown>) => Number(r.stale_sent_count || 0) > 0)
      .map((r: Record<string, unknown>) => `${String(r.domain || 'unknown')}: ${r.stale_sent_count} stale (oldest: ${r.oldest_stale_days}d)`)
      .join('; ');
    alerts.push({
      id: 'rr-pcm-stale',
      name: 'PCM pipeline stale',
      severity: 'critical',
      category: 'rapid-response',
      description: `${totalStale} mailings stuck in "sent" for 14+ days. ${breakdown}.`,
      metrics: { current: totalStale },
      detected_at: now,
      action: 'Investigate the back-office PCM bridge for affected clients.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // Orphaned orders
  if (totalOrphaned > 0) {
    const breakdown = pcmRows
      .filter((r: Record<string, unknown>) => Number(r.orphaned_orders_count || 0) > 0)
      .map((r: Record<string, unknown>) => `${String(r.domain || 'unknown')}: ${r.orphaned_orders_count} orphaned`)
      .join('; ');
    alerts.push({
      id: 'rr-orphaned-orders',
      name: 'Orphaned orders',
      severity: 'critical',
      category: 'rapid-response',
      description: `${totalOrphaned} mailings without PCM order ID. ${breakdown}.`,
      metrics: { current: totalOrphaned },
      detected_at: now,
      action: 'Check PCM API responses for affected clients.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // Delivery rate
  const deliveryRate = Number(q.avg_delivery_rate || 0);
  if (deliveryRate > 0 && deliveryRate < 70) {
    alerts.push({
      id: 'rr-delivery-rate',
      name: 'Delivery rate below threshold',
      severity: 'warning',
      category: 'rapid-response',
      description: `30-day delivery rate is ${deliveryRate.toFixed(1)}%, below the 70% threshold.`,
      metrics: { current: Math.round(deliveryRate * 10) / 10, baseline: 70 },
      detected_at: now,
      action: 'Review undeliverable addresses and PCM rejection reasons.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // On-hold — use the shared queryOnHoldAges helper so this alert tells the SAME
  // stale/fresh story as the Is-it-running pulse + Campaigns table badges. Zero
  // drift risk: one query, one threshold, one vocabulary.
  const ON_HOLD_WARNING = 50;
  const ON_HOLD_CRITICAL = 500;
  const onHoldAges = await queryOnHoldAges();
  const totalOnHold = onHoldAges.totalOnHold;
  if (totalOnHold >= ON_HOLD_WARNING) {
    const hasCritical = totalOnHold >= ON_HOLD_CRITICAL || onHoldAges.staleOnHold > 0;
    const staleCampaigns = onHoldAges.perCampaign.filter(c => c.ageBucket === 'stale');
    const freshCampaigns = onHoldAges.perCampaign.filter(c => c.ageBucket === 'fresh');
    const staleLines = staleCampaigns
      .slice(0, 5)
      .map(c => `${c.campaignName} (${c.domain}): ${c.currentHold.toLocaleString('en-US')} (${c.daysSinceFirstHold}d)`)
      .join('; ');
    const freshLines = freshCampaigns
      .slice(0, 3)
      .map(c => `${c.campaignName} (${c.domain}): ${c.currentHold.toLocaleString('en-US')}`)
      .join('; ');
    const entity = [...new Set(onHoldAges.perCampaign.map(c => c.domain))].join(', ');
    alerts.push({
      id: 'rr-on-hold',
      name: onHoldAges.staleOnHold > 0
        ? 'Mailings on hold — stale pieces overdue for auto-delivery'
        : 'Mailings on hold',
      severity: hasCritical ? 'critical' : 'warning',
      category: 'rapid-response',
      description:
        `${totalOnHold.toLocaleString('en-US')} mailings on hold across ${onHoldAges.campaignsWithHold} campaign${onHoldAges.campaignsWithHold > 1 ? 's' : ''}. ` +
        `${onHoldAges.staleOnHold.toLocaleString('en-US')} are stale (≥ ${ON_HOLD_STALE_THRESHOLD_DAYS}d — overdue for the monolith's auto-delivery timer to convert to 'undelivered') across ${onHoldAges.staleCampaigns} campaigns. ` +
        `${onHoldAges.freshOnHold.toLocaleString('en-US')} are fresh (< ${ON_HOLD_STALE_THRESHOLD_DAYS}d — within normal window). ` +
        `Oldest piece: ${onHoldAges.oldestAgeDays}d.` +
        (staleLines ? ` Stale campaigns: ${staleLines}.` : '') +
        (freshLines ? ` Fresh campaigns: ${freshLines}.` : ''),
      entity,
      metrics: { current: totalOnHold, baseline: ON_HOLD_WARNING, change_pct: onHoldAges.staleOnHold },
      detected_at: now,
      action: onHoldAges.staleOnHold > 0
        ? 'Two actions: (1) for STALE pieces — escalate to monolith team to confirm handleOnHoldRapidResponses is being dispatched (no Kernel.php schedule entry; runs only on client payment). (2) for FRESH pieces — contact affected clients to recharge their ChargeOver balance so the timer moves pieces forward.'
        : 'Contact affected clients: their campaigns are active but mailings are paused due to insufficient balance. They need to recharge to resume sending.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // On-hold 9-day auto-delivery timer health
  // The monolith converts on-hold mailings to "undelivered" after 7 days.
  // This alert uses a 9-day lookback (7 days + 2-day buffer) to detect
  // whether the timer is working. Fix deployed by Christian on April 15, 2026.
  //
  // IMPORTANT: the "active" (info) and "broken" (critical) branches use
  // DISTINCT alert ids so persistent-alert tracking can't display a stale
  // "timer active" title when the actual state has flipped to "broken".
  // Prior version reused `rr-on-hold-timer` across branches, which caused
  // the Slack digest to keep the outdated "active" name after the state
  // flipped to critical.
  const onHold9dAgo = Number(onHold7dAgoRows[0]?.on_hold_9d_ago || 0);
  if (onHold9dAgo > 0 || totalOnHold > 0) {
    const reduction = onHold9dAgo - totalOnHold;
    const reductionPct = onHold9dAgo > 0 ? Math.round((reduction / onHold9dAgo) * 100) : 0;

    if (reduction > 100) {
      // Significant drop — the 7-day timer is working
      alerts.push({
        id: 'rr-on-hold-timer-active',
        name: 'On-hold 7-day auto-delivery timer active',
        severity: 'info',
        category: 'rapid-response',
        description: `On-hold count dropped by ${reduction.toLocaleString('en-US')} (${reductionPct}%) over the last 9 days — from ${onHold9dAgo.toLocaleString('en-US')} to ${totalOnHold.toLocaleString('en-US')}. The 7-day auto-delivery timer is converting stale on-hold mailings to undelivered as expected.`,
        metrics: { current: totalOnHold, baseline: onHold9dAgo, change_pct: -reductionPct },
        detected_at: now,
        action: 'No action needed. The auto-delivery timer is functioning correctly.',
        link: '/features/features-rei/dm-campaign/operational-health',
      });
    } else if (onHold9dAgo > 500 && reduction <= 0) {
      // On-hold has been high for 9+ days and hasn't dropped — timer likely broken
      const increase = totalOnHold - onHold9dAgo;
      alerts.push({
        id: 'rr-on-hold-timer-broken',
        name: 'On-hold 7-day timer not converting stale pieces',
        severity: 'critical',
        category: 'rapid-response',
        description: `On-hold count has not decreased in 9 days — was ${onHold9dAgo.toLocaleString('en-US')}, now ${totalOnHold.toLocaleString('en-US')}${increase > 0 ? ` (+${increase.toLocaleString('en-US')})` : ''}. The 7-day auto-delivery timer should be converting stale on-hold mailings to undelivered, but no reduction is detected after 9 days. Monolith's handleOnHoldRapidResponses() only runs on client payment (ConfirmPayChargeOverJob) — app/Console/Kernel.php has no schedule entry so stale pieces accumulate until a recharge.`,
        metrics: { current: totalOnHold, baseline: onHold9dAgo, change_pct: increase > 0 ? Math.round((increase / onHold9dAgo) * 100) : 0 },
        detected_at: now,
        action: 'Report to Christian/Johan (monolith): add a scheduled cron in Kernel.php calling handleOnHoldRapidResponses(). See On-hold age breakdown widget for the offending campaigns.',
        link: '/features/features-rei/dm-campaign/operational-health',
      });
    }
  }

  // PCM submission rate
  const pcmRate = Number(q.avg_pcm_rate || 0);
  if (pcmRate > 0 && pcmRate < 95) {
    alerts.push({
      id: 'rr-pcm-rate',
      name: 'PCM submission rate low',
      severity: 'warning',
      category: 'rapid-response',
      description: `PCM submission rate is ${pcmRate.toFixed(1)}%, below the 95% threshold.`,
      metrics: { current: Math.round(pcmRate * 10) / 10, baseline: 95 },
      detected_at: now,
      action: 'Review PCM API error logs for systematic rejection patterns.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // ─── Price change detection ─────────────────────────────────
  // Detects rate changes > $0.005 in the last 7 days from dm_volume_summary
  try {
    const rateChangeRows = await runAuroraQuery(`
      WITH daily_rates AS (
        SELECT
          date, mail_class,
          ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 4) as effective_rate
        FROM dm_volume_summary
        WHERE mail_class IN ('standard', 'first_class')
          AND daily_sends > 0
          AND date >= CURRENT_DATE - INTERVAL '7 days'
          AND ${EXCLUDE_SEED}
        GROUP BY date, mail_class
        ORDER BY mail_class, date
      ),
      changes AS (
        SELECT date, mail_class, effective_rate,
          LAG(effective_rate) OVER (PARTITION BY mail_class ORDER BY date) as prev_rate
        FROM daily_rates
      )
      SELECT date, mail_class, effective_rate, prev_rate
      FROM changes
      WHERE prev_rate IS NOT NULL AND ABS(effective_rate - prev_rate) > 0.005
      ORDER BY date DESC LIMIT 5
    `);

    for (const row of rateChangeRows) {
      const mailClassLabel = row.mail_class === 'standard' ? 'Standard' : 'First Class';
      const newRate = Number(row.effective_rate);
      const oldRate = Number(row.prev_rate);
      const direction = newRate > oldRate ? 'increased' : 'decreased';
      const changeDate = String(row.date).slice(0, 10);

      alerts.push({
        id: `rr-price-change-${row.mail_class}-${changeDate}`,
        name: `Customer ${mailClassLabel} rate ${direction}`,
        severity: 'warning',
        category: 'rapid-response',
        description: `Customer ${mailClassLabel} rate ${direction} from $${oldRate.toFixed(4)} to $${newRate.toFixed(4)} on ${changeDate} — this is what 8020REI charges clients, detected live from dm_volume_summary. PCM vendor rate is unchanged (contract-based). Review margin impact in PCM & Profitability.`,
        metrics: { current: newRate, baseline: oldRate },
        detected_at: now,
        action: 'Check the Customer rate change detected callout on Pricing overview, or the Price change detection widget for full rollout progress.',
        link: '/features/features-rei/dm-campaign/pcm-validation',
      });
    }
  } catch {
    // dm_volume_summary mail_class column may not exist yet — silently skip
  }

  // PCM vendor-rate drift detection.
  // If PCM changes their contract rate (they charge us more per piece), our
  // pcm-pricing-eras.ts file goes stale and every margin calc silently
  // under- or over-states. This detector samples recent PCM /order activity,
  // computes the actual average invoice rate per mail class over the last
  // 30 days, and compares to the expected era rate. If the delta is large
  // enough that it changes margin by > $0.01/piece, fire an alert.
  try {
    const pcmAlerts = detectPcmVendorRateDrift();
    alerts.push(...pcmAlerts);
  } catch (err) {
    console.error('[slack-alerts] PCM vendor-rate drift probe failed:', err);
  }

  // Campaign / client lifecycle alerts — "went inactive in the last N days".
  // Identical detection is also used by the CS (business) digest so both
  // channels see the same events with the same IDs (→ same new/persistent
  // classification in both digests).
  try {
    const lifecycleAlerts = await buildLifecycleAlerts(now);
    alerts.push(...lifecycleAlerts);
  } catch (err) {
    console.error('[slack-alerts] Lifecycle alerts probe failed:', err);
  }

  return alerts;
}

/**
 * Build "campaign went inactive" + "client went inactive" alerts from the
 * shared campaign-lifecycle helper. Window of 7 days so events stay in the
 * digest as `new` → `persistent` long enough to cover weekends + be actionable.
 * Alert IDs are stable across the window so the digest's new-vs-persistent
 * logic handles day-over-day classification.
 */
async function buildLifecycleAlerts(now: string): Promise<RrAlert[]> {
  const LIFECYCLE_WINDOW_DAYS = 7;
  const [stops, deactivations] = await Promise.all([
    queryRecentCampaignStops(LIFECYCLE_WINDOW_DAYS),
    queryRecentClientDeactivations(LIFECYCLE_WINDOW_DAYS),
  ]);

  const out: RrAlert[] = [];

  for (const evt of stops) {
    const stoppedDate = evt.stoppedAt.slice(0, 10);
    const lastSentLine = evt.lastSentDate
      ? ` Last mail sent: ${evt.lastSentDate.slice(0, 10)}.`
      : '';
    out.push({
      id: `rr-campaign-stopped:${evt.domain}:${evt.campaignId}`,
      name: 'Campaign went inactive',
      severity: 'warning',
      category: 'rapid-response',
      description: `Campaign *${evt.campaignName}* (${evt.domain}) transitioned from active → ${evt.finalStatus} on ${stoppedDate}.${lastSentLine}`,
      entity: `${evt.domain} / ${evt.campaignName}`,
      detected_at: evt.stoppedAt || now,
      action: 'Confirm with the client if this was intentional; if not, re-enable in the platform. Reach out to understand why.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  for (const evt of deactivations) {
    const deactivatedDate = evt.deactivatedAt.slice(0, 10);
    out.push({
      id: `rr-client-inactive:${evt.domain}`,
      name: 'Client went inactive',
      severity: 'critical',
      category: 'rapid-response',
      description: `${evt.domain} now has zero active campaigns (${evt.totalCampaigns} total, all non-active). Most recent flip: *${evt.lastCampaign.campaignName}* → ${evt.lastCampaign.finalStatus} on ${deactivatedDate}.`,
      entity: evt.domain,
      metrics: { current: 0, baseline: evt.totalCampaigns },
      detected_at: evt.deactivatedAt || now,
      action: 'Contact the client to understand why they stopped. Candidate for CS outreach / churn risk review.',
      link: '/features/features-rei/dm-campaign/business-results',
    });
  }

  return out;
}

/**
 * PCM vendor-rate staleness reminder.
 *
 * Why this can't be a hard "drift detector": verified via live probe on
 * 2026-04-20, the PCM API exposes `/auth/login`, `/order`, `/integration/balance`,
 * `/design` only. No `/invoice`, `/billing`, `/statement`, `/reports`, `/pricing`
 * endpoint exists. Per-order records return no cost/rate field either — just
 * orderID, mailClass, orderDate, status. PCM's monthly invoice PDFs live
 * outside the API. So we cannot programmatically verify that our hardcoded
 * era rates still match what PCM is charging.
 *
 * What we CAN do: make the human control visible. The advisory fires on every
 * Slack digest with the current era rates + how many days since pcm-pricing-eras.ts
 * was last modified (a proxy for "last verified"). After 60 days, severity escalates
 * from info → warning. This is the closest thing to automation until PCM exposes
 * a billing endpoint.
 *
 * Threshold for escalation: 60 days. Camilo's note in pcm-pricing-eras.ts:
 *   "PCM invoice rates change only when the vendor contract changes (quarterly
 *    at most)"
 * so 60 days without a touch is a reasonable review nudge — not an alarm.
 */
function detectPcmVendorRateDrift(): RrAlert[] {
  const cached = getCachedPcmOrdersSlim();
  if (!cached || cached.length === 0) return [];

  // Filter to last 30 days of non-canceled production orders.
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString().slice(0, 10);

  const recent = cached.filter((o: PcmOrderSlim) =>
    !o.canceled && !o.isTestDomain && o.date >= thirtyDaysAgoISO
  );
  if (recent.length < 50) {
    // Too few samples — statistical noise dominates. No alert.
    return [];
  }

  const expected = currentPcmRates();

  // Read the era file's last-modified date as a proxy for "last verified".
  // Commits to pcm-pricing-eras.ts only happen when a human reviews PCM
  // invoices and decides a rate has changed. If the file hasn't been touched
  // in 60+ days, nudge the human to re-verify.
  let daysSinceVerified: number | null = null;
  try {
    const eraFilePath = path.resolve(process.cwd(), 'src/lib/pcm-pricing-eras.ts');
    const stat = fs.statSync(eraFilePath);
    const ageMs = Date.now() - stat.mtimeMs;
    daysSinceVerified = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  } catch {
    // In the Cloud Run bundle, src/ may not be readable at runtime. Silently
    // skip the freshness signal — the advisory still fires with current rates.
  }

  const STALE_WARN_DAYS = 60;
  const isStale = daysSinceVerified !== null && daysSinceVerified >= STALE_WARN_DAYS;
  const freshnessLine = daysSinceVerified !== null
    ? ` Era schedule last verified: ${daysSinceVerified}d ago${isStale ? ' — overdue for review' : ''}.`
    : '';

  return [
    {
      id: 'pcm-vendor-rate-drift-advisory',
      name: isStale
        ? 'PCM vendor-rate schedule overdue for review'
        : 'PCM vendor-rate drift monitoring — partial coverage',
      severity: isStale ? 'warning' : 'info',
      category: 'rapid-response',
      description:
        `Expected PCM vendor rates (from src/lib/pcm-pricing-eras.ts, Era: ${expected.era.label}): ` +
        `Standard $${expected.std.toFixed(2)}, First Class $${expected.fc.toFixed(2)}. ` +
        `Recent activity: ${recent.length} non-test PCM orders in the last 30 days.` +
        freshnessLine +
        ` Full auto-detection would require a PCM invoice/billing endpoint — verified via live probe that PCM API exposes only /auth/login, /order, /integration/balance, /design. No invoice fields on order records. ` +
        `Interim safeguard: any change to pcm-pricing-eras.ts requires a commit, so every era update is reviewed.`,
      metrics: { current: expected.std, baseline: expected.std, change_pct: daysSinceVerified ?? 0 },
      detected_at: new Date().toISOString(),
      action: isStale
        ? `pcm-pricing-eras.ts was last updated ${daysSinceVerified}d ago (threshold ${STALE_WARN_DAYS}d). Ask PCM for the latest invoice PDF, verify Std/FC per-piece rates against the era schedule, and commit an update to src/lib/pcm-pricing-eras.ts if needed — OR commit a no-op comment bump to reset the freshness clock if rates are confirmed unchanged.`
        : 'No action needed this week. When PCM sends a new contract/invoice, verify the rates against pcm-pricing-eras.ts. A stronger reminder fires after 60d without an era-file touch.',
      link: '/features/features-rei/dm-campaign/pcm-validation',
    },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('en-US');
  return n.toFixed(1);
}
