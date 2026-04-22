/**
 * Rapid Response — Ops status strip (2026-04-22 rework v2)
 *
 * Compact row of three hero-metric cards using the same visual vocabulary as
 * DM Campaign → Overview → Headline metrics (HeadlineCard component).
 * Replaces the old pill-based "Is it running?" card per Germán's feedback
 * ("the pills look too small / low hierarchy — use the same component as
 * Headline Metrics").
 *
 * Cards: Active campaigns · Letters sent · On hold.
 * "Is it working?" (rr-quality-metrics) and "Is it aligned?" (rr-pcm-health)
 * remain as separate widgets below — Germán kept those as-is.
 */

'use client';

import { HeadlineCard } from '@/components/workspace/HeadlineCard';
import type { RrOperationalPulse, RrQualityMetrics } from '@/types/rapid-response';

interface Props {
  pulse: RrOperationalPulse;
  quality: RrQualityMetrics | null;
}

function abbreviate(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

const CampaignsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

const PiecesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const OnHoldIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export function RrOpsStatusStripWidget({ pulse, quality }: Props) {
  const { activeCampaigns, totalCampaigns, sendsToday, sendsThisMonth, totalOnHold, staleOnHold, freshOnHold, oldestOnHoldDays } = pulse;

  // Active campaigns — color follows health.
  const activeBg =
    activeCampaigns === 0 && totalCampaigns > 0
      ? 'bg-error-700'
      : activeCampaigns > 0
        ? 'bg-success-700'
        : 'bg-main-700';
  const activeSub =
    totalCampaigns > 0
      ? `${totalCampaigns - activeCampaigns} inactive in portfolio`
      : 'No campaigns registered';

  // Letters sent — lifetime from PCM (fallback Aurora) + monthly + today.
  const lifetime = quality?.lifetimePiecesPcm ?? quality?.lifetimeSent ?? 0;
  const lifetimeSource = quality?.lifetimePiecesPcm != null ? 'PCM' : 'Aurora';
  const sentSub = `${abbreviate(sendsThisMonth)} this month · ${sendsToday.toLocaleString()} today`;
  const sentSourceNote = `Lifetime: ${lifetimeSource}-authoritative count (matches Overview → Lifetime pieces). This month: SUM of rr_daily_metrics.sends_total since day 1 of the current month — auto-resets on the 1st. Today: same source, today's date.`;

  // On hold — red if stale > 0, alert if any on-hold but fresh, grey otherwise.
  const onHoldBg =
    staleOnHold > 0
      ? 'bg-error-700'
      : totalOnHold > 0
        ? 'bg-alert-700'
        : 'bg-content-tertiary';
  const onHoldSub =
    totalOnHold === 0
      ? 'None on hold'
      : staleOnHold > 0
        ? `${staleOnHold.toLocaleString()} stale · oldest ${oldestOnHoldDays}d`
        : `All ${freshOnHold.toLocaleString()} fresh (< 7d)`;
  const onHoldSourceNote =
    'Mailings currently paused (usually insufficient client balance). "Stale" = on hold ≥ 7 days — the monolith\'s auto-delivery timer should have converted them to undelivered but hasn\'t. See the Campaigns table for the offending rows.';
  const onHoldInconsistency =
    staleOnHold > 0
      ? `${staleOnHold.toLocaleString()} mailings have been stuck in 'on hold' for 7+ days — overdue for the monolith's auto-delivery timer. Oldest piece: ${oldestOnHoldDays} days. Usually means the client's account balance ran out and no top-up happened, or the timer job isn't running.`
      : undefined;
  const onHoldTone: 'neutral' | 'warning' | 'info' =
    staleOnHold > 0 ? 'warning' : totalOnHold > 0 ? 'info' : 'neutral';

  return (
    <div className="flex w-full h-full flush-cards">
      <HeadlineCard
        label="Active campaigns"
        hero={`${activeCampaigns} / ${totalCampaigns}`}
        sub={activeSub}
        icon={<CampaignsIcon />}
        iconBg={activeBg}
        secondaryTone="info"
        sourceNote="Campaigns with status 'active' in the latest snapshot / total campaigns ever created. Source: rr_campaign_snapshots. Matches DM Campaign → Overview → Active campaigns card exactly."
      />
      <HeadlineCard
        label="Letters sent"
        hero={abbreviate(lifetime)}
        sub={sentSub}
        icon={<PiecesIcon />}
        iconBg="bg-accent-1-700"
        secondaryTone="info"
        sourceNote={sentSourceNote}
      />
      <HeadlineCard
        label="On hold"
        hero={totalOnHold.toLocaleString()}
        sub={onHoldSub}
        icon={<OnHoldIcon />}
        iconBg={onHoldBg}
        secondaryTone={onHoldTone}
        sourceNote={onHoldSourceNote}
        inconsistency={onHoldInconsistency}
      />
    </div>
  );
}
