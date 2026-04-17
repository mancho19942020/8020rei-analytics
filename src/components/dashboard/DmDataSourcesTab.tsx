'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { AxisButton, AxisTag, AxisCallout } from '@/components/axis';
import { TabHandle } from '@/types/widget';

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

function generateDataSourcesMarkdown(): string {
  const lines: string[] = [];

  lines.push('# DM Campaign — Data sources & methodology');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  lines.push('');
  lines.push('This document describes every data source that powers the DM Campaign section, how information is cross-referenced between systems, and the freshness guarantees for each metric.');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Data flow
  lines.push('## Data flow overview');
  lines.push('');
  lines.push('```');
  lines.push('PostcardMania API ──┐');
  lines.push('                    ├──► Metrics Hub API routes (5-min cache) ──► Dashboard tabs');
  lines.push('Aurora PostgreSQL ──┤');
  lines.push('                    │');
  lines.push('Invoice PDFs ───────┘    (Operational health, Business results, Profitability, Reports)');
  lines.push('```');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Source 1: PCM API
  lines.push('## 1. PostcardMania API (External API)');
  lines.push('');
  lines.push('Third-party mailing vendor. Provides real-time order status, batch tracking, design metadata, and account balance. Accessed via authenticated REST API.');
  lines.push('');
  lines.push('| Endpoint | Data provided | Used by |');
  lines.push('|----------|---------------|---------|');
  lines.push('| `/order` | Total orders, status per order, quantities | Operational health, Profitability |');
  lines.push('| `/integration/balance` | Account balance (money on account) | Profitability |');
  lines.push('| `/design` | Design templates, approval dates | Profitability |');
  lines.push('| `/batch` | Batch metadata for invoice matching | Reports |');
  lines.push('| `/recipient/undeliverable` | Undeliverable recipient tracking | Operational health |');
  lines.push('');
  lines.push('> **Read-only policy:** The PCM API integration is strictly read-only by executive directive. Only GET requests are allowed (except authentication). No data is ever written back to PostcardMania.');
  lines.push('');

  // Source 2: Aurora
  lines.push('## 2. Aurora PostgreSQL (Internal database)');
  lines.push('');
  lines.push('AWS Aurora PostgreSQL instance. Populated by the 8020REI monolith via hourly sync jobs. Accessed via RDS Data API.');
  lines.push('');
  lines.push('| Table | Description | Key columns | Used by |');
  lines.push('|-------|-------------|-------------|---------|');
  lines.push('| `dm_client_funnel` | Cumulative per-client totals (latest snapshot per domain) | total_sends, total_cost, total_pcm_cost, margin | All tabs |');
  lines.push('| `dm_volume_summary` | Daily volume per domain per mail class | daily_sends, daily_cost, mail_class | Profitability, Reports |');
  lines.push('| `dm_property_conversions` | Individual property records with per-send unit costs | domain, unit_cost, mail_class | Business results, Reports |');
  lines.push('| `rr_daily_metrics` | Daily operational metrics per domain | sends_total, delivered_count, on_hold | Operational health |');
  lines.push('| `rr_campaign_snapshots` | Active campaign tracking per domain | domain, campaign_status | Operational health |');
  lines.push('');

  // Source 3: Invoices
  lines.push('## 3. Invoice PDFs (Verified records)');
  lines.push('');
  lines.push('264 PostcardMania invoices spanning Dec 2024 – Apr 2026 were manually analyzed to establish the exact pricing eras.');
  lines.push('');
  lines.push('| Pricing era | Period | First class | Standard | Batch range |');
  lines.push('|-------------|--------|-------------|----------|-------------|');
  lines.push('| Era 1: Original | Dec 2024 – Jun 27, 2025 | $0.94 | $0.74 | 39932 – 49247 |');
  lines.push('| Era 2: Price hike | Jun 28 – Oct 2025 | $1.11 → $1.16 | $0.93 | 49302 – 56623 |');
  lines.push('| Era 3: Current | Nov 2025 – present | $0.87 | $0.63 | 56674 – 69910 |');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Cross-referencing
  lines.push('## How data is cross-referenced');
  lines.push('');
  lines.push('### Volume reconciliation');
  lines.push('PCM total active orders (non-canceled) are compared against Aurora\'s cumulative send count. Small deltas are expected from orders still in the PCM processing pipeline.');
  lines.push('');
  lines.push('```');
  lines.push('Match rate = min(PCM orders, Aurora sends) / max(PCM orders, Aurora sends) × 100');
  lines.push('```');
  lines.push('');
  lines.push('### Revenue verification');
  lines.push('Customer revenue is calculated from `dm_client_funnel.total_cost` (what we charge clients). This is cross-checked against `dm_property_conversions` unit costs × volume.');
  lines.push('');
  lines.push('### PCM cost validation');
  lines.push('Invoice-verified rates per pricing era are compared against `dm_client_funnel.total_pcm_cost`. The monolith uses `parameters.pcm_cost` to populate this field, which may differ from actual invoice amounts.');
  lines.push('');
  lines.push('> **Known gap:** The monolith\'s `parameters.pcm_cost` values ($0.625/$0.875) do not match any invoice. Actual rates are $0.63/$0.87. This causes platform-computed PCM costs to differ from invoice-verified totals.');
  lines.push('');
  lines.push('### Price change detection');
  lines.push('Per-piece rates are calculated daily from `dm_volume_summary` (daily_cost / daily_sends). Rate changes are auto-detected when the delta exceeds $0.005/piece.');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Per-tab mapping
  lines.push('## What each tab shows');
  lines.push('');

  lines.push('### Operational health');
  lines.push('');
  lines.push('| Metric | Source table | Calculation |');
  lines.push('|--------|-------------|-------------|');
  lines.push('| Daily sends / deliveries | `rr_daily_metrics` | Sum of sends_total, delivered_count per day |');
  lines.push('| On-hold / protected / error | `rr_daily_metrics` | Direct column values per domain per day |');
  lines.push('| Active campaigns | `rr_campaign_snapshots` | Count of domains with active campaign status |');
  lines.push('| Response rate | `dm_property_conversions` | Properties with response / total mailed |');
  lines.push('| Delivery rate | `rr_daily_metrics` | delivered_count / sends_total × 100 |');
  lines.push('');

  lines.push('### Business results');
  lines.push('');
  lines.push('| Metric | Source table | Calculation |');
  lines.push('|--------|-------------|-------------|');
  lines.push('| Conversion funnel | `dm_property_conversions` | Mailed → responded → converted stages |');
  lines.push('| Client performance | `dm_client_funnel` | Per-domain totals: sends, cost, mailed, delivered |');
  lines.push('| Geographic breakdown | `dm_property_conversions` | Grouped by state/city |');
  lines.push('| Timeline events | `dm_property_conversions` | Per-property send/response/conversion dates |');
  lines.push('');

  lines.push('### Profitability');
  lines.push('');
  lines.push('| Metric | Source | Calculation |');
  lines.push('|--------|-------|-------------|');
  lines.push('| Revenue / PCM cost / margin | `dm_client_funnel` | total_cost − total_pcm_cost = margin |');
  lines.push('| Per-mail-class margins | `dm_volume_summary` | Cumulative cost/sends per mail class |');
  lines.push('| Client margins | `dm_client_funnel` | Per-domain: total_cost, total_pcm_cost, margin_pct |');
  lines.push('| Current rates | `dm_volume_summary` | Last 7 days: daily_cost / daily_sends |');
  lines.push('| Pricing history | Invoice PDFs + Aurora | Static era rates + live trend |');
  lines.push('| PCM orders / balance | PCM API | /order total count, /integration/balance |');
  lines.push('');

  lines.push('### Reports');
  lines.push('');
  lines.push('| Section | Source | Note |');
  lines.push('|---------|-------|------|');
  lines.push('| Executive summary | `dm_client_funnel` | Live aggregate query |');
  lines.push('| Data quality | PCM API + Aurora | PCM /order count vs Aurora sends |');
  lines.push('| Pricing history | Invoice PDFs (static) | Verified from 264 invoices |');
  lines.push('| Monthly PCM costs | Invoice PDFs (static) | dm_volume_summary lacks historical data |');
  lines.push('| Monthly revenue | `dm_property_conversions` | Aggregated by month |');
  lines.push('| Per-client profitability | `dm_client_funnel` | Live per-domain totals |');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Freshness
  lines.push('## Data freshness & caching');
  lines.push('');
  lines.push('| Source | Sync frequency | Cache TTL | Latency |');
  lines.push('|--------|----------------|-----------|---------|');
  lines.push('| Aurora (dm_client_funnel) | Hourly from monolith | 5 minutes | ~1 hour |');
  lines.push('| Aurora (rr_daily_metrics) | Hourly from monolith | 5 minutes | ~1 hour |');
  lines.push('| Aurora (dm_volume_summary) | Hourly from monolith | 5 minutes | ~1 hour |');
  lines.push('| PCM API | On-demand per request | 5 minutes | Real-time |');
  lines.push('| Invoice-verified data | Static (manual update) | N/A | Snapshot |');
  lines.push('');

  // Test domains
  lines.push('## Test domain exclusions');
  lines.push('');
  lines.push('The following domains are excluded from all queries:');
  lines.push('');
  lines.push('- `8020rei_demo`');
  lines.push('- `8020rei_migracion_test`');
  lines.push('- `_test_debug`');
  lines.push('- `_test_debug3`');
  lines.push('- `supertest_8020rei_com`');
  lines.push('- `sandbox_8020rei_com`');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Known limitations
  lines.push('## Known limitations');
  lines.push('');
  lines.push('1. **PCM cost accuracy:** The monolith\'s `parameters.pcm_cost` uses $0.625/$0.875, which don\'t match any invoice. Real rates are $0.63/$0.87. Two clients (Central City Solutions, Reno Area Home Buyers) have $0 PCM cost in Aurora entirely.');
  lines.push('');
  lines.push('2. **Historical daily data:** `dm_volume_summary` only contains recent daily records. Historical month-by-month breakdowns rely on verified invoice data.');
  lines.push('');
  lines.push('3. **PCM API scope:** The PCM API does not provide per-domain order breakdowns. Per-client reconciliation relies on Aurora\'s per-domain tracking.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Last reviewed: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.*`);

  return lines.join('\n');
}

// ─── Reusable Section Blocks ────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-raised rounded-xl border border-stroke p-5">
      <h2 className="text-base font-semibold text-content-primary mb-4">{title}</h2>
      {children}
    </section>
  );
}

function SourceCard({
  name,
  type,
  description,
  details,
  color,
}: {
  name: string;
  type: string;
  description: string;
  details: React.ReactNode;
  color: 'info' | 'success' | 'alert' | 'neutral';
}) {
  return (
    <div className="border border-stroke rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-content-primary">{name}</h3>
        <AxisTag color={color} size="sm" variant="outlined">{type}</AxisTag>
      </div>
      <p className="text-sm text-content-secondary mb-3">{description}</p>
      {details}
    </div>
  );
}

function TableRow({ cells }: { cells: (string | React.ReactNode)[] }) {
  return (
    <tr className="border-b border-stroke last:border-0">
      {cells.map((cell, i) => (
        <td key={i} className="py-2 px-3 text-sm text-content-secondary">
          {cell}
        </td>
      ))}
    </tr>
  );
}

function MiniTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
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
          {rows.map((row, ri) => <TableRow key={ri} cells={row} />)}
        </tbody>
      </table>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--surface-sunken)' }}>
      {children}
    </code>
  );
}

// ─── Flow Diagram ───────────────────────────────────────────────

function DataFlowDiagram() {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px] py-4 flex flex-col items-center gap-3 text-xs">
        {/* Row 1: External sources */}
        <div className="flex items-center gap-6">
          <div className="px-3 py-2 rounded-lg border-2 text-center" style={{ borderColor: 'var(--color-info-500)', backgroundColor: 'var(--color-info-50)' }}>
            <div className="font-bold" style={{ color: 'var(--color-info-700)' }}>PostcardMania API</div>
            <div className="text-content-tertiary">Orders, balance, designs</div>
          </div>
          <div className="px-3 py-2 rounded-lg border-2 text-center" style={{ borderColor: 'var(--color-success-500)', backgroundColor: 'var(--color-success-50)' }}>
            <div className="font-bold" style={{ color: 'var(--color-success-700)' }}>Aurora PostgreSQL</div>
            <div className="text-content-tertiary">5 tables, synced hourly</div>
          </div>
          <div className="px-3 py-2 rounded-lg border-2 text-center" style={{ borderColor: 'var(--color-alert-500)', backgroundColor: 'var(--color-alert-50)' }}>
            <div className="font-bold" style={{ color: 'var(--color-alert-700)' }}>Invoice PDFs</div>
            <div className="text-content-tertiary">264 invoices verified</div>
          </div>
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-2 text-content-tertiary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span className="text-[10px] uppercase tracking-wider font-medium">Feed into</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* Row 2: Metrics Hub */}
        <div className="px-4 py-3 rounded-lg border-2 text-center" style={{ borderColor: 'var(--color-main-500)', backgroundColor: 'var(--color-main-50)' }}>
          <div className="font-bold" style={{ color: 'var(--color-main-700)' }}>Metrics Hub API routes</div>
          <div className="text-content-tertiary">Next.js API routes with 5-min cache</div>
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-2 text-content-tertiary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span className="text-[10px] uppercase tracking-wider font-medium">Render in</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* Row 3: Tabs */}
        <div className="flex items-center gap-3">
          {['Operational health', 'Business results', 'Profitability', 'Reports'].map(tab => (
            <div key={tab} className="px-3 py-1.5 rounded-md border border-stroke bg-surface-raised text-center">
              <div className="font-medium text-content-primary">{tab}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export const DmDataSourcesTab = forwardRef<TabHandle>(function DmDataSourcesTab(_, ref) {
  useImperativeHandle(ref, () => ({
    resetLayout: () => {},
    openWidgetCatalog: () => {},
  }), []);

  return (
    <div className="min-h-full">
      <div className="max-w-[820px] mx-auto px-4">

        {/* Header */}
        <header className="mb-8 pb-6 border-b border-stroke">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              <AxisTag color="neutral" variant="outlined">Documentation</AxisTag>
              <AxisTag color="info" variant="outlined">Transparency</AxisTag>
            </div>
            <AxisButton
              onClick={() => downloadMarkdown(
                `dm-data-sources-${new Date().toISOString().slice(0, 10)}.md`,
                generateDataSourcesMarkdown()
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

          <h1 className="text-3xl font-bold text-content-primary mb-3 leading-tight">
            Data sources & methodology
          </h1>

          <p className="text-sm text-content-secondary leading-relaxed">
            This page documents every data source that powers the DM Campaign section, how information is
            cross-referenced between systems, and the freshness guarantees for each metric.
            No sensitive credentials are shown — only the structure and flow of data.
          </p>
        </header>

        {/* Sections */}
        <div className="space-y-6">

          {/* 1. Data flow overview */}
          <Section title="Data flow overview">
            <p className="text-sm text-content-secondary mb-4">
              Three primary sources feed data into the DM Campaign tabs. Each source is queried through the Metrics Hub
              API layer, which applies caching, authentication, and test-domain exclusion before rendering in the UI.
            </p>
            <DataFlowDiagram />
          </Section>

          {/* 2. Primary data sources */}
          <Section title="Primary data sources">
            <div className="space-y-4">

              <SourceCard
                name="PostcardMania API"
                type="External API"
                description="Third-party mailing vendor. Provides real-time order status, batch tracking, design metadata, and account balance. Accessed via authenticated REST API."
                color="info"
                details={
                  <div>
                    <MiniTable
                      headers={['Endpoint', 'Data provided', 'Used by']}
                      rows={[
                        [<Code key="e">/order</Code>, 'Total orders, status per order, quantities', 'Operational health, Profitability'],
                        [<Code key="e">/integration/balance</Code>, 'Account balance (money on account)', 'Profitability'],
                        [<Code key="e">/design</Code>, 'Design templates, approval dates', 'Profitability'],
                        [<Code key="e">/batch</Code>, 'Batch metadata for invoice matching', 'Reports'],
                        [<Code key="e">/recipient/undeliverable</Code>, 'Undeliverable recipient tracking', 'Operational health'],
                      ]}
                    />
                    <div className="mt-3">
                      <AxisCallout type="info" hideIcon>
                        <strong>Read-only policy:</strong> The PCM API integration is strictly read-only by executive directive.
                        Only GET requests are allowed (except authentication). No data is ever written back to PostcardMania.
                      </AxisCallout>
                    </div>
                  </div>
                }
              />

              <SourceCard
                name="Aurora PostgreSQL"
                type="Internal database"
                description="AWS Aurora PostgreSQL instance that stores processed DM campaign data. Populated by the 8020REI monolith via hourly sync jobs. Accessed via RDS Data API."
                color="success"
                details={
                  <MiniTable
                    headers={['Table', 'Description', 'Key columns', 'Used by']}
                    rows={[
                      [
                        <Code key="t">dm_client_funnel</Code>,
                        'Cumulative per-client totals (latest snapshot per domain)',
                        'total_sends, total_cost, total_pcm_cost, margin',
                        'All tabs',
                      ],
                      [
                        <Code key="t">dm_volume_summary</Code>,
                        'Daily volume per domain per mail class',
                        'daily_sends, daily_cost, mail_class, cumulative_*',
                        'Profitability, Reports',
                      ],
                      [
                        <Code key="t">dm_property_conversions</Code>,
                        'Individual property records with per-send unit costs',
                        'domain, unit_cost, mail_class, created_at',
                        'Business results, Reports',
                      ],
                      [
                        <Code key="t">rr_daily_metrics</Code>,
                        'Daily operational metrics per domain',
                        'sends_total, sends_success, delivered_count, on_hold',
                        'Operational health',
                      ],
                      [
                        <Code key="t">rr_campaign_snapshots</Code>,
                        'Active campaign tracking per domain',
                        'domain, campaign_status, last_send_date',
                        'Operational health',
                      ],
                    ]}
                  />
                }
              />

              <SourceCard
                name="Invoice PDFs"
                type="Verified records"
                description="264 PostcardMania invoices spanning Dec 2024 – Apr 2026 were manually analyzed to establish the exact pricing eras. This is the source of truth for historical PCM rates."
                color="alert"
                details={
                  <MiniTable
                    headers={['Pricing era', 'Period', 'First class', 'Standard', 'Batch range']}
                    rows={[
                      ['Era 1: Original', 'Dec 2024 – Jun 27, 2025', '$0.94', '$0.74', '39932 – 49247'],
                      ['Era 2: Price hike', 'Jun 28 – Oct 2025', '$1.11 → $1.16', '$0.93', '49302 – 56623'],
                      ['Era 3: Current', 'Nov 2025 – present', '$0.87', '$0.63', '56674 – 69910'],
                    ]}
                  />
                }
              />
            </div>
          </Section>

          {/* 3. Cross-referencing methodology */}
          <Section title="How data is cross-referenced">
            <p className="text-sm text-content-secondary mb-4">
              Multiple sources track the same mail operations independently. Cross-referencing catches discrepancies
              and validates that internal records align with the vendor&apos;s system.
            </p>

            <div className="space-y-4">
              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-main-500)' }} />
                  <h3 className="text-sm font-semibold text-content-primary">Volume reconciliation</h3>
                </div>
                <p className="text-sm text-content-secondary mb-2">
                  PCM total active orders (non-canceled) are compared against Aurora&apos;s cumulative send count.
                  Small deltas are expected from orders still in the PCM processing pipeline.
                </p>
                <div className="text-xs text-content-tertiary p-2 rounded" style={{ backgroundColor: 'var(--surface-sunken)' }}>
                  Match rate = min(PCM orders, Aurora sends) / max(PCM orders, Aurora sends) × 100
                </div>
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success-500)' }} />
                  <h3 className="text-sm font-semibold text-content-primary">Revenue verification</h3>
                </div>
                <p className="text-sm text-content-secondary">
                  Customer revenue is calculated from <Code>dm_client_funnel.total_cost</Code> (what we charge clients).
                  This is cross-checked against <Code>dm_property_conversions</Code> unit costs × volume to verify
                  that the per-send pricing tiers are applied correctly.
                </p>
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-alert-500)' }} />
                  <h3 className="text-sm font-semibold text-content-primary">PCM cost validation</h3>
                </div>
                <p className="text-sm text-content-secondary mb-2">
                  Invoice-verified rates per pricing era are compared against <Code>dm_client_funnel.total_pcm_cost</Code>.
                  The monolith uses <Code>parameters.pcm_cost</Code> to populate this field, which may differ from
                  actual invoice amounts.
                </p>
                <AxisCallout type="alert" hideIcon>
                  <strong>Known gap:</strong> The monolith&apos;s <Code>parameters.pcm_cost</Code> values ($0.625/$0.875)
                  do not match any invoice. Actual rates are $0.63/$0.87. This causes platform-computed PCM costs to differ
                  from invoice-verified totals. The Reports tab uses invoice-verified data for monthly breakdowns.
                </AxisCallout>
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-error-500)' }} />
                  <h3 className="text-sm font-semibold text-content-primary">Price change detection</h3>
                </div>
                <p className="text-sm text-content-secondary">
                  Per-piece rates are calculated daily from <Code>dm_volume_summary</Code> (daily_cost / daily_sends).
                  Rate changes are auto-detected when the delta exceeds $0.005/piece. Each domain&apos;s rollout to new
                  rates is tracked independently, comparing against the most common rate across all domains.
                </p>
              </div>
            </div>
          </Section>

          {/* 4. What each tab shows */}
          <Section title="What each tab shows">
            <div className="space-y-4">
              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AxisTag color="info" size="sm">Operational health</AxisTag>
                </div>
                <MiniTable
                  headers={['Metric', 'Source table', 'Calculation']}
                  rows={[
                    ['Daily sends / deliveries', <Code key="t">rr_daily_metrics</Code>, 'Sum of sends_total, delivered_count per day'],
                    ['On-hold / protected / error', <Code key="t">rr_daily_metrics</Code>, 'Direct column values per domain per day'],
                    ['Active campaigns', <Code key="t">rr_campaign_snapshots</Code>, 'Count of domains with active campaign status'],
                    ['Response rate', <Code key="t">dm_property_conversions</Code>, 'Properties with response / total mailed'],
                    ['Delivery rate', <Code key="t">rr_daily_metrics</Code>, 'delivered_count / sends_total × 100'],
                  ]}
                />
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AxisTag color="info" size="sm">Business results</AxisTag>
                </div>
                <MiniTable
                  headers={['Metric', 'Source table', 'Calculation']}
                  rows={[
                    ['Conversion funnel', <Code key="t">dm_property_conversions</Code>, 'Properties mailed → responded → converted stages'],
                    ['Client performance', <Code key="t">dm_client_funnel</Code>, 'Per-domain totals: sends, cost, mailed, delivered'],
                    ['Geographic breakdown', <Code key="t">dm_property_conversions</Code>, 'Grouped by state/city from property addresses'],
                    ['Timeline events', <Code key="t">dm_property_conversions</Code>, 'Per-property send/response/conversion dates'],
                  ]}
                />
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AxisTag color="info" size="sm">Profitability</AxisTag>
                </div>
                <MiniTable
                  headers={['Metric', 'Source', 'Calculation']}
                  rows={[
                    ['Revenue / PCM cost / margin', <Code key="t">dm_client_funnel</Code>, 'total_cost (revenue) − total_pcm_cost = margin'],
                    ['Per-mail-class margins', <Code key="t">dm_volume_summary</Code>, 'Cumulative cost/sends per mail class'],
                    ['Client margins', <Code key="t">dm_client_funnel</Code>, 'Per-domain: total_cost, total_pcm_cost, margin_pct'],
                    ['Current rates', <Code key="t">dm_volume_summary</Code>, 'Last 7 days: daily_cost / daily_sends per mail class'],
                    ['Price change detection', <Code key="t">dm_volume_summary</Code>, 'Rate delta > $0.005/piece flags a change'],
                    ['Pricing history', 'Invoice PDFs + Aurora', 'Static era rates + live rate trend from dm_volume_summary'],
                    ['PCM orders / balance', 'PCM API', '/order total count, /integration/balance'],
                  ]}
                />
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AxisTag color="info" size="sm">Reports</AxisTag>
                </div>
                <MiniTable
                  headers={['Section', 'Source', 'Note']}
                  rows={[
                    ['Executive summary', <Code key="t">dm_client_funnel</Code>, 'Live aggregate query — totals may differ from invoice-verified amounts'],
                    ['Data quality', 'PCM API + Aurora', 'PCM /order count vs Aurora cumulative sends'],
                    ['Pricing history', 'Invoice PDFs (static)', 'Verified from 264 invoices, 3 pricing eras'],
                    ['Monthly PCM costs', 'Invoice PDFs (static)', 'Verified month-by-month breakdown — dm_volume_summary lacks historical data'],
                    ['Monthly revenue', <Code key="t">dm_property_conversions</Code>, 'Aggregated by month from individual property records'],
                    ['Per-client profitability', <Code key="t">dm_client_funnel</Code>, 'Live per-domain totals from latest snapshot'],
                  ]}
                />
              </div>
            </div>
          </Section>

          {/* 5. Data freshness */}
          <Section title="Data freshness & caching">
            <MiniTable
              headers={['Source', 'Sync frequency', 'Cache TTL', 'Latency']}
              rows={[
                ['Aurora (dm_client_funnel)', 'Hourly sync from monolith', '5 minutes', '~1 hour behind real-time'],
                ['Aurora (rr_daily_metrics)', 'Hourly sync from monolith', '5 minutes', '~1 hour behind real-time'],
                ['Aurora (dm_volume_summary)', 'Hourly sync from monolith', '5 minutes', '~1 hour behind real-time'],
                ['PCM API (/order, /balance)', 'On-demand per request', '5 minutes', 'Real-time (API rate limited)'],
                ['Invoice-verified data', 'Static (updated manually)', 'N/A', 'Snapshot as of last invoice analysis'],
              ]}
            />
            <div className="mt-3">
              <AxisCallout type="info" hideIcon>
                All API responses are cached for <strong>5 minutes</strong> in-memory to reduce database load.
                Test domains (<Code>8020rei_demo</Code>, <Code>sandbox_8020rei_com</Code>, etc.) are excluded
                from all queries.
              </AxisCallout>
            </div>
          </Section>

          {/* 6. Test domain exclusions */}
          <Section title="Test domain exclusions">
            <p className="text-sm text-content-secondary mb-3">
              The following domains are automatically excluded from all DM Campaign queries to prevent
              test data from polluting production metrics:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                '8020rei_demo',
                '8020rei_migracion_test',
                '_test_debug',
                '_test_debug3',
                'supertest_8020rei_com',
                'sandbox_8020rei_com',
              ].map(d => (
                <AxisTag key={d} color="neutral" size="sm" variant="outlined">{d}</AxisTag>
              ))}
            </div>
          </Section>

          {/* 7. Known limitations */}
          <Section title="Known limitations">
            <div className="space-y-3">
              <AxisCallout type="alert" title="PCM cost accuracy">
                The monolith&apos;s <Code>parameters.pcm_cost</Code> uses $0.625 (Standard) and $0.875 (First Class),
                which don&apos;t match any actual invoice. Real rates are $0.63/$0.87 (current era). This causes
                <Code>total_pcm_cost</Code> in Aurora to underreport actual costs for some clients. Two clients
                (Central City Solutions, Reno Area Home Buyers) have $0 PCM cost in Aurora entirely.
              </AxisCallout>
              <AxisCallout type="alert" title="Historical daily data">
                The <Code>dm_volume_summary</Code> table only contains recent daily records. Historical
                month-by-month breakdowns (pre-April 2026) rely on verified invoice data rather than live queries.
                Future months will be captured in real-time as the table accumulates daily records.
              </AxisCallout>
              <AxisCallout type="info" title="PCM API scope">
                The PCM API does not provide per-domain order breakdowns — it only returns a global total order count.
                Per-client reconciliation relies entirely on Aurora&apos;s per-domain tracking. Volume deltas between
                PCM and Aurora represent orders still in the PCM processing pipeline, not data errors.
              </AxisCallout>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-stroke mb-8">
          <p className="text-xs text-content-tertiary">
            Last reviewed: April 16, 2026. For questions about data methodology, contact the Metrics team.
          </p>
        </div>
      </div>
    </div>
  );
});
