/**
 * Project Status Overview Widget
 *
 * Displays 4 KPI metric cards in a grid for project status:
 * active projects, on track, delayed, and completed.
 * Each card includes a mini sparkline and trend badge.
 */

'use client';

import { ReactNode, useMemo } from 'react';
import type { ProjectStatusOverview, TrendData } from '@/types/product';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  subtitle?: string;
  color?: 'main' | 'accent-1' | 'accent-2' | 'accent-3';
  trend?: TrendData;
}

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
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function TrendBadge({ trend }: { trend: TrendData }) {
  const { value, isPositive } = trend;
  if (value === 0) return null;
  return (
    <div className={['flex items-center gap-0.5 text-xs font-medium', isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
      {isPositive ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
      )}
      <span>{value.toFixed(1)}%</span>
    </div>
  );
}

function MetricCard({ label, value, icon, subtitle, color = 'main', trend }: MetricCardProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  const chartData = useMemo(() => {
    const baseValue = numValue * 0.8;
    const trendDirection = trend?.isPositive ? 1 : -1;
    return Array.from({ length: 7 }, (_, i) =>
      baseValue + (Math.random() * numValue * 0.2) + (trendDirection * numValue * 0.2 * (i / 6))
    );
  }, [numValue, trend]);

  const colorMap = {
    main: { bg: 'bg-main-600 dark:bg-main-700', stroke: 'rgb(29, 78, 216)' },
    'accent-1': { bg: 'bg-accent-1-600 dark:bg-accent-1-700', stroke: 'rgb(34, 197, 94)' },
    'accent-2': { bg: 'bg-accent-2-600 dark:bg-accent-2-700', stroke: 'rgb(239, 68, 68)' },
    'accent-3': { bg: 'bg-accent-3-600 dark:bg-accent-3-700', stroke: 'rgb(168, 85, 247)' },
  };

  return (
    <div className="flex flex-col p-3 bg-surface-raised rounded-xl border border-stroke hover:border-stroke-strong hover:shadow-sm transition-all duration-200 h-full">
      <div className="flex items-center gap-2 mb-1">
        <div className={`flex-shrink-0 w-6 h-6 rounded-md ${colorMap[color].bg} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-content-secondary truncate">{label}</span>
      </div>
      <div className="text-2xl font-bold text-content-primary tabular-nums flex-1">
        {numValue.toLocaleString()}
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          {trend && <TrendBadge trend={trend} />}
          {subtitle && <span className="text-xs text-content-tertiary">{subtitle}</span>}
        </div>
        <MiniSparkline data={chartData} color={colorMap[color].stroke} />
      </div>
    </div>
  );
}

const ClipboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationTriangleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const FlagIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
  </svg>
);

interface ProjectStatusOverviewWidgetProps {
  data: ProjectStatusOverview;
}

export function ProjectStatusOverviewWidget({ data }: ProjectStatusOverviewWidgetProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full h-full">
      <MetricCard
        label="Active Projects"
        value={data.active_projects}
        icon={<ClipboardIcon />}
        subtitle="vs. previous period"
        color="main"
        trend={data.trends?.active_projects}
      />
      <MetricCard
        label="On Track"
        value={data.on_track}
        icon={<CheckCircleIcon />}
        subtitle="current period"
        color="accent-1"
      />
      <MetricCard
        label="Delayed"
        value={data.delayed}
        icon={<ExclamationTriangleIcon />}
        subtitle="current period"
        color="accent-2"
      />
      <MetricCard
        label="Completed"
        value={data.completed}
        icon={<FlagIcon />}
        subtitle="vs. previous period"
        color="accent-3"
        trend={data.trends?.completed}
      />
    </div>
  );
}
