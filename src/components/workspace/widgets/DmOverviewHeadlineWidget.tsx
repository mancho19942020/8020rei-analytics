/**
 * DM Overview — Headline Widget
 *
 * Four metric cards in a flush-body row (DM Campaign → Overview):
 *   Active clients · Lifetime pieces (Aurora+PCM) · Lifetime revenue · Active campaigns
 *
 * The "Lifetime pieces" card visibly surfaces the Aurora-vs-PCM delta (never hide).
 * Each card's footer line names its source table and delta state.
 */

'use client';

import { HeadlineCard } from '@/components/workspace/HeadlineCard';
import type { DmOverviewHeadline } from '@/types/dm-overview';

interface DmOverviewHeadlineWidgetProps {
  data: DmOverviewHeadline | null;
}

function abbreviate(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function currency(num: number): string {
  return `$${abbreviate(num)}`;
}

const ClientsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m3-4a4 4 0 110-8 4 4 0 010 8zm8 0a3 3 0 100-6 3 3 0 000 6z" />
  </svg>
);

const PiecesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const MarginIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const CampaignsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

export function DmOverviewHeadlineWidget({ data }: DmOverviewHeadlineWidgetProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Loading overview…
      </div>
    );
  }

  const adoption = data.adoption;
  const pieces = data.lifetimePieces;
  const margin = data.companyMargin;
  const campaigns = data.activeCampaigns;

  const deltaLabel = pieces.delta === 0
    ? 'Aurora matches PCM'
    : `Aurora: ${abbreviate(pieces.aurora)} · Δ ${pieces.delta > 0 ? '+' : ''}${pieces.delta.toLocaleString()} (${pieces.deltaPct > 0 ? '+' : ''}${pieces.deltaPct}%)`;

  const deltaTone: 'neutral' | 'warning' = Math.abs(pieces.deltaPct) > 0.5 ? 'warning' : 'neutral';

  const marginIsNegative = margin.margin < 0;
  const marginBg = marginIsNegative
    ? 'bg-error-700'
    : margin.marginPct < 5 ? 'bg-alert-700' : 'bg-success-700';
  const marginSub = `${margin.marginPct.toFixed(1)}% · revenue $${abbreviate(margin.clientRevenue)} − PCM-invoice cost $${abbreviate(margin.pcmCostReal + margin.pcmCostTest)}`;

  // Surface monolith drift: PCM-invoice cost vs Aurora-stored cost differ
  // whenever the monolith's parameters.pcm_cost is wrong or incomplete.
  const drift = margin.pcmVsAuroraCostDelta ?? 0;
  const marginInconsistency = Math.abs(drift) >= 50
    ? `Aurora's stored PCM cost is $${Math.abs(drift).toFixed(0)} ${drift > 0 ? 'LESS' : 'MORE'} than PCM's invoice-derived cost. The card above uses the invoice-authoritative value. Root cause: the monolith's parameters.pcm_cost column (what PCM charges 8020REI — NOT the customer-rate column Johansy updated on Apr 16) still uses $0.625/$0.875 rates instead of the invoice-verified $0.63/$0.87 and leaves ~8% of pieces un-tagged.`
    : undefined;

  const piecesInconsistency = Math.abs(pieces.deltaPct) > 5
    ? `Aurora trails PCM by ${Math.abs(pieces.delta).toLocaleString()} pieces (${pieces.deltaPct}%). Expected small delta from in-pipeline pieces; larger gaps suggest sync drift. See OH → "Is it aligned?" for per-domain breakdown.`
    : undefined;

  return (
    <div className="flex w-full h-full flush-cards">
      <HeadlineCard
        label="Active clients"
        hero={`${adoption.activeClients} / ${adoption.totalClients}`}
        sub={`${adoption.adoptionPct.toFixed(1)}% of the portfolio`}
        icon={<ClientsIcon />}
        iconBg="bg-main-700"
        secondaryTone="info"
        sourceNote={adoption.sourceNote}
      />
      <HeadlineCard
        label="Lifetime pieces"
        hero={abbreviate(pieces.pcm)}
        sub={deltaLabel}
        icon={<PiecesIcon />}
        iconBg="bg-accent-1-700"
        secondaryTone={deltaTone}
        sourceNote={pieces.sourceNote}
        inconsistency={piecesInconsistency}
      />
      <HeadlineCard
        label="Company margin"
        hero={currency(margin.margin)}
        sub={marginSub}
        icon={<MarginIcon />}
        iconBg={marginBg}
        secondaryTone={marginIsNegative || marginInconsistency ? 'warning' : 'info'}
        sourceNote={margin.sourceNote}
        inconsistency={marginInconsistency}
      />
      <HeadlineCard
        label="Active campaigns"
        hero={`${campaigns.active} / ${campaigns.total}`}
        sub={`${campaigns.total - campaigns.active} inactive in portfolio`}
        icon={<CampaignsIcon />}
        iconBg="bg-accent-2-700"
        secondaryTone="info"
        sourceNote={campaigns.sourceNote}
      />
    </div>
  );
}
