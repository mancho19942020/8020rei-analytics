'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column, RowData } from '@/types/table';

interface VisitorLogEntry {
  session_id: string;
  user_email: string;
  user_name: string;
  session_start: { value: string } | string;
  session_end: { value: string } | string;
  duration_seconds: number;
  event_count: number;
  most_used_section: string;
}

interface PaVisitorLogWidgetProps {
  data: VisitorLogEntry[];
}

function formatTimestamp(ts: unknown): string {
  if (!ts) return '—';
  const raw = typeof ts === 'object' && ts !== null && 'value' in ts
    ? (ts as { value: string }).value : String(ts);
  const d = new Date(raw);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(seconds: unknown): string {
  const s = Number(seconds);
  if (!s || s < 0) return '< 1m';
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function formatSectionLabel(section: unknown): string {
  return String(section || 'N/A')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function PaVisitorLogWidget({ data }: PaVisitorLogWidgetProps) {
  const columns: Column[] = useMemo(() => [
    {
      field: 'user_name',
      header: 'User',
      sortable: true,
      render: (_value, row: RowData) => (
        <div>
          <div className="text-content-primary font-medium text-sm">{String(row.user_name)}</div>
          <div className="text-content-tertiary text-xs">{String(row.user_email)}</div>
        </div>
      ),
    },
    {
      field: 'session_start',
      header: 'Login time',
      sortable: true,
      render: (_value, row: RowData) => (
        <span className="text-sm text-content-secondary">{formatTimestamp(row.session_start)}</span>
      ),
    },
    {
      field: 'duration_seconds',
      header: 'Duration',
      sortable: true,
      render: (_value, row: RowData) => (
        <span className="text-sm text-content-secondary">{formatDuration(row.duration_seconds)}</span>
      ),
    },
    {
      field: 'event_count',
      header: 'Actions',
      sortable: true,
      type: 'number' as const,
    },
    {
      field: 'most_used_section',
      header: 'Most used section',
      sortable: true,
      render: (_value, row: RowData) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-raised text-content-secondary border border-stroke">
          {formatSectionLabel(row.most_used_section)}
        </span>
      ),
    },
  ], []);

  const tableData: RowData[] = data as unknown as RowData[];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={tableData}
          rowKey="session_id"
        />
      </div>
    </div>
  );
}
