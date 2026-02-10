/**
 * Alerts By Category Widget
 *
 * Displays alert distribution by category as a donut chart.
 * Categories: Platform, Client, Feature, Engagement, Growth
 */

'use client';

import { BaseDonutChart, DonutChartDataPoint } from '@/components/charts';

interface AlertsByCategoryData {
  category: string;
  count: number;
}

interface AlertsByCategoryWidgetProps {
  data: AlertsByCategoryData[];
}

// Custom color palette for alert categories - using semantic colors
const CATEGORY_COLORS: Record<string, string> = {
  'Platform': 'rgb(59, 130, 246)',   // blue
  'Client': 'rgb(239, 68, 68)',      // red
  'Feature': 'rgb(168, 85, 247)',    // purple
  'Engagement': 'rgb(249, 115, 22)', // orange
  'Growth': 'rgb(34, 197, 94)',      // green
};

const DEFAULT_COLORS = [
  'rgb(59, 130, 246)',   // blue
  'rgb(239, 68, 68)',    // red
  'rgb(168, 85, 247)',   // purple
  'rgb(249, 115, 22)',   // orange
  'rgb(34, 197, 94)',    // green
  'rgb(20, 184, 166)',   // teal
  'rgb(6, 182, 212)',    // cyan
  'rgb(99, 102, 241)',   // indigo
];

export function AlertsByCategoryWidget({ data }: AlertsByCategoryWidgetProps) {
  // Transform data for the chart, maintaining category color mapping
  const chartData: DonutChartDataPoint[] = data.map((item) => ({
    label: item.category,
    value: item.count,
  }));

  // Get colors in the order of the data
  const colors = data.map((item, index) =>
    CATEGORY_COLORS[item.category] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  );

  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-content-secondary">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">No Active Alerts</p>
          <p className="text-xs text-content-tertiary mt-1">All systems healthy</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <BaseDonutChart
        data={chartData}
        colors={colors}
        showLabels={true}
        tooltipFormatter={(value, name, percentage) => [
          `${value} alert${value !== 1 ? 's' : ''} (${percentage}%)`,
          name
        ]}
      />
    </div>
  );
}
