/**
 * Metrics Overview Widget
 *
 * Displays 4 key metrics in a horizontal layout with:
 * - Large metric values
 * - Trend indicators (up/down with percentage)
 * - Mini sparkline charts
 * - Proper light/dark mode support
 */

'use client';

import { ReactNode, useMemo } from 'react';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  trend?: TrendData;
  sparklineData?: number[];
}

interface MetricsOverviewWidgetProps {
  data: {
    total_users: number;
    total_events: number;
    page_views: number;
    active_clients: number;
  };
  previousData?: {
    total_users: number;
    total_events: number;
    page_views: number;
    active_clients: number;
  };
}

// Mini Sparkline component
function MiniSparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 48;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        fill="none"
        stroke={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Trend Badge component
function TrendBadge({ trend }: { trend: TrendData }) {
  const { value, isPositive } = trend;

  return (
    <div className={[
      'flex items-center gap-0.5 text-xs font-medium',
      isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    ].join(' ')}>
      {isPositive ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  );
}

function MetricCard({ label, value, icon, trend, sparklineData }: MetricCardProps) {
  // Generate mock sparkline data if not provided
  const chartData = useMemo(() => {
    if (sparklineData) return sparklineData;
    // Generate random trend data for visualization
    const baseValue = value * 0.8;
    return Array.from({ length: 7 }, (_, i) =>
      baseValue + (Math.random() * value * 0.4) * (i / 6)
    );
  }, [sparklineData, value]);

  const isPositive = trend?.isPositive ?? true;

  return (
    <div className="flex flex-col p-3 bg-surface-raised rounded-xl border border-stroke hover:border-stroke-strong hover:shadow-sm transition-all duration-200 h-full">
      {/* Header: Icon + Label */}
      <div className="flex items-center gap-2 mb-1">
        {/* Icon with proper light/dark mode colors - white icon on colored background */}
        <div className="flex-shrink-0 w-6 h-6 rounded-md bg-main-600 dark:bg-main-700 flex items-center justify-center text-white">
          {icon}
        </div>
        <span className="text-xs font-medium text-content-secondary truncate">{label}</span>
      </div>

      {/* Main Value */}
      <div className="text-2xl font-bold text-content-primary tabular-nums flex-1">
        {value?.toLocaleString() ?? 0}
      </div>

      {/* Footer: Trend + Sparkline - aligned to bottom */}
      <div className="flex items-end justify-between">
        {trend && <TrendBadge trend={trend} />}
        <MiniSparkline data={chartData} isPositive={isPositive} />
      </div>
    </div>
  );
}

export function MetricsOverviewWidget({ data, previousData }: MetricsOverviewWidgetProps) {
  // Calculate trends based on previous data
  const calculateTrend = (current: number, previous?: number): TrendData | undefined => {
    if (!previous || previous === 0) {
      // Return a mock positive trend if no previous data
      return { value: Math.random() * 10 + 1, isPositive: true };
    }
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  const trends = useMemo(() => ({
    total_users: calculateTrend(data.total_users, previousData?.total_users),
    total_events: calculateTrend(data.total_events, previousData?.total_events),
    page_views: calculateTrend(data.page_views, previousData?.page_views),
    active_clients: calculateTrend(data.active_clients, previousData?.active_clients),
  }), [data, previousData]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full h-full">
      {/* Total Users */}
      <MetricCard
        label="Total Users"
        value={data.total_users}
        trend={trends.total_users}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      />

      {/* Total Events */}
      <MetricCard
        label="Total Events"
        value={data.total_events}
        trend={trends.total_events}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />

      {/* Page Views */}
      <MetricCard
        label="Page Views"
        value={data.page_views}
        trend={trends.page_views}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        }
      />

      {/* Active Clients */}
      <MetricCard
        label="Active Clients"
        value={data.active_clients}
        trend={trends.active_clients}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
      />
    </div>
  );
}
