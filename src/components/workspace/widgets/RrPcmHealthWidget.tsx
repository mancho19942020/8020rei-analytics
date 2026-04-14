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
  const totalIssues = data.staleSentCount + data.orphanedOrdersCount + data.backOfficeSyncGap;
  const issueColor = totalIssues === 0
    ? 'var(--color-success-500)'
    : totalIssues <= 5
      ? 'var(--color-alert-500)'
      : 'var(--color-error-500)';
  return (
    <div className="flex flex-col gap-1 h-full p-3 overflow-hidden">
      {/* Headline number */}
      <div className="flex items-baseline gap-2 pb-1 mb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: issueColor }}
        >
          {totalIssues}
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
          {totalIssues === 1 ? 'issue' : 'issues'} detected
        </span>
      </div>
      <AxisPill
        label="Stale sent (14d+)"
        value={data.staleSentCount}
        type={data.staleSentCount > 0 ? 'bad' : 'good'}
        tooltip="Mailings that were submitted to the print vendor more than 14 days ago but never received a delivery confirmation. If this number is above 0, the status update pipeline from PCM may be broken."
      />
      <AxisPill
        label="Orphaned orders"
        value={data.orphanedOrdersCount}
        type={data.orphanedOrdersCount > 0 ? 'bad' : 'good'}
        tooltip="Mailings that were sent from our platform but never received a tracking ID from PCM. This means the print vendor either rejected them silently or the API call failed. These orders cannot be tracked."
      />
      <AxisPill
        label="Sync gap"
        value={data.backOfficeSyncGap}
        type={data.backOfficeSyncGap !== 0 ? 'bad' : 'good'}
        tooltip="Difference between orders PCM accepted and orders our back-office knows about. Related to the 'Delta' shown in PCM & profitability (PCM orders − Aurora sends). A non-zero value means the systems are out of sync. Source: rr_pcm_alignment.back_office_sync_gap."
      />
      <AxisPill
        label="Delivery lag (median)"
        value={`${data.deliveryLagMedianDays} days`}
        type={data.deliveryLagMedianDays > 10 ? 'bad' : 'default'}
        tooltip="The typical number of days between sending a mailing and receiving a delivery confirmation from PCM. Normal is 3-7 days. If this rises above 10, it may indicate processing delays."
      />
      <AxisPill
        label="Undeliverable (7d)"
        value={`${data.undeliverableRate7d}%`}
        type={data.undeliverableRate7d > 10 ? 'bad' : 'default'}
        tooltip="The percentage of mailings marked as undeliverable in the last 7 days — meaning the postal service could not deliver them (bad address, vacant property, etc.)."
      />
    </div>
  );
}
