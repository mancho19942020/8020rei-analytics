/**
 * Asana Board Overview Widget
 *
 * Displays KPI metric cards for board status:
 * total tasks, in progress, to do/open, completed, overdue, unassigned.
 */

'use client';

import { MetricCard } from '@/components/workspace/MetricCard';
import type { AsanaBoardOverview } from '@/types/asana-tasks';

const TasksIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const InProgressIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CompletedIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const OverdueIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const BacklogIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const UnassignedIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

interface AsanaBoardOverviewWidgetProps {
  data: AsanaBoardOverview;
}

export function AsanaBoardOverviewWidget({ data }: AsanaBoardOverviewWidgetProps) {
  return (
    <div className="flex w-full h-full flush-cards">
      <MetricCard
        label="Total tasks"
        value={data.total_tasks}
        icon={<TasksIcon />}
        subtitle="vs. previous period"
        iconBgClass="bg-main-700"
        trend={data.trends?.total_tasks}
      />
      <MetricCard
        label="In progress"
        value={data.in_progress}
        icon={<InProgressIcon />}
        subtitle="Active work"
        iconBgClass="bg-accent-1-700"
      />
      <MetricCard
        label="To do / Open"
        value={data.to_do + data.backlog}
        icon={<BacklogIcon />}
        subtitle="Backlog + To do"
        iconBgClass="bg-accent-3-700"
      />
      <MetricCard
        label="Completed"
        value={data.completed}
        icon={<CompletedIcon />}
        subtitle="vs. previous period"
        iconBgClass="bg-success-700"
        trend={data.trends?.completed}
      />
      <MetricCard
        label="Overdue"
        value={data.overdue}
        icon={<OverdueIcon />}
        subtitle="Less is better"
        iconBgClass="bg-error-700"
        trend={data.trends?.overdue}
      />
      <MetricCard
        label="Unassigned"
        value={data.unassigned}
        icon={<UnassignedIcon />}
        subtitle="Needs attention"
        iconBgClass="bg-warning-700"
      />
    </div>
  );
}
