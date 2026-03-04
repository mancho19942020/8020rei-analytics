/**
 * API Top Clients Widget
 *
 * Table showing top API domains ranked by call volume.
 * Uses AxisTable following the ClientsTableWidget pattern.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';

interface DomainBreakdown {
  domain: string;
  totalCalls: number;
  tokensUsed: number;
  avgResponseMs: number;
  maxResponseMs: number;
  errors: number;
  firstCall: string;
  lastCall: string;
}

interface ApiTopClientsWidgetProps {
  data: DomainBreakdown[];
}

function formatTimestamp(ts: string): string {
  if (!ts) return '';
  const d = new Date(ts.replace(' ', 'T') + (ts.includes('Z') ? '' : 'Z'));
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Convert raw domain string like "qapre_8020rei_com" to readable "qapre" */
function formatDomain(raw: string): string {
  if (!raw || raw === 'unknown') return 'Unknown';
  // Extract subdomain (first segment before _8020rei_ or _)
  const match = raw.match(/^(.+?)_8020rei_/);
  if (match) return match[1];
  // Fallback: replace underscores with dots
  return raw.replace(/_/g, '.');
}

const columns: Column[] = [
  { field: 'domainFormatted', header: 'Domain', type: 'text', width: 140, sortable: true },
  { field: 'totalCalls', header: 'Calls', type: 'number', width: 80, sortable: true },
  { field: 'tokensUsed', header: 'Tokens', type: 'number', width: 70, sortable: true },
  { field: 'avgResponseMs', header: 'Avg ms', type: 'number', width: 80, sortable: true },
  { field: 'errors', header: 'Errors', type: 'number', width: 70, sortable: true },
  {
    field: 'lastCallFormatted',
    header: 'Last Call',
    type: 'text',
    width: 140,
    sortable: true,
  },
];

export function ApiTopClientsWidget({ data }: ApiTopClientsWidgetProps) {
  const tableData = useMemo(
    () =>
      data.map((c) => ({
        ...c,
        domainFormatted: formatDomain(c.domain),
        lastCallFormatted: formatTimestamp(c.lastCall),
      })),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No domain data for this period
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <AxisTable
        columns={columns}
        data={tableData}
        rowKey="domain"
        sortable
        paginated
        defaultPageSize={10}
        rowLabel="domains"
      />
    </div>
  );
}
