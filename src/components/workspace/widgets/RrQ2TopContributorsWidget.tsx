/**
 * Q2 Top Contributors Widget
 *
 * Shows per-client contribution toward the Q2 400K DM pieces goal.
 * Uses AxisTable for a proper design-system-compliant table.
 * Data source: dm_volume_summary (per unified data model handoff).
 *
 * Clickable: domain name filters the platform, pieces sent opens property drilldown modal.
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
  target: number;
  onDomainClick?: (domain: string) => void;
}

function formatDomain(domain: string): string {
  return domain.replace(/_8020rei_com$/, '').replace(/_/g, ' ');
}

export function RrQ2TopContributorsWidget({ data, target, onDomainClick }: RrQ2TopContributorsWidgetProps) {
  const [drilldown, setDrilldown] = useState<{
    open: boolean;
    domain: string;
    status: DrilldownStatus;
    count: number;
  }>({ open: false, domain: '', status: 'sent', count: 0 });

  const openDrilldown = useCallback((domain: string, status: DrilldownStatus, count: number) => {
    setDrilldown({ open: true, domain, status, count });
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldown(prev => ({ ...prev, open: false }));
  }, []);

  const totalSendsAll = data.reduce((sum, r) => sum + r.totalSends, 0);

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
      width: 110,
      minWidth: 80,
      align: 'center',
      headerTooltip: 'Mail pieces dispatched by this client during Q2 (April 1 - June 30). Click to see individual properties.',
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
            title={`View ${count} sent properties`}
          >
            {count.toLocaleString()}
          </button>
        );
      },
    },
    {
      field: 'contribution',
      header: '% of goal',
      width: 100,
      minWidth: 70,
      align: 'center',
      headerTooltip: 'This client\'s Q2 sends as a percentage of the 400K target.',
      render: (_value: CellValue, row: RowData) => {
        const sends = Number(row?.totalSends || 0);
        const pct = target > 0 ? ((sends / target) * 100).toFixed(2) : '0.00';
        return (
          <span style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
        );
      },
    },
    {
      field: 'share',
      header: 'Share',
      width: 90,
      minWidth: 70,
      align: 'center',
      headerTooltip: 'This client\'s share of all Q2 sends across all clients.',
      render: (_value: CellValue, row: RowData) => {
        const sends = Number(row?.totalSends || 0);
        const pct = totalSendsAll > 0 ? ((sends / totalSendsAll) * 100).toFixed(1) : '0.0';
        return (
          <span style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
        );
      },
    },
  ];

  // Aggregate by domain (may have multiple rows per domain if both rr + smartdrop)
  const byDomain = new Map<string, { totalSends: number; lifetimeSends: number }>();
  for (const row of data) {
    const existing = byDomain.get(row.domain);
    if (existing) {
      existing.totalSends += row.totalSends;
      existing.lifetimeSends = Math.max(existing.lifetimeSends, row.lifetimeSends);
    } else {
      byDomain.set(row.domain, { totalSends: row.totalSends, lifetimeSends: row.lifetimeSends });
    }
  }

  const tableData = Array.from(byDomain.entries())
    .map(([domain, vals]) => ({
      id: domain,
      domain,
      totalSends: vals.totalSends,
      lifetimeSends: vals.lifetimeSends,
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
