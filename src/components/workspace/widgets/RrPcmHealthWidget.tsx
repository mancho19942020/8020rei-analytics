/**
 * Rapid Response PCM Health Widget
 *
 * "Is it aligned?" — Domain-focused alignment health.
 * Shows how many domains are synced with PCM, plus issue breakdown.
 *
 * Color system:
 *   Green  — good (no issues or below noise threshold)
 *   Amber  — warning (needs monitoring but not critical)
 *   Red    — critical (requires investigation)
 */

'use client';

import { AxisPill } from '@/components/axis';
import type { RrPcmHealth } from '@/types/rapid-response';

interface RrPcmHealthWidgetProps {
  data: RrPcmHealth;
}

/** Headline color based on % of domains with issues */
function headlineColor(totalDomains: number, domainsWithIssues: number): string {
  if (domainsWithIssues === 0) return 'var(--color-success-500)';
  const pct = (domainsWithIssues / totalDomains) * 100;
  if (pct <= 5) return 'var(--color-alert-500)';    // <= 5% with issues = warning
  return 'var(--color-error-500)';                    // > 5% = critical
}

/** AxisPill type based on thresholds */
function pillType(value: number, warnThreshold: number, critThreshold: number): 'good' | 'default' | 'bad' {
  if (value === 0) return 'good';
  if (value <= warnThreshold) return 'default';
  if (value <= critThreshold) return 'default';
  return 'bad';
}

export function RrPcmHealthWidget({ data }: RrPcmHealthWidgetProps) {
  const totalDomains = data.totalDomains ?? 0;
  const syncedDomains = data.syncedDomains ?? 0;
  // Use the max of any category as "affected domains" (domains can appear in multiple)
  const affectedDomains = Math.max(data.domainsWithGaps ?? 0, data.domainsWithStale ?? 0, data.domainsWithOrphaned ?? 0);

  return (
    <div className="flex flex-col gap-1 h-full p-3 overflow-hidden">
      {/* Headline: domain-focused summary */}
      <div className="flex items-baseline gap-2 pb-1 mb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {totalDomains > 0 ? (
          <>
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: headlineColor(totalDomains, affectedDomains) }}
            >
              {syncedDomains}/{totalDomains}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {syncedDomains === totalDomains
                ? 'domains fully synced with PCM'
                : `domains synced \u00B7 ${affectedDomains} with issues`}
            </span>
          </>
        ) : (
          <>
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--text-tertiary)' }}
            >
              —
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              No alignment data for this period
            </span>
          </>
        )}
      </div>
      <AxisPill
        label="Stale sent (14d+)"
        value={data.staleSentCount}
        type={pillType(data.staleSentCount, 10, 50)}
        tooltip="Mailings submitted to PCM more than 14 days ago with no delivery confirmation. A few (<10) can be normal — some addresses are permanently unconfirmed by the postal service. 10-50 is a warning. Over 50 suggests the PCM status pipeline may be broken."
      />
      <AxisPill
        label="Orphaned orders"
        value={data.orphanedOrdersCount}
        type={pillType(data.orphanedOrdersCount, 5, 20)}
        tooltip="Mailings dispatched from our platform that never received a tracking ID from PCM. Under 5 can result from transient API timeouts. 5-20 is a warning. Over 20 means the PCM API is failing for certain domains."
      />
      <AxisPill
        label="Sync gap"
        value={data.backOfficeSyncGap}
        type={pillType(data.backOfficeSyncGap, 50, 200)}
        tooltip="Orders PCM accepted minus orders our back-office recorded, summed across all domains. Under 50 is normal pipeline delay. 50-200 is a warning. Over 200 means data is not flowing back from PCM and specific domains need investigation."
      />
      <AxisPill
        label="Delivery lag (median)"
        value={`${data.deliveryLagMedianDays} days`}
        type={data.deliveryLagMedianDays > 10 ? 'bad' : data.deliveryLagMedianDays > 7 ? 'default' : 'good'}
        tooltip="Median days between submitting a mailing to PCM and receiving a delivery confirmation. Under 7 days is normal. Over 10 may indicate processing delays at PCM or postal slowdowns."
      />
      <AxisPill
        label="Undeliverable (7d)"
        value={`${data.undeliverableRate7d}%`}
        type={data.undeliverableRate7d > 10 ? 'bad' : data.undeliverableRate7d > 5 ? 'default' : 'good'}
        tooltip="Percentage of mailings marked undeliverable by the postal service in the last 7 days — bad addresses, vacant properties, or returned mail. Under 5% is normal. Over 10% warrants address list review."
      />
    </div>
  );
}
