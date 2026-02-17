/**
 * Projects Table Widget
 *
 * Displays a sortable, paginated table of project entries with columns for
 * issue key, summary, status, assignee, due date, story point progress,
 * and days of delay. Status and delay columns use colored badges.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';
import type { ProjectEntry } from '@/types/product';

interface ProjectsTableWidgetProps {
  data: ProjectEntry[];
}

/** Renders a colored status badge based on status text */
function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  let colorClasses = 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';

  if (normalized === 'ON TRACK') {
    colorClasses = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
  } else if (normalized === 'OVERDUE' || normalized === 'DELAYED') {
    colorClasses = 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
  } else if (normalized === 'IN PROGRESS') {
    colorClasses = 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
      {status}
    </span>
  );
}

/** Renders story point progress as "completed / total" */
function SPProgress({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-main-600 dark:bg-main-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-content-secondary whitespace-nowrap tabular-nums">
        {completed}/{total}
      </span>
    </div>
  );
}

/** Renders days of delay with color coding */
function DelayIndicator({ days }: { days: number }) {
  if (days <= 0) {
    return <span className="text-green-600 dark:text-green-400 text-sm font-medium">On time</span>;
  }
  return (
    <span className="text-red-600 dark:text-red-400 text-sm font-medium">
      {days}d late
    </span>
  );
}

export function ProjectsTableWidget({ data }: ProjectsTableWidgetProps) {
  // Define table columns
  const columns: Column[] = useMemo(
    () => [
      {
        field: 'issue_key',
        header: 'Key',
        type: 'text',
        width: 100,
        sortable: true,
      },
      {
        field: 'summary',
        header: 'Summary',
        type: 'text',
        width: 250,
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status',
        type: 'text',
        width: 120,
        sortable: true,
      },
      {
        field: 'assignee',
        header: 'Assignee',
        type: 'text',
        width: 140,
        sortable: true,
      },
      {
        field: 'due_date',
        header: 'Due Date',
        type: 'date',
        width: 120,
        sortable: true,
      },
      {
        field: 'sp_progress',
        header: 'SP Progress',
        type: 'text',
        width: 150,
        sortable: false,
      },
      {
        field: 'days_of_delay',
        header: 'Delay',
        type: 'number',
        width: 100,
        sortable: true,
      },
    ],
    []
  );

  // Transform data to include custom rendered columns
  const tableData = useMemo(() => {
    return data.map((row) => ({
      ...row,
      sp_progress: `${row.story_points_completed}/${row.story_points_total}`,
    }));
  }, [data]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={tableData}
          rowKey="issue_key"
          sortable
          paginated
          defaultPageSize={10}
          rowLabel="projects"
        />
      </div>
    </div>
  );
}
