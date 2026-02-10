/**
 * Feature Usage Widget
 *
 * Horizontal bar chart showing views per feature.
 * Uses 100% of available height - widget should be sized appropriately in the layout.
 */

'use client';

import { useMemo } from 'react';
import { BaseHorizontalBarChart, HorizontalBarDataPoint } from '@/components/charts';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface FeatureViewData {
  feature: string;
  views: number;
  unique_users: number;
  trend?: TrendData;
}

interface FeatureUsageWidgetProps {
  data: FeatureViewData[];
}

export function FeatureUsageWidget({ data }: FeatureUsageWidgetProps) {
  const formattedData: HorizontalBarDataPoint[] = useMemo(() =>
    data.map((item) => ({
      label: item.feature,
      value: item.views,
    })),
    [data]
  );

  return (
    <BaseHorizontalBarChart
      data={formattedData}
      color="rgb(59, 130, 246)"
      yAxisWidth={140}
      tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'Views']}
    />
  );
}
