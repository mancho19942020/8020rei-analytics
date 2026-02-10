/**
 * Operating System Widget
 *
 * Displays operating system distribution (Windows, macOS, iOS, Android, etc.)
 * as a horizontal bar chart.
 */

'use client';

import { BaseHorizontalBarChart } from '@/components/charts';

interface OperatingSystemData {
  os: string;
  users: number;
  events: number;
}

interface OperatingSystemWidgetProps {
  data: OperatingSystemData[];
}

export function OperatingSystemWidget({ data }: OperatingSystemWidgetProps) {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    label: item.os || '(not set)',
    value: item.users,
  }));

  return (
    <div className="w-full h-full">
      <BaseHorizontalBarChart
        data={chartData}
        color="rgb(34, 197, 94)"
        yAxisWidth={80}
        tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'Users']}
      />
    </div>
  );
}
