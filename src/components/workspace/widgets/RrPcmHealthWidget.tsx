/**
 * Rapid Response PCM Health Widget
 *
 * "Is it aligned?" — Uses AxisPill for each metric with threshold coloring.
 * Title is in the widget card header; no duplicate label inside.
 */

'use client';

import { AxisPill } from '@/components/axis';
import type { RrPcmHealth } from '@/types/rapid-response';

interface RrPcmHealthWidgetProps {
  data: RrPcmHealth;
}

export function RrPcmHealthWidget({ data }: RrPcmHealthWidgetProps) {
  return (
    <div className="flex flex-col gap-2 h-full p-3">
      <AxisPill
        label="Stale sent (14d+)"
        value={data.staleSentCount}
        type={data.staleSentCount > 0 ? 'bad' : 'good'}
      />
      <AxisPill
        label="Orphaned orders"
        value={data.orphanedOrdersCount}
        type={data.orphanedOrdersCount > 0 ? 'bad' : 'good'}
      />
      <AxisPill
        label="Sync gap"
        value={data.backOfficeSyncGap}
        type={data.backOfficeSyncGap > 0 ? 'bad' : 'good'}
      />
      <AxisPill
        label="Delivery lag (median)"
        value={`${data.deliveryLagMedianDays} days`}
        type={data.deliveryLagMedianDays > 10 ? 'bad' : 'default'}
      />
      <AxisPill
        label="Undeliverable (7d)"
        value={`${data.undeliverableRate7d}%`}
        type={data.undeliverableRate7d > 10 ? 'bad' : 'default'}
      />
    </div>
  );
}
