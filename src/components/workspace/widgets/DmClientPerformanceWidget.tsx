/**
 * DM Client Performance Widget
 *
 * Table showing per-client conversion metrics: mailed, leads, deals, ROAS.
 * Includes campaign status (active/inactive), ROAS confidence, campaign type.
 * Sorted by best performer (most leads) to lowest.
 */

'use client';

import { useMemo } from 'react';
import { AxisTable, AxisTag } from '@/components/axis';
import type { Column, CellValue, RowData } from '@/types/table';
import type { DmClientPerformanceRow } from '@/types/dm-conversions';

interface DmClientPerformanceWidgetProps {
  data: DmClientPerformanceRow[];
  onDomainClick?: (domain: string) => void;
}

function formatDomain(domain: string): string {
  return domain
    .replace(/_8020rei_com$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
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
      minWidth: 150,
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
      field: 'status',
      header: 'Status',
      minWidth: 80,
      align: 'center',
      render: (value: CellValue) => {
        const active = Number(value || 0) > 0;
        return (
          <AxisTag color={active ? 'success' : 'neutral'} size="sm">
            {active ? 'Active' : 'Inactive'}
          </AxisTag>
        );
      },
    },
    {
      field: 'campaignType',
      header: 'Campaign',
      minWidth: 110,
      align: 'center',
      render: (value: CellValue) => (
        <AxisTag color={String(value) === 'smartdrop' ? 'info' : 'neutral'} size="sm">
          {String(value) === 'smartdrop' ? 'Smart Drop' : 'Rapid Response'}
        </AxisTag>
      ),
    },
    {
      field: 'totalMailed',
      header: 'Mailed',
      type: 'number',
      minWidth: 80,
      align: 'center',
    },
    {
      field: 'leads',
      header: 'Leads',
      type: 'number',
      minWidth: 70,
      align: 'center',
    },
    {
      field: 'deals',
      header: 'Deals',
      type: 'number',
      minWidth: 70,
      align: 'center',
    },
    {
      field: 'leadConversionRate',
      header: 'Lead %',
      minWidth: 80,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{Number(value || 0).toFixed(1)}%</span>
      ),
    },
    {
      field: 'totalCost',
      header: 'Cost',
      minWidth: 90,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(value || 0))}</span>
      ),
    },
    {
      field: 'totalRevenue',
      header: 'Revenue',
      minWidth: 90,
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
      minWidth: 100,
      align: 'center',
      render: (value: CellValue, row: RowData) => {
        const roas = Number(value || 0);
        const confidence = String(row?.roasConfidence || 'none');

        if (confidence === 'revenue_no_deal') {
          return (
            <span
              className="text-label"
              title="Revenue recorded but no matching deal status. Under review."
              style={{ color: 'var(--text-tertiary)' }}
            >
              — <span style={{ fontSize: '10px' }}>⚠</span>
            </span>
          );
        }

        if (confidence === 'none' || roas === 0) {
          return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
        }

        if (confidence === 'low_sample') {
          const deals = Number(row?.deals || 0);
          return (
            <span style={{ color: 'var(--text-secondary)' }}>
              {roas.toFixed(1)}x
              <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
                ({deals} {deals === 1 ? 'deal' : 'deals'})
              </span>
            </span>
          );
        }

        return (
          <AxisTag
            color={roas >= 2 ? 'success' : roas >= 1 ? 'alert' : 'error'}
            size="sm"
          >
            {roas.toFixed(1)}x
          </AxisTag>
        );
      },
    },
  ], [onDomainClick]);

  const tableData = useMemo(() =>
    data.map(c => ({
      id: c.domain,
      domain: c.domain,
      status: c.activeCampaigns,
      campaignType: c.campaignType,
      totalMailed: c.totalMailed,
      leads: c.leads,
      deals: c.deals,
      leadConversionRate: c.leadConversionRate,
      totalCost: c.totalCost,
      totalRevenue: c.totalRevenue,
      roas: c.roas,
      roasConfidence: c.roasConfidence,
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
        emptyMessage="No client performance data available yet"
      />
    </div>
  );
}
