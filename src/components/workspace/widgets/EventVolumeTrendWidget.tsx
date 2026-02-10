/**
 * Event Volume Trend Widget
 *
 * Displays event volume over time using a stacked bar chart.
 * Shows daily event counts by event type.
 */

'use client';

import { useMemo } from 'react';
import { BaseStackedBarChart, StackedBarDataPoint, StackedBarSeries } from '@/components/charts';

interface EventVolumeTrendData {
  event_date: string;
  event_name: string;
  count: number;
}

interface EventVolumeTrendWidgetProps {
  data: EventVolumeTrendData[];
}

// Event colors for the stacked chart
const eventColors: Record<string, string> = {
  page_view: '#3b82f6',      // Blue
  click: '#22c55e',          // Green
  scroll: '#f59e0b',         // Amber
  user_engagement: '#8b5cf6', // Purple
  form_start: '#ec4899',     // Pink
  session_start: '#06b6d4',  // Cyan
};

// Event name display mapping
const eventNameMap: Record<string, string> = {
  click: 'Click',
  page_view: 'Page View',
  scroll: 'Scroll',
  user_engagement: 'User Engagement',
  form_start: 'Form Start',
  session_start: 'Session Start',
};

export function EventVolumeTrendWidget({ data }: EventVolumeTrendWidgetProps) {
  // Transform data for the stacked bar chart
  const { chartData, series } = useMemo(() => {
    // Group data by date
    const dateMap = new Map<string, Record<string, number>>();
    const eventTypes = new Set<string>();

    data.forEach((item) => {
      eventTypes.add(item.event_name);

      if (!dateMap.has(item.event_date)) {
        dateMap.set(item.event_date, {});
      }

      const dateData = dateMap.get(item.event_date)!;
      dateData[item.event_name] = item.count;
    });

    // Sort dates and format
    const sortedDates = Array.from(dateMap.keys()).sort();

    // Create chart data
    const chartData: StackedBarDataPoint[] = sortedDates.map((date) => {
      const dateData = dateMap.get(date) || {};
      const formattedDate = `${date.slice(4, 6)}/${date.slice(6, 8)}`;

      return {
        label: formattedDate,
        ...dateData,
      };
    });

    // Create series config
    const series: StackedBarSeries[] = Array.from(eventTypes).map((eventName) => ({
      dataKey: eventName,
      name: eventNameMap[eventName] || eventName,
      color: eventColors[eventName] || '#6b7280',
    }));

    return { chartData, series };
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col">
      <BaseStackedBarChart
        data={chartData}
        series={series}
        showLegend={true}
      />
    </div>
  );
}
