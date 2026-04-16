'use client';

import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import { AxisButton, AxisTag, AxisCallout, AxisSkeleton } from '@/components/axis';
import { authFetch } from '@/lib/auth-fetch';
import { TabHandle } from '@/types/widget';
import type {
  ReportMetadata,
  ReportCardPreview,
  ProfitabilityReportData,
} from '@/types/dm-reports';

// ─── Report Registry ────────────────────────────────────────────

const REPORT_REGISTRY: ReportMetadata[] = [
  {
    id: 'profitability-report',
    slug: 'dm-profitability',
    title: 'DM profitability report',
    description: 'Complete analysis of direct mail costs, revenue, and margin across all clients, mail classes, and pricing eras since launch.',
    dateRange: { start: '2024-12', end: '2026-04' },
    status: 'published',
    publishedDate: '2026-04-16',
    tags: ['finance', 'profitability'],
  },
];

// ─── Formatting Helpers ─────────────────────────────────────────

function fmt$(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtN(n: number): string {
  return n.toLocaleString('en-US');
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtRate(n: number): string {
  return `$${n.toFixed(4)}`;
}

function formatMonth(m: string): string {
  const [y, mo] = m.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[parseInt(mo) - 1]} ${y}`;
}

function marginColor(pct: number): string {
  if (pct > 5) return 'var(--color-success-700)';
  if (pct >= 0) return 'var(--color-alert-700)';
  return 'var(--color-error-700)';
}

function marginBg(pct: number): string {
  if (pct > 5) return 'var(--color-success-50)';
  if (pct >= 0) return 'var(--color-alert-50)';
  return 'var(--color-error-50)';
}

// ─── Skeletons ──────────────────────────────────────────────────

function CardsSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <AxisSkeleton variant="custom" width="200px" height="28px" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-surface-raised rounded-2xl p-6 border border-stroke min-h-[280px] flex flex-col gap-4">
            <AxisSkeleton variant="custom" width="80px" height="22px" />
            <AxisSkeleton variant="custom" width="70%" height="24px" />
            <AxisSkeleton variant="custom" width="100%" height="14px" />
            <AxisSkeleton variant="custom" width="85%" height="14px" />
            <div className="flex-grow" />
            <div className="flex gap-4">
              <AxisSkeleton variant="custom" width="60px" height="32px" />
              <AxisSkeleton variant="custom" width="60px" height="32px" />
              <AxisSkeleton variant="custom" width="60px" height="32px" />
            </div>
            <div className="pt-4 border-t border-stroke">
              <AxisSkeleton variant="custom" width="120px" height="14px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReaderSkeleton() {
  return (
    <div className="min-h-full">
      <div className="mb-8">
        <AxisSkeleton variant="custom" width="140px" height="32px" />
      </div>
      <div className="max-w-[820px] mx-auto px-4">
        <div className="mb-8 pb-6 border-b border-stroke">
          <AxisSkeleton variant="custom" width="100px" height="22px" />
          <div className="mt-4"><AxisSkeleton variant="custom" width="60%" height="32px" /></div>
          <div className="mt-4 flex gap-4">
            <AxisSkeleton variant="custom" width="140px" height="18px" />
            <AxisSkeleton variant="custom" width="100px" height="18px" />
          </div>
        </div>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="mb-6 bg-surface-raised rounded-xl border border-stroke p-5">
            <AxisSkeleton variant="custom" width="200px" height="22px" />
            <div className="mt-4"><AxisSkeleton variant="custom" width="100%" height="100px" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Report Card ────────────────────────────────────────────────

function ReportCard({
  report,
  onClick,
}: {
  report: ReportCardPreview;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface-raised rounded-2xl p-6
                 shadow-xs hover:shadow-md border border-stroke
                 transition-all duration-300 group flex flex-col min-h-[280px]"
    >
      {/* Category tags */}
      <div className="mb-4 flex gap-2">
        {report.tags.map(tag => (
          <AxisTag key={tag} color="info" size="sm" variant="outlined">
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </AxisTag>
        ))}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-content-primary mb-2 leading-snug">
        {report.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-content-secondary mb-4 line-clamp-2">
        {report.description}
      </p>

      {/* KPI preview */}
      <div className="flex-grow">
        {report.summary ? (
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-content-tertiary uppercase tracking-wider">Pieces</span>
              <span className="text-sm font-semibold text-content-primary">{fmtN(report.summary.totalPieces)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-content-tertiary uppercase tracking-wider">Revenue</span>
              <span className="text-sm font-semibold text-content-primary">{fmt$(report.summary.totalRevenue)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-content-tertiary uppercase tracking-wider">Margin</span>
              <span className="text-sm font-semibold" style={{ color: marginColor(report.summary.grossMarginPct) }}>
                {fmtPct(report.summary.grossMarginPct)}
              </span>
            </div>
          </div>
        ) : (
          <AxisSkeleton variant="custom" width="200px" height="36px" />
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-stroke flex items-center justify-between">
        <span className="text-xs text-content-tertiary">
          {formatMonth(report.dateRange.start)} – {formatMonth(report.dateRange.end)}
        </span>
        <span className="text-xs font-medium text-main-600 dark:text-main-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          Read
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </button>
  );
}

// ─── Section Components ─────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-raised rounded-xl border border-stroke p-5">
      <h2 className="text-base font-semibold text-content-primary mb-4">{title}</h2>
      {children}
    </section>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider">{label}</span>
      <span className="text-xl font-bold" style={color ? { color } : undefined}>
        {value}
      </span>
      {sub && <span className="text-xs text-content-tertiary">{sub}</span>}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stroke">
            {headers.map((h, i) => (
              <th key={i} className="text-left py-2 px-3 text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-stroke last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="py-2 px-3 text-content-secondary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Markdown Export ────────────────────────────────────────────

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function mdTable(headers: string[], rows: string[][]): string {
  const sep = headers.map(() => '---');
  return [
    `| ${headers.join(' | ')} |`,
    `| ${sep.join(' | ')} |`,
    ...rows.map(r => `| ${r.join(' | ')} |`),
  ].join('\n');
}

function generateProfitabilityMarkdown(data: ProfitabilityReportData, meta: ReportMetadata): string {
  const e = data.executiveSummary;
  const dq = data.dataQuality;
  const ph = data.pricingHistory;
  const ats = data.allTimeSummary;

  const lines: string[] = [];
  lines.push(`# ${meta.title}`);
  lines.push('');
  lines.push(`**Date range:** ${formatMonth(meta.dateRange.start)} – ${formatMonth(meta.dateRange.end)}`);
  lines.push(`**Prepared by:** German Alvarez (Metrics)`);
  lines.push(`**Generated:** ${new Date(data.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  lines.push(`**Data sources:** PCM API, Aurora PostgreSQL, Invoice PDFs (264 invoices)`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Executive summary
  lines.push('## Executive summary');
  lines.push('');
  lines.push(mdTable(
    ['Metric', 'Value'],
    [
      ['Total mail pieces', fmtN(e.totalPieces)],
      ['Customer revenue', fmt$(e.totalRevenue)],
      ['PCM cost', fmt$(e.totalPcmCost)],
      ['Gross margin', `${fmt$(e.grossMargin)} (${fmtPct(e.marginPercent)})`],
    ]
  ));
  lines.push('');
  lines.push(`The direct mail service has processed **${fmtN(e.totalPieces)} mail pieces** across ${data.clientProfitability.length} client domains since December 2024, generating **${fmt$(e.totalRevenue)} in customer revenue** against **${fmt$(e.totalPcmCost)} in PostcardMania costs** — a gross profit of **${fmt$(e.grossMargin)} (${fmtPct(e.marginPercent)} margin)**.`);
  lines.push('');
  lines.push('> From launch through January 15, 2026, we charged customers $1.08/piece (Standard) and $1.39/piece (First Class). On **January 16, 2026**, customer prices were dropped to $0.87/$0.63, matching PCM\'s rates exactly. All sends since that date have been at **zero margin**.');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Data quality
  lines.push('## Data quality');
  lines.push('');
  lines.push(mdTable(
    ['Source', 'Count', 'Notes'],
    [
      ['PCM active orders', fmtN(dq.pcmOrders), 'From PCM API'],
      ['Aurora total sends', fmtN(dq.auroraSends), 'Latest snapshot per domain'],
      ['Delta', fmtN(dq.delta), 'Orders in PCM pipeline'],
      ['**Match rate**', `**${fmtPct(dq.matchRate)}**`, ''],
    ]
  ));
  lines.push('');
  if (dq.clients.length > 0) {
    lines.push('### Per-client reconciliation');
    lines.push('');
    lines.push(mdTable(
      ['Client', 'Aurora sends'],
      dq.clients.filter(c => c.auroraSends > 0).map(c => [c.domain, fmtN(c.auroraSends)])
    ));
    lines.push('');
  }
  lines.push('---');
  lines.push('');

  // Pricing history
  lines.push('## Pricing history');
  lines.push('');
  lines.push('### What PostcardMania charged us');
  lines.push('');
  lines.push(mdTable(
    ['Era', 'Period', 'First class', 'Standard'],
    ph.pcmEras.map(era => [era.label, era.period, fmt$(era.fcRate), fmt$(era.stdRate)])
  ));
  lines.push('');
  lines.push('### What we charged customers');
  lines.push('');
  lines.push(mdTable(
    ['Era', 'Period', 'First class', 'Standard'],
    ph.customerEras.map(era => [era.label, era.period, fmt$(era.fcRate), fmt$(era.stdRate)])
  ));
  lines.push('');
  lines.push('### Margin per piece by period');
  lines.push('');
  lines.push(mdTable(
    ['Period', 'PCM (FC/Std)', 'Ours (FC/Std)', 'Margin (FC/Std)', 'Status'],
    ph.marginEras.map(era => [
      era.period,
      `${fmt$(era.pcmFc)} / ${fmt$(era.pcmStd)}`,
      `${fmt$(era.ourFc)} / ${fmt$(era.ourStd)}`,
      `+${fmt$(era.marginFc)} / +${fmt$(era.marginStd)}`,
      era.status,
    ])
  ));
  lines.push('');
  lines.push('---');
  lines.push('');

  // Monthly PCM costs
  lines.push('## Month-by-month: what PCM charged us');
  lines.push('');
  lines.push(mdTable(
    ['Month', 'FC pieces', 'Std pieces', 'Total', 'PCM cost', 'Era'],
    [
      ...data.monthlyPcmCosts.map(m => [formatMonth(m.month), fmtN(m.fcPieces), fmtN(m.stdPieces), fmtN(m.totalPieces), fmt$(m.pcmCost), m.era]),
      ['**Total**', `**${fmtN(data.monthlyPcmCosts.reduce((s, m) => s + m.fcPieces, 0))}**`, `**${fmtN(data.monthlyPcmCosts.reduce((s, m) => s + m.stdPieces, 0))}**`, `**${fmtN(data.monthlyPcmCosts.reduce((s, m) => s + m.totalPieces, 0))}**`, `**${fmt$(data.monthlyPcmCosts.reduce((s, m) => s + m.pcmCost, 0))}**`, ''],
    ]
  ));
  lines.push('');
  lines.push('---');
  lines.push('');

  // Monthly revenue
  lines.push('## Month-by-month: what we charged customers');
  lines.push('');
  lines.push(mdTable(
    ['Month', 'Sends', 'Revenue', 'Avg rate/piece'],
    [
      ...data.monthlyRevenue.map(m => [formatMonth(m.month), fmtN(m.sends), fmt$(m.revenue), fmtRate(m.avgRate)]),
      ['**Total**', `**${fmtN(data.monthlyRevenue.reduce((s, m) => s + m.sends, 0))}**`, `**${fmt$(data.monthlyRevenue.reduce((s, m) => s + m.revenue, 0))}**`, ''],
    ]
  ));
  lines.push('');
  lines.push('---');
  lines.push('');

  // All-time summary
  lines.push('## All-time profitability summary');
  lines.push('');
  lines.push(mdTable(
    ['Metric', 'Value'],
    [
      ['Total sends', fmtN(ats.totalSends)],
      ['Total revenue', fmt$(ats.totalRevenue)],
      ['Total PCM cost', fmt$(ats.totalPcmCost)],
      ['Gross margin', fmt$(ats.grossMargin)],
      ['Margin %', fmtPct(ats.marginPercent)],
      ['Revenue per piece', fmtRate(ats.revenuePerPiece)],
      ['PCM cost per piece', fmtRate(ats.costPerPiece)],
      ['Margin per piece', fmtRate(ats.marginPerPiece)],
    ]
  ));
  lines.push('');
  lines.push('---');
  lines.push('');

  // Per-client profitability
  lines.push('## Per-client profitability');
  lines.push('');
  lines.push(mdTable(
    ['Client', 'Sends', 'Revenue', 'PCM cost', 'Margin', 'Margin %', 'Blended rate'],
    data.clientProfitability.map(c => [
      c.domain,
      fmtN(c.sends),
      fmt$(c.revenue),
      fmt$(c.pcmCost),
      fmt$(c.margin),
      fmtPct(c.marginPercent),
      fmtRate(c.blendedRate),
    ])
  ));
  lines.push('');
  lines.push('---');
  lines.push('');

  // Action items
  lines.push('## Action items');
  lines.push('');
  lines.push('### Immediate');
  lines.push('');
  lines.push('1. **Correct `parameters.pcm_cost`** in monolith — current values ($0.625/$0.875) don\'t match any invoice. Should be $0.63/$0.87.');
  lines.push('');
  lines.push('### Strategic (for Camilo)');
  lines.push('');
  lines.push('2. **Investigate the Jan 16 price drop.** Who changed customer prices from $1.39/$1.08 to $0.87/$0.63? Nov–Jan was our most profitable window.');
  lines.push('3. **Decide on margin strategy going forward:** Current is $0.00/piece. Options: 5% margin (Std $0.67, FC $0.92), 10% margin (Std $0.70, FC $0.97), or keep zero margin (DM drives $500K+ in deals).');
  lines.push('4. **Negotiate with PCM** — at 8,000+ pieces/month and growing, request volume pricing below $0.87/$0.63.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Report generated from live Aurora database and PCM API data on ${new Date(data.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.*`);

  return lines.join('\n');
}

// ─── Profitability Report Reader ────────────────────────────────

function ProfitabilityReportReader({
  data,
  meta,
  onBack,
}: {
  data: ProfitabilityReportData;
  meta: ReportMetadata;
  onBack: () => void;
}) {
  const exec = data.executiveSummary;
  const dq = data.dataQuality;
  const ph = data.pricingHistory;
  const ats = data.allTimeSummary;

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="mb-8 flex items-center justify-between">
        <AxisButton
          onClick={onBack}
          variant="ghost"
          size="sm"
          iconLeft={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          }
        >
          Back to reports
        </AxisButton>
        <AxisButton
          onClick={() => downloadMarkdown(
            `${meta.slug}-${new Date().toISOString().slice(0, 10)}.md`,
            generateProfitabilityMarkdown(data, meta)
          )}
          variant="outlined"
          size="sm"
          iconLeft={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          }
        >
          Download .md
        </AxisButton>
      </div>

      {/* Centered content */}
      <div className="max-w-[820px] mx-auto px-4">

        {/* ── Header ──────────────────────────────────── */}
        <header className="mb-8 pb-6 border-b border-stroke">
          <div className="mb-4 flex gap-2">
            {meta.tags.map(tag => (
              <AxisTag key={tag} color="info" variant="outlined">
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </AxisTag>
            ))}
            <AxisTag color="success" variant="outlined">Published</AxisTag>
          </div>

          <h1 className="text-3xl font-bold text-content-primary mb-4 leading-tight">
            {meta.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-content-secondary">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatMonth(meta.dateRange.start)} – {formatMonth(meta.dateRange.end)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>German Alvarez</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              <span>PCM API, Aurora, Invoice PDFs</span>
            </div>
          </div>
        </header>

        {/* ── Document Sections ───────────────────────── */}
        <div className="space-y-6">

          {/* 1. Executive summary */}
          <Section title="Executive summary">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <StatCard label="Mail pieces" value={fmtN(exec.totalPieces)} />
              <StatCard label="Customer revenue" value={fmt$(exec.totalRevenue)} />
              <StatCard label="PCM cost" value={fmt$(exec.totalPcmCost)} />
              <StatCard
                label="Gross margin"
                value={fmtPct(exec.marginPercent)}
                sub={fmt$(exec.grossMargin)}
                color={marginColor(exec.marginPercent)}
              />
            </div>
            <p className="text-sm text-content-secondary leading-relaxed">
              The direct mail service has processed <strong>{fmtN(exec.totalPieces)} mail pieces</strong> across {data.clientProfitability.length} client domains
              since December 2024, generating <strong>{fmt$(exec.totalRevenue)} in customer revenue</strong> against{' '}
              <strong>{fmt$(exec.totalPcmCost)} in PostcardMania costs</strong> — a gross profit of{' '}
              <strong style={{ color: marginColor(exec.marginPercent) }}>{fmt$(exec.grossMargin)} ({fmtPct(exec.marginPercent)} margin)</strong>.
            </p>
            <div className="mt-3">
              <AxisCallout type="info" hideIcon>
                From launch through January 15, 2026, we charged customers $1.08/piece (Standard) and $1.39/piece (First Class).
                On <strong>January 16, 2026</strong>, customer prices were dropped to $0.87/$0.63, matching PCM&apos;s rates exactly.
                All sends since that date have been at <strong>zero margin</strong>.
              </AxisCallout>
            </div>
          </Section>

          {/* 2. Data quality */}
          <Section title="Data quality">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <StatCard label="PCM orders" value={fmtN(dq.pcmOrders)} />
              <StatCard label="Aurora sends" value={fmtN(dq.auroraSends)} />
              <StatCard
                label="Match rate"
                value={fmtPct(dq.matchRate)}
                color={dq.matchRate >= 95 ? 'var(--color-success-700)' : 'var(--color-alert-700)'}
              />
            </div>
            <div className="mb-3">
              <AxisCallout type="info" hideIcon>
                Data quality is measured by comparing PCM&apos;s total active orders (non-canceled, excluding test domains)
                against Aurora&apos;s cumulative sends. Small deltas are expected from orders still in the PCM processing pipeline.
              </AxisCallout>
            </div>
            {dq.clients.length > 0 && (
              <SimpleTable
                headers={['Client', 'Aurora sends', 'Status']}
                rows={dq.clients.filter(c => c.auroraSends > 0).map(c => [
                  c.domain,
                  fmtN(c.auroraSends),
                  <AxisTag key={c.domain} color="success" size="sm">Tracked</AxisTag>,
                ])}
              />
            )}
          </Section>

          {/* 3. Pricing history */}
          <Section title="Pricing history">
            <h3 className="text-sm font-semibold text-content-primary mb-2">What PostcardMania charged us</h3>
            <SimpleTable
              headers={['Era', 'Period', 'First class', 'Standard']}
              rows={ph.pcmEras.map(e => [
                <AxisTag key={e.label} color="neutral" size="sm" variant="outlined">{e.label}</AxisTag>,
                e.period,
                fmt$(e.fcRate),
                fmt$(e.stdRate),
              ])}
            />

            <h3 className="text-sm font-semibold text-content-primary mt-5 mb-2">What we charged customers</h3>
            <SimpleTable
              headers={['Era', 'Period', 'First class', 'Standard']}
              rows={ph.customerEras.map(e => [
                <AxisTag key={e.label} color="neutral" size="sm" variant="outlined">{e.label}</AxisTag>,
                e.period,
                fmt$(e.fcRate),
                fmt$(e.stdRate),
              ])}
            />

            <h3 className="text-sm font-semibold text-content-primary mt-5 mb-2">Margin per piece by period</h3>
            <SimpleTable
              headers={['Period', 'PCM (FC/Std)', 'Ours (FC/Std)', 'Margin (FC/Std)', 'Status']}
              rows={ph.marginEras.map(e => [
                e.period,
                `${fmt$(e.pcmFc)} / ${fmt$(e.pcmStd)}`,
                `${fmt$(e.ourFc)} / ${fmt$(e.ourStd)}`,
                <span key={e.period} style={{ color: e.marginFc > 0 ? 'var(--color-success-700)' : 'var(--color-error-700)' }}>
                  +{fmt$(e.marginFc)} / +{fmt$(e.marginStd)}
                </span>,
                <AxisTag
                  key={`s-${e.period}`}
                  color={e.marginFc > 0 ? 'success' : 'error'}
                  size="sm"
                >
                  {e.status}
                </AxisTag>,
              ])}
            />

            <div className="mt-4">
              <AxisCallout type="alert">
                <strong>Jun 28, 2025:</strong> PCM raised prices overnight — FC jumped from $0.94 to $1.11. Our margins shrank but stayed positive.
                <br />
                <strong>~Nov 2025:</strong> PCM dropped prices via &ldquo;Qual Credit&rdquo; line items. Nov–Jan 15 was our <strong>most profitable window</strong> (+$0.52/+$0.45 per piece).
                <br />
                <strong>Jan 16, 2026:</strong> Customer prices were dropped to match PCM — all sends since then are at <strong>zero margin</strong>.
              </AxisCallout>
            </div>
          </Section>

          {/* 4. Monthly PCM costs */}
          <Section title="Month-by-month: what PCM charged us">
            <SimpleTable
              headers={['Month', 'FC pieces', 'Std pieces', 'Total', 'PCM cost', 'Era']}
              rows={[
                ...data.monthlyPcmCosts.map(m => [
                  formatMonth(m.month),
                  fmtN(m.fcPieces),
                  fmtN(m.stdPieces),
                  fmtN(m.totalPieces),
                  fmt$(m.pcmCost),
                  <AxisTag key={m.month} color="neutral" size="sm" variant="outlined">{m.era}</AxisTag>,
                ]),
                // Total row
                [
                  <strong key="total">Total</strong>,
                  <strong key="fc">{fmtN(data.monthlyPcmCosts.reduce((s, m) => s + m.fcPieces, 0))}</strong>,
                  <strong key="std">{fmtN(data.monthlyPcmCosts.reduce((s, m) => s + m.stdPieces, 0))}</strong>,
                  <strong key="tp">{fmtN(data.monthlyPcmCosts.reduce((s, m) => s + m.totalPieces, 0))}</strong>,
                  <strong key="cost">{fmt$(data.monthlyPcmCosts.reduce((s, m) => s + m.pcmCost, 0))}</strong>,
                  '',
                ],
              ]}
            />
          </Section>

          {/* 5. Monthly customer revenue */}
          <Section title="Month-by-month: what we charged customers">
            <SimpleTable
              headers={['Month', 'Sends', 'Revenue', 'Avg rate/piece']}
              rows={[
                ...data.monthlyRevenue.map(m => [
                  formatMonth(m.month),
                  fmtN(m.sends),
                  fmt$(m.revenue),
                  fmtRate(m.avgRate),
                ]),
                // Total row
                [
                  <strong key="total">Total</strong>,
                  <strong key="sends">{fmtN(data.monthlyRevenue.reduce((s, m) => s + m.sends, 0))}</strong>,
                  <strong key="rev">{fmt$(data.monthlyRevenue.reduce((s, m) => s + m.revenue, 0))}</strong>,
                  '',
                ],
              ]}
            />
          </Section>

          {/* 6. All-time profitability summary */}
          <Section title="All-time profitability summary">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total sends" value={fmtN(ats.totalSends)} />
              <StatCard label="Total revenue" value={fmt$(ats.totalRevenue)} />
              <StatCard label="Total PCM cost" value={fmt$(ats.totalPcmCost)} />
              <StatCard label="Gross margin" value={fmt$(ats.grossMargin)} sub={fmtPct(ats.marginPercent)} color={marginColor(ats.marginPercent)} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-stroke">
              <StatCard label="Revenue per piece" value={fmtRate(ats.revenuePerPiece)} />
              <StatCard label="PCM cost per piece" value={fmtRate(ats.costPerPiece)} />
              <StatCard label="Margin per piece" value={fmtRate(ats.marginPerPiece)} color={marginColor(ats.marginPerPiece * 100)} />
            </div>
          </Section>

          {/* 7. Per-client profitability */}
          <Section title="Per-client profitability">
            <SimpleTable
              headers={['Client', 'Sends', 'Revenue', 'PCM cost', 'Margin', 'Margin %', 'Blended rate']}
              rows={data.clientProfitability.map(c => [
                c.domain,
                fmtN(c.sends),
                fmt$(c.revenue),
                fmt$(c.pcmCost),
                <span key={`m-${c.domain}`} style={{ color: marginColor(c.marginPercent) }}>{fmt$(c.margin)}</span>,
                <span
                  key={`mp-${c.domain}`}
                  className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: marginBg(c.marginPercent), color: marginColor(c.marginPercent) }}
                >
                  {fmtPct(c.marginPercent)}
                </span>,
                fmtRate(c.blendedRate),
              ])}
            />
          </Section>

          {/* 8. Action items */}
          <Section title="Action items">
            <div className="space-y-3">
              <AxisCallout type="alert" title="Immediate">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Correct <code className="text-xs bg-surface-sunken px-1 py-0.5 rounded">parameters.pcm_cost</code> in monolith — current values ($0.625/$0.875) don&apos;t match any invoice. Should be $0.63/$0.87.</li>
                </ul>
              </AxisCallout>
              <AxisCallout type="info" title="Strategic (for Camilo)">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Investigate the Jan 16 price drop.</strong> Who changed customer prices from $1.39/$1.08 to $0.87/$0.63? Nov–Jan was our most profitable window.</li>
                  <li><strong>Decide on margin strategy going forward:</strong> Current is $0.00/piece. Options: 5% margin (Std $0.67, FC $0.92), 10% margin (Std $0.70, FC $0.97), or keep zero margin (DM drives $500K+ in deals).</li>
                  <li><strong>Negotiate with PCM</strong> — at 8,000+ pieces/month and growing, request volume pricing below $0.87/$0.63.</li>
                </ul>
              </AxisCallout>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-stroke mb-8">
          <p className="text-xs text-content-tertiary">
            Report generated from live Aurora database and PCM API data on {new Date(data.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export const DmReportsTab = forwardRef<TabHandle>(function DmReportsTab(_, ref) {
  useImperativeHandle(ref, () => ({
    resetLayout: () => {},
    openWidgetCatalog: () => {},
  }), []);

  const [reports, setReports] = useState<ReportCardPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ProfitabilityReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Fetch report list on mount
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/dm-reports?type=list');
      if (!res.ok) throw new Error(`Failed to load reports (${res.status})`);
      const json = await res.json();

      // Merge live summary into registry metadata
      const cards: ReportCardPreview[] = REPORT_REGISTRY.map(meta => ({
        ...meta,
        summary: json.summary || null,
      }));

      setReports(cards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Fetch individual report
  const fetchReport = useCallback(async (slug: string) => {
    setSelectedSlug(slug);
    setLoadingReport(true);
    setReportError(null);
    setReportData(null);
    try {
      const res = await authFetch('/api/dm-reports?type=profitability-report');
      if (!res.ok) throw new Error(`Failed to load report (${res.status})`);
      const json: ProfitabilityReportData = await res.json();
      setReportData(json);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoadingReport(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setSelectedSlug(null);
    setReportData(null);
    setReportError(null);
  }, []);

  // ── Loading state ──
  if (loading) return <CardsSkeleton />;

  // ── Error state ──
  if (error && !selectedSlug) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="max-w-md w-full">
          <AxisCallout type="error" title="Failed to load reports">
            <p className="mb-4">{error}</p>
            <AxisButton onClick={fetchList} variant="filled">Retry</AxisButton>
          </AxisCallout>
        </div>
      </div>
    );
  }

  // ── Report reader view ──
  if (selectedSlug && reportData) {
    const meta = REPORT_REGISTRY.find(r => r.slug === selectedSlug) || REPORT_REGISTRY[0];
    return <ProfitabilityReportReader data={reportData} meta={meta} onBack={handleBack} />;
  }

  // ── Loading report ──
  if (loadingReport) return <ReaderSkeleton />;

  // ── Report error ──
  if (reportError) {
    return (
      <div className="min-h-full">
        <div className="mb-8">
          <AxisButton onClick={handleBack} variant="ghost" size="sm" iconLeft={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          }>
            Back to reports
          </AxisButton>
        </div>
        <div className="max-w-md mx-auto mt-12">
          <AxisCallout type="error" title="Failed to load report">
            <p className="mb-4">{reportError}</p>
            <AxisButton onClick={() => selectedSlug && fetchReport(selectedSlug)} variant="filled">Retry</AxisButton>
          </AxisCallout>
        </div>
      </div>
    );
  }

  // ── Cards grid view (default) ──
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-content-primary" style={{ margin: 0 }}>
          Reports
        </h2>
        <p className="text-sm text-content-secondary mt-1">
          Analytical reports with validated data from PCM API, Aurora, and invoice records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reports.map(report => (
          <ReportCard
            key={report.id}
            report={report}
            onClick={() => fetchReport(report.slug)}
          />
        ))}
      </div>
    </div>
  );
});
