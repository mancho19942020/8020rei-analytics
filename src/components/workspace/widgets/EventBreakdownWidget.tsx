/**
 * Event Breakdown Widget
 *
 * Displays event type distribution using a horizontal bar chart.
 * Shows event counts with trend indicators.
 */

'use client';

import { BaseHorizontalBarChart, HorizontalBarDataPoint } from '@/components/charts';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface EventBreakdownData {
  event_name: string;
  count: number;
  unique_users: number;
  trend?: TrendData;
  percentage?: number;
}

interface EventBreakdownWidgetProps {
  data: EventBreakdownData[];
}

// Event name display mapping
const eventNameMap: Record<string, string> = {
  click: 'Click',
  page_view: 'Page View',
  scroll: 'Scroll',
  user_engagement: 'User Engagement',
  form_start: 'Form Start',
  session_start: 'Session Start',
  first_visit: 'First Visit',
  form_submit: 'Form Submit',
};

export function EventBreakdownWidget({ data }: EventBreakdownWidgetProps) {
  // Transform data for the chart
  const chartData: HorizontalBarDataPoint[] = data.map((item) => ({
    label: eventNameMap[item.event_name] || item.event_name,
    value: item.count,
  }));

  return (
    <div className="w-full h-full flex flex-col">
      <BaseHorizontalBarChart
        data={chartData}
        color="rgb(59, 130, 246)"
        yAxisWidth={130}
        tooltipFormatter={(value) => [
          `${(value ?? 0).toLocaleString()} events`,
          'Count'
        ]}
      />
    </div>
  );
}
