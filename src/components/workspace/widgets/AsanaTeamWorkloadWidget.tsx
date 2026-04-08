/**
 * Asana Team Workload Widget
 *
 * Horizontal stacked bar chart showing task count per assignee,
 * segmented by status. Uses CSS variable tokens for colors.
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
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-success-500)' }} />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-main-500)' }} />
          <span>In progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-error-500)' }} />
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-neutral-500)' }} />
          <span>Other</span>
        </div>
      </div>

      <div className="space-y-2.5 flex-1">
        {data.map((entry) => {
          const other = Math.max(entry.total_tasks - entry.completed_tasks - entry.in_progress_tasks - entry.overdue_tasks, 0);
          const pct = (v: number) => `${(v / maxTotal) * 100}%`;

          return (
            <div key={entry.assignee_name} className="flex items-center gap-3">
              <div className="w-28 text-sm text-content-primary truncate flex-shrink-0" title={entry.assignee_name}>
                {entry.assignee_name}
              </div>
              <div className="flex-1 flex h-5 rounded-sm overflow-hidden" style={{ backgroundColor: 'var(--surface-overlay)' }}>
                {entry.completed_tasks > 0 && (
                  <div
                    className="transition-all"
                    style={{ width: pct(entry.completed_tasks), backgroundColor: 'var(--color-success-500)' }}
                    title={`Completed: ${entry.completed_tasks}`}
                  />
                )}
                {entry.in_progress_tasks > 0 && (
                  <div
                    className="transition-all"
                    style={{ width: pct(entry.in_progress_tasks), backgroundColor: 'var(--color-main-500)' }}
                    title={`In progress: ${entry.in_progress_tasks}`}
                  />
                )}
                {entry.overdue_tasks > 0 && (
                  <div
                    className="transition-all"
                    style={{ width: pct(entry.overdue_tasks), backgroundColor: 'var(--color-error-500)' }}
                    title={`Overdue: ${entry.overdue_tasks}`}
                  />
                )}
                {other > 0 && (
                  <div
                    className="transition-all"
                    style={{ width: pct(other), backgroundColor: 'var(--color-neutral-500)' }}
                    title={`Other: ${other}`}
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
