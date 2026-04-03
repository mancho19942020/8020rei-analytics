/**
 * DM Data Quality Widget
 *
 * Shows data trust indicators: attribution rate, backfilled dates, zero-revenue deals.
 * Uses AxisPill for each metric, matching RrOperationalPulseWidget pattern.
 */

'use client';

import { AxisPill } from '@/components/axis';
import type { DmDataQuality } from '@/types/dm-conversions';

interface DmDataQualityWidgetProps {
  data: DmDataQuality;
}

export function DmDataQualityWidget({ data }: DmDataQualityWidgetProps) {
  if (data.totalProperties === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
        No data quality metrics available yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full p-3 overflow-y-auto">
      <AxisPill
        label="Properties tracked"
        value={data.totalProperties.toLocaleString()}
        tooltip="Total distinct properties in the conversion tracking system."
      />
      <AxisPill
        label="Attribution rate"
        value={`${data.attributionRate}%`}
        type={data.attributionRate < 80 ? 'bad' : 'good'}
        tooltip={`${data.attributedCount} of ${data.totalProperties} properties have a campaign attribution. Low rates may indicate conversions before Sep 2025 (when attribution was added) or properties mailed 7+ months ago.`}
      />
      <AxisPill
        label="Backfilled dates"
        value={`${data.backfilledRate}%`}
        type={data.backfilledRate > 40 ? 'bad' : 'default'}
        tooltip={`${data.backfilledCount} properties have system-generated conversion dates (not organic transitions). Metrics like "avg days to lead" may be less accurate for these.`}
      />
      <AxisPill
        label="Unattributed conversions"
        value={data.unattributedCount.toLocaleString()}
        type={data.unattributedCount > 0 ? 'bad' : 'default'}
        tooltip="Properties that converted but couldn't be linked to a specific DM campaign. Check attribution system health."
      />
      <AxisPill
        label="Zero-revenue deals"
        value={data.zeroRevenueDealCount}
        type={data.zeroRevenueDealCount > 0 ? 'bad' : 'default'}
        tooltip="Deals that closed but have no revenue recorded. May indicate missing data in reverse_buybox_deals."
      />
    </div>
  );
}
