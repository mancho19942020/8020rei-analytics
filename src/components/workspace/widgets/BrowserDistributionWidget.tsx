/**
 * Browser Distribution Widget
 *
 * Displays browser distribution (Chrome, Safari, Firefox, Edge, etc.)
 * as a horizontal bar chart.
 */

'use client';

import { BaseHorizontalBarChart } from '@/components/charts';

interface BrowserData {
  browser: string;
  users: number;
  events: number;
}

interface BrowserDistributionWidgetProps {
  data: BrowserData[];
}

export function BrowserDistributionWidget({ data }: BrowserDistributionWidgetProps) {
  // Transform data for the chart - filter out '(not set)' if there are other browsers
  const filteredData = data.filter((item) => {
    // Keep '(not set)' only if it's the only item
    if (item.browser === null || item.browser === '(not set)') {
      return data.length === 1;
    }
    return true;
  });

  const chartData = filteredData.map((item) => ({
    label: item.browser || '(not set)',
    value: item.users,
  }));

  return (
    <div className="w-full h-full">
      <BaseHorizontalBarChart
        data={chartData}
        color="rgb(59, 130, 246)"
        yAxisWidth={80}
        tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'Users']}
      />
    </div>
  );
}
