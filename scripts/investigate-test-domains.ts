/**
 * Inventory test-environment PCM activity.
 *
 * Camilo (Apr 17, 2026 meeting) wants test-env sends surfaced as an internal
 * COST (not hidden), since they're real money paid to PCM with no client
 * revenue. This script reports what's actually sitting in each test domain
 * so we can size the impact for the Overview redesign.
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
let token: string | null = null;
async function auth() {
  if (token) return token;
  const r = await fetch(`${PCM}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ apiKey: process.env.PCM_API_KEY, apiSecret: process.env.PCM_API_SECRET }),
  });
  token = ((await r.json()) as { token: string }).token;
  return token!;
}
async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const t = await auth();
  const url = new URL(`${PCM}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' } });
  return r.json() as Promise<T>;
}

const TEST_DOMAINS = new Set([
  '8020rei_demo',
  '8020rei_migracion_test',
  '_test_debug',
  '_test_debug3',
  'supertest_8020rei_com',
  'sandbox_8020rei_com',
  'qapre_8020rei_com',
  'testing5_8020rei_com',
  'showcaseproductsecomllc_8020rei_com',
]);

function extractDomain(extRefNbr: string): string {
  const m = extRefNbr.match(/^(.+)-\d+$/);
  return m ? m[1] : extRefNbr;
}

function pcmRate(dateISO: string, mc: 'fc' | 'std'): number {
  if (dateISO <= '2025-06-27') return mc === 'fc' ? 0.94 : 0.74;
  if (dateISO <= '2025-10-31') return mc === 'fc' ? 1.14 : 0.93;
  return mc === 'fc' ? 0.87 : 0.63;
}

(async () => {
  console.log('Fetching PCM /order (all 25K+ orders)…');
  const all: { status: string; extRefNbr: string; orderDate: string; mailClass: string }[] = [];
  let page = 1;
  let totalPages = 999;
  while (page <= totalPages) {
    const r = await get<{ results: { status?: string; extRefNbr?: string; orderDate?: string; mailClass?: string }[]; pagination: { totalPages: number } }>(
      '/order',
      { page: String(page), perPage: '100' }
    );
    if (!r.results?.length) break;
    for (const o of r.results) {
      all.push({
        status: String(o.status || ''),
        extRefNbr: String(o.extRefNbr || ''),
        orderDate: String(o.orderDate || ''),
        mailClass: String(o.mailClass || ''),
      });
    }
    totalPages = r.pagination?.totalPages || totalPages;
    if (page >= totalPages) break;
    page++;
  }
  console.log(`  ${all.length} orders fetched`);

  // Bucket by test vs real, compute cost
  const byTestDomain = new Map<string, { pieces: number; canceled: number; firstDate: string; lastDate: string; cost: number }>();
  for (const o of all) {
    const d = extractDomain(o.extRefNbr);
    if (!TEST_DOMAINS.has(d)) continue;
    const status = o.status.toLowerCase();
    const isCanceled = status === 'canceled' || status === 'cancelled';
    const date = o.orderDate.split('T')[0];
    const mc = o.mailClass.toLowerCase().includes('first') ? 'fc' : 'std';
    const entry = byTestDomain.get(d) || { pieces: 0, canceled: 0, firstDate: '9999', lastDate: '0000', cost: 0 };
    if (isCanceled) entry.canceled++;
    else {
      entry.pieces++;
      entry.cost += pcmRate(date, mc);
    }
    if (date && date < entry.firstDate) entry.firstDate = date;
    if (date && date > entry.lastDate) entry.lastDate = date;
    byTestDomain.set(d, entry);
  }

  console.log('\n━━━ Per-test-domain PCM activity ━━━━━━━');
  console.log('domain | pieces (active) | canceled | first | last | est. cost ($, using era pricing)');
  let totalTestPieces = 0;
  let totalTestCost = 0;
  const rows = [...byTestDomain.entries()].sort(([, a], [, b]) => b.pieces - a.pieces);
  for (const [d, v] of rows) {
    console.log(`${d} | ${v.pieces} | ${v.canceled} | ${v.firstDate} | ${v.lastDate} | $${v.cost.toFixed(2)}`);
    totalTestPieces += v.pieces;
    totalTestCost += v.cost;
  }
  console.log('─────');
  console.log(`TOTAL | ${totalTestPieces} pieces | est. cost $${totalTestCost.toFixed(2)}`);

  // Recent test activity (last 90 days)
  const cutoff = new Date(Date.now() - 90 * 86400e3).toISOString().split('T')[0];
  const recentByDate = new Map<string, number>();
  for (const o of all) {
    const d = extractDomain(o.extRefNbr);
    if (!TEST_DOMAINS.has(d)) continue;
    const status = o.status.toLowerCase();
    if (status === 'canceled' || status === 'cancelled') continue;
    const date = o.orderDate.split('T')[0];
    if (!date || date < cutoff) continue;
    recentByDate.set(date, (recentByDate.get(date) || 0) + 1);
  }
  console.log('\n━━━ Recent test activity (last 90 days) ━━━');
  const sortedRecent = [...recentByDate.entries()].sort(([a], [b]) => b.localeCompare(a));
  for (const [date, count] of sortedRecent.slice(0, 15)) {
    console.log(`  ${date}: ${count} pieces`);
  }
  console.log(`  (${recentByDate.size} days with test activity in last 90d)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
