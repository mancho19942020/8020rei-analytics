/**
 * PCM Margin Summary Widget
 *
 * MetricCard row showing: Total revenue | Total PCM cost | Gross margin | Margin %
 * Data source: dm_client_funnel (total_cost, total_pcm_cost, margin, margin_pct)
 */

'use client';

import { MetricCard } from '@/components/workspace/MetricCard';
import type { ProfitabilitySummary } from '@/types/pcm-validation';

interface PcmMarginSummaryWidgetProps {
  data: ProfitabilitySummary | null;
}

const RevenueIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CostIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
);

const MarginIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const PercentIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
  </svg>
);

export function PcmMarginSummaryWidget({ data }: PcmMarginSummaryWidgetProps) {
  if (!data || !data.dataAvailable) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Profitability data pending — awaiting PCM pagination
      </div>
    );
  }

  const marginIsNegative = data.grossMargin < 0;
  const marginPctDisplay = `${data.marginPercent.toFixed(1)}%`;
  const pcmDelta = data.reconciliation?.pcmVsAuroraCostDelta ?? 0;
  const hasAuroraDrift = Math.abs(pcmDelta) >= 1;

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex w-full flex-1 flush-cards">
        <MetricCard
          label="Total revenue"
          value={data.totalRevenue}
          icon={<RevenueIcon />}
          iconBgClass="bg-main-700"
          format="currency"
          subtitle={`$${data.revenuePerPiece.toFixed(4)}/piece across ${data.totalSends.toLocaleString()} sends — dm_client_funnel.total_cost`}
        />
        <MetricCard
          label="Total PCM cost"
          value={data.totalPcmCost}
          icon={<CostIcon />}
          iconBgClass="bg-accent-1-700"
          format="currency"
          subtitle={`$${data.pcmCostPerPiece.toFixed(4)}/piece · PCM /order × invoice-verified era rates (${(data.pcmPiecesInvoice ?? data.totalSends).toLocaleString()} pieces)`}
        />
        <MetricCard
          label="Gross margin"
          value={data.grossMargin}
          icon={<MarginIcon />}
          iconBgClass={marginIsNegative ? 'bg-error-700' : 'bg-success-700'}
          format="currency"
          subtitle="Revenue − PCM-invoice cost (math closes; invoice-authoritative)"
        />
        <MetricCard
          label="Margin %"
          value={marginPctDisplay}
          icon={<PercentIcon />}
          iconBgClass={marginIsNegative ? 'bg-error-700' : data.marginPercent < 5 ? 'bg-alert-700' : 'bg-success-700'}
          subtitle={marginIsNegative
            ? 'NEGATIVE — losing money on every piece'
            : data.marginPercent < 5
              ? 'Below 5% threshold — pricing review needed'
              : 'Healthy margin'}
        />
      </div>
      {hasAuroraDrift && data.reconciliation && (
        <div
          className="flex-shrink-0 px-3 py-2 text-xs border-t"
          style={{ borderColor: 'var(--stroke)', backgroundColor: 'var(--surface-sunken)', color: 'var(--content-tertiary)' }}
        >
          <strong style={{ color: 'var(--color-alert-700)' }}>Aurora reconciliation:</strong>{' '}
          Monolith&apos;s <code>dm_client_funnel.total_pcm_cost</code> sums to ${data.reconciliation.auroraStoredPcmCost.toFixed(2)} —{' '}
          <strong>${Math.abs(pcmDelta).toFixed(2)} {pcmDelta > 0 ? 'LESS' : 'MORE'}</strong> than PCM&apos;s own invoice-derived cost.
          Root cause: monolith uses $0.625/$0.875 rates (should be $0.63/$0.87) and leaves some pieces un-tagged. Margin above uses the invoice-authoritative number.
        </div>
      )}
    </div>
  );
}
