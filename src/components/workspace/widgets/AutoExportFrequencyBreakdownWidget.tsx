/**
 * Auto Export Frequency Breakdown Widget
 *
 * Donut showing the composition of active configurations by schedule
 * (daily / weekly / monthly / quarterly), aggregated across the latest
 * snapshot per domain.
 */

'use client';

import { BaseDonutChart } from '@/components/charts';
import type { AutoExportFrequencyBreakdown } from '@/types/auto-export';

interface AutoExportFrequencyBreakdownWidgetProps {
  data: AutoExportFrequencyBreakdown;
}

const FREQUENCY_COLORS = [
  'var(--color-main-500)',      // daily
  'var(--color-accent-1-500)',  // weekly
  'var(--color-accent-2-500)',  // monthly
  'var(--color-accent-3-500)',  // quarterly
];

export function AutoExportFrequencyBreakdownWidget({ data }: AutoExportFrequencyBreakdownWidgetProps) {
  const chartData = [
    { label: 'Daily', value: data.daily },
    { label: 'Weekly', value: data.weekly },
    { label: 'Monthly', value: data.monthly },
    { label: 'Quarterly', value: data.quarterly },
  ].filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No active configurations yet
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <BaseDonutChart
        data={chartData}
        colors={FREQUENCY_COLORS}
        legendPosition="bottom"
        showLabels
        labelThreshold={0.05}
      />
    </div>
  );
}
