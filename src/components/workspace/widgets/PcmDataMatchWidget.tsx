/**
 * PCM Data Match Widget
 *
 * Two-layer display:
 * Layer 1 (primary): Domain-level alignment health from rr_pcm_alignment.
 * Layer 2 (reference): Lifetime totals — our sends vs PCM total orders.
 *
 * Color system:
 *   Green  — healthy (>= 95% aligned)
 *   Amber  — warning (>= 90% aligned)
 *   Red    — critical (< 90% aligned)
 */

'use client';

import { AxisTooltip } from '@/components/axis';

interface AlignmentHealth {
  totalDomains: number;
  syncedDomains: number;
  domainsWithGaps: number;
  totalSyncGap: number;
  totalStale?: number;
  totalOrphaned?: number;
  alignmentMatchRate: number;
}

interface PcmDataMatchWidgetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summary: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  statusComparison: any;
}

function alignmentColor(rate: number): string {
  if (rate >= 95) return 'var(--color-success-600, #16a34a)';
  if (rate >= 90) return 'var(--color-alert-600, #d97706)';
  return 'var(--color-error-600, #dc2626)';
}

function syncGapColor(gap: number): string {
  if (gap === 0) return 'var(--color-success-600, #16a34a)';
  if (gap <= 50) return 'var(--text-primary)';
  if (gap <= 200) return 'var(--color-alert-600, #d97706)';
  return 'var(--color-error-600, #dc2626)';
}

/** Info icon positioned top-right inside the card */
function CardInfoIcon({ tip }: { tip: string }) {
  return (
    <AxisTooltip content={tip} placement="bottom" maxWidth={240}>
      <span className="cursor-help" style={{ color: 'var(--text-tertiary)' }}>
        <svg className="w-3.5 h-3.5 opacity-50 hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
        </svg>
      </span>
    </AxisTooltip>
  );
}

export function PcmDataMatchWidget({ summary }: PcmDataMatchWidgetProps) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Waiting for reconciliation data...
      </div>
    );
  }

  const alignment: AlignmentHealth | null = summary.alignmentHealth ?? null;
  const auroraSends = summary.auroraTotalSends ?? 0;
  const pcmOrders = summary.pcmOrderCount ?? 0;
  const pcmConnected = summary.pcmConnected ?? false;
  const lifetimeMatchRate = summary.matchRate ?? 0;
  const lifetimeDelta = Math.abs(pcmOrders - auroraSends);
  const matchRate = alignment?.alignmentMatchRate ?? lifetimeMatchRate;

  return (
    <div className="flex flex-col gap-2 h-full px-3 py-2">
      {/* Layer 1: Cards — fill available height, equal width */}
      {alignment && alignment.totalDomains > 0 ? (
        <div className="flex gap-2 flex-1 min-h-0">
          {/* Domains synced */}
          <div className="flex-1 rounded-lg p-3 flex flex-col justify-between min-w-0" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Domains synced
              </span>
              <CardInfoIcon tip="Client domains where our back-office order count matches PCM exactly. A synced domain means no discrepancy between systems." />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {alignment.syncedDomains}
                <span className="text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}> / {alignment.totalDomains}</span>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {alignment.domainsWithGaps > 0
                  ? `${alignment.domainsWithGaps} with gaps`
                  : 'All domains aligned'}
              </div>
            </div>
          </div>

          {/* Alignment rate */}
          <div className="flex-1 rounded-lg p-3 flex flex-col justify-between min-w-0" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Aligned
              </span>
              <CardInfoIcon tip="Percentage of domains fully synced with PCM. Green (>= 95%): healthy. Yellow (90-95%): needs attention. Red (< 90%): significant issues." />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: alignmentColor(matchRate) }}>
                {matchRate.toFixed(1)}%
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {matchRate >= 95 ? 'Healthy' : matchRate >= 90 ? 'Needs monitoring' : 'Critical'}
              </div>
            </div>
          </div>

          {/* Sync gap */}
          <div className="flex-1 rounded-lg p-3 flex flex-col justify-between min-w-0" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Sync gap
              </span>
              <CardInfoIcon tip="Orders PCM accepted that our back-office hasn't recorded. Zero = perfect sync. Under 50 = normal delay. Over 200 = needs investigation." />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: syncGapColor(alignment.totalSyncGap) }}>
                {alignment.totalSyncGap.toLocaleString()}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {alignment.totalSyncGap === 0 ? 'Perfect sync' : alignment.totalSyncGap <= 50 ? 'Normal delay' : 'Investigate'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Fallback */
        <div className="flex gap-2 flex-1 min-h-0">
          <div className="flex-1 rounded-lg p-3 flex flex-col justify-between min-w-0" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Our sends</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{auroraSends.toLocaleString()}</div>
          </div>
          <div className="flex-1 rounded-lg p-3 flex flex-col justify-between min-w-0" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Match</div>
            <div className="text-2xl font-bold" style={{ color: alignmentColor(lifetimeMatchRate) }}>{lifetimeMatchRate.toFixed(1)}%</div>
          </div>
          <div className="flex-1 rounded-lg p-3 flex flex-col justify-between min-w-0" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>PCM orders</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{pcmConnected && pcmOrders > 0 ? pcmOrders.toLocaleString() : '\u2014'}</div>
          </div>
        </div>
      )}

      {/* Layer 2: Lifetime reference — full width, tooltip on the info icon only */}
      {alignment && alignment.totalDomains > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded text-[11px]"
          style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--text-tertiary)' }}
        >
          <span className="font-medium shrink-0">Lifetime total:</span>
          <span className="flex-1 truncate">
            Our sends: <strong style={{ color: 'var(--text-secondary)' }}>{auroraSends.toLocaleString()}</strong>
            {' \u00B7 '}
            PCM orders: <strong style={{ color: 'var(--text-secondary)' }}>{pcmConnected && pcmOrders > 0 ? pcmOrders.toLocaleString() : '\u2014'}</strong>
            {lifetimeDelta > 0 && (
              <span> ({lifetimeMatchRate.toFixed(1)}%, {lifetimeDelta.toLocaleString()} delta)</span>
            )}
          </span>
          <AxisTooltip content="Lifetime cumulative totals: our sends (dm_client_funnel) vs PCM total orders (PCM API). Always all-time regardless of date filter. May include old mismatches." placement="top" maxWidth={260}>
            <span className="cursor-help shrink-0" style={{ color: 'var(--text-tertiary)' }}>
              <svg className="w-3 h-3 opacity-50 hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
              </svg>
            </span>
          </AxisTooltip>
        </div>
      )}
    </div>
  );
}
