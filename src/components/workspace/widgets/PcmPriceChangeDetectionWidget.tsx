/**
 * PCM Price Change Detection Widget
 *
 * Auto-detects pricing changes from dm_volume_summary data and shows:
 * 1. Current effective rates (data-driven, never hardcoded)
 * 2. Detected rate changes with dates and deltas
 * 3. Per-domain rollout progress
 * 4. Financial impact (before/after margin, projected monthly impact)
 */

'use client';

import { AxisTooltip } from '@/components/axis';
import type { PriceDetectionData, PriceImpactData } from '@/types/pcm-validation';

interface PcmPriceChangeDetectionWidgetProps {
  detection: PriceDetectionData | null;
  impact: PriceImpactData | null;
}

const MAIL_CLASS_LABELS: Record<string, string> = {
  standard: 'Customer Standard',
  first_class: 'Customer First Class',
};

function RateCard({ label, rate, period }: { label: string; rate: number | null; period?: string }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-raised)' }}>
      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        {rate !== null ? `$${rate.toFixed(4)}` : '—'}
      </div>
      {period && (
        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Based on {period}
        </div>
      )}
    </div>
  );
}

function ChangeRow({ change }: { change: PriceDetectionData['changes'][0] }) {
  const isIncrease = change.rateDelta > 0;
  return (
    <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded"
      style={{ backgroundColor: 'var(--surface-raised)' }}>
      <div className="flex items-center gap-2">
        <span className="font-mono" style={{ color: 'var(--text-tertiary)' }}>{change.changeDate}</span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{
            backgroundColor: change.mailClass === 'standard' ? 'var(--color-main-50, #eff6ff)' : 'var(--color-accent-1-50, #fef3c7)',
            color: change.mailClass === 'standard' ? 'var(--color-main-700, #1d4ed8)' : 'var(--color-accent-1-700, #b45309)',
          }}>
          {MAIL_CLASS_LABELS[change.mailClass]}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span style={{ color: 'var(--text-secondary)' }}>${change.oldRate.toFixed(4)}</span>
        <span style={{ color: 'var(--text-tertiary)' }}>→</span>
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>${change.newRate.toFixed(4)}</span>
        <span className="font-medium" style={{
          color: isIncrease ? 'var(--color-success-600, #16a34a)' : 'var(--color-error-600, #dc2626)',
        }}>
          {isIncrease ? '+' : ''}{change.rateDelta.toFixed(4)}
        </span>
      </div>
    </div>
  );
}

function ImpactCard({ impact }: { impact: PriceImpactData['impacts'][0] }) {
  const isPositive = impact.marginDelta > 0;
  return (
    <div className="rounded-lg p-3" style={{
      backgroundColor: isPositive ? 'var(--color-success-50, #f0fdf4)' : 'var(--color-error-50, #fef2f2)',
      border: `1px solid ${isPositive ? 'var(--color-success-300, #86efac)' : 'var(--color-error-300, #fca5a5)'}`,
    }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{
          color: isPositive ? 'var(--color-success-700, #15803d)' : 'var(--color-error-700, #b91c1c)',
        }}>
          {MAIL_CLASS_LABELS[impact.mailClass]} — since {impact.changeDate}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {impact.daysSinceChange} day{impact.daysSinceChange !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Daily margin</div>
          <div className="text-sm font-semibold" style={{
            color: isPositive ? 'var(--color-success-700, #15803d)' : 'var(--color-error-700, #b91c1c)',
          }}>
            ${impact.beforeDailyMargin.toFixed(2)} → ${impact.afterDailyMargin.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Projected /mo</div>
          <div className="text-sm font-semibold" style={{
            color: isPositive ? 'var(--color-success-700, #15803d)' : 'var(--color-error-700, #b91c1c)',
          }}>
            {impact.projectedMonthlyMarginImpact >= 0 ? '+' : ''}${impact.projectedMonthlyMarginImpact.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Total impact</div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            ${impact.totalImpactSinceChange.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

function RolloutProgress({ label, status }: { label: string; status: PriceDetectionData['rolloutStatus']['standard'] }) {
  if (!status) return null;
  const pct = status.totalDomains > 0 ? (status.migratedDomains / status.totalDomains) * 100 : 0;
  const allMigrated = status.pendingDomains === 0;

  return (
    <div className="text-xs">
      <div className="flex items-center justify-between mb-1">
        <span style={{ color: 'var(--text-secondary)' }}>{label} rollout</span>
        <span className="font-medium" style={{
          color: allMigrated ? 'var(--color-success-600, #16a34a)' : 'var(--color-alert-600, #d97706)',
        }}>
          {status.migratedDomains}/{status.totalDomains} domains at ${status.newRate.toFixed(2)}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-raised)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: allMigrated ? 'var(--color-success-500, #22c55e)' : 'var(--color-alert-500, #f59e0b)',
          }}
        />
      </div>
    </div>
  );
}

export function PcmPriceChangeDetectionWidget({ detection, impact }: PcmPriceChangeDetectionWidgetProps) {
  if (!detection || !detection.dataAvailable) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Price detection data pending — requires dm_volume_summary per-mail-class data
      </div>
    );
  }

  const period = detection.currentRates.periodStart && detection.currentRates.periodEnd
    ? `${detection.currentRates.periodStart} – ${detection.currentRates.periodEnd}`
    : undefined;

  // Was the widget's header explicit that these are CUSTOMER rates, not PCM rates?
  // Prior version labeled rows "Standard"/"First Class" which collides with the
  // "Standard"/"First Class" labels on Pricing overview's card (where the same
  // label refers to the PCM vendor rate). Relabeling disambiguates the series.
  const headerTooltip = (
    <>This widget tracks changes to <strong>what 8020REI charges its clients</strong> per piece (derived live from <code>dm_volume_summary</code>). PCM vendor rates follow a separate contract schedule in <code>pcm-pricing-eras.ts</code> and do not appear here — the gap between the two is our margin.</>
  );

  return (
    <div className="flex flex-col gap-3 h-full px-3 py-2 overflow-y-auto">
      {/* Zone 1: Current customer rates */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Current customer rates</span>
          <AxisTooltip title="Customer rates only" content={headerTooltip} placement="top" maxWidth={340}>
            <span className="text-[11px] cursor-help" style={{ color: 'var(--text-tertiary)' }}>ⓘ</span>
          </AxisTooltip>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <RateCard label="Customer Standard" rate={detection.currentRates.standard} period={period} />
          <RateCard label="Customer First Class" rate={detection.currentRates.firstClass} period={period} />
        </div>
      </div>

      {/* Zone 2: Rollout progress */}
      {(detection.rolloutStatus.standard || detection.rolloutStatus.firstClass) && (
        <div className="flex flex-col gap-1.5">
          <RolloutProgress label="Customer Standard" status={detection.rolloutStatus.standard} />
          <RolloutProgress label="Customer First Class" status={detection.rolloutStatus.firstClass} />
        </div>
      )}

      {/* Zone 3: Detected customer-rate changes */}
      {detection.changes.length > 0 ? (
        <div>
          <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Detected customer-rate changes
          </div>
          <div className="space-y-1">
            {detection.changes.slice(0, 8).map((change, i) => (
              <ChangeRow key={`${change.changeDate}-${change.mailClass}-${i}`} change={change} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg p-2.5" style={{ backgroundColor: 'var(--surface-raised)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            No customer-rate changes detected. Monitoring for deviations greater than $0.005/piece.
          </p>
        </div>
      )}

      {/* Zone 5: Sync coverage — explicit honesty about what Aurora has received.
          If First Class hasn't synced past some date, this surface tells the
          reader the detection query isn't missing the change — the data simply
          isn't here yet. Rule 18: never hide inconsistencies. */}
      {detection.coverage && (() => {
        const today = new Date().toISOString().slice(0, 10);
        const daysBehind = (iso: string) => {
          const ms = new Date(today).getTime() - new Date(iso).getTime();
          return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
        };
        const std = detection.coverage.standard;
        const fc = detection.coverage.firstClass;
        const stdLag = std ? daysBehind(std.lastSyncedDate) : null;
        const fcLag = fc ? daysBehind(fc.lastSyncedDate) : null;
        const anyStale = (stdLag != null && stdLag >= 2) || (fcLag != null && fcLag >= 2);
        if (!anyStale && std && fc) return null;
        return (
          <div className="rounded-lg p-2.5 text-xs" style={{
            backgroundColor: anyStale ? 'var(--color-alert-50, #fffbeb)' : 'var(--surface-raised)',
            border: anyStale ? '1px solid var(--color-alert-300, #fcd34d)' : undefined,
            color: anyStale ? 'var(--color-alert-700, #b45309)' : 'var(--text-tertiary)',
          }}>
            <div className="font-medium mb-1">Aurora sync coverage</div>
            <div className="space-y-0.5">
              <div>
                Customer Standard: {std ? `last synced ${std.lastSyncedDate}${stdLag ? ` (${stdLag}d behind)` : ''}` : 'no data'}
              </div>
              <div>
                Customer First Class: {fc ? `last synced ${fc.lastSyncedDate}${fcLag ? ` (${fcLag}d behind)` : ''}` : 'no data'}
              </div>
              {anyStale && (
                <div className="mt-1 italic">
                  Sync lag suspected — if an expected rate change isn&apos;t visible above, verify the monolith has sent recent rows to dm_volume_summary.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Zone 4: Financial impact */}
      {impact?.dataAvailable && impact.impacts.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Financial impact
          </div>
          <div className="space-y-2">
            {impact.impacts.map(imp => (
              <ImpactCard key={`${imp.mailClass}-${imp.changeDate}`} impact={imp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
