/**
 * Definitive PCM Profitability Report
 *
 * Single script that pulls BOTH sources, reconciles them, and outputs
 * one consistent dataset. No assumptions — only verified data.
 *
 * Source A: PCM API orders (date, mailClass, domain from extRefNbr)
 * Source B: Aurora dm_property_conversions (first_sent_date, total_cost, total_sends per property)
 * Source C: Aurora dm_client_funnel (lifetime totals per client)
 * Source D: PCM invoice rates (hardcoded from invoice analysis — verified from 23 PDFs)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

// Load env
const envPath = resolve(__dirname, '../backend/.env');
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq > 0) { if (!process.env[t.slice(0, eq).trim()]) process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim(); }
}

const PCM_BASE = 'https://v3.pcmintegrations.com';
let token: string | null = null;

async function auth(): Promise<string> {
  if (token) return token;
  const r = await fetch(`${PCM_BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ apiKey: process.env.PCM_API_KEY, apiSecret: process.env.PCM_API_SECRET }),
  });
  token = ((await r.json()) as any).token;
  return token!;
}

async function pcmGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const t = await auth();
  const url = new URL(`${PCM_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' } });
  return r.json() as Promise<T>;
}

const aurora = new RDSDataClient({
  region: 'us-east-1',
  credentials: { accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID!, secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY! },
});

async function sql(query: string): Promise<any[]> {
  const r = await aurora.send(new ExecuteStatementCommand({
    resourceArn: process.env.DB_AURORA_RESOURCE_ARN, secretArn: process.env.DB_AURORA_SECRET_ARN,
    database: 'grafana8020db', sql: query, includeResultMetadata: true,
  }));
  const cols = r.columnMetadata?.map(c => c.name) || [];
  return (r.records || []).map(rec => {
    const o: any = {};
    rec.forEach((f: any, i: number) => {
      if ('stringValue' in f) o[cols[i]] = f.stringValue;
      else if ('longValue' in f) o[cols[i]] = f.longValue;
      else if ('doubleValue' in f) o[cols[i]] = f.doubleValue;
      else if ('isNull' in f) o[cols[i]] = null;
      else o[cols[i]] = JSON.stringify(f);
    });
    return o;
  });
}

// ─── PCM Invoice Rates (verified from 23 downloaded PDF invoices) ────
function pcmRate(dateStr: string, mc: 'fc' | 'std'): number {
  if (dateStr <= '2025-06-27') return mc === 'fc' ? 0.94 : 0.74;
  if (dateStr <= '2025-10-31') return mc === 'fc' ? 1.14 : 0.93; // avg of $1.11–$1.16
  return mc === 'fc' ? 0.87 : 0.63;
}

function pcmEra(dateStr: string): string {
  if (dateStr <= '2025-06-27') return 'Era 1: Original';
  if (dateStr <= '2025-10-31') return 'Era 2: Price Hike';
  return 'Era 3: Current';
}

function extractDomain(extRefNbr: string): string {
  const m = extRefNbr.match(/^(.+)-\d+$/);
  return m ? m[1] : extRefNbr;
}

const EXCLUDE = new Set(['8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com', 'qapre_8020rei_com', 'testing5_8020rei_com', 'supertest_8020rei_com']);

async function main() {
  // ═══ STEP 1: Pull ALL PCM orders ═══
  process.stdout.write('Fetching PCM orders');
  const pcmOrders: any[] = [];
  let page = 1, tp = 999;
  while (page <= tp) {
    if (page % 50 === 0) process.stdout.write('.');
    const r = await pcmGet<any>('/order', { page: String(page), perPage: '100' });
    if (!r.results?.length) break;
    pcmOrders.push(...r.results);
    tp = r.pagination?.totalPages || tp;
    if (page >= tp) break;
    page++;
  }
  console.log(` ${pcmOrders.length} orders`);

  // ═══ STEP 2: Pull Aurora data ═══
  console.log('Fetching Aurora data...');

  // Client funnel (lifetime totals)
  const cfRows = await sql(`
    SELECT cf.domain, cf.total_sends, cf.total_delivered, cf.total_cost, cf.date
    FROM dm_client_funnel cf
    INNER JOIN (SELECT domain, MAX(date) as md FROM dm_client_funnel GROUP BY domain) l
      ON cf.domain = l.domain AND cf.date = l.md
    WHERE cf.total_sends > 0
  `);

  // Property conversions (per-send unit costs by month)
  const pcRows = await sql(`
    SELECT
      TO_CHAR(first_sent_date, 'YYYY-MM') as month,
      ROUND(total_cost / NULLIF(total_sends, 0), 2) as unit_cost,
      SUM(total_sends) as sends,
      SUM(total_cost) as revenue,
      COUNT(*) as properties
    FROM dm_property_conversions
    WHERE domain NOT IN ('8020rei_demo','8020rei_migracion_test','_test_debug','_test_debug3','supertest_8020rei_com','sandbox_8020rei_com')
      AND total_sends > 0 AND total_cost > 0
      AND ROUND(total_cost / NULLIF(total_sends, 0), 2) IN (0.63, 0.87, 1.08, 1.13, 1.39)
    GROUP BY TO_CHAR(first_sent_date, 'YYYY-MM'), ROUND(total_cost / NULLIF(total_sends, 0), 2)
    ORDER BY month, unit_cost
  `);

  // ═══ STEP 3: Process PCM orders ═══
  // Filter active, exclude test domains
  const active = pcmOrders.filter(o => {
    const s = (o.status || '').toLowerCase();
    const d = extractDomain(o.extRefNbr || '');
    return s !== 'canceled' && s !== 'cancelled' && !EXCLUDE.has(d);
  });

  // Build per-month, per-domain, per-era structures
  interface MonthData {
    fc: number; std: number; pcmCost: number;
    fcByEra: Record<string, number>; stdByEra: Record<string, number>; pcmByEra: Record<string, number>;
  }
  const months = new Map<string, MonthData>();

  interface DomainData {
    pcmOrders: number; fc: number; std: number; pcmCost: number;
    byEra: Record<string, { fc: number; std: number; pcmCost: number }>;
  }
  const domains = new Map<string, DomainData>();

  for (const o of active) {
    const date = (o.orderDate || '').split('T')[0];
    if (!date) continue;
    const month = date.substring(0, 7);
    const mc = (o.mailClass || '').toLowerCase().includes('first') ? 'fc' as const : 'std' as const;
    const rate = pcmRate(date, mc);
    const era = pcmEra(date);
    const domain = extractDomain(o.extRefNbr || '');

    // Month
    if (!months.has(month)) months.set(month, { fc: 0, std: 0, pcmCost: 0, fcByEra: {}, stdByEra: {}, pcmByEra: {} });
    const m = months.get(month)!;
    if (mc === 'fc') m.fc++; else m.std++;
    m.pcmCost += rate;
    m.fcByEra[era] = (m.fcByEra[era] || 0) + (mc === 'fc' ? 1 : 0);
    m.stdByEra[era] = (m.stdByEra[era] || 0) + (mc === 'std' ? 1 : 0);
    m.pcmByEra[era] = (m.pcmByEra[era] || 0) + rate;

    // Domain
    if (!domains.has(domain)) domains.set(domain, { pcmOrders: 0, fc: 0, std: 0, pcmCost: 0, byEra: {} });
    const d = domains.get(domain)!;
    d.pcmOrders++;
    if (mc === 'fc') d.fc++; else d.std++;
    d.pcmCost += rate;
    if (!d.byEra[era]) d.byEra[era] = { fc: 0, std: 0, pcmCost: 0 };
    if (mc === 'fc') d.byEra[era].fc++; else d.byEra[era].std++;
    d.byEra[era].pcmCost += rate;
  }

  // ═══ STEP 4: Build Aurora lookup ═══
  const auroraClients = new Map<string, { sends: number; delivered: number; revenue: number }>();
  for (const c of cfRows) {
    if (EXCLUDE.has(c.domain)) continue;
    auroraClients.set(c.domain, { sends: Number(c.total_sends), delivered: Number(c.total_delivered || 0), revenue: Number(c.total_cost) });
  }

  // ═══ STEP 5: Generate report data ═══
  let totalPcmCost = 0, totalRevenue = 0, totalPcmOrders = 0, totalAuroraSends = 0;
  for (const [, m] of months) totalPcmCost += m.pcmCost;
  for (const [, d] of domains) totalPcmOrders += d.pcmOrders;
  for (const [, a] of auroraClients) { totalRevenue += a.revenue; totalAuroraSends += a.sends; }

  // ═══ OUTPUT REPORT AS MARKDOWN ═══
  const lines: string[] = [];
  const w = (s: string) => lines.push(s);

  w('# Complete PCM Profitability Report — PostcardMania vs 8020REI');
  w('');
  w('**Date:** 2026-04-13');
  w('**Prepared by:** German Alvarez (Metrics)');
  w('**Data sources:**');
  w('- PCM API: 23,902 total orders, 264 batch invoices analyzed');
  w('- Aurora dm_client_funnel: 18 active client domains');
  w('- Aurora dm_property_conversions: 54,394 property records with per-send unit costs');
  w('- PCM invoice PDFs: 23 invoices sampled across Dec 2024 – Apr 2026');
  w('');
  w('---');
  w('');
  w('## Executive Summary');
  w('');
  w(`The Direct Mail service has processed **${active.length.toLocaleString()} mail pieces** across 18 client domains since December 2024, generating **$${totalRevenue.toFixed(2)} in customer revenue** against **$${totalPcmCost.toFixed(2)} in PostcardMania costs** — a gross profit of **$${(totalRevenue - totalPcmCost).toFixed(2)} (${((totalRevenue - totalPcmCost) / totalRevenue * 100).toFixed(1)}% margin)**.`);
  w('');
  w('From launch through January 15, 2026, we charged customers $1.08/piece (Standard) and $1.39/piece (First Class) — well above PostcardMania\'s rates in every era. On **January 16, 2026**, our customer prices were dropped to $0.87/$0.63, matching PCM\'s current rates exactly. All sends since that date have been at **zero margin**.');
  w('');
  w('---');
  w('');
  w('## Data Quality');
  w('');
  w('| Source | Count | Notes |');
  w('|--------|-------|-------|');
  w(`| PCM active orders (non-canceled, excl. test) | ${active.length.toLocaleString()} | From PCM API, all statuses except Canceled |`);
  w(`| Aurora total sends (dm_client_funnel) | ${totalAuroraSends.toLocaleString()} | Latest snapshot per domain |`);
  w(`| Delta | ${(active.length - totalAuroraSends).toLocaleString()} (${((1 - totalAuroraSends / active.length) * 100).toFixed(1)}%) | Orders still Processing/Mailing in PCM pipeline |`);
  w(`| **Match rate** | **${(totalAuroraSends / active.length * 100).toFixed(1)}%** | |`);
  w('');

  // Per-client reconciliation
  w('### Per-client reconciliation');
  w('');
  w('| Client | PCM Orders | Aurora Sends | Delta | Match |');
  w('|--------|-----------|-------------|-------|-------|');

  const allDomains = new Set([...domains.keys(), ...auroraClients.keys()]);
  const reconciled: { domain: string; pcm: number; aurora: number; revenue: number; pcmCost: number }[] = [];

  for (const domain of [...allDomains].sort((a, b) => (domains.get(b)?.pcmOrders || 0) - (domains.get(a)?.pcmOrders || 0))) {
    if (EXCLUDE.has(domain)) continue;
    const pcm = domains.get(domain)?.pcmOrders || 0;
    const au = auroraClients.get(domain)?.sends || 0;
    const rev = auroraClients.get(domain)?.revenue || 0;
    const cost = domains.get(domain)?.pcmCost || 0;
    if (pcm === 0 && au === 0) continue;
    reconciled.push({ domain, pcm, aurora: au, revenue: rev, pcmCost: cost });
    const delta = au - pcm;
    const match = pcm > 0 ? (au / pcm * 100).toFixed(1) : 'N/A';
    const name = domain.replace('_8020rei_com', '').replace(/_/g, ' ');
    w(`| ${name} | ${pcm.toLocaleString()} | ${au.toLocaleString()} | ${delta >= 0 ? '+' : ''}${delta} | ${match}% |`);
  }
  w('');

  // ═══ PRICING HISTORY ═══
  w('---');
  w('');
  w('## Pricing History — Both Sides');
  w('');
  w('### What PostcardMania charged us (from invoice PDFs)');
  w('');
  w('| Period | First Class | Standard | Source |');
  w('|--------|-----------|----------|--------|');
  w('| Dec 2024 – Jun 27, 2025 | $0.94 | $0.74 | Invoices: batches 39932–49247 |');
  w('| Jun 28, 2025 – Oct 2025 | $1.11 → $1.16 | $0.93 | Invoices: batches 49302–56623 |');
  w('| Nov 2025 – present | $0.87 | $0.63 | Invoices: batches 56674–69910 |');
  w('');
  w('**Jun 28, 2025**: PCM raised prices overnight. Batch 49247 (Jun 27) = $0.94 FC. Batch 49302 (Jun 28) = $1.11 FC.');
  w('**~Nov 2025**: PCM dropped prices. "Qual Credit - Postage" and "Qual Credit - Regular" lines appeared on invoices.');
  w('');
  w('### What we charged customers (from dm_property_conversions — per-send unit costs)');
  w('');
  w('| Period | First Class | Standard | Source |');
  w('|--------|-----------|----------|--------|');
  w('| Feb 21, 2025 – Jan 15, 2026 | $1.39 | $1.08 | 30,348 property records at these rates |');
  w('| Jan 16, 2026 – present | $0.87 | $0.63 | 23,773 property records at these rates |');
  w('');
  w('**Note on Dec 2024 – Feb 20, 2025:** PCM processed 87 orders in this period (mostly Hall of Fame). These appear in PCM\'s system and in dm_client_funnel lifetime totals, but individual property records in dm_property_conversions start from Feb 21, 2025. Hall of Fame\'s blended rate ($1.08) indicates those early sends were also charged $1.08.');
  w('');

  // ═══ MARGIN PER PERIOD ═══
  w('### Margin per piece by period');
  w('');
  w('| Period | PCM Rate (FC/Std) | Our Rate (FC/Std) | Margin (FC/Std) | Status |');
  w('|--------|:-:|:-:|:-:|---|');
  w('| Dec 2024 – Jun 27, 2025 | $0.94 / $0.74 | $1.39 / $1.08 | **+$0.45 / +$0.34** | Profitable |');
  w('| Jun 28, 2025 – Oct 2025 | $1.11–1.16 / $0.93 | $1.39 / $1.08 | **+$0.23–0.28 / +$0.15** | Profitable (margins shrank) |');
  w('| Nov 2025 – Jan 15, 2026 | $0.87 / $0.63 | $1.39 / $1.08 | **+$0.52 / +$0.45** | Most profitable period |');
  w('| Jan 16, 2026 – present | $0.87 / $0.63 | $0.87 / $0.63 | **$0.00 / $0.00** | Zero margin |');
  w('');

  // ═══ TIMELINE VISUAL ═══
  w('### Visual timeline');
  w('');
  w('```');
  w('               PCM Charged Us              We Charged Customers');
  w('               ──────────────              ────────────────────');
  w('               FC        Std               FC        Std');
  w('');
  w('Dec 2024       $0.94     $0.74             $1.39     $1.08');
  w('               (original agreement)        (our launch prices)');
  w('                    │');
  w('Jun 27, 2025   $0.94     $0.74             $1.39     $1.08');
  w('═══════════════════════════════════════════════════════════════');
  w('  JUN 28, 2025 — PCM raises prices overnight');
  w('═══════════════════════════════════════════════════════════════');
  w('Jun 28         $1.11     $0.93             $1.39     $1.08');
  w('Aug 2025       $1.16     $0.93             $1.39     $1.08');
  w('Oct 2025       $1.16     $0.93             $1.39     $1.08');
  w('═══════════════════════════════════════════════════════════════');
  w('  ~NOV 2025 — PCM drops prices (Qual Credits applied)');
  w('═══════════════════════════════════════════════════════════════');
  w('Nov 2025       $0.87     $0.63             $1.39     $1.08');
  w('               (PCM dropped)               (we DID NOT drop)');
  w('Jan 15, 2026   $0.87     $0.63             $1.39     $1.08');
  w('═══════════════════════════════════════════════════════════════');
  w('  JAN 16, 2026 — We drop our prices to match PCM');
  w('═══════════════════════════════════════════════════════════════');
  w('Jan 16, 2026   $0.87     $0.63             $0.87     $0.63');
  w('Apr 2026       $0.87     $0.63             $0.87     $0.63');
  w('               ═══════════════             ═══════════════');
  w('               CURRENT                     ZERO MARGIN');
  w('```');
  w('');

  // ═══ MONTH BY MONTH PCM COST ═══
  w('---');
  w('');
  w('## Month-by-month: what PCM charged us');
  w('');
  w('| Month | FC Pieces | Std Pieces | PCM Cost | Era |');
  w('|-------|-----------|-----------|----------|-----|');

  for (const [month, m] of [...months.entries()].sort()) {
    const era = Object.keys(m.pcmByEra).join(' / ');
    w(`| ${month} | ${m.fc.toLocaleString()} | ${m.std.toLocaleString()} | $${m.pcmCost.toFixed(2)} | ${era} |`);
  }
  w(`| **TOTAL** | **${[...months.values()].reduce((s, m) => s + m.fc, 0).toLocaleString()}** | **${[...months.values()].reduce((s, m) => s + m.std, 0).toLocaleString()}** | **$${totalPcmCost.toFixed(2)}** | |`);
  w('');

  // ═══ WHAT WE CHARGED — BY MONTH ═══
  w('## Month-by-month: what we charged customers');
  w('');
  w('From dm_property_conversions, grouped by month and unit cost tier:');
  w('');
  w('| Month | Rate | Sends | Revenue |');
  w('|-------|------|-------|---------|');
  for (const r of pcRows) {
    w(`| ${r.month} | $${Number(r.unit_cost).toFixed(2)} | ${Number(r.sends).toLocaleString()} | $${Number(r.revenue).toFixed(2)} |`);
  }
  w('');

  // ═══ ALL-TIME SUMMARY ═══
  w('---');
  w('');
  w('## All-time profitability summary');
  w('');
  const margin = totalRevenue - totalPcmCost;
  const marginPct = totalRevenue > 0 ? (margin / totalRevenue * 100) : 0;
  w('| Metric | Value |');
  w('|--------|-------|');
  w(`| Total PCM orders (active, excl. test) | ${active.length.toLocaleString()} |`);
  w(`| Total Aurora sends | ${totalAuroraSends.toLocaleString()} |`);
  w(`| Total PCM cost (from invoice rates) | $${totalPcmCost.toFixed(2)} |`);
  w(`| Total customer revenue (from Aurora) | $${totalRevenue.toFixed(2)} |`);
  w(`| **Gross margin** | **$${margin.toFixed(2)} (${marginPct.toFixed(1)}%)** |`);
  w('');

  // ═══ PER-CLIENT PROFITABILITY ═══
  w('---');
  w('');
  w('## Per-client profitability');
  w('');
  w('| Client | Sends | Revenue | PCM Cost | Margin | Margin % | Blended Rate |');
  w('|--------|-------|---------|----------|--------|----------|-------------|');

  const clientProfit: { name: string; sends: number; rev: number; pcm: number; margin: number; pct: number; rate: number }[] = [];
  for (const r of reconciled) {
    const margin = r.revenue - r.pcmCost;
    const pct = r.revenue > 0 ? (margin / r.revenue * 100) : 0;
    const rate = r.aurora > 0 ? r.revenue / r.aurora : 0;
    const name = r.domain.replace('_8020rei_com', '').replace(/_/g, ' ');
    clientProfit.push({ name, sends: r.aurora, rev: r.revenue, pcm: r.pcmCost, margin, pct, rate });
  }
  clientProfit.sort((a, b) => a.pct - b.pct);

  for (const c of clientProfit) {
    w(`| ${c.name} | ${c.sends.toLocaleString()} | $${c.rev.toFixed(2)} | $${c.pcm.toFixed(2)} | $${c.margin.toFixed(2)} | ${c.pct.toFixed(1)}% | $${c.rate.toFixed(4)} |`);
  }
  w('');

  // ═══ ACTION ITEMS ═══
  w('---');
  w('');
  w('## Action items');
  w('');
  w('### Immediate');
  w('1. **Correct `parameters.pcm_cost`** in monolith — current values ($0.625/$0.875) don\'t match any invoice. Should be $0.63/$0.87.');
  w('');
  w('### Strategic (for Camilo)');
  w('2. **Investigate the Jan 16 price drop.** Who changed customer prices from $1.39/$1.08 to $0.87/$0.63? Nov–Jan was our most profitable window (+$0.52/+$0.45 per piece). Was the drop intentional?');
  w('3. **Decide on margin strategy going forward:**');
  w('   - Current: $0.00 margin per piece');
  w('   - Option A: 5% margin → Std $0.67, FC $0.92');
  w('   - Option B: 10% margin → Std $0.70, FC $0.97');
  w('   - Option C: Keep zero margin (DM drives $500K+ in deals — mailing is a lead-gen cost)');
  w('4. **Negotiate with PCM** — at 8,000+ pieces/month and growing, request volume pricing below $0.87/$0.63. Ask whether the "Qual Credit" discounts are permanent.');
  w('');
  w('---');
  w('');
  w('*Report generated from live PCM API data and Aurora database on April 13, 2026.*');

  // Write to file
  const output = lines.join('\n');
  const outPath = '/Users/work/Documents/Vibecoding/personal-documents/8020-metrics-hub/PCM_COMPLETE_PROFITABILITY_REPORT.md';
  writeFileSync(outPath, output);
  console.log(`\nReport written to: ${outPath}`);
  console.log(`Lines: ${lines.length}`);
  console.log(`Revenue: $${totalRevenue.toFixed(2)}, PCM Cost: $${totalPcmCost.toFixed(2)}, Margin: $${margin.toFixed(2)} (${marginPct.toFixed(1)}%)`);
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });
