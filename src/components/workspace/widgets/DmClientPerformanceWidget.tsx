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
      field: 'campaignBreakdown',
      header: 'Campaigns',
      headerTooltip: 'Active campaigns out of total per product. "2/3 RR" = 2 active Rapid Response out of 3 total. A client running both products shows both tags side by side.',
      width: 180,
      minWidth: 140,
      align: 'center',
      render: (value: CellValue) => {
        const breakdown = (value as unknown as Record<string, { active: number; total: number }>) || {};
        const entries = Object.entries(breakdown).filter(([, v]) => v.total > 0);
        if (entries.length === 0) {
          return (
            <AxisTag color="neutral" size="sm">No campaigns</AxisTag>
          );
        }
        const label = (type: string) => (type === 'smartdrop' ? 'SD' : type === 'rr' ? 'RR' : type.toUpperCase());
        // Order: RR first, then Smart Drop, then anything else.
        entries.sort(([a], [b]) => {
          const order = (t: string) => (t === 'rr' ? 0 : t === 'smartdrop' ? 1 : 2);
          return order(a) - order(b);
        });
        return (
          <span className="flex items-center gap-1 flex-wrap justify-center">
            {entries.map(([type, counts]) => {
              const hasActive = counts.active > 0;
              const color: 'success' | 'info' | 'neutral' = hasActive
                ? (type === 'smartdrop' ? 'info' : 'success')
                : 'neutral';
              return (
                <AxisTooltip
                  key={type}
                  content={`${counts.active} active · ${counts.total - counts.active} paused/disabled · ${counts.total} total ${label(type)}`}
                  placement="top"
                  maxWidth={240}
                >
                  <span style={{ cursor: 'help' }}>
                    <AxisTag color={color} size="sm">
                      {counts.active}/{counts.total} {label(type)}
                    </AxisTag>
                  </span>
                </AxisTooltip>
              );
            })}
          </span>
        );
      },
    },
    {
      field: 'totalMailed',
      header: 'Mailed (window)',
      headerTooltip: 'Unique properties this client first mailed in the selected window. A property mailed 3 times counts as 1.',
      type: 'number',
      width: 110,
      minWidth: 90,
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
      headerTooltip: 'Properties in this client\'s cohort (first mailed in window) that became Lead after the first send. Click to see which properties.',
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
      headerTooltip: 'Properties in this client\'s cohort (first mailed in window) that reached Deal after the first send. Click to see which properties.',
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
      header: 'Mail spend',
      headerTooltip: 'What this client paid 8020REI for mailings in the selected window (cohort view). Lifetime sum across all clients matches Profitability → Margin summary → Revenue.',
      width: 90,
      minWidth: 80,
      align: 'center',
      render: (value: CellValue) => (
        <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(value || 0))}</span>
      ),
    },
    {
      field: 'totalRevenue',
      header: 'Deal rev',
      headerTooltip: 'Revenue this client earned from deals attributed to mailings in the selected window (cohort view). Client ROI — NOT 8020REI company revenue.',
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
      field: 'costPerLead',
      header: 'CPL',
      headerTooltip: 'Cost per lead: total mailing cost ÷ leads. Lower is better.',
      width: 90,
      minWidth: 70,
      align: 'center',
      render: (value: CellValue) => {
        const cpl = value === null || value === undefined ? null : Number(value);
        if (cpl === null || isNaN(cpl)) {
          return (
            <AxisTooltip
              content="No leads yet — cost per lead can't be calculated."
              placement="top"
              maxWidth={240}
            >
              <span style={{ color: 'var(--text-tertiary)' }}>—</span>
            </AxisTooltip>
          );
        }
        return (
          <AxisTooltip
            content={`Total cost ÷ leads = $${cpl.toFixed(2)} per lead`}
            placement="top"
            maxWidth={280}
          >
            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(cpl)}</span>
          </AxisTooltip>
        );
      },
    },
  ], [onDomainClick, openDrilldown]);

  const totals = useMemo(() => {
    const totalMailed = data.reduce((s, c) => s + c.totalMailed, 0);
    const totalLeads = data.reduce((s, c) => s + c.leads, 0);
    const totalDeals = data.reduce((s, c) => s + c.deals, 0);
    const totalCost = data.reduce((s, c) => s + c.totalCost, 0);
    const totalRevenue = data.reduce((s, c) => s + c.totalRevenue, 0);
    const costPerLead = totalLeads > 0 ? totalCost / totalLeads : null;
    const activeClients = data.filter((c) => c.activeCampaigns > 0).length;
    const inactiveClients = data.length - activeClients;
    // Sum active campaigns across all products (e.g. 2 RR + 1 SD = 3 active).
    let activeCampaigns = 0;
    let totalCampaigns = 0;
    for (const c of data) {
      const bd = c.campaignBreakdown || {};
      for (const v of Object.values(bd)) {
        activeCampaigns += v.active;
        totalCampaigns += v.total;
      }
    }
    return { totalMailed, totalLeads, totalDeals, totalCost, totalRevenue, costPerLead, activeClients, inactiveClients, activeCampaigns, totalCampaigns };
  }, [data]);

  const tableData = useMemo(() =>
    data.map(c => ({
      id: c.domain,
      domain: c.domain,
      campaignBreakdown: c.campaignBreakdown || {},
      totalMailed: c.totalMailed,
      leads: c.leads,
      deals: c.deals,
      leadConversionRate: c.leadConversionRate,
      totalCost: c.totalCost,
      totalRevenue: c.totalRevenue,
      costPerLead: c.costPerLead,
      syncWarning: c.syncWarning || null,
    })),
  [data]);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Reconciliation header — directly answers "why do the totals here differ from Overview / OH?" */}
      {data.length > 0 && (
        <div
          className="px-4 py-2 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <AxisTooltip
            content={`Row count = clients that had any DM activity (mailings or campaigns) in the selected window. Active = client has ≥1 campaign in 'active' status right now (matches Overview → Active clients). Active campaigns sum across all products (RR + Smart Drop). Inactive clients are shown because they mailed during the window — their campaigns are now paused or disabled.`}
            placement="top"
            maxWidth={360}
          >
            <div className="flex items-baseline gap-2 flex-wrap" style={{ cursor: 'help' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {data.length} clients
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--color-success-500)' }}>
                {totals.activeClients} active
              </span>
              {totals.inactiveClients > 0 && (
                <>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {totals.inactiveClients} inactive
                  </span>
                </>
              )}
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {totals.activeCampaigns}/{totals.totalCampaigns} campaigns active
              </span>
            </div>
          </AxisTooltip>
        </div>
      )}

      {/* Volume totals bar */}
      {data.length > 0 && (
        <div
          className="flex items-center gap-6 px-4 py-2 flex-shrink-0 flex-wrap"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold" style={{ color: 'var(--color-main-500)' }}>
              {totals.totalMailed.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>mailed</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold" style={{ color: 'var(--color-accent-1-500)' }}>
              {totals.totalLeads.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>leads</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold" style={{ color: 'var(--color-success-500)' }}>
              {totals.totalDeals.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>deals</span>
          </div>
          <AxisTooltip
            content="What clients paid 8020REI for mailings in this window. Same column as Profitability → Margin summary → Revenue."
            placement="top"
            maxWidth={280}
          >
            <div className="flex items-baseline gap-1.5" style={{ cursor: 'help' }}>
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(totals.totalCost)}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>mail spend</span>
            </div>
          </AxisTooltip>
          <AxisTooltip
            content="Revenue clients earned from real-estate deals attributed to DM. Client ROI — NOT 8020REI company revenue."
            placement="top"
            maxWidth={280}
          >
            <div className="flex items-baseline gap-1.5" style={{ cursor: 'help' }}>
              <span className="text-lg font-bold" style={{ color: totals.totalRevenue > 0 ? 'var(--color-success-500)' : 'var(--text-primary)' }}>
                {formatCurrency(totals.totalRevenue)}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>deal rev</span>
            </div>
          </AxisTooltip>
          {totals.costPerLead !== null && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(totals.costPerLead)}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>per lead</span>
            </div>
          )}
        </div>
      )}
      {/* Table */}
      <div className="flex-1 min-h-0 overflow-hidden">
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
