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
      width: 70,
      render: (value: CellValue) => (
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {String(value || '')}
        </span>
      ),
    },
    {
      field: 'county',
      header: 'County',
      width: 120,
      minWidth: 80,
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

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
        <div
          className="rounded-lg px-4 py-2"
          style={{ backgroundColor: 'var(--color-alert-50)', border: '1px solid var(--color-alert-300)' }}
        >
          <span className="text-label font-medium" style={{ color: 'var(--color-alert-700)' }}>Pending data</span>
        </div>
        <p className="text-label" style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
          Geographic breakdown requires property-level data from <code style={{ fontSize: '12px' }}>dm_property_conversions</code>, which is pending a backend fix. This widget will populate automatically once the fix is deployed.
        </p>
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
        emptyMessage="No geographic data available yet"
      />
    </div>
  );
}
