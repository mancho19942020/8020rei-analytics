/**
 * Engagement Metrics Widget
 *
 * Displays engagement metrics in a horizontal layout with trend indicators:
 * - Sessions per User
 * - Engaged Sessions %
 * - Bounce Rate
 * - Avg Engagement Time
 */

'use client';

import { MetricCard, TrendData } from '@/components/workspace/MetricCard';

const colorMap = {
  main: 'bg-main-700',
  success: 'bg-success-700',
  error: 'bg-error-700',
  'accent-3': 'bg-accent-3-700',
};

interface EngagementMetricsWidgetProps {
  data: {
    total_sessions: number;
    engaged_sessions: number;
    avg_engagement_time_sec: number;
    unique_users: number;
    sessions_per_user: number;
    engaged_rate: number;
    bounce_rate: number;
    trends?: {
      total_sessions: TrendData;
      engaged_sessions: TrendData;
      avg_engagement_time_sec: TrendData;
      unique_users: TrendData;
      sessions_per_user: TrendData;
      engaged_rate: TrendData;
      bounce_rate: TrendData;
    };
  };
}

// Icons
const SessionIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const EngagementIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const BounceIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Format engagement time (seconds to human readable)
function formatEngagementTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function EngagementMetricsWidget({ data }: EngagementMetricsWidgetProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full h-full">
      {/* Sessions per User */}
      <MetricCard
        label="Sessions per User"
        value={data.sessions_per_user?.toFixed(2) ?? '0'}
        icon={<SessionIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['main']}
        trend={data.trends?.sessions_per_user}
      />

      {/* Engaged Sessions */}
      <MetricCard
        label="Engaged Sessions"
        value={`${data.engaged_rate?.toFixed(1) ?? '0'}%`}
        icon={<EngagementIcon />}
        subtitle={`${data.engaged_sessions?.toLocaleString() ?? '0'} of ${data.total_sessions?.toLocaleString() ?? '0'}`}
        iconBgClass={colorMap['success']}
        trend={data.trends?.engaged_rate}
      />

      {/* Bounce Rate */}
      <MetricCard
        label="Bounce Rate"
        value={`${data.bounce_rate?.toFixed(1) ?? '0'}%`}
        icon={<BounceIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['error']}
        trend={data.trends?.bounce_rate}
      />

      {/* Avg Engagement Time */}
      <MetricCard
        label="Avg Engagement Time"
        value={formatEngagementTime(data.avg_engagement_time_sec ?? 0)}
        icon={<ClockIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['accent-3']}
        trend={data.trends?.avg_engagement_time_sec}
      />
    </div>
  );
}
