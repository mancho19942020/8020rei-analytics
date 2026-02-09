/**
 * AxisPill Component (React/Next.js version)
 *
 * A compact, non-clickable label used to display key metrics or values,
 * emphasizing clarity without interaction. Used in insights bars and dashboards.
 *
 * USAGE:
 * <AxisPill label="Properties" value="45K" />
 * <AxisPill label="Revenue" value="$99.9K" type="good" />
 * <AxisPill label="Churn" value="12%" type="bad" />
 *
 * TYPES:
 * - default: Neutral styling - general metrics
 * - good: Green value - positive metrics (growth, profit, success)
 * - bad: Red value - negative metrics (loss, churn, errors)
 *
 * FEATURES:
 * - Raised background for visual distinction
 * - Label + value layout with semantic coloring
 * - Non-interactive by design (display-only)
 * - Designed for insights bars and metric displays
 */

'use client';

import React from 'react';

type PillType = 'default' | 'good' | 'bad';

export interface AxisPillProps {
  /** The metric label/description */
  label: string;
  /** The metric value to display */
  value: string | number;
  /** Type determines value color - default, good (green), bad (red) */
  type?: PillType;
  /** Additional CSS classes */
  className?: string;
}

export function AxisPill({
  label,
  value,
  type = 'default',
  className = '',
}: AxisPillProps) {
  // Type-based value color classes with dark mode support
  const valueColorClass = {
    default: 'text-content-primary',
    good: 'text-success-700 dark:text-success-400',
    bad: 'text-error-700 dark:text-error-400',
  }[type];

  return (
    <div
      className={`flex-1 flex items-center justify-between px-3 py-1.5 bg-surface-raised rounded-lg ${className}`}
    >
      {/* Label */}
      <span className="text-label text-content-tertiary whitespace-nowrap">
        {label}:
      </span>

      {/* Value */}
      <span className={`text-h5 whitespace-nowrap tabular-nums ${valueColorClass}`}>
        {value}
      </span>
    </div>
  );
}
