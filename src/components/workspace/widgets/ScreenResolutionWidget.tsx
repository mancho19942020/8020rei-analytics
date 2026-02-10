/**
 * Screen Resolution Widget
 *
 * Displays user distribution by screen resolution
 * as a horizontal bar chart.
 */

'use client';

import { BaseHorizontalBarChart } from '@/components/charts';

interface ScreenResolutionData {
  resolution: string;
  users: number;
  events: number;
}

interface ScreenResolutionWidgetProps {
  data: ScreenResolutionData[];
}

export function ScreenResolutionWidget({ data }: ScreenResolutionWidgetProps) {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    label: item.resolution,
    value: item.users,
  }));

  return (
    <div className="w-full h-full">
      <BaseHorizontalBarChart
        data={chartData}
        color="rgb(99, 102, 241)"
        yAxisWidth={100}
        tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'Users']}
      />
    </div>
  );
}
