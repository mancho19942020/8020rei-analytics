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
import {
  TEST_DOMAINS as CANONICAL_TEST_DOMAINS,
  TEST_DOMAIN_SET,
  TEST_DOMAINS_SQL,
} from '@/lib/domain-filter';

// ─── Constants ────────────────────────────────────────────────

// Re-export the canonical list so existing callers importing from this module
// continue to work. Single source of truth lives in `@/lib/domain-filter`.
export const TEST_DOMAINS = CANONICAL_TEST_DOMAINS;

// Denominator for the adoption-rate card — verbal from Camilo.
// TODO: pull from monolith when available.
export const TOTAL_8020REI_CLIENTS = 140;

// PCM invoice-verified pricing eras are defined once in `@/lib/pcm-pricing-eras`
// to prevent drift between Overview, Profitability, and Reports. Re-export so
// existing callers importing from this module continue to work.
import {
  pcmRate as _pcmRate,
  computePcmInvoiceCost as _computePcmInvoiceCost,
} from '@/lib/pcm-pricing-eras';
export { pcmRate, computePcmInvoiceCost } from '@/lib/pcm-pricing-eras';

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

// ─── Shared PCM pagination (single-flight + in-memory TTL cache) ──────

export interface PcmOrderSlim {
  date: string;
  mailClass: 'fc' | 'std';
  status: string;
  domain: string;
  canceled: boolean;
  isTestDomain: boolean;
}

let inflight: Promise<PcmOrderSlim[]> | null = null;

/**
 * In-memory cached copy of the last successful PCM pagination. Any caller that
 * needs the slim orders (getQ2Goal, dm-overview GET cache-miss path, etc.)
 * reuses this instead of re-paginating — pagination is ~90s across ~250 pages,
 * so triggering it on every request would block endpoints for that long.
 *
 * TTL is intentionally shorter than the /refresh cron interval (30 min) so
 * the cron's fresh PCM pull always overwrites the in-memory copy. If the
 * server restarts, the first caller pays the ~90s cost; all concurrent
 * requests coalesce on the inflight promise; subsequent requests within
 * 20 min hit memory.
 */
let ordersCache: { data: PcmOrderSlim[]; fetchedAt: number } | null = null;
const ORDERS_TTL_MS = 20 * 60 * 1000; // 20 minutes

/** Force-invalidate the in-memory cache. Called by /refresh after a fresh compute. */
export function invalidatePcmOrdersCache(): void {
  ordersCache = null;
}

/**
 * Non-blocking accessor — returns the cached PCM orders if the in-memory copy
 * is fresh, otherwise null. Unlike fetchPcmOrdersSlim(), this NEVER triggers a
 * pagination, so endpoints that need fast response times (OH tab's parallel
 * fetches) can use it safely and fall back to Aurora when the cache is cold.
 */
export function getCachedPcmOrdersSlim(): PcmOrderSlim[] | null {
  if (ordersCache && Date.now() - ordersCache.fetchedAt < ORDERS_TTL_MS) {
    return ordersCache.data;
  }
  return null;
}

export async function fetchPcmOrdersSlim(): Promise<PcmOrderSlim[]> {
  // Fast path: recent in-memory copy.
  if (ordersCache && Date.now() - ordersCache.fetchedAt < ORDERS_TTL_MS) {
    return ordersCache.data;
  }
  // Another request is already paginating — coalesce on its promise.
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

      ordersCache = { data: orders, fetchedAt: Date.now() };
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
// dm_client_funnel.{total_cost, total_pcm_cost}, latest row per domain.
// Margin is computed as (revenue - pcm_cost) rather than read from the stored
// `margin` column — the stored column is zero for clients whose pcm_cost is
// missing, which hides revenue from the total. Computing locally keeps this
// card in lockstep with Profitability Margin summary where we fixed the same
// issue. Coverage metadata lets the card flag incompleteness honestly.
async function fetchAuroraFunnelSummary(): Promise<{
  totalSends: number;
  totalDelivered: number;
  totalRevenue: number;
  totalPcmCost: number;
  grossMargin: number;
  marginPct: number;
  domainCount: number;
  coverage: {
    sendsWithPcm: number;
    sendsWithoutPcm: number;
    totalSends: number;
    coveragePct: number;
    revenueWithoutPcm: number;
  };
}> {
  const rows = await runAuroraQuery(`
    SELECT
      COALESCE(SUM(f.total_sends), 0) as total_sends,
      COALESCE(SUM(f.total_delivered), 0) as total_delivered,
      COALESCE(SUM(f.total_cost), 0) as total_revenue,
      COALESCE(SUM(f.total_pcm_cost), 0) as total_pcm_cost,
      COALESCE(SUM(CASE WHEN f.total_pcm_cost > 0 THEN f.total_sends ELSE 0 END), 0) as sends_with_pcm,
      COALESCE(SUM(CASE WHEN f.total_pcm_cost > 0 THEN f.total_cost ELSE 0 END), 0) as revenue_with_pcm,
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
  const pcmCost = Number(r.total_pcm_cost || 0);
  const totalSends = Number(r.total_sends || 0);
  const sendsWithPcm = Number(r.sends_with_pcm || 0);
  const revenueWithPcm = Number(r.revenue_with_pcm || 0);
  const sendsWithoutPcm = totalSends - sendsWithPcm;
  const revenueWithoutPcm = Math.max(0, revenue - revenueWithPcm);
  const coveragePct = totalSends > 0 ? Math.round((sendsWithPcm / totalSends) * 1000) / 10 : 0;
  const grossMargin = Math.round((revenue - pcmCost) * 100) / 100;
  return {
    totalSends,
    totalDelivered: Number(r.total_delivered || 0),
    totalRevenue: revenue,
    totalPcmCost: pcmCost,
    grossMargin,
    marginPct: revenue > 0 ? (grossMargin / revenue) * 100 : 0,
    domainCount: Number(r.domain_count || 0),
    coverage: { sendsWithPcm, sendsWithoutPcm, totalSends, coveragePct, revenueWithoutPcm },
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
  // Revenue from Aurora `dm_client_funnel.total_cost` — this column is reliable
  // (populated for every piece that gets sent). It's what 8020REI actually
  // charged clients.
  const auroraClientRevenue = auroraSummary.totalRevenue;
  const auroraStoredPcmCost = auroraSummary.totalPcmCost;
  const auroraDomainCount = auroraSummary.domainCount;

  // Invoice-authoritative PCM cost: iterate PCM's own /order records (excl.
  // canceled + test), apply invoice-verified era rates. This is the PCM-side
  // of the "Aurora + PCM, always both" rule. The monolith's stored
  // `total_pcm_cost` uses $0.625/$0.875 rates (incorrect) and is only
  // populated for ~92% of pieces, which is why we don't trust it for margin.
  const pcmCostRealInvoice = _computePcmInvoiceCost(realPcm);
  const pcmCostTest = _computePcmInvoiceCost(testPcm);

  // Gross margin (pre-test-cost): what 8020REI earned across real clients,
  // using invoice-verified PCM cost. This is what ends up on every Profitability
  // widget and the Overview Company margin card — same era rates everywhere.
  const grossMarginInvoice = Math.round((auroraClientRevenue - pcmCostRealInvoice) * 100) / 100;
  const grossMarginInvoicePct = auroraClientRevenue > 0
    ? Math.round((grossMarginInvoice / auroraClientRevenue) * 10000) / 100
    : 0;
  // Aurora-stored margin for reconciliation / reporting honesty
  const auroraStoredMargin = Math.round((auroraClientRevenue - auroraStoredPcmCost) * 100) / 100;
  const pcmVsAuroraCostDelta = Math.round((pcmCostRealInvoice - auroraStoredPcmCost) * 100) / 100;

  const deltaPieces = auroraLifetimeSent - pcmActivePieces;
  const deltaPiecesPct = pcmActivePieces > 0 ? (deltaPieces / pcmActivePieces) * 100 : 0;

  const testDomains = new Set<string>();
  const perTestDomain = new Map<string, { pieces: number; cost: number; firstDate: string; lastDate: string }>();
  let testFirstDate = '';
  let testLastDate = '';
  for (const o of testPcm) {
    const rate = _pcmRate(o.date, o.mailClass);
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

  // Company margin = gross margin (invoice-based) − internal test cost.
  const companyMargin = Math.round((grossMarginInvoice - pcmCostTest) * 100) / 100;
  const companyMarginPct = auroraClientRevenue > 0
    ? Math.round((companyMargin / auroraClientRevenue) * 10000) / 100
    : 0;

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
      // Authoritative PCM cost — from PCM /order × invoice-verified era rates
      pcmCostReal: Number(pcmCostRealInvoice.toFixed(2)),
      pcmCostTest: Number(pcmCostTest.toFixed(2)),
      // Authoritative gross margin — revenue minus PCM-invoice cost
      grossMargin: Number(grossMarginInvoice.toFixed(2)),
      grossMarginPct: Number(grossMarginInvoicePct.toFixed(2)),
      // Aurora reconciliation — surfaces the monolith's stored-cost drift
      auroraStoredPcmCost: Number(auroraStoredPcmCost.toFixed(2)),
      auroraStoredMargin: Number(auroraStoredMargin.toFixed(2)),
      pcmVsAuroraCostDelta: Number(pcmVsAuroraCostDelta.toFixed(2)),
      coverage: auroraSummary.coverage,
      sourceNote:
        'PCM cost is computed from PCM /order × invoice-verified era rates (the vendor\'s own data). Revenue comes from dm_client_funnel.total_cost. Gross margin = revenue − PCM-invoice cost. Aurora\'s stored total_pcm_cost is shown for reconciliation; it differs from the invoice-verified value because the monolith uses $0.625/$0.875 rates instead of $0.63/$0.87 and leaves some pieces un-tagged.',
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
    const rate = _pcmRate(o.date, o.mailClass);
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

  // Force a fresh pagination — the whole point of /refresh is to pull new data
  // from PCM, so any in-memory TTL copy must be discarded first.
  invalidatePcmOrdersCache();
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
