/**
 * Country Widget
 *
 * Displays users by country using a horizontal bar chart.
 * Shows the top countries by user count with percentages.
 */

'use client';

import { BaseHorizontalBarChart, HorizontalBarDataPoint } from '@/components/charts';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface CountryData {
  country: string;
  users: number;
  events: number;
  percentage?: number;
  trend?: TrendData;
}

interface CountryWidgetProps {
  data: CountryData[];
}

export function CountryWidget({ data }: CountryWidgetProps) {
  // Transform data for the chart
  const chartData: HorizontalBarDataPoint[] = data.map((item) => ({
    label: item.country || '(not set)',
    value: item.users,
  }));

  return (
    <div className="w-full h-full">
      <BaseHorizontalBarChart
        data={chartData}
        color="rgb(59, 130, 246)"
        yAxisWidth={120}
        tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'Users']}
      />
    </div>
  );
}
