/**
 * "Is it aligned?" — alignment between OUR records and PCM's records.
 *
 * Three alignment signals, each per-domain:
 *   • Sync gap — PCM order count vs our Aurora order count
 *   • Stale sent — mail pieces awaiting delivery confirmation > 14 days
 *   • Orphaned orders — mail we sent that never got a PCM tracking ID
 *
 * Postal-service signals (delivery lag, undeliverable rate) live in a separate
 * "Postal performance" widget — those are about the post office, not our
 * records alignment.
 *
 * Active vs legacy: flagged domains are tagged [active] (currently-running DM
 * campaign → priority to fix) or [legacy] (DM-enrolled but not active → cleanup
 * queue). Same pill shows both, sorted active first.
 */

'use client';

import { useState } from 'react';
import { AxisPill, AxisButton } from '@/components/axis';
import { RrPcmAttentionModal } from '@/components/dashboard/RrPcmAttentionModal';
import type { RrPcmHealth, RrPcmDomainIssue } from '@/types/rapid-response';

interface RrPcmHealthWidgetProps {
  data: RrPcmHealth;
}

/** Headline color based on % of domains with actionable issues */
function headlineColor(totalDomains: number, domainsWithIssues: number): string {
  if (domainsWithIssues === 0) return 'var(--color-success-500)';
  const pct = (domainsWithIssues / totalDomains) * 100;
  if (pct <= 5) return 'var(--color-alert-500)';
  return 'var(--color-error-500)';
}

/** AxisPill type based on thresholds */
function pillType(value: number, warnThreshold: number, critThreshold: number): 'good' | 'default' | 'bad' {
  if (value === 0) return 'good';
  if (value <= warnThreshold) return 'default';
  if (value <= critThreshold) return 'default';
  return 'bad';
}

/** Strip `_8020rei_com` suffix so domains read cleanly in tooltips. */
function formatDomain(d: string): string {
  return d.replace(/_8020rei_com$/, '').replace(/_/g, ' ');
}

/** Sort: active-first, then by value descending. */
function sortActiveFirst(domains: RrPcmDomainIssue[]): RrPcmDomainIssue[] {
  return [...domains].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return b.value - a.value;
  });
}

export function RrPcmHealthWidget({ data }: RrPcmHealthWidgetProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const totalDomains = data.totalDomains ?? 0;
  // A domain can appear in multiple issue buckets — dedupe by domain name.
  const flaggedDomains = new Set<string>();
  [...(data.gapDomains ?? []), ...(data.staleDomains ?? []), ...(data.orphanedDomains ?? [])].forEach((d) =>
    flaggedDomains.add(d.domain)
  );
  const affectedDomains = flaggedDomains.size;
  const syncedDomains = Math.max(0, totalDomains - affectedDomains);

  return (
    <div className="flex flex-col gap-1 h-full p-3 overflow-hidden">
      {/* Headline */}
      <div className="pb-1 mb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {totalDomains > 0 ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-2xl font-bold tracking-tight"
                style={{ color: headlineColor(totalDomains, affectedDomains) }}
              >
                {syncedDomains}/{totalDomains}
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                domains aligned with PCM
              </span>
              {affectedDomains > 0 && (
                <div className="ml-auto">
                  <AxisButton
                    variant="outlined"
                    size="sm"
                    onClick={() => setModalOpen(true)}
                    iconRight={
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    }
                  >
                    Review {affectedDomains} flagged · copy for Slack
                  </AxisButton>
                </div>
              )}
            </div>
            <div
              className="text-[11px] mt-0.5 italic"
              style={{ color: 'var(--text-secondary)', opacity: 0.85 }}
            >
              Pipeline lag under 50 orders is normal — not a misalignment.
            </div>
          </>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-tertiary)' }}>
              —
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              No alignment data for this period
            </span>
          </div>
        )}
      </div>
      <AxisPill
        label="Stale sent (14d+)"
        value={data.staleSentCount}
        type={pillType(data.staleSentCount, 10, 50)}
        tooltip={
          data.staleDomains && data.staleDomains.length > 0
            ? `Mail 14+ days old with no delivery confirmation. Affected: ${sortActiveFirst(data.staleDomains).map(d => `${formatDomain(d.domain)} ${d.isActive ? '[active]' : '[legacy]'} — ${d.value}${d.detail ? ' (' + d.detail + ')' : ''}`).join(', ')}`
            : 'Mail 14+ days old with no delivery confirmation. Under 10 per domain is normal.'
        }
      />
      <AxisPill
        label="Orphaned orders"
        value={data.orphanedOrdersCount}
        type={pillType(data.orphanedOrdersCount, 5, 20)}
        tooltip={
          data.orphanedDomains && data.orphanedDomains.length > 0
            ? `Mail we sent with no PCM tracking ID. Affected: ${sortActiveFirst(data.orphanedDomains).map(d => `${formatDomain(d.domain)} ${d.isActive ? '[active]' : '[legacy]'} — ${d.value}`).join(', ')}`
            : 'Mail we sent with no PCM tracking ID. Under 5 per domain is normal.'
        }
      />
      <AxisPill
        label="Sync gap"
        value={data.backOfficeSyncGap}
        type={pillType(data.backOfficeSyncGap, 50, 200)}
        tooltip={
          data.gapDomains && data.gapDomains.length > 0
            ? `PCM order count − our record count. Affected: ${sortActiveFirst(data.gapDomains).map(d => `${formatDomain(d.domain)} ${d.isActive ? '[active]' : '[legacy]'} — ${d.value} orders`).join(', ')}`
            : 'PCM order count − our record count. Under 50 per domain is normal pipeline delay.'
        }
      />
      <RrPcmAttentionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        gapDomains={data.gapDomains ?? []}
        staleDomains={data.staleDomains ?? []}
        orphanedDomains={data.orphanedDomains ?? []}
      />
    </div>
  );
}
