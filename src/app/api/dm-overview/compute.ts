/**
 * DM Overview — Compute & Cache
 *
 * Shared computation logic for the DM Campaign Overview tab. Owned by the
 * GET `/api/dm-overview` route and the POST `/api/dm-overview/refresh` cron.
 *
 * Persistence model:
 *   - Aurora table `dm_overview_cache` (key, payload JSONB, computed_at) is
 *     the canonical cache. The /refresh cron computes all payloads and
 *     upserts them. User-facing GET reads from this table.
 *   - The in-memory single-flight dedup below is still useful in-process: it
 *     prevents a thundering herd when multiple GET requests miss cache on a
 *     freshly-started server before the cron has populated Aurora.
 *
 * Camilo's executive framing (Apr 17, 2026 meeting):
 *   - "Revenue" in the Overview means COMPANY MARGIN (customer revenue − PCM
 *     cost), not client revenue. The audience is Camilo's boss and the CEO —
 *     they want "is this tool making us money?".
 *   - Internal test sends (QA/Cuba domains) are a real PCM cost with zero
 *     client revenue. Surface them as an explicit drag on margin. Never hide.
 */

import { runAuroraQuery } from '@/lib/aurora';
import { pcmGet, isPcmConfigured } from '@/lib/pcm-client';

// ─── Constants ────────────────────────────────────────────────

// Real-client exclusion list. These are internal / demo / test-environment
// domains — NOT paying customers. They're hidden from client-facing metrics
// (adoption, revenue) but SURFACED on the cost side as internal spending.
export const TEST_DOMAINS = [
  '8020rei_demo',
  '8020rei_migracion_test',
  '_test_debug',
  '_test_debug3',
  'supertest_8020rei_com',
  'sandbox_8020rei_com',
  'qapre_8020rei_com',
  'testing5_8020rei_com',
  'showcaseproductsecomllc_8020rei_com',
];
const TEST_DOMAIN_SET = new Set(TEST_DOMAINS);
const TEST_DOMAINS_SQL = TEST_DOMAINS.map((d) => `'${d}'`).join(', ');

// Denominator for the adoption-rate card — verbal from Camilo.
// TODO: pull from monolith when available.
export const TOTAL_8020REI_CLIENTS = 140;

// PCM invoice-verified pricing eras (23 PDFs, Dec 2024 – Apr 2026).
function pcmRate(dateISO: string, mc: 'fc' | 'std'): number {
  if (dateISO <= '2025-06-27') return mc === 'fc' ? 0.94 : 0.74;
  if (dateISO <= '2025-10-31') return mc === 'fc' ? 1.14 : 0.93;
  return mc === 'fc' ? 0.87 : 0.63;
}

function isTestDomain(domain: string): boolean {
  return TEST_DOMAIN_SET.has(domain);
}

function extractDomain(extRefNbr: string): string {
  const m = extRefNbr.match(/^(.+)-\d+$/);
  return m ? m[1] : extRefNbr;
}

// ─── Aurora cache table ───────────────────────────────────────

// The RDS Data API user does not have DDL privileges on the public schema.
// Table creation is a one-shot DBA action — see
// `scripts/migrations/2026-04-17-dm-overview-cache.sql`. We verify existence
// at runtime and surface a clear error if the migration has not been run yet.
export async function ensureCacheTable(): Promise<void> {
  try {
    await runAuroraQuery(`SELECT 1 FROM dm_overview_cache LIMIT 1`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/relation .*dm_overview_cache.* does not exist/i.test(msg)) {
      throw new Error(
        'dm_overview_cache table is missing. Apply scripts/migrations/2026-04-17-dm-overview-cache.sql against Aurora (requires DBA user).'
      );
    }
    // Other errors (e.g. transient Aurora) bubble up — caller will log.
    throw e;
  }
}

export interface CachedPayload<T> {
  data: T;
  computedAt: string;
  ageMinutes: number;
}

export async function readCache<T>(key: string): Promise<CachedPayload<T> | null> {
  try {
    const rows = await runAuroraQuery(
      `SELECT payload::TEXT as payload, computed_at::TEXT as computed_at
       FROM dm_overview_cache WHERE cache_key = :key`,
      [{ name: 'key', value: { stringValue: key } }]
    );
    if (!rows.length) return null;
    const r = rows[0] as { payload: string; computed_at: string };
    const data = JSON.parse(r.payload) as T;
    const computedAtDate = new Date(r.computed_at);
    const ageMinutes = (Date.now() - computedAtDate.getTime()) / 60_000;
    return { data, computedAt: r.computed_at, ageMinutes };
  } catch (e) {
    // Table may not exist yet (first deploy). Callers should handle null.
    console.warn(`[dm-overview] readCache(${key}) failed:`, e instanceof Error ? e.message : String(e));
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  const payload = JSON.stringify(data);
  await runAuroraQuery(
    `INSERT INTO dm_overview_cache (cache_key, payload, computed_at)
     VALUES (:key, :payload::jsonb, NOW())
     ON CONFLICT (cache_key) DO UPDATE
     SET payload = EXCLUDED.payload, computed_at = NOW()`,
    [
      { name: 'key', value: { stringValue: key } },
      { name: 'payload', value: { stringValue: payload } },
    ]
  );
}

// ─── Shared PCM pagination (in-memory single-flight) ──────────

export interface PcmOrderSlim {
  date: string;
  mailClass: 'fc' | 'std';
  status: string;
  domain: string;
  canceled: boolean;
  isTestDomain: boolean;
}

let inflight: Promise<PcmOrderSlim[]> | null = null;

export async function fetchPcmOrdersSlim(): Promise<PcmOrderSlim[]> {
  if (inflight) return inflight;
  if (!isPcmConfigured()) return [];

  inflight = (async () => {
    try {
      const orders: PcmOrderSlim[] = [];
      let page = 1;
      let totalPages = 999;

      interface PcmOrderRaw {
        status?: string;
        extRefNbr?: string;
        orderDate?: string;
        mailClass?: string;
      }

      while (page <= totalPages) {
        const resp = await pcmGet<{
          results: PcmOrderRaw[];
          pagination: { totalPages: number };
        }>('/order', { page: String(page), perPage: '100' });

        if (!resp.results?.length) break;

        for (const o of resp.results) {
          const status = String(o.status || '').toLowerCase();
          const domain = extractDomain(String(o.extRefNbr || ''));
          const date = String(o.orderDate || '').split('T')[0];
          const mc = String(o.mailClass || '').toLowerCase().includes('first') ? 'fc' : 'std';
          orders.push({
            date,
            mailClass: mc,
            status,
            domain,
            canceled: status === 'canceled' || status === 'cancelled',
            isTestDomain: isTestDomain(domain),
          });
        }

        totalPages = resp.pagination?.totalPages || totalPages;
        if (page >= totalPages) break;
        page++;
      }

      return orders;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

// ─── Aurora aggregation helpers ───────────────────────────────

// Lifetime revenue, PCM cost, and margin — EXACT same query as the Profitability
// tab's getProfitabilitySummary in /api/pcm-validation. Single source of truth:
// dm_client_funnel.{total_cost, total_pcm_cost, margin}, latest row per domain.
// If we compute PCM cost any other way, Overview will drift from Profitability.
async function fetchAuroraFunnelSummary(): Promise<{
  totalSends: number;
  totalDelivered: number;
  totalRevenue: number;
  totalPcmCost: number;
  grossMargin: number;
  marginPct: number;
  domainCount: number;
}> {
  const rows = await runAuroraQuery(`
    SELECT
      COALESCE(SUM(f.total_sends), 0) as total_sends,
      COALESCE(SUM(f.total_delivered), 0) as total_delivered,
      COALESCE(SUM(f.total_cost), 0) as total_revenue,
      COALESCE(SUM(f.total_pcm_cost), 0) as total_pcm_cost,
      COALESCE(SUM(f.margin), 0) as gross_margin,
      COUNT(DISTINCT f.domain) as domain_count
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT dcf.domain, MAX(dcf.date) as max_date
      FROM dm_client_funnel dcf
      WHERE dcf.domain IS NOT NULL AND dcf.domain NOT IN (${TEST_DOMAINS_SQL})
      GROUP BY dcf.domain
    ) latest ON f.domain = latest.domain AND f.date = latest.max_date
    WHERE f.domain IS NOT NULL AND f.domain NOT IN (${TEST_DOMAINS_SQL})
  `);
  const r = (rows[0] || {}) as Record<string, unknown>;
  const revenue = Number(r.total_revenue || 0);
  const margin = Number(r.gross_margin || 0);
  return {
    totalSends: Number(r.total_sends || 0),
    totalDelivered: Number(r.total_delivered || 0),
    totalRevenue: revenue,
    totalPcmCost: Number(r.total_pcm_cost || 0),
    grossMargin: margin,
    marginPct: revenue > 0 ? (margin / revenue) * 100 : 0,
    domainCount: Number(r.domain_count || 0),
  };
}

// NOTE: a per-month margin trend was attempted in an earlier revision. It was
// removed because dm_client_funnel is a rolling snapshot (first row Apr 6, 2026
// — 11 days of coverage at last check) and there is no historical per-month
// data to derive a true trend from. The headline "Company margin" card
// already shows the Profitability-aligned lifetime number. If historical
// monthly margin becomes a priority, the fix lives upstream: backfill
// dm_client_funnel from the PCM + property-conversions sources.

async function fetchCampaignCounts(): Promise<{
  totalCampaigns: number;
  activeCampaigns: number;
  clientsWithActiveCampaign: number;
}> {
  const rows = await runAuroraQuery(`
    SELECT DISTINCT ON (domain, campaign_id)
      campaign_id, domain, status
    FROM rr_campaign_snapshots
    WHERE domain NOT IN (${TEST_DOMAINS_SQL})
    ORDER BY domain, campaign_id, snapshot_at DESC
  `);
  const activeDomains = new Set<string>();
  let active = 0;
  for (const r of rows as Record<string, unknown>[]) {
    if (r.status === 'active') {
      active++;
      activeDomains.add(String(r.domain || ''));
    }
  }
  return {
    totalCampaigns: rows.length,
    activeCampaigns: active,
    clientsWithActiveCampaign: activeDomains.size,
  };
}

// ─── Compute functions — executed by /refresh ─────────────────

export async function computeHeadline(orders: PcmOrderSlim[]) {
  const [auroraSummary, campaignCounts] = await Promise.all([
    fetchAuroraFunnelSummary(),
    fetchCampaignCounts(),
  ]);

  const realPcm = orders.filter((o) => !o.canceled && !o.isTestDomain);
  const testPcm = orders.filter((o) => !o.canceled && o.isTestDomain);

  const pcmActivePieces = realPcm.length;
  const pcmCanceled = orders.filter((o) => o.canceled).length;
  const pcmTotalOrders = orders.length;

  const auroraLifetimeSent = auroraSummary.totalSends;
  // Revenue, PCM cost, and gross margin come directly from Aurora's pre-computed
  // columns in dm_client_funnel — EXACT same source as the Profitability tab's
  // Margin summary widget. This is the consistency guarantee.
  const auroraClientRevenue = auroraSummary.totalRevenue;
  const auroraPcmCostReal = auroraSummary.totalPcmCost;
  const auroraGrossMargin = auroraSummary.grossMargin;
  const auroraDomainCount = auroraSummary.domainCount;

  const deltaPieces = auroraLifetimeSent - pcmActivePieces;
  const deltaPiecesPct = pcmActivePieces > 0 ? (deltaPieces / pcmActivePieces) * 100 : 0;

  let pcmCostTest = 0;
  const testDomains = new Set<string>();
  const perTestDomain = new Map<string, { pieces: number; cost: number; firstDate: string; lastDate: string }>();
  let testFirstDate = '';
  let testLastDate = '';
  for (const o of testPcm) {
    const rate = pcmRate(o.date, o.mailClass);
    pcmCostTest += rate;
    testDomains.add(o.domain);
    if (!testFirstDate || o.date < testFirstDate) testFirstDate = o.date;
    if (!testLastDate || o.date > testLastDate) testLastDate = o.date;

    const entry = perTestDomain.get(o.domain) || { pieces: 0, cost: 0, firstDate: o.date, lastDate: o.date };
    entry.pieces++;
    entry.cost += rate;
    if (o.date < entry.firstDate) entry.firstDate = o.date;
    if (o.date > entry.lastDate) entry.lastDate = o.date;
    perTestDomain.set(o.domain, entry);
  }

  // Gross margin from Aurora already excludes test domains (query filter).
  // We deduct the internal test cost (estimated from PCM orders × era rates)
  // to get the honest company P&L.
  const companyMargin = auroraGrossMargin - pcmCostTest;
  const companyMarginPct = auroraClientRevenue > 0 ? (companyMargin / auroraClientRevenue) * 100 : 0;

  return {
    fetchedAt: new Date().toISOString(),
    adoption: {
      activeClients: campaignCounts.clientsWithActiveCampaign,
      totalClients: TOTAL_8020REI_CLIENTS,
      adoptionPct: TOTAL_8020REI_CLIENTS > 0 ? (campaignCounts.clientsWithActiveCampaign / TOTAL_8020REI_CLIENTS) * 100 : 0,
      sourceNote:
        'Active: distinct domains with ≥1 status=active campaign in rr_campaign_snapshots. Total clients: verbal from Camilo (Apr 17, 2026) — canonical monolith source pending.',
    },
    lifetimePieces: {
      pcm: pcmActivePieces,
      aurora: auroraLifetimeSent,
      delta: deltaPieces,
      deltaPct: Number(deltaPiecesPct.toFixed(2)),
      auroraDomainCount,
      sourceNote:
        'PCM is authoritative. Aurora (dm_client_funnel) may trail PCM by in-pipeline pieces (processing + mailing) not yet counted. Delta is surfaced, not hidden.',
    },
    companyMargin: {
      margin: Number(companyMargin.toFixed(2)),
      marginPct: Number(companyMarginPct.toFixed(2)),
      clientRevenue: Number(auroraClientRevenue.toFixed(2)),
      pcmCostReal: Number(auroraPcmCostReal.toFixed(2)),
      pcmCostTest: Number(pcmCostTest.toFixed(2)),
      grossMargin: Number(auroraGrossMargin.toFixed(2)),
      sourceNote:
        'Revenue, PCM cost, and gross margin come from dm_client_funnel (same source as Profitability → Margin summary). Internal test cost is then deducted to get the honest company P&L (company margin = gross margin − test cost).',
    },
    activeCampaigns: {
      active: campaignCounts.activeCampaigns,
      total: campaignCounts.totalCampaigns,
      sourceNote:
        'Campaigns are an 8020REI abstraction; PCM tracks orders, not campaigns. This metric is Aurora-only (rr_campaign_snapshots).',
    },
    testActivity: {
      pieces: testPcm.length,
      cost: Number(pcmCostTest.toFixed(2)),
      domainCount: testDomains.size,
      domains: [...testDomains].sort(),
      // The full exclusion list — everything the client-facing metrics ignore.
      // Superset of `domains` above (some never had PCM activity but are still
      // excluded from "active clients", lifetime revenue, etc.).
      allKnownTestDomains: [...TEST_DOMAINS].sort(),
      // Per-domain breakdowns for the card row. Sorted by cost descending so
      // the biggest internal-spend environment is on the left.
      perDomain: [...perTestDomain.entries()]
        .map(([domain, v]) => ({
          domain,
          pieces: v.pieces,
          cost: Number(v.cost.toFixed(2)),
          firstDate: v.firstDate,
          lastDate: v.lastDate,
        }))
        .sort((a, b) => b.cost - a.cost),
      firstDate: testFirstDate,
      lastDate: testLastDate,
      sourceNote:
        'Internal/QA test sends. 8020REI paid PCM; no client revenue. Tracked here so the company P&L is honest. Counted in companyMargin as cost.',
    },
    meta: {
      pcmTotalOrders,
      pcmCanceled,
    },
  };
}

export async function computeSendTrend(orders: PcmOrderSlim[]) {
  const monthly = new Map<string, { fc: number; std: number; total: number }>();
  for (const o of orders) {
    if (o.canceled || o.isTestDomain || !o.date) continue;
    const month = o.date.substring(0, 7);
    const entry = monthly.get(month) || { fc: 0, std: 0, total: 0 };
    entry.total++;
    if (o.mailClass === 'fc') entry.fc++;
    else entry.std++;
    monthly.set(month, entry);
  }
  const series = [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, total: v.total, firstClass: v.fc, standard: v.std }));

  return {
    series,
    sourceNote:
      'PCM /order grouped by orderDate month. Excludes canceled and test domains. Full history since first PCM order.',
    fetchedAt: new Date().toISOString(),
  };
}

export async function computeBalanceFlow(orders: PcmOrderSlim[]) {
  const balance = isPcmConfigured()
    ? await pcmGet<{ moneyOnAccount: number }>('/integration/balance').catch(() => ({ moneyOnAccount: 0 }))
    : { moneyOnAccount: 0 };

  const daily = new Map<string, { pieces: number; cost: number; testCost: number }>();
  for (const o of orders) {
    if (o.canceled || !o.date) continue;
    const rate = pcmRate(o.date, o.mailClass);
    const entry = daily.get(o.date) || { pieces: 0, cost: 0, testCost: 0 };
    if (!o.isTestDomain) entry.pieces++;
    entry.cost += rate;
    if (o.isTestDomain) entry.testCost += rate;
    daily.set(o.date, entry);
  }

  const series = [...daily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      pieces: v.pieces,
      cost: Number(v.cost.toFixed(2)),
      testCost: Number(v.testCost.toFixed(2)),
    }));

  const totalCost = series.reduce((s, d) => s + d.cost, 0);

  return {
    series,
    balance: Number((balance.moneyOnAccount || 0).toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    sourceNote:
      'Daily sends (real clients only) alongside daily PCM cost (real + internal test). Cost estimated per-piece with invoice-verified era pricing. Balance from PCM /integration/balance.',
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Orchestration ────────────────────────────────────────────

export async function refreshAllCaches(): Promise<{ keys: string[]; durationMs: number }> {
  const start = Date.now();
  await ensureCacheTable();

  const orders = await fetchPcmOrdersSlim();

  const [headline, sendTrend, balanceFlow] = await Promise.all([
    computeHeadline(orders),
    computeSendTrend(orders),
    computeBalanceFlow(orders),
  ]);

  await Promise.all([
    writeCache('headline', headline),
    writeCache('send-trend', sendTrend),
    writeCache('balance-flow', balanceFlow),
  ]);

  return {
    keys: ['headline', 'send-trend', 'balance-flow'],
    durationMs: Date.now() - start,
  };
}
