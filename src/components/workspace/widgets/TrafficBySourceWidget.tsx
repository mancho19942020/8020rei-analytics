/**
 * Traffic By Source Widget
 *
 * Displays traffic breakdown by source (google, direct, etc.)
 * as a horizontal bar chart with trend indicators.
 */

'use client';

import { BaseHorizontalBarChart } from '@/components/charts';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface TrafficBySourceData {
  source: string;
  users: number;
  events: number;
  trend?: TrendData;
}

interface TrafficBySourceWidgetProps {
  data: TrafficBySourceData[];
}

export function TrafficBySourceWidget({ data }: TrafficBySourceWidgetProps) {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    label: item.source,
    value: item.users,
  }));

  return (
    <div className="w-full h-full">
      <BaseHorizontalBarChart
        data={chartData}
        color="rgb(59, 130, 246)"
        yAxisWidth={100}
        tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'Users']}
      />
    </div>
  );
}
