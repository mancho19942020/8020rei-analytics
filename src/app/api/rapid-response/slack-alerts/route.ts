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

// Exclude seed/test domains — must match the same list used in pcm-validation and rapid-response
const SEED_DOMAINS = "'8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com'";
const EXCLUDE_SEED = `domain NOT IN (${SEED_DOMAINS})`;

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
  const [pulseRows, qualityRows, pcmRows, todayRows] = await Promise.all([
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

  // On-hold — only flag campaigns with 50+ mailings on hold
  const ON_HOLD_WARNING = 50;
  const ON_HOLD_CRITICAL = 500;
  const onHoldDetails: { domain: string; campaign: string; count: number }[] = [];
  pulseRows.forEach((r: Record<string, unknown>) => {
    const hold = Number(r.on_hold_count || 0);
    if (hold >= ON_HOLD_WARNING) {
      onHoldDetails.push({
        domain: String(r.domain || 'unknown'),
        campaign: String(r.campaign_name || 'Unnamed'),
        count: hold,
      });
    }
  });
  onHoldDetails.sort((a, b) => b.count - a.count);
  const totalOnHold = onHoldDetails.reduce((s, d) => s + d.count, 0);
  if (onHoldDetails.length > 0) {
    const hasCritical = onHoldDetails.some(d => d.count >= ON_HOLD_CRITICAL);
    const breakdown = onHoldDetails.map(d => `${d.campaign} (${d.domain}): ${d.count.toLocaleString('en-US')} on hold`).join('; ');
    alerts.push({
      id: 'rr-on-hold',
      name: 'Campaigns with mailings on hold',
      severity: hasCritical ? 'critical' : 'warning',
      category: 'rapid-response',
      description: `${onHoldDetails.length} campaign${onHoldDetails.length > 1 ? 's' : ''} with ${totalOnHold.toLocaleString('en-US')} total mailings on hold — these letters are queued but not sending. Clients may need to recharge their accounts. ${breakdown}.`,
      entity: [...new Set(onHoldDetails.map(d => d.domain))].join(', '),
      metrics: { current: totalOnHold, baseline: ON_HOLD_WARNING },
      detected_at: now,
      action: 'Contact affected clients: their campaigns are active but mailings are paused due to insufficient balance. They need to recharge to resume sending.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
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

  return alerts;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('en-US');
  return n.toFixed(1);
}
