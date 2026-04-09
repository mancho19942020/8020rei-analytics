/**
 * DM Campaign Business Results — Slack Digest Route
 *
 * Sends a daily threaded Slack digest to #dm-business-alerts for the CS team.
 * Alerts focus on campaign performance issues that CS or the client can fix
 * by changing configuration, template, targeting, or strategy.
 *
 * Usage:
 *   POST /api/dm-conversions/business-alerts                — daily digest
 *   POST /api/dm-conversions/business-alerts?force=true     — send ALL alerts with full detail
 *
 * Designed to be called Mon-Fri at 9:00 AM EST by GitHub Actions cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { isAuroraConfigured } from '@/lib/aurora';
import {
  sendSlackMessage,
  sendSlackThreadReply,
  isBusinessAlertsConfigured,
  getBusinessAlertsChannelId,
} from '@/lib/slack';
import type { SlackBlock } from '@/lib/slack';
import type { DmAlert } from '@/types/dm-conversions';
import { getAlertsData } from '../get-alerts-data';
import fs from 'fs';
import path from 'path';

interface AlertStateEntry {
  id: string;
  severity: string;
  metricCurrent?: number;
  entity?: string;
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  if (!isAuroraConfigured()) {
    return NextResponse.json({ success: false, error: 'Aurora not configured' }, { status: 503 });
  }
  if (!isBusinessAlertsConfigured()) {
    return NextResponse.json({ success: false, error: 'Business alerts Slack channel not configured' }, { status: 503 });
  }

  const force = request.nextUrl.searchParams.get('force') === 'true';

  try {
    // Fetch current business alerts directly (no HTTP self-fetch)
    const alertsData = await getAlertsData();
    const alerts: DmAlert[] = alertsData.alerts;

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

    // Classify alerts as new or persistent
    const yesterdayIds = new Set(yesterdayState.map(a => a.id));
    const newAlerts = alerts.filter(a => !yesterdayIds.has(a.id));
    const persistentAlerts = alerts.filter(a => yesterdayIds.has(a.id));

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

    const channelId = getBusinessAlertsChannelId();

    // If no alerts, send "all clear"
    if (alerts.length === 0) {
      await sendSlackMessage({
        text: 'Business results: All clear — no alerts today',
        blocks: formatAllClearBlocks(),
        unfurl_links: false,
      }, channelId);
      saveAlertState([]);
      return NextResponse.json({ success: true, message: 'All clear — no business alerts', sent: 0 });
    }

    // Send threaded digest
    await sendThreadedDigest(newAlerts, persistentWithDelta, alerts.length, force, channelId);

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
      message: `Business results digest sent: ${newAlerts.length} new, ${persistentAlerts.length} persistent`,
      new: newAlerts.length,
      persistent: persistentAlerts.length,
      total: alerts.length,
      currentState,
    });
  } catch (err) {
    console.error('[Business Alerts] Error:', err);
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
// Threaded Digest
// ---------------------------------------------------------------------------

const SEVERITY_EMOJI: Record<string, string> = {
  critical: ':red_circle:',
  warning: ':large_yellow_circle:',
  info: ':large_blue_circle:',
};

async function sendThreadedDigest(
  newAlerts: DmAlert[],
  persistent: { alert: DmAlert; delta: string | null }[],
  totalCount: number,
  force: boolean,
  channelId: string,
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
      text: { type: 'plain_text', text: `Business results digest — ${today}`, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: parts.filter(Boolean).join('  \u00b7  ') },
    },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: ':thread: Details in thread  \u00b7  :bar_chart: <https://metrics-hub.8020rei.com/features/features-rei/dm-campaign/business-results|View in Metrics Hub>',
      }],
    },
  ];

  const threadTs = await sendSlackMessage({
    text: `Business results digest — ${criticalCount} critical, ${warningCount} warning`,
    blocks: summaryBlocks,
    unfurl_links: false,
  }, channelId);

  if (!threadTs || threadTs === 'webhook') return;

  // 2. Post NEW alerts as thread replies (full detail)
  if (newAlerts.length > 0) {
    await sendSlackThreadReply(threadTs, {
      text: `${newAlerts.length} new alert(s)`,
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: ':new: *New alerts*' },
        },
        { type: 'divider' },
        ...newAlerts.flatMap(a => formatAlertBlocks(a)),
      ],
      unfurl_links: false,
    }, channelId);
  }

  // 3. Post PERSISTENT alerts as thread reply
  if (persistent.length > 0) {
    if (force) {
      // Full detail for persistent alerts when forced
      await sendSlackThreadReply(threadTs, {
        text: `${persistent.length} persistent alert(s)`,
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: ':repeat: *Persistent alerts*' },
          },
          { type: 'divider' },
          ...persistent.flatMap(p => formatAlertBlocks(p.alert, p.delta)),
        ],
        unfurl_links: false,
      }, channelId);
    } else {
      // Brief summary for persistent alerts
      const lines = persistent.map(p => {
        const emoji = SEVERITY_EMOJI[p.alert.severity] || ':white_circle:';
        const deltaStr = p.delta ? ` (${p.delta})` : '';
        return `${emoji} ${p.alert.name} — ${p.alert.entity || 'system'}${deltaStr}`;
      });
      await sendSlackThreadReply(threadTs, {
        text: `${persistent.length} persistent alert(s)`,
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `:repeat: *${persistent.length} persistent alert${persistent.length > 1 ? 's' : ''}*\n${lines.join('\n')}` },
          },
        ],
        unfurl_links: false,
      }, channelId);
    }
  }
}

function formatAlertBlocks(alert: DmAlert, delta?: string | null): SlackBlock[] {
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
          `:bulb: *Suggested action:* ${alert.action}`,
        ].join('\n'),
      },
    },
  ];

  const metricParts: string[] = [];
  if (alert.metrics?.current !== undefined) metricParts.push(`Current: *${formatNum(alert.metrics.current)}*`);
  if (alert.metrics?.baseline !== undefined) metricParts.push(`Threshold: *${formatNum(alert.metrics.baseline)}*`);
  if (delta) metricParts.push(delta);
  if (metricParts.length > 0) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: metricParts.join('  \u00b7  ') }],
    });
  }

  blocks.push({ type: 'divider' });
  return blocks;
}

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
      text: { type: 'plain_text', text: `Business results digest — ${today}`, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: ':white_check_mark: *All clear* — no business result alerts today. All campaigns are performing within expected parameters.' },
    },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: ':bar_chart: <https://metrics-hub.8020rei.com/features/features-rei/dm-campaign/business-results|View in Metrics Hub>  \u00b7  Sent automatically Mon\u2013Fri at 9:00 AM EST',
      }],
    },
  ];
}

// ---------------------------------------------------------------------------
// State persistence (local file fallback — primary state via GitHub Actions cache)
// ---------------------------------------------------------------------------

const STATE_FILE = path.join('/tmp', 'business-alerts-daily-state.json');

function loadAlertState(): AlertStateEntry[] {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (Array.isArray(raw.alerts)) {
        return raw.alerts;
      }
    }
  } catch {
    // File corrupt — start fresh
  }
  return [];
}

function saveAlertState(alerts: DmAlert[]): void {
  const state = {
    date: new Date().toISOString().slice(0, 10),
    alerts: alerts.map(a => ({
      id: a.id,
      severity: a.severity,
      metricCurrent: a.metrics?.current,
      entity: a.entity,
    })),
  };
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.warn('[Business Alerts] Could not write state file:', err);
  }
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toFixed(1);
}
