/**
 * DM Campaign Table Widget
 *
 * Shows campaigns grouped with client domain visible.
 * Uses AxisTable for consistent rendering and AxisTag for badges.
 * Sent/Delivered numbers are clickable — opens a property drilldown modal.
 */

'use client';

import { useMemo, useState, useCallback } from 'react';
import { AxisTable, AxisTag } from '@/components/axis';
import type { Column, CellValue, RowData } from '@/types/table';
import type { RrCampaignSnapshot } from '@/types/rapid-response';
import { DmPropertyDrilldownModal } from './DmPropertyDrilldownModal';
import type { DrilldownStatus } from './DmPropertyDrilldownModal';

interface RrCampaignTableWidgetProps {
  data: RrCampaignSnapshot[];
  onDomainClick?: (domain: string) => void;
}

const statusColorMap: Record<string, 'success' | 'alert' | 'neutral' | 'info' | 'error'> = {
  active: 'success',
  paused: 'alert',
  disabled: 'neutral',
  draft: 'info',
  eliminated: 'error',
};

const typeColorMap: Record<string, 'info' | 'neutral'> = {
  rr: 'info',
  smartdrop: 'neutral',
};

/** Clean up the raw domain string into a readable client name */
function formatDomain(domain: string): string {
  return domain
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/8020rei/i, '')
    .trim() || domain;
}

/** Format an ISO timestamp as "Apr 23, 2026" (short date, en-US). */
function formatStoppedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Days between now and an ISO timestamp — rounded down to whole days. */
function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

export function RrCampaignTableWidget({ data, onDomainClick }: RrCampaignTableWidgetProps) {
  const [drilldown, setDrilldown] = useState<{
    open: boolean;
    domain: string;
    status: DrilldownStatus;
    count: number;
    campaignId: number;
    campaignName: string;
  }>({ open: false, domain: '', status: 'sent', count: 0, campaignId: 0, campaignName: '' });

  const openDrilldown = useCallback((domain: string, status: DrilldownStatus, count: number, campaignId: number, campaignName: string) => {
    setDrilldown({ open: true, domain, status, count, campaignId, campaignName });
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldown(prev => ({ ...prev, open: false }));
  }, []);

  const columns: Column[] = useMemo(() => [
    {
      field: 'domain',
      header: 'Client',
      width: 160,
      minWidth: 120,
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
      field: 'campaignName',
      header: 'Campaign',
      width: 180,
      minWidth: 120,
    },
    {
      field: 'campaignType',
      header: 'Type',
      width: 70,
      render: (value: CellValue) => {
        const v = String(value || '');
        return (
          <AxisTag color={typeColorMap[v] || 'neutral'} size="sm">
            {v === 'rr' ? 'RR' : 'SD'}
          </AxisTag>
        );
      },
    },
    {
      field: 'status',
      header: 'Status',
      width: 100,
      render: (value: CellValue) => {
        const v = String(value || '');
        return (
          <AxisTag color={statusColorMap[v] || 'neutral'} size="sm" dot>
            {v}
          </AxisTag>
        );
      },
    },
    {
      field: 'stoppedAt',
      header: 'Stopped on',
      headerTooltip: 'When this campaign stopped running. Three possible sources (shown in each cell\'s tooltip): "observed" = we saw the exact active→non-active flip in snapshot history (most accurate); "last mailed" = the flip predates our snapshot history, so we surface the campaign\'s last send date as the best proxy; "floor" = campaign never sent mail and has been inactive since at least this date. Active / draft campaigns show "—". Dates match the client-level "Stopped on" in Business Results → Client Performance.',
      width: 130,
      minWidth: 110,
      align: 'center',
      type: 'date',
      render: (value: CellValue, row: RowData) => {
        const iso = value ? String(value) : null;
        const label = formatStoppedDate(iso);
        if (!label) {
          return <span style={{ color: 'var(--text-tertiary)' }}>&mdash;</span>;
        }
        const days = daysSince(iso);
        const source = row?.stoppedAtSource as ('observed' | 'last-sent' | null);
        const sourceLabel = source === 'observed'
          ? 'Status change observed in snapshot history'
          : source === 'last-sent'
            ? 'Last mail sent on this day (status flip predates our snapshot history)'
            : '';
        const relative = days !== null ? `${days} day${days === 1 ? '' : 's'} ago` : '';
        const exact = `exact: ${iso}`;
        const tooltip = [sourceLabel, relative, exact].filter(Boolean).join(' · ');
        return (
          <span title={tooltip} style={{ color: 'var(--text-primary)' }}>
            {label}
          </span>
        );
      },
    },
    {
      field: 'totalDelivered',
      header: 'Delivered',
      headerTooltip: 'Mail pieces confirmed delivered to a property (USPS scanned in the recipient\'s mailbox). Cumulative — once delivered, a piece stays delivered. Matches the platform\'s status="Delivered" filter on the campaign\'s Properties tab.',
      type: 'number',
      width: 90,
      align: 'center',
      render: (value: CellValue, row: RowData) => {
        const delivered = Number(value || 0);
        if (delivered === 0) return <span style={{ color: 'var(--text-tertiary)' }}>0</span>;
        return (
          <button
            type="button"
            className="cursor-pointer hover:underline font-medium bg-transparent border-0 p-0"
            style={{ color: 'var(--color-main-500)' }}
            onClick={(e) => {
              e.stopPropagation();
              openDrilldown(String(row?.domain || ''), 'delivered', delivered, Number(row?.campaignId || 0), String(row?.campaignName || ''));
            }}
            title={`View ${delivered.toLocaleString()} delivered properties`}
          >
            {delivered.toLocaleString()}
          </button>
        );
      },
    },
    {
      field: 'onHoldCount',
      header: 'On hold',
      headerTooltip: 'Mail pieces currently in "On hold" status — queued but not yet dispatched (usually waiting on client balance or compliance clearance). The badge next to the count shows the days since the campaign last successfully dispatched a piece (last_sent_date). When that age grows large but the on-hold count stays high, the campaign has stopped sending — that\'s the actionable signal (typically client balance ran out). The age badge is NOT per-piece on-hold age; once monolith PR #2015 deploys, a separate "oldest piece" age will surface in this column.',
      width: 160,
      align: 'center',
      render: (value: CellValue, row: RowData) => {
        const n = Number(value);
        if (n === 0) {
          return <span style={{ color: 'var(--text-tertiary)' }}>0</span>;
        }
        const lastSentIso = row.lastSentDate as string | null;
        const lastSentDays = daysSince(lastSentIso);
        // 7+ days without dispatch while pieces sit in queue = something is
        // blocking the pipeline (balance / compliance). Surface as a warning.
        const isStuck = lastSentDays !== null && lastSentDays >= 7;
        return (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="font-semibold"
              style={{ color: isStuck ? 'var(--color-error-600, #dc2626)' : 'var(--color-alert-700, #b45309)' }}
            >
              {n.toLocaleString('en-US')}
            </span>
            {lastSentDays !== null && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap"
                style={{
                  backgroundColor: isStuck ? 'var(--color-error-50, #fef2f2)' : 'var(--color-alert-50, #fffbeb)',
                  color: isStuck ? 'var(--color-error-700, #b91c1c)' : 'var(--color-alert-700, #b45309)',
                  border: `1px solid ${isStuck ? 'var(--color-error-300, #fca5a5)' : 'var(--color-alert-300, #fcd34d)'}`,
                }}
                title={
                  isStuck
                    ? `Campaign last dispatched a piece ${lastSentDays} days ago but still has ${n} on hold. Pieces are entering the queue but not getting sent — usually means the client's balance ran out or there's a compliance block. This is the per-campaign "stopped sending" signal; per-piece age is a separate (in-flight) metric.`
                    : `Campaign last dispatched ${lastSentDays} days ago. Queue is rotating normally.`
                }
              >
                {`last sent ${lastSentDays}d ago`}
              </span>
            )}
          </span>
        );
      },
    },
  ], [onDomainClick, openDrilldown]);

  const tableData = useMemo(() =>
    data.map(c => ({
      id: `${c.domain}-${c.campaignId}`,
      domain: c.domain,
      campaignId: c.campaignId,
      campaignName: c.campaignName,
      campaignType: c.campaignType,
      status: c.status,
      totalSent: c.totalSent,
      totalDelivered: c.totalDelivered,
      onHoldCount: c.onHoldCount,
      lastSentDate: c.lastSentDate,
      stoppedAt: c.stoppedAt,
      stoppedAtSource: c.stoppedAtSource,
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
        defaultPageSize={25}
        emptyMessage="No campaign data available yet"
      />
      <DmPropertyDrilldownModal
        open={drilldown.open}
        onClose={closeDrilldown}
        domain={drilldown.domain}
        status={drilldown.status}
        expectedCount={drilldown.count}
        campaignId={drilldown.campaignId}
        campaignName={drilldown.campaignName}
      />
    </div>
  );
}
