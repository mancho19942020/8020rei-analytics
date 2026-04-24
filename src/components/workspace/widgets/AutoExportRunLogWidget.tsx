/**
 * Auto Export Run Log Widget
 *
 * Paginated row-per-run table. Source: auto_export_run_log ordered by
 * created_at DESC with optional status filter (wired at the API layer).
 */

'use client';

import { useMemo } from 'react';
import { AxisTable, AxisButton } from '@/components/axis';
import type { Column } from '@/types/table';
import type { AutoExportRunLogEntry, AutoExportRunLogPagination } from '@/types/auto-export';

interface AutoExportRunLogWidgetProps {
  data: AutoExportRunLogEntry[];
  pagination: AutoExportRunLogPagination;
  onPageChange: (page: number) => void;
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts.replace(' ', 'T') + (ts.includes('Z') ? '' : 'Z'));
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDomain(raw: string): string {
  if (!raw) return 'Unknown';
  const match = raw.match(/^(.+?)_8020rei_/);
  if (match) return match[1];
  return raw.replace(/_/g, '.');
}

const columns: Column[] = [
  { field: 'createdAtFormatted', header: 'Run time', type: 'text', width: 140, sortable: true },
  { field: 'domainFormatted', header: 'Domain', type: 'text', width: 110, sortable: true },
  { field: 'configuredFilterName', header: 'Filter', type: 'text', width: 160, sortable: true },
  { field: 'frequency', header: 'Frequency', type: 'text', width: 90, sortable: true },
  { field: 'filterPropertiesBy', header: 'Filter by', type: 'text', width: 100, sortable: true },
  { field: 'status', header: 'Status', type: 'text', width: 90, sortable: true },
  { field: 'retryCount', header: 'Retries', type: 'number', width: 70, sortable: true },
  { field: 'durationSeconds', header: 'Duration (s)', type: 'number', width: 100, sortable: true },
  { field: 'propertiesCount', header: 'Properties', type: 'number', width: 100, sortable: true },
  { field: 'recipientsCount', header: 'Recipients', type: 'number', width: 90, sortable: true },
];

export function AutoExportRunLogWidget({ data, pagination, onPageChange }: AutoExportRunLogWidgetProps) {
  const tableData = useMemo(
    () =>
      data.map((row) => ({
        ...row,
        createdAtFormatted: formatTimestamp(row.createdAt),
        domainFormatted: formatDomain(row.domain),
        configuredFilterName: row.configuredFilterName ?? '—',
        propertiesCount: row.propertiesCount ?? '—',
        durationSeconds: row.durationSeconds ?? '—',
      })),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm text-center px-4">
        No auto export runs recorded yet. Rows populate once the monolith sync job runs.
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
          rowLabel="runs"
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
