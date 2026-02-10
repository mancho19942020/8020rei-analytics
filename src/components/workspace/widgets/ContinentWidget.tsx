/**
 * Continent Widget
 *
 * Displays activity by continent using a donut chart.
 * Shows the distribution of users across continents.
 */

'use client';

import { BaseDonutChart, DonutChartDataPoint } from '@/components/charts';

interface ContinentData {
  continent: string;
  users: number;
  events: number;
}

interface ContinentWidgetProps {
  data: ContinentData[];
}

export function ContinentWidget({ data }: ContinentWidgetProps) {
  // Transform data for the chart
  const chartData: DonutChartDataPoint[] = data.map((item) => ({
    label: item.continent || '(not set)',
    value: item.users,
  }));

  // Calculate total for percentage in tooltip
  const total = data.reduce((sum, item) => sum + item.users, 0);

  return (
    <div className="w-full h-full">
      <BaseDonutChart
        data={chartData}
        showLegend={true}
        showLabels={true}
        innerRadius="50%"
        outerRadius="80%"
        tooltipFormatter={(value, name, percentage) => [
          `${value.toLocaleString()} users (${percentage}%)`,
          name
        ]}
      />
    </div>
  );
}
