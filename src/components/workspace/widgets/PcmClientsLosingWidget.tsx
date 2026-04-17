/**
 * Losing Money Clients Widget (margin <0%)
 *
 * AxisTable showing clients where we lose money, sorted by worst margin first.
 * Data source: dm_client_funnel filtered to marginPercent < 0
 */

'use client';

import { useMemo } from 'react';
import { AxisTable, AxisTag } from '@/components/axis';
import type { Column, CellValue } from '@/types/table';
import type { ClientMarginRow } from '@/types/pcm-validation';

interface Props {
  data: { clients: ClientMarginRow[]; dataAvailable: boolean } | null;
}

const columns: Column[] = [
  { field: 'domain', header: 'Client', sortable: true, width: 180, minWidth: 120 },
  { field: 'sends', header: 'Sends', sortable: true, type: 'number', align: 'center', width: 80 },
  { field: 'revenue', header: 'Revenue', sortable: true, type: 'currency', align: 'center', width: 100 },
  { field: 'pcmCost', header: 'PCM cost', sortable: true, type: 'currency', align: 'center', width: 100 },
  { field: 'margin', header: 'Margin', sortable: true, type: 'currency', align: 'center', width: 100 },
  {
    field: 'marginPercent', header: 'Margin %', sortable: true, type: 'number', align: 'center', width: 90,
    render: (value: CellValue) => (
      <AxisTag color="error" size="sm">{Number(value || 0).toFixed(1)}%</AxisTag>
    ),
  },
];

export function PcmClientsLosingWidget({ data }: Props) {
  const tableData = useMemo(() => {
    if (!data?.clients?.length) return [];
    return data.clients
      .filter(c => c.marginPercent < 0)
      .sort((a, b) => a.marginPercent - b.marginPercent)
      .map(c => ({ ...c, id: c.domain }));
  }, [data]);

  if (!data?.dataAvailable) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Client margin data pending
      </div>
    );
  }

  if (tableData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-tertiary)' }}>
        No clients losing money
      </div>
    );
  }

  const totalLoss = tableData.reduce((s, c) => s + c.margin, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5" style={{
        backgroundColor: 'var(--color-error-50, #fef2f2)',
        borderLeft: '3px solid var(--color-error-500, #ef4444)',
      }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--color-error-700, #b91c1c)' }}>
          {tableData.length} client{tableData.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-error-700, #b91c1c)' }}>
          -${Math.abs(totalLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total loss
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <AxisTable columns={columns} data={tableData} rowKey="id" sortable />
      </div>
    </div>
  );
}
