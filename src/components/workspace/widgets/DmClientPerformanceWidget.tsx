/**
 * DM Client Performance Widget
 *
 * Table showing per-client conversion metrics: mailed, leads, deals, ROAS.
 * Uses AxisTable for consistent rendering.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable, AxisTag } from '@/components/axis';
import type { Column, CellValue } from '@/types/table';
import type { DmClientPerformanceRow } from '@/types/dm-conversions';

interface DmClientPerformanceWidgetProps {
  data: DmClientPerformanceRow[];
  onDomainClick?: (domain: string) => void;
}

function formatDomain(domain: string): string {
  return domain
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/8020rei/i, '')
    .trim() || domain;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function DmClientPerformanceWidget({ data, onDomainClick }: DmClientPerformanceWidgetProps) {
  const columns: Column[] = useMemo(() => [
    {
      field: 'domain',
      header: 'Client',
      minWidth: 140,
      render: (value: CellValue) => (
        <span
          className="font-medium cursor-pointer hover:underline"
          style={{ color: 'var(--color-main-500)' }}
          onClick={(e) => {
            e.stopPropagation();
            onDomainClick?.(String(value || ''));
          }}
        >
          {formatDomain(String(value || ''))}
        </span>
      ),
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
      field: 'totalCost',
      header: 'Cost',
      width: 90,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(value || 0))}</span>
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
    {
      field: 'roas',
      header: 'ROAS',
      width: 80,
      align: 'center',
      render: (value: CellValue) => {
        const roas = Number(value || 0);
        return (
          <AxisTag
            color={roas >= 2 ? 'success' : roas >= 1 ? 'alert' : roas > 0 ? 'error' : 'neutral'}
            size="sm"
          >
            {roas > 0 ? `${roas.toFixed(1)}x` : '—'}
          </AxisTag>
        );
      },
    },
  ], [onDomainClick]);

  const tableData = useMemo(() =>
    data.map(c => ({
      id: c.domain,
      domain: c.domain,
      totalMailed: c.totalMailed,
      leads: c.leads,
      deals: c.deals,
      leadConversionRate: c.leadConversionRate,
      totalCost: c.totalCost,
      totalRevenue: c.totalRevenue,
      roas: c.roas,
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
        defaultPageSize={10}
        emptyMessage="No client performance data available yet"
      />
    </div>
  );
}
