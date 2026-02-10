/**
 * Session Summary Widget
 *
 * Displays Total Sessions and Unique Users in a horizontal layout with trend indicators.
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
  subtitle?: string;
  trend?: TrendData;
}

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

function MetricCard({ label, value, icon, subtitle, trend }: MetricCardProps) {
  const isPositive = trend?.isPositive ?? true;

  return (
    <div className="flex flex-col p-3 bg-surface-raised rounded-xl border border-stroke hover:border-stroke-strong hover:shadow-sm transition-all duration-200 h-full">
      {/* Header: Icon + Label */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-shrink-0 w-6 h-6 rounded-md bg-neutral-500 dark:bg-neutral-600 flex items-center justify-center text-white">
          {icon}
        </div>
        <span className="text-xs font-medium text-content-secondary truncate">{label}</span>
      </div>

      {/* Main Value */}
      <div className="text-2xl font-bold text-content-primary tabular-nums flex-1">
        {value?.toLocaleString() ?? 0}
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

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export function SessionSummaryWidget({ data }: SessionSummaryWidgetProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full">
      {/* Total Sessions */}
      <MetricCard
        label="Total Sessions"
        value={data.total_sessions}
        icon={<SessionIcon />}
        subtitle="vs. previous period"
        trend={data.trends?.total_sessions}
      />

      {/* Unique Users */}
      <MetricCard
        label="Unique Users"
        value={data.unique_users}
        icon={<UsersIcon />}
        subtitle="vs. previous period"
        trend={data.trends?.unique_users}
      />
    </div>
  );
}
