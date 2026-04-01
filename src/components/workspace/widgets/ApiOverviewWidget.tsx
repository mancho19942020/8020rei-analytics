/**
 * API Overview Widget
 *
 * Displays key Properties API metrics in a grid of MetricCards.
 * Matches the established pattern from ClientsOverviewWidget.
 */

'use client';

import { MetricCard } from '@/components/workspace/MetricCard';

const colorMap = {
  main: { bg: 'bg-main-700', stroke: 'rgb(29, 78, 216)' },
  'accent-1': { bg: 'bg-accent-1-700', stroke: 'rgb(59, 130, 246)' },
  'accent-2': { bg: 'bg-accent-2-700', stroke: 'rgb(99, 102, 241)' },
  'accent-3': { bg: 'bg-accent-3-700', stroke: 'rgb(168, 85, 247)' },
};

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface ApiOverviewWidgetProps {
  data: {
    totalCalls: number;
    uniqueClients: number;
    uniqueDomains: number;
    avgResponseMs: number;
    errorRate: number;
    uniqueTokens: number;
    p95ResponseMs: number;
    totalErrors: number;
    avgResultsReturned: number;
    trends?: {
      totalCalls: TrendData;
      uniqueDomains: TrendData;
      avgResponseMs: TrendData;
      errorRate: TrendData;
    };
  };
}

const ServerIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export function ApiOverviewWidget({ data }: ApiOverviewWidgetProps) {
  return (
    <div className="flex w-full h-full flush-cards">
      <MetricCard
        label="Total API Calls"
        value={data.totalCalls}
        icon={<ServerIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['main'].bg}
        sparklineColor={colorMap['main'].stroke}
        trend={data.trends?.totalCalls}
      />
      <MetricCard
        label="Domains"
        value={data.uniqueDomains || data.uniqueClients}
        icon={<UsersIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['accent-1'].bg}
        sparklineColor={colorMap['accent-1'].stroke}
        trend={data.trends?.uniqueDomains}
      />
      <MetricCard
        label="Avg Response"
        value={`${data.avgResponseMs} ms`}
        icon={<ClockIcon />}
        subtitle="Lower is better"
        iconBgClass={colorMap['accent-2'].bg}
        sparklineColor={colorMap['accent-2'].stroke}
        trend={data.trends?.avgResponseMs}
      />
      <MetricCard
        label="Error Rate"
        value={`${data.errorRate}%`}
        icon={<AlertIcon />}
        subtitle="Lower is better"
        iconBgClass={colorMap['accent-3'].bg}
        sparklineColor={data.errorRate > 5 ? 'rgb(239, 68, 68)' : colorMap['accent-3'].stroke}
        trend={data.trends?.errorRate}
      />
    </div>
  );
}
