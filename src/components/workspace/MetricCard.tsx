/**
 * Shared MetricCard — Design System Component
 *
 * Simplified Grafana-style stat card. Shows:
 *   Row 1: Label (left) + trend badge with tooltip (right)
 *   Row 2: Abbreviated hero value filling the card
 *
 * Number rule: max 3 significant digits with abbreviation (K, M, B).
 * Examples: 29,457 → 29.5K  |  12,743,402 → $12.7M  |  612 → 612
 *
 * Sparklines removed. Subtitle shows as tooltip on the trend badge.
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
  /** Shown as tooltip when hovering the trend badge */
  subtitle?: string;
  /** CSS class(es) applied to the icon container background. Defaults to 'bg-main-700' */
  iconBgClass?: string;
  /** CSS class(es) applied to the icon color. Defaults to 'text-white' */
  iconTextClass?: string;
  /** @deprecated Sparklines removed — kept for backward compatibility, ignored */
  sparklineColor?: string;
  /** @deprecated Sparklines removed — kept for backward compatibility, ignored */
  sparklineData?: number[];
  trend?: TrendData;
  /** How to display the value. 'currency' prepends $ */
  format?: 'number' | 'currency';
}

/** Abbreviate a number to max 3 significant digits + suffix */
function abbreviate(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    return val % 1 === 0 ? `${val}B` : `${val.toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    const val = num / 1_000_000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const val = num / 1_000;
    return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
  }
  return num.toLocaleString();
}

function TrendBadge({ trend, tooltip }: { trend: TrendData; tooltip?: string }) {
  const { value, isPositive } = trend;
  const isNeutral = value === 0;
  const tooltipText = tooltip || (isNeutral ? 'No change vs. previous period' : isPositive ? 'Up vs. previous period' : 'Down vs. previous period');

  const colorClass = isNeutral
    ? 'text-content-tertiary'
    : isPositive
      ? 'text-success-700 dark:text-success-300'
      : 'text-error-700 dark:text-error-300';

  return (
    <div className="relative group/trend flex-shrink-0">
      <div className={`flex items-center gap-0.5 text-xs font-medium cursor-default ${colorClass}`}>
        {isNeutral ? (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        ) : isPositive ? (
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
      {/* Instant CSS tooltip */}
      <div className="absolute right-0 top-full mt-1 px-2 py-1 rounded-md bg-surface-overlay text-content-primary text-[11px] font-normal whitespace-nowrap opacity-0 group-hover/trend:opacity-100 transition-opacity duration-75 pointer-events-none z-10 border border-stroke">
        {tooltipText}
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  subtitle,
  trend,
  format = 'number',
}: MetricCardProps) {
  const displayValue = useMemo(() => {
    // If value is already a string (e.g. "812 ms", "45.2%"), pass through
    if (typeof value === 'string') {
      // Try to abbreviate if it's a pure number string
      const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
      if (isNaN(parsed)) return value;
      // Keep the non-numeric parts (like %, ms)
      const suffix = value.replace(/[0-9.,\s$-]/g, '').trim();
      if (suffix) return `${abbreviate(parsed)}${suffix ? ' ' + suffix : ''}`;
      return abbreviate(parsed);
    }
    if (format === 'currency') {
      return `$${abbreviate(value)}`;
    }
    return abbreviate(value);
  }, [value, format]);

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface-raised border border-stroke hover:border-stroke-strong transition-all duration-200 min-w-0 flex-1 h-full">
      {/* Header: label + trend */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-sm font-medium text-content-secondary truncate">{label}</span>
        {trend && <TrendBadge trend={trend} tooltip={subtitle} />}
      </div>
      {/* Hero value */}
      <div className="text-[2.25rem] font-bold text-content-primary tabular-nums leading-[40px] tracking-tight">
        {displayValue}
      </div>
    </div>
  );
}
