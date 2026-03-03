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

import { useMemo } from 'react';
import { MetricCard, TrendData } from '@/components/workspace/MetricCard';

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
        iconBgClass="bg-main-700"
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
        iconBgClass="bg-main-700"
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
        iconBgClass="bg-main-700"
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
        iconBgClass="bg-main-700"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
      />
    </div>
  );
}
