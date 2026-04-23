/**
 * PCM Cost Analysis Widget
 *
 * Compares Aurora cost data against PCM pricing.
 * Current rates are data-driven from the current-rates API endpoint.
 */

'use client';

import { AxisPill } from '@/components/axis';
import type { CurrentRatesData } from '@/types/pcm-validation';

interface PcmCostAnalysisWidgetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  domains: any;
  currentRates?: CurrentRatesData | null;
}

export function PcmCostAnalysisWidget({ data, domains, currentRates }: PcmCostAnalysisWidgetProps) {
  const auroraCost = data?.auroraTotalCost ?? 0;
  const auroraSends = data?.auroraTotalSends ?? 0;

  // Data-driven rates from current-rates API (no hardcoded values)
  const standardRate = currentRates?.standard ?? null;
  const firstClassRate = currentRates?.firstClass ?? null;

  // Our average unit cost
  const auroraAvgRate = auroraSends > 0 ? auroraCost / auroraSends : 0;

  // Top domains by cost
  const domainList = domains?.domains ?? [];
  const topDomains = [...domainList]
    .sort((a: { cost: number }, b: { cost: number }) => b.cost - a.cost)
    .slice(0, 5);

  const rateLabel = standardRate !== null && firstClassRate !== null
    ? `$${standardRate.toFixed(2)} standard, $${firstClassRate.toFixed(2)} first class`
    : 'rates loading...';

  return (
    <div className="flex flex-col gap-3 h-full px-3 py-2 overflow-y-auto">
      {/* Rate comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-raised)' }}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Our avg rate</div>
          <div className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            ${auroraAvgRate.toFixed(3)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            per piece (Aurora total / sends)
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-raised)' }}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Current unit rates</div>
          <div className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {standardRate !== null ? `$${standardRate.toFixed(2)}` : '—'} / {firstClassRate !== null ? `$${firstClassRate.toFixed(2)}` : '—'}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Std / FC (derived from last 7 days)
          </div>
        </div>
      </div>

      {/* Cost totals */}
      <div className="grid grid-cols-2 gap-1.5">
        <AxisPill
          label="Aurora total cost"
          value={`$${auroraCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          tooltip={`Total cost from dm_client_funnel. Based on unit_cost field (${rateLabel}).`}
        />
        <AxisPill
          label="Blended rate"
          value={currentRates?.blended ? `$${currentRates.blended.toFixed(4)}/piece` : '—'}
          tooltip="Blended average rate across all mail classes from last 7 days of data."
        />
      </div>

      {/* Dynamic pricing status */}
      <div className="rounded-lg p-2.5" style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-default)' }}>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          <strong>Rates auto-detected from data.</strong>{' '}
          {currentRates?.dataAvailable
            ? `Current effective rates: ${rateLabel}. Period: ${currentRates.periodStart ?? '?'} – ${currentRates.periodEnd ?? '?'}. Rate changes are detected automatically by the Price Change Detection widget.`
            : 'Waiting for dm_volume_summary per-mail-class data to populate current rates.'}
        </p>
      </div>

      {/* Top domains by cost */}
      {topDomains.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Top domains by cost</div>
          <div className="space-y-1">
            {topDomains.map((d: { domain: string; cost: number; sends: number }) => (
              <div key={d.domain} className="flex items-center justify-between text-xs py-1 px-2 rounded"
                style={{ backgroundColor: 'var(--surface-raised)' }}>
                <span style={{ color: 'var(--text-primary)' }}>{d.domain}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  ${d.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="ml-2" style={{ color: 'var(--text-tertiary)' }}>
                    ({d.sends > 0 ? `$${(d.cost / d.sends).toFixed(2)}/pc` : '—'})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
