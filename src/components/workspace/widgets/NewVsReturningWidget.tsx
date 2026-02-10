/**
 * New vs Returning Widget
 *
 * Stacked bar chart showing new vs returning users per day.
 * Uses the BaseStackedBarChart component for consistent styling and centering.
 */

'use client';

import { useMemo } from 'react';
import { BaseStackedBarChart, StackedBarDataPoint, StackedBarSeries } from '@/components/charts';

interface NewVsReturningWidgetProps {
  data: {
    event_date: string;
    new_users: number;
    returning_users: number;
  }[];
}

// Define the series configuration
const chartSeries: StackedBarSeries[] = [
  { dataKey: 'new_users', name: 'New Users', color: '#22c55e' },
  { dataKey: 'returning_users', name: 'Returning Users', color: '#3b82f6' },
];

export function NewVsReturningWidget({ data }: NewVsReturningWidgetProps) {
  const formattedData: StackedBarDataPoint[] = useMemo(() =>
    data.map((item) => ({
      label: `${item.event_date.slice(4, 6)}/${item.event_date.slice(6, 8)}`,
      new_users: item.new_users,
      returning_users: item.returning_users,
    })),
    [data]
  );

  return (
    <BaseStackedBarChart
      data={formattedData}
      series={chartSeries}
      showLegend={true}
    />
  );
}
