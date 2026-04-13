/**
 * PCM Status Comparison Widget
 *
 * Aurora status distribution vs PCM status distribution.
 * Shows grouped horizontal bars comparing the two sources.
 */

'use client';

import { AxisPill } from '@/components/axis';

interface PcmStatusComparisonWidgetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export function PcmStatusComparisonWidget({ data }: PcmStatusComparisonWidgetProps) {
  const aurora = data?.aurora ?? {};
  const pcm = data?.pcm ?? {};
  const hasPcmData = Object.keys(pcm).length > 0;

  // Build status rows from Aurora data
  const statuses = [
    { label: 'Sent (to PCM)', auroraKey: 'sent', color: 'var(--color-main-500)' },
    { label: 'Delivered', auroraKey: 'delivered', color: 'var(--color-success-500)' },
    { label: 'Undeliverable', auroraKey: 'undeliverable', color: 'var(--color-error-500)' },
    { label: 'On hold', auroraKey: 'onHold', color: 'var(--color-error-300)' },
    { label: 'Protected', auroraKey: 'protected', color: 'var(--text-tertiary)' },
    { label: 'Error', auroraKey: 'error', color: 'var(--color-error-700)' },
  ];

  const maxValue = Math.max(
    ...statuses.map(s => Number(aurora[s.auroraKey] || 0)),
    1
  );

  return (
    <div className="flex flex-col gap-3 h-full px-3 py-2 overflow-y-auto">
      {/* Aurora status bars */}
      <div>
        <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Aurora status breakdown (from rr_daily_metrics)
        </div>
        <div className="space-y-2">
          {statuses.map(s => {
            const value = Number(aurora[s.auroraKey] || 0);
            const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
            return (
              <div key={s.auroraKey}>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span style={{ color: 'var(--text-primary)' }}>{s.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{value.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-raised)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(pct, 0.5)}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PCM status section */}
      {hasPcmData ? (
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            PCM status breakdown
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(pcm).map(([status, count]) => (
              <AxisPill
                key={status}
                label={status}
                value={Number(count).toLocaleString()}
                tooltip={`PCM reports ${Number(count).toLocaleString()} orders with status "${status}".`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg p-2.5" style={{ backgroundColor: 'var(--surface-raised)', border: '1px dashed var(--border-default)' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            <strong>PCM status data pending.</strong> Once order access is resolved, this widget will show a
            side-by-side comparison of our status distribution vs PCM&apos;s, highlighting any mismatches
            (e.g., we say &quot;Delivered&quot; but PCM says &quot;Undeliverable&quot;).
          </p>
        </div>
      )}

      {/* Status mapping reference */}
      <div>
        <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Status mapping (PCM → Aurora)
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>Delivered → delivered</span>
          <span>Undeliverable → undeliverable</span>
          <span>Canceled → undelivered</span>
          <span>Duplicate → undelivered</span>
          <span>Processing → sent</span>
          <span>Mailing → sent</span>
          <span>In Route → sent</span>
        </div>
      </div>
    </div>
  );
}
