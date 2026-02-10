/**
 * Traffic Browser Widget
 *
 * Displays user distribution by browser
 * as a donut/pie chart using the BaseDonutChart component.
 */

'use client';

import { BaseDonutChart, DonutChartDataPoint } from '@/components/charts';

interface BrowserData {
  browser: string;
  users: number;
  events: number;
}

interface TrafficBrowserWidgetProps {
  data: BrowserData[];
}

// Custom color palette for browsers
const COLORS = [
  'rgb(59, 130, 246)',   // blue
  'rgb(99, 102, 241)',   // indigo
  'rgb(168, 85, 247)',   // purple
  'rgb(236, 72, 153)',   // pink
  'rgb(239, 68, 68)',    // red
  'rgb(249, 115, 22)',   // orange
  'rgb(234, 179, 8)',    // yellow
  'rgb(34, 197, 94)',    // green
  'rgb(20, 184, 166)',   // teal
  'rgb(6, 182, 212)',    // cyan
];

export function TrafficBrowserWidget({ data }: TrafficBrowserWidgetProps) {
  // Transform data for the chart
  const chartData: DonutChartDataPoint[] = data.map((item) => ({
    label: item.browser,
    value: item.users,
  }));

  return (
    <div className="w-full h-full">
      <BaseDonutChart
        data={chartData}
        colors={COLORS}
        showLabels={false}
        tooltipFormatter={(value, name, percentage) => [
          `${value.toLocaleString()} users (${percentage}%)`,
          name
        ]}
      />
    </div>
  );
}
