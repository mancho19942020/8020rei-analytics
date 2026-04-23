/**
 * Active Days Widget
 *
 * Displays distribution of active days per user
 * as a horizontal bar chart.
 */

'use client';

import { BaseHorizontalBarChart } from '@/components/charts';

interface ActiveDaysData {
  active_days: number;
  user_count: number;
}

interface ActiveDaysWidgetProps {
  data: ActiveDaysData[];
}

export function ActiveDaysWidget({ data }: ActiveDaysWidgetProps) {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    label: `${item.active_days} days`,
    value: item.user_count,
  }));

  return (
    <div className="w-full h-full">
      <BaseHorizontalBarChart
        data={chartData}
        color="rgb(59, 130, 246)"
        yAxisWidth={70}
        tooltipFormatter={(value) => [
          `${(value ?? 0).toLocaleString()} users`,
          'Users',
        ]}
      />
    </div>
  );
}
