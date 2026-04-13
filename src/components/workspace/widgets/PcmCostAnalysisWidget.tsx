/**
 * PCM Cost Analysis Widget
 *
 * Compares Aurora cost data against PCM pricing.
 * Addresses the $19.5K vs $17K discrepancy.
 */

'use client';

import { AxisPill } from '@/components/axis';

interface PcmCostAnalysisWidgetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  domains: any;
}

export function PcmCostAnalysisWidget({ data, domains }: PcmCostAnalysisWidgetProps) {
  const auroraCost = data?.auroraTotalCost ?? 0;
  const auroraSends = data?.auroraTotalSends ?? 0;

  // Our unit costs from the monolith
  const standardRate = 0.63;
  const firstClassRate = 0.87;

  // PCM's reported rate (from the handoff: their total was $17,014 for 23,038 pieces)
  const pcmReferenceTotal = 17014.13;
  const pcmReferencePieces = 23038;
  const pcmImpliedRate = pcmReferencePieces > 0 ? pcmReferenceTotal / pcmReferencePieces : 0;

  // Our average unit cost
  const auroraAvgRate = auroraSends > 0 ? auroraCost / auroraSends : 0;

  // Top domains by cost
  const domainList = domains?.domains ?? [];
  const topDomains = [...domainList]
    .sort((a: { cost: number }, b: { cost: number }) => b.cost - a.cost)
    .slice(0, 5);

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
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>PCM reference rate</div>
          <div className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            ${pcmImpliedRate.toFixed(3)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            per piece (from PCM dashboard)
          </div>
        </div>
      </div>

      {/* Cost totals */}
      <div className="grid grid-cols-2 gap-1.5">
        <AxisPill
          label="Aurora total cost"
          value={`$${auroraCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          tooltip={`Total cost from dm_client_funnel. Based on unit_cost field ($${standardRate} standard, $${firstClassRate} first class).`}
        />
        <AxisPill
          label="Rate delta"
          value={`${auroraAvgRate > pcmImpliedRate ? '+' : ''}$${(auroraAvgRate - pcmImpliedRate).toFixed(3)}/piece`}
          type={Math.abs(auroraAvgRate - pcmImpliedRate) < 0.05 ? 'good' : 'bad'}
          tooltip="Difference between our average rate and PCM's implied rate. Positive means we're overcharging relative to PCM's actual cost."
        />
      </div>

      {/* Investigation note */}
      <div className="rounded-lg p-2.5" style={{ backgroundColor: 'var(--surface-raised)', border: '1px dashed var(--border-default)' }}>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          <strong>Cost discrepancy under investigation.</strong> Our unit_cost ($0.63/$0.87) doesn't match
          PCM's actual pricing (~$0.74/piece). The difference may be due to volume discounts,
          pricing tiers, or markup differences. Pending answer from Camilo.
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
