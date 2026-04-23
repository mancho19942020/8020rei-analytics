/**
 * PCM Cost Analysis Report — 90-Day Pricing Comparison
 *
 * Pulls all PCM orders from the last 90 days and compares:
 * - What we charge customers (our unit_cost)
 * - What PCM charges us (their amount per piece)
 * - Identifies when price changes occurred
 *
 * Usage: npx tsx scripts/pcm-cost-report.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually from backend/
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

const PCM_BASE_URL = 'https://v3.pcmintegrations.com';
const PCM_API_KEY = process.env.PCM_API_KEY!;
const PCM_API_SECRET = process.env.PCM_API_SECRET!;

// What WE charge customers
const OUR_PRICES = {
  standard: 0.63,
  first_class: 0.87,
};

// Original PCM agreement prices (before any increase)
const ORIGINAL_PCM_PRICES = {
  standard: 0.6010,
  first_class: 0.8400,
};

let cachedToken: string | null = null;

async function authenticate(): Promise<string> {
  if (cachedToken) return cachedToken;

  const res = await fetch(`${PCM_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ apiKey: PCM_API_KEY, apiSecret: PCM_API_SECRET }),
  });

  if (!res.ok) {
    throw new Error(`PCM auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { token: string };
  cachedToken = data.token;
  return cachedToken;
}

async function pcmGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await authenticate();
  const url = new URL(`${PCM_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`PCM GET ${path} failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

function formatCurrency(n: number): string {
  return `$${n.toFixed(4)}`;
}

function formatDate(iso: string): string {
  return iso.split('T')[0];
}

async function main() {
  console.log('=== PCM Cost Analysis Report — 90-Day Window ===\n');

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const startDate = ninetyDaysAgo.toISOString().split('T')[0];

  console.log(`Date range: ${startDate} to ${now.toISOString().split('T')[0]}`);
  console.log(`Our prices: Standard ${formatCurrency(OUR_PRICES.standard)}, First Class ${formatCurrency(OUR_PRICES.first_class)}`);
  console.log(`Original PCM agreement: Standard ${formatCurrency(ORIGINAL_PCM_PRICES.standard)}, First Class ${formatCurrency(ORIGINAL_PCM_PRICES.first_class)}\n`);

  // First, let's look at a single order in detail to understand the full shape
  console.log('--- Exploring order data shape ---');
  const firstPage = await pcmGet<any>('/order', {
    orderedAfter: startDate,
    page: '1',
    perPage: '3',
  });

  console.log('Pagination:', JSON.stringify(firstPage.pagination, null, 2));
  console.log('\nFirst 3 orders (full fields):');
  for (const order of (firstPage.results || []).slice(0, 3)) {
    console.log(JSON.stringify(order, null, 2));
    console.log('---');
  }

  // Also check a single order endpoint for more detail
  if (firstPage.results && firstPage.results.length > 0) {
    const orderId = firstPage.results[0].orderID;
    console.log(`\nDetailed single order GET /order/${orderId}:`);
    try {
      const detail = await pcmGet<any>(`/order/${orderId}`);
      console.log(JSON.stringify(detail, null, 2));
    } catch (e: any) {
      console.log('Error:', e.message);
    }
  }

  // Check balance endpoint for cost data
  console.log('\n--- Account Balance ---');
  try {
    const balance = await pcmGet<any>('/integration/balance');
    console.log(JSON.stringify(balance, null, 2));
  } catch (e: any) {
    console.log('Error:', e.message);
  }

  // Check batches for cost data
  console.log('\n--- Recent Batches (first 3) ---');
  try {
    const batches = await pcmGet<any>('/batch', { page: '1', perPage: '3' });
    console.log('Pagination:', JSON.stringify(batches.pagination, null, 2));
    for (const batch of (batches.results || []).slice(0, 3)) {
      console.log(JSON.stringify(batch, null, 2));
      console.log('---');
    }

    // Get detail on first batch
    if (batches.results && batches.results.length > 0) {
      const batchId = batches.results[0].batchID;
      console.log(`\nDetailed single batch GET /batch/${batchId}:`);
      const batchDetail = await pcmGet<any>(`/batch/${batchId}`);
      console.log(JSON.stringify(batchDetail, null, 2));
    }
  } catch (e: any) {
    console.log('Error:', e.message);
  }

  // Now let's do the actual analysis with the data we have
  // Each order = 1 piece, mailClass tells us Standard vs FirstClass
  console.log('\n\n=== FULL 90-DAY ORDER ANALYSIS ===\n');
  console.log('Fetching all orders (this takes a while with ~24K orders)...');

  const allOrders: any[] = [];
  let page = 1;
  const perPage = 100;
  let totalPages = 999;

  while (page <= totalPages) {
    if (page % 50 === 0) console.log(`  Page ${page}/${totalPages}...`);
    const response = await pcmGet<any>('/order', {
      orderedAfter: startDate,
      page: String(page),
      perPage: String(perPage),
    });

    const orders = response.results || [];
    if (orders.length === 0) break;

    allOrders.push(...orders);
    totalPages = response.pagination?.totalPages || totalPages;
    if (page >= totalPages) break;
    page++;
  }

  console.log(`Total orders fetched: ${allOrders.length}\n`);

  // Filter non-canceled
  const activeOrders = allOrders.filter((o: any) => {
    const status = (o.status || '').toLowerCase();
    return status !== 'canceled' && status !== 'cancelled';
  });

  // Classify by mail class
  const standardOrders = activeOrders.filter((o: any) => (o.mailClass || '').toLowerCase().includes('standard'));
  const firstClassOrders = activeOrders.filter((o: any) => (o.mailClass || '').toLowerCase().includes('first'));

  console.log(`Active orders: ${activeOrders.length}`);
  console.log(`  Standard: ${standardOrders.length}`);
  console.log(`  First Class: ${firstClassOrders.length}`);

  // Check if orders have amount/cost fields
  const sampleFields = Object.keys(activeOrders[0] || {});
  const costFields = sampleFields.filter(f =>
    f.toLowerCase().includes('cost') ||
    f.toLowerCase().includes('amount') ||
    f.toLowerCase().includes('price') ||
    f.toLowerCase().includes('charge') ||
    f.toLowerCase().includes('total')
  );
  console.log(`\nPotential cost-related fields found: ${costFields.length > 0 ? costFields.join(', ') : 'NONE'}`);
  console.log(`All fields on order: ${sampleFields.join(', ')}`);

  // Group by week and mail class for trend analysis
  console.log('\n=== WEEKLY VOLUME TREND ===\n');

  interface WeekBucket {
    standard: number;
    firstClass: number;
    canceled: number;
    statuses: Record<string, number>;
  }

  const weeklyData = new Map<string, WeekBucket>();

  for (const order of allOrders) {
    const dateStr = order.orderDate || order.orderedOn;
    if (!dateStr) continue;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) continue;

    // Get ISO week Monday
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
    const weekKey = monday.toISOString().split('T')[0];

    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, { standard: 0, firstClass: 0, canceled: 0, statuses: {} });
    }

    const week = weeklyData.get(weekKey)!;
    const status = (order.status || '').toLowerCase();
    week.statuses[status] = (week.statuses[status] || 0) + 1;

    if (status === 'canceled' || status === 'cancelled') {
      week.canceled++;
      continue;
    }

    const mc = (order.mailClass || '').toLowerCase();
    if (mc.includes('first')) {
      week.firstClass++;
    } else {
      week.standard++;
    }
  }

  const sortedWeeks = [...weeklyData.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  console.log('Week Starting  | Standard | First Class | Canceled | Est Std Cost | Est FC Cost | Est Total');
  console.log('---------------|----------|-------------|----------|-------------|-------------|----------');

  let grandTotalStd = 0;
  let grandTotalFc = 0;

  for (const [week, data] of sortedWeeks) {
    grandTotalStd += data.standard;
    grandTotalFc += data.firstClass;

    // We don't have PCM per-order cost from the API. So we'll compute with known rates.
    // The question is: which PCM rate applies to each period?
    const estStdCost = data.standard * 0.625; // Current known PCM standard rate
    const estFcCost = data.firstClass * 0.875; // Current known PCM FC rate
    const estTotal = estStdCost + estFcCost;

    console.log(
      `${week}  | ${String(data.standard).padStart(8)} | ${String(data.firstClass).padStart(11)} | ${String(data.canceled).padStart(8)} | $${estStdCost.toFixed(2).padStart(10)} | $${estFcCost.toFixed(2).padStart(10)} | $${estTotal.toFixed(2).padStart(9)}`
    );
  }

  // ---- OVERALL SUMMARY ----
  console.log('\n\n=== OVERALL 90-DAY FINANCIAL SUMMARY ===\n');

  const totalStd = standardOrders.length;
  const totalFc = firstClassOrders.length;
  const totalActive = activeOrders.length;

  // What WE charged customers
  const ourStdRevenue = totalStd * OUR_PRICES.standard;
  const ourFcRevenue = totalFc * OUR_PRICES.first_class;
  const ourTotalRevenue = ourStdRevenue + ourFcRevenue;

  // Current PCM rates (from handoff doc: $0.625 standard, $0.875 first class)
  const pcmStdRate = 0.625;
  const pcmFcRate = 0.875;
  const pcmStdCost = totalStd * pcmStdRate;
  const pcmFcCost = totalFc * pcmFcRate;
  const pcmTotalCost = pcmStdCost + pcmFcCost;

  // Original agreement rates
  const origStdCost = totalStd * ORIGINAL_PCM_PRICES.standard;
  const origFcCost = totalFc * ORIGINAL_PCM_PRICES.first_class;
  const origTotalCost = origStdCost + origFcCost;

  console.log('MAIL VOLUME (90 days)');
  console.log(`  Total active orders:   ${totalActive.toLocaleString()}`);
  console.log(`  Standard mail:         ${totalStd.toLocaleString()}`);
  console.log(`  First Class mail:      ${totalFc.toLocaleString()}`);
  console.log('');

  console.log('WHAT WE CHARGE CUSTOMERS');
  console.log(`  Standard (${totalStd} × $0.63):    $${ourStdRevenue.toFixed(2)}`);
  console.log(`  First Class (${totalFc} × $0.87):  $${ourFcRevenue.toFixed(2)}`);
  console.log(`  TOTAL REVENUE:                     $${ourTotalRevenue.toFixed(2)}`);
  console.log('');

  console.log('WHAT PCM CHARGES US (Current Rates)');
  console.log(`  Standard (${totalStd} × $0.6250):  $${pcmStdCost.toFixed(2)}`);
  console.log(`  First Class (${totalFc} × $0.8750): $${pcmFcCost.toFixed(2)}`);
  console.log(`  TOTAL PCM COST:                    $${pcmTotalCost.toFixed(2)}`);
  console.log('');

  const actualMargin = ourTotalRevenue - pcmTotalCost;
  const actualMarginPct = (actualMargin / ourTotalRevenue) * 100;

  console.log('ACTUAL MARGIN (Current PCM Rates)');
  console.log(`  Standard margin:  $${(ourStdRevenue - pcmStdCost).toFixed(2)} (${(((OUR_PRICES.standard - pcmStdRate) / OUR_PRICES.standard) * 100).toFixed(2)}% per piece → $${(OUR_PRICES.standard - pcmStdRate).toFixed(4)}/piece)`);
  console.log(`  First Class margin: $${(ourFcRevenue - pcmFcCost).toFixed(2)} (${(((OUR_PRICES.first_class - pcmFcRate) / OUR_PRICES.first_class) * 100).toFixed(2)}% per piece → $${(OUR_PRICES.first_class - pcmFcRate).toFixed(4)}/piece)`);
  console.log(`  TOTAL MARGIN:     $${actualMargin.toFixed(2)} (${actualMarginPct.toFixed(2)}%)`);
  console.log('');

  console.log('IF PCM WERE STILL AT ORIGINAL AGREEMENT RATES');
  console.log(`  Standard (${totalStd} × $0.6010):  $${origStdCost.toFixed(2)}`);
  console.log(`  First Class (${totalFc} × $0.8400): $${origFcCost.toFixed(2)}`);
  console.log(`  Total PCM cost would be:           $${origTotalCost.toFixed(2)}`);

  const wouldBeMargin = ourTotalRevenue - origTotalCost;
  const wouldBePct = (wouldBeMargin / ourTotalRevenue) * 100;
  console.log(`  Margin would be:                   $${wouldBeMargin.toFixed(2)} (${wouldBePct.toFixed(2)}%)`);
  console.log('');

  const lostMargin = wouldBeMargin - actualMargin;
  console.log('IMPACT OF PCM PRICE INCREASE');
  console.log(`  Extra cost due to PCM increase:    $${lostMargin.toFixed(2)}`);
  console.log(`  Standard increase: $0.6010 → $0.6250 = +$0.024/piece × ${totalStd} = $${(totalStd * 0.024).toFixed(2)}`);
  console.log(`  First Class increase: $0.8400 → $0.8750 = +$0.035/piece × ${totalFc} = $${(totalFc * 0.035).toFixed(2)}`);
  console.log('');

  console.log('PER-PIECE MARGIN BREAKDOWN');
  console.log('');
  console.log('                    | Our Price | PCM Cost  | Margin/pc | Margin %');
  console.log('--------------------|-----------|-----------|-----------|----------');
  console.log(`Standard (current)  | $0.6300   | $0.6250   | $0.0050   | ${((0.005/0.63)*100).toFixed(2)}%`);
  console.log(`Standard (original) | $0.6300   | $0.6010   | $0.0290   | ${((0.029/0.63)*100).toFixed(2)}%`);
  console.log(`First Cl (current)  | $0.8700   | $0.8750   | -$0.0050  | ${((-0.005/0.87)*100).toFixed(2)}%`);
  console.log(`First Cl (original) | $0.8700   | $0.8400   | $0.0300   | ${((0.03/0.87)*100).toFixed(2)}%`);
  console.log('');

  // ---- STATUS DISTRIBUTION ----
  console.log('=== ORDER STATUS DISTRIBUTION ===\n');
  const statusCounts: Record<string, number> = {};
  for (const order of allOrders) {
    const s = order.status || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  for (const [status, count] of sortedStatuses) {
    console.log(`  ${status.padEnd(20)} ${count.toLocaleString()}`);
  }

  // ---- RECOMMENDATIONS ----
  console.log('\n\n=== RECOMMENDATIONS FOR CAMILO ===\n');
  console.log('PROBLEM:');
  console.log('  PCM raised prices from the original agreement without notice.');
  console.log(`  Standard: $0.6010 → $0.6250 (+$0.024, +4.0%)`);
  console.log(`  First Class: $0.8400 → $0.8750 (+$0.035, +4.2%)`);
  console.log('');
  console.log('IMPACT (last 90 days):');
  console.log(`  We are LOSING money on every First Class piece (-$0.005/piece)`);
  console.log(`  Standard margin is nearly zero ($0.005/piece, 0.79%)`);
  console.log(`  Lost margin vs original agreement: $${lostMargin.toFixed(2)}`);
  console.log('');
  console.log('OPTIONS:');
  console.log('  a) Raise our prices to customers:');
  console.log('     - Standard: $0.63 → $0.66 (5.6% margin = $0.035/piece)');
  console.log('     - First Class: $0.87 → $0.92 (5.4% margin = $0.045/piece)');
  console.log('  b) Negotiate with PCM for volume discount (we do ~24K pieces/90 days)');
  console.log('  c) Both — raise prices AND negotiate volume pricing');
  console.log('  d) Switch First Class campaigns to Standard where possible');
  console.log('');
  console.log('NOTE: The PCM API does not expose per-order cost amounts. The cost');
  console.log('analysis above uses the rates from the handoff document ($0.625/$0.875).');
  console.log('To determine the EXACT date of the price change, we would need to:');
  console.log('  1. Check PCM invoices/billing statements directly, OR');
  console.log('  2. Check the monolith parameters table history for when pcm_cost changed');

  console.log('\n=== END REPORT ===');
}

main().catch(err => {
  console.error('Report failed:', err);
  process.exit(1);
});
