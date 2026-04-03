/**
 * DM Campaign Business Results — Slack Alerts Route
 *
 * Checks for Layer 2 business result alerts and sends new ones to Slack.
 * Deduplication: tracks sent alert fingerprints to avoid repeats.
 *
 * Usage:
 *   POST /api/dm-conversions/slack-alerts           — send only NEW alerts
 *   POST /api/dm-conversions/slack-alerts?force=true — send ALL current alerts
 *
 * Designed to be called daily by Cloud Scheduler or manually.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuroraConfigured } from '@/lib/aurora';
import { sendSlackMessage, isSlackConfigured } from '@/lib/slack';
import type { SlackBlock } from '@/lib/slack';
import type { DmAlert } from '@/types/dm-conversions';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  if (!isAuroraConfigured()) {
    return NextResponse.json({ success: false, error: 'Aurora not configured' }, { status: 503 });
  }
  if (!isSlackConfigured()) {
    return NextResponse.json({ success: false, error: 'Slack webhook not configured' }, { status: 503 });
  }

  const force = request.nextUrl.searchParams.get('force') === 'true';

  try {
    // Fetch current alerts from the DM conversions API
    const baseUrl = request.nextUrl.origin;
    const alertsRes = await fetch(`${baseUrl}/api/dm-conversions?type=alerts`).then(r => r.json());

    if (!alertsRes.success || !alertsRes.data?.alerts) {
      return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 });
    }

    const alerts: DmAlert[] = alertsRes.data.alerts;

    if (alerts.length === 0) {
      return NextResponse.json({ success: true, message: 'No business result alerts to send', sent: 0 });
    }

    let alertsToSend: DmAlert[];

    if (force) {
      alertsToSend = alerts;
    } else {
      const sentFingerprints = getSentFingerprints();
      alertsToSend = alerts.filter(a => {
        const fp = fingerprint(a);
        return !sentFingerprints.has(fp);
      });
    }

    if (alertsToSend.length === 0) {
      return NextResponse.json({ success: true, message: 'No new business result alerts since last notification', sent: 0 });
    }

    const blocks = formatAlertsForSlack(alertsToSend, alerts.length);
    const sent = await sendSlackMessage({
      text: `DM Business Results: ${alertsToSend.length} alert${alertsToSend.length > 1 ? 's' : ''} detected`,
      blocks,
      unfurl_links: false,
    });

    if (!sent) {
      return NextResponse.json({ success: false, error: 'Failed to send Slack message' }, { status: 500 });
    }

    recordSentFingerprints(alertsToSend);

    return NextResponse.json({
      success: true,
      message: `Sent ${alertsToSend.length} business result alert(s) to Slack`,
      sent: alertsToSend.length,
      total: alerts.length,
    });
  } catch (err) {
    console.error('[DM Slack Alerts] Error:', err);
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
// Slack message formatting
// ---------------------------------------------------------------------------

const SEVERITY_EMOJI: Record<string, string> = {
  critical: ':red_circle:',
  warning: ':large_yellow_circle:',
  info: ':large_blue_circle:',
};

function formatAlertsForSlack(alerts: DmAlert[], totalCount: number): SlackBlock[] {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `DM Business Results alerts — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
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

  blocks.push({
    type: 'context',
    elements: [{
      type: 'mrkdwn',
      text: ':bar_chart: <https://8020-metrics-hub-build-611201211946.us-east1.run.app/features/features-rei/dm-campaign/business-results|View in Metrics Hub>',
    }],
  });

  return blocks;
}

// ---------------------------------------------------------------------------
// Deduplication via local file
// ---------------------------------------------------------------------------

const SENT_FILE = path.join('/tmp', 'dm-business-slack-sent-fingerprints.json');

function fingerprint(alert: DmAlert): string {
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

function recordSentFingerprints(alerts: DmAlert[]): void {
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
    console.warn('[DM Slack Alerts] Could not write fingerprint file:', err);
  }
}
