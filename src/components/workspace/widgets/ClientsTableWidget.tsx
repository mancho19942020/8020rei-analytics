/**
 * Clients Table Widget
 *
 * Displays a table of top clients with:
 * - Client name
 * - Events count
 * - Users count
 * - Page views count
 * - Features used count
 * - Click to select for drill-down
 */

'use client';

import { useMemo, useCallback } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column, RowData } from '@/types/table';

interface ClientData {
  client: string;
  events: number;
  users: number;
  page_views: number;
  features_used: number;
}

interface ClientsTableWidgetProps {
  data: ClientData[];
  selectedClient?: string | null;
  onClientSelect?: (client: string | null) => void;
}

export function ClientsTableWidget({ data, selectedClient, onClientSelect }: ClientsTableWidgetProps) {
  // Define table columns
  const columns: Column[] = useMemo(
    () => [
      {
        field: 'client',
        header: 'Client',
        type: 'text',
        width: 200,
        sortable: true,
      },
      {
        field: 'events',
        header: 'Events',
        type: 'number',
        width: 100,
        sortable: true,
      },
      {
        field: 'users',
        header: 'Users',
        type: 'number',
        width: 80,
        sortable: true,
      },
      {
        field: 'page_views',
        header: 'Page Views',
        type: 'number',
        width: 110,
        sortable: true,
      },
      {
        field: 'features_used',
        header: 'Features',
        type: 'number',
        width: 80,
        sortable: true,
      },
    ],
    []
  );

  // Handle row click for drill-down
  const handleRowClick = useCallback((row: RowData) => {
    if (onClientSelect) {
      const clientName = row.client as string;
      // Toggle selection - if same client is clicked, deselect
      if (selectedClient === clientName) {
        onClientSelect(null);
      } else {
        onClientSelect(clientName);
      }
    }
  }, [onClientSelect, selectedClient]);

  // Add visual indication for selected row
  const processedData = useMemo(() => {
    return data.map(row => ({
      ...row,
      _isSelected: row.client === selectedClient,
    }));
  }, [data, selectedClient]);

  return (
    <div className="h-full flex flex-col">
      {/* Selection indicator */}
      {selectedClient && (
        <div className="mb-2 px-3 py-1.5 bg-main-50 dark:bg-main-950 border border-main-300 dark:border-main-700 rounded-lg flex items-center justify-between">
          <span className="text-sm text-main-700 dark:text-main-300">
            Viewing: <strong>{selectedClient}</strong>
          </span>
          <button
            onClick={() => onClientSelect?.(null)}
            className="text-xs text-main-600 dark:text-main-400 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={processedData}
          rowKey="client"
          sortable
          paginated
          defaultPageSize={10}
          rowLabel="clients"
          onRowClick={onClientSelect ? handleRowClick : undefined}
        />
      </div>
    </div>
  );
}
