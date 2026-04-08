/**
 * Asana Team Workload Widget
 *
 * Horizontal stacked bar chart showing task count per assignee,
 * segmented by status (completed, in progress, overdue).
 */

'use client';

import type { AsanaTeamWorkloadEntry } from '@/types/asana-tasks';

interface AsanaTeamWorkloadWidgetProps {
  data: AsanaTeamWorkloadEntry[];
}

export function AsanaTeamWorkloadWidget({ data }: AsanaTeamWorkloadWidgetProps) {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-content-tertiary text-sm">
        No workload data available
      </div>
    );
  }

  const maxTotal = Math.max(...data.map(d => d.total_tasks), 1);

  return (
    <div className="h-full flex flex-col overflow-y-auto px-1">
      <div className="flex items-center gap-4 mb-3 text-xs text-content-secondary flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
          <span>In progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-surface-overlay" />
          <span>Other</span>
        </div>
      </div>

      <div className="space-y-2.5 flex-1">
        {data.map((entry) => {
          const other = entry.total_tasks - entry.completed_tasks - entry.in_progress_tasks - entry.overdue_tasks;
          const pct = (v: number) => `${(v / maxTotal) * 100}%`;

          return (
            <div key={entry.assignee_name} className="flex items-center gap-3">
              <div className="w-28 text-sm text-content-primary truncate flex-shrink-0" title={entry.assignee_name}>
                {entry.assignee_name}
              </div>
              <div className="flex-1 flex h-5 rounded-sm overflow-hidden bg-surface-overlay">
                {entry.completed_tasks > 0 && (
                  <div
                    className="bg-green-500 transition-all"
                    style={{ width: pct(entry.completed_tasks) }}
                    title={`Completed: ${entry.completed_tasks}`}
                  />
                )}
                {entry.in_progress_tasks > 0 && (
                  <div
                    className="bg-blue-500 transition-all"
                    style={{ width: pct(entry.in_progress_tasks) }}
                    title={`In progress: ${entry.in_progress_tasks}`}
                  />
                )}
                {entry.overdue_tasks > 0 && (
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: pct(entry.overdue_tasks) }}
                    title={`Overdue: ${entry.overdue_tasks}`}
                  />
                )}
                {other > 0 && (
                  <div
                    className="bg-surface-overlay transition-all"
                    style={{ width: pct(Math.max(other, 0)) }}
                    title={`Other: ${Math.max(other, 0)}`}
                  />
                )}
              </div>
              <div className="w-8 text-xs text-content-secondary text-right tabular-nums flex-shrink-0">
                {entry.total_tasks}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
