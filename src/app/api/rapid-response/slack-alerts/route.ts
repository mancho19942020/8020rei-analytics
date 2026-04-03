/**
 * DM Campaign Slack Alerts — Next.js API Route
 *
 * Checks for current alerts and sends new ones to #dm-campaign-alerts on Slack.
 * Deduplication: tracks sent alert fingerprints in Aurora to avoid repeats.
 *
 * Usage:
 *   POST /api/rapid-response/slack-alerts           — send only NEW alerts
 *   POST /api/rapid-response/slack-alerts?force=true — send ALL current alerts
 *
 * Designed to be called daily by Cloud Scheduler or manually.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { sendSlackMessage, isSlackConfigured } from '@/lib/slack';
import type { SlackBlock } from '@/lib/slack';
import type { RrAlert } from '@/types/rapid-response';
import crypto from 'crypto';
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
    // Fetch current alerts (same queries as the main alerts endpoint)
    const alerts = await fetchCurrentAlerts();

    if (alerts.length === 0) {
      return NextResponse.json({ success: true, message: 'No alerts to send', sent: 0 });
    }

    // Determine which alerts are new
    let alertsToSend: RrAlert[];

    if (force) {
      alertsToSend = alerts;
    } else {
      // Get previously sent fingerprints
      const sentFingerprints = getSentFingerprints();
      alertsToSend = alerts.filter(a => {
        const fp = fingerprint(a);
        return !sentFingerprints.has(fp);
      });
    }

    if (alertsToSend.length === 0) {
      return NextResponse.json({ success: true, message: 'No new alerts since last notification', sent: 0 });
    }

    // Format and send to Slack
    const blocks = formatAlertsForSlack(alertsToSend, alerts.length);
    const sent = await sendSlackMessage({
      text: `DM Campaign: ${alertsToSend.length} alert${alertsToSend.length > 1 ? 's' : ''} detected`,
      blocks,
      unfurl_links: false,
    });

    if (!sent) {
      return NextResponse.json({ success: false, error: 'Failed to send Slack message' }, { status: 500 });
    }

    // Record sent fingerprints so the same alerts aren't sent again today
    recordSentFingerprints(alertsToSend);

    return NextResponse.json({
      success: true,
      message: `Sent ${alertsToSend.length} alert(s) to Slack`,
      sent: alertsToSend.length,
      total: alerts.length,
    });
  } catch (err) {
    console.error('[Slack Alerts] Error:', err);
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
// Alert fetching (simplified version of the main alerts endpoint)
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

  return alerts;
}

// ---------------------------------------------------------------------------
// Slack message formatting
// ---------------------------------------------------------------------------

const SEVERITY_EMOJI: Record<string, string> = {
  critical: ':red_circle:',
  warning: ':large_yellow_circle:',
  info: ':large_blue_circle:',
};

function formatAlertsForSlack(alerts: RrAlert[], totalCount: number): SlackBlock[] {
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
          `(${totalCount} total alerts active)`,
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
      if (alert.metrics.current !== undefined) parts.push(`Current: *${alert.metrics.current}*`);
      if (alert.metrics.baseline !== undefined) parts.push(`Threshold: *${alert.metrics.baseline}*`);
      if (parts.length > 0) {
        blocks.push({
          type: 'context',
          elements: [{ type: 'mrkdwn', text: parts.join('  ·  ') }],
        });
      }
    }

    blocks.push({ type: 'divider' });
  }

  // Footer with link to dashboard
  blocks.push({
    type: 'context',
    elements: [{
      type: 'mrkdwn',
      text: ':bar_chart: <https://8020-metrics-hub-build-611201211946.us-east1.run.app/features/features-rei/dm-campaign/operational-health|View in Metrics Hub>',
    }],
  });

  return blocks;
}

// ---------------------------------------------------------------------------
// Deduplication via local file
// ---------------------------------------------------------------------------
//
// Stores fingerprints of sent alerts in a JSON file.
// Works on Cloud Run (/tmp persists within a container instance) and locally.
// If the container restarts, fingerprints reset — worst case is one re-send,
// not missed alerts. This is the safe direction for an alert system.

const SENT_FILE = path.join('/tmp', 'rr-slack-sent-fingerprints.json');

function fingerprint(alert: RrAlert): string {
  const data = JSON.stringify({
    id: alert.id,
    current: alert.metrics?.current,
    entity: alert.entity,
  });
  return crypto.createHash('md5').update(data).digest('hex');
}

function getSentFingerprints(): Set<string> {
  try {
    if (fs.existsSync(SENT_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SENT_FILE, 'utf-8'));
      // Only use fingerprints from today (reset daily)
      const today = new Date().toISOString().slice(0, 10);
      if (raw.date === today && Array.isArray(raw.fingerprints)) {
        return new Set(raw.fingerprints as string[]);
      }
    }
  } catch {
    // File corrupt or unreadable — start fresh
  }
  return new Set();
}

function recordSentFingerprints(alerts: RrAlert[]): void {
  const existing = getSentFingerprints();
  for (const alert of alerts) {
    existing.add(fingerprint(alert));
  }
  const today = new Date().toISOString().slice(0, 10);
  try {
    fs.writeFileSync(SENT_FILE, JSON.stringify({
      date: today,
      fingerprints: Array.from(existing),
    }));
  } catch (err) {
    console.warn('[Slack Alerts] Could not write fingerprint file:', err);
  }
}
