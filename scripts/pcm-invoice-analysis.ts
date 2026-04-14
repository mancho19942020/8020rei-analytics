/**
 * PCM Invoice Analysis — Find when prices changed
 *
 * Downloads batch invoices from PCM across different time periods
 * to identify the exact date of any price increase.
 *
 * Usage: npx tsx scripts/pcm-invoice-analysis.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

// Load .env
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

let cachedToken: string | null = null;

async function authenticate(): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await fetch(`${PCM_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ apiKey: PCM_API_KEY, apiSecret: PCM_API_SECRET }),
  });
  if (!res.ok) throw new Error(`PCM auth failed: ${res.status}`);
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
  if (!res.ok) throw new Error(`PCM GET ${path} failed: ${res.status}`);
  return res.json();
}

async function main() {
  console.log('=== PCM Batch Invoice Analysis — Price Change Detection ===\n');

  // Step 1: Fetch ALL batches to get the full timeline
  console.log('Fetching all batches...');
  const allBatches: any[] = [];
  let page = 1;

  while (true) {
    const response = await pcmGet<any>('/batch', {
      page: String(page),
      perPage: '100',
    });
    const batches = response.results || [];
    if (batches.length === 0) break;
    allBatches.push(...batches);
    if (page >= (response.pagination?.totalPages || 1)) break;
    page++;
  }

  console.log(`Total batches: ${allBatches.length}\n`);

  // Sort by date
  allBatches.sort((a, b) => {
    const da = new Date(a.createdDate || a.createdOn).getTime();
    const db = new Date(b.createdDate || b.createdOn).getTime();
    return da - db;
  });

  // Show the full batch timeline
  console.log('=== BATCH TIMELINE ===\n');
  console.log('Batch ID | Created Date    | Status       | Invoice URL');
  console.log('---------|-----------------|--------------|------------');

  for (const batch of allBatches) {
    const date = (batch.createdDate || batch.createdOn || '').split('T')[0];
    const status = (batch.status || '').padEnd(12);
    const hasInvoice = batch.invoiceURL ? 'YES' : 'NO';
    console.log(`${String(batch.batchID).padEnd(8)} | ${date.padEnd(15)} | ${status} | ${hasInvoice}`);
  }

  // Step 2: Download sample invoices across different time periods
  // Pick ~10-15 invoices spread evenly across the timeline
  const batchesWithInvoice = allBatches.filter((b: any) => b.invoiceURL);
  console.log(`\nBatches with invoices: ${batchesWithInvoice.length}`);

  if (batchesWithInvoice.length === 0) {
    console.log('No invoices available. Cannot determine pricing from invoices.');
    return;
  }

  // Sample evenly: pick every Nth batch
  const sampleSize = Math.min(20, batchesWithInvoice.length);
  const step = Math.max(1, Math.floor(batchesWithInvoice.length / sampleSize));
  const sampledBatches = [];
  for (let i = 0; i < batchesWithInvoice.length; i += step) {
    sampledBatches.push(batchesWithInvoice[i]);
  }
  // Always include first and last
  if (!sampledBatches.includes(batchesWithInvoice[0])) {
    sampledBatches.unshift(batchesWithInvoice[0]);
  }
  if (!sampledBatches.includes(batchesWithInvoice[batchesWithInvoice.length - 1])) {
    sampledBatches.push(batchesWithInvoice[batchesWithInvoice.length - 1]);
  }

  console.log(`\nSampling ${sampledBatches.length} invoices across the timeline...\n`);

  // Create output directory for invoices
  const invoiceDir = resolve(__dirname, '../tmp/pcm-invoices');
  mkdirSync(invoiceDir, { recursive: true });

  // Download each invoice
  for (const batch of sampledBatches) {
    const batchId = batch.batchID;
    const date = (batch.createdDate || batch.createdOn || '').split('T')[0];
    const invoiceUrl = batch.invoiceURL;

    console.log(`Downloading invoice for batch ${batchId} (${date})...`);

    try {
      const res = await fetch(invoiceUrl);
      if (!res.ok) {
        console.log(`  Failed: ${res.status}`);
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = contentType.includes('pdf') ? 'pdf' : 'bin';
      const filename = `batch_${batchId}_${date}.${ext}`;
      const filepath = resolve(invoiceDir, filename);
      writeFileSync(filepath, buffer);
      console.log(`  Saved: ${filepath} (${buffer.length} bytes)`);
    } catch (err: any) {
      console.log(`  Error: ${err.message}`);
    }
  }

  console.log(`\nInvoices saved to: ${invoiceDir}`);
  console.log('\nNext step: Open the PDF invoices to compare per-piece pricing across dates.');

  // Step 3: Also check if batch detail endpoints have more info
  console.log('\n=== CHECKING BATCH ORDER DETAILS FOR COST DATA ===\n');

  // Check 3 batches from different periods for order-level cost data
  const checkBatches = [
    batchesWithInvoice[0],  // earliest
    batchesWithInvoice[Math.floor(batchesWithInvoice.length / 2)],  // middle
    batchesWithInvoice[batchesWithInvoice.length - 1],  // latest
  ];

  for (const batch of checkBatches) {
    const batchId = batch.batchID;
    const date = (batch.createdDate || batch.createdOn || '').split('T')[0];

    console.log(`\nBatch ${batchId} (${date}) — checking orders...`);

    try {
      // Get orders in this batch
      const ordersRes = await pcmGet<any>(`/batch/${batchId}/orders`, {
        page: '1',
        perPage: '3',
      });

      const orders = ordersRes.results || ordersRes || [];
      console.log(`  Orders in batch: ${ordersRes.pagination?.totalResults || 'unknown'}`);

      if (Array.isArray(orders) && orders.length > 0) {
        console.log(`  Sample order fields: ${Object.keys(orders[0]).join(', ')}`);
        // Look for any cost/price/amount fields
        const order = orders[0];
        for (const [key, val] of Object.entries(order)) {
          if (
            typeof val === 'number' ||
            (typeof key === 'string' && (
              key.toLowerCase().includes('cost') ||
              key.toLowerCase().includes('price') ||
              key.toLowerCase().includes('amount') ||
              key.toLowerCase().includes('charge') ||
              key.toLowerCase().includes('rate') ||
              key.toLowerCase().includes('total') ||
              key.toLowerCase().includes('fee')
            ))
          ) {
            console.log(`  ${key}: ${JSON.stringify(val)}`);
          }
        }
      }
    } catch (err: any) {
      console.log(`  Error: ${err.message}`);
    }

    // Also check batch recipients for cost data
    try {
      const recipRes = await pcmGet<any>(`/batch/${batchId}/recipients`, {
        page: '1',
        perPage: '2',
      });
      const recips = recipRes.results || [];
      if (recips.length > 0) {
        console.log(`  Recipient fields: ${Object.keys(recips[0]).join(', ')}`);
      }
    } catch (err: any) {
      // silent
    }
  }

  console.log('\n=== DONE ===');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
