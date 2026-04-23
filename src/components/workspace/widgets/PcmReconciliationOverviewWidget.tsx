/**
 * PCM Reconciliation Overview Widget
 *
 * Shows connection status, PCM account info, and Aurora totals.
 * Layout matches DmDataQualityWidget pattern: 2-column pill grid.
 */

'use client';

import { AxisPill } from '@/components/axis';

interface PcmReconciliationOverviewWidgetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export function PcmReconciliationOverviewWidget({ data }: PcmReconciliationOverviewWidgetProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Waiting for reconciliation data...
      </div>
    );
  }

  const pcmConnected = data.pcmConnected ?? false;
  const auroraConnected = data.auroraConnected ?? false;
  const balance = data.pcmBalance ?? 0;
  const designCount = data.pcmDesignCount ?? 0;
  const auroraSends = data.auroraTotalSends ?? 0;
  const auroraCost = data.auroraTotalCost ?? 0;
  const auroraDomains = data.auroraDomainCount ?? 0;
  const auroraDelivered = data.auroraTotalDelivered ?? 0;

  return (
    <div className="grid grid-cols-2 gap-1.5 content-start px-3 py-1.5">
      {/* Connection status */}
      <AxisPill
        label="PCM API"
        value={pcmConnected ? 'Connected' : 'Not configured'}
        type={pcmConnected ? 'good' : 'bad'}
        tooltip="PostcardMania API connection status."
      />
      <AxisPill
        label="Aurora"
        value={auroraConnected ? 'Connected' : 'Not configured'}
        type={auroraConnected ? 'good' : 'bad'}
        tooltip="AWS Aurora PostgreSQL connection."
      />

      {/* PCM account data */}
      <AxisPill
        label="PCM balance"
        value={`$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        tooltip="Current balance on the PostcardMania account."
      />
      <AxisPill
        label="PCM designs"
        value={designCount.toLocaleString()}
        type={designCount > 0 ? 'good' : 'default'}
        tooltip="Mail piece designs available in the PCM account."
      />

      {/* Aurora totals (corrected, from dm_client_funnel) */}
      <AxisPill
        label="Aurora sends"
        value={auroraSends.toLocaleString()}
        tooltip="Total sends from dm_client_funnel (corrected, excluding test domains)."
      />
      <AxisPill
        label="Aurora delivered"
        value={auroraDelivered.toLocaleString()}
        tooltip="Total delivered from dm_client_funnel."
      />
      <AxisPill
        label="Aurora cost"
        value={`$${auroraCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        tooltip="Total cost from dm_client_funnel (our unit_cost × sends)."
      />
      <AxisPill
        label="Active domains"
        value={auroraDomains.toLocaleString()}
        tooltip="Number of client domains with send data in Aurora."
      />
    </div>
  );
}
