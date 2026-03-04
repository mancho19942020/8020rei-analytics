/**
 * City Widget
 *
 * Displays users by city in a table format.
 * Shows the top cities by user count with their state/region.
 * Uses AxisTable for consistent design system styling.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column, RowData } from '@/types/table';

interface CityData {
  city: string;
  region: string;
  users: number;
  events: number;
}

interface CityWidgetProps {
  data: CityData[];
}

export function CityWidget({ data }: CityWidgetProps) {
  const totalUsers = useMemo(
    () => data.reduce((sum, item) => sum + item.users, 0),
    [data]
  );

  const columns: Column[] = useMemo(() => [
    {
      field: 'city',
      header: 'City',
      type: 'text',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{String(value || '(not set)')}</span>
      ),
    },
    {
      field: 'region',
      header: 'State',
      type: 'text',
      sortable: true,
      render: (value) => (
        <span className="text-content-secondary">{String(value || '(not set)')}</span>
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
      _id: `${item.city}-${item.region}-${index}`,
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
          emptyMessage="No city data available"
        />
      </div>
    </div>
  );
}
