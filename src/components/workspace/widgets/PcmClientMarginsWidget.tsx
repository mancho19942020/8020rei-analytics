/**
 * PCM Per-Client Margin Table Widget
 *
 * Health-grouped per-client profitability view.
 * Groups: Profitable (>5%), Break-even (0-5%), Losing money (<0%)
 * Data source: dm_client_funnel (total_cost, total_pcm_cost, margin, margin_pct)
 */

'use client';

import { useMemo } from 'react';
import { AxisTag } from '@/components/axis';
import type { ClientMarginRow } from '@/types/pcm-validation';

interface PcmClientMarginsWidgetProps {
  data: { clients: ClientMarginRow[]; dataAvailable: boolean } | null;
}

interface HealthGroup {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  clients: ClientMarginRow[];
  totalMargin: number;
}

function ClientRow({ client }: { client: ClientMarginRow }) {
  const marginColor = client.margin < 0 ? 'var(--color-error-600, #dc2626)'
    : client.margin === 0 ? 'var(--text-secondary)'
    : 'var(--color-success-600, #16a34a)';

  return (
    <div className="flex items-center text-xs py-1.5 px-3 gap-2"
      style={{ borderBottom: '1px solid var(--border-default)' }}>
      <span className="flex-1 font-medium truncate" style={{ color: 'var(--text-primary)', minWidth: 120 }}>
        {client.domain}
      </span>
      <span className="w-16 text-center" style={{ color: 'var(--text-secondary)' }}>
        {client.sends.toLocaleString()}
      </span>
      <span className="w-20 text-center" style={{ color: 'var(--text-secondary)' }}>
        ${client.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="w-20 text-center" style={{ color: 'var(--text-secondary)' }}>
        ${client.pcmCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="w-20 text-center font-medium" style={{ color: marginColor }}>
        {client.margin < 0 ? '-' : ''}${Math.abs(client.margin).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="w-16 text-center">
        <AxisTag
          color={client.marginPercent > 5 ? 'success' : client.marginPercent >= 0 ? 'alert' : 'error'}
          size="sm"
        >
          {client.marginPercent.toFixed(1)}%
        </AxisTag>
      </span>
    </div>
  );
}

function GroupSection({ group }: { group: HealthGroup }) {
  if (group.clients.length === 0) return null;

  const totalMarginFormatted = group.totalMargin < 0
    ? `-$${Math.abs(group.totalMargin).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${group.totalMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      {/* Group header */}
      <div className="flex items-center justify-between px-3 py-2 rounded-t-lg"
        style={{ backgroundColor: group.bgColor, borderLeft: `3px solid ${group.borderColor}` }}>
        <span className="text-xs font-semibold" style={{ color: group.color }}>
          {group.label}
        </span>
        <span className="text-xs" style={{ color: group.color }}>
          {group.clients.length} client{group.clients.length !== 1 ? 's' : ''} · {totalMarginFormatted} margin
        </span>
      </div>

      {/* Column headers */}
      <div className="flex items-center text-[10px] uppercase tracking-wide py-1 px-3 gap-2"
        style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-default)' }}>
        <span className="flex-1" style={{ minWidth: 120 }}>Client</span>
        <span className="w-16 text-center">Sends</span>
        <span className="w-20 text-center">Revenue</span>
        <span className="w-20 text-center">PCM cost</span>
        <span className="w-20 text-center">Margin</span>
        <span className="w-16 text-center">%</span>
      </div>

      {/* Client rows */}
      {group.clients.map(client => (
        <ClientRow key={client.domain} client={client} />
      ))}
    </div>
  );
}

export function PcmClientMarginsWidget({ data }: PcmClientMarginsWidgetProps) {
  const groups = useMemo((): HealthGroup[] => {
    if (!data?.clients?.length) return [];

    const profitable = data.clients.filter(c => c.marginPercent > 5).sort((a, b) => b.marginPercent - a.marginPercent);
    const breakEven = data.clients.filter(c => c.marginPercent >= 0 && c.marginPercent <= 5).sort((a, b) => b.marginPercent - a.marginPercent);
    const losing = data.clients.filter(c => c.marginPercent < 0).sort((a, b) => a.marginPercent - b.marginPercent);

    return [
      {
        label: 'Profitable (>5%)',
        color: 'var(--color-success-700, #15803d)',
        bgColor: 'var(--color-success-50, #f0fdf4)',
        borderColor: 'var(--color-success-500, #22c55e)',
        clients: profitable,
        totalMargin: profitable.reduce((sum, c) => sum + c.margin, 0),
      },
      {
        label: 'Break-even (0-5%)',
        color: 'var(--color-alert-700, #b45309)',
        bgColor: 'var(--color-alert-50, #fffbeb)',
        borderColor: 'var(--color-alert-500, #f59e0b)',
        clients: breakEven,
        totalMargin: breakEven.reduce((sum, c) => sum + c.margin, 0),
      },
      {
        label: 'Losing money (<0%)',
        color: 'var(--color-error-700, #b91c1c)',
        bgColor: 'var(--color-error-50, #fef2f2)',
        borderColor: 'var(--color-error-500, #ef4444)',
        clients: losing,
        totalMargin: losing.reduce((sum, c) => sum + c.margin, 0),
      },
    ];
  }, [data]);

  if (!data || !data.dataAvailable) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Per-client margin data pending — awaiting profitability sync
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-1 py-1">
      <div className="space-y-3">
        {groups.map(group => (
          <GroupSection key={group.label} group={group} />
        ))}
      </div>
    </div>
  );
}
