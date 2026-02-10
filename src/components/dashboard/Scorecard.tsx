/**
 * Scorecard Component (Dashboard Metrics)
 *
 * Uses AxisCard.Stat from the Axis design system for consistent styling.
 * Displays key performance indicators with icons and color coding.
 */

'use client';

import { ReactNode } from 'react';
import { AxisCardStat } from '@/components/axis/AxisCard';

type ColorVariant = 'neutral' | 'main' | 'success' | 'error' | 'accent-1' | 'accent-2' | 'accent-3';

interface ScorecardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color?: ColorVariant;
}

export function Scorecard({ label, value, icon, color = 'main' }: ScorecardProps) {
  return (
    <AxisCardStat
      label={label}
      value={value?.toLocaleString() ?? 0}
      icon={icon}
      color={color}
    />
  );
}
