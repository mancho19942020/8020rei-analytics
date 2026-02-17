/**
 * Flagged Domains Widget
 *
 * Displays a table of domains that have been flagged for attention.
 * Shows domain name, flag type, flag details, and date.
 * Uses AxisTable for sorting and pagination (10 per page).
 *
 * When no flagged domains exist, displays a centered empty state
 * message indicating all domains are clear.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';
import type { FlaggedDomainEntry } from '@/types/product';

interface FlaggedDomainsWidgetProps {
  data: FlaggedDomainEntry[];
}

export function FlaggedDomainsWidget({ data }: FlaggedDomainsWidgetProps) {
  // Define table columns
  const columns: Column[] = useMemo(
    () => [
      {
        field: 'domain_name',
        header: 'Domain',
        type: 'text',
        width: 180,
        sortable: true,
      },
      {
        field: 'flag',
        header: 'Flag',
        type: 'text',
        width: 140,
        sortable: true,
      },
      {
        field: 'flag_info',
        header: 'Details',
        type: 'text',
        width: 260,
        sortable: true,
      },
      {
        field: 'date',
        header: 'Date',
        type: 'date',
        width: 120,
        sortable: true,
      },
    ],
    []
  );

  // Add unique row IDs since domain_id can repeat (same domain, multiple flags)
  const dataWithKeys = useMemo(
    () => data?.map((row, i) => ({ ...row, _rowId: `${row.domain_id}-${i}` })) ?? [],
    [data]
  );

  // Empty state with centered message
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-content-primary mb-1">
            No flagged domains
          </h3>
          <p className="text-sm text-content-secondary max-w-xs">
            All domains are operating normally. No flags have been raised.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <AxisTable
          columns={columns}
          data={dataWithKeys as unknown as Record<string, unknown>[]}
          rowKey="_rowId"
          sortable
          paginated
          defaultPageSize={10}
          rowLabel="flags"
        />
      </div>
    </div>
  );
}
