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
import { AxisTable, AxisTag, AxisTooltip } from '@/components/axis';
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
      width: 150,
      minWidth: 120,
      render: (value: CellValue, row: RowData) => {
        const warning = row?.syncWarning ? String(row.syncWarning) : null;
        return (
          <span className="flex items-center gap-1">
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
            {warning && (
              <AxisTooltip content={warning} placement="top" maxWidth={320}>
                <span style={{ color: 'var(--color-warning-500)', cursor: 'help', fontSize: '14px' }}>&#9888;</span>
              </AxisTooltip>
            )}
          </span>
        );
      },
    },
    {
      field: 'status',
      header: 'Status',
      width: 90,
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
      width: 130,
      minWidth: 100,
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
      width: 80,
      minWidth: 70,
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
      width: 70,
      minWidth: 60,
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
      width: 70,
      minWidth: 60,
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
      width: 70,
      minWidth: 60,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{Number(value || 0).toFixed(1)}%</span>
      ),
    },
    {
      field: 'totalCost',
      header: 'Cost',
      headerTooltip: 'Total mailing cost across all sends (including re-sends to the same property)',
      width: 80,
      minWidth: 70,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(value || 0))}</span>
      ),
    },
    {
      field: 'totalRevenue',
      header: 'Revenue',
      headerTooltip: 'Total deal revenue from closed deals attributed to this campaign',
      width: 90,
      minWidth: 70,
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
      width: 110,
      minWidth: 80,
      align: 'center',
      render: (value: CellValue, row: RowData) => {
        const roas = Number(value || 0);
        const confidence = String(row?.roasConfidence || 'none');
        const deals = Number(row?.deals || 0);

        if (confidence === 'revenue_no_deal') {
          return (
            <AxisTooltip
              content="Revenue was recorded but no property has reached Deal status yet. This is under review."
              placement="top"
              maxWidth={280}
            >
              <span style={{ color: 'var(--text-tertiary)' }}>— ⚠</span>
            </AxisTooltip>
          );
        }

        if (confidence === 'none' || roas === 0) {
          return (
            <AxisTooltip
              content="No deals closed yet, so ROAS can't be calculated."
              placement="top"
              maxWidth={240}
            >
              <span style={{ color: 'var(--text-tertiary)' }}>—</span>
            </AxisTooltip>
          );
        }

        const tooltipText = confidence === 'low_sample'
          ? `Based on ${deals} ${deals === 1 ? 'deal' : 'deals'} only. Needs 3+ deals for a confident rating.`
          : `Based on ${deals} deals. Revenue ÷ cost = ${roas.toFixed(1)}x return.`;

        const tagColor = roas >= 2 ? 'success' as const : roas >= 1 ? 'alert' as const : 'error' as const;

        return (
          <AxisTooltip content={tooltipText} placement="top" maxWidth={280}>
            <AxisTag color={tagColor} size="sm">
              {roas.toFixed(1)}x
            </AxisTag>
          </AxisTooltip>
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
      syncWarning: c.syncWarning || null,
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
