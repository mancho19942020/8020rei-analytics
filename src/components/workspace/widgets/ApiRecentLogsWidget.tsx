/**
 * API Recent Logs Widget
 *
 * Paginated table showing recent API call logs.
 * Uses AxisTable with custom cell renderers for status badges.
 */

'use client';

import { useMemo, useCallback } from 'react';
import { AxisTable, AxisButton } from '@/components/axis';
import type { Column, RowData } from '@/types/table';

interface LogEntry {
  id: number;
  apiTokenId: number;
  clientId: number;
  domain: string;
  endpoint: string;
  httpMethod: string;
  responseStatus: number;
  resultsCount: number | null;
  responseTimeMs: number;
  ipAddress: string;
  userAgent: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface ApiRecentLogsWidgetProps {
  data: LogEntry[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
}

function formatTimestamp(ts: string): string {
  if (!ts) return '';
  const d = new Date(ts.replace(' ', 'T') + (ts.includes('Z') ? '' : 'Z'));
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDomain(raw: string): string {
  if (!raw || raw === 'unknown') return 'Unknown';
  const match = raw.match(/^(.+?)_8020rei_/);
  if (match) return match[1];
  return raw.replace(/_/g, '.');
}

const columns: Column[] = [
  {
    field: 'createdAtFormatted',
    header: 'Time',
    type: 'text',
    width: 140,
    sortable: true,
  },
  { field: 'domainFormatted', header: 'Domain', type: 'text', width: 100, sortable: true },
  {
    field: 'shortEndpoint',
    header: 'Endpoint',
    type: 'text',
    width: 160,
    sortable: true,
  },
  { field: 'httpMethod', header: 'Method', type: 'text', width: 70, sortable: true },
  { field: 'responseStatus', header: 'Status', type: 'number', width: 70, sortable: true },
  { field: 'responseTimeMs', header: 'Time (ms)', type: 'number', width: 80, sortable: true },
  { field: 'resultsCount', header: 'Results', type: 'number', width: 70, sortable: true },
  { field: 'ipAddress', header: 'IP', type: 'text', width: 120, sortable: true },
];

export function ApiRecentLogsWidget({ data, pagination, onPageChange }: ApiRecentLogsWidgetProps) {
  const tableData = useMemo(
    () =>
      data.map((log) => ({
        ...log,
        createdAtFormatted: formatTimestamp(log.createdAt),
        domainFormatted: formatDomain(log.domain),
        shortEndpoint: log.endpoint.replace('/api/v1/public/', ''),
        resultsCount: log.resultsCount ?? '—',
      })),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No API calls recorded yet
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={tableData}
          rowKey="id"
          sortable
          defaultPageSize={15}
          rowLabel="logs"
        />
      </div>
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-stroke">
          <AxisButton
            size="sm"
            variant="outlined"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </AxisButton>
          <span className="text-xs text-content-secondary">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <AxisButton
            size="sm"
            variant="outlined"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
          </AxisButton>
        </div>
      )}
    </div>
  );
}
