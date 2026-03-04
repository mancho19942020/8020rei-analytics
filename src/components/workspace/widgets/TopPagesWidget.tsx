/**
 * Top Pages Widget
 *
 * Table showing the most viewed pages in the application.
 * Uses AxisTable for consistent design system styling.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';

interface TopPageData {
  path: string;
  views: number;
  unique_users: number;
}

interface TopPagesWidgetProps {
  data: TopPageData[];
}

export function TopPagesWidget({ data }: TopPagesWidgetProps) {
  const columns: Column[] = useMemo(() => [
    {
      field: 'path',
      header: 'Page',
      type: 'text',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm" title={String(value || '/')}>
          {String(value || '/')}
        </span>
      ),
    },
    {
      field: 'views',
      header: 'Views',
      type: 'number',
      sortable: true,
    },
    {
      field: 'unique_users',
      header: 'Users',
      type: 'number',
      sortable: true,
    },
  ], []);

  const tableData = useMemo(() =>
    data.map((item, index) => ({
      ...item,
      _id: `${item.path || 'root'}-${index}`,
      path: item.path || '/',
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
          emptyMessage="No page data available"
        />
      </div>
    </div>
  );
}
