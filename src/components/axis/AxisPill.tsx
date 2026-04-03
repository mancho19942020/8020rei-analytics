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
import { AxisTooltip } from './AxisTooltip';

type PillType = 'default' | 'good' | 'bad';

export interface AxisPillProps {
  /** The metric label/description */
  label: string;
  /** The metric value to display */
  value: string | number;
  /** Type determines value color - default, good (green), bad (red) */
  type?: PillType;
  /** Optional tooltip shown on hover over the label */
  tooltip?: string;
  /** Additional CSS classes */
  className?: string;
}

export function AxisPill({
  label,
  value,
  type = 'default',
  tooltip,
  className = '',
}: AxisPillProps) {
  // Type-based value color classes with dark mode support
  // Using lighter shades (300) in dark mode for better contrast on raised surfaces
  const valueColorClass = {
    default: 'text-content-primary',
    good: 'text-success-700 dark:text-success-300',
    bad: 'text-error-700 dark:text-error-300',
  }[type];

  return (
    <div
      className={`flex-1 flex items-center justify-between px-3 py-1.5 bg-surface-raised rounded-lg ${className}`}
    >
      {/* Label */}
      {tooltip ? (
        <AxisTooltip content={tooltip} placement="top" maxWidth={260}>
          <span className="text-label text-content-tertiary whitespace-nowrap cursor-help" style={{ borderBottom: '1px dotted var(--text-tertiary)' }}>
            {label}:
          </span>
        </AxisTooltip>
      ) : (
        <span className="text-label text-content-tertiary whitespace-nowrap">
          {label}:
        </span>
      )}

      {/* Value */}
      <span className={`text-h5 whitespace-nowrap tabular-nums ${valueColorClass}`}>
        {value}
      </span>
    </div>
  );
}
