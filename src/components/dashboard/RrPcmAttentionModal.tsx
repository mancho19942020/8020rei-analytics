/**
 * Modal that lists every client currently flagged for a PCM alignment issue.
 *
 * Replaces the hover-tooltip on the "Is it aligned?" widget because:
 *   1. Reading a cramped tooltip of 3-6 clients with 3-value breakdowns was hard.
 *   2. You can't copy text out of a floating tooltip to share with a developer.
 *
 * This modal lets you: see each client clearly grouped in an AxisTable, see
 * their active/legacy status prominently, and copy the whole breakdown as
 * Slack-formatted text with one click — including context and where to
 * investigate, so the receiving developer has everything needed to dig in.
 */

'use client';

import { useMemo, useState } from 'react';
import { AxisModal } from '@/components/axis/AxisModal';
import { AxisTag, AxisButton, AxisTable } from '@/components/axis';
import type { Column, CellValue, RowData } from '@/types/table';
import type { RrPcmDomainIssue } from '@/types/rapid-response';

export interface RrPcmAttentionModalProps {
  open: boolean;
  onClose: () => void;
  gapDomains: RrPcmDomainIssue[];
  staleDomains: RrPcmDomainIssue[];
  orphanedDomains: RrPcmDomainIssue[];
}

interface PerClientRow extends RowData {
  id: string;
  domain: string;
  isActive: boolean;
  gap: number | null;
  stale: number | null;
  staleOldest: string | null;
  orphaned: number | null;
}

function formatDomain(d: string): string {
  return d.replace(/_8020rei_com$/, '').replace(/_/g, ' ');
}

/**
 * Merge the three per-issue lists into one row per client. A client can have
 * multiple simultaneous issues (e.g. both gap AND stale). Active clients lead.
 */
function mergeClients(
  gap: RrPcmDomainIssue[],
  stale: RrPcmDomainIssue[],
  orphaned: RrPcmDomainIssue[]
): PerClientRow[] {
  const rows = new Map<string, PerClientRow>();
  const ensure = (d: RrPcmDomainIssue): PerClientRow =>
    rows.get(d.domain) ?? {
      id: d.domain,
      domain: d.domain,
      isActive: d.isActive,
      gap: null,
      stale: null,
      staleOldest: null,
      orphaned: null,
    };

  for (const d of gap) {
    const row = ensure(d);
    row.gap = d.value;
    rows.set(d.domain, row);
  }
  for (const d of stale) {
    const row = ensure(d);
    row.stale = d.value;
    row.staleOldest = d.detail ?? null;
    rows.set(d.domain, row);
  }
  for (const d of orphaned) {
    const row = ensure(d);
    row.orphaned = d.value;
    rows.set(d.domain, row);
  }

  return [...rows.values()].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    const totalA = (a.gap ?? 0) + (a.stale ?? 0) + (a.orphaned ?? 0);
    const totalB = (b.gap ?? 0) + (b.stale ?? 0) + (b.orphaned ?? 0);
    return totalB - totalA;
  });
}

/**
 * Slack-formatted breakdown. The receiving developer gets everything they need
 * to investigate without having to ask follow-up questions:
 *   • What each metric means (thresholds + interpretation)
 *   • Which clients are flagged (with active/legacy status + exact values)
 *   • Where to look in the data (Aurora columns + suspected pipeline area)
 *
 * Uses Slack's *bold* and `code` markdown which renders cleanly on paste.
 */
function buildSlackText(rows: PerClientRow[]): string {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
  const activeCount = rows.filter((r) => r.isActive).length;
  const legacyCount = rows.length - activeCount;

  const lines: string[] = [];

  lines.push(`*PCM alignment report — ${rows.length} client${rows.length === 1 ? '' : 's'} need${rows.length === 1 ? 's' : ''} attention*`);
  lines.push(`Source: Metrics Hub · DM Campaign · Operational Health · Is it aligned?`);
  lines.push(`Snapshot: ${timestamp} · ${activeCount} active · ${legacyCount} legacy`);
  lines.push('');

  lines.push(`*What these metrics mean:*`);
  lines.push(`• *Sync gap*: PCM has N more orders than our back-office recorded. Normal < 50 per client.`);
  lines.push(`• *Stale sent*: mail pieces submitted > 14 days ago with no delivery confirmation. Normal < 10 per client.`);
  lines.push(`• *Orphaned*: mail we sent that never got a PCM tracking ID. Normal < 5 per client.`);
  lines.push('');

  lines.push(`*Flagged clients:*`);
  for (const r of rows) {
    const tag = r.isActive ? '[active]' : '[legacy]';
    lines.push('');
    lines.push(`${tag} *${formatDomain(r.domain)}*`);
    if (r.gap !== null) lines.push(`   • Sync gap: ${r.gap.toLocaleString()} orders`);
    if (r.stale !== null) {
      const oldest = r.staleOldest ? ` (${r.staleOldest})` : '';
      lines.push(`   • Stale sent: ${r.stale.toLocaleString()}${oldest}`);
    }
    if (r.orphaned !== null) lines.push(`   • Orphaned: ${r.orphaned.toLocaleString()}`);
  }
  lines.push('');

  lines.push(`*Where to investigate:*`);
  lines.push('• Sync gap → `rr_pcm_alignment.back_office_sync_gap`; check the PCM-to-Aurora sync job for lag or failure for the affected client.');
  lines.push('• Stale sent → `rr_pcm_alignment.stale_sent_count`; inspect the PCM vendor-status pipeline and delivery-confirmation sync.');
  lines.push('• Orphaned → `rr_pcm_alignment.orphaned_orders_count`; review PCM API error logs for rejected submissions.');
  lines.push('');
  lines.push(`_Thresholds match the alert system. Each client above is above its per-client threshold. Pipeline lag under 50 orders is normal and not included here._`);

  return lines.join('\n');
}

// ─── Column definitions ───────────────────────────────────────

const COLUMNS: Column[] = [
  {
    field: 'domain',
    header: 'Client',
    minWidth: 180,
    render: (value: CellValue) => (
      <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
        {formatDomain(String(value || ''))}
      </span>
    ),
  },
  {
    field: 'isActive',
    header: 'Status',
    width: 110,
    minWidth: 100,
    render: (value: CellValue) => (
      <AxisTag color={value ? 'success' : 'neutral'} size="sm" dot>
        {value ? 'active' : 'legacy'}
      </AxisTag>
    ),
  },
  {
    field: 'gap',
    header: 'Sync gap',
    type: 'number',
    align: 'center',
    width: 130,
    minWidth: 110,
    headerTooltip: 'Threshold: ≥ 50 orders.',
    render: (value: CellValue) => {
      if (value === null || value === undefined) {
        return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
      }
      return (
        <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {Number(value).toLocaleString()}
          <span style={{ color: 'var(--text-tertiary)' }}> orders</span>
        </span>
      );
    },
  },
  {
    field: 'stale',
    header: 'Stale (14d+)',
    type: 'number',
    align: 'center',
    width: 160,
    minWidth: 130,
    headerTooltip: 'Threshold: ≥ 10 pieces.',
    render: (value: CellValue, row: RowData) => {
      if (value === null || value === undefined) {
        return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
      }
      const oldest = row.staleOldest as string | null;
      return (
        <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {Number(value).toLocaleString()}
          {oldest ? (
            <span style={{ color: 'var(--text-tertiary)' }}> · {oldest}</span>
          ) : null}
        </span>
      );
    },
  },
  {
    field: 'orphaned',
    header: 'Orphaned',
    type: 'number',
    align: 'center',
    width: 120,
    minWidth: 100,
    headerTooltip: 'Threshold: ≥ 5 orders.',
    render: (value: CellValue) => {
      if (value === null || value === undefined) {
        return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
      }
      return (
        <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {Number(value).toLocaleString()}
        </span>
      );
    },
  },
];

// ─── Component ────────────────────────────────────────────────

export function RrPcmAttentionModal({
  open,
  onClose,
  gapDomains,
  staleDomains,
  orphanedDomains,
}: RrPcmAttentionModalProps) {
  const rows = useMemo(
    () => mergeClients(gapDomains, staleDomains, orphanedDomains),
    [gapDomains, staleDomains, orphanedDomains]
  );

  const activeCount = rows.filter((r) => r.isActive).length;
  const legacyCount = rows.length - activeCount;

  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildSlackText(rows));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard permission denied — silent; button stays idle.
    }
  };

  return (
    <AxisModal
      open={open}
      onClose={onClose}
      title={`${rows.length} client${rows.length === 1 ? '' : 's'} need${rows.length === 1 ? 's' : ''} attention`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {activeCount} active · {legacyCount} legacy · Thresholds: sync gap ≥ 50, stale ≥ 10, orphaned ≥ 5
          </span>
          <div className="flex items-center gap-2">
            <AxisButton
              variant="outlined"
              size="sm"
              onClick={handleCopy}
              iconLeft={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              }
            >
              {copied ? 'Copied for Slack' : 'Copy for Slack'}
            </AxisButton>
            <AxisButton variant="filled" size="sm" onClick={onClose}>
              Close
            </AxisButton>
          </div>
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          All tracked clients are aligned with PCM.
        </p>
      ) : (
        <AxisTable
          columns={COLUMNS}
          data={rows}
          rowKey="id"
          sortable
          paginated={false}
          rowLabel="clients"
          emptyMessage="All tracked clients are aligned with PCM."
        />
      )}
    </AxisModal>
  );
}
