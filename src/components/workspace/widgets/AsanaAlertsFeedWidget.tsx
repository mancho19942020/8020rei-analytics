/**
 * Asana Alerts Feed Widget
 *
 * Client-side computed alerts based on board data:
 * - Overdue tasks
 * - Unassigned tasks
 * - Stale tasks (no modification in 14+ days)
 * - Assignee overload (10+ in-progress tasks)
 */

'use client';

import { useMemo } from 'react';
import type { AsanaAlertItem, AiTaskBoardEntry, BugsDiBoardEntry, AsanaTeamWorkloadEntry } from '@/types/asana-tasks';

type TaskEntry = AiTaskBoardEntry | BugsDiBoardEntry;

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

const SEVERITY_ICONS: Record<string, string> = {
  critical: '🔴',
  warning: '🟡',
  info: '🔵',
};

function computeAlerts(
  tasks: TaskEntry[],
  teamWorkload: AsanaTeamWorkloadEntry[]
): AsanaAlertItem[] {
  const alerts: AsanaAlertItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Overdue tasks
  const overdueTasks = tasks.filter(t =>
    t.section !== 'Done' && t.due_on && new Date(t.due_on) < today
  );
  if (overdueTasks.length > 0) {
    const worst = overdueTasks.reduce((max, t) => {
      const days = t.days_overdue || 0;
      return days > (max.days_overdue || 0) ? t : max;
    }, overdueTasks[0]);
    alerts.push({
      type: 'overdue',
      severity: overdueTasks.length >= 5 ? 'critical' : 'warning',
      title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
      description: `Most overdue: "${worst.name}" (${worst.days_overdue}d late)`,
      count: overdueTasks.length,
      permalink_url: worst.permalink_url,
    });
  }

  // 2. Unassigned open tasks
  const unassigned = tasks.filter(t =>
    t.section !== 'Done' && !t.assignee_name
  );
  if (unassigned.length > 0) {
    alerts.push({
      type: 'unassigned',
      severity: unassigned.length >= 10 ? 'warning' : 'info',
      title: `${unassigned.length} unassigned task${unassigned.length > 1 ? 's' : ''}`,
      description: 'Tasks without an owner may fall through the cracks',
      count: unassigned.length,
    });
  }

  // 3. Stale tasks (not modified in 14+ days, still open)
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const staleTasks = tasks.filter(t =>
    t.section !== 'Done' && t.modified_at && new Date(t.modified_at) < fourteenDaysAgo
  );
  if (staleTasks.length > 0) {
    alerts.push({
      type: 'stale',
      severity: staleTasks.length >= 5 ? 'warning' : 'info',
      title: `${staleTasks.length} stale task${staleTasks.length > 1 ? 's' : ''}`,
      description: 'Not modified in 14+ days — may need attention or archiving',
      count: staleTasks.length,
    });
  }

  // 4. Assignee overload (10+ in-progress tasks)
  const overloaded = teamWorkload.filter(w =>
    w.assignee_name !== 'Unassigned' && w.in_progress_tasks >= 10
  );
  if (overloaded.length > 0) {
    alerts.push({
      type: 'overload',
      severity: 'warning',
      title: `${overloaded.length} team member${overloaded.length > 1 ? 's' : ''} overloaded`,
      description: overloaded.map(w => `${w.assignee_name} (${w.in_progress_tasks} in progress)`).join(', '),
      count: overloaded.length,
    });
  }

  // Sort: critical first, then warning, then info
  const order = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

interface AsanaAlertsFeedWidgetProps {
  tasks: TaskEntry[];
  teamWorkload: AsanaTeamWorkloadEntry[];
}

export function AsanaAlertsFeedWidget({ tasks, teamWorkload }: AsanaAlertsFeedWidgetProps) {
  const alerts = useMemo(() => computeAlerts(tasks, teamWorkload), [tasks, teamWorkload]);

  if (alerts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-content-tertiary text-sm">
        <div className="text-center">
          <div className="text-2xl mb-2">✅</div>
          <div>No alerts — board looks healthy</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto gap-2 px-1">
      {alerts.map((alert, i) => (
        <div
          key={`${alert.type}-${i}`}
          className={`flex items-start gap-3 px-3 py-2.5 rounded-md border ${SEVERITY_STYLES[alert.severity]}`}
        >
          <span className="text-lg flex-shrink-0 mt-0.5">{SEVERITY_ICONS[alert.severity]}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{alert.title}</div>
            <div className="text-xs opacity-80 mt-0.5">{alert.description}</div>
          </div>
          {alert.permalink_url && (
            <a
              href={alert.permalink_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs opacity-70 hover:opacity-100 flex-shrink-0 underline"
            >
              View
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
