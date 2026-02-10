/**
 * Bar Chart Widget
 *
 * Displays horizontal bar chart data for comparisons.
 * Uses the BaseHorizontalBarChart component for consistent styling and centering.
 */

'use client';

import { useMemo } from 'react';
import { BaseHorizontalBarChart, HorizontalBarDataPoint } from '@/components/charts';

interface BarChartWidgetProps {
  data: { feature: string; views: number }[];
}

export function BarChartWidget({ data }: BarChartWidgetProps) {
  const formattedData: HorizontalBarDataPoint[] = useMemo(() =>
    data.map(item => ({
      label: item.feature,
      value: item.views,
    })),
    [data]
  );

  return (
    <BaseHorizontalBarChart
      data={formattedData}
      color="rgb(59, 130, 246)"
      yAxisWidth={130}
      tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'Views']}
    />
  );
}
