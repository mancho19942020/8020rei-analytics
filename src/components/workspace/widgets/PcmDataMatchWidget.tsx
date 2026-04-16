/**
 * PCM Data Match Widget
 *
 * Our sends vs PCM orders with match rate.
 * Clean, centered layout — numbers fill the available space.
 *
 * Data source: type=summary
 */

'use client';

interface PcmDataMatchWidgetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summary: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  statusComparison: any;
}

export function PcmDataMatchWidget({ summary }: PcmDataMatchWidgetProps) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Waiting for reconciliation data...
      </div>
    );
  }

  const auroraSends = summary.auroraTotalSends ?? 0;
  const pcmOrders = summary.pcmOrderCount ?? 0;
  const matchRate = summary.matchRate ?? 0;
  const delta = Math.abs(pcmOrders - auroraSends);
  const pcmConnected = summary.pcmConnected ?? false;

  const matchColor = matchRate >= 99 ? 'var(--color-success-600, #16a34a)'
    : matchRate >= 95 ? 'var(--color-alert-600, #d97706)'
    : 'var(--color-error-600, #dc2626)';

  return (
    <div className="flex items-stretch h-full px-3 py-2 gap-3">
      {/* Our data */}
      <div className="flex-1 rounded-lg p-3 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--surface-raised)' }}>
        <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Our sends</div>
        <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {auroraSends.toLocaleString()}
        </div>
      </div>

      {/* Match rate center */}
      <div className="flex flex-col items-center justify-center px-2">
        <div className="text-3xl font-bold" style={{ color: matchColor }}>
          {matchRate.toFixed(1)}%
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          match
        </div>
        {delta > 0 && (
          <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {delta.toLocaleString()} in pipeline
          </div>
        )}
      </div>

      {/* PCM data */}
      <div className="flex-1 rounded-lg p-3 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--surface-raised)' }}>
        <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>PCM orders</div>
        <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {pcmConnected && pcmOrders > 0 ? pcmOrders.toLocaleString() : '—'}
        </div>
      </div>
    </div>
  );
}
