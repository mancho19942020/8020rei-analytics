/**
 * User Activity Widget
 *
 * Displays DAU, WAU, MAU metrics in a horizontal layout with:
 * - Large metric values
 * - Trend indicators (up/down with percentage)
 * - Proper light/dark mode support
 */

'use client';

import { MetricCard, TrendData } from '@/components/workspace/MetricCard';

const colorMap = {
  main: {
    bg: 'bg-main-700',
    stroke: 'rgb(29, 78, 216)',
  },
  'accent-1': {
    bg: 'bg-accent-1-700',
    stroke: 'rgb(59, 130, 246)',
  },
  'accent-2': {
    bg: 'bg-accent-2-700',
    stroke: 'rgb(99, 102, 241)',
  },
};

interface UserActivityWidgetProps {
  data: {
    dau: number;
    wau: number;
    mau: number;
    trends?: {
      dau: TrendData;
      wau: TrendData;
      mau: TrendData;
    };
  };
}

// Users icon
const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export function UserActivityWidget({ data }: UserActivityWidgetProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full h-full">
      {/* DAU */}
      <MetricCard
        label="Daily Active Users"
        value={data.dau}
        icon={<UsersIcon />}
        subtitle="vs. previous day"
        iconBgClass={colorMap['main'].bg}
        sparklineColor={colorMap['main'].stroke}
        trend={data.trends?.dau}
      />

      {/* WAU */}
      <MetricCard
        label="Weekly Active Users"
        value={data.wau}
        icon={<UsersIcon />}
        subtitle="vs. previous week"
        iconBgClass={colorMap['accent-1'].bg}
        sparklineColor={colorMap['accent-1'].stroke}
        trend={data.trends?.wau}
      />

      {/* MAU */}
      <MetricCard
        label="Monthly Active Users"
        value={data.mau}
        icon={<UsersIcon />}
        subtitle="vs. previous month"
        iconBgClass={colorMap['accent-2'].bg}
        sparklineColor={colorMap['accent-2'].stroke}
        trend={data.trends?.mau}
      />
    </div>
  );
}
