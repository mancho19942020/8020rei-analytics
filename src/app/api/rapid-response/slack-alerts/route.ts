/**
 * DM Campaign Daily Digest — Next.js API Route
 *
 * Sends a daily Slack digest to #dm-campaign-alerts with two sections:
 *   1. Persistent alerts — alerts that were active yesterday and are still active today
 *   2. New alerts — alerts that appeared today for the first time
 *
 * State is persisted in /tmp so the system can compare today vs yesterday.
 * On container restart, all alerts appear as "new" once (safe direction).
 *
 * Usage:
 *   POST /api/rapid-response/slack-alerts           — daily digest (persistent + new)
 *   POST /api/rapid-response/slack-alerts?force=true — send ALL current alerts (full detail)
 *
 * Designed to be called Mon-Fri at 9:00 AM EST by Cloud Scheduler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { sendSlackMessage, isSlackConfigured } from '@/lib/slack';
import type { SlackBlock } from '@/lib/slack';
import type { RrAlert } from '@/types/rapid-response';
import fs from 'fs';
import path from 'path';

// Exclude seed domains (same as main route)
const SEED_DOMAINS = "'8020rei_demo', '8020rei_migracion_test'";
const EXCLUDE_SEED = `domain NOT IN (${SEED_DOMAINS})`;

export async function POST(request: NextRequest) {
  if (!isAuroraConfigured()) {
    return NextResponse.json({ success: false, error: 'Aurora not configured' }, { status: 503 });
  }
  if (!isSlackConfigured()) {
    return NextResponse.json({ success: false, error: 'Slack webhook not configured' }, { status: 503 });
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
      // No body or invalid JSON — fall back to local state file
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
        const arrow = diff > 0 ? '\u2191' : '\u2193'; // ↑ or ↓
        delta = `${arrow} was ${formatNum(prevCurrent)}, now ${formatNum(nowCurrent)}`;
      }
      return { alert: a, delta };
    });

    // If no alerts at all, send an "all clear" message
    if (alerts.length === 0) {
      const blocks = formatAllClear();
      await sendSlackMessage({
        text: 'DM Campaign: All clear — no alerts today',
        blocks,
        unfurl_links: false,
      });
      saveAlertState([]);
      return NextResponse.json({ success: true, message: 'All clear — no alerts', sent: 0 });
    }

    // Format the digest
    let blocks: SlackBlock[];
    if (force) {
      // Force mode: send everything with full detail (like the old behavior)
      blocks = formatFullReport(alerts);
    } else {
      blocks = formatDailyDigest(persistentWithDelta, newAlerts, alerts.length);
    }

    const sent = await sendSlackMessage({
      text: `DM Campaign daily digest — ${newAlerts.length} new, ${persistentAlerts.length} persistent`,
      blocks,
      unfurl_links: false,
    });

    if (!sent) {
      return NextResponse.json({ success: false, error: 'Failed to send Slack message' }, { status: 500 });
    }

    // Save today's state for tomorrow's comparison
    saveAlertState(alerts);

    // Build current state for caller to cache (for tomorrow's comparison)
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

// Also support GET for easy browser/cron testing
export async function GET(request: NextRequest) {
  return POST(request);
}

// ---------------------------------------------------------------------------
// Daily Digest Formatting
// ---------------------------------------------------------------------------

const SEVERITY_EMOJI: Record<string, string> = {
  critical: ':red_circle:',
  warning: ':large_yellow_circle:',
  info: ':large_blue_circle:',
};

function formatDailyDigest(
  persistent: { alert: RrAlert; delta: string | null }[],
  newAlerts: RrAlert[],
  totalCount: number,
): SlackBlock[] {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const criticalCount = persistent.filter(p => p.alert.severity === 'critical').length
    + newAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = persistent.filter(p => p.alert.severity === 'warning').length
    + newAlerts.filter(a => a.severity === 'warning').length;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `DM Campaign daily digest — ${today}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          criticalCount > 0 ? `:red_circle: *${criticalCount} critical*` : null,
          warningCount > 0 ? `:large_yellow_circle: *${warningCount} warning*` : null,
          `${totalCount} total active`,
          newAlerts.length > 0 ? `*${newAlerts.length} new*` : null,
          persistent.length > 0 ? `${persistent.length} persistent` : null,
        ].filter(Boolean).join('  ·  '),
      },
    },
  ];

  // Section 1: New alerts (full detail)
  if (newAlerts.length > 0) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':new: *New alerts*',
      },
    });

    for (const alert of newAlerts) {
      const emoji = SEVERITY_EMOJI[alert.severity] || ':white_circle:';
      blocks.push({
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
      });

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
    }
  }

  // Section 2: Persistent alerts (brief reference)
  if (persistent.length > 0) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':repeat: *Persistent alerts* (still active from previous days)',
      },
    });

    const lines = persistent.map(({ alert, delta }) => {
      const emoji = SEVERITY_EMOJI[alert.severity] || ':white_circle:';
      const metricStr = alert.metrics?.current !== undefined
        ? ` — ${formatNum(alert.metrics.current)}`
        : '';
      const deltaStr = delta ? ` (${delta})` : '';
      return `${emoji} *${alert.name}*${metricStr}${deltaStr}`;
    });

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: lines.join('\n'),
      },
    });
  }

  // Footer
  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'context',
    elements: [{
      type: 'mrkdwn',
      text: ':bar_chart: <https://analytics8020-798362859849.us-central1.run.app/features/features-rei/dm-campaign/operational-health|View in Metrics Hub>  ·  Sent automatically Mon–Fri at 9:00 AM EST',
    }],
  });

  return blocks;
}

function formatAllClear(): SlackBlock[] {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `DM Campaign daily digest — ${today}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':white_check_mark: *All clear* — no active alerts today.',
      },
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: ':bar_chart: <https://analytics8020-798362859849.us-central1.run.app/features/features-rei/dm-campaign/operational-health|View in Metrics Hub>  ·  Sent automatically Mon–Fri at 9:00 AM EST',
      }],
    },
  ];
}

/** Full report mode (used with ?force=true) — same as old behavior */
function formatFullReport(alerts: RrAlert[]): SlackBlock[] {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `DM Campaign alerts — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          criticalCount > 0 ? `:red_circle: *${criticalCount} critical*` : null,
          warningCount > 0 ? `:large_yellow_circle: *${warningCount} warning*` : null,
          `(${alerts.length} total alerts active)`,
        ].filter(Boolean).join('  ·  '),
      },
    },
    { type: 'divider' },
  ];

  for (const alert of alerts) {
    const emoji = SEVERITY_EMOJI[alert.severity] || ':white_circle:';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `${emoji} *${alert.name}*`,
          alert.description,
          '',
          `*Recommended action:* ${alert.action}`,
        ].join('\n'),
      },
    });

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

    blocks.push({ type: 'divider' });
  }

  blocks.push({
    type: 'context',
    elements: [{
      type: 'mrkdwn',
      text: ':bar_chart: <https://analytics8020-798362859849.us-central1.run.app/features/features-rei/dm-campaign/operational-health|View in Metrics Hub>',
    }],
  });

  return blocks;
}

// ---------------------------------------------------------------------------
// Alert State Persistence (local file, survives within container instance)
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
      // Return yesterday's state (or the most recent state that's not from today)
      const today = new Date().toISOString().slice(0, 10);
      if (raw.date !== today && Array.isArray(raw.alerts)) {
        return raw.alerts;
      }
      // If today's state was already saved (e.g., force re-run), return previous day's backup
      if (raw.previousAlerts && Array.isArray(raw.previousAlerts)) {
        return raw.previousAlerts;
      }
    }
  } catch {
    // File corrupt or unreadable — no previous state
  }
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

  // Preserve previous day's state as backup
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
    fs.writeFileSync(STATE_FILE, JSON.stringify({
      date: today,
      alerts: state,
      previousAlerts,
    }));
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
      SELECT DISTINCT ON (campaign_id)
        campaign_id, campaign_name, domain, status, on_hold_count, snapshot_at
      FROM rr_campaign_snapshots
      WHERE ${EXCLUDE_SEED}
      ORDER BY campaign_id, snapshot_at DESC
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
      metrics: { current: deliveryRate, baseline: 70 },
      detected_at: now,
      action: 'Review undeliverable addresses and PCM rejection reasons.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // On-hold
  const onHoldDetails: { domain: string; campaign: string; count: number }[] = [];
  pulseRows.forEach((r: Record<string, unknown>) => {
    const hold = Number(r.on_hold_count || 0);
    if (hold > 0) {
      onHoldDetails.push({
        domain: String(r.domain || 'unknown'),
        campaign: String(r.campaign_name || 'Unnamed'),
        count: hold,
      });
    }
  });
  const totalOnHold = onHoldDetails.reduce((s, d) => s + d.count, 0);
  if (totalOnHold > 0) {
    const breakdown = onHoldDetails.map(d => `${d.campaign} (${d.domain}): ${d.count}`).join('; ');
    alerts.push({
      id: 'rr-on-hold',
      name: 'Mailings on hold',
      severity: 'warning',
      category: 'rapid-response',
      description: `${totalOnHold} mailings on hold. ${breakdown}.`,
      metrics: { current: totalOnHold },
      detected_at: now,
      action: 'Check account balances for affected clients.',
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
      metrics: { current: pcmRate, baseline: 95 },
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
