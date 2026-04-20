/**
 * Sanity-check PCM /order pagination and filter params before the Overview
 * route relies on them. Prints totalResults with and without filterStatus.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../backend/.env');
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq > 0) {
    const key = t.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = t.slice(eq + 1).trim();
  }
}

const PCM = 'https://v3.pcmintegrations.com';

async function auth() {
  const r = await fetch(`${PCM}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ apiKey: process.env.PCM_API_KEY, apiSecret: process.env.PCM_API_SECRET }),
  });
  return ((await r.json()) as { token: string }).token;
}

(async () => {
  const token = await auth();

  async function get(path: string, params: Record<string, string> = {}) {
    const url = new URL(`${PCM}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    return r.json();
  }

  const none = await get('/order', { page: '1', perPage: '1' });
  console.log('no filter: totalResults =', (none as { pagination: { totalResults: number } }).pagination?.totalResults);

  const canceled = await get('/order', { page: '1', perPage: '1', filterStatus: 'Canceled' });
  console.log('filterStatus=Canceled: totalResults =', (canceled as { pagination: { totalResults: number } }).pagination?.totalResults);

  // Also try alternate casing
  const canceledLC = await get('/order', { page: '1', perPage: '1', filterStatus: 'canceled' });
  console.log('filterStatus=canceled (lc): totalResults =', (canceledLC as { pagination: { totalResults: number } }).pagination?.totalResults);

  // First result shape
  const firstOrder = await get('/order', { page: '1', perPage: '1' });
  console.log('first order shape:');
  console.log(JSON.stringify((firstOrder as { results: unknown[] }).results[0], null, 2));
})();
