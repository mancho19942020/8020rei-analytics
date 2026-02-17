/**
 * Delivery Timeline Widget
 *
 * Displays a sortable, paginated table of delivery timeline entries.
 * Shows issue key, summary, due date, resolved date, and days of delay.
 * Delay is color-coded: negative = green (early), 0 = green (on time),
 * positive = red (late). Null resolved dates display as a dash.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';
import type { DeliveryTimelineEntry } from '@/types/product';

interface DeliveryTimelineWidgetProps {
  data: DeliveryTimelineEntry[];
}

export function DeliveryTimelineWidget({ data }: DeliveryTimelineWidgetProps) {
  // Define table columns
  const columns: Column[] = useMemo(
    () => [
      {
        field: 'issue_key',
        header: 'Key',
        type: 'text',
        width: 100,
        sortable: true,
      },
      {
        field: 'summary',
        header: 'Summary',
        type: 'text',
        width: 250,
        sortable: true,
      },
      {
        field: 'due_date',
        header: 'Due Date',
        type: 'date',
        width: 120,
        sortable: true,
      },
      {
        field: 'resolved_date',
        header: 'Resolved Date',
        type: 'date',
        width: 130,
        sortable: true,
      },
      {
        field: 'days_of_delay',
        header: 'Delay',
        type: 'number',
        width: 120,
        sortable: true,
      },
    ],
    []
  );

  // Transform data to handle null resolved_date display
  const tableData = useMemo(() => {
    return data.map((row) => ({
      ...row,
      resolved_date: row.resolved_date ?? '-',
    }));
  }, [data]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={tableData}
          rowKey="issue_key"
          sortable
          paginated
          defaultPageSize={10}
          rowLabel="deliveries"
        />
      </div>
    </div>
  );
}
