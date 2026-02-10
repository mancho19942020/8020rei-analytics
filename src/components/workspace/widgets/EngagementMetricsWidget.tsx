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

import { ReactNode, useMemo } from 'react';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  subtitle?: string;
  color?: 'main' | 'success' | 'error' | 'accent-3';
  trend?: TrendData;
}

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

// Mini Sparkline component
function MiniSparkline({ isPositive }: { isPositive: boolean }) {
  const data = useMemo(() => {
    // Generate data based on trend direction
    return Array.from({ length: 7 }, (_, i) =>
      50 + (Math.random() * 20) + (isPositive ? (i * 5) : (-i * 5))
    );
  }, [isPositive]);

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

  if (value === 0) return null;

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
      <span>{value.toFixed(1)}%</span>
    </div>
  );
}

function MetricCard({ label, value, icon, subtitle, color = 'main', trend }: MetricCardProps) {
  const colorMap = {
    main: 'bg-main-600 dark:bg-main-700',
    success: 'bg-success-600 dark:bg-success-700',
    error: 'bg-error-600 dark:bg-error-700',
    'accent-3': 'bg-accent-3-600 dark:bg-accent-3-700',
  };

  const isPositive = trend?.isPositive ?? true;

  return (
    <div className="flex flex-col p-3 bg-surface-raised rounded-xl border border-stroke hover:border-stroke-strong hover:shadow-sm transition-all duration-200 h-full">
      {/* Header: Icon + Label */}
      <div className="flex items-center gap-2 mb-1">
        <div className={`flex-shrink-0 w-6 h-6 rounded-md ${colorMap[color]} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-content-secondary truncate">{label}</span>
      </div>

      {/* Main Value */}
      <div className="text-2xl font-bold text-content-primary tabular-nums flex-1">
        {value}
      </div>

      {/* Footer: Trend + Subtitle + Sparkline */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          {trend && <TrendBadge trend={trend} />}
          {subtitle && (
            <span className="text-xs text-content-tertiary">{subtitle}</span>
          )}
        </div>
        <MiniSparkline isPositive={isPositive} />
      </div>
    </div>
  );
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
        color="main"
        trend={data.trends?.sessions_per_user}
      />

      {/* Engaged Sessions */}
      <MetricCard
        label="Engaged Sessions"
        value={`${data.engaged_rate?.toFixed(1) ?? '0'}%`}
        icon={<EngagementIcon />}
        subtitle={`${data.engaged_sessions?.toLocaleString() ?? '0'} of ${data.total_sessions?.toLocaleString() ?? '0'}`}
        color="success"
        trend={data.trends?.engaged_rate}
      />

      {/* Bounce Rate */}
      <MetricCard
        label="Bounce Rate"
        value={`${data.bounce_rate?.toFixed(1) ?? '0'}%`}
        icon={<BounceIcon />}
        subtitle="vs. previous period"
        color="error"
        trend={data.trends?.bounce_rate}
      />

      {/* Avg Engagement Time */}
      <MetricCard
        label="Avg Engagement Time"
        value={formatEngagementTime(data.avg_engagement_time_sec ?? 0)}
        icon={<ClockIcon />}
        subtitle="vs. previous period"
        color="accent-3"
        trend={data.trends?.avg_engagement_time_sec}
      />
    </div>
  );
}
