/**
 * API Error Tracker Widget
 *
 * Table showing error breakdowns grouped by status code and message.
 * Uses AxisTable following established patterns.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';

interface ErrorEntry {
  responseStatus: number;
  errorMessage: string | null;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  affectedClients: number;
}

interface ApiErrorTrackerWidgetProps {
  data: ErrorEntry[];
}

function formatTimestamp(ts: string): string {
  if (!ts) return '';
  const d = new Date(ts.replace(' ', 'T') + (ts.includes('Z') ? '' : 'Z'));
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const columns: Column[] = [
  { field: 'responseStatus', header: 'Status', type: 'number', width: 70, sortable: true },
  { field: 'errorMessage', header: 'Error message', type: 'text', width: 240, sortable: true },
  { field: 'occurrences', header: 'Count', type: 'number', width: 70, sortable: true },
  { field: 'affectedClients', header: 'Clients', type: 'number', width: 70, sortable: true },
  { field: 'lastSeenFormatted', header: 'Last seen', type: 'text', width: 140, sortable: true },
];

export function ApiErrorTrackerWidget({ data }: ApiErrorTrackerWidgetProps) {
  const tableData = useMemo(
    () =>
      data.map((e, i) => ({
        id: i,
        responseStatus: e.responseStatus,
        errorMessage: e.errorMessage || '—',
        occurrences: e.occurrences,
        affectedClients: e.affectedClients,
        lastSeenFormatted: formatTimestamp(e.lastSeen),
      })),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No errors recorded for this period
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
        rowLabel="errors"
      />
    </div>
  );
}
