/**
 * Rapid Response Status Breakdown Widget
 *
 * Donut chart showing the distribution of mailing statuses.
 * Uses BaseDonutChart from the design system.
 */

'use client';

import { BaseDonutChart } from '@/components/charts/BaseDonutChart';
import type { RrStatusBreakdown } from '@/types/rapid-response';

interface RrStatusBreakdownWidgetProps {
  data: RrStatusBreakdown[];
}

// Colors use the design system's categorical palette
const STATUS_COLORS = [
  'var(--color-success-500)',    // Delivered — green
  'var(--color-main-500)',       // Sent (In Transit) — blue
  'var(--color-alert-500)',      // On Hold — amber
  'var(--color-accent-2-500)',   // Protected — purple
  'var(--color-error-500)',      // Undeliverable — red
  'var(--color-error-700)',      // Error — dark red
];

export function RrStatusBreakdownWidget({ data }: RrStatusBreakdownWidgetProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
        No status data available yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    label: d.status,
    value: d.count,
  }));

  return (
    <div className="h-full w-full p-2">
      <BaseDonutChart
        data={chartData}
        colors={STATUS_COLORS}
        legendPosition="bottom"
        showLabels={true}
        labelThreshold={0.03}
      />
    </div>
  );
}
