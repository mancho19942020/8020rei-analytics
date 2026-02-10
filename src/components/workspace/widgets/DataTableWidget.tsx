/**
 * Data Table Widget
 *
 * Displays tabular data with sorting and pagination.
 * Table is scrollable with sticky pagination always visible at bottom.
 */

'use client';

import { ClientsTable } from '@/components/dashboard/ClientsTable';

interface DataTableWidgetProps {
  data: { client: string; events: number; users: number; page_views: number }[];
}

export function DataTableWidget({ data }: DataTableWidgetProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <ClientsTable data={data} showTitle={false} />
    </div>
  );
}
