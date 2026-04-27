/**
 * PCM Alignment → Slack.
 *
 * Two alert flows:
 *   1. Tier transitions — fired inline from the reconciler when a widget's
 *      severity crosses into or out of 'red'. Deliberately NOT on every cycle;
 *      alert fatigue kills signal-to-noise.
 *   2. Daily digest — fired 09:00 EST by a separate cron; summarises
 *      everything still red as of that morning.
 *
 * Uses the existing lib/slack.ts primitives. Falls back silently when Slack
 * isn't configured (e.g. local dev) — logs a console line and returns 0.
 */

import { sendSlackMessage, isSlackConfigured } from '@/lib/slack';
import type { AlignmentDoc } from '@/types/pcm-alignment';

export interface Transition {
  current: AlignmentDoc;
  previous: AlignmentDoc | null;
  kind: 'entered-red' | 'left-red' | 'entered-yellow' | 'recovered-to-green';
}

/**
 * Classify what happened to a single (widget × sub × campaign_type) between
 * the previous run and the current run. Returns null if no interesting change.
 *
 * We only care about transitions *involving red* — yellow↔green flicker is
 * not signal enough to ping humans.
 */
export function classifyTransition(
  current: AlignmentDoc,
  previous: AlignmentDoc | null,
): Transition | null {
  const prev = previous?.severity ?? null;
  const curr = current.severity;

  if (prev === curr) return null;

  if (curr === 'red' && prev !== 'red') {
    return { current, previous, kind: 'entered-red' };
  }
  if (prev === 'red' && curr !== 'red') {
    return { current, previous, kind: prev && curr === 'green' ? 'recovered-to-green' : 'left-red' };
  }
  // Entering yellow from green — quiet signal, skip. Users will see it in the
  // widget tag and the daily digest if it persists.
  return null;
}

/** Fire individual Slack messages for each red-involved transition. */
export async function fireTransitionAlerts(transitions: Transition[]): Promise<number> {
  if (transitions.length === 0) return 0;
  if (!isSlackConfigured()) {
    console.log(`[pcm-alignment/slack] Slack not configured, skipping ${transitions.length} transition alerts`);
    return 0;
  }

  let sent = 0;
  for (const t of transitions) {
    const payload = buildTransitionMessage(t);
    try {
      const ts = await sendSlackMessage(payload);
      if (ts) sent++;
    } catch (e) {
      console.error('[pcm-alignment/slack] transition alert failed', e);
    }
  }
  return sent;
}

function buildTransitionMessage(t: Transition) {
  const { current, kind } = t;
  const label = describeMetric(current);
  const emoji = kind === 'entered-red' ? '🔴' : kind === 'left-red' ? '🟡' : kind === 'recovered-to-green' ? '✅' : '🟡';
  const action = kind === 'entered-red'
    ? 'Drift exceeds tolerance and was just detected.'
    : kind === 'recovered-to-green'
      ? 'Back within tolerance. No action needed.'
      : 'Severity improved but still flagged for follow-up.';

  const deltaLine = current.delta_pct !== null
    ? `Δ ${current.delta_pct > 0 ? '+' : ''}${current.delta_pct.toFixed(1)}%`
    : 'no numerical comparison (Aurora-only metric)';

  const ownerLine = current.autocorrect_action === 'flag-monolith'
    ? '*Owner:* monolith team (upstream ETL). Hub does not write to this source.'
    : current.autocorrect_action === 'refresh-cache'
      ? '*Owner:* hub. Cache refresh triggered automatically — next cycle should resolve.'
      : '*Owner:* reference data; manual review required.';

  const text = `${emoji} ${label} — ${kind.replace(/-/g, ' ')}`;

  return {
    text,
    blocks: [
      {
        type: 'header' as const,
        text: { type: 'plain_text' as const, text: `${emoji} ${label}`, emoji: true },
      },
      {
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: [
            `*Status:* ${kind.replace(/-/g, ' ')} — ${action}`,
            `*Hub value:* ${fmt(current.hub_value)}  ·  *PCM value:* ${fmt(current.pcm_value)}  ·  ${deltaLine}`,
            ownerLine,
          ].join('\n'),
        },
      },
      {
        type: 'context' as const,
        elements: [
          { type: 'mrkdwn' as const, text: `widget_key: \`${current.widget_key}\`${current.sub_key ? ` · sub: \`${current.sub_key}\`` : ''} · run: \`${current.run_id}\`` },
        ],
      },
    ],
  };
}

/** Daily morning digest: one message listing every widget still at yellow/red. */
export async function fireDailyDigest(currentlyAlerting: AlignmentDoc[]): Promise<boolean> {
  if (!isSlackConfigured()) {
    console.log('[pcm-alignment/slack] Slack not configured, skipping daily digest');
    return false;
  }

  if (currentlyAlerting.length === 0) {
    // Morning report of a clean board is optional — send a quiet "all green"
    // so the team knows the reconciler ran.
    await sendSlackMessage({
      text: '✅ PCM alignment daily digest — all green',
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: '✅ Metrics Hub ↔ PCM — all aligned', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: 'Every widget on the DM Campaign tabs is within tolerance of PCM. Reconciler runs on a ~30-min schedule (best-effort).' } },
      ],
    });
    return true;
  }

  const reds = currentlyAlerting.filter((d) => d.severity === 'red');
  const yellows = currentlyAlerting.filter((d) => d.severity === 'yellow');

  const lines: string[] = [];
  if (reds.length > 0) {
    lines.push(`*🔴 ${reds.length} red metric${reds.length > 1 ? 's' : ''}*`);
    for (const d of reds.slice(0, 10)) {
      lines.push(`• ${describeMetric(d)} — Hub ${fmt(d.hub_value)} vs PCM ${fmt(d.pcm_value)}${d.delta_pct !== null ? ` (Δ ${d.delta_pct > 0 ? '+' : ''}${d.delta_pct.toFixed(1)}%)` : ''}`);
    }
    if (reds.length > 10) lines.push(`_…and ${reds.length - 10} more._`);
  }
  if (yellows.length > 0) {
    if (reds.length > 0) lines.push('');
    lines.push(`*🟡 ${yellows.length} yellow drift${yellows.length > 1 ? 's' : ''}*`);
    for (const d of yellows.slice(0, 5)) {
      lines.push(`• ${describeMetric(d)} — Δ ${d.delta_pct !== null ? (d.delta_pct > 0 ? '+' : '') + d.delta_pct.toFixed(1) + '%' : '—'}`);
    }
    if (yellows.length > 5) lines.push(`_…and ${yellows.length - 5} more._`);
  }

  await sendSlackMessage({
    text: `⚠ PCM alignment digest — ${reds.length} red, ${yellows.length} yellow`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `⚠ Metrics Hub ↔ PCM — daily digest`, emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: 'Reconciler runs on a ~30-min schedule (best-effort). Hub-owned caches self-heal; monolith-owned tables require backend action.' }] },
    ],
  });
  return true;
}

function describeMetric(d: AlignmentDoc): string {
  const parts: string[] = [humanize(d.widget_key)];
  if (d.sub_key) parts.push(humanize(d.sub_key));
  if (d.campaign_type !== 'total') parts.push(`[${d.campaign_type}]`);
  return parts.join(' → ');
}

function humanize(key: string): string {
  return key.replace(/[-_.]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmt(v: number | null): string {
  if (v === null) return '—';
  if (Math.abs(v) >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
