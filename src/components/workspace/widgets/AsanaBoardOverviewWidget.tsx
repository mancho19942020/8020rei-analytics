/**
 * Asana Board Overview Widget
 *
 * Displays 4 KPI metric cards matching the API Overview pattern:
 * total tasks, in progress, completed, overdue.
 */

'use client';

import { MetricCard } from '@/components/workspace/MetricCard';
import type { AsanaBoardOverview } from '@/types/asana-tasks';

const colorMap = {
  main: { bg: 'bg-main-700', stroke: 'rgb(29, 78, 216)' },
  'accent-1': { bg: 'bg-accent-1-700', stroke: 'rgb(59, 130, 246)' },
  'accent-2': { bg: 'bg-accent-2-700', stroke: 'rgb(99, 102, 241)' },
  'accent-3': { bg: 'bg-accent-3-700', stroke: 'rgb(168, 85, 247)' },
};

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
        iconBgClass={colorMap['main'].bg}
        sparklineColor={colorMap['main'].stroke}
        trend={data.trends?.total_tasks}
      />
      <MetricCard
        label="In progress"
        value={data.in_progress}
        icon={<InProgressIcon />}
        subtitle={`${data.to_do} to do + ${data.backlog} backlog`}
        iconBgClass={colorMap['accent-1'].bg}
        sparklineColor={colorMap['accent-1'].stroke}
      />
      <MetricCard
        label="Completed"
        value={data.completed}
        icon={<CompletedIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['accent-2'].bg}
        sparklineColor={colorMap['accent-2'].stroke}
        trend={data.trends?.completed}
      />
      <MetricCard
        label="Overdue"
        value={data.overdue}
        icon={<OverdueIcon />}
        subtitle={`${data.unassigned} unassigned`}
        iconBgClass={colorMap['accent-3'].bg}
        sparklineColor={colorMap['accent-3'].stroke}
        trend={data.trends?.overdue}
      />
    </div>
  );
}
