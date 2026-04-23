/**
 * PCM Margin Period Widget
 *
 * Same 4 MetricCards as PcmMarginSummaryWidget, but filtered by the
 * active date range (30 days, 7 days, custom). Shows period context.
 *
 * Data source: dm_volume_summary (daily aggregates within the selected period)
 */

'use client';

import { MetricCard } from '@/components/workspace/MetricCard';

interface PeriodReconciliation {
  auroraStoredPcmCost: number;
  auroraStoredMargin: number;
  pcmVsAuroraCostDelta: number;
  note: string;
}

interface PeriodProfitability {
  totalRevenue: number;
  totalPcmCost: number;           // Aurora sends × invoice-verified era rates (per-day-split)
  grossMargin: number;
  marginPercent: number;
  totalSends: number;
  pcmPiecesInvoice?: number;
  revenuePerPiece: number;
  pcmCostPerPiece: number;
  periodLabel: string;
  periodStart: string | null;
  periodEnd: string | null;
  /** Window intent (hardcoded to 30 days) */
  intendedDays?: number;
  /** Days actually present in the synced data within the intended window */
  actualDaysCount?: number;
  dataAvailable: boolean;
  sourceTable?: 'dm_client_funnel' | 'dm_volume_summary';
  reconciliation?: PeriodReconciliation;
}

interface PcmMarginPeriodWidgetProps {
  data: PeriodProfitability | null;
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

export function PcmMarginPeriodWidget({ data }: PcmMarginPeriodWidgetProps) {
  if (!data || !data.dataAvailable) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Period profitability data pending — select a date range to see filtered metrics
      </div>
    );
  }

  const marginIsNegative = data.grossMargin < 0;
  const marginPctDisplay = `${data.marginPercent.toFixed(1)}%`;
  const intended = data.intendedDays ?? 30;
  const actual = data.actualDaysCount ?? 0;
  const coverageNote = actual < intended
    ? `${actual} of ${intended} days synced (${data.periodStart ?? '—'} – ${data.periodEnd ?? '—'}). Coverage grows daily as the monolith syncs.`
    : `${intended} days fully synced (${data.periodStart ?? '—'} – ${data.periodEnd ?? '—'}).`;
  const pcmDelta = data.reconciliation?.pcmVsAuroraCostDelta ?? 0;
  const hasAuroraDrift = Math.abs(pcmDelta) >= 1;

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex w-full flex-1 flush-cards">
        <MetricCard
          label="Period revenue"
          value={data.totalRevenue}
          icon={<RevenueIcon />}
          iconBgClass="bg-main-700"
          format="currency"
          subtitle={`$${data.revenuePerPiece.toFixed(4)}/piece across ${data.totalSends.toLocaleString()} sends · ${data.periodLabel}`}
        />
        <MetricCard
          label="Period PCM cost"
          value={data.totalPcmCost}
          icon={<CostIcon />}
          iconBgClass="bg-accent-1-700"
          format="currency"
          subtitle={`$${data.pcmCostPerPiece.toFixed(4)}/piece · ${(data.pcmPiecesInvoice ?? 0).toLocaleString()} PCM orders × invoice era rates`}
        />
        <MetricCard
          label="Period margin"
          value={data.grossMargin}
          icon={<MarginIcon />}
          iconBgClass={marginIsNegative ? 'bg-error-700' : 'bg-success-700'}
          format="currency"
          subtitle={`Revenue − PCM-invoice cost · ${data.periodLabel}`}
        />
        <MetricCard
          label="Period margin %"
          value={marginPctDisplay}
          icon={<PercentIcon />}
          iconBgClass={marginIsNegative ? 'bg-error-700' : data.marginPercent < 5 ? 'bg-alert-700' : 'bg-success-700'}
          subtitle={marginIsNegative
            ? 'NEGATIVE — losing money in this period'
            : data.marginPercent < 5
              ? 'Matches current zero-margin era (customer rate ≈ PCM rate)'
              : `Healthy margin — ${data.periodLabel}`}
        />
      </div>
      <div
        className="flex-shrink-0 px-3 py-2 text-xs border-t"
        style={{ borderColor: 'var(--stroke)', backgroundColor: 'var(--surface-sunken)', color: 'var(--content-tertiary)' }}
      >
        <strong style={{ color: 'var(--content-secondary)' }}>Window:</strong> {coverageNote}
        {hasAuroraDrift && data.reconciliation && (
          <>
            {' · '}
            <strong style={{ color: 'var(--color-alert-700)' }}>Aurora drift:</strong>{' '}
            Aurora stored PCM = ${data.reconciliation.auroraStoredPcmCost.toFixed(2)} · PCM-invoice = ${data.totalPcmCost.toFixed(2)} · delta {pcmDelta >= 0 ? '+' : ''}${pcmDelta.toFixed(2)}. Margin above uses the invoice value.
          </>
        )}
      </div>
    </div>
  );
}
