/**
 * Complete PCM Profitability Report
 *
 * Cross-references:
 * 1. ALL PCM orders (date, mailClass, domain from extRefNbr)
 * 2. PCM invoice rates per era (from invoice analysis)
 * 3. Aurora dm_client_funnel (lifetime revenue per client)
 *
 * Produces a month-by-month comparison: PCM cost vs our revenue vs margin
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  RDSDataClient,
  ExecuteStatementCommand,
} from '@aws-sdk/client-rds-data';

// Load env
const envPath = resolve(__dirname, '../backend/.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq > 0) { const k = t.slice(0, eq).trim(); const v = t.slice(eq + 1).trim(); if (!process.env[k]) process.env[k] = v; }
}

const PCM_BASE_URL = 'https://v3.pcmintegrations.com';
let cachedToken: string | null = null;

async function authenticate(): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await fetch(`${PCM_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ apiKey: process.env.PCM_API_KEY, apiSecret: process.env.PCM_API_SECRET }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json() as { token: string };
  cachedToken = data.token;
  return cachedToken;
}

async function pcmGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await authenticate();
  const url = new URL(`${PCM_BASE_URL}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

// Aurora client
const auroraClient = new RDSDataClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY || '',
  },
});

async function runAuroraQuery(sql: string): Promise<any[]> {
  const cmd = new ExecuteStatementCommand({
    resourceArn: process.env.DB_AURORA_RESOURCE_ARN,
    secretArn: process.env.DB_AURORA_SECRET_ARN,
    database: 'grafana8020db',
    sql,
    includeResultMetadata: true,
  });
  const r = await auroraClient.send(cmd);
  const cols = r.columnMetadata?.map(c => c.name) || [];
  return (r.records || []).map(rec => {
    const obj: Record<string, any> = {};
    rec.forEach((f: any, i: number) => {
      if ('stringValue' in f) obj[cols[i]] = f.stringValue;
      else if ('longValue' in f) obj[cols[i]] = f.longValue;
      else if ('doubleValue' in f) obj[cols[i]] = f.doubleValue;
      else if ('isNull' in f) obj[cols[i]] = null;
      else obj[cols[i]] = JSON.stringify(f);
    });
    return obj;
  });
}

// ─── PCM Invoice Rate Lookup ───────────────────────────────────
// Based on invoice analysis: three pricing eras

interface PcmRateEra {
  start: string; // YYYY-MM-DD
  end: string;
  fcRate: number;
  stdRate: number;
  label: string;
}

const PCM_RATE_ERAS: PcmRateEra[] = [
  { start: '2000-01-01', end: '2025-06-27', fcRate: 0.9400, stdRate: 0.7400, label: 'Era 1: Original' },
  { start: '2025-06-28', end: '2025-10-31', fcRate: 1.1400, stdRate: 0.9300, label: 'Era 2: Price Hike' },
  // FC went from $1.11 to $1.16 during Era 2; using $1.14 as average
  { start: '2025-11-01', end: '2099-12-31', fcRate: 0.8700, stdRate: 0.6300, label: 'Era 3: Current' },
];

function getPcmRate(dateStr: string, mailClass: 'fc' | 'std'): { rate: number; era: string } {
  for (const era of PCM_RATE_ERAS) {
    if (dateStr >= era.start && dateStr <= era.end) {
      return {
        rate: mailClass === 'fc' ? era.fcRate : era.stdRate,
        era: era.label,
      };
    }
  }
  // Fallback
  return { rate: mailClass === 'fc' ? 0.87 : 0.63, era: 'Unknown' };
}

function extractDomain(extRefNbr: string): string {
  // Format: "domain-123" — take everything before the last hyphen+number
  const match = extRefNbr.match(/^(.+)-\d+$/);
  return match ? match[1] : extRefNbr;
}

function getMailClassKey(mailClass: string): 'fc' | 'std' {
  return mailClass.toLowerCase().includes('first') ? 'fc' : 'std';
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   COMPLETE PCM PROFITABILITY REPORT                        ║');
  console.log('║   PostcardMania Cost vs 8020REI Revenue — Full History     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ─── STEP 1: Fetch ALL PCM orders ───────────────────────────
  console.log('Step 1: Fetching all PCM orders...');
  const allOrders: any[] = [];
  let page = 1;
  let totalPages = 999;

  while (page <= totalPages) {
    if (page % 50 === 0) process.stdout.write(`  Page ${page}/${totalPages}...\n`);
    const response = await pcmGet<any>('/order', { page: String(page), perPage: '100' });
    const orders = response.results || [];
    if (orders.length === 0) break;
    allOrders.push(...orders);
    totalPages = response.pagination?.totalPages || totalPages;
    if (page >= totalPages) break;
    page++;
  }
  console.log(`  Total PCM orders: ${allOrders.length.toLocaleString()}\n`);

  // ─── STEP 2: Fetch Aurora client data ───────────────────────
  console.log('Step 2: Fetching Aurora dm_client_funnel data...');
  const clientData = await runAuroraQuery(`
    SELECT domain, total_sends, total_cost,
      ROUND(total_cost / NULLIF(total_sends, 0), 4) as eff_rate
    FROM dm_client_funnel
    WHERE date = (SELECT MAX(date) FROM dm_client_funnel)
      AND domain NOT IN ('8020rei_demo','8020rei_migracion_test','_test_debug','_test_debug3','supertest_8020rei_com','sandbox_8020rei_com')
      AND total_sends > 0
    ORDER BY total_sends DESC
  `);

  const clientMap = new Map<string, { totalSends: number; totalCost: number; effRate: number }>();
  for (const c of clientData) {
    clientMap.set(c.domain, {
      totalSends: Number(c.total_sends),
      totalCost: Number(c.total_cost),
      effRate: Number(c.eff_rate),
    });
  }
  console.log(`  Clients in Aurora: ${clientData.length}\n`);

  // ─── STEP 3: Process all orders ─────────────────────────────
  console.log('Step 3: Processing orders and computing costs...\n');

  // Filter active orders
  const activeOrders = allOrders.filter((o: any) => {
    const status = (o.status || '').toLowerCase();
    return status !== 'canceled' && status !== 'cancelled';
  });

  // Build monthly + per-era buckets
  interface MonthBucket {
    month: string;
    era: string;
    fcOrders: number;
    stdOrders: number;
    pcmFcCost: number;
    pcmStdCost: number;
    pcmTotalCost: number;
    domains: Set<string>;
  }

  interface EraBucket {
    era: string;
    fcOrders: number;
    stdOrders: number;
    pcmFcCost: number;
    pcmStdCost: number;
    pcmTotalCost: number;
  }

  const monthlyBuckets = new Map<string, MonthBucket>();
  const eraBuckets = new Map<string, EraBucket>();

  // Per-domain per-era tracking
  interface DomainEraBucket {
    fcOrders: number;
    stdOrders: number;
    pcmCost: number;
  }
  const domainEraMap = new Map<string, Map<string, DomainEraBucket>>();

  for (const order of activeOrders) {
    const dateStr = (order.orderDate || '').split('T')[0];
    if (!dateStr) continue;

    const month = dateStr.substring(0, 7); // YYYY-MM
    const mc = getMailClassKey(order.mailClass || 'Standard');
    const { rate, era } = getPcmRate(dateStr, mc);
    const domain = extractDomain(order.extRefNbr || '');

    // Monthly bucket
    const monthKey = `${month}|${era}`;
    if (!monthlyBuckets.has(monthKey)) {
      monthlyBuckets.set(monthKey, {
        month, era, fcOrders: 0, stdOrders: 0,
        pcmFcCost: 0, pcmStdCost: 0, pcmTotalCost: 0,
        domains: new Set(),
      });
    }
    const mb = monthlyBuckets.get(monthKey)!;
    mb.domains.add(domain);

    if (mc === 'fc') {
      mb.fcOrders++;
      mb.pcmFcCost += rate;
    } else {
      mb.stdOrders++;
      mb.pcmStdCost += rate;
    }
    mb.pcmTotalCost += rate;

    // Era bucket
    if (!eraBuckets.has(era)) {
      eraBuckets.set(era, { era, fcOrders: 0, stdOrders: 0, pcmFcCost: 0, pcmStdCost: 0, pcmTotalCost: 0 });
    }
    const eb = eraBuckets.get(era)!;
    if (mc === 'fc') { eb.fcOrders++; eb.pcmFcCost += rate; }
    else { eb.stdOrders++; eb.pcmStdCost += rate; }
    eb.pcmTotalCost += rate;

    // Domain-era bucket
    if (!domainEraMap.has(domain)) domainEraMap.set(domain, new Map());
    const deMap = domainEraMap.get(domain)!;
    if (!deMap.has(era)) deMap.set(era, { fcOrders: 0, stdOrders: 0, pcmCost: 0 });
    const de = deMap.get(era)!;
    if (mc === 'fc') { de.fcOrders++; } else { de.stdOrders++; }
    de.pcmCost += rate;
  }

  // ─── STEP 4: Compute our implied customer rates per era ─────
  // For each domain: total_cost (from Aurora) = sum of (sends_in_era * our_rate_in_era)
  // We know sends_in_era from PCM orders. We solve for rates.

  // ═══════════════════════════════════════════════════════════════
  // REPORT OUTPUT
  // ═══════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SECTION 1: MONTH-BY-MONTH PCM COST BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const sortedMonths = [...monthlyBuckets.entries()]
    .sort((a, b) => a[1].month.localeCompare(b[1].month));

  console.log('Month    | Era                  | FC Pcs | Std Pcs | PCM FC Cost  | PCM Std Cost | PCM Total    | Clients');
  console.log('---------|----------------------|--------|---------|--------------|--------------|--------------|--------');

  let grandTotalPcm = 0;
  let grandTotalFc = 0;
  let grandTotalStd = 0;

  for (const [, mb] of sortedMonths) {
    grandTotalPcm += mb.pcmTotalCost;
    grandTotalFc += mb.fcOrders;
    grandTotalStd += mb.stdOrders;

    const era = mb.era.substring(0, 20).padEnd(20);
    console.log(
      `${mb.month}  | ${era} | ${String(mb.fcOrders).padStart(6)} | ${String(mb.stdOrders).padStart(7)} | $${mb.pcmFcCost.toFixed(2).padStart(11)} | $${mb.pcmStdCost.toFixed(2).padStart(11)} | $${mb.pcmTotalCost.toFixed(2).padStart(11)} | ${mb.domains.size}`
    );
  }

  console.log(`\nTOTALS: ${grandTotalFc.toLocaleString()} FC + ${grandTotalStd.toLocaleString()} Std = ${(grandTotalFc + grandTotalStd).toLocaleString()} pieces`);
  console.log(`Total PCM cost (computed from invoice rates): $${grandTotalPcm.toFixed(2)}`);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('  SECTION 2: PER-ERA SUMMARY — PCM COST vs OUR REVENUE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Compute our total revenue from Aurora
  let totalAuroraRevenue = 0;
  let totalAuroraSends = 0;
  for (const [, c] of clientMap) {
    totalAuroraRevenue += c.totalCost;
    totalAuroraSends += c.totalSends;
  }

  console.log(`Aurora totals: ${totalAuroraSends.toLocaleString()} sends, $${totalAuroraRevenue.toFixed(2)} revenue`);
  console.log(`PCM totals:    ${activeOrders.length.toLocaleString()} orders, $${grandTotalPcm.toFixed(2)} cost (computed)\n`);

  // Per-era summary
  for (const [, eb] of [...eraBuckets.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const totalPieces = eb.fcOrders + eb.stdOrders;
    const avgPcmRate = totalPieces > 0 ? eb.pcmTotalCost / totalPieces : 0;
    console.log(`┌─── ${eb.era} ───`);
    console.log(`│ First Class: ${eb.fcOrders.toLocaleString()} pieces × PCM rate → $${eb.pcmFcCost.toFixed(2)}`);
    console.log(`│ Standard:    ${eb.stdOrders.toLocaleString()} pieces × PCM rate → $${eb.pcmStdCost.toFixed(2)}`);
    console.log(`│ TOTAL PCM COST: $${eb.pcmTotalCost.toFixed(2)} (${totalPieces.toLocaleString()} pieces, avg $${avgPcmRate.toFixed(4)}/pc)`);
    console.log(`└────────────────────────\n`);
  }

  // Overall margin
  const overallMargin = totalAuroraRevenue - grandTotalPcm;
  const overallMarginPct = totalAuroraRevenue > 0 ? (overallMargin / totalAuroraRevenue) * 100 : 0;
  console.log('┌─── ALL-TIME PROFITABILITY ───');
  console.log(`│ Total revenue (what we charged customers):  $${totalAuroraRevenue.toFixed(2)}`);
  console.log(`│ Total PCM cost (from invoice rates):        $${grandTotalPcm.toFixed(2)}`);
  console.log(`│ GROSS MARGIN:                               $${overallMargin.toFixed(2)} (${overallMarginPct.toFixed(2)}%)`);
  console.log(`└────────────────────────\n`);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SECTION 3: PER-CLIENT PROFITABILITY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('Domain                          | Our Sends | Our Revenue  | PCM Cost     | Margin       | Margin %  | Blended Rate');
  console.log('--------------------------------|-----------|--------------|--------------|--------------|-----------|-------------');

  // Compute PCM cost per domain from orders
  const domainPcmCost = new Map<string, number>();
  const domainPcmSends = new Map<string, number>();
  for (const [domain, eraMap] of domainEraMap) {
    let cost = 0;
    let sends = 0;
    for (const [, de] of eraMap) {
      cost += de.pcmCost;
      sends += de.fcOrders + de.stdOrders;
    }
    domainPcmCost.set(domain, cost);
    domainPcmSends.set(domain, sends);
  }

  // Sort by margin (worst first)
  const clientRows: { domain: string; ourSends: number; ourRevenue: number; pcmCost: number; margin: number; marginPct: number; blendedRate: number }[] = [];

  for (const [domain, client] of clientMap) {
    const pcmCost = domainPcmCost.get(domain) || 0;
    const margin = client.totalCost - pcmCost;
    const marginPct = client.totalCost > 0 ? (margin / client.totalCost) * 100 : 0;
    clientRows.push({
      domain,
      ourSends: client.totalSends,
      ourRevenue: client.totalCost,
      pcmCost,
      margin,
      marginPct,
      blendedRate: client.effRate,
    });
  }

  clientRows.sort((a, b) => a.marginPct - b.marginPct);

  for (const r of clientRows) {
    const d = r.domain.padEnd(31).substring(0, 31);
    const sends = String(r.ourSends).padStart(9);
    const rev = `$${r.ourRevenue.toFixed(2)}`.padStart(12);
    const pcm = `$${r.pcmCost.toFixed(2)}`.padStart(12);
    const margin = `$${r.margin.toFixed(2)}`.padStart(12);
    const pct = `${r.marginPct.toFixed(1)}%`.padStart(9);
    const rate = `$${r.blendedRate.toFixed(4)}`.padStart(11);
    console.log(`${d} | ${sends} | ${rev} | ${pcm} | ${margin} | ${pct} | ${rate}`);
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('  SECTION 4: PER-CLIENT ERA BREAKDOWN');
  console.log('  (How many pieces each client sent in each pricing era)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const [domain, client] of clientMap) {
    const eraMap = domainEraMap.get(domain);
    if (!eraMap) continue;

    console.log(`┌─── ${domain} ───`);
    console.log(`│ Aurora: ${client.totalSends} sends, $${client.totalCost.toFixed(2)} revenue (blended $${client.effRate.toFixed(4)}/pc)`);

    let pcmTotalForDomain = 0;
    for (const [era, de] of [...eraMap.entries()].sort()) {
      const pieces = de.fcOrders + de.stdOrders;
      pcmTotalForDomain += de.pcmCost;
      console.log(`│ ${era}: ${de.fcOrders} FC + ${de.stdOrders} Std = ${pieces} pieces → PCM cost $${de.pcmCost.toFixed(2)}`);
    }

    const margin = client.totalCost - pcmTotalForDomain;
    const pct = client.totalCost > 0 ? (margin / client.totalCost) * 100 : 0;
    console.log(`│ TOTAL PCM COST: $${pcmTotalForDomain.toFixed(2)} | MARGIN: $${margin.toFixed(2)} (${pct.toFixed(1)}%)`);
    console.log(`└────────────────────────\n`);
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SECTION 5: PRICE COMPARISON TIMELINE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('                     │ PostcardMania Charged Us │ We Charged Customers      │ Margin');
  console.log('Period               │ First Class │ Standard   │ First Class │ Standard    │ FC      │ Std');
  console.log('─────────────────────┼─────────────┼────────────┼─────────────┼─────────────┼─────────┼────────');

  // Era 1: We need to estimate what we charged. Use domain-era data.
  // Clients who were ONLY in Era 1 would have a clean rate.
  // Clients at $0.87/$0.63 blended who had Era 1 sends were probably at those rates.
  // Clients with high blended rates had Era 2 sends at higher rates.

  // For Era 3: we know it's $0.87/$0.63 (confirmed from rr_daily_metrics)
  // For Era 2: we can compute from the blended rates

  // Simple approach: compute implied customer rate per era
  for (const era of PCM_RATE_ERAS) {
    const eraKey = era.label;
    const eb = eraBuckets.get(eraKey);
    if (!eb || (eb.fcOrders + eb.stdOrders) === 0) continue;

    // Compute implied customer revenue for this era across all domains
    let eraRevenue = 0;
    let eraPieces = 0;
    let eraFcPieces = 0;
    let eraStdPieces = 0;

    for (const [domain, eraMap] of domainEraMap) {
      const de = eraMap.get(eraKey);
      if (!de) continue;

      const client = clientMap.get(domain);
      if (!client) continue;

      const domainPieces = de.fcOrders + de.stdOrders;
      eraPieces += domainPieces;
      eraFcPieces += de.fcOrders;
      eraStdPieces += de.stdOrders;

      // For this domain, estimate revenue attributed to this era
      // If domain only exists in one era, revenue = total_cost
      // If multiple eras, we need to apportion
      const totalDomainPcmSends = domainPcmSends.get(domain) || 0;
      const fractionInEra = totalDomainPcmSends > 0 ? domainPieces / totalDomainPcmSends : 0;

      // Simple pro-rata allocation based on piece count
      // (This is an approximation — true allocation would need per-send unit_cost)
      eraRevenue += client.totalCost * fractionInEra;
    }

    const impliedAvgRate = eraPieces > 0 ? eraRevenue / eraPieces : 0;
    // Estimate FC and Std rates (proportional split)
    // If we know the blended rate and the mix, we can estimate
    const fcFraction = eraFcPieces / (eraPieces || 1);
    const stdFraction = eraStdPieces / (eraPieces || 1);

    // For Era 3, we KNOW rates are $0.87/$0.63
    let impliedFc: number, impliedStd: number;
    if (eraKey.includes('Era 3')) {
      impliedFc = 0.87;
      impliedStd = 0.63;
    } else {
      // Estimate: if blended = fc_fraction * fc_rate + std_fraction * std_rate
      // and fc_rate / std_rate ≈ pcm_fc / pcm_std (same ratio as PCM)
      const pcmRatio = era.fcRate / era.stdRate;
      // blended = fc_frac * (std_rate * pcmRatio) + std_frac * std_rate
      // blended = std_rate * (fc_frac * pcmRatio + std_frac)
      const divisor = fcFraction * pcmRatio + stdFraction;
      impliedStd = divisor > 0 ? impliedAvgRate / divisor : impliedAvgRate;
      impliedFc = impliedStd * pcmRatio;
    }

    const fcMargin = impliedFc - era.fcRate;
    const stdMargin = impliedStd - era.stdRate;
    const totalMargin = eraRevenue - (eb.pcmTotalCost);
    const marginPct = eraRevenue > 0 ? (totalMargin / eraRevenue) * 100 : 0;

    const period = eraKey.padEnd(20);
    console.log(
      `${period} │ $${era.fcRate.toFixed(4).padStart(9)}   │ $${era.stdRate.toFixed(4).padStart(8)} │ $${impliedFc.toFixed(4).padStart(9)}   │ $${impliedStd.toFixed(4).padStart(9)}   │ $${fcMargin >= 0 ? '+' : ''}${fcMargin.toFixed(4)} │ $${stdMargin >= 0 ? '+' : ''}${stdMargin.toFixed(4)}`
    );
    console.log(
      `  ${eraPieces.toLocaleString()} pcs (${eraFcPieces} FC + ${eraStdPieces} Std) │ PCM Cost: $${eb.pcmTotalCost.toFixed(2).padStart(10)} │ Our Revenue: $${eraRevenue.toFixed(2).padStart(10)} │ Margin: $${totalMargin.toFixed(2)} (${marginPct.toFixed(1)}%)`
    );
    console.log('');
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SECTION 6: EXECUTIVE SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`Total mail pieces (all time): ${activeOrders.length.toLocaleString()}`);
  console.log(`  First Class: ${grandTotalFc.toLocaleString()}`);
  console.log(`  Standard: ${grandTotalStd.toLocaleString()}`);
  console.log('');
  console.log(`Total PCM cost (computed from invoices): $${grandTotalPcm.toFixed(2)}`);
  console.log(`Total customer revenue (from Aurora):    $${totalAuroraRevenue.toFixed(2)}`);
  console.log(`ALL-TIME GROSS MARGIN:                   $${overallMargin.toFixed(2)} (${overallMarginPct.toFixed(2)}%)`);
  console.log('');

  if (overallMargin > 0) {
    console.log('VERDICT: Overall the DM service has been PROFITABLE across all eras.');
  } else {
    console.log('VERDICT: Overall the DM service has been a NET LOSS.');
  }

  console.log('');
  console.log('KEY DATES:');
  console.log('  Jun 28, 2025 — PCM raised prices overnight (FC $0.94→$1.11, Std $0.74→$0.93)');
  console.log('  ~Nov 2025    — PCM prices dropped to current rates (FC $0.87, Std $0.63)');
  console.log('               — "Qual Credit" lines appeared on invoices');
  console.log('  Current      — We charge customers EXACTLY what PCM charges us = $0.00 margin');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  END OF REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Report failed:', err);
  process.exit(1);
});
