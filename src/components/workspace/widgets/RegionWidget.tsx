/**
 * Region Widget
 *
 * Displays users by US state/region in a table format.
 * Shows the top regions by user count.
 * Uses AxisTable for consistent design system styling.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column, RowData } from '@/types/table';

interface RegionData {
  region: string;
  users: number;
  events: number;
}

interface RegionWidgetProps {
  data: RegionData[];
}

export function RegionWidget({ data }: RegionWidgetProps) {
  const totalUsers = useMemo(
    () => data.reduce((sum, item) => sum + item.users, 0),
    [data]
  );

  const columns: Column[] = useMemo(() => [
    {
      field: 'region',
      header: 'Region / State',
      type: 'text',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{String(value || '(not set)')}</span>
      ),
    },
    {
      field: 'users',
      header: 'Users',
      type: 'number',
      sortable: true,
    },
    {
      field: 'percentage',
      header: '%',
      type: 'percentage',
      sortable: true,
    },
    {
      field: 'events',
      header: 'Events',
      type: 'number',
      sortable: true,
    },
  ], []);

  const tableData: RowData[] = useMemo(() =>
    data.map((item, index) => ({
      ...item,
      _id: `${item.region || 'unknown'}-${index}`,
      percentage: totalUsers > 0 ? item.users / totalUsers : 0,
    })),
    [data, totalUsers]
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
          emptyMessage="No region data available"
        />
      </div>
    </div>
  );
}
