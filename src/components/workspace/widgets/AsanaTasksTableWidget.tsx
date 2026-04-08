/**
 * Asana Tasks Table Widget
 *
 * Sortable table of Asana tasks with status badges, assignee, section,
 * business impact, priority, and due date.
 * Works for both AI Task Board and Bugs & DI Board entries.
 */

'use client';

import { useMemo, useState } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column, RowData, CellValue } from '@/types/table';
import type { AiTaskBoardEntry, BugsDiBoardEntry } from '@/types/asana-tasks';

type TaskEntry = AiTaskBoardEntry | BugsDiBoardEntry;

function SectionBadge({ section }: { section: string }) {
  let colorClasses = 'light-gray-bg text-content-secondary';

  if (section === 'In progress') {
    colorClasses = 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
  } else if (section === 'Done') {
    colorClasses = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
  } else if (section === 'To do' || section === 'Open') {
    colorClasses = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
  } else if (section === 'Backlog') {
    colorClasses = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
      {section}
    </span>
  );
}

function OverdueIndicator({ days }: { days: number | null }) {
  if (days === null || days <= 0) {
    return <span className="text-content-tertiary text-sm">—</span>;
  }
  return (
    <span className="text-red-600 dark:text-red-400 text-sm font-medium">
      {days}d late
    </span>
  );
}

function BusinessImpactDots({ impact }: { impact: number | null }) {
  if (impact === null) return <span className="text-content-tertiary text-sm">—</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i <= impact ? 'bg-main-500' : 'bg-surface-overlay'}`}
        />
      ))}
    </div>
  );
}

interface AsanaTasksTableWidgetProps {
  data: TaskEntry[];
  variant?: 'ai-board' | 'bugs-board';
}

export function AsanaTasksTableWidget({ data, variant = 'ai-board' }: AsanaTasksTableWidgetProps) {
  const [sortField, setSortField] = useState<string>('section');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const columns: Column[] = useMemo(() => {
    const base: Column[] = [
      {
        field: 'name',
        header: 'Task',
        type: 'text',
        width: 320,
        sortable: true,
        render: (_value: CellValue, row: RowData) => (
          <a
            href={String(row.permalink_url || '')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-main-500 hover:text-main-700 dark:hover:text-main-300 hover:underline truncate block max-w-[300px]"
            title={String(row.name || '')}
          >
            {String(row.name || '')}
          </a>
        ),
      },
      {
        field: 'assignee_name',
        header: 'Assignee',
        type: 'text',
        width: 150,
        sortable: true,
        render: (_value: CellValue, row: RowData) => (
          <span className="text-sm text-content-primary truncate">
            {row.assignee_name ? String(row.assignee_name) : <span className="text-content-tertiary italic">Unassigned</span>}
          </span>
        ),
      },
      {
        field: 'section',
        header: 'Section',
        type: 'text',
        width: 120,
        sortable: true,
        render: (_value: CellValue, row: RowData) => <SectionBadge section={String(row.section || '')} />,
      },
      {
        field: 'due_on',
        header: 'Due',
        type: 'text',
        width: 100,
        sortable: true,
        render: (_value: CellValue, row: RowData) => (
          <span className="text-sm text-content-secondary">
            {row.due_on ? String(row.due_on) : '—'}
          </span>
        ),
      },
      {
        field: 'days_overdue',
        header: 'Delay',
        type: 'number',
        width: 80,
        sortable: true,
        render: (_value: CellValue, row: RowData) => (
          <OverdueIndicator days={row.days_overdue as number | null} />
        ),
      },
    ];

    if (variant === 'ai-board') {
      base.splice(3, 0, {
        field: 'business_impact',
        header: 'Impact',
        type: 'number',
        width: 100,
        sortable: true,
        render: (_value: CellValue, row: RowData) => (
          <BusinessImpactDots impact={row.business_impact as number | null} />
        ),
      });
      base.splice(4, 0, {
        field: 'priority',
        header: 'Priority',
        type: 'text',
        width: 110,
        sortable: true,
        render: (_value: CellValue, row: RowData) => (
          <span className="text-sm">{row.priority ? String(row.priority) : '—'}</span>
        ),
      });
    }

    if (variant === 'bugs-board') {
      base.splice(3, 0, {
        field: 'type',
        header: 'Type',
        type: 'text',
        width: 110,
        sortable: true,
        render: (_value: CellValue, row: RowData) => (
          <span className="text-sm text-content-primary">{row.type ? String(row.type) : '—'}</span>
        ),
      });
      base.splice(4, 0, {
        field: 'module',
        header: 'Module',
        type: 'text',
        width: 120,
        sortable: true,
        render: (_value: CellValue, row: RowData) => (
          <span className="text-sm text-content-secondary">{row.module ? String(row.module) : '—'}</span>
        ),
      });
    }

    return base;
  }, [variant]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = (a as unknown as RowData)[sortField];
      const bVal = (b as unknown as RowData)[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [data, sortField, sortDirection]);

  return (
    <div className="h-full flex flex-col">
      <AxisTable
        columns={columns}
        data={sortedData as unknown as RowData[]}
        sortable
      />
    </div>
  );
}
