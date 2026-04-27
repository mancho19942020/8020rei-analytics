/**
 * Q2 Top Contributors Widget
 *
 * Per-client contribution to Q2 volume. 4 columns: Client, Pieces sent,
 * Pieces delivered, Share. The Pieces sent column reconciles back to the
 * Q2 volume goal hero (sum across all rows = 15.8K dispatched); Pieces
 * delivered is the subset of those that USPS confirmed in mailboxes.
 * Showing both side-by-side prevents the "why doesn't this match the
 * hero?" confusion when a viewer scans the table.
 *
 * Data sources:
 * - Pieces sent: PCM /order grouped by domain over Q2 window (matches the
 *   Q2 hero's source exactly).
 * - Pieces delivered: rr_daily_metrics.delivered_count grouped by domain
 *   over Q2 — independent of PCM since /order doesn't carry USPS state.
 *
 * Clickable: domain name filters the platform; counts open the property
 * drilldown for that status.
 */

'use client';

import { useState, useCallback } from 'react';
import { AxisTable } from '@/components/axis';
import { DmPropertyDrilldownModal } from './DmPropertyDrilldownModal';
import type { DrilldownStatus } from './DmPropertyDrilldownModal';
import type { Column, CellValue, RowData } from '@/types/table';
import type { RrQ2GoalClientRow } from '@/types/rapid-response';

interface RrQ2TopContributorsWidgetProps {
  data: RrQ2GoalClientRow[];
  /** @deprecated kept for backward-compatible call sites; no longer used after dropping "% of goal" */
  target?: number;
  onDomainClick?: (domain: string) => void;
}

function formatDomain(domain: string): string {
  return domain.replace(/_8020rei_com$/, '').replace(/_/g, ' ');
}

export function RrQ2TopContributorsWidget({ data, onDomainClick }: RrQ2TopContributorsWidgetProps) {
  const [drilldown, setDrilldown] = useState<{
    open: boolean;
    domain: string;
    status: DrilldownStatus;
    count: number;
  }>({ open: false, domain: '', status: 'delivered', count: 0 });

  const openDrilldown = useCallback((domain: string, status: DrilldownStatus, count: number) => {
    setDrilldown({ open: true, domain, status, count });
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldown(prev => ({ ...prev, open: false }));
  }, []);

  const totalSentAll = data.reduce((sum, r) => sum + r.totalSends, 0);

  const columns: Column[] = [
    {
      field: 'domain',
      header: 'Client',
      minWidth: 120,
      headerTooltip: 'Client domain with sends in Q2 2026. Click to filter the whole platform to this client.',
      render: (value: CellValue) => (
        <span
          className="font-medium capitalize cursor-pointer hover:underline"
          style={{ color: 'var(--color-main-500)' }}
          onClick={(e) => {
            e.stopPropagation();
            onDomainClick?.(String(value || ''));
          }}
        >
          {formatDomain(String(value || ''))}
        </span>
      ),
    },
    {
      field: 'totalSends',
      header: 'Pieces sent',
      type: 'number',
      width: 120,
      minWidth: 100,
      align: 'center',
      headerTooltip: 'Mail pieces dispatched to PCM in Q2 (April 1 – June 30). Source: PCM /order grouped by domain. Sum across all rows reconciles to the Q2 volume goal hero (left tile) — same source, same window.',
      render: (value: CellValue, row: RowData) => {
        const count = Number(value || 0);
        if (count === 0) return <span style={{ color: 'var(--text-tertiary)' }}>0</span>;
        return (
          <button
            type="button"
            className="cursor-pointer hover:underline font-medium bg-transparent border-0 p-0"
            style={{ color: 'var(--color-main-500)' }}
            onClick={(e) => {
              e.stopPropagation();
              openDrilldown(String(row?.domain || ''), 'sent', count);
            }}
            title={`View ${count.toLocaleString()} dispatched pieces`}
          >
            {count.toLocaleString()}
          </button>
        );
      },
    },
    {
      field: 'deliveredCount',
      header: 'Pieces delivered',
      type: 'number',
      width: 140,
      minWidth: 110,
      align: 'center',
      headerTooltip: 'Of pieces this client dispatched in Q2, how many USPS confirmed in a mailbox. Source: rr_daily_metrics.delivered_count, summed by client. Always ≤ Pieces sent (the rest are in transit, returned, or undeliverable).',
      render: (value: CellValue, row: RowData) => {
        const count = Number(value || 0);
        if (count === 0) return <span style={{ color: 'var(--text-tertiary)' }}>0</span>;
        return (
          <button
            type="button"
            className="cursor-pointer hover:underline font-medium bg-transparent border-0 p-0"
            style={{ color: 'var(--color-success-600, #16a34a)' }}
            onClick={(e) => {
              e.stopPropagation();
              openDrilldown(String(row?.domain || ''), 'delivered', count);
            }}
            title={`View ${count.toLocaleString()} delivered properties`}
          >
            {count.toLocaleString()}
          </button>
        );
      },
    },
    {
      field: 'share',
      header: 'Share',
      width: 90,
      minWidth: 70,
      align: 'center',
      headerTooltip: 'This client\'s share of all Q2 dispatched pieces — sums to 100% across all rows, and the absolute counts in Pieces sent reconcile to the 15.8K Q2 hero on the left.',
      render: (_value: CellValue, row: RowData) => {
        const sent = Number(row?.totalSends || 0);
        const pct = totalSentAll > 0 ? ((sent / totalSentAll) * 100).toFixed(1) : '0.0';
        return (
          <span style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
        );
      },
    },
  ];

  // Aggregate by domain (may have multiple rows per domain if both rr + smartdrop)
  const byDomain = new Map<string, { totalSends: number; lifetimeSends: number; deliveredCount: number }>();
  for (const row of data) {
    const existing = byDomain.get(row.domain);
    if (existing) {
      existing.totalSends += row.totalSends;
      existing.deliveredCount += row.deliveredCount;
      existing.lifetimeSends = Math.max(existing.lifetimeSends, row.lifetimeSends);
    } else {
      byDomain.set(row.domain, {
        totalSends: row.totalSends,
        lifetimeSends: row.lifetimeSends,
        deliveredCount: row.deliveredCount,
      });
    }
  }

  const tableData = Array.from(byDomain.entries())
    .map(([domain, vals]) => ({
      id: domain,
      domain,
      totalSends: vals.totalSends,
      lifetimeSends: vals.lifetimeSends,
      deliveredCount: vals.deliveredCount,
    }))
    .sort((a, b) => b.totalSends - a.totalSends);

  return (
    <>
      <div className="h-full overflow-hidden">
        <AxisTable
          columns={columns}
          data={tableData}
          rowKey="id"
          sortable
          paginated={false}
          emptyMessage="No sends recorded in Q2 yet"
          rowLabel="clients"
        />
      </div>
      <DmPropertyDrilldownModal
        open={drilldown.open}
        onClose={closeDrilldown}
        domain={drilldown.domain}
        status={drilldown.status}
        expectedCount={drilldown.count}
      />
    </>
  );
}
