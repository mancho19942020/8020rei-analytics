/**
 * User Activity Widget
 *
 * Displays DAU, WAU, MAU metrics in a horizontal layout with:
 * - Large metric values
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
  value: number;
  icon: ReactNode;
  subtitle?: string;
  color?: 'main' | 'accent-1' | 'accent-2';
  trend?: TrendData;
}

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

function MetricCard({ label, value, icon, subtitle, color = 'main', trend }: MetricCardProps) {
  // Generate mock sparkline data based on trend
  const chartData = useMemo(() => {
    const baseValue = value * 0.8;
    const trendDirection = trend?.isPositive ? 1 : -1;
    return Array.from({ length: 7 }, (_, i) =>
      baseValue + (Math.random() * value * 0.2) + (trendDirection * value * 0.2 * (i / 6))
    );
  }, [value, trend]);

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
  };

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
        <MiniSparkline data={chartData} color={colorMap[color].stroke} />
      </div>
    </div>
  );
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
        color="main"
        trend={data.trends?.dau}
      />

      {/* WAU */}
      <MetricCard
        label="Weekly Active Users"
        value={data.wau}
        icon={<UsersIcon />}
        subtitle="vs. previous week"
        color="accent-1"
        trend={data.trends?.wau}
      />

      {/* MAU */}
      <MetricCard
        label="Monthly Active Users"
        value={data.mau}
        icon={<UsersIcon />}
        subtitle="vs. previous month"
        color="accent-2"
        trend={data.trends?.mau}
      />
    </div>
  );
}
