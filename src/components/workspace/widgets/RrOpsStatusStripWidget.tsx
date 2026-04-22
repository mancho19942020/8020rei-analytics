/**
 * Rapid Response — Ops status strip (2026-04-22, Phase 4 of the rework)
 *
 * Compact horizontal strip replacing the old "Is it running?" card.
 * Three stats side-by-side: Active campaigns · Letters sent · On hold.
 *
 * "Is it working?" (rr-quality-metrics) and "Is it aligned?" (rr-pcm-health)
 * stay as separate widgets below — Germán kept them as-is ("It works").
 */

'use client';

import { AxisPill } from '@/components/axis';
import type { RrOperationalPulse, RrQualityMetrics } from '@/types/rapid-response';

interface Props {
  pulse: RrOperationalPulse;
  quality: RrQualityMetrics | null;
}

function formatK(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}K`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function RrOpsStatusStripWidget({ pulse, quality }: Props) {
  const { activeCampaigns, totalCampaigns, sendsToday, sendsThisMonth, totalOnHold, staleOnHold, oldestOnHoldDays } = pulse;

  const activeType: 'good' | 'bad' | 'default' =
    activeCampaigns === 0 && totalCampaigns > 0 ? 'bad' : activeCampaigns > 0 ? 'good' : 'default';

  const onHoldType: 'bad' | 'default' = staleOnHold > 0 ? 'bad' : 'default';

  const lifetime = quality?.lifetimePiecesPcm ?? quality?.lifetimeSent ?? null;

  const onHoldValue =
    totalOnHold === 0
      ? '0'
      : staleOnHold > 0
        ? `${totalOnHold.toLocaleString()} · ${staleOnHold} stale`
        : `${totalOnHold.toLocaleString()}`;

  const onHoldTooltip =
    totalOnHold === 0
      ? 'No mailings on hold.'
      : staleOnHold > 0
        ? `${totalOnHold.toLocaleString()} on hold. ${staleOnHold.toLocaleString()} have been stuck ≥ 7 days (stale — overdue for the monolith\'s auto-delivery timer). Oldest piece: ${oldestOnHoldDays} days. See the Campaigns table for the offending rows.`
        : `${totalOnHold.toLocaleString()} mailings on hold, all within the normal 7-day window (fresh). No pieces overdue.`;

  return (
    <div className="flex items-center gap-3 h-full px-3 overflow-x-auto">
      <AxisPill
        label="Active campaigns"
        value={`${activeCampaigns} / ${totalCampaigns}`}
        type={activeType}
        tooltip="Campaigns with status 'active' in the latest snapshot / total campaigns ever created. Source: rr_campaign_snapshots. Matches DM Campaign → Overview → Active campaigns card."
      />
      <AxisPill
        label="Letters sent"
        value={
          lifetime !== null
            ? `${formatK(lifetime)} lifetime · ${formatK(sendsThisMonth)} this month · ${sendsToday.toLocaleString()} today`
            : `${formatK(sendsThisMonth)} this month · ${sendsToday.toLocaleString()} today`
        }
        tooltip={`Lifetime: PCM-authoritative total (matches Overview → Lifetime pieces). This month: SUM of rr_daily_metrics.sends_total since day 1 of ${new Date().toLocaleString('default', { month: 'long' })}. Today: same source, today's date.`}
      />
      <AxisPill
        label="On hold"
        value={onHoldValue}
        type={onHoldType}
        tooltip={onHoldTooltip}
      />
    </div>
  );
}
