/**
 * API Response Time Trend Widget
 *
 * Line chart showing average response time over time.
 * Uses BaseLineChart for single-series display.
 */

'use client';

import { useMemo } from 'react';
import { BaseLineChart } from '@/components/charts';

interface TimeSeriesPoint {
  date: string;
  calls: number;
  uniqueClients: number;
  avgResponseMs: number;
  errors: number;
  successes: number;
}

interface ApiResponseTrendWidgetProps {
  data: TimeSeriesPoint[];
}

function formatDate(dateStr: string): string {
  if (dateStr.includes(' ')) {
    const [date, time] = dateStr.split(' ');
    const d = new Date(date);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`;
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ApiResponseTrendWidget({ data }: ApiResponseTrendWidgetProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        label: formatDate(d.date),
        value: d.avgResponseMs,
      })),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No usage data for this period
      </div>
    );
  }

  return (
    <BaseLineChart
      data={chartData}
      color="rgb(99, 102, 241)"
      showDots={false}
      tooltipFormatter={(value) => [`${value?.toLocaleString() ?? 0} ms`, 'Avg Response']}
    />
  );
}
