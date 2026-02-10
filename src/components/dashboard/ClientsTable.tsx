'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';

interface Client {
  client: string;
  events: number;
  users: number;
  page_views: number;
  [key: string]: unknown;
}

interface ClientsTableProps {
  data: Client[];
  showTitle?: boolean;
}

export function ClientsTable({ data, showTitle = true }: ClientsTableProps) {
  // Define table columns
  const columns: Column[] = useMemo(
    () => [
      {
        field: 'client',
        header: 'Client',
        type: 'text',
        width: 250,
        sortable: true,
      },
      {
        field: 'events',
        header: 'Events',
        type: 'number',
        width: 120,
        sortable: true,
      },
      {
        field: 'users',
        header: 'Users',
        type: 'number',
        width: 100,
        sortable: true,
      },
      {
        field: 'page_views',
        header: 'Page Views',
        type: 'number',
        width: 130,
        sortable: true,
      },
    ],
    []
  );

  return (
    <div className="h-full">
      <AxisTable
        title={showTitle ? "Top Clients" : undefined}
        columns={columns}
        data={data}
        rowKey="client"
        sortable
        paginated
        defaultPageSize={25}
        rowLabel="clients"
      />
    </div>
  );
}
