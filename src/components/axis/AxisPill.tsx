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
 * - good: Green value — renders with AxisTag (success) from the design system
 * - bad: Red value — renders with AxisTag (error) from the design system
 *
 * FEATURES:
 * - Raised background for visual distinction
 * - Label + value layout with semantic coloring
 * - Good/bad values use official AxisTag component for consistent styling
 * - Non-interactive by design (display-only)
 * - Designed for insights bars and metric displays
 */

'use client';

import React from 'react';
import { AxisTooltip } from './AxisTooltip';
import { AxisTag } from './AxisTag';

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

const TAG_COLOR_MAP = {
  good: 'success',
  bad: 'error',
} as const;

export function AxisPill({
  label,
  value,
  type = 'default',
  tooltip,
  className = '',
}: AxisPillProps) {
  return (
    <div
      className={`flex-1 flex items-center justify-between px-3 py-1 bg-surface-raised rounded-lg ${className}`}
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

      {/* Value — good/bad use official AxisTag from the design system */}
      {type === 'default' ? (
        <span className="text-h5 whitespace-nowrap tabular-nums text-content-primary">
          {value}
        </span>
      ) : (
        <AxisTag color={TAG_COLOR_MAP[type]} size="sm">
          {value}
        </AxisTag>
      )}
    </div>
  );
}
