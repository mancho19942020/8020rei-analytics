/**
 * Session Summary Widget
 *
 * Displays Total Sessions and Unique Users in a horizontal layout with trend indicators.
 */

'use client';

import { MetricCard, TrendData } from '@/components/workspace/MetricCard';

interface SessionSummaryWidgetProps {
  data: {
    total_sessions: number;
    unique_users: number;
    trends?: {
      total_sessions: TrendData;
      unique_users: TrendData;
    };
  };
}

// Icons
const SessionIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export function SessionSummaryWidget({ data }: SessionSummaryWidgetProps) {
  return (
    <div className="flex w-full h-full flush-cards">
      {/* Total Sessions */}
      <MetricCard
        label="Total Sessions"
        value={data.total_sessions}
        icon={<SessionIcon />}
        subtitle="vs. previous period"
        iconBgClass="bg-surface-overlay"
        iconTextClass="text-content-tertiary"
        trend={data.trends?.total_sessions}
      />

      {/* Unique Users */}
      <MetricCard
        label="Unique Users"
        value={data.unique_users}
        icon={<UsersIcon />}
        subtitle="vs. previous period"
        iconBgClass="bg-surface-overlay"
        iconTextClass="text-content-tertiary"
        trend={data.trends?.unique_users}
      />
    </div>
  );
}
