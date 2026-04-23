'use client';

import { useMemo } from 'react';
import { BaseDonutChart } from '@/components/charts';

interface UserEngagementEntry {
  section: string;
  total_seconds: number;
  unique_users: number;
}

interface PaUserEngagementWidgetProps {
  data: UserEngagementEntry[];
}

const SECTION_COLORS = [
  'var(--color-main-500)',
  'var(--color-success-500)',
  'var(--color-accent-3-500)',
  'var(--color-accent-2-500)',
  'var(--color-error-500)',
  'var(--color-info-500)',
  'var(--color-alert-500)',
  'var(--color-accent-4-500)',
];

function formatSectionLabel(section: string): string {
  return section
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export function PaUserEngagementWidget({ data }: PaUserEngagementWidgetProps) {
  const chartData = useMemo(() => {
    return data
      .filter(d => d.total_seconds > 0)
      .map((d) => ({
        label: formatSectionLabel(d.section),
        value: d.total_seconds,
      }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-content-tertiary text-sm">
        No engagement data yet.
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <BaseDonutChart
        data={chartData}
        colors={SECTION_COLORS}
        tooltipFormatter={(value, _name, _pct) => [formatTime(value), '']}
        showLegend
        legendPosition="bottom"
        showLabels={true}
        labelThreshold={0.03}
      />
    </div>
  );
}
