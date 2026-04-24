/**
 * Auto Export Failure Reasons Widget
 *
 * Top 10 failure messages grouped from auto_export_run_log where status='failed'.
 * Truncates the error_message for the cell and shows the full text in a
 * native title tooltip (keeps the row compact).
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';
import type { AutoExportFailureReason } from '@/types/auto-export';

interface AutoExportFailureReasonsWidgetProps {
  data: AutoExportFailureReason[];
}

function formatTimestamp(ts: string): string {
  if (!ts) return '';
  const d = new Date(ts.replace(' ', 'T') + (ts.includes('Z') ? '' : 'Z'));
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function truncate(s: string, n = 90): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

const columns: Column[] = [
  { field: 'errorMessageShort', header: 'Error message', type: 'text', width: 260, sortable: true },
  { field: 'occurrences', header: 'Count', type: 'number', width: 70, sortable: true },
  { field: 'affectedDomains', header: 'Domains', type: 'number', width: 80, sortable: true },
  { field: 'affectedConfigs', header: 'Configs', type: 'number', width: 80, sortable: true },
  { field: 'lastSeenFormatted', header: 'Last seen', type: 'text', width: 140, sortable: true },
];

export function AutoExportFailureReasonsWidget({ data }: AutoExportFailureReasonsWidgetProps) {
  const tableData = useMemo(
    () =>
      data.map((e, i) => ({
        id: i,
        errorMessageShort: truncate(e.errorMessage),
        errorMessage: e.errorMessage,
        occurrences: e.occurrences,
        affectedDomains: e.affectedDomains,
        affectedConfigs: e.affectedConfigs,
        lastSeenFormatted: formatTimestamp(e.lastSeen),
      })),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No failed runs in this period
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <AxisTable
        columns={columns}
        data={tableData}
        rowKey="id"
        sortable
        defaultPageSize={10}
        rowLabel="reasons"
      />
    </div>
  );
}
