/**
 * Team Workload Widget
 *
 * Displays a sortable, paginated table of team member workload data.
 * Shows assignee, total tasks, completed tasks, in-progress tasks,
 * and delayed tasks. Delayed tasks are highlighted in red when > 0.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';
import type { TeamWorkloadEntry } from '@/types/product';

interface TeamWorkloadWidgetProps {
  data: TeamWorkloadEntry[];
}

export function TeamWorkloadWidget({ data }: TeamWorkloadWidgetProps) {
  // Define table columns
  const columns: Column[] = useMemo(
    () => [
      {
        field: 'assignee',
        header: 'Assignee',
        type: 'text',
        width: 180,
        sortable: true,
      },
      {
        field: 'total_tasks',
        header: 'Total Tasks',
        type: 'number',
        width: 110,
        sortable: true,
      },
      {
        field: 'completed_tasks',
        header: 'Completed',
        type: 'number',
        width: 110,
        sortable: true,
      },
      {
        field: 'in_progress_tasks',
        header: 'In Progress',
        type: 'number',
        width: 110,
        sortable: true,
      },
      {
        field: 'delayed_tasks',
        header: 'Delayed',
        type: 'number',
        width: 100,
        sortable: true,
      },
    ],
    []
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={data as unknown as Record<string, unknown>[]}
          rowKey="assignee"
          sortable
          paginated
          defaultPageSize={10}
          rowLabel="team members"
        />
      </div>
    </div>
  );
}
