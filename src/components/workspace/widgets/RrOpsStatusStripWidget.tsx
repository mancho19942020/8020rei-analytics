/**
 * Rapid Response — Ops status strip (2026-04-22 rework v2)
 *
 * Compact row of three hero-metric cards using the same visual vocabulary as
 * DM Campaign → Overview → Headline metrics (HeadlineCard component).
 * Replaces the old pill-based "Is it running?" card per Germán's feedback
 * ("the pills look too small / low hierarchy — use the same component as
 * Headline Metrics").
 *
 * Cards: Active campaigns · Total delivered · On hold.
 * The middle card mirrors DM Campaign → Overview → Total delivered exactly:
 * same label, same hero (dm_client_funnel.total_delivered), same PCM-shipped
 * sub-line, same source note. Two widgets, one number — no cross-tab drift.
 *
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
  const { activeCampaigns, totalCampaigns, totalOnHold } = pulse;

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

  // Total delivered — mirrors DM Campaign → Overview → Total delivered card.
  // Hero reads dm_client_funnel.total_delivered (USPS-confirmed). Sub-line
  // surfaces PCM shipped + the not-yet-delivered gap. Same numbers, same
  // copy, same source-of-truth as the Overview tile — one card, two places.
  const totalDelivered = quality?.lifetimeDelivered ?? 0;
  const pcmShipped = quality?.lifetimePiecesPcm ?? 0;
  const undelivered = Math.max(0, pcmShipped - totalDelivered);
  const deliveredSub = pcmShipped === 0
    ? 'No PCM /order data'
    : `PCM shipped: ${abbreviate(pcmShipped)} · ${abbreviate(undelivered)} not yet delivered`;
  const deliveredRatio = pcmShipped > 0 ? totalDelivered / pcmShipped : 1;
  const deliveredTone: 'neutral' | 'warning' | 'info' = deliveredRatio < 0.85 ? 'warning' : 'info';
  const deliveredSourceNote = 'Hero "Total delivered" = dm_client_funnel.total_delivered (pieces USPS confirmed in a mailbox). PCM /order is shipped pieces (PCM\'s "Total Recipients" — what they handed to USPS, not what USPS landed). Delta = pieces in transit, returned, or undeliverable. Negative delta is expected and informative, not an error. Same number you see on DM Campaign → Overview → Total delivered.';
  const deliveredInconsistency = pcmShipped > 0 && deliveredRatio < 0.85
    ? `Only ${(deliveredRatio * 100).toFixed(1)}% of pieces PCM shipped are confirmed delivered. The rest are in transit, returned, or undeliverable. Larger gap can also mean sync lag — see DM Campaign → Operational Health → "Is it aligned?" for per-domain breakdown.`
    : undefined;

  // On hold — alert tone if there are pieces queued, neutral otherwise.
  // The previous "stale Nd" badge was driven by snapshot-history continuity,
  // not per-piece age, and over-stated the issue once the platform's auto-
  // delivery timer was rotating the queue. Per-piece age (oldest_on_hold_at)
  // arrives with monolith PR #2015; until then, just show the count and
  // direct users to the Campaigns table for last-sent context.
  const onHoldBg = totalOnHold > 0 ? 'bg-alert-700' : 'bg-content-tertiary';
  const onHoldSub =
    totalOnHold === 0
      ? 'None on hold'
      : 'See Campaigns table for last-sent context';
  const onHoldSourceNote =
    'Mailings currently paused (usually insufficient client balance or compliance block). For per-campaign "last sent" context use the Campaigns table below — campaigns whose last_sent_date is far behind today are the ones that have stopped dispatching. Per-piece on-hold age will surface here once monolith PR #2015 ships oldest_on_hold_at.';
  const onHoldTone: 'neutral' | 'warning' | 'info' = totalOnHold > 0 ? 'info' : 'neutral';

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
        label="Total delivered"
        hero={abbreviate(totalDelivered)}
        sub={deliveredSub}
        icon={<PiecesIcon />}
        iconBg="bg-accent-1-700"
        secondaryTone={deliveredTone}
        sourceNote={deliveredSourceNote}
        inconsistency={deliveredInconsistency}
      />
      <HeadlineCard
        label="On hold"
        hero={totalOnHold.toLocaleString()}
        sub={onHoldSub}
        icon={<OnHoldIcon />}
        iconBg={onHoldBg}
        secondaryTone={onHoldTone}
        sourceNote={onHoldSourceNote}
      />
    </div>
  );
}
