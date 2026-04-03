/**
 * Feature Usage Widget
 *
 * Table showing views per feature with sortable columns.
 * Uses AxisTable for consistent design system styling.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column, RowData } from '@/types/table';

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

const columns: Column[] = [
  {
    field: 'feature',
    header: 'Feature',
    width: '33.3%',
    render: (value) => (
      <span className="font-medium">{String(value)}</span>
    ),
  },
  {
    field: 'views',
    header: 'Views',
    type: 'number',
    align: 'center',
    width: '33.3%',
  },
  {
    field: 'unique_users',
    header: 'Unique users',
    type: 'number',
    align: 'center',
    width: '33.3%',
  },
];

export function FeatureUsageWidget({ data }: FeatureUsageWidgetProps) {
  const tableData = useMemo(() =>
    data.map((item, index) => ({
      ...item,
      _id: `${item.feature}-${index}`,
    })),
    [data]
  );

  return (
    <AxisTable
      columns={columns}
      data={tableData as unknown as RowData[]}
      rowKey="_id"
      sortable
      paginated={false}
      emptyMessage="No feature data available"
    />
  );
}
