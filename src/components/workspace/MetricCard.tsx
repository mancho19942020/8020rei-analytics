/**
 * Shared MetricCard — Design System Component
 *
 * A reusable stat card used across all metric overview widgets. Displays a
 * labeled metric value with an icon, optional trend badge, optional subtitle,
 * and an auto-generated or externally-provided sparkline.
 *
 * Previously duplicated across 9 widget files. Extracted per design-kit-guardian audit (2026-02-24).
 */

'use client';

import { ReactNode, useMemo } from 'react';

export interface TrendData {
  value: number;
  isPositive: boolean;
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  /** Optional label rendered below the trend badge */
  subtitle?: string;
  /** CSS class(es) applied to the icon container background. Defaults to 'bg-main-600 dark:bg-main-700' */
  iconBgClass?: string;
  /** CSS class(es) applied to the icon color. Defaults to 'text-white' */
  iconTextClass?: string;
  /** CSS color string for the sparkline stroke. Defaults to green/red based on trend.isPositive */
  sparklineColor?: string;
  /** Pre-computed data points for sparkline. If omitted, auto-generated from value and trend */
  sparklineData?: number[];
  trend?: TrendData;
  /** How to display the value. 'currency' prepends $ and strips decimals */
  format?: 'number' | 'currency';
}

function MiniSparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 48;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

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

function TrendBadge({ trend }: { trend: TrendData }) {
  const { value, isPositive } = trend;
  if (value === 0) return null;
  return (
    <div
      className={[
        'flex items-center gap-0.5 text-xs font-medium',
        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      ].join(' ')}
    >
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

export function MetricCard({
  label,
  value,
  icon,
  subtitle,
  iconBgClass = 'bg-main-600 dark:bg-main-700',
  iconTextClass = 'text-white',
  sparklineColor,
  sparklineData,
  trend,
  format = 'number',
}: MetricCardProps) {
  const isPositive = trend?.isPositive ?? true;

  const chartData = useMemo(() => {
    if (sparklineData && sparklineData.length >= 2) return sparklineData;
    const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 100;
    const baseValue = numValue * 0.8;
    const trendDirection = isPositive ? 1 : -1;
    return Array.from({ length: 7 }, (_, i) =>
      baseValue + Math.random() * numValue * 0.2 + trendDirection * numValue * 0.2 * (i / 6)
    );
  }, [sparklineData, value, isPositive]);

  const displayValue = useMemo(() => {
    if (typeof value === 'string') return value;
    if (format === 'currency') {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return value?.toLocaleString() ?? '0';
  }, [value, format]);

  const strokeColor = sparklineColor ?? (isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)');

  return (
    <div className="flex flex-col p-3 bg-surface-raised rounded-xl border border-stroke hover:border-stroke-strong hover:shadow-sm transition-all duration-200 h-full">
      <div className="flex items-center gap-2 mb-1">
        <div className={`flex-shrink-0 w-6 h-6 rounded-md ${iconBgClass} flex items-center justify-center ${iconTextClass}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-content-secondary truncate">{label}</span>
      </div>
      <div className="text-2xl font-bold text-content-primary tabular-nums flex-1">
        {displayValue}
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          {trend && <TrendBadge trend={trend} />}
          {subtitle && <span className="text-xs text-content-tertiary">{subtitle}</span>}
        </div>
        <MiniSparkline data={chartData} color={strokeColor} />
      </div>
    </div>
  );
}
