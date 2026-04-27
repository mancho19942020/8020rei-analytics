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
  lines.push('Third-party mailing vendor. Provides real-time order count, account balance, and design catalog. Accessed via authenticated REST API.');
  lines.push('');
  lines.push('| Endpoint | Data provided | Used by |');
  lines.push('|----------|---------------|---------|');
  lines.push('| `/auth/login` | Bearer token (55-min cache) | Auth only |');
  lines.push('| `/order` | Paginated orders with status + `extRefNbr` (domain) | Overview, Operational health, Profitability, Reports |');
  lines.push('| `/integration/balance` | `moneyOnAccount` current account balance | Overview, Profitability |');
  lines.push('| `/design` | Paginated design catalog (28 designs) | Profitability → Template catalog |');
  lines.push('');
  lines.push('> **Read-only policy:** The PCM API integration is strictly read-only. Only GET requests (plus `POST /auth/login` for token exchange) are allowed. No data is ever written back to PostcardMania. Verified in `src/lib/pcm-client.ts`.');
  lines.push('');
  lines.push('> **Known limitation:** `/order` does not support server-side `filterStatus` or per-domain filtering. To compute active piece counts or per-domain breakdowns, the full order list is paginated client-side (~25K orders, ~90s cold). Results are cached in Aurora via `dm_overview_cache` and refreshed by a cron scheduled every 30 minutes (GitHub Actions; best-effort — actual delivery can lag during peak hours).');
  lines.push('');

  // Source 2: Aurora
  lines.push('## 2. Aurora PostgreSQL (Internal database)');
  lines.push('');
  lines.push('AWS Aurora PostgreSQL instance. Populated by the 8020REI monolith via hourly sync jobs. Accessed via RDS Data API.');
  lines.push('');
  lines.push('| Table | Description | Key columns | Used by |');
  lines.push('|-------|-------------|-------------|---------|');
  lines.push('| `dm_client_funnel` | Cumulative per-client totals (latest snapshot per domain) | total_sends, total_cost, total_pcm_cost, margin, margin_pct | All tabs |');
  lines.push('| `dm_volume_summary` | Daily volume per domain per mail class + cumulative columns | daily_sends, daily_cost, daily_pcm_cost, daily_margin, mail_class, cumulative_* | Profitability (period + mail-class widgets) |');
  lines.push('| `dm_property_conversions` | Per-property records with conversion timestamps | domain, first_sent_date, became_lead_at, became_appointment_at, became_deal_at, total_cost, deal_revenue | Business results, Reports monthly revenue |');
  lines.push('| `rr_daily_metrics` | Daily operational metrics per domain (15-day rolling window) | sends_total, delivered_count, on_hold | Operational health period widgets |');
  lines.push('| `rr_campaign_snapshots` | Per-campaign status snapshots | domain, campaign_id, status, last_sent_date | Operational health "Is it running?", Overview active-campaigns card |');
  lines.push('| `rr_pcm_alignment` | Per-domain Aurora↔PCM reconciliation signals | back_office_sync_gap, stale_sent_count, orphaned_orders_count | Operational health "Is it aligned?" + Postal performance |');
  lines.push('| `dm_overview_cache` | PCM-paginated payloads (headline, send-trend, balance-flow) | cache_key, payload (JSONB), computed_at | Overview tab + Operational health "Is it working?" |');
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
  lines.push('### Dual-source principle');
  lines.push('');
  lines.push('Every volume / cost / revenue metric is cross-checked against **both PCM and Aurora**. When the two disagree beyond tolerance, the delta is displayed visibly — never hidden. The authoritative source per metric class is:');
  lines.push('');
  lines.push('| Metric class | Authoritative source | Why |');
  lines.push('|---|---|---|');
  lines.push('| Lifetime pieces (hero) | PCM `/order` (paginated, cached in `dm_overview_cache`) | Captures in-pipeline pieces Aurora misses |');
  lines.push('| Lifetime revenue / PCM cost / margin | `dm_client_funnel` latest-per-domain | Pre-computed; same SQL across Overview, BR, Profitability, Reports |');
  lines.push('| Per-property conversions + deal revenue | `dm_property_conversions` with `> first_sent_date` filter | Avoids convenience-column data quality issues |');
  lines.push('| Campaign count / status | `rr_campaign_snapshots` | 8020REI abstraction; PCM has no campaign primitive |');
  lines.push('');
  lines.push('### Cross-tab equality (guaranteed by shared SQL / shared cache)');
  lines.push('');
  lines.push('| Metric | Equal across | Mechanism |');
  lines.push('|---|---|---|');
  lines.push('| Lifetime mail pieces | Overview headline · OH "Is it working?" | Same `dm_overview_cache.headline` row |');
  lines.push('| Active / total campaigns | Overview · OH "Is it running?" · BR reconciliation header | Same `rr_campaign_snapshots` SQL |');
  lines.push('| Lifetime revenue / PCM cost / margin | Overview company margin · Profitability Margin summary · Reports executive summary · BR funnel Mailing spend | Same `dm_client_funnel` latest-per-domain SQL |');
  lines.push('| Delivery rate | OH "Is it working?" · Profitability | Same SQL against `dm_client_funnel` |');
  lines.push('| Per-client margin | Profitability Client margins · Reports Per-client profitability | Same `dm_client_funnel` latest-per-domain SQL |');
  lines.push('');
  lines.push('### Volume reconciliation');
  lines.push('');
  lines.push('PCM total active orders (non-canceled, excluding test domains) are compared against Aurora\'s cumulative send count. Small deltas are expected from orders still in the PCM processing pipeline.');
  lines.push('');
  lines.push('```');
  lines.push('Match rate = min(PCM orders, Aurora sends) / max(PCM orders, Aurora sends) × 100');
  lines.push('```');
  lines.push('');
  lines.push('### Terminology — "Sent" vs "Mailed"');
  lines.push('');
  lines.push('These are **different metrics** by design, not inconsistencies:');
  lines.push('- **Sent / pieces** — individual mail pieces (a single property may receive several pieces over time). Source: `dm_client_funnel.total_sends`.');
  lines.push('- **Mailed** — unique properties that received at least one piece. Source: `dm_property_conversions` (distinct property count).');
  lines.push('');
  lines.push('### Revenue verification');
  lines.push('');
  lines.push('Customer revenue (what 8020REI charges its clients) lives in `dm_client_funnel.total_cost`. It is **populated live by the monolith** — as customer prices change on the platform, this column reflects what was actually charged, and the Profitability/Overview/Reports margin numbers update automatically.');
  lines.push('');
  lines.push('### PCM cost validation');
  lines.push('');
  lines.push('PCM cost per piece is populated by the monolith via `parameters.pcm_cost`, which drives `dm_client_funnel.total_pcm_cost`. This is not invoice-verified — it is the monolith\'s understanding of the PCM rate at send time.');
  lines.push('');
  lines.push('> **Known data issue:** `parameters.pcm_cost` uses $0.625 (Standard) / $0.875 (First class), neither of which matches any PCM invoice. Actual invoice-verified rates are $0.63/$0.87. Two clients (Central City Solutions, Reno Area Home Buyers) have `$0` PCM cost in Aurora entirely. Until this is fixed in the monolith, Margin summary / Client margins carry a systematic error vs. invoice-verified totals. The Reports tab uses the invoice-verified monthly breakdown as a secondary reconciliation.');
  lines.push('');
  lines.push('### Price change detection');
  lines.push('');
  lines.push('Per-piece rates are calculated daily from `dm_volume_summary` (`daily_cost / daily_sends`) per mail class. Rate changes are auto-detected when the day-over-day delta exceeds $0.005/piece. Per-domain rollout status is derived from the most recent rate per domain — a domain on the old rate is flagged "pending migration."');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Per-tab mapping
  lines.push('## What each tab shows');
  lines.push('');

  lines.push('### Overview');
  lines.push('');
  lines.push('| Metric | Source | Calculation |');
  lines.push('|--------|-------|-------------|');
  lines.push('| Active clients | `rr_campaign_snapshots` | Distinct domains with ≥1 `status=active` campaign (latest snapshot per campaign) |');
  lines.push('| Lifetime pieces (hero) | PCM `/order` via `dm_overview_cache` | Paginated non-canceled orders, excluding test domains |');
  lines.push('| Lifetime pieces (Aurora delta) | `dm_client_funnel.total_sends` | Sum of latest-per-domain snapshots |');
  lines.push('| Company margin | `dm_client_funnel` − PCM test-order cost | `SUM(margin) − SUM(pcm_cost of test-domain orders from PCM)` |');
  lines.push('| Active campaigns | `rr_campaign_snapshots` | `status=active` count, latest snapshot per campaign |');
  lines.push('| Send volume trend (14mo) | PCM `/order` by `orderDate` | Grouped by month, FC vs Std split |');
  lines.push('| Internal test cost | PCM `/order` filtered to test domains | Era-rate × piece count per domain |');
  lines.push('| Balance reconciliation | PCM `/integration/balance` + daily cost | Running balance vs cumulative cost |');
  lines.push('');

  lines.push('### Operational health');
  lines.push('');
  lines.push('| Metric | Source table | Calculation |');
  lines.push('|--------|-------------|-------------|');
  lines.push('| Is it running? (active / total campaigns) | `rr_campaign_snapshots` | Latest snapshot per campaign, `status=active` count |');
  lines.push('| Is it working? (lifetime pieces, hero) | PCM via `dm_overview_cache.headline` | Same cache row as Overview — bit-for-bit match |');
  lines.push('| Is it working? (delivery rate) | `dm_client_funnel` | SUM(total_delivered) / SUM(total_sends), latest-per-domain |');
  lines.push('| Is it aligned? | `rr_pcm_alignment` | Sync gap / stale sent / orphaned orders, thresholds 50/10/5 |');
  lines.push('| Postal performance | `rr_pcm_alignment` + PCM | Delivery lag + undeliverable rate |');
  lines.push('| Q2 volume goal + Top contributors | PCM `/order` via shared pagination cache | April cumulative per domain |');
  lines.push('| Send volume trend (period) | `rr_daily_metrics` | Daily sends/delivered — 15-day rolling window |');
  lines.push('| Status breakdown | `rr_daily_metrics` | Mail-piece status by period |');
  lines.push('');

  lines.push('### Business results');
  lines.push('');
  lines.push('All widgets are **cohort-aligned**: they filter by `first_sent_date` falling in the selected window, and answer "what happened to this cohort?"');
  lines.push('');
  lines.push('| Metric | Source table | Calculation |');
  lines.push('|--------|-------------|-------------|');
  lines.push('| Conversion funnel | `dm_property_conversions` | Cohort → leads / appts / contracts / deals (`became_X_at IS NOT NULL AND > first_sent_date`) |');
  lines.push('| Mailing spend (hero) | `dm_client_funnel.total_cost` | Same SQL as Profitability Revenue — **bit-for-bit match** |');
  lines.push('| Deal revenue (hero) | `dm_property_conversions.deal_revenue` | Client ROI, not 8020REI revenue |');
  lines.push('| Client performance | `dm_client_funnel` (latest-per-domain) + `dm_property_conversions` | Per-client, cohort-filtered — row count reconciled with Overview active clients |');
  lines.push('| Conversion activity (daily) | `dm_property_conversions` | GROUP BY DATE(became_X_at), cohort-filtered — sum matches funnel |');
  lines.push('| Mailing spend vs. deal revenue | `dm_property_conversions` | Spend by `first_sent_date`, revenue by `became_deal_at` — same cohort |');
  lines.push('| Geographic breakdown | `dm_property_conversions` | GROUP BY state/county, cohort-filtered |');
  lines.push('| Template leaderboard | `dm_property_conversions` GROUP BY template | Avoids convenience columns; client-ROI framing |');
  lines.push('');

  lines.push('### Profitability');
  lines.push('');
  lines.push('| Metric | Source | Calculation |');
  lines.push('|--------|-------|-------------|');
  lines.push('| Margin summary (lifetime) | `dm_client_funnel` latest-per-domain | `total_cost` − `total_pcm_cost` = `margin` — same SQL as Overview company margin |');
  lines.push('| Period summary (date-range) | `dm_volume_summary` daily totals | `SUM(daily_cost) − SUM(daily_pcm_cost)` within window. **Note:** different source than lifetime — see Known limitations |');
  lines.push('| Client margins | `dm_client_funnel` latest-per-domain | Per-domain `margin_pct` |');
  lines.push('| Per-mail-class margins | `dm_volume_summary.cumulative_*` | Grouped by `mail_class`. **Note:** different source than lifetime — see Known limitations |');
  lines.push('| Current rates | `dm_volume_summary` last 7 days | `SUM(daily_cost) / SUM(daily_sends)` per mail class |');
  lines.push('| Pricing history (eras) | Invoice PDFs (static) | 264 invoices verified manually |');
  lines.push('| Price change detection | `dm_volume_summary` | Day-over-day rate delta > $0.005/piece |');
  lines.push('| PCM orders / balance / designs | PCM API | Counts + balance |');
  lines.push('');

  lines.push('### Reports');
  lines.push('');
  lines.push('| Section | Source | Note |');
  lines.push('|---------|-------|------|');
  lines.push('| Executive summary | `dm_client_funnel` | **Same SQL as Profitability Margin summary** — bit-for-bit match |');
  lines.push('| Data quality | PCM `/order` + `dm_client_funnel` | PCM total vs Aurora total + per-client Aurora sends |');
  lines.push('| Pricing history | Invoice PDFs (static) | Verified from 264 invoices, 3 PCM eras + 2 customer eras |');
  lines.push('| Monthly PCM costs | Invoice PDFs (static) | Verified month-by-month — not queried live |');
  lines.push('| Monthly revenue | `dm_property_conversions` aggregated | Invoice-derived static snapshot (not live) |');
  lines.push('| Per-client profitability | `dm_client_funnel` latest-per-domain | **Same SQL as Profitability Client margins** — bit-for-bit match |');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Freshness
  lines.push('## Data freshness & caching');
  lines.push('');
  lines.push('| Source | Sync frequency | Cache TTL | Latency |');
  lines.push('|--------|----------------|-----------|---------|');
  lines.push('| Aurora (`dm_client_funnel`, `rr_daily_metrics`, `dm_volume_summary`) | Hourly from monolith (best-effort) | 5 min in-memory per API route | ~1 hour target |');
  lines.push('| Aurora (`dm_overview_cache`) | Cron scheduled every 30 min by GitHub Actions (best-effort — can lag) | Read-through | ~30 min target |');
  lines.push('| PCM `/order` paginated pull | On-demand (~90s cold) + 20-min in-memory TTL | Reused by OH, Overview, Reports | Real-time when warm |');
  lines.push('| PCM `/integration/balance` + `/design` | On-demand per request | 5 min | Real-time |');
  lines.push('| Invoice-verified data (static) | Manual update after invoice analysis | N/A | Point-in-time snapshot |');
  lines.push('');

  // Test domains
  lines.push('## Test domain exclusions');
  lines.push('');
  lines.push('All DM Campaign queries exclude the following domains from client-facing metrics. The canonical list lives in `src/lib/domain-filter.ts` — any change applies everywhere simultaneously.');
  lines.push('');
  lines.push('- `8020rei_demo`');
  lines.push('- `8020rei_migracion_test`');
  lines.push('- `_test_debug`');
  lines.push('- `_test_debug3`');
  lines.push('- `supertest_8020rei_com`');
  lines.push('- `sandbox_8020rei_com`');
  lines.push('- `qapre_8020rei_com`');
  lines.push('- `testing5_8020rei_com`');
  lines.push('- `showcaseproductsecomllc_8020rei_com`');
  lines.push('');
  lines.push('> Internal test sends are excluded from revenue / adoption / conversion / campaign metrics, but they **do** incur real PCM cost and appear on Overview → Internal test cost so the P&L stays honest.');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Known limitations
  lines.push('## Known limitations');
  lines.push('');
  lines.push('1. **PCM cost accuracy (monolith bug).** `parameters.pcm_cost` = $0.625/$0.875 doesn\'t match any invoice (real: $0.63/$0.87). Two clients have `$0` PCM cost in Aurora. Margin summary / Client margins carry a systematic error until the monolith field is corrected.');
  lines.push('');
  lines.push('2. **Profitability period vs lifetime use different source tables.** Lifetime reads `dm_client_funnel`; Period reads `dm_volume_summary`. They may disagree for the same window. Reconciliation pending.');
  lines.push('');
  lines.push('3. **Pricing history is partly static.** PCM eras are verified from 264 invoices (static, OK). Customer pricing eras in the Reports tab are **hardcoded** and require manual updates whenever 8020REI changes platform pricing — new customer rates will not appear until the eras array is updated.');
  lines.push('');
  lines.push('4. **`rr_daily_metrics` holds only ~15 days.** OH period widgets are bounded to this window. Lifetime views use PCM via `dm_overview_cache` instead.');
  lines.push('');
  lines.push('5. **`dm_client_funnel` is a rolling snapshot, not a ledger.** ~11 days of coverage, each row a cumulative total. Lifetime totals are correct; a historical per-month margin trend cannot be rebuilt from this table alone.');
  lines.push('');
  lines.push('6. **PCM API scope.** No per-domain filtering on `/order`; no server-side status filter. Per-client reconciliation is Aurora-only. Domain-level PCM totals require full pagination + client-side grouping.');
  lines.push('');
  lines.push('7. **Reports monthly tables are static.** `monthlyPcmCosts` and `monthlyRevenue` are hardcoded in `dm-reports/route.ts`. They must be extended manually each month until a live query replaces them.');
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
                description="Third-party mailing vendor. Provides real-time order count, account balance, and design catalog. Accessed via authenticated REST API."
                color="info"
                details={
                  <div>
                    <MiniTable
                      headers={['Endpoint', 'Data provided', 'Used by']}
                      rows={[
                        [<Code key="e">/auth/login</Code>, 'Bearer token (55-min cache)', 'Auth only'],
                        [<Code key="e">/order</Code>, 'Paginated orders with status + extRefNbr (domain)', 'Overview, OH, Profitability, Reports'],
                        [<Code key="e">/integration/balance</Code>, 'moneyOnAccount (current account balance)', 'Overview, Profitability'],
                        [<Code key="e">/design</Code>, 'Design catalog (28 designs)', 'Profitability → Template catalog'],
                      ]}
                    />
                    <div className="mt-3 space-y-2">
                      <AxisCallout type="info" hideIcon>
                        <strong>Read-only policy:</strong> Only GET requests are allowed (plus <Code>POST /auth/login</Code> for token exchange).
                        No data is ever written back to PostcardMania. Enforced in <Code>src/lib/pcm-client.ts</Code>.
                      </AxisCallout>
                      <AxisCallout type="alert" hideIcon>
                        <strong>Known limitation:</strong> <Code>/order</Code> does not support server-side <Code>filterStatus</Code> or per-domain filtering.
                        Active-piece counts and per-domain breakdowns require full pagination (~25K orders, ~90s cold).
                        Results are cached in Aurora via <Code>dm_overview_cache</Code> and refreshed by a cron scheduled every 30 minutes (GitHub Actions; best-effort — actual delivery can lag during peak hours).
                      </AxisCallout>
                    </div>
                  </div>
                }
              />

              <SourceCard
                name="Aurora PostgreSQL"
                type="Internal database"
                description="AWS Aurora PostgreSQL instance. Populated by the 8020REI monolith via hourly sync jobs. Accessed via RDS Data API."
                color="success"
                details={
                  <MiniTable
                    headers={['Table', 'Description', 'Key columns', 'Used by']}
                    rows={[
                      [
                        <Code key="t">dm_client_funnel</Code>,
                        'Cumulative per-client totals (latest snapshot per domain)',
                        'total_sends, total_cost, total_pcm_cost, margin, margin_pct',
                        'All tabs',
                      ],
                      [
                        <Code key="t">dm_volume_summary</Code>,
                        'Daily volume per domain per mail class (+ cumulative_* columns)',
                        'daily_sends, daily_cost, daily_pcm_cost, daily_margin, mail_class',
                        'Profitability (period + mail-class)',
                      ],
                      [
                        <Code key="t">dm_property_conversions</Code>,
                        'Per-property records with conversion timestamps',
                        'first_sent_date, became_lead_at, became_deal_at, total_cost, deal_revenue',
                        'Business results, Reports',
                      ],
                      [
                        <Code key="t">rr_daily_metrics</Code>,
                        'Daily operational metrics (15-day rolling window)',
                        'sends_total, delivered_count, on_hold',
                        'OH period widgets',
                      ],
                      [
                        <Code key="t">rr_campaign_snapshots</Code>,
                        'Per-campaign status snapshots',
                        'domain, campaign_id, status, last_sent_date',
                        'OH "Is it running?" · Overview active campaigns',
                      ],
                      [
                        <Code key="t">rr_pcm_alignment</Code>,
                        'Per-domain Aurora↔PCM reconciliation signals',
                        'back_office_sync_gap, stale_sent_count, orphaned_orders_count',
                        'OH "Is it aligned?" · Postal performance',
                      ],
                      [
                        <Code key="t">dm_overview_cache</Code>,
                        'PCM-paginated payloads (headline, send-trend, balance-flow)',
                        'cache_key, payload (JSONB), computed_at',
                        'Overview · OH "Is it working?"',
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
                  <h3 className="text-sm font-semibold text-content-primary">Dual-source principle</h3>
                </div>
                <p className="text-sm text-content-secondary mb-2">
                  Every volume / cost / revenue metric is cross-checked against <strong>both PCM and Aurora</strong>.
                  When the two disagree beyond tolerance, the delta is displayed visibly — never hidden.
                </p>
                <MiniTable
                  headers={['Metric class', 'Authoritative source', 'Why']}
                  rows={[
                    ['Lifetime pieces (hero)', <Code key="1">dm_overview_cache</Code>, 'Sourced from PCM pagination; captures in-pipeline pieces Aurora misses'],
                    ['Lifetime revenue / PCM cost / margin', <Code key="2">dm_client_funnel</Code>, 'Pre-computed; same SQL across Overview, BR, PP, Reports'],
                    ['Per-property conversions', <Code key="3">dm_property_conversions</Code>, 'With > first_sent_date filter; avoids convenience-column issues'],
                    ['Campaign count / status', <Code key="4">rr_campaign_snapshots</Code>, '8020REI abstraction; PCM has no campaign primitive'],
                  ]}
                />
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-info-500)' }} />
                  <h3 className="text-sm font-semibold text-content-primary">Cross-tab equality (by construction)</h3>
                </div>
                <p className="text-sm text-content-secondary mb-2">
                  These metrics are guaranteed equal across tabs because they share SQL or share a cache key — not by coincidence.
                </p>
                <MiniTable
                  headers={['Metric', 'Equal across', 'Mechanism']}
                  rows={[
                    ['Lifetime mail pieces', 'Overview headline · OH "Is it working?"', 'Same dm_overview_cache.headline row'],
                    ['Active / total campaigns', 'Overview · OH "Is it running?" · BR reconciliation header', 'Same rr_campaign_snapshots SQL'],
                    ['Lifetime revenue / PCM cost / margin', 'Overview company margin · PP Margin summary · Reports executive · BR Mailing spend', 'Same dm_client_funnel latest-per-domain SQL'],
                    ['Per-client margin', 'PP Client margins · Reports Per-client profitability', 'Same SQL, sorted by margin_pct'],
                  ]}
                />
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success-500)' }} />
                  <h3 className="text-sm font-semibold text-content-primary">Terminology — &ldquo;Sent&rdquo; vs &ldquo;Mailed&rdquo;</h3>
                </div>
                <p className="text-sm text-content-secondary">
                  These are <strong>different metrics by design</strong>, not inconsistencies.
                  <strong> Sent / pieces</strong> = individual mail pieces (<Code>dm_client_funnel.total_sends</Code>; one property may receive several pieces over time).
                  <strong> Mailed</strong> = unique properties that received ≥1 piece (distinct count in <Code>dm_property_conversions</Code>).
                  Every widget that uses either term has a tooltip explaining which one it counts.
                </p>
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success-500)' }} />
                  <h3 className="text-sm font-semibold text-content-primary">Revenue verification</h3>
                </div>
                <p className="text-sm text-content-secondary">
                  Customer revenue (what 8020REI charges clients) lives in <Code>dm_client_funnel.total_cost</Code>.
                  It is <strong>populated live by the monolith</strong> — as customer prices change on the platform,
                  this column reflects what was actually charged, and the Profitability / Overview / Reports margin numbers update automatically.
                </p>
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-alert-500)' }} />
                  <h3 className="text-sm font-semibold text-content-primary">PCM cost validation</h3>
                </div>
                <p className="text-sm text-content-secondary mb-2">
                  PCM cost per piece is populated by the monolith via <Code>parameters.pcm_cost</Code>, which drives{' '}
                  <Code>dm_client_funnel.total_pcm_cost</Code>. This is not invoice-verified — it is the monolith&apos;s
                  understanding of the PCM rate at send time.
                </p>
                <AxisCallout type="alert" hideIcon>
                  <strong>Known data issue:</strong> <Code>parameters.pcm_cost</Code> uses $0.625 (Std) / $0.875 (FC),
                  neither of which matches any PCM invoice (actual: $0.63/$0.87). Two clients
                  (Central City Solutions, Reno Area Home Buyers) have <Code>$0</Code> PCM cost in Aurora entirely.
                  Until this is fixed in the monolith, Margin summary / Client margins carry a systematic error vs. invoice-verified totals.
                  The Reports tab uses the invoice-verified monthly breakdown as a secondary reconciliation.
                </AxisCallout>
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-error-500)' }} />
                  <h3 className="text-sm font-semibold text-content-primary">Price change detection</h3>
                </div>
                <p className="text-sm text-content-secondary">
                  Per-piece rates are calculated daily from <Code>dm_volume_summary</Code> (<Code>daily_cost / daily_sends</Code>) per mail class.
                  Rate changes are auto-detected when the day-over-day delta exceeds $0.005/piece.
                  Per-domain rollout status is derived from the most recent rate per domain — a domain on the old rate is flagged &ldquo;pending migration.&rdquo;
                </p>
              </div>
            </div>
          </Section>

          {/* 4. What each tab shows */}
          <Section title="What each tab shows">
            <div className="space-y-4">
              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AxisTag color="info" size="sm">Overview</AxisTag>
                </div>
                <MiniTable
                  headers={['Metric', 'Source', 'Calculation']}
                  rows={[
                    ['Active clients', <Code key="t">rr_campaign_snapshots</Code>, 'Distinct domains with ≥1 status=active campaign'],
                    ['Lifetime pieces (hero)', <>PCM via <Code>dm_overview_cache</Code></>, 'Paginated non-canceled orders, excl. test domains'],
                    ['Lifetime pieces (Aurora delta)', <Code key="t">dm_client_funnel.total_sends</Code>, 'Shown alongside PCM; delta surfaced visibly'],
                    ['Company margin', <>Aurora − PCM test cost</>, 'SUM(margin) − era-rate × test-domain pieces'],
                    ['Active campaigns', <Code key="t">rr_campaign_snapshots</Code>, 'status=active latest-per-campaign'],
                    ['Send volume trend (14mo)', 'PCM /order by orderDate', 'Monthly buckets, FC vs Std split'],
                    ['Internal test cost', 'PCM /order filtered to test domains', 'Era-rate × piece count per domain'],
                    ['Balance reconciliation', 'PCM /integration/balance + daily cost', 'Running balance vs cumulative cost'],
                  ]}
                />
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AxisTag color="info" size="sm">Operational health</AxisTag>
                </div>
                <MiniTable
                  headers={['Metric', 'Source', 'Calculation']}
                  rows={[
                    ['Is it running? (active / total campaigns)', <Code key="t">rr_campaign_snapshots</Code>, 'Latest snapshot per campaign, status=active count'],
                    ['Is it working? (lifetime pieces, hero)', <>PCM via <Code>dm_overview_cache.headline</Code></>, 'Same cache row as Overview — bit-for-bit match'],
                    ['Is it working? (delivery rate)', <Code key="t">dm_client_funnel</Code>, 'SUM(total_delivered) / SUM(total_sends), latest-per-domain'],
                    ['Is it aligned?', <Code key="t">rr_pcm_alignment</Code>, 'Sync gap / stale sent / orphaned, thresholds 50/10/5'],
                    ['Postal performance', <><Code>rr_pcm_alignment</Code> + PCM</>, 'Delivery lag + undeliverable rate'],
                    ['Q2 goal · Top contributors', 'PCM /order (shared pagination cache)', 'April cumulative per domain'],
                    ['Send volume trend (period)', <Code key="t">rr_daily_metrics</Code>, 'Daily sends/delivered — 15-day rolling window'],
                    ['Status breakdown', <Code key="t">rr_daily_metrics</Code>, 'Mail-piece status by period'],
                  ]}
                />
              </div>

              <div className="border border-stroke rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AxisTag color="info" size="sm">Business results</AxisTag>
                </div>
                <p className="text-xs text-content-tertiary mb-2">
                  All widgets are <strong>cohort-aligned</strong>: they filter by <Code>first_sent_date</Code> in the selected window
                  and answer &ldquo;what happened to this cohort?&rdquo; Sum of daily bars = funnel totals by construction.
                </p>
                <MiniTable
                  headers={['Metric', 'Source', 'Calculation']}
                  rows={[
                    ['Conversion funnel', <Code key="t">dm_property_conversions</Code>, 'Cohort → leads / appts / contracts / deals'],
                    ['Mailing spend (hero)', <Code key="t">dm_client_funnel.total_cost</Code>, 'Same SQL as PP Revenue — bit-for-bit match'],
                    ['Deal revenue (hero)', <Code key="t">dm_property_conversions.deal_revenue</Code>, 'Client ROI, not 8020REI revenue'],
                    ['Client performance', <><Code>dm_client_funnel</Code> latest-per-domain + <Code>dm_property_conversions</Code></>, 'Per-client cohort view, reconciles to Overview active clients'],
                    ['Conversion activity', <Code key="t">dm_property_conversions</Code>, 'GROUP BY DATE(became_X_at), cohort-filtered'],
                    ['Mailing spend vs. deal revenue', <Code key="t">dm_property_conversions</Code>, 'Spend by first_sent_date, revenue by became_deal_at'],
                    ['Geographic breakdown', <Code key="t">dm_property_conversions</Code>, 'GROUP BY state/county, cohort-filtered'],
                    ['Template leaderboard', <Code key="t">dm_property_conversions</Code>, 'GROUP BY template; avoids convenience columns'],
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
                    ['Margin summary (lifetime)', <Code key="t">dm_client_funnel</Code>, 'latest-per-domain — same SQL as Overview company margin'],
                    ['Period summary (date-range)', <Code key="t">dm_volume_summary</Code>, 'SUM(daily_cost − daily_pcm_cost) within window — see Known limitations'],
                    ['Client margins', <Code key="t">dm_client_funnel</Code>, 'latest-per-domain, per-domain margin_pct'],
                    ['Per-mail-class margins', <Code key="t">dm_volume_summary.cumulative_*</Code>, 'GROUP BY mail_class — see Known limitations'],
                    ['Current rates', <Code key="t">dm_volume_summary</Code>, 'Last 7 days, SUM(daily_cost) / SUM(daily_sends) per mail class'],
                    ['Pricing history (PCM eras)', 'Invoice PDFs (static)', '264 invoices verified manually'],
                    ['Price change detection', <Code key="t">dm_volume_summary</Code>, 'Day-over-day rate delta > $0.005/piece'],
                    ['PCM orders / balance / designs', 'PCM API', 'Counts + balance'],
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
                    ['Executive summary', <Code key="t">dm_client_funnel</Code>, 'Same SQL as PP Margin summary — bit-for-bit match'],
                    ['Data quality', <>PCM /order + <Code>dm_client_funnel</Code></>, 'PCM total vs Aurora total + per-client Aurora sends'],
                    ['Pricing history', 'Invoice PDFs (static)', '3 PCM eras + customer eras (requires manual update)'],
                    ['Monthly PCM costs', 'Invoice PDFs (static)', 'Verified month-by-month — see Known limitations'],
                    ['Monthly revenue', 'Static snapshot', 'Derived from dm_property_conversions historically'],
                    ['Per-client profitability', <Code key="t">dm_client_funnel</Code>, 'Same SQL as PP Client margins — bit-for-bit match'],
                  ]}
                />
              </div>
            </div>
          </Section>

          {/* 5. Data freshness */}
          <Section title="Data freshness & caching">
            <MiniTable
              headers={['Source', 'Sync frequency', 'Cache', 'Latency']}
              rows={[
                [<><Code>dm_client_funnel</Code>, <Code>rr_daily_metrics</Code>, <Code>dm_volume_summary</Code></>, 'Hourly from monolith (best-effort)', '5 min in-memory per API route', '~1 hour target'],
                [<Code key="t">dm_overview_cache</Code>, 'Cron scheduled every 30 min (best-effort — can lag)', 'Read-through', '~30 min target'],
                ['PCM /order paginated pull', 'On-demand (~90s cold) + 20-min TTL', 'Reused by OH, Overview, Reports', 'Real-time when warm'],
                ['PCM /integration/balance + /design', 'On-demand per request', '5 min', 'Real-time'],
                ['Invoice-verified data', 'Manual update after invoice analysis', 'N/A', 'Point-in-time snapshot'],
              ]}
            />
            <div className="mt-3">
              <AxisCallout type="info" hideIcon>
                Cold-start Overview requests fall back to live PCM pagination only if the cache miss also coincides with an empty Aurora cache row.
                The 30-min cron keeps <Code>dm_overview_cache</Code> fresh across all Cloud Run replicas.
              </AxisCallout>
            </div>
          </Section>

          {/* 6. Test domain exclusions */}
          <Section title="Test domain exclusions">
            <p className="text-sm text-content-secondary mb-3">
              All DM Campaign queries exclude the following domains from client-facing metrics.
              The canonical list lives in <Code>src/lib/domain-filter.ts</Code> — any change applies everywhere simultaneously.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                '8020rei_demo',
                '8020rei_migracion_test',
                '_test_debug',
                '_test_debug3',
                'supertest_8020rei_com',
                'sandbox_8020rei_com',
                'qapre_8020rei_com',
                'testing5_8020rei_com',
                'showcaseproductsecomllc_8020rei_com',
              ].map(d => (
                <AxisTag key={d} color="neutral" size="sm" variant="outlined">{d}</AxisTag>
              ))}
            </div>
            <AxisCallout type="info" hideIcon>
              Internal test sends are excluded from revenue / adoption / conversion / campaign metrics,
              but they <strong>do</strong> incur real PCM cost and appear on Overview → Internal test cost so the P&amp;L stays honest.
            </AxisCallout>
          </Section>

          {/* 7. Known limitations */}
          <Section title="Known limitations">
            <div className="space-y-3">
              <AxisCallout type="alert" title="PCM cost accuracy (monolith bug)">
                <Code>parameters.pcm_cost</Code> = $0.625/$0.875 doesn&apos;t match any invoice (real: $0.63/$0.87).
                Two clients (Central City Solutions, Reno Area Home Buyers) have <Code>$0</Code> PCM cost in Aurora.
                Margin summary / Client margins carry a systematic error until the monolith field is corrected.
              </AxisCallout>
              <AxisCallout type="alert" title="Profitability period vs. lifetime use different source tables">
                Lifetime reads <Code>dm_client_funnel</Code>; Period reads <Code>dm_volume_summary</Code>.
                They may disagree for the same window. Reconciliation pending.
              </AxisCallout>
              <AxisCallout type="alert" title="Pricing history is partly static">
                PCM eras are verified from 264 invoices (static, OK).
                Customer pricing eras in the Reports tab are <strong>hardcoded</strong> and require manual updates whenever 8020REI changes platform pricing —
                new customer rates will not appear until the eras array is updated.
              </AxisCallout>
              <AxisCallout type="info" title="rr_daily_metrics holds only ~15 days">
                OH period widgets are bounded to this window. Lifetime views use PCM via <Code>dm_overview_cache</Code> instead.
              </AxisCallout>
              <AxisCallout type="info" title="dm_client_funnel is a rolling snapshot, not a ledger">
                ~11 days of coverage, each row a cumulative total. Lifetime totals are correct;
                a historical per-month margin trend cannot be rebuilt from this table alone.
              </AxisCallout>
              <AxisCallout type="info" title="PCM API scope">
                <Code>/order</Code> does not provide per-domain filtering or server-side status filter.
                Per-client reconciliation is Aurora-only. Domain-level PCM totals require full pagination + client-side grouping.
              </AxisCallout>
              <AxisCallout type="info" title="Reports monthly tables are static">
                <Code>monthlyPcmCosts</Code> and <Code>monthlyRevenue</Code> are hardcoded in <Code>dm-reports/route.ts</Code>.
                They must be extended manually each month until a live query replaces them.
              </AxisCallout>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-stroke mb-8">
          <p className="text-xs text-content-tertiary">
            Last reviewed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. For questions about data methodology, contact the Metrics team.
          </p>
        </div>
      </div>
    </div>
  );
});
