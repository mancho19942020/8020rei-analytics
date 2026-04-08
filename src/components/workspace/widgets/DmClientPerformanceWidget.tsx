/**
 * DM Client Performance Widget
 *
 * Table showing per-client conversion metrics: mailed, leads, deals, ROAS.
 * Includes campaign status (active/inactive), ROAS confidence, campaign type.
 * Sorted by best performer (most leads) to lowest.
 *
 * Numbers (Mailed, Leads, Deals) are clickable — opens a modal showing
 * the actual properties from dm_property_conversions.
 */

'use client';

import { useMemo, useState, useCallback } from 'react';
import { AxisTable, AxisTag } from '@/components/axis';
import type { Column, CellValue, RowData } from '@/types/table';
import type { DmClientPerformanceRow } from '@/types/dm-conversions';
import { DmPropertyDrilldownModal } from './DmPropertyDrilldownModal';
import type { DrilldownStatus } from './DmPropertyDrilldownModal';

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

function ClickableNumber({
  value,
  domain,
  status,
  onDrilldown,
}: {
  value: number;
  domain: string;
  status: DrilldownStatus;
  onDrilldown: (domain: string, status: DrilldownStatus, count: number) => void;
}) {
  if (value === 0) {
    return <span style={{ color: 'var(--text-tertiary)' }}>0</span>;
  }
  const formatted = value >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(value);
  return (
    <button
      type="button"
      className="cursor-pointer hover:underline font-medium bg-transparent border-0 p-0"
      style={{ color: 'var(--color-main-500)' }}
      onClick={(e) => {
        e.stopPropagation();
        onDrilldown(domain, status, value);
      }}
      title={`View ${value} ${status === 'mailed' ? 'mailed properties' : status + 's'}`}
    >
      {formatted}
    </button>
  );
}

export function DmClientPerformanceWidget({ data, onDomainClick }: DmClientPerformanceWidgetProps) {
  const [drilldown, setDrilldown] = useState<{
    open: boolean;
    domain: string;
    status: DrilldownStatus;
    count: number;
  }>({ open: false, domain: '', status: 'mailed', count: 0 });

  const openDrilldown = useCallback((domain: string, status: DrilldownStatus, count: number) => {
    setDrilldown({ open: true, domain, status, count });
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldown(prev => ({ ...prev, open: false }));
  }, []);

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
      headerTooltip: 'Unique properties that received at least one mail piece. A property mailed 3 times counts as 1.',
      type: 'number',
      minWidth: 80,
      align: 'center',
      render: (value: CellValue, row: RowData) => (
        <ClickableNumber
          value={Number(value || 0)}
          domain={String(row?.domain || '')}
          status="mailed"
          onDrilldown={openDrilldown}
        />
      ),
    },
    {
      field: 'leads',
      header: 'Leads',
      headerTooltip: 'Properties whose status changed to Lead in the platform. Click the number to see which properties.',
      type: 'number',
      minWidth: 70,
      align: 'center',
      render: (value: CellValue, row: RowData) => (
        <ClickableNumber
          value={Number(value || 0)}
          domain={String(row?.domain || '')}
          status="lead"
          onDrilldown={openDrilldown}
        />
      ),
    },
    {
      field: 'deals',
      header: 'Deals',
      headerTooltip: 'Properties that reached Deal status (closed). Click the number to see which properties.',
      type: 'number',
      minWidth: 70,
      align: 'center',
      render: (value: CellValue, row: RowData) => (
        <ClickableNumber
          value={Number(value || 0)}
          domain={String(row?.domain || '')}
          status="deal"
          onDrilldown={openDrilldown}
        />
      ),
    },
    {
      field: 'leadConversionRate',
      header: 'Lead %',
      headerTooltip: 'Lead conversion rate: leads / unique properties mailed',
      minWidth: 80,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{Number(value || 0).toFixed(1)}%</span>
      ),
    },
    {
      field: 'totalCost',
      header: 'Cost',
      headerTooltip: 'Total mailing cost across all sends (including re-sends to the same property)',
      minWidth: 90,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(value || 0))}</span>
      ),
    },
    {
      field: 'totalRevenue',
      header: 'Revenue',
      headerTooltip: 'Total deal revenue from closed deals attributed to this campaign',
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
      headerTooltip: 'Return on ad spend: revenue / cost. Requires 3+ deals for confident rating.',
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
              — <span className="text-xs">⚠</span>
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
  ], [onDomainClick, openDrilldown]);

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
      <DmPropertyDrilldownModal
        open={drilldown.open}
        onClose={closeDrilldown}
        domain={drilldown.domain}
        status={drilldown.status}
        expectedCount={drilldown.count}
      />
    </div>
  );
}
