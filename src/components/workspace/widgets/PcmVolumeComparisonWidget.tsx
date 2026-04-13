/**
 * PCM Volume Comparison Widget
 *
 * Side-by-side comparison of Aurora total sends vs PCM total orders.
 */

'use client';

import { AxisPill } from '@/components/axis';

interface PcmVolumeComparisonWidgetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  domains: any;
}

export function PcmVolumeComparisonWidget({ data, domains }: PcmVolumeComparisonWidgetProps) {
  const auroraSends = data?.auroraTotalSends ?? 0;
  const auroraDelivered = data?.auroraTotalDelivered ?? 0;
  const pcmOrders = data?.pcmOrderCount ?? 0;
  const delta = data?.volumeDelta ?? 0;
  const deltaPercent = data?.volumeDeltaPercent ?? 0;
  const domainCount = data?.auroraDomainCount ?? 0;

  const pcmHasData = pcmOrders > 0;

  return (
    <div className="flex flex-col gap-3 h-full px-3 py-2 overflow-y-auto">
      {/* Big numbers side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-raised)' }}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>8020REI (Aurora)</div>
          <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {auroraSends.toLocaleString()}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            total sends · {auroraDelivered.toLocaleString()} delivered
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-raised)' }}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>PostcardMania</div>
          <div className="text-2xl font-semibold" style={{ color: pcmHasData ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
            {pcmHasData ? pcmOrders.toLocaleString() : '—'}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {pcmHasData ? 'total orders' : 'order access pending'}
          </div>
        </div>
      </div>

      {/* Delta */}
      {pcmHasData && (
        <AxisPill
          label="Delta"
          value={`${delta > 0 ? '+' : ''}${delta.toLocaleString()} (${deltaPercent > 0 ? '+' : ''}${deltaPercent}%)`}
          type={Math.abs(deltaPercent) < 5 ? 'good' : Math.abs(deltaPercent) < 15 ? 'default' : 'bad'}
          tooltip="Difference between PCM order count and Aurora send count. Close to 0% means data is aligned."
        />
      )}

      {!pcmHasData && (
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-raised)', border: '1px dashed var(--border-default)' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            <strong>PCM order access pending.</strong> The API key authenticates successfully and returns design templates, but orders return 0 results.
            This is likely a child app scoping issue — the monolith places orders through a separate PCM child app.
            Volume comparison will activate once we resolve API access to the production orders.
          </p>
        </div>
      )}

      {/* Quick domain stats */}
      <AxisPill
        label="Active domains"
        value={domainCount.toLocaleString()}
        tooltip="Number of client domains with send data in Aurora."
      />
    </div>
  );
}
