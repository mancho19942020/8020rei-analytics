/**
 * DM Reports — API Route
 *
 * Aggregates data from Aurora + PCM API for the Reports tab.
 * Supports: list (card previews), profitability-report (full document data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
import { pcmGet, isPcmConfigured } from '@/lib/pcm-client';
// Test-domain exclusion — canonical source. Any change applies everywhere simultaneously.
import { TEST_DOMAINS_SQL as TEST_DOMAINS } from '@/lib/domain-filter';
import {
  fetchPcmOrdersSlim,
  getCachedPcmOrdersSlim,
} from '@/app/api/dm-overview/compute';
import type { PcmOrderSlim } from '@/app/api/dm-overview/compute';
// Single source of truth for PCM invoice-verified era rates
import { PCM_ERAS, pcmRate, computePcmInvoiceCost, getPcmEra } from '@/lib/pcm-pricing-eras';

// Customer pricing eras are NOT hardcoded — they are derived live from
// `dm_volume_summary` via fetchCustomerEras(). When 8020REI changes platform
// pricing, the Reports tab updates automatically on the next monolith sync.

/**
 * Find the PCM-era rate for a given month (YYYY-MM or YYYY-MM-DD string).
 * Returns the invoice-verified FC + Std rates PCM charged us that month.
 */
function getPcmRatesForMonth(monthStr: string): { fcRate: number; stdRate: number; label: string } {
  const era = getPcmEra(monthStr.length >= 10 ? monthStr : `${monthStr}-15`);
  return { fcRate: era.fcRate, stdRate: era.stdRate, label: era.label };
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const type = request.nextUrl.searchParams.get('type') || 'list';

  try {
    switch (type) {
      case 'list':
        return await getReportList();
      case 'profitability-report':
        return await getProfitabilityReport();
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }
  } catch (error) {
    console.error(`[DM Reports] Error fetching ${type}:`, error);
    return NextResponse.json(
      { error: `Unable to load ${type}. Please retry.` },
      { status: 500 }
    );
  }
}

// ─── Report List (card previews) ────────────────────────────────

async function getReportList() {
  const cacheKey = 'dm-reports:list';
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  let summary = null;

  if (isAuroraConfigured()) {
    try {
      const rows = await runAuroraQuery(`
        SELECT
          COALESCE(SUM(f.total_sends), 0) as total_sends,
          COALESCE(SUM(f.total_cost), 0) as total_revenue,
          COALESCE(SUM(f.total_pcm_cost), 0) as total_pcm_cost
        FROM dm_client_funnel f
        INNER JOIN (
          SELECT domain, MAX(date) as md
          FROM dm_client_funnel
          WHERE domain IS NOT NULL AND domain NOT IN (${TEST_DOMAINS})
          GROUP BY domain
        ) latest ON f.domain = latest.domain AND f.date = latest.md
        WHERE f.domain IS NOT NULL AND f.domain NOT IN (${TEST_DOMAINS})
      `);

      const row = rows[0];
      const totalRevenue = Number(row?.total_revenue || 0);
      const totalPcmCost = Number(row?.total_pcm_cost || 0);
      const grossMarginPct = totalRevenue > 0
        ? Math.round(((totalRevenue - totalPcmCost) / totalRevenue) * 1000) / 10
        : 0;

      summary = {
        totalPieces: Number(row?.total_sends || 0),
        grossMarginPct,
        totalRevenue,
      };
    } catch {
      // Aurora query failed — summary stays null
    }
  }

  const result = { summary };
  setCache(cacheKey, result);
  return NextResponse.json(result);
}

// ─── Full Profitability Report ──────────────────────────────────

async function getProfitabilityReport() {
  const cacheKey = 'dm-reports:profitability-report';
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ error: 'Aurora not configured' }, { status: 503 });
  }

  // Run live queries in parallel + get verified historical data
  const [
    executiveSummaryData,
    dataQualityData,
    clientData,
    customerEras,
  ] = await Promise.all([
    fetchExecutiveSummary(),
    fetchDataQuality(),
    fetchClientProfitability(),
    fetchCustomerEras(),
  ]);

  const monthlyData = getVerifiedMonthlyData();

  // Honesty: flag whether the static monthly tables are stale relative to today.
  // The arrays are hardcoded and must be extended manually each month.
  const latestStaticMonth = monthlyData.pcmCosts[monthlyData.pcmCosts.length - 1]?.month;
  const todayMonth = new Date().toISOString().slice(0, 7);
  const monthsStale = latestStaticMonth ? monthsDiff(latestStaticMonth, todayMonth) : 0;

  const result = {
    executiveSummary: executiveSummaryData,
    dataQuality: dataQualityData,
    pricingHistory: buildPricingHistory(customerEras),
    monthlyPcmCosts: monthlyData.pcmCosts,
    monthlyRevenue: monthlyData.revenue,
    monthlyDataMeta: {
      latestMonth: latestStaticMonth || null,
      monthsStale,
      isStale: monthsStale > 1,
    },
    allTimeSummary: buildAllTimeSummary(executiveSummaryData),
    clientProfitability: clientData,
    generatedAt: new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return NextResponse.json(result);
}

// ─── Query Functions ────────────────────────────────────────────

async function fetchExecutiveSummary() {
  // Golden rule: Aurora + PCM, always both. Revenue from Aurora (reliable).
  // PCM cost from PCM /order × invoice-verified era rates when the cache is
  // warm; otherwise fall back to Aurora's stored total_pcm_cost as a fast
  // placeholder (cache warms in background and the next refresh serves the
  // invoice-authoritative number).
  const rows = await runAuroraQuery(`
    SELECT
      COALESCE(SUM(f.total_sends), 0) as total_sends,
      COALESCE(SUM(f.total_cost), 0) as total_revenue,
      COALESCE(SUM(f.total_pcm_cost), 0) as aurora_stored_pcm_cost
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT domain, MAX(date) as md
      FROM dm_client_funnel
      WHERE domain IS NOT NULL AND domain NOT IN (${TEST_DOMAINS})
      GROUP BY domain
    ) latest ON f.domain = latest.domain AND f.date = latest.md
    WHERE f.domain IS NOT NULL AND f.domain NOT IN (${TEST_DOMAINS})
  `);

  const row = rows[0];
  const totalRevenue = Number(row?.total_revenue || 0);
  const auroraStoredPcmCost = Number(row?.aurora_stored_pcm_cost || 0);
  const orders = readPcmOrdersCacheOrWarm();
  const totalPcmCost = orders
    ? computePcmInvoiceCost(orders.filter(o => !o.canceled && !o.isTestDomain))
    : auroraStoredPcmCost;
  const grossMargin = Math.round((totalRevenue - totalPcmCost) * 100) / 100;

  return {
    totalPieces: Number(row?.total_sends || 0),
    totalRevenue,
    totalPcmCost,
    grossMargin,
    marginPercent: totalRevenue > 0
      ? Math.round((grossMargin / totalRevenue) * 1000) / 10
      : 0,
  };
}

/**
 * Non-blocking PCM orders accessor. Returns cache if warm, otherwise kicks
 * off a background pagination and returns null. Callers must fall back to
 * Aurora-stored values (or the pre-computed headline cache) if this returns
 * null — PCM pagination takes ~90s and must never block a request.
 */
function readPcmOrdersCacheOrWarm(): PcmOrderSlim[] | null {
  const cached = getCachedPcmOrdersSlim();
  if (cached) return cached;
  fetchPcmOrdersSlim().catch(e => {
    console.error('[dm-reports] background PCM pagination failed:', e instanceof Error ? e.message : e);
  });
  return null;
}

async function fetchDataQuality() {
  // Get Aurora per-client sends
  const auroraRows = await runAuroraQuery(`
    SELECT
      f.domain,
      COALESCE(f.total_sends, 0) as sends
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT domain, MAX(date) as md
      FROM dm_client_funnel
      WHERE domain IS NOT NULL AND domain NOT IN (${TEST_DOMAINS})
      GROUP BY domain
    ) latest ON f.domain = latest.domain AND f.date = latest.md
    WHERE f.domain IS NOT NULL AND f.domain NOT IN (${TEST_DOMAINS})
    ORDER BY f.total_sends DESC
  `);

  const auroraSends = auroraRows.reduce((sum, r) => sum + Number(r.sends || 0), 0);

  // Get PCM order count
  let pcmOrders = 0;
  if (isPcmConfigured()) {
    try {
      interface PcmPaginatedResponse {
        results: unknown[];
        pagination: { totalResults: number };
      }
      const pcmResult = await pcmGet<PcmPaginatedResponse>('/order', { page: 1, perPage: 1 });
      pcmOrders = pcmResult.pagination.totalResults;
    } catch {
      // PCM API unavailable
    }
  }

  const delta = pcmOrders - auroraSends;
  const matchRate = Math.max(pcmOrders, auroraSends) > 0
    ? Math.round((Math.min(pcmOrders, auroraSends) / Math.max(pcmOrders, auroraSends)) * 1000) / 10
    : 0;

  // Per-client reconciliation (Aurora side only — PCM doesn't break down by domain)
  const clients = auroraRows.map(r => {
    const sends = Number(r.sends || 0);
    return {
      domain: cleanDomain(String(r.domain)),
      auroraSends: sends,
      pcmOrders: 0, // PCM doesn't provide per-domain breakdown via API
      delta: 0,
      matchPercent: 100,
    };
  });

  return {
    pcmOrders,
    auroraSends,
    delta,
    matchRate,
    clients,
  };
}

function getVerifiedMonthlyData() {
  // Verified from 264 PCM invoice PDFs and Aurora dm_property_conversions
  // dm_volume_summary only has recent daily data, so historical monthly data is static
  const pcmCosts = [
    { month: '2025-02', fcPieces: 72, stdPieces: 0, totalPieces: 72, pcmCost: 67.68, era: 'Era 1: Original' },
    { month: '2025-03', fcPieces: 135, stdPieces: 87, totalPieces: 222, pcmCost: 191.28, era: 'Era 1: Original' },
    { month: '2025-04', fcPieces: 235, stdPieces: 321, totalPieces: 556, pcmCost: 458.44, era: 'Era 1: Original' },
    { month: '2025-05', fcPieces: 304, stdPieces: 159, totalPieces: 463, pcmCost: 403.42, era: 'Era 1: Original' },
    { month: '2025-06', fcPieces: 915, stdPieces: 0, totalPieces: 915, pcmCost: 860.90, era: 'Era 1: Original' },
    { month: '2025-07', fcPieces: 330, stdPieces: 765, totalPieces: 1095, pcmCost: 1087.65, era: 'Era 2: Price hike' },
    { month: '2025-08', fcPieces: 283, stdPieces: 2113, totalPieces: 2396, pcmCost: 2287.71, era: 'Era 2: Price hike' },
    { month: '2025-09', fcPieces: 296, stdPieces: 1024, totalPieces: 1320, pcmCost: 1289.76, era: 'Era 2: Price hike' },
    { month: '2025-10', fcPieces: 1228, stdPieces: 647, totalPieces: 1875, pcmCost: 2001.63, era: 'Era 2: Price hike' },
    { month: '2025-11', fcPieces: 681, stdPieces: 412, totalPieces: 1093, pcmCost: 852.03, era: 'Era 3: Current' },
    { month: '2025-12', fcPieces: 583, stdPieces: 557, totalPieces: 1140, pcmCost: 858.12, era: 'Era 3: Current' },
    { month: '2026-01', fcPieces: 569, stdPieces: 193, totalPieces: 762, pcmCost: 616.62, era: 'Era 3: Current' },
    { month: '2026-02', fcPieces: 1346, stdPieces: 208, totalPieces: 1554, pcmCost: 1302.06, era: 'Era 3: Current' },
    { month: '2026-03', fcPieces: 4820, stdPieces: 2586, totalPieces: 7406, pcmCost: 5822.58, era: 'Era 3: Current' },
    { month: '2026-04', fcPieces: 1715, stdPieces: 1059, totalPieces: 2774, pcmCost: 2159.22, era: 'Era 3: Current' },
  ];

  // Revenue from dm_property_conversions, aggregated by month
  const revenue = [
    { month: '2025-02', sends: 119, revenue: 165.38, avgRate: 1.39 },
    { month: '2025-03', sends: 243, revenue: 306.45, avgRate: 1.2613 },
    { month: '2025-04', sends: 506, revenue: 603.83, avgRate: 1.1934 },
    { month: '2025-05', sends: 528, revenue: 665.09, avgRate: 1.2596 },
    { month: '2025-06', sends: 1243, revenue: 1649.22, avgRate: 1.3268 },
    { month: '2025-07', sends: 2841, revenue: 3175.88, avgRate: 1.1179 },
    { month: '2025-08', sends: 18302, revenue: 19855.91, avgRate: 1.0849 },
    { month: '2025-09', sends: 2344, revenue: 2811.24, avgRate: 1.1993 },
    { month: '2025-10', sends: 2394, revenue: 3014.51, avgRate: 1.2592 },
    { month: '2025-11', sends: 1295, revenue: 1631.91, avgRate: 1.2602 },
    { month: '2025-12', sends: 1229, revenue: 1482.00, avgRate: 1.2059 },
    { month: '2026-01', sends: 809, revenue: 867.63, avgRate: 1.0725 },
    { month: '2026-02', sends: 1807, revenue: 1506.81, avgRate: 0.8339 },
    { month: '2026-03', sends: 19989, revenue: 16447.23, avgRate: 0.8228 },
    { month: '2026-04', sends: 1831, revenue: 1423.53, avgRate: 0.7774 },
  ];

  return { pcmCosts, revenue };
}

async function fetchClientProfitability() {
  // Per-client PCM cost is attributed from PCM /order × era rates when the
  // cache is warm. Otherwise fall back to Aurora's stored value per domain
  // so the report loads fast; the next refresh (after cache warmup) serves
  // the invoice-authoritative number.
  const rows = await runAuroraQuery(`
    SELECT
      f.domain,
      COALESCE(f.total_sends, 0) as sends,
      COALESCE(f.total_cost, 0) as revenue,
      COALESCE(f.total_pcm_cost, 0) as aurora_stored_pcm_cost
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT domain, MAX(date) as md
      FROM dm_client_funnel
      WHERE domain IS NOT NULL AND domain NOT IN (${TEST_DOMAINS})
      GROUP BY domain
    ) latest ON f.domain = latest.domain AND f.date = latest.md
    WHERE f.domain IS NOT NULL AND f.domain NOT IN (${TEST_DOMAINS})
  `);

  const orders = readPcmOrdersCacheOrWarm();
  const pcmCostByDomain = new Map<string, number>();
  if (orders) {
    for (const o of orders) {
      if (o.canceled || o.isTestDomain) continue;
      pcmCostByDomain.set(o.domain, (pcmCostByDomain.get(o.domain) || 0) + pcmRate(o.date, o.mailClass));
    }
  }

  const result = rows.map(r => {
    const rawDomain = String(r.domain);
    const sends = Number(r.sends || 0);
    const revenue = Number(r.revenue || 0);
    const invoiceCost = pcmCostByDomain.get(rawDomain);
    const pcmCost = invoiceCost != null
      ? Math.round(invoiceCost * 100) / 100
      : Number(r.aurora_stored_pcm_cost || 0);
    const margin = Math.round((revenue - pcmCost) * 100) / 100;
    const marginPercent = revenue > 0 ? Math.round((margin / revenue) * 10000) / 100 : 0;
    return {
      domain: cleanDomain(rawDomain),
      sends,
      revenue,
      pcmCost,
      margin,
      marginPercent,
      blendedRate: sends > 0 ? Math.round((revenue / sends) * 10000) / 10000 : 0,
    };
  });

  // Sort by marginPercent ascending (losers first)
  result.sort((a, b) => a.marginPercent - b.marginPercent);
  return result;
}

// ─── Live Customer Era Detection ────────────────────────────────

interface DetectedCustomerEra {
  start: string;       // YYYY-MM-DD
  end: string;         // YYYY-MM-DD (or 'present')
  fcRate: number;      // blended customer rate in era
  stdRate: number;
  sends: number;
}

/**
 * Derive customer pricing eras live from `dm_volume_summary`.
 *
 * Strategy: walk daily per-mail-class rates chronologically. Whenever the
 * rounded ($.01) rate changes, close the current era and open a new one.
 * Return contiguous stable-rate ranges.
 *
 * This replaces a hardcoded CUSTOMER_ERAS constant. When 8020REI changes
 * platform pricing, new eras appear automatically on the next monolith sync
 * — no code change required.
 */
async function fetchCustomerEras(): Promise<DetectedCustomerEra[]> {
  const rows = await runAuroraQuery(`
    SELECT
      date::date as d,
      mail_class,
      ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 2) as rate,
      SUM(daily_sends) as sends
    FROM dm_volume_summary
    WHERE mail_class IN ('first_class', 'standard')
      AND daily_sends > 0
      AND domain NOT IN (${TEST_DOMAINS})
    GROUP BY date::date, mail_class
    HAVING SUM(daily_sends) > 0
    ORDER BY date::date, mail_class
  `);

  if (rows.length === 0) return [];

  // Pivot: per-day record of { fcRate, stdRate, sends }
  interface DayRec { date: string; fcRate: number | null; stdRate: number | null; sends: number }
  const byDate = new Map<string, DayRec>();
  for (const r of rows) {
    const date = String(r.d).slice(0, 10);
    const mc = String(r.mail_class);
    const rate = r.rate != null ? Number(r.rate) : null;
    const sends = Number(r.sends || 0);
    const entry = byDate.get(date) ?? { date, fcRate: null, stdRate: null, sends: 0 };
    if (mc === 'first_class') entry.fcRate = rate;
    else if (mc === 'standard') entry.stdRate = rate;
    entry.sends += sends;
    byDate.set(date, entry);
  }

  const days = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Walk days, grouping consecutive days with the same (fcRate, stdRate).
  // Missing rates on a day = use previous era's rate (no era break).
  const eras: DetectedCustomerEra[] = [];
  let current: DetectedCustomerEra | null = null;
  let carryFc: number | null = null;
  let carryStd: number | null = null;

  for (const day of days) {
    const fc = day.fcRate ?? carryFc ?? 0;
    const std = day.stdRate ?? carryStd ?? 0;
    if (day.fcRate != null) carryFc = day.fcRate;
    if (day.stdRate != null) carryStd = day.stdRate;

    if (!current) {
      current = { start: day.date, end: day.date, fcRate: fc, stdRate: std, sends: day.sends };
      continue;
    }

    // Rates are "the same" if both FC and Std round to the same cent
    const sameFc = Math.abs(current.fcRate - fc) < 0.005;
    const sameStd = Math.abs(current.stdRate - std) < 0.005;

    if (sameFc && sameStd) {
      current.end = day.date;
      current.sends += day.sends;
    } else {
      eras.push(current);
      current = { start: day.date, end: day.date, fcRate: fc, stdRate: std, sends: day.sends };
    }
  }
  if (current) eras.push(current);

  return eras;
}

// ─── Static Data Builders ───────────────────────────────────────

function formatEraPeriod(start: string, end: string, isLast: boolean): string {
  // start/end are YYYY-MM-DD. Render as human-friendly span.
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  };
  return isLast ? `${fmt(start)} – present` : `${fmt(start)} – ${fmt(end)}`;
}

function buildPricingHistory(customerEras: DetectedCustomerEra[]) {
  const pcmEras = PCM_ERAS.map(e => ({
    label: e.label,
    period: `${e.start} – ${e.end === '2099-12' ? 'present' : e.end}`,
    fcRate: e.fcRate,
    stdRate: e.stdRate,
  }));

  // Build customer-era display rows from live-detected eras
  const customerErasOut = customerEras.map((era, idx) => {
    const isLast = idx === customerEras.length - 1;
    return {
      label: `Era ${idx + 1}`,
      period: formatEraPeriod(era.start, era.end, isLast),
      fcRate: era.fcRate,
      stdRate: era.stdRate,
    };
  });

  // Margin eras: for each detected customer era, look up the PCM invoice rate
  // for the month containing that era's midpoint and compute per-piece margin.
  // This honestly reflects what WE charged vs what PCM charged us during that period.
  const marginEras = customerEras.map((era, idx) => {
    const isLast = idx === customerEras.length - 1;
    // Use start month as the reference for the PCM rate lookup
    const month = era.start.slice(0, 7);
    const pcm = getPcmRatesForMonth(month);
    const marginFc = Math.round((era.fcRate - pcm.fcRate) * 100) / 100;
    const marginStd = Math.round((era.stdRate - pcm.stdRate) * 100) / 100;
    const status = deriveMarginStatus(marginFc, marginStd);
    return {
      period: formatEraPeriod(era.start, era.end, isLast),
      pcmFc: pcm.fcRate,
      pcmStd: pcm.stdRate,
      ourFc: era.fcRate,
      ourStd: era.stdRate,
      marginFc,
      marginStd,
      status,
    };
  });

  return { pcmEras, customerEras: customerErasOut, marginEras };
}

function deriveMarginStatus(marginFc: number, marginStd: number): string {
  const both = [marginFc, marginStd];
  const allPositive = both.every(m => m > 0.005);
  const allZero = both.every(m => Math.abs(m) <= 0.005);
  const anyNegative = both.some(m => m < -0.005);
  if (anyNegative) return 'Losing money';
  if (allZero) return 'Zero margin';
  if (allPositive) {
    const blended = (marginFc + marginStd) / 2;
    if (blended >= 0.4) return 'Profitable';
    if (blended >= 0.2) return 'Profitable (shrinking)';
    return 'Low margin';
  }
  return 'Mixed';
}

function buildAllTimeSummary(exec: { totalPieces: number; totalRevenue: number; totalPcmCost: number; grossMargin: number; marginPercent: number }) {
  return {
    totalSends: exec.totalPieces,
    totalRevenue: exec.totalRevenue,
    totalPcmCost: exec.totalPcmCost,
    grossMargin: exec.grossMargin,
    marginPercent: exec.marginPercent,
    revenuePerPiece: exec.totalPieces > 0 ? Math.round((exec.totalRevenue / exec.totalPieces) * 10000) / 10000 : 0,
    costPerPiece: exec.totalPieces > 0 ? Math.round((exec.totalPcmCost / exec.totalPieces) * 10000) / 10000 : 0,
    marginPerPiece: exec.totalPieces > 0 ? Math.round((exec.grossMargin / exec.totalPieces) * 10000) / 10000 : 0,
  };
}

// ─── Helpers ────────────────────────────────────────────────────

/** Number of whole months from `fromMonth` (YYYY-MM) to `toMonth` (YYYY-MM). */
function monthsDiff(fromMonth: string, toMonth: string): number {
  const [fy, fm] = fromMonth.split('-').map(Number);
  const [ty, tm] = toMonth.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

function cleanDomain(raw: string): string {
  return raw
    .replace(/_8020rei_com$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim() || raw;
}
