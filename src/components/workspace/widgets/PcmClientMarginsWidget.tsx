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
  // Flag any client with real sends but zero stored PCM cost — this is a
  // known monolith data bug (parameters.pcm_cost); the row looks 100% profitable
  // when in reality we have no PCM cost tracked for them. Surface it visibly.
  const missingPcmCost = client.sends > 0 && client.pcmCost === 0;

  const marginColor = missingPcmCost
    ? 'var(--color-alert-700, #b45309)'
    : client.margin < 0
      ? 'var(--color-error-600, #dc2626)'
      : client.margin === 0
        ? 'var(--text-secondary)'
        : 'var(--color-success-600, #16a34a)';

  return (
    <div
      className="flex items-center text-xs py-1.5 px-3 gap-2"
      style={{ borderBottom: '1px solid var(--border-default)' }}
      title={missingPcmCost ? 'No PCM cost stored in Aurora — monolith data issue. Margin % is not meaningful.' : undefined}
    >
      <span className="flex-1 font-medium truncate flex items-center gap-1.5" style={{ color: 'var(--text-primary)', minWidth: 120 }}>
        {client.domain}
        {missingPcmCost && (
          <AxisTag color="alert" size="sm" variant="outlined">No PCM cost</AxisTag>
        )}
      </span>
      <span className="w-16 text-center" style={{ color: 'var(--text-secondary)' }}>
        {client.sends.toLocaleString()}
      </span>
      <span className="w-20 text-center" style={{ color: 'var(--text-secondary)' }}>
        ${client.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="w-20 text-center" style={{ color: missingPcmCost ? 'var(--color-alert-700)' : 'var(--text-secondary)' }}>
        ${client.pcmCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="w-20 text-center font-medium" style={{ color: marginColor }}>
        {client.margin < 0 ? '-' : ''}${Math.abs(client.margin).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="w-16 text-center">
        {missingPcmCost ? (
          <AxisTag color="alert" size="sm">n/a</AxisTag>
        ) : (
          <AxisTag
            color={client.marginPercent > 5 ? 'success' : client.marginPercent >= 0 ? 'alert' : 'error'}
            size="sm"
          >
            {client.marginPercent.toFixed(1)}%
          </AxisTag>
        )}
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

    // Pull out clients with no stored PCM cost first — they can't be bucketed
    // honestly (margin % is meaningless when the denominator is missing).
    const missingPcmCost = data.clients.filter(c => c.sends > 0 && c.pcmCost === 0).sort((a, b) => b.sends - a.sends);
    const tracked = data.clients.filter(c => !(c.sends > 0 && c.pcmCost === 0));

    const profitable = tracked.filter(c => c.marginPercent > 5).sort((a, b) => b.marginPercent - a.marginPercent);
    const breakEven = tracked.filter(c => c.marginPercent >= 0 && c.marginPercent <= 5).sort((a, b) => b.marginPercent - a.marginPercent);
    const losing = tracked.filter(c => c.marginPercent < 0).sort((a, b) => a.marginPercent - b.marginPercent);

    const result: HealthGroup[] = [
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

    if (missingPcmCost.length > 0) {
      result.push({
        label: 'Data incomplete — no PCM cost stored',
        color: 'var(--color-alert-700, #b45309)',
        bgColor: 'var(--color-alert-50, #fffbeb)',
        borderColor: 'var(--color-alert-500, #f59e0b)',
        clients: missingPcmCost,
        totalMargin: 0,
      });
    }

    return result;
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
