/**
 * DM Geographic Breakdown Widget
 *
 * Table showing conversion rates by state/county.
 * Uses AxisTable for consistent rendering.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable } from '@/components/axis';
import type { Column, CellValue } from '@/types/table';
import type { DmGeoRow } from '@/types/dm-conversions';

interface DmGeoBreakdownWidgetProps {
  data: DmGeoRow[];
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function DmGeoBreakdownWidget({ data }: DmGeoBreakdownWidgetProps) {
  const columns: Column[] = useMemo(() => [
    {
      field: 'state',
      header: 'State',
      width: 100,
      render: (value: CellValue) => (
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {String(value || '')}
        </span>
      ),
    },
    {
      field: 'county',
      header: 'County',
      minWidth: 130,
    },
    {
      field: 'totalMailed',
      header: 'Mailed',
      type: 'number',
      width: 80,
      align: 'center',
    },
    {
      field: 'leads',
      header: 'Leads',
      type: 'number',
      width: 70,
      align: 'center',
    },
    {
      field: 'deals',
      header: 'Deals',
      type: 'number',
      width: 70,
      align: 'center',
    },
    {
      field: 'leadConversionRate',
      header: 'Lead %',
      width: 80,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{Number(value || 0).toFixed(1)}%</span>
      ),
    },
    {
      field: 'totalRevenue',
      header: 'Revenue',
      width: 90,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: Number(value) > 0 ? 'var(--color-success-500)' : 'var(--text-primary)' }}>
          {formatCurrency(Number(value || 0))}
        </span>
      ),
    },
  ], []);

  const tableData = useMemo(() =>
    data.map((g, i) => ({
      id: `${g.state}-${g.county}-${i}`,
      state: g.state,
      county: g.county,
      totalMailed: g.totalMailed,
      leads: g.leads,
      deals: g.deals,
      leadConversionRate: g.leadConversionRate,
      totalRevenue: g.totalRevenue,
    })),
  [data]);

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
        emptyMessage="No geographic data available yet"
      />
    </div>
  );
}
