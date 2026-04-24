/**
 * Auto Export Top Clients Widget
 *
 * Leaderboard of the top 10 tenants by runs in the selected window. Joins
 * window metrics (auto_export_daily_metrics) with the latest config snapshot
 * so we can show active_configs alongside activity.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';
import type { AutoExportTopClient } from '@/types/auto-export';

interface AutoExportTopClientsWidgetProps {
  data: AutoExportTopClient[];
}

function formatDomain(raw: string): string {
  if (!raw) return 'Unknown';
  const match = raw.match(/^(.+?)_8020rei_/);
  if (match) return match[1];
  return raw.replace(/_/g, '.');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const columns: Column[] = [
  { field: 'domainFormatted', header: 'Domain', type: 'text', width: 140, sortable: true },
  { field: 'activeConfigs', header: 'Configs', type: 'number', width: 80, sortable: true },
  { field: 'runs', header: 'Runs', type: 'number', width: 80, sortable: true },
  { field: 'successRatePct', header: 'Success %', type: 'number', width: 100, sortable: true },
  { field: 'propertiesExported', header: 'Properties', type: 'number', width: 110, sortable: true },
  { field: 'lastActivityFormatted', header: 'Last run', type: 'text', width: 110, sortable: true },
];

export function AutoExportTopClientsWidget({ data }: AutoExportTopClientsWidgetProps) {
  const tableData = useMemo(
    () =>
      data.map((c) => ({
        ...c,
        domainFormatted: formatDomain(c.domain),
        successRatePct: Math.round(c.successRate * 1000) / 10,
        lastActivityFormatted: formatDate(c.lastActivity),
      })),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No client activity in this period
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <AxisTable
        columns={columns}
        data={tableData}
        rowKey="domain"
        sortable
        defaultPageSize={10}
        rowLabel="domains"
      />
    </div>
  );
}
