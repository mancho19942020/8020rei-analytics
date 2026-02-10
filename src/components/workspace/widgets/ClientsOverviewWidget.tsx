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

import { ReactNode, useMemo } from 'react';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  subtitle?: string;
  color?: 'main' | 'accent-1' | 'accent-2' | 'accent-3';
  trend?: TrendData;
  format?: 'number' | 'decimal';
}

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

// Mini Sparkline component
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
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
        stroke={color}
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

function MetricCard({ label, value, icon, subtitle, color = 'main', trend, format = 'number' }: MetricCardProps) {
  // Generate mock sparkline data based on trend
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  const chartData = useMemo(() => {
    const baseValue = numValue * 0.8;
    const trendDirection = trend?.isPositive ? 1 : -1;
    return Array.from({ length: 7 }, (_, i) =>
      baseValue + (Math.random() * numValue * 0.2) + (trendDirection * numValue * 0.2 * (i / 6))
    );
  }, [numValue, trend]);

  const colorMap = {
    main: {
      bg: 'bg-main-600 dark:bg-main-700',
      stroke: 'rgb(29, 78, 216)',
    },
    'accent-1': {
      bg: 'bg-accent-1-600 dark:bg-accent-1-700',
      stroke: 'rgb(59, 130, 246)',
    },
    'accent-2': {
      bg: 'bg-accent-2-600 dark:bg-accent-2-700',
      stroke: 'rgb(99, 102, 241)',
    },
    'accent-3': {
      bg: 'bg-accent-3-600 dark:bg-accent-3-700',
      stroke: 'rgb(168, 85, 247)',
    },
  };

  const displayValue = format === 'decimal'
    ? (typeof value === 'number' ? value.toFixed(1) : value)
    : (typeof value === 'number' ? value.toLocaleString() : value);

  return (
    <div className="flex flex-col p-3 bg-surface-raised rounded-xl border border-stroke hover:border-stroke-strong hover:shadow-sm transition-all duration-200 h-full">
      {/* Header: Icon + Label */}
      <div className="flex items-center gap-2 mb-1">
        <div className={`flex-shrink-0 w-6 h-6 rounded-md ${colorMap[color].bg} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-content-secondary truncate">{label}</span>
      </div>

      {/* Main Value */}
      <div className="text-2xl font-bold text-content-primary tabular-nums flex-1">
        {displayValue ?? 0}
      </div>

      {/* Footer: Trend + Subtitle + Sparkline */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          {trend && <TrendBadge trend={trend} />}
          {subtitle && (
            <span className="text-xs text-content-tertiary">{subtitle}</span>
          )}
        </div>
        <MiniSparkline data={chartData} color={colorMap[color].stroke} />
      </div>
    </div>
  );
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
        color="main"
        trend={data.trends?.total_clients}
      />

      {/* Total Events */}
      <MetricCard
        label="Total Events"
        value={data.total_events}
        icon={<ActivityIcon />}
        subtitle="vs. previous period"
        color="accent-1"
        trend={data.trends?.total_events}
      />

      {/* Total Page Views */}
      <MetricCard
        label="Page Views"
        value={data.total_page_views}
        icon={<EyeIcon />}
        subtitle="vs. previous period"
        color="accent-2"
        trend={data.trends?.total_page_views}
      />

      {/* Avg Users per Client */}
      <MetricCard
        label="Avg Users/Client"
        value={data.avg_users_per_client}
        icon={<UsersIcon />}
        subtitle="vs. previous period"
        color="accent-3"
        trend={data.trends?.avg_users_per_client}
        format="decimal"
      />
    </div>
  );
}
