/**
 * Clients Overview Widget
 *
 * Displays key client metrics in a horizontal layout with:
 * - Total clients
 * - Total events
 * - Total page views
 * - Avg users per client
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
  'accent-3': {
    bg: 'bg-accent-3-700',
    stroke: 'rgb(168, 85, 247)',
  },
};

interface ClientsOverviewWidgetProps {
  data: {
    total_clients: number;
    total_events: number;
    total_page_views: number;
    total_users: number;
    avg_users_per_client: number;
    trends?: {
      total_clients: TrendData;
      total_events: TrendData;
      total_page_views: TrendData;
      total_users: TrendData;
      avg_users_per_client: TrendData;
    };
  };
}

// Building icon for clients
const BuildingIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

// Activity icon for events
const ActivityIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// Eye icon for page views
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

// Users icon
const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export function ClientsOverviewWidget({ data }: ClientsOverviewWidgetProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full h-full">
      {/* Total Clients */}
      <MetricCard
        label="Active Clients"
        value={data.total_clients}
        icon={<BuildingIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['main'].bg}
        sparklineColor={colorMap['main'].stroke}
        trend={data.trends?.total_clients}
      />

      {/* Total Events */}
      <MetricCard
        label="Total Events"
        value={data.total_events}
        icon={<ActivityIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['accent-1'].bg}
        sparklineColor={colorMap['accent-1'].stroke}
        trend={data.trends?.total_events}
      />

      {/* Total Page Views */}
      <MetricCard
        label="Page Views"
        value={data.total_page_views}
        icon={<EyeIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['accent-2'].bg}
        sparklineColor={colorMap['accent-2'].stroke}
        trend={data.trends?.total_page_views}
      />

      {/* Avg Users per Client */}
      <MetricCard
        label="Avg Users/Client"
        value={data.avg_users_per_client}
        icon={<UsersIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['accent-3'].bg}
        sparklineColor={colorMap['accent-3'].stroke}
        trend={data.trends?.avg_users_per_client}
      />
    </div>
  );
}
