/**
 * Profitable Clients Widget (margin >5%)
 *
 * AxisTable showing clients with healthy margins, sorted by margin % descending.
 * Data source: dm_client_funnel filtered to marginPercent > 5
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
      <AxisTag color="success" size="sm">{Number(value || 0).toFixed(1)}%</AxisTag>
    ),
  },
];

export function PcmClientsProfitableWidget({ data }: Props) {
  const { tableData, excludedCount } = useMemo(() => {
    if (!data?.clients?.length) return { tableData: [], excludedCount: 0 };
    // Exclude clients whose PCM cost is $0 — their 100% margin is an artifact
    // of the monolith's parameters.pcm_cost data issue, not real profitability.
    const excluded = data.clients.filter(c => c.sends > 0 && c.pcmCost === 0);
    const eligible = data.clients
      .filter(c => !(c.sends > 0 && c.pcmCost === 0))
      .filter(c => c.marginPercent > 5)
      .sort((a, b) => b.marginPercent - a.marginPercent)
      .map(c => ({ ...c, id: c.domain }));
    return { tableData: eligible, excludedCount: excluded.length };
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
        No clients with margins above 5%
      </div>
    );
  }

  const totalMargin = tableData.reduce((s, c) => s + c.margin, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5" style={{
        backgroundColor: 'var(--color-success-50, #f0fdf4)',
        borderLeft: '3px solid var(--color-success-500, #22c55e)',
      }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--color-success-700, #15803d)' }}>
          {tableData.length} client{tableData.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-success-700, #15803d)' }}>
          ${totalMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total margin
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <AxisTable columns={columns} data={tableData} rowKey="id" sortable />
      </div>
      {excludedCount > 0 && (
        <div
          className="flex-shrink-0 px-3 py-1.5 text-[11px]"
          style={{ borderTop: '1px solid var(--stroke)', color: 'var(--content-tertiary)' }}
        >
          {excludedCount} client{excludedCount !== 1 ? 's' : ''} excluded from this list — PCM cost not stored in Aurora (monolith data issue).
          See Client margins for the full per-client breakdown.
        </div>
      )}
    </div>
  );
}
