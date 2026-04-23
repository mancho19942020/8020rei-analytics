/**
 * Asana Section Breakdown Widget
 *
 * Donut chart showing task distribution across board sections.
 * Uses BaseDonutChart from the design system.
 * Follows the RrStatusBreakdownWidget pattern.
 */

'use client';

import { BaseDonutChart } from '@/components/charts/BaseDonutChart';
import type { AsanaSectionBreakdownEntry } from '@/types/asana-tasks';

// Colors use the design system's categorical palette
const SECTION_COLORS = [
  'var(--color-success-500)',    // Done — green
  'var(--color-main-500)',       // In progress — blue
  'var(--color-alert-500)',      // To do / Open — amber
  'var(--color-accent-3-500)',   // Backlog — orange
  'var(--color-accent-2-500)',   // Projects — purple
  'var(--color-neutral-500)',    // Other — gray
];

interface AsanaSectionBreakdownWidgetProps {
  data: AsanaSectionBreakdownEntry[];
}

export function AsanaSectionBreakdownWidget({ data }: AsanaSectionBreakdownWidgetProps) {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
        No section data available
      </div>
    );
  }

  const chartData = data.map((entry) => ({
    label: entry.section,
    value: entry.count,
  }));

  return (
    <div className="h-full w-full p-2">
      <BaseDonutChart
        data={chartData}
        colors={SECTION_COLORS}
        legendPosition="bottom"
        showLabels={true}
        labelThreshold={0.03}
      />
    </div>
  );
}
