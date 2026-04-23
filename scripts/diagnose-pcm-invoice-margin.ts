/**
 * Diagnose PCM-invoice-authoritative margin.
 *
 * For every real (non-canceled, non-test) PCM order: apply invoice-verified
 * era rates and sum. Compare against Aurora's stored total_cost / total_pcm_cost.
 * This is what the Profitability widgets will show after the PCM-invoice rewrite.
 *
 * Usage: npx tsx scripts/diagnose-pcm-invoice-margin.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

// Load env the same way the other scripts do
const envPath = resolve(__dirname, '../backend/.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
try {
  const envLocalPath = resolve(__dirname, '../.env.local');
  const envLocalContent = readFileSync(envLocalPath, 'utf-8');
  for (const line of envLocalContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch { /* .env.local may not exist */ }

const RESOURCE_ARN = process.env.DB_AURORA_RESOURCE_ARN || '';
const SECRET_ARN = process.env.DB_AURORA_SECRET_ARN || '';
const DATABASE = process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db';

const client = new RDSDataClient({
  region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY || '',
  },
});

async function runQuery(sql: string): Promise<Record<string, unknown>[]> {
  const command = new ExecuteStatementCommand({
    resourceArn: RESOURCE_ARN, secretArn: SECRET_ARN, database: DATABASE, sql, includeResultMetadata: true,
  });
  const result = await client.send(command);
  const columns = result.columnMetadata?.map(c => c.name || '') || [];
  return (result.records || []).map(record => {
    const obj: Record<string, unknown> = {};
    record.forEach((field, i) => {
      const col = columns[i];
      if ('stringValue' in field) obj[col] = field.stringValue;
      else if ('longValue' in field) obj[col] = field.longValue;
      else if ('doubleValue' in field) obj[col] = field.doubleValue;
      else if ('booleanValue' in field) obj[col] = field.booleanValue;
      else if ('isNull' in field) obj[col] = null;
      else obj[col] = JSON.stringify(field);
    });
    return obj;
  });
}

// PCM invoice-verified era rates — must match src/lib/pcm-pricing-eras.ts
function pcmRate(dateISO: string, mc: 'fc' | 'std'): number {
  const month = dateISO.slice(0, 7);
  if (month <= '2025-06') return mc === 'fc' ? 0.94 : 0.74;
  if (month <= '2025-10') return mc === 'fc' ? 1.16 : 0.93;  // was 1.14 — fixed to invoice-verified 1.16
  return mc === 'fc' ? 0.87 : 0.63;
}

const TEST_DOMAINS = new Set([
  '8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3',
  'supertest_8020rei_com', 'sandbox_8020rei_com',
  'qapre_8020rei_com', 'testing5_8020rei_com', 'showcaseproductsecomllc_8020rei_com',
]);

// Fetch PCM orders via the live PCM API
async function fetchPcmOrders(): Promise<Array<{ date: string; mailClass: 'fc' | 'std'; domain: string; canceled: boolean; isTest: boolean }>> {
  const { pcmGet, isPcmConfigured } = await import('../src/lib/pcm-client');
  if (!isPcmConfigured()) {
    console.log('[diagnostic] PCM not configured — using empty order list');
    return [];
  }

  interface PcmOrder {
    orderID: number;
    status: string;
    mailClass?: string;
    orderDate?: string;
    extRefNbr?: string;
  }
  interface PcmResponse {
    results: PcmOrder[];
    pagination: { page: number; perPage: number; totalPages: number; totalResults: number };
  }

  const out: Array<{ date: string; mailClass: 'fc' | 'std'; domain: string; canceled: boolean; isTest: boolean }> = [];
  let page = 1;
  const perPage = 200;
  let totalPages = Infinity;
  console.log(`[diagnostic] Paginating PCM /order (perPage=${perPage})...`);
  while (page <= totalPages) {
    const resp = await pcmGet<PcmResponse>('/order', { page, perPage });
    totalPages = resp.pagination.totalPages;
    for (const o of resp.results) {
      const canceled = o.status?.toLowerCase() === 'canceled';
      const mailClass = (o.mailClass || '').toLowerCase();
      const mc: 'fc' | 'std' = mailClass.includes('first') ? 'fc' : 'std';
      const extRef = o.extRefNbr || '';
      const m = extRef.match(/^(.+)-\d+$/);
      const domain = m ? m[1] : extRef;
      const date = (o.orderDate || '').slice(0, 10);
      const isTest = TEST_DOMAINS.has(domain);
      out.push({ date, mailClass: mc, domain, canceled, isTest });
    }
    if (page % 10 === 0) console.log(`  page ${page}/${totalPages} — ${out.length} orders`);
    page++;
  }
  console.log(`[diagnostic] Fetched ${out.length} PCM orders (${totalPages} pages)\n`);
  return out;
}

function computePcmInvoiceCost(orders: Array<{ date: string; mailClass: 'fc' | 'std' }>): number {
  let total = 0;
  for (const o of orders) total += pcmRate(o.date, o.mailClass);
  return Math.round(total * 100) / 100;
}

async function main() {
  console.log('=== PCM-Invoice-Authoritative Margin Diagnostic ===\n');

  const orders = await fetchPcmOrders();
  const realOrders = orders.filter(o => !o.canceled && !o.isTest);
  const testOrders = orders.filter(o => !o.canceled && o.isTest);

  console.log(`Total PCM orders: ${orders.length}`);
  console.log(`  Canceled: ${orders.filter(o => o.canceled).length}`);
  console.log(`  Real (non-canceled, non-test): ${realOrders.length}`);
  console.log(`  Test: ${testOrders.length}\n`);

  // All-time PCM-invoice cost
  const pcmCostInvoiceAllTime = computePcmInvoiceCost(realOrders);
  console.log(`ALL-TIME PCM invoice cost (real orders × era rates): $${pcmCostInvoiceAllTime.toFixed(2)}`);

  // Aurora all-time revenue + stored PCM cost for comparison
  const aurAllTime = await runQuery(`
    SELECT
      COALESCE(SUM(f.total_cost), 0) as revenue,
      COALESCE(SUM(f.total_pcm_cost), 0) as aurora_pcm_cost,
      COALESCE(SUM(f.total_sends), 0) as sends
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT domain, MAX(date) as md FROM dm_client_funnel
      WHERE domain IS NOT NULL AND domain NOT IN (${[...TEST_DOMAINS].map(d => `'${d}'`).join(', ')})
      GROUP BY domain
    ) latest ON f.domain = latest.domain AND f.date = latest.md
    WHERE f.domain IS NOT NULL AND f.domain NOT IN (${[...TEST_DOMAINS].map(d => `'${d}'`).join(', ')})
  `);
  const revAT = Number(aurAllTime[0]?.revenue || 0);
  const aurPcmAT = Number(aurAllTime[0]?.aurora_pcm_cost || 0);
  const sendsAT = Number(aurAllTime[0]?.sends || 0);

  console.log(`ALL-TIME Aurora revenue: $${revAT.toFixed(2)}`);
  console.log(`ALL-TIME Aurora stored PCM cost: $${aurPcmAT.toFixed(2)}`);
  console.log(`ALL-TIME Aurora sends: ${sendsAT}\n`);

  const marginATInvoice = revAT - pcmCostInvoiceAllTime;
  const marginPctATInvoice = revAT > 0 ? (marginATInvoice / revAT) * 100 : 0;
  const marginATAurora = revAT - aurPcmAT;
  const marginPctATAurora = revAT > 0 ? (marginATAurora / revAT) * 100 : 0;

  console.log('\nWIDGET WILL SHOW (All-time Margin summary):');
  console.log(`  Revenue: $${revAT.toFixed(2)}`);
  console.log(`  PCM cost (invoice-authoritative): $${pcmCostInvoiceAllTime.toFixed(2)}`);
  console.log(`  Gross margin: $${marginATInvoice.toFixed(2)}`);
  console.log(`  Margin %: ${marginPctATInvoice.toFixed(1)}%`);
  console.log(`  Aurora stored PCM cost (reconciliation): $${aurPcmAT.toFixed(2)}`);
  console.log(`  Delta (PCM-invoice − Aurora stored): $${(pcmCostInvoiceAllTime - aurPcmAT).toFixed(2)}`);
  console.log(`  Aurora-stored margin (would have been): $${marginATAurora.toFixed(2)} (${marginPctATAurora.toFixed(1)}%)`);

  // --- Period summary diagnostic (matching new per-day-split algorithm) ---
  // Per-day: split sends into FC/Std via blended customer rate vs era customer rates,
  // then apply era PCM rate. This is what the new route does.
  const dailyRows = await runQuery(`
    SELECT
      date::date as d,
      SUM(daily_sends) as pieces,
      SUM(daily_cost) as revenue,
      SUM(daily_pcm_cost) as aurora_pcm_cost
    FROM dm_volume_summary
    WHERE (mail_class = 'all' OR mail_class IS NULL)
      AND daily_sends > 0
      AND domain NOT IN (${[...TEST_DOMAINS].map(d => `'${d}'`).join(', ')})
      AND date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY date::date
    ORDER BY date::date
  `);

  function splitDay(dateISO: string, pieces: number, blendedRate: number): { fc: number; std: number } {
    const customerFc: number = dateISO <= '2026-01-15' ? 1.39 : 0.87;
    const customerStd: number = dateISO <= '2026-01-15' ? 1.08 : 0.63;
    if (pieces <= 0) return { fc: 0, std: 0 };
    if (Math.abs(customerFc - customerStd) < 0.005) return { fc: pieces, std: 0 };
    if (blendedRate >= customerFc - 0.01) return { fc: pieces, std: 0 };
    if (blendedRate <= customerStd + 0.01) return { fc: 0, std: pieces };
    const fcFraction = (blendedRate - customerStd) / (customerFc - customerStd);
    const fc = Math.max(0, Math.min(pieces, pieces * fcFraction));
    return { fc, std: pieces - fc };
  }

  let rev30 = 0, sends30 = 0, pcmCostInvoice30 = 0, aurPcm30 = 0;
  let fcTotal = 0, stdTotal = 0;
  for (const r of dailyRows) {
    const date = String(r.d).slice(0, 10);
    const pieces = Number(r.pieces || 0);
    const revenue = Number(r.revenue || 0);
    const aurPcm = Number(r.aurora_pcm_cost || 0);
    rev30 += revenue;
    sends30 += pieces;
    aurPcm30 += aurPcm;
    if (pieces <= 0) continue;
    const blended = revenue / pieces;
    const { fc, std } = splitDay(date, pieces, blended);
    fcTotal += fc;
    stdTotal += std;
    pcmCostInvoice30 += fc * pcmRate(date, 'fc') + std * pcmRate(date, 'std');
  }
  pcmCostInvoice30 = Math.round(pcmCostInvoice30 * 100) / 100;

  console.log('\nWIDGET WILL SHOW (Period summary · Last 30 days — NEW per-day-split algorithm):');
  console.log(`  Revenue: $${rev30.toFixed(2)} (${sends30} Aurora sends)`);
  console.log(`  Classified: ${fcTotal.toFixed(0)} FC pieces, ${stdTotal.toFixed(0)} Std pieces`);
  console.log(`  PCM cost (invoice-authoritative, per-day-split): $${pcmCostInvoice30.toFixed(2)}`);
  console.log(`  Gross margin: $${(rev30 - pcmCostInvoice30).toFixed(2)}`);
  console.log(`  Margin %: ${rev30 > 0 ? ((rev30 - pcmCostInvoice30) / rev30 * 100).toFixed(1) : '0'}%`);
  console.log(`  Aurora stored PCM cost: $${aurPcm30.toFixed(2)}`);
  console.log(`  Delta (PCM-invoice − Aurora stored): $${(pcmCostInvoice30 - aurPcm30).toFixed(2)}`);

  console.log('\n=== KEY CHECK ===');
  console.log('Pricing overview / history says: current era → ZERO margin ($0.87/$0.63 customer = $0.87/$0.63 PCM)');
  console.log(`Period margin over last 30 days: $${(rev30 - pcmCostInvoice30).toFixed(2)} (${rev30 > 0 ? ((rev30 - pcmCostInvoice30) / rev30 * 100).toFixed(1) : '0'}%)`);
  console.log(`→ ${Math.abs(rev30 - pcmCostInvoice30) < 5 ? 'PASS — matches zero-margin narrative' : 'FAIL — still contradicts Pricing overview'}`);
  console.log('\n=== END ===');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
