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
  // Value styling — good/bad get a tinted background badge for high contrast
  const valueStyles: Record<PillType, { color: string; bg: string }> = {
    default: { color: 'var(--text-primary)', bg: 'transparent' },
    good: { color: 'var(--color-success-900)', bg: 'var(--color-success-100)' },
    bad: { color: 'var(--color-error-900)', bg: 'var(--color-error-100)' },
  };
  const vs = valueStyles[type];

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

      {/* Value — good/bad states get a tinted badge for clear contrast */}
      {type === 'default' ? (
        <span className="text-h5 whitespace-nowrap tabular-nums" style={{ color: vs.color }}>
          {value}
        </span>
      ) : (
        <span
          className="text-h5 whitespace-nowrap tabular-nums px-2 py-0.5 rounded-md font-semibold"
          style={{ color: vs.color, backgroundColor: vs.bg }}
        >
          {value}
        </span>
      )}
    </div>
  );
}
