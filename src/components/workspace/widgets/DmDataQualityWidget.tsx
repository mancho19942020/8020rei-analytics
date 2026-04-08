/**
 * DM Data Quality Widget
 *
 * Shows data trust indicators from available tables.
 * Property-level metrics appear when dm_property_conversions populates.
 * Template and client counts available now from dm_template_performance and dm_client_funnel.
 */

'use client';

import { AxisPill } from '@/components/axis';

interface DmDataQualityData {
  totalProperties: number;
  attributedCount: number;
  unattributedCount: number;
  attributionRate: number;
  backfilledCount: number;
  backfilledRate: number;
  zeroRevenueDealCount: number;
  totalTemplates?: number;
  totalClients?: number;
  deliveryIssues?: number;
  revenueMismatch?: number;
  propertyDataAvailable?: boolean;
}

interface DmDataQualityWidgetProps {
  data: DmDataQualityData;
}

export function DmDataQualityWidget({ data }: DmDataQualityWidgetProps) {
  const hasPropertyData = data.propertyDataAvailable ?? data.totalProperties > 0;

  return (
    <div className="grid grid-cols-2 gap-1.5 content-start px-3 py-1.5">
      {/* Column 1 — aggregate metrics */}
      <AxisPill
        label="Clients tracked"
        value={(data.totalClients ?? 0).toLocaleString()}
        tooltip="Number of distinct client domains in the conversion tracking system."
      />
      <AxisPill
        label="Templates tracked"
        value={(data.totalTemplates ?? 0).toLocaleString()}
        tooltip="Number of distinct templates across all domains."
      />
      {(data.deliveryIssues ?? 0) > 0 && (
        <AxisPill
          label="Delivery issues"
          value={data.deliveryIssues ?? 0}
          type="bad"
          tooltip="Templates showing 0 deliveries but with sends. Delivery tracking may not be configured for these domains."
        />
      )}
      {(data.revenueMismatch ?? 0) > 0 && (
        <AxisPill
          label="Revenue w/o deal status"
          value={data.revenueMismatch ?? 0}
          type="bad"
          tooltip="Templates with revenue recorded but 0 deals in the status log. ROAS is hidden for these templates."
        />
      )}

      {/* Property-level metrics — only show when dm_property_conversions has data */}
      {hasPropertyData ? (
        <>
          <AxisPill
            label="Properties tracked"
            value={data.totalProperties.toLocaleString()}
            tooltip="Total distinct properties in the conversion tracking system."
          />
          <AxisPill
            label="Attribution rate"
            value={`${data.attributionRate}%`}
            type={data.attributionRate < 80 ? 'bad' : 'good'}
            tooltip={`${data.attributedCount} of ${data.totalProperties} properties have a campaign attribution.`}
          />
          <AxisPill
            label="Backfilled dates"
            value={`${data.backfilledRate}%`}
            type={data.backfilledRate > 40 ? 'bad' : 'default'}
            tooltip={`${data.backfilledCount} properties have system-generated conversion dates.`}
          />
          <AxisPill
            label="Unattributed conversions"
            value={data.unattributedCount.toLocaleString()}
            type={data.unattributedCount > 0 ? 'bad' : 'default'}
            tooltip="Properties that converted but couldn't be linked to a specific DM campaign."
          />
          <AxisPill
            label="Zero-revenue deals"
            value={data.zeroRevenueDealCount}
            type={data.zeroRevenueDealCount > 0 ? 'bad' : 'default'}
            tooltip="Deals that closed but have no revenue recorded."
          />
        </>
      ) : (
        <div
          className="col-span-2 flex items-center gap-2 rounded-lg px-3 py-2 mt-1"
          style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
        >
          <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
            Property-level metrics (attribution, backfill, geo) pending monolith fix
          </span>
        </div>
      )}
    </div>
  );
}
