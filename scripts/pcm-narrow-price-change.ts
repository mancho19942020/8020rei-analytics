/**
 * Narrow down the exact PCM price change date
 * Downloads invoices between June 19 - July 4, 2025
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

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
let cachedToken: string | null = null;

async function authenticate(): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await fetch(`${PCM_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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

async function main() {
  console.log('=== Narrowing PCM Price Change Date ===\n');

  // Fetch all batches
  const allBatches: any[] = [];
  let page = 1;
  while (true) {
    const response = await pcmGet<any>('/batch', { page: String(page), perPage: '100' });
    const batches = response.results || [];
    if (batches.length === 0) break;
    allBatches.push(...batches);
    if (page >= (response.pagination?.totalPages || 1)) break;
    page++;
  }

  // Sort by date
  allBatches.sort((a: any, b: any) =>
    new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
  );

  // Filter to June 15 - July 25, 2025 (the price change window)
  const windowStart = new Date('2025-06-15').getTime();
  const windowEnd = new Date('2025-07-25').getTime();

  const windowBatches = allBatches.filter((b: any) => {
    const d = new Date(b.createdDate).getTime();
    return d >= windowStart && d <= windowEnd && b.invoiceURL;
  });

  console.log(`Batches in Jun 15 - Jul 25, 2025 window: ${windowBatches.length}\n`);

  const invoiceDir = resolve(__dirname, '../tmp/pcm-invoices/price-change-window');
  mkdirSync(invoiceDir, { recursive: true });

  for (const batch of windowBatches) {
    const batchId = batch.batchID;
    const date = (batch.createdDate || '').split('T')[0];

    console.log(`Downloading batch ${batchId} (${date})...`);
    try {
      const res = await fetch(batch.invoiceURL);
      if (!res.ok) { console.log(`  Failed: ${res.status}`); continue; }
      const buffer = Buffer.from(await res.arrayBuffer());
      const filename = `batch_${batchId}_${date}.pdf`;
      writeFileSync(resolve(invoiceDir, filename), buffer);
      console.log(`  Saved (${buffer.length} bytes)`);
    } catch (err: any) {
      console.log(`  Error: ${err.message}`);
    }
  }

  console.log(`\nAll invoices saved to: ${invoiceDir}`);

  // List them
  console.log('\nBatches to examine:');
  for (const b of windowBatches) {
    const date = (b.createdDate || '').split('T')[0];
    console.log(`  Batch ${b.batchID} — ${date}`);
  }
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });
