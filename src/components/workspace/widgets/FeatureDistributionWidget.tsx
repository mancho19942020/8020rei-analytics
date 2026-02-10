/**
 * Feature Distribution Widget
 *
 * Donut chart showing percentage distribution of views across features.
 * Uses the BaseDonutChart component for consistency.
 */

'use client';

import { useMemo } from 'react';
import { BaseDonutChart, DonutChartDataPoint } from '@/components/charts';

interface FeatureViewData {
  feature: string;
  views: number;
  unique_users: number;
}

interface FeatureDistributionWidgetProps {
  data: FeatureViewData[];
}

// Feature colors - consistent color palette
const COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#06b6d4', // cyan
];

export function FeatureDistributionWidget({ data }: FeatureDistributionWidgetProps) {
  // Transform data for the chart
  const chartData: DonutChartDataPoint[] = useMemo(() =>
    data.map((item) => ({
      label: item.feature,
      value: item.views,
    })),
    [data]
  );

  return (
    <BaseDonutChart
      data={chartData}
      colors={COLORS}
      showLabels={true}
      labelThreshold={0.05}
      tooltipFormatter={(value, name, percentage) => [
        `${value.toLocaleString()} views (${percentage}%)`,
        name
      ]}
    />
  );
}
