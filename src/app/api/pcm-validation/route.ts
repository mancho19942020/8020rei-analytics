/**
 * PCM Validation & Profitability — Next.js API Route
 *
 * Fetches reconciliation data from PCM API + Aurora and returns
 * comparison summaries for the PCM & Profitability tab widgets.
 *
 * Supports: summary, domain-breakdown, designs, status-comparison,
 *           profitability-summary, margin-by-mail-class, client-margins, margin-trend
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
import { pcmGet, isPcmConfigured } from '@/lib/pcm-client';

const TEST_DOMAINS = `'8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com'`;

// Strict domain validation — only allow alphanumeric, underscore, hyphen, dot
function sanitizeDomain(raw: string | null): string | undefined {
  if (!raw) return undefined;
  if (!/^[a-zA-Z0-9_\-.]+$/.test(raw)) return undefined;
  return raw;
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const params = request.nextUrl.searchParams;
  const type = params.get('type') || 'summary';
  const domain = sanitizeDomain(params.get('domain'));
  const days = parseInt(params.get('days') || '0') || undefined;

  try {
    switch (type) {
      case 'summary':
        return await getSummary(domain);
      case 'domain-breakdown':
        return await getDomainBreakdown(domain);
      case 'designs':
        return await getDesigns();
      case 'status-comparison':
        return await getStatusComparison(domain, days);
      case 'profitability-summary':
        return await getProfitabilitySummary(domain);
      case 'margin-by-mail-class':
        return await getMarginByMailClass(domain);
      case 'client-margins':
        return await getClientMargins(domain);
      case 'margin-trend':
        return await getMarginTrend(domain, days);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`[PCM Validation] Error fetching ${type}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
      },
      { status: 500 }
    );
  }
}

// ─── Summary ───────────────────────────────────────────────────

async function getSummary(domain?: string) {
  const cacheKey = `pcm-validation:summary:${domain || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const pcmConfigured = isPcmConfigured();
  const auroraConfigured = isAuroraConfigured();

  // Fetch PCM + Aurora + active campaign count in parallel
  const [pcmData, auroraData, activeCampaignData] = await Promise.all([
    pcmConfigured ? fetchPcmSummary() : getEmptyPcmSummary(),
    auroraConfigured ? fetchAuroraSummary(domain) : getEmptyAuroraSummary(),
    auroraConfigured ? fetchActiveCampaignCount(domain) : { activeCampaigns: 0, activeDomainsCount: 0 },
  ]);

  const matchRate = calculateMatchRate(pcmData.orderCount, auroraData.totalSends);

  const result = {
    pcmConnected: pcmConfigured,
    auroraConnected: auroraConfigured,
    pcmBalance: pcmData.balance,
    pcmOrderCount: pcmData.orderCount,
    pcmDesignCount: pcmData.designCount,
    auroraTotalSends: auroraData.totalSends,
    auroraTotalDelivered: auroraData.totalDelivered,
    auroraTotalCost: auroraData.totalCost,
    auroraDomainCount: auroraData.domainCount,
    activeCampaigns: activeCampaignData.activeCampaigns,
    activeDomainsCount: activeCampaignData.activeDomainsCount,
    volumeDelta: pcmData.orderCount - auroraData.totalSends,
    volumeDeltaPercent: auroraData.totalSends > 0
      ? Number(((pcmData.orderCount - auroraData.totalSends) / auroraData.totalSends * 100).toFixed(1))
      : 0,
    matchRate,
    timestamp: new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return NextResponse.json(result);
}

// ─── Domain Breakdown ──────────────────────────────────────────

async function getDomainBreakdown(domain?: string) {
  const cacheKey = `pcm-validation:domains:${domain || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ domains: [] });
  }

  // ALWAYS use dm_client_funnel cumulative totals — lifetime data for PCM comparison
  const domainFilter = domain ? `AND f.domain = '${domain}'` : '';
  const subDomainFilter = domain ? `AND dcf.domain = '${domain}'` : '';
  const rows = await runAuroraQuery(`
    SELECT
      f.domain,
      COALESCE(f.total_sends, 0) as total_sends,
      COALESCE(f.total_delivered, 0) as total_delivered,
      COALESCE(f.total_cost, 0) as total_cost,
      COALESCE(f.total_properties_mailed, 0) as total_mailed
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT dcf.domain, MAX(dcf.date) as max_date
      FROM dm_client_funnel dcf
      WHERE dcf.domain IS NOT NULL
        AND dcf.domain NOT IN (${TEST_DOMAINS})
        ${subDomainFilter}
      GROUP BY dcf.domain
    ) latest ON f.domain = latest.domain AND f.date = latest.max_date
    WHERE f.domain IS NOT NULL
      AND f.domain NOT IN (${TEST_DOMAINS})
      ${domainFilter}
    ORDER BY COALESCE(f.total_sends, 0) DESC
  `);

  const domains = rows.map(row => ({
    domain: String(row.domain),
    sends: Number(row.total_sends || 0),
    delivered: Number(row.total_delivered || 0),
    cost: Number(row.total_cost || 0),
    mailed: Number(row.total_mailed || 0),
    pcmOrders: 0, // Populated when PCM order access is resolved
  }));

  const result = { domains };
  setCache(cacheKey, result);
  return NextResponse.json(result);
}

// ─── Designs ───────────────────────────────────────────────────

async function getDesigns() {
  const cacheKey = 'pcm-validation:designs';
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isPcmConfigured()) {
    return NextResponse.json({ designs: [], total: 0 });
  }

  interface PcmDesignResponse {
    results: Array<{
      designID: number;
      friendlyName?: string;
      productType?: string;
      approvalDateTime?: string;
      mailClasses?: string[];
      size?: { key: string; label: string };
      proofFront?: string;
      proofPDF?: string;
    }>;
    pagination: { totalResults: number };
  }

  const data = await pcmGet<PcmDesignResponse>('/design', { page: 1, perPage: 100 });

  const designs = data.results.map(d => ({
    designID: d.designID,
    name: d.friendlyName || `Design #${d.designID}`,
    productType: d.productType || 'unknown',
    size: d.size?.label || 'unknown',
    approvedDate: d.approvalDateTime || '',
    mailClasses: d.mailClasses || [],
    proofUrl: d.proofPDF || d.proofFront || null,
  }));

  const result = { designs, total: data.pagination.totalResults };
  setCache(cacheKey, result);
  return NextResponse.json(result);
}

// ─── Status Comparison ─────────────────────────────────────────

async function getStatusComparison(domain?: string, days?: number) {
  const cacheKey = `pcm-validation:status:${domain || 'all'}:${days || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ aurora: {}, pcm: {} });
  }

  const statusDomainFilter = domain ? `AND domain = '${domain}'` : '';
  const dateFilter = days && days < 365 ? `AND date >= CURRENT_DATE - INTERVAL '${days} days'` : '';

  // Get Aurora status breakdown from rr_daily_metrics
  const statusRows = await runAuroraQuery(`
    SELECT
      COALESCE(SUM(sends_total), 0) as total_sends,
      COALESCE(SUM(sends_success), 0) as sends_success,
      COALESCE(SUM(sends_on_hold), 0) as sends_on_hold,
      COALESCE(SUM(sends_protected), 0) as sends_protected,
      COALESCE(SUM(sends_error), 0) as sends_error,
      COALESCE(SUM(delivered_count), 0) as total_delivered,
      COALESCE(SUM(undeliverable_count), 0) as total_undeliverable
    FROM rr_daily_metrics
    WHERE domain IS NOT NULL
      AND domain NOT IN (${TEST_DOMAINS})
      ${statusDomainFilter}
      ${dateFilter}
  `);

  const aurora = statusRows.length > 0 ? {
    sent: Number(statusRows[0].sends_success || 0),
    delivered: Number(statusRows[0].total_delivered || 0),
    undeliverable: Number(statusRows[0].total_undeliverable || 0),
    onHold: Number(statusRows[0].sends_on_hold || 0),
    protected: Number(statusRows[0].sends_protected || 0),
    error: Number(statusRows[0].sends_error || 0),
  } : {};

  // PCM status distribution (empty until order access resolved)
  const pcm: Record<string, number> = {};

  const result = { aurora, pcm, timestamp: new Date().toISOString() };
  setCache(cacheKey, result);
  return NextResponse.json(result);
}

// ─── Profitability Summary ─────────────────────────────────────

async function getProfitabilitySummary(domain?: string) {
  const cacheKey = `pcm-validation:profitability:${domain || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ dataAvailable: false });
  }

  // ALWAYS use dm_client_funnel cumulative totals — lifetime profitability data
  const domainWhere = domain ? `AND f.domain = '${domain}'` : '';
  const subDomainWhere = domain ? `AND dcf.domain = '${domain}'` : '';

  try {
    const rows = await runAuroraQuery(`
      SELECT
        COALESCE(SUM(f.total_cost), 0) as total_revenue,
        COALESCE(SUM(f.total_pcm_cost), 0) as total_pcm_cost,
        COALESCE(SUM(f.margin), 0) as gross_margin,
        CASE WHEN SUM(f.total_cost) > 0
          THEN ROUND((SUM(f.margin) / SUM(f.total_cost)) * 100, 2) ELSE 0 END as margin_pct,
        COALESCE(SUM(f.total_sends), 0) as total_sends
      FROM dm_client_funnel f
      INNER JOIN (
        SELECT dcf.domain, MAX(dcf.date) as md
        FROM dm_client_funnel dcf
        WHERE dcf.domain IS NOT NULL
          AND dcf.domain NOT IN (${TEST_DOMAINS})
          ${subDomainWhere}
        GROUP BY dcf.domain
      ) latest ON f.domain = latest.domain AND f.date = latest.md
      WHERE f.domain IS NOT NULL
        AND f.domain NOT IN (${TEST_DOMAINS})
        ${domainWhere}
    `);

    const row = rows[0];
    const totalRevenue = Number(row?.total_revenue || 0);
    const totalPcmCost = Number(row?.total_pcm_cost || 0);
    const totalSends = Number(row?.total_sends || 0);

    // If total_pcm_cost is 0 for all rows, the column likely doesn't have data yet
    const dataAvailable = totalPcmCost > 0;

    const result = {
      totalRevenue,
      totalPcmCost,
      grossMargin: Number(row?.gross_margin || 0),
      marginPercent: Number(row?.margin_pct || 0),
      totalSends,
      revenuePerPiece: totalSends > 0 ? Math.round((totalRevenue / totalSends) * 10000) / 10000 : 0,
      pcmCostPerPiece: totalSends > 0 ? Math.round((totalPcmCost / totalSends) * 10000) / 10000 : 0,
      dataAvailable,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    // Column doesn't exist yet — graceful fallback
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('total_pcm_cost') || msg.includes('margin')) {
      return NextResponse.json({ dataAvailable: false });
    }
    throw error;
  }
}

// ─── Margin by Mail Class ─────────────────────────────────────

async function getMarginByMailClass(domain?: string) {
  const cacheKey = `pcm-validation:mail-class:${domain || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ mailClasses: [], dataAvailable: false });
  }

  // ALWAYS use dm_volume_summary cumulative columns — lifetime per-mail-class margins
  const vsWhere = domain ? `AND vs.domain = '${domain}'` : '';
  const subWhere = domain ? `AND vsm.domain = '${domain}'` : '';

  try {
    const rows = await runAuroraQuery(`
      SELECT
        vs.mail_class,
        COALESCE(SUM(vs.cumulative_sends), 0) as sends,
        COALESCE(SUM(vs.cumulative_cost), 0) as revenue,
        COALESCE(SUM(vs.cumulative_pcm_cost), 0) as pcm_cost,
        COALESCE(SUM(vs.cumulative_margin), 0) as margin,
        CASE WHEN SUM(vs.cumulative_cost) > 0
          THEN ROUND((SUM(vs.cumulative_margin) / SUM(vs.cumulative_cost)) * 100, 2) ELSE 0 END as margin_pct
      FROM dm_volume_summary vs
      INNER JOIN (
        SELECT vsm.domain, MAX(vsm.date) as md
        FROM dm_volume_summary vsm
        WHERE vsm.domain NOT IN (${TEST_DOMAINS})
          AND vsm.mail_class != 'all'
          AND vsm.mail_class IS NOT NULL
          ${subWhere}
        GROUP BY vsm.domain
      ) latest ON vs.domain = latest.domain AND vs.date = latest.md
      WHERE vs.mail_class != 'all'
        AND vs.mail_class IS NOT NULL
        AND vs.domain NOT IN (${TEST_DOMAINS})
        ${vsWhere}
      GROUP BY vs.mail_class
    `);

    const mailClasses = rows.map(r => ({
      mailClass: String(r.mail_class),
      sends: Number(r.sends || 0),
      revenue: Number(r.revenue || 0),
      pcmCost: Number(r.pcm_cost || 0),
      margin: Number(r.margin || 0),
      marginPercent: Number(r.margin_pct || 0),
    }));

    const dataAvailable = mailClasses.length > 0 && mailClasses.some(m => m.pcmCost > 0);

    const result = { mailClasses, dataAvailable };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('mail_class') || msg.includes('cumulative_pcm_cost')) {
      return NextResponse.json({ mailClasses: [], dataAvailable: false });
    }
    throw error;
  }
}

// ─── Client Margins ───────────────────────────────────────────

async function getClientMargins(domain?: string) {
  const cacheKey = `pcm-validation:client-margins:${domain || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ clients: [], dataAvailable: false });
  }

  // ALWAYS use dm_client_funnel cumulative totals — lifetime per-client margin
  const domainWhere = domain ? `AND f.domain = '${domain}'` : '';
  const subDomainWhere = domain ? `AND dcf.domain = '${domain}'` : '';

  try {
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
        SELECT dcf.domain, MAX(dcf.date) as md
        FROM dm_client_funnel dcf
        WHERE dcf.domain IS NOT NULL
          AND dcf.domain NOT IN (${TEST_DOMAINS})
          ${subDomainWhere}
        GROUP BY dcf.domain
      ) latest ON f.domain = latest.domain AND f.date = latest.md
      WHERE f.domain IS NOT NULL
        AND f.domain NOT IN (${TEST_DOMAINS})
        ${domainWhere}
      ORDER BY f.margin ASC
    `);

    const clients = rows.map(r => ({
      domain: String(r.domain),
      sends: Number(r.sends || 0),
      revenue: Number(r.revenue || 0),
      pcmCost: Number(r.pcm_cost || 0),
      margin: Number(r.margin || 0),
      marginPercent: Number(r.margin_pct || 0),
    }));

    const dataAvailable = clients.length > 0 && clients.some(c => c.pcmCost > 0);

    const result = { clients, dataAvailable };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('total_pcm_cost') || msg.includes('margin')) {
      return NextResponse.json({ clients: [], dataAvailable: false });
    }
    throw error;
  }
}

// ─── Margin Trend ─────────────────────────────────────────────

async function getMarginTrend(domain?: string, days?: number) {
  const cacheKey = `pcm-validation:margin-trend:${domain || 'all'}:${days || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ trend: [], dataAvailable: false });
  }

  const domainWhere = domain ? `AND domain = '${domain}'` : '';
  const dateFilter = days && days < 365 ? `AND date >= CURRENT_DATE - INTERVAL '${days} days'` : '';

  try {
    const rows = await runAuroraQuery(`
      SELECT
        date,
        COALESCE(SUM(daily_cost), 0) as daily_revenue,
        COALESCE(SUM(daily_pcm_cost), 0) as daily_pcm_cost,
        COALESCE(SUM(daily_margin), 0) as daily_margin
      FROM dm_volume_summary
      WHERE (mail_class = 'all' OR mail_class IS NULL)
        AND domain NOT IN (${TEST_DOMAINS})
        ${domainWhere}
        ${dateFilter}
      GROUP BY date
      ORDER BY date
    `);

    const trend = rows.map(r => ({
      date: String(r.date).slice(0, 10),
      dailyRevenue: Number(r.daily_revenue || 0),
      dailyPcmCost: Number(r.daily_pcm_cost || 0),
      dailyMargin: Number(r.daily_margin || 0),
    }));

    const dataAvailable = trend.length > 0 && trend.some(t => t.dailyPcmCost > 0);

    const result = { trend, dataAvailable };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('daily_pcm_cost') || msg.includes('daily_margin') || msg.includes('mail_class')) {
      return NextResponse.json({ trend: [], dataAvailable: false });
    }
    throw error;
  }
}

// ─── Helpers ───────────────────────────────────────────────────

async function fetchPcmSummary() {
  interface PcmPaginatedResponse {
    results: unknown[];
    pagination: { totalResults: number };
  }

  const [balance, orders, designs] = await Promise.all([
    pcmGet<{ moneyOnAccount: number }>('/integration/balance').catch((e) => {
      console.error('[PCM] /integration/balance failed:', e.message);
      return { moneyOnAccount: 0 };
    }),
    pcmGet<PcmPaginatedResponse>('/order', { page: 1, perPage: 1 }).catch((e) => {
      console.error('[PCM] /order failed:', e.message);
      return { results: [], pagination: { totalResults: 0 } };
    }),
    pcmGet<PcmPaginatedResponse>('/design', { page: 1, perPage: 1 }).catch((e) => {
      console.error('[PCM] /design failed:', e.message);
      return { results: [], pagination: { totalResults: 0 } };
    }),
  ]);

  return {
    balance: balance.moneyOnAccount,
    orderCount: orders.pagination.totalResults,
    designCount: designs.pagination.totalResults,
  };
}

function getEmptyPcmSummary() {
  return { balance: 0, orderCount: 0, designCount: 0 };
}

async function fetchAuroraSummary(domain?: string) {
  const domFilter = domain ? `AND f.domain = '${domain}'` : '';
  const subDomFilter = domain ? `AND dcf.domain = '${domain}'` : '';

  // ALWAYS use dm_client_funnel cumulative totals — this is the corrected source of truth
  const rows = await runAuroraQuery(`
    SELECT
      COALESCE(SUM(f.total_sends), 0) as total_sends,
      COALESCE(SUM(f.total_delivered), 0) as total_delivered,
      COALESCE(SUM(f.total_cost), 0) as total_cost,
      COUNT(DISTINCT f.domain) as domain_count
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT dcf.domain, MAX(dcf.date) as max_date
      FROM dm_client_funnel dcf
      WHERE dcf.domain IS NOT NULL
        AND dcf.domain NOT IN (${TEST_DOMAINS})
        ${subDomFilter}
      GROUP BY dcf.domain
    ) latest ON f.domain = latest.domain AND f.date = latest.max_date
    WHERE f.domain IS NOT NULL
      AND f.domain NOT IN (${TEST_DOMAINS})
      ${domFilter}
  `);

  if (rows.length === 0) return getEmptyAuroraSummary();

  return {
    totalSends: Number(rows[0].total_sends || 0),
    totalDelivered: Number(rows[0].total_delivered || 0),
    totalCost: Number(rows[0].total_cost || 0),
    domainCount: Number(rows[0].domain_count || 0),
  };
}

function getEmptyAuroraSummary() {
  return { totalSends: 0, totalDelivered: 0, totalCost: 0, domainCount: 0 };
}

/**
 * Count active campaigns and distinct domains with active campaigns from rr_campaign_snapshots.
 * Uses the same definition as Operational Health: status = 'active' in the latest snapshot.
 * This ensures cross-tab consistency between "Is it running?" and the PCM volume widget.
 */
async function fetchActiveCampaignCount(domain?: string) {
  const domFilter = domain ? `AND cs.domain = '${domain}'` : '';
  const rows = await runAuroraQuery(`
    SELECT
      COUNT(*) FILTER (WHERE cs.status = 'active') as active_campaigns,
      COUNT(DISTINCT cs.domain) FILTER (WHERE cs.status = 'active') as active_domains
    FROM (
      SELECT DISTINCT ON (domain, campaign_id) domain, campaign_id, status
      FROM rr_campaign_snapshots
      WHERE domain NOT IN (${TEST_DOMAINS})
        ${domFilter}
      ORDER BY domain, campaign_id, snapshot_at DESC
    ) cs
  `);

  if (rows.length === 0) return { activeCampaigns: 0, activeDomainsCount: 0 };
  return {
    activeCampaigns: Number(rows[0].active_campaigns || 0),
    activeDomainsCount: Number(rows[0].active_domains || 0),
  };
}

function calculateMatchRate(pcmTotal: number, auroraTotal: number): number {
  if (pcmTotal === 0 && auroraTotal === 0) return 100;
  if (pcmTotal === 0 || auroraTotal === 0) return 0;
  const ratio = Math.min(pcmTotal, auroraTotal) / Math.max(pcmTotal, auroraTotal);
  return Math.round(ratio * 10000) / 100;
}
