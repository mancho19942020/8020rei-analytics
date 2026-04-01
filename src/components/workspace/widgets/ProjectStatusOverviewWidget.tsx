/**
 * Project Status Overview Widget
 *
 * Displays 4 KPI metric cards in a grid for project status:
 * active projects, on track, delayed, and completed.
 * Each card includes a mini sparkline and trend badge.
 */

'use client';

import { MetricCard } from '@/components/workspace/MetricCard';
import type { ProjectStatusOverview, TrendData } from '@/types/product';

const colorMap = {
  main: { bg: 'bg-main-700', stroke: 'rgb(29, 78, 216)' },
  'accent-1': { bg: 'bg-accent-1-700', stroke: 'rgb(34, 197, 94)' },
  'accent-2': { bg: 'bg-accent-2-700', stroke: 'rgb(239, 68, 68)' },
  'accent-3': { bg: 'bg-accent-3-700', stroke: 'rgb(168, 85, 247)' },
};

const ClipboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationTriangleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const FlagIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
  </svg>
);

interface ProjectStatusOverviewWidgetProps {
  data: ProjectStatusOverview;
}

export function ProjectStatusOverviewWidget({ data }: ProjectStatusOverviewWidgetProps) {
  return (
    <div className="flex w-full h-full flush-cards">
      <MetricCard
        label="Active Projects"
        value={data.active_projects}
        icon={<ClipboardIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['main'].bg}
        sparklineColor={colorMap['main'].stroke}
        trend={data.trends?.active_projects}
      />
      <MetricCard
        label="On Track"
        value={data.on_track}
        icon={<CheckCircleIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['accent-1'].bg}
        sparklineColor={colorMap['accent-1'].stroke}
        trend={data.trends?.on_track}
      />
      <MetricCard
        label="Delayed"
        value={data.delayed}
        icon={<ExclamationTriangleIcon />}
        subtitle="Less is better"
        iconBgClass={colorMap['accent-2'].bg}
        sparklineColor={colorMap['accent-2'].stroke}
        trend={data.trends?.delayed}
      />
      <MetricCard
        label="Completed"
        value={data.completed}
        icon={<FlagIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['accent-3'].bg}
        sparklineColor={colorMap['accent-3'].stroke}
        trend={data.trends?.completed}
      />
    </div>
  );
}
