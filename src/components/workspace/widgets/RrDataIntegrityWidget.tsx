/**
 * Data Integrity Widget (Operational Health)
 *
 * 4 MetricCards showing data pipeline integrity:
 * Backfilled dates | Unattributed conversions | Zero-revenue deals | Pre-send conversions
 *
 * Moved from Business Results "Data quality" pills → redesigned as MetricCards.
 * Only shows meaningful data when dm_property_conversions has data.
 */

'use client';

import { MetricCard } from '@/components/workspace/MetricCard';

interface RrDataIntegrityData {
  backfilledRate: number;
  backfilledCount: number;
  totalProperties: number;
  unattributedCount: number;
  zeroRevenueDealCount: number;
  preSendConversions: number;
  deliveryIssues: number;
  revenueMismatch: number;
  propertyDataAvailable: boolean;
}

interface RrDataIntegrityWidgetProps {
  data: RrDataIntegrityData | null;
}

const BackfillIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const UnattributedIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const ZeroRevenueIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PreSendIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

export function RrDataIntegrityWidget({ data }: RrDataIntegrityWidgetProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Data integrity metrics loading...
      </div>
    );
  }

  const hasPropertyData = data.propertyDataAvailable || data.totalProperties > 0;

  if (!hasPropertyData) {
    return (
      <div className="flex w-full h-full flush-cards">
        <MetricCard
          label="Delivery issues"
          value={data.deliveryIssues}
          icon={<UnattributedIcon />}
          iconBgClass={data.deliveryIssues > 0 ? 'bg-error-700' : 'bg-success-700'}
          format="number"
          subtitle="Templates with 0 deliveries but active sends"
        />
        <MetricCard
          label="Revenue w/o deal"
          value={data.revenueMismatch}
          icon={<ZeroRevenueIcon />}
          iconBgClass={data.revenueMismatch > 0 ? 'bg-error-700' : 'bg-success-700'}
          format="number"
          subtitle="Templates with revenue but 0 deals in the status log"
        />
        <MetricCard
          label="Backfilled dates"
          value="—"
          icon={<BackfillIcon />}
          iconBgClass="bg-neutral-500"
          subtitle="Property data pending monolith fix"
        />
        <MetricCard
          label="Pre-send conversions"
          value="—"
          icon={<PreSendIcon />}
          iconBgClass="bg-neutral-500"
          subtitle="Property data pending monolith fix"
        />
      </div>
    );
  }

  const backfillColor = data.backfilledRate > 40 ? 'bg-error-700' : data.backfilledRate > 20 ? 'bg-alert-700' : 'bg-success-700';

  return (
    <div className="flex w-full h-full flush-cards">
      <MetricCard
        label="Backfilled dates"
        value={`${data.backfilledRate}%`}
        icon={<BackfillIcon />}
        iconBgClass={backfillColor}
        subtitle={`${data.backfilledCount} properties have system-generated conversion dates`}
      />
      <MetricCard
        label="Unattributed conversions"
        value={data.unattributedCount}
        icon={<UnattributedIcon />}
        iconBgClass={data.unattributedCount > 0 ? 'bg-error-700' : 'bg-success-700'}
        format="number"
        subtitle="Properties that converted but couldn't be linked to a DM campaign"
      />
      <MetricCard
        label="Zero-revenue deals"
        value={data.zeroRevenueDealCount}
        icon={<ZeroRevenueIcon />}
        iconBgClass={data.zeroRevenueDealCount > 0 ? 'bg-alert-700' : 'bg-success-700'}
        format="number"
        subtitle="Deals that closed but have no revenue recorded"
      />
      <MetricCard
        label="Pre-send conversions"
        value={data.preSendConversions}
        icon={<PreSendIcon />}
        iconBgClass={data.preSendConversions > 0 ? 'bg-error-700' : 'bg-success-700'}
        format="number"
        subtitle="Conversions before first send — excluded from all counts as false positives"
      />
    </div>
  );
}
