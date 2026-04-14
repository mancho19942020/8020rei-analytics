/**
 * PCM Per-Client Margin Table Widget
 *
 * AxisTable showing per-client profitability metrics.
 * Default sort: margin ASC (worst margins first).
 * Data source: dm_client_funnel (total_cost, total_pcm_cost, margin, margin_pct)
 */

'use client';

import { useMemo } from 'react';
import { AxisTable, AxisTag } from '@/components/axis';
import type { Column, CellValue } from '@/types/table';
import type { ClientMarginRow } from '@/types/pcm-validation';

interface PcmClientMarginsWidgetProps {
  data: { clients: ClientMarginRow[]; dataAvailable: boolean } | null;
}

export function PcmClientMarginsWidget({ data }: PcmClientMarginsWidgetProps) {
  const columns: Column[] = useMemo(() => [
    {
      field: 'domain',
      header: 'Client',
      headerTooltip: 'Client domain. Each row shows the latest cumulative totals from dm_client_funnel.',
      width: 180,
      minWidth: 120,
      render: (value: CellValue) => (
        <span className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>
          {String(value)}
        </span>
      ),
    },
    {
      field: 'sends',
      header: 'Sends',
      headerTooltip: 'Total mail pieces sent to PostcardMania (vendor_id IS NOT NULL). Includes both Standard and First Class.',
      type: 'number',
      width: 90,
      minWidth: 70,
      align: 'center' as const,
      render: (value: CellValue) => (
        <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
          {Number(value || 0).toLocaleString()}
        </span>
      ),
    },
    {
      field: 'revenue',
      header: 'Revenue',
      headerTooltip: 'What we charge the client (total_cost in dm_client_funnel = SUM of unit_cost per send). This is our revenue, not our cost.',
      type: 'number',
      width: 100,
      minWidth: 80,
      align: 'center' as const,
      render: (value: CellValue) => (
        <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
          ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      field: 'pcmCost',
      header: 'PCM cost',
      headerTooltip: 'What PostcardMania charges us (total_pcm_cost). This is our actual vendor cost for printing and mailing.',
      type: 'number',
      width: 100,
      minWidth: 80,
      align: 'center' as const,
      render: (value: CellValue) => (
        <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
          ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      field: 'margin',
      header: 'Margin',
      headerTooltip: 'Gross margin = Revenue minus PCM cost. Negative means we are losing money on this client.',
      type: 'number',
      width: 100,
      minWidth: 80,
      align: 'center' as const,
      render: (value: CellValue) => {
        const num = Number(value || 0);
        return (
          <span className="text-xs font-medium" style={{
            color: num < 0 ? 'var(--color-error-500)' : num === 0 ? 'var(--text-secondary)' : 'var(--color-success-500)',
          }}>
            {num < 0 ? '-' : ''}${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      field: 'marginPercent',
      header: 'Margin %',
      headerTooltip: 'Margin as a percentage of revenue. Below 5% triggers a warning. Negative means we lose money per piece.',
      type: 'number',
      width: 100,
      minWidth: 80,
      align: 'center' as const,
      render: (value: CellValue) => {
        const pct = Number(value || 0);
        const color: 'success' | 'alert' | 'error' = pct > 5 ? 'success' : pct >= 0 ? 'alert' : 'error';
        return (
          <AxisTag color={color} size="sm">
            {pct.toFixed(1)}%
          </AxisTag>
        );
      },
    },
  ], []);

  const tableData = useMemo(() => {
    if (!data?.clients?.length) return [];
    return data.clients.map(c => ({
      id: c.domain,
      domain: c.domain,
      sends: c.sends,
      revenue: c.revenue,
      pcmCost: c.pcmCost,
      margin: c.margin,
      marginPercent: c.marginPercent,
    }));
  }, [data]);

  if (!data || !data.dataAvailable) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Per-client margin data pending — awaiting profitability sync
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <AxisTable
        columns={columns}
        data={tableData}
        rowKey="id"
        sortable
        paginated
        resizable
        defaultPageSize={15}
        emptyMessage="No client margin data available"
      />
    </div>
  );
}
