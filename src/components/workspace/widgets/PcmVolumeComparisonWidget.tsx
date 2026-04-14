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
  const activeCampaigns = data?.activeCampaigns ?? 0;
  const activeDomainsCount = data?.activeDomainsCount ?? 0;
  const deliveryRate = auroraSends > 0 ? ((auroraDelivered / auroraSends) * 100).toFixed(1) : '0';

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
            mail pieces sent · {auroraDelivered.toLocaleString()} delivered ({deliveryRate}%)
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-raised)' }}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>PostcardMania</div>
          <div className="text-2xl font-semibold" style={{ color: pcmHasData ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
            {pcmHasData ? pcmOrders.toLocaleString() : '—'}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {pcmHasData ? 'total orders (mail pieces)' : 'order access pending'}
          </div>
        </div>
      </div>

      {/* Delta */}
      {pcmHasData && (
        <AxisPill
          label="Delta (PCM − Aurora)"
          value={`${delta > 0 ? '+' : ''}${delta.toLocaleString()} (${deltaPercent > 0 ? '+' : ''}${deltaPercent}%)`}
          type={Math.abs(deltaPercent) < 5 ? 'good' : Math.abs(deltaPercent) < 15 ? 'default' : 'bad'}
          tooltip="Difference between PCM total orders and Aurora total mail pieces. Both count individual mail pieces (not unique properties). Close to 0% means the two systems are aligned."
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

      {/* Domain & campaign stats — consistent with Operational Health */}
      <AxisPill
        label="Active campaigns"
        value={activeCampaigns.toLocaleString()}
        tooltip="Campaigns with status 'active' in the latest snapshot. Same number shown in Operational Health → 'Is it running?' Uses rr_campaign_snapshots."
      />
      <AxisPill
        label="Domains with active campaigns"
        value={activeDomainsCount.toLocaleString()}
        tooltip="Distinct client domains that have at least one active campaign right now. Same source as Operational Health (rr_campaign_snapshots)."
      />
      <AxisPill
        label="Domains with send data"
        value={domainCount.toLocaleString()}
        tooltip="Total client domains that have ever sent mail (historical). This includes domains whose campaigns are now inactive or paused. Source: dm_client_funnel."
      />
    </div>
  );
}
