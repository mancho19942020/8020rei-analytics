/**
 * Feature Usage Widget
 *
 * Table showing views per feature with sortable columns.
 * Uses AxisTable for consistent design system styling.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';

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
  const columns: Column[] = useMemo(() => [
    {
      field: 'feature',
      header: 'Feature',
      type: 'text',
      sortable: true,
    },
    {
      field: 'views',
      header: 'Views',
      type: 'number',
      sortable: true,
    },
    {
      field: 'unique_users',
      header: 'Unique users',
      type: 'number',
      sortable: true,
    },
  ], []);

  const tableData = useMemo(() =>
    data.map((item, index) => ({
      ...item,
      _id: `${item.feature}-${index}`,
    })),
    [data]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={tableData}
          rowKey="_id"
          sortable
          paginated={false}
          emptyMessage="No feature data available"
        />
      </div>
    </div>
  );
}
