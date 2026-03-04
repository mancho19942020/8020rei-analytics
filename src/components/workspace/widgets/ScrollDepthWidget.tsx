/**
 * Scroll Depth by Page Widget
 *
 * Displays scroll events grouped by page/feature in a table format.
 * Shows scroll events and unique users per page.
 * Uses AxisTable for consistent design system styling.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column, RowData } from '@/types/table';

interface ScrollDepthData {
  page: string;
  scroll_events: number;
  unique_users: number;
}

interface ScrollDepthWidgetProps {
  data: ScrollDepthData[];
}

export function ScrollDepthWidget({ data }: ScrollDepthWidgetProps) {
  const totalScrolls = useMemo(
    () => data.reduce((sum, item) => sum + item.scroll_events, 0),
    [data]
  );

  const columns: Column[] = useMemo(() => [
    {
      field: 'page',
      header: 'Page',
      type: 'text',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{String(value)}</span>
      ),
    },
    {
      field: 'scroll_events',
      header: 'Scroll Events',
      type: 'number',
      sortable: true,
    },
    {
      field: 'unique_users',
      header: 'Unique Users',
      type: 'number',
      sortable: true,
    },
    {
      field: 'percentage',
      header: '% of Total',
      type: 'percentage',
      sortable: true,
      render: (value) => {
        const pct = typeof value === 'number' ? (value * 100).toFixed(1) : '0.0';
        return (
          <div className="flex items-center justify-center gap-2">
            <div className="w-16 h-1.5 bg-surface-raised rounded-full overflow-hidden">
              <div
                className="h-full bg-main-500 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-12 text-right tabular-nums">{pct}%</span>
          </div>
        );
      },
    },
  ], []);

  const tableData: RowData[] = useMemo(() =>
    data.map((item, index) => ({
      ...item,
      _id: `${item.page}-${index}`,
      percentage: totalScrolls > 0 ? item.scroll_events / totalScrolls : 0,
    })),
    [data, totalScrolls]
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
          emptyMessage="No scroll data available"
        />
      </div>
    </div>
  );
}
