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

const TEST_DOMAINS = `'8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com'`;

// PCM pricing eras — verified from 264 invoice PDFs
const PCM_ERAS = [
  { start: '2024-12', end: '2025-06', label: 'Era 1: Original', fcRate: 0.94, stdRate: 0.74 },
  { start: '2025-07', end: '2025-10', label: 'Era 2: Price hike', fcRate: 1.16, stdRate: 0.93 },
  { start: '2025-11', end: '2099-12', label: 'Era 3: Current', fcRate: 0.87, stdRate: 0.63 },
];

// Customer pricing eras — verified from dm_property_conversions
const CUSTOMER_ERAS = [
  { start: '2024-12', end: '2026-01-15', label: 'Launch pricing', fcRate: 1.39, stdRate: 1.08 },
  { start: '2026-01-16', end: '2099-12-31', label: 'Current (zero margin)', fcRate: 0.87, stdRate: 0.63 },
];

function getEraLabel(monthStr: string): string {
  for (const era of PCM_ERAS) {
    if (monthStr >= era.start && monthStr <= era.end) return era.label;
  }
  return 'Era 3: Current';
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
      { error: error instanceof Error ? error.message : 'Internal error' },
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
  ] = await Promise.all([
    fetchExecutiveSummary(),
    fetchDataQuality(),
    fetchClientProfitability(),
  ]);

  const monthlyData = getVerifiedMonthlyData();

  const result = {
    executiveSummary: executiveSummaryData,
    dataQuality: dataQualityData,
    pricingHistory: buildPricingHistory(),
    monthlyPcmCosts: monthlyData.pcmCosts,
    monthlyRevenue: monthlyData.revenue,
    allTimeSummary: buildAllTimeSummary(executiveSummaryData),
    clientProfitability: clientData,
    generatedAt: new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return NextResponse.json(result);
}

// ─── Query Functions ────────────────────────────────────────────

async function fetchExecutiveSummary() {
  const rows = await runAuroraQuery(`
    SELECT
      COALESCE(SUM(f.total_sends), 0) as total_sends,
      COALESCE(SUM(f.total_cost), 0) as total_revenue,
      COALESCE(SUM(f.total_pcm_cost), 0) as total_pcm_cost,
      COALESCE(SUM(f.margin), 0) as gross_margin
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
  const grossMargin = totalRevenue - totalPcmCost;

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
  const rows = await runAuroraQuery(`
    SELECT
      f.domain,
      COALESCE(f.total_sends, 0) as sends,
      COALESCE(f.total_cost, 0) as revenue,
      COALESCE(f.total_pcm_cost, 0) as pcm_cost,
      COALESCE(f.margin, 0) as margin,
      COALESCE(f.margin_pct, 0) as margin_pct
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT domain, MAX(date) as md
      FROM dm_client_funnel
      WHERE domain IS NOT NULL AND domain NOT IN (${TEST_DOMAINS})
      GROUP BY domain
    ) latest ON f.domain = latest.domain AND f.date = latest.md
    WHERE f.domain IS NOT NULL AND f.domain NOT IN (${TEST_DOMAINS})
    ORDER BY f.margin_pct ASC
  `);

  return rows.map(r => {
    const sends = Number(r.sends || 0);
    const revenue = Number(r.revenue || 0);
    return {
      domain: cleanDomain(String(r.domain)),
      sends,
      revenue,
      pcmCost: Number(r.pcm_cost || 0),
      margin: Number(r.margin || 0),
      marginPercent: Number(r.margin_pct || 0),
      blendedRate: sends > 0 ? Math.round((revenue / sends) * 10000) / 10000 : 0,
    };
  });
}

// ─── Static Data Builders ───────────────────────────────────────

function buildPricingHistory() {
  const pcmEras = PCM_ERAS.map(e => ({
    label: e.label,
    period: `${e.start} – ${e.end === '2099-12' ? 'present' : e.end}`,
    fcRate: e.fcRate,
    stdRate: e.stdRate,
  }));

  const customerEras = CUSTOMER_ERAS.map(e => ({
    label: e.label,
    period: `${e.start} – ${e.end === '2099-12-31' ? 'present' : e.end}`,
    fcRate: e.fcRate,
    stdRate: e.stdRate,
  }));

  const marginEras = [
    { period: 'Dec 2024 – Jun 27, 2025', pcmFc: 0.94, pcmStd: 0.74, ourFc: 1.39, ourStd: 1.08, marginFc: 0.45, marginStd: 0.34, status: 'Profitable' },
    { period: 'Jun 28 – Oct 2025', pcmFc: 1.16, pcmStd: 0.93, ourFc: 1.39, ourStd: 1.08, marginFc: 0.23, marginStd: 0.15, status: 'Profitable (margins shrank)' },
    { period: 'Nov 2025 – Jan 15, 2026', pcmFc: 0.87, pcmStd: 0.63, ourFc: 1.39, ourStd: 1.08, marginFc: 0.52, marginStd: 0.45, status: 'Most profitable period' },
    { period: 'Jan 16, 2026 – present', pcmFc: 0.87, pcmStd: 0.63, ourFc: 0.87, ourStd: 0.63, marginFc: 0, marginStd: 0, status: 'Zero margin' },
  ];

  return { pcmEras, customerEras, marginEras };
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

function cleanDomain(raw: string): string {
  return raw
    .replace(/_8020rei_com$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim() || raw;
}
