/**
 * PCM Domain Table Widget
 *
 * Per-domain send totals from Aurora using AxisTable.
 * Data source: dm_client_funnel (latest snapshot per domain)
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column } from '@/types/table';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

const columns: Column[] = [
  { field: 'domain', header: 'Domain', sortable: true, width: 180, minWidth: 120 },
  { field: 'sends', header: 'Sends', sortable: true, type: 'number', align: 'center', width: 80 },
  { field: 'delivered', header: 'Delivered', sortable: true, type: 'number', align: 'center', width: 90 },
  { field: 'mailed', header: 'Mailed', sortable: true, type: 'number', align: 'center', width: 80 },
  { field: 'cost', header: 'Cost', sortable: true, type: 'currency', align: 'center', width: 100 },
  { field: 'rate', header: '$/piece', sortable: true, align: 'center', width: 80 },
];

export function PcmDomainTableWidget({ data }: Props) {
  const tableData = useMemo(() => {
    const domainList = data?.domains ?? [];
    return domainList.map((d: { domain: string; sends: number; delivered: number; mailed: number; cost: number }) => ({
      id: d.domain,
      domain: d.domain,
      sends: d.sends,
      delivered: d.delivered,
      mailed: d.mailed,
      cost: d.cost,
      rate: d.sends > 0 ? `$${(d.cost / d.sends).toFixed(2)}` : '—',
    }));
  }, [data]);

  if (tableData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-tertiary)' }}>
        No domain data available
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <AxisTable columns={columns} data={tableData} rowKey="id" sortable />
    </div>
  );
}
