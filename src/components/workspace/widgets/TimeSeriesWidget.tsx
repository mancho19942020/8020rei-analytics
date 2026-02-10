/**
 * Time Series Widget
 *
 * Displays time-series data in a line chart format.
 * Uses the BaseLineChart component for consistent styling and centering.
 */

'use client';

import { useMemo } from 'react';
import { BaseLineChart, LineChartDataPoint } from '@/components/charts';

interface TimeSeriesWidgetProps {
  data: { event_date: string; users: number; events: number }[];
}

export function TimeSeriesWidget({ data }: TimeSeriesWidgetProps) {
  const formattedData: LineChartDataPoint[] = useMemo(() =>
    data.map(item => ({
      label: `${item.event_date.slice(4, 6)}/${item.event_date.slice(6, 8)}`,
      value: item.users,
    })),
    [data]
  );

  return (
    <BaseLineChart
      data={formattedData}
      color="rgb(59, 130, 246)"
      tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'Users']}
    />
  );
}
