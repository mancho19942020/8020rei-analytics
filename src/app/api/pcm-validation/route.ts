/**
 * PCM Validation & Profitability — Next.js API Route
 *
 * Fetches reconciliation data from PCM API + Aurora and returns
 * comparison summaries for the PCM & Profitability tab widgets.
 *
 * Supports: summary, domain-breakdown, designs, status-comparison,
 *           profitability-summary, margin-by-mail-class, client-margins, margin-trend,
 *           current-rates, price-detection, price-impact
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
import { pcmGet, isPcmConfigured } from '@/lib/pcm-client';
// Test-domain exclusion — canonical source. Any change applies everywhere simultaneously.
import { TEST_DOMAINS_SQL as TEST_DOMAINS } from '@/lib/domain-filter';
// PCM-invoice-authoritative cost: paginate PCM's own orders and apply invoice-verified
// era rates. This is the "Aurora + PCM, always both" rule. The monolith's stored
// total_pcm_cost differs from this because (a) it uses $0.625/$0.875 rates and
// (b) leaves ~8-12% of pieces un-tagged with mail_class.
import {
  fetchPcmOrdersSlim,
  getCachedPcmOrdersSlim,
  readCache as readOverviewCache,
} from '@/app/api/dm-overview/compute';
import type { PcmOrderSlim } from '@/app/api/dm-overview/compute';
import type { DmOverviewHeadline } from '@/types/dm-overview';
// Single source of truth for PCM invoice era rates
import {
  pcmRate,
  computePcmInvoiceCost,
  getPcmEra as getSharedPcmEra,
  currentPcmRates,
} from '@/lib/pcm-pricing-eras';

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
  const startDate = params.get('startDate') || undefined;
  const endDate = params.get('endDate') || undefined;

  try {
    switch (type) {
      case 'summary':
        return await getSummary(domain, days);
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
      case 'current-rates':
        return await getCurrentRates(domain);
      case 'price-detection':
        return await getPriceDetection(domain);
      case 'price-impact':
        return await getPriceImpact(domain);
      case 'pricing-history':
        return await getPricingHistory(domain);
      case 'profitability-period':
        return await getProfitabilityPeriod(domain, days, startDate, endDate);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    // Full trace → server log. Generic message → client (never expose SQL / stack to stakeholders).
    console.error(`[PCM Validation] Error fetching ${type}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Unable to load ${type}. Please retry.`,
      },
      { status: 500 }
    );
  }
}

// ─── Summary ───────────────────────────────────────────────────

async function getSummary(domain?: string, days?: number) {
  const effectiveDays = days || 30;
  const cacheKey = `pcm-validation:summary:${domain || 'all'}:${effectiveDays}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const pcmConfigured = isPcmConfigured();
  const auroraConfigured = isAuroraConfigured();

  // Fetch PCM + Aurora + active campaign count + alignment health in parallel
  const [pcmData, auroraData, activeCampaignData, alignmentHealth] = await Promise.all([
    pcmConfigured ? fetchPcmSummary() : getEmptyPcmSummary(),
    auroraConfigured ? fetchAuroraSummary(domain) : getEmptyAuroraSummary(),
    auroraConfigured ? fetchActiveCampaignCount(domain) : { activeCampaigns: 0, activeDomainsCount: 0 },
    auroraConfigured ? fetchAlignmentHealth(domain, effectiveDays) : { totalDomains: 0, syncedDomains: 0, domainsWithGaps: 0, totalSyncGap: 0, alignmentMatchRate: 100 },
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
    // Alignment health from rr_pcm_alignment (PCM-verified, per-domain)
    alignmentHealth,
    timestamp: new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return NextResponse.json(result);
}

/**
 * Fetch alignment health from rr_pcm_alignment — per-domain PCM comparison.
 * Returns domain-level sync status: how many domains are fully synced with PCM,
 * how many have gaps, and the aggregate match rate.
 */
async function fetchAlignmentHealth(domain?: string, days?: number) {
  const effectiveDays = days || 30;
  const domFilter = domain ? `AND domain = '${domain.replace(/[^a-zA-Z0-9_.]/g, '')}'` : '';
  const rows = await runAuroraQuery(`
    SELECT DISTINCT ON (domain)
      domain,
      COALESCE(back_office_sync_gap, 0) as sync_gap,
      COALESCE(stale_sent_count, 0) as stale,
      COALESCE(orphaned_orders_count, 0) as orphaned
    FROM rr_pcm_alignment
    WHERE domain NOT IN (${TEST_DOMAINS})
      AND checked_at >= CURRENT_DATE - INTERVAL '${effectiveDays} days'
      ${domFilter}
    ORDER BY domain, checked_at DESC
  `);

  const totalDomains = rows.length;
  const domainsWithGaps = rows.filter((r: Record<string, unknown>) => Number(r.sync_gap) > 0).length;
  const syncedDomains = totalDomains - domainsWithGaps;
  const totalSyncGap = rows.reduce((s: number, r: Record<string, unknown>) => s + Math.max(0, Number(r.sync_gap || 0)), 0);
  const totalStale = rows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.stale || 0), 0);
  const totalOrphaned = rows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.orphaned || 0), 0);
  const alignmentMatchRate = totalDomains > 0
    ? Number(((syncedDomains / totalDomains) * 100).toFixed(1))
    : 100;

  return { totalDomains, syncedDomains, domainsWithGaps, totalSyncGap, totalStale, totalOrphaned, alignmentMatchRate };
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

  // Golden rule: Aurora + PCM, always both. Revenue comes from Aurora
  // (dm_client_funnel.total_cost — reliable, populated for every send).
  // PCM cost is computed from PCM's own /order records × invoice-verified
  // era rates — this is the vendor's ground truth, not the monolith's
  // broken stored value ($0.625/$0.875 rates on ~92% of pieces).
  const domainWhere = domain ? `AND f.domain = '${domain}'` : '';
  const subDomainWhere = domain ? `AND dcf.domain = '${domain}'` : '';

  try {
    // First try the Overview's Aurora-persisted cache: its `headline` payload
    // already contains the PCM-invoice cost computed by the 30-min cron.
    // This gives us the invoice-authoritative number in <300ms — no pagination.
    //
    // CROSS-TAB CONSISTENCY CONTRACT: the Profitability Margin summary widget
    // displays the SAME net company margin as the Overview Company margin card.
    // Both read from this cache payload. The decomposition is:
    //   revenue  (Aurora dm_client_funnel.total_cost, real clients only)
    //   − PCM cost (PCM /order × invoice-verified era rates, real clients only)
    //   = gross margin
    //   − internal test-domain PCM cost (QA / sandbox sends 8020REI paid PCM for,
    //     no client revenue — company P&L honesty)
    //   = NET company margin     ← the headline number, matches Overview
    //
    // Historical bug (2026-04-20): this endpoint only returned `grossMargin`,
    // while the Overview card returned the net `companyMargin`. Same cache,
    // different fields, different labels — user saw $2.0K vs $1.8K on two tabs
    // for what looked like the same metric. Now both return full decomposition.
    const headlineCache = !domain ? await readOverviewCache<DmOverviewHeadline>('headline') : null;
    if (headlineCache?.data?.companyMargin) {
      const cm = headlineCache.data.companyMargin;
      const totalSends = headlineCache.data.lifetimePieces?.aurora ?? 0;
      const pcmPieces = headlineCache.data.lifetimePieces?.pcm ?? 0;
      const testCost = cm.pcmCostTest ?? 0;
      const netCompanyMargin = cm.margin;                   // test-cost-deducted, matches Overview
      const netCompanyMarginPct = cm.marginPct;
      const result = {
        totalRevenue: cm.clientRevenue,
        totalPcmCost: cm.pcmCostReal,                      // invoice-authoritative from cron
        grossMargin: cm.grossMargin,
        grossMarginPct: cm.grossMarginPct ?? (cm.clientRevenue > 0 ? (cm.grossMargin / cm.clientRevenue) * 100 : 0),
        // NET company margin — identical to Overview's Company margin card.
        // Cross-tab consistency contract: these two fields must remain ===.
        netCompanyMargin,
        netCompanyMarginPct,
        internalTestCost: Number(testCost.toFixed(2)),
        // Legacy alias — `marginPercent` historically meant gross margin %.
        // Keep it pointing at gross so existing chart/widget math doesn't shift.
        marginPercent: cm.grossMarginPct ?? (cm.clientRevenue > 0 ? (cm.grossMargin / cm.clientRevenue) * 100 : 0),
        totalSends,
        pcmPiecesInvoice: pcmPieces,
        revenuePerPiece: totalSends > 0 ? Math.round((cm.clientRevenue / totalSends) * 10000) / 10000 : 0,
        pcmCostPerPiece: pcmPieces > 0 ? Math.round((cm.pcmCostReal / pcmPieces) * 10000) / 10000 : 0,
        dataAvailable: true,
        reconciliation: {
          auroraStoredPcmCost: cm.auroraStoredPcmCost ?? 0,
          auroraStoredMargin: cm.auroraStoredMargin ?? 0,
          pcmVsAuroraCostDelta: cm.pcmVsAuroraCostDelta ?? 0,
          note: 'PCM cost from PCM /order × invoice-verified era rates (computed by 30-min Overview cron). Aurora stored cost differs because the monolith uses $0.625/$0.875 rates.',
        },
      };
      setCache(cacheKey, result);
      return NextResponse.json(result);
    }

    // No Overview cache hit — fall back to live Aurora query + non-blocking
    // PCM cache. If PCM cache is cold we return Aurora-stored values with a
    // "warming" reconciliation note; the user sees fast numbers and refreshes
    // once the cache warms.
    const auroraRows = await runAuroraQuery(`
      SELECT
        COALESCE(SUM(f.total_cost), 0) as total_revenue,
        COALESCE(SUM(f.total_pcm_cost), 0) as aurora_stored_pcm_cost,
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

    const row = auroraRows[0];
    const totalRevenue = Number(row?.total_revenue || 0);
    const auroraStoredPcmCost = Number(row?.aurora_stored_pcm_cost || 0);
    const totalSends = Number(row?.total_sends || 0);

    const orders = readPcmOrdersCacheOrWarm();
    let pcmCostInvoice: number;
    let pcmPiecesInvoice: number;
    let internalTestCost: number;
    let invoiceAvailable: boolean;

    if (orders) {
      const realOrders = orders.filter(o =>
        !o.canceled && !o.isTestDomain && (!domain || o.domain === domain)
      );
      // Internal test-domain cost — same definition as dm-overview/compute.ts.
      // Excluded from domain-scoped queries (user is filtering to one client).
      const testOrders = !domain
        ? orders.filter(o => !o.canceled && o.isTestDomain)
        : [];
      pcmCostInvoice = computePcmInvoiceCost(realOrders);
      pcmPiecesInvoice = realOrders.length;
      internalTestCost = computePcmInvoiceCost(testOrders);
      invoiceAvailable = true;
    } else {
      // Cold — use Aurora-stored as a temporary placeholder. Surface it to the UI.
      pcmCostInvoice = auroraStoredPcmCost;
      pcmPiecesInvoice = totalSends;
      internalTestCost = 0;
      invoiceAvailable = false;
    }

    const grossMargin = Math.round((totalRevenue - pcmCostInvoice) * 100) / 100;
    const grossMarginPct = totalRevenue > 0
      ? Math.round((grossMargin / totalRevenue) * 10000) / 100
      : 0;
    const netCompanyMargin = Math.round((grossMargin - internalTestCost) * 100) / 100;
    const netCompanyMarginPct = totalRevenue > 0
      ? Math.round((netCompanyMargin / totalRevenue) * 10000) / 100
      : 0;
    const auroraStoredMargin = Math.round((totalRevenue - auroraStoredPcmCost) * 100) / 100;
    const pcmVsAuroraCostDelta = Math.round((pcmCostInvoice - auroraStoredPcmCost) * 100) / 100;

    const result = {
      totalRevenue,
      totalPcmCost: pcmCostInvoice,
      grossMargin,
      grossMarginPct,
      netCompanyMargin,
      netCompanyMarginPct,
      internalTestCost: Number(internalTestCost.toFixed(2)),
      // Legacy alias — historically gross margin %, keep for existing consumers.
      marginPercent: grossMarginPct,
      totalSends,
      pcmPiecesInvoice,
      revenuePerPiece: totalSends > 0 ? Math.round((totalRevenue / totalSends) * 10000) / 10000 : 0,
      pcmCostPerPiece: pcmPiecesInvoice > 0 ? Math.round((pcmCostInvoice / pcmPiecesInvoice) * 10000) / 10000 : 0,
      dataAvailable: totalRevenue > 0,
      reconciliation: {
        auroraStoredPcmCost,
        auroraStoredMargin,
        pcmVsAuroraCostDelta,
        note: invoiceAvailable
          ? 'PCM cost is PCM /order × invoice-verified era rates. Aurora stored cost shown for reconciliation.'
          : 'PCM /order cache is warming (~90s first load). Showing Aurora-stored PCM cost as placeholder; refresh in ~2 min for invoice-authoritative numbers.',
      },
    };

    // Shorter cache when invoice data is missing so user gets the real numbers soon after warmup
    setCache(cacheKey, result, invoiceAvailable ? undefined : 60_000);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('total_pcm_cost') || msg.includes('margin')) {
      return NextResponse.json({ dataAvailable: false });
    }
    throw error;
  }
}

/**
 * Non-blocking PCM orders accessor. Returns the in-memory cache if warm,
 * otherwise returns null and kicks off a background fetch. Endpoints that
 * depend on PCM orders should fall back to Aurora-side numbers (or the
 * dm_overview_cache Aurora row) when this returns null — pagination takes
 * ~90s so we never block a request on it.
 */
function readPcmOrdersCacheOrWarm(): PcmOrderSlim[] | null {
  const cached = getCachedPcmOrdersSlim();
  if (cached) return cached;
  // Kick off background pagination — don't await. Next request will hit cache.
  fetchPcmOrdersSlim().catch(e => {
    console.error('[pcm-validation] background PCM pagination failed:', e instanceof Error ? e.message : e);
  });
  return null;
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
    // Compute margin locally (revenue − pcm_cost) rather than reading the
    // stored `cumulative_margin` column, for the same reason as elsewhere:
    // stored margin is 0 when pcm_cost is missing, which makes the math fail
    // the "these three columns add up" test.
    const rows = await runAuroraQuery(`
      SELECT
        vs.mail_class,
        COALESCE(SUM(vs.cumulative_sends), 0) as sends,
        COALESCE(SUM(vs.cumulative_cost), 0) as revenue,
        COALESCE(SUM(vs.cumulative_pcm_cost), 0) as pcm_cost
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

    const mailClasses = rows.map(r => {
      const revenue = Number(r.revenue || 0);
      const pcmCost = Number(r.pcm_cost || 0);
      const margin = Math.round((revenue - pcmCost) * 100) / 100;
      const marginPercent = revenue > 0 ? Math.round((margin / revenue) * 10000) / 100 : 0;
      return {
        mailClass: String(r.mail_class),
        sends: Number(r.sends || 0),
        revenue,
        pcmCost,
        margin,
        marginPercent,
      };
    });

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
    // Revenue (customer-billed) comes from Aurora. PCM cost per domain is
    // attributed from PCM /order × invoice-verified era rates — the vendor's
    // own data, not the monolith's broken stored value.
    const auroraRows = await runAuroraQuery(`
      SELECT
        f.domain,
        COALESCE(f.total_sends, 0) as sends,
        COALESCE(f.total_cost, 0) as revenue,
        COALESCE(f.total_pcm_cost, 0) as aurora_stored_pcm_cost
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

    // Non-blocking: use PCM cache if warm, fall back to Aurora stored otherwise
    const orders = readPcmOrdersCacheOrWarm();
    const pcmCostByDomain = new Map<string, { cost: number; pieces: number }>();
    if (orders) {
      for (const o of orders) {
        if (o.canceled || o.isTestDomain) continue;
        if (domain && o.domain !== domain) continue;
        const entry = pcmCostByDomain.get(o.domain) || { cost: 0, pieces: 0 };
        entry.cost += pcmRate(o.date, o.mailClass);
        entry.pieces += 1;
        pcmCostByDomain.set(o.domain, entry);
      }
    }

    const clients = auroraRows.map(r => {
      const dom = String(r.domain);
      const revenue = Number(r.revenue || 0);
      const auroraStoredPcmCost = Number(r.aurora_stored_pcm_cost || 0);
      const pcmInvoice = pcmCostByDomain.get(dom);
      // Use PCM-invoice cost when available; otherwise Aurora-stored (cold cache)
      const pcmCost = pcmInvoice
        ? Math.round(pcmInvoice.cost * 100) / 100
        : auroraStoredPcmCost;
      const margin = Math.round((revenue - pcmCost) * 100) / 100;
      const marginPercent = revenue > 0 ? Math.round((margin / revenue) * 10000) / 100 : 0;
      return {
        domain: dom,
        sends: Number(r.sends || 0),
        revenue,
        pcmCost,
        margin,
        marginPercent,
        auroraStoredPcmCost,
        pcmPiecesInvoice: pcmInvoice?.pieces ?? 0,
      };
    });

    // Sort by margin ascending (losers first — same sort behavior as before)
    clients.sort((a, b) => a.margin - b.margin);

    const dataAvailable = clients.length > 0 && clients.some(c => c.pcmCost > 0 || c.revenue > 0);

    const result = { clients, dataAvailable };
    // Short TTL when we fell back to Aurora stored, so the user gets invoice
    // numbers shortly after the cache warms
    setCache(cacheKey, result, orders ? undefined : 60_000);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('total_pcm_cost') || msg.includes('margin')) {
      return NextResponse.json({ clients: [], dataAvailable: false });
    }
    throw error;
  }
}

// ─── Margin Trend (per-piece rate history from dm_property_conversions + PCM eras) ───

// PCM era rates come from `@/lib/pcm-pricing-eras` (single source of truth).
// See top of file for the import.

function getPcmRates(monthStr: string): { fcRate: number; stdRate: number } {
  const era = getSharedPcmEra(monthStr.length >= 10 ? monthStr : `${monthStr}-15`);
  return { fcRate: era.fcRate, stdRate: era.stdRate };
}

function classifyMailClass(unitRate: number): 'first_class' | 'standard' | 'unknown' {
  // Known FC rates: $1.39, $0.87, $0.90
  if (unitRate >= 1.20) return 'first_class';       // old FC ($1.39)
  if (unitRate >= 0.85 && unitRate <= 0.95) return 'first_class'; // new FC ($0.87, $0.90)
  // Known Std rates: $1.08, $1.13, $0.63, $0.66
  if (unitRate >= 1.00 && unitRate < 1.20) return 'standard';    // old Std ($1.08, $1.13)
  if (unitRate < 0.70) return 'standard';            // new Std ($0.63, $0.66)
  return 'unknown';
}

async function getMarginTrend(domain?: string, _days?: number) {
  const cacheKey = `pcm-validation:margin-trend:${domain || 'all'}:rate-history`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ trend: [], dataAvailable: false });
  }

  const domainWhere = domain ? `AND domain = '${domain}'` : '';

  try {
    // Query dm_property_conversions: per-piece unit rate grouped by month + rate tier
    // This is the same approach used in the profitability report (54K+ records, Feb 2025+)
    const rows = await runAuroraQuery(`
      SELECT
        DATE_TRUNC('month', first_sent_date)::DATE as month,
        ROUND(total_cost::numeric / NULLIF(total_sends, 0)::numeric, 2) as unit_rate,
        SUM(total_sends) as sends
      FROM dm_property_conversions
      WHERE first_sent_date IS NOT NULL
        AND total_sends > 0
        AND domain NOT IN (${TEST_DOMAINS})
        ${domainWhere}
      GROUP BY DATE_TRUNC('month', first_sent_date),
               ROUND(total_cost::numeric / NULLIF(total_sends, 0)::numeric, 2)
      ORDER BY month, unit_rate
    `);

    // Group by month and classify into FC/Std
    const monthMap: Record<string, {
      fcRateSum: number; fcSends: number;
      stdRateSum: number; stdSends: number;
    }> = {};

    for (const row of rows) {
      const monthStr = String(row.month).slice(0, 7); // YYYY-MM
      const unitRate = Number(row.unit_rate || 0);
      const sends = Number(row.sends || 0);
      const mailClass = classifyMailClass(unitRate);

      if (!monthMap[monthStr]) {
        monthMap[monthStr] = { fcRateSum: 0, fcSends: 0, stdRateSum: 0, stdSends: 0 };
      }

      if (mailClass === 'first_class') {
        monthMap[monthStr].fcRateSum += unitRate * sends;
        monthMap[monthStr].fcSends += sends;
      } else if (mailClass === 'standard') {
        monthMap[monthStr].stdRateSum += unitRate * sends;
        monthMap[monthStr].stdSends += sends;
      }
      // 'unknown' rates are skipped (very rare)
    }

    // For the current (in-progress) month, we want the chart's last point to
    // reflect the MOST RECENT rate, not the monthly weighted blend. Otherwise
    // a rate bump mid-month shows up as an average (e.g. $0.6402 Apr '26 when
    // Std went $0.63 → $0.66 on Apr 19) and readers reasonably conclude the
    // chart is stale or the bump never happened. The reference line at the
    // change date + this last-point override give the user a visible step.
    //
    // Source for the "latest rate": same per-day daily rate from dm_volume_summary
    // that getPriceDetection uses. Pick the most recent day per mail class within
    // the current month; fall back to the blend if no recent rows.
    const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    const latestDailyRows = await runAuroraQuery(`
      SELECT DISTINCT ON (mail_class)
        mail_class,
        ROUND(SUM(daily_cost) OVER (PARTITION BY mail_class, date)::numeric
          / NULLIF(SUM(daily_sends) OVER (PARTITION BY mail_class, date), 0)::numeric, 4) as latest_rate,
        date as latest_date
      FROM dm_volume_summary
      WHERE mail_class IN ('standard', 'first_class')
        AND daily_sends > 0
        AND domain NOT IN (${TEST_DOMAINS})
        AND to_char(date, 'YYYY-MM') = '${currentMonthKey}'
        ${domainWhere}
      ORDER BY mail_class, date DESC
    `).catch(() => [] as Record<string, unknown>[]);

    const latestStdRate = latestDailyRows.find(r => r.mail_class === 'standard');
    const latestFcRate = latestDailyRows.find(r => r.mail_class === 'first_class');

    // Build trend with all 5 values per month
    const trend = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const isCurrentMonth = month === currentMonthKey;

        // For the current month, override with the latest daily rate (if we found
        // one). For historical months, keep the weighted blend — those months
        // are closed and the blend IS the actual average.
        const ourFcRate = isCurrentMonth && latestFcRate?.latest_rate
          ? Number(latestFcRate.latest_rate)
          : data.fcSends > 0
            ? Math.round((data.fcRateSum / data.fcSends) * 10000) / 10000
            : 0;
        const ourStdRate = isCurrentMonth && latestStdRate?.latest_rate
          ? Number(latestStdRate.latest_rate)
          : data.stdSends > 0
            ? Math.round((data.stdRateSum / data.stdSends) * 10000) / 10000
            : 0;

        const pcm = getPcmRates(month);
        const fcMargin = ourFcRate > 0 ? Math.round((ourFcRate - pcm.fcRate) * 10000) / 10000 : 0;
        const stdMargin = ourStdRate > 0 ? Math.round((ourStdRate - pcm.stdRate) * 10000) / 10000 : 0;

        // Blended margin weighted by send volume
        const totalSends = data.fcSends + data.stdSends;
        const blendedMargin = totalSends > 0
          ? Math.round(((fcMargin * data.fcSends + stdMargin * data.stdSends) / totalSends) * 10000) / 10000
          : 0;

        return {
          month,
          ourFcRate,
          ourStdRate,
          pcmFcRate: pcm.fcRate,
          pcmStdRate: pcm.stdRate,
          fcMargin,
          stdMargin,
          blendedMargin,
          fcSends: data.fcSends,
          stdSends: data.stdSends,
          // Flag so the widget can render a subtle "latest" indicator at the
          // current-month point instead of implying the month is closed.
          isCurrentMonth,
        };
      });

    const dataAvailable = trend.length > 0;

    const result = {
      trend,
      dataAvailable,
      // Surface metadata so the widget footnote can say "Current month: latest
      // observed rate as of YYYY-MM-DD" — transparent about which point is live
      // vs. historical closed-month averages.
      currentMonth: {
        month: currentMonthKey,
        standardLatestDate: latestStdRate?.latest_date ? String(latestStdRate.latest_date).slice(0, 10) : null,
        firstClassLatestDate: latestFcRate?.latest_date ? String(latestFcRate.latest_date).slice(0, 10) : null,
      },
    };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('first_sent_date') || msg.includes('total_cost')) {
      return NextResponse.json({ trend: [], dataAvailable: false });
    }
    throw error;
  }
}

// ─── Current Rates (data-driven, replaces hardcoded values) ──

async function getCurrentRates(domain?: string) {
  const cacheKey = `pcm-validation:current-rates:${domain || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ standard: null, firstClass: null, blended: null, dataAvailable: false });
  }

  const domainWhere = domain ? `AND domain = '${domain}'` : '';

  try {
    const rows = await runAuroraQuery(`
      SELECT
        mail_class,
        ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 4) as current_rate,
        SUM(daily_sends) as recent_sends,
        MIN(date) as period_start,
        MAX(date) as period_end
      FROM dm_volume_summary
      WHERE mail_class IN ('standard', 'first_class')
        AND date >= CURRENT_DATE - INTERVAL '7 days'
        AND daily_sends > 0
        AND domain NOT IN (${TEST_DOMAINS})
        ${domainWhere}
      GROUP BY mail_class
    `);

    const stdRow = rows.find(r => r.mail_class === 'standard');
    const fcRow = rows.find(r => r.mail_class === 'first_class');

    const standard = stdRow ? Number(stdRow.current_rate) : null;
    const firstClass = fcRow ? Number(fcRow.current_rate) : null;

    // Blended rate from the 'all' mail_class
    const blendedRows = await runAuroraQuery(`
      SELECT ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 4) as blended_rate
      FROM dm_volume_summary
      WHERE (mail_class = 'all' OR mail_class IS NULL)
        AND date >= CURRENT_DATE - INTERVAL '7 days'
        AND daily_sends > 0
        AND domain NOT IN (${TEST_DOMAINS})
        ${domainWhere}
    `);

    const blended = blendedRows[0]?.blended_rate ? Number(blendedRows[0].blended_rate) : null;

    // Invoice-verified PCM rates for today's era. These are the rates PCM
    // actually charges us — NOT what the monolith's parameters.pcm_cost
    // column says. Widgets should show these as "PCM charges us" so the
    // story stays consistent with Pricing history.
    const pcm = currentPcmRates();

    const result = {
      standard,
      firstClass,
      blended,
      pcmStandard: pcm.std,
      pcmFirstClass: pcm.fc,
      pcmEraLabel: pcm.era.label,
      pcmEraStart: pcm.era.start,
      periodStart: stdRow?.period_start ? String(stdRow.period_start).slice(0, 10) : null,
      periodEnd: stdRow?.period_end ? String(stdRow.period_end).slice(0, 10) : null,
      dataAvailable: standard !== null || firstClass !== null,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('mail_class') || msg.includes('daily_cost')) {
      return NextResponse.json({ standard: null, firstClass: null, blended: null, dataAvailable: false });
    }
    throw error;
  }
}

// ─── Price Detection (auto-detect rate changes from data) ────

async function getPriceDetection(domain?: string) {
  const cacheKey = `pcm-validation:price-detection:${domain || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ currentRates: { standard: null, firstClass: null }, changes: [], rolloutStatus: { standard: null, firstClass: null }, dataAvailable: false });
  }

  const domainWhere = domain ? `AND domain = '${domain}'` : '';

  try {
    // 1. Detect aggregate rate changes per mail_class
    const changeRows = await runAuroraQuery(`
      WITH daily_rates AS (
        SELECT
          date,
          mail_class,
          SUM(daily_cost) as daily_cost,
          SUM(daily_sends) as daily_sends,
          CASE WHEN SUM(daily_sends) > 0
            THEN ROUND(SUM(daily_cost)::numeric / SUM(daily_sends)::numeric, 4)
            ELSE NULL END as effective_rate
        FROM dm_volume_summary
        WHERE mail_class IN ('standard', 'first_class')
          AND daily_sends > 0
          AND domain NOT IN (${TEST_DOMAINS})
          ${domainWhere}
        GROUP BY date, mail_class
        ORDER BY mail_class, date
      ),
      rate_changes AS (
        SELECT
          date,
          mail_class,
          effective_rate,
          daily_sends,
          LAG(effective_rate) OVER (PARTITION BY mail_class ORDER BY date) as prev_rate,
          LAG(date) OVER (PARTITION BY mail_class ORDER BY date) as prev_date
        FROM daily_rates
        WHERE effective_rate IS NOT NULL
      ),
      filtered_changes AS (
        SELECT *
        FROM rate_changes
        WHERE prev_rate IS NOT NULL
          AND ABS(effective_rate - prev_rate) > 0.005
      ),
      -- Rank per mail_class so Standard micro-variance cannot
      -- crowd out First Class changes. Previously a global LIMIT 20
      -- caused the FC Apr 2026 change to be dropped whenever Standard
      -- had 20+ recent fluctuations.
      ranked AS (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY mail_class ORDER BY date DESC) AS rn
        FROM filtered_changes
      )
      SELECT
        date as change_date,
        mail_class,
        prev_rate as old_rate,
        effective_rate as new_rate,
        effective_rate - prev_rate as rate_delta,
        daily_sends as sends_on_change_day
      FROM ranked
      WHERE rn <= 10
      ORDER BY date DESC
    `);

    const changes = changeRows.map(r => ({
      changeDate: String(r.change_date).slice(0, 10),
      mailClass: String(r.mail_class) as 'standard' | 'first_class',
      oldRate: Number(r.old_rate),
      newRate: Number(r.new_rate),
      rateDelta: Number(r.rate_delta),
      sendsOnChangeDay: Number(r.sends_on_change_day),
    }));

    // 2. Current rates (last 7 days)
    const rateRows = await runAuroraQuery(`
      SELECT
        mail_class,
        ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 4) as current_rate,
        MIN(date) as period_start,
        MAX(date) as period_end
      FROM dm_volume_summary
      WHERE mail_class IN ('standard', 'first_class')
        AND date >= CURRENT_DATE - INTERVAL '7 days'
        AND daily_sends > 0
        AND domain NOT IN (${TEST_DOMAINS})
        ${domainWhere}
      GROUP BY mail_class
    `);

    const stdRate = rateRows.find(r => r.mail_class === 'standard');
    const fcRate = rateRows.find(r => r.mail_class === 'first_class');

    const currentRates = {
      standard: stdRate ? Number(stdRate.current_rate) : null,
      firstClass: fcRate ? Number(fcRate.current_rate) : null,
      periodStart: stdRate?.period_start ? String(stdRate.period_start).slice(0, 10) : null,
      periodEnd: stdRate?.period_end ? String(stdRate.period_end).slice(0, 10) : null,
    };

    // 3. Per-domain rollout status (most recent rate per domain per mail_class)
    const domainRateRows = await runAuroraQuery(`
      SELECT DISTINCT ON (domain, mail_class)
        domain,
        mail_class,
        date,
        CASE WHEN daily_sends > 0
          THEN ROUND(daily_cost::numeric / daily_sends::numeric, 4)
          ELSE NULL END as current_rate,
        daily_sends
      FROM dm_volume_summary
      WHERE mail_class IN ('standard', 'first_class')
        AND daily_sends > 0
        AND domain NOT IN (${TEST_DOMAINS})
        ${domainWhere}
      ORDER BY domain, mail_class, date DESC
    `);

    // Group by mail class and determine migration status
    const buildRollout = (mailClass: string) => {
      const domainRows = domainRateRows.filter(r => r.mail_class === mailClass && r.current_rate != null);
      if (domainRows.length === 0) return null;

      // Most common recent rate = the "new" rate
      const rates = domainRows.map(r => Number(r.current_rate));
      const rateFreq: Record<number, number> = {};
      for (const rate of rates) {
        const rounded = Math.round(rate * 100) / 100;
        rateFreq[rounded] = (rateFreq[rounded] || 0) + 1;
      }
      const sortedRates = Object.entries(rateFreq).sort((a, b) => b[1] - a[1]);
      const newRate = Number(sortedRates[0][0]);

      const domains = domainRows.map(r => {
        const domainRate = Math.round(Number(r.current_rate) * 100) / 100;
        return {
          domain: String(r.domain),
          currentRate: Number(r.current_rate),
          migrated: Math.abs(domainRate - newRate) < 0.01,
          lastSendDate: String(r.date).slice(0, 10),
        };
      });

      return {
        newRate,
        migratedDomains: domains.filter(d => d.migrated).length,
        pendingDomains: domains.filter(d => !d.migrated).length,
        totalDomains: domains.length,
        domains,
      };
    };

    const rolloutStatus = {
      standard: buildRollout('standard'),
      firstClass: buildRollout('first_class'),
    };

    // 4. Sync coverage per mail_class — exposes Aurora sync lag so a missing
    // recent rate change isn't silently hidden. If FC's max_date is weeks
    // behind Standard's, a reader can see that the monolith hasn't sent FC
    // rows yet (or that FC simply has no recent sends).
    const coverageRows = await runAuroraQuery(`
      SELECT
        mail_class,
        MAX(date)::text AS last_synced_date,
        COUNT(DISTINCT date) AS days_synced
      FROM dm_volume_summary
      WHERE mail_class IN ('standard', 'first_class')
        AND daily_sends > 0
        AND domain NOT IN (${TEST_DOMAINS})
        ${domainWhere}
      GROUP BY mail_class
    `);
    const stdCoverage = coverageRows.find(r => r.mail_class === 'standard');
    const fcCoverage = coverageRows.find(r => r.mail_class === 'first_class');
    const coverage = {
      standard: stdCoverage
        ? { lastSyncedDate: String(stdCoverage.last_synced_date).slice(0, 10), daysSynced: Number(stdCoverage.days_synced) }
        : null,
      firstClass: fcCoverage
        ? { lastSyncedDate: String(fcCoverage.last_synced_date).slice(0, 10), daysSynced: Number(fcCoverage.days_synced) }
        : null,
    };

    const result = {
      currentRates,
      changes,
      rolloutStatus,
      coverage,
      dataAvailable: changes.length > 0 || currentRates.standard !== null || currentRates.firstClass !== null,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('mail_class') || msg.includes('daily_cost')) {
      return NextResponse.json({ currentRates: { standard: null, firstClass: null }, changes: [], rolloutStatus: { standard: null, firstClass: null }, dataAvailable: false });
    }
    throw error;
  }
}

// ─── Price Impact (before/after financial comparison) ─────────

async function getPriceImpact(domain?: string) {
  const cacheKey = `pcm-validation:price-impact:${domain || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ impacts: [], dataAvailable: false });
  }

  const domainWhere = domain ? `AND domain = '${domain}'` : '';

  try {
    // First detect the most recent rate change per mail_class
    const changeRows = await runAuroraQuery(`
      WITH daily_rates AS (
        SELECT
          date,
          mail_class,
          SUM(daily_cost) as daily_cost,
          SUM(daily_sends) as daily_sends,
          CASE WHEN SUM(daily_sends) > 0
            THEN ROUND(SUM(daily_cost)::numeric / SUM(daily_sends)::numeric, 4)
            ELSE NULL END as effective_rate
        FROM dm_volume_summary
        WHERE mail_class IN ('standard', 'first_class')
          AND daily_sends > 0
          AND domain NOT IN (${TEST_DOMAINS})
          ${domainWhere}
        GROUP BY date, mail_class
        ORDER BY mail_class, date
      ),
      rate_changes AS (
        SELECT
          date,
          mail_class,
          effective_rate,
          LAG(effective_rate) OVER (PARTITION BY mail_class ORDER BY date) as prev_rate
        FROM daily_rates
        WHERE effective_rate IS NOT NULL
      )
      SELECT DISTINCT ON (mail_class)
        date as change_date,
        mail_class,
        prev_rate as old_rate,
        effective_rate as new_rate
      FROM rate_changes
      WHERE prev_rate IS NOT NULL
        AND ABS(effective_rate - prev_rate) > 0.005
      ORDER BY mail_class, date DESC
    `);

    if (changeRows.length === 0) {
      const result = { impacts: [], dataAvailable: false };
      setCache(cacheKey, result);
      return NextResponse.json(result);
    }

    // For each detected change, compute before/after impact
    const impacts = [];

    for (const change of changeRows) {
      const changeDate = String(change.change_date).slice(0, 10);
      const mailClass = String(change.mail_class);

      const impactRows = await runAuroraQuery(`
        WITH before_period AS (
          SELECT
            ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 4) as avg_rate,
            SUM(daily_sends) as total_sends,
            SUM(daily_cost) as total_revenue,
            SUM(COALESCE(daily_cost, 0) - COALESCE(daily_pcm_cost, 0)) as total_margin,
            SUM(daily_pcm_cost) as total_pcm_cost,
            COUNT(DISTINCT date) as days_count
          FROM dm_volume_summary
          WHERE mail_class = '${mailClass}'
            AND date >= '${changeDate}'::date - INTERVAL '30 days'
            AND date < '${changeDate}'::date
            AND daily_sends > 0
            AND domain NOT IN (${TEST_DOMAINS})
            ${domainWhere}
        ),
        after_period AS (
          SELECT
            ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 4) as avg_rate,
            SUM(daily_sends) as total_sends,
            SUM(daily_cost) as total_revenue,
            SUM(COALESCE(daily_cost, 0) - COALESCE(daily_pcm_cost, 0)) as total_margin,
            SUM(daily_pcm_cost) as total_pcm_cost,
            COUNT(DISTINCT date) as days_count
          FROM dm_volume_summary
          WHERE mail_class = '${mailClass}'
            AND date >= '${changeDate}'::date
            AND daily_sends > 0
            AND domain NOT IN (${TEST_DOMAINS})
            ${domainWhere}
        )
        SELECT
          b.avg_rate as before_rate,
          a.avg_rate as after_rate,
          COALESCE(a.avg_rate, 0) - COALESCE(b.avg_rate, 0) as rate_delta,
          COALESCE(b.total_sends, 0) as before_sends,
          COALESCE(a.total_sends, 0) as after_sends,
          COALESCE(b.total_revenue, 0) as before_revenue,
          COALESCE(a.total_revenue, 0) as after_revenue,
          COALESCE(b.total_margin, 0) as before_margin,
          COALESCE(a.total_margin, 0) as after_margin,
          CASE WHEN COALESCE(b.days_count, 0) > 0
            THEN ROUND((b.total_margin / b.days_count)::numeric, 2)
            ELSE 0 END as before_daily_margin,
          CASE WHEN COALESCE(a.days_count, 0) > 0
            THEN ROUND((a.total_margin / a.days_count)::numeric, 2)
            ELSE 0 END as after_daily_margin,
          COALESCE(a.days_count, 0) as days_since_change,
          COALESCE(b.days_count, 0) as before_days_count
        FROM before_period b, after_period a
      `);

      if (impactRows.length > 0) {
        const r = impactRows[0];
        const beforeDailyMargin = Number(r.before_daily_margin || 0);
        const afterDailyMargin = Number(r.after_daily_margin || 0);

        impacts.push({
          mailClass: mailClass as 'standard' | 'first_class',
          changeDate,
          beforeRate: Number(r.before_rate || 0),
          afterRate: Number(r.after_rate || 0),
          rateDelta: Number(r.rate_delta || 0),
          beforeDailyMargin,
          afterDailyMargin,
          marginDelta: afterDailyMargin - beforeDailyMargin,
          beforeRevenuePerPiece: Number(r.before_rate || 0),
          afterRevenuePerPiece: Number(r.after_rate || 0),
          projectedMonthlyMarginImpact: Math.round((afterDailyMargin - beforeDailyMargin) * 30 * 100) / 100,
          daysSinceChange: Number(r.days_since_change || 0),
          totalImpactSinceChange: Math.round(Number(r.after_margin || 0) * 100) / 100,
        });
      }
    }

    const result = { impacts, dataAvailable: impacts.length > 0 };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('mail_class') || msg.includes('daily_cost') || msg.includes('daily_margin')) {
      return NextResponse.json({ impacts: [], dataAvailable: false });
    }
    throw error;
  }
}

// ─── Profitability Period (date-filtered margin summary) ─────

// Period summary is intentionally anchored to "last 30 days from TODAY" —
// dynamically sliding forward, NOT a fixed range baked into the cache.
// The header's date-range filter is bypassed because `dm_volume_summary`
// only carries ~5 days of recent data today; honoring a 90-day filter
// would return the same 5-day slice and mislead the reader.
//
// The window is computed server-side as `CURRENT_DATE - INTERVAL '30 days'`
// so as the monolith backfills the table, the visible data grows organically.
// The response carries the actual MIN/MAX dates covered by the query so the
// widget can label the tag honestly — e.g. "Last 30 days · 5 days of synced
// data (Apr 10 – Apr 15)" — today, "Last 30 days" in full tomorrow.
const PERIOD_INTENT_DAYS = 30;

async function getProfitabilityPeriod(domain?: string, _days?: number, _startDate?: string, _endDate?: string) {
  void _days; void _startDate; void _endDate;
  const cacheKey = `pcm-validation:profitability-period:${domain || 'all'}:last-${PERIOD_INTENT_DAYS}-days`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ dataAvailable: false });
  }

  const domainWhereVs = domain ? `AND domain = '${domain}'` : '';

  try {
    // ALWAYS anchored to CURRENT_DATE - INTERVAL 'N days'. Sliding window —
    // when "today" moves, so does the window. No stale data.
    const dailyRows = await runAuroraQuery(`
      SELECT
        date::date as d,
        SUM(daily_sends) as pieces,
        SUM(daily_cost) as revenue,
        SUM(daily_pcm_cost) as aurora_pcm_cost
      FROM dm_volume_summary
      WHERE (mail_class = 'all' OR mail_class IS NULL)
        AND domain NOT IN (${TEST_DOMAINS})
        AND daily_sends > 0
        AND date >= CURRENT_DATE - INTERVAL '${PERIOD_INTENT_DAYS} days'
        AND date <= CURRENT_DATE
        ${domainWhereVs}
      GROUP BY date::date
      ORDER BY date::date
    `);

    let totalRevenue = 0;
    let totalSends = 0;
    let pcmCostInvoice = 0;
    let pcmPiecesInvoice = 0;
    let auroraStoredPcmCost = 0;
    let minDate: string | null = null;
    let maxDate: string | null = null;
    const daysWithData = new Set<string>();

    for (const r of dailyRows) {
      const date = String((r as Record<string, unknown>).d).slice(0, 10);
      const pieces = Number((r as Record<string, unknown>).pieces || 0);
      const revenue = Number((r as Record<string, unknown>).revenue || 0);
      const auroraPcm = Number((r as Record<string, unknown>).aurora_pcm_cost || 0);

      if (!minDate || date < minDate) minDate = date;
      if (!maxDate || date > maxDate) maxDate = date;
      daysWithData.add(date);

      totalRevenue += revenue;
      totalSends += pieces;
      auroraStoredPcmCost += auroraPcm;

      if (pieces <= 0) continue;
      const blended = revenue / pieces;
      const { fc, std } = splitDailyPieces(date, pieces, blended);
      pcmCostInvoice += fc * pcmRate(date, 'fc') + std * pcmRate(date, 'std');
      pcmPiecesInvoice += pieces;
    }

    pcmCostInvoice = Math.round(pcmCostInvoice * 100) / 100;
    totalRevenue = Math.round(totalRevenue * 100) / 100;
    auroraStoredPcmCost = Math.round(auroraStoredPcmCost * 100) / 100;

    const grossMargin = Math.round((totalRevenue - pcmCostInvoice) * 100) / 100;
    const marginPercent = totalRevenue > 0
      ? Math.round((grossMargin / totalRevenue) * 10000) / 100
      : 0;
    const auroraStoredMargin = Math.round((totalRevenue - auroraStoredPcmCost) * 100) / 100;
    const pcmVsAuroraCostDelta = Math.round((pcmCostInvoice - auroraStoredPcmCost) * 100) / 100;

    // Honest label: reflects both intent (last 30 days from today) AND the
    // actual synced coverage (how many of those 30 days have data yet).
    const intentLabel = `Last ${PERIOD_INTENT_DAYS} days`;
    const actualDaysCount = daysWithData.size;
    const coverageNote = actualDaysCount < PERIOD_INTENT_DAYS
      ? `${actualDaysCount} of ${PERIOD_INTENT_DAYS} days synced (${minDate ?? '—'} – ${maxDate ?? '—'})`
      : `${PERIOD_INTENT_DAYS} days fully synced`;
    const periodLabel = `${intentLabel} · ${coverageNote}`;

    const result = {
      totalRevenue,
      totalPcmCost: pcmCostInvoice,
      grossMargin,
      marginPercent,
      totalSends,
      pcmPiecesInvoice,
      revenuePerPiece: totalSends > 0 ? Math.round((totalRevenue / totalSends) * 10000) / 10000 : 0,
      pcmCostPerPiece: pcmPiecesInvoice > 0 ? Math.round((pcmCostInvoice / pcmPiecesInvoice) * 10000) / 10000 : 0,
      periodLabel,
      periodStart: minDate,
      periodEnd: maxDate,
      intendedDays: PERIOD_INTENT_DAYS,
      actualDaysCount,
      dataAvailable: totalRevenue > 0 || pcmCostInvoice > 0,
      sourceTable: 'dm_volume_summary' as const,
      reconciliation: {
        auroraStoredPcmCost,
        auroraStoredMargin,
        pcmVsAuroraCostDelta,
        note: 'PCM cost is Aurora daily sends × invoice-verified era rates (per-day-split). Aurora stored cost shown for reconciliation.',
      },
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('daily_pcm_cost') || msg.includes('daily_margin') || msg.includes('mail_class') || msg.includes('total_pcm_cost')) {
      return NextResponse.json({ dataAvailable: false });
    }
    throw error;
  }
}

/**
 * Classify a day's worth of untagged pieces into FC / Std by matching the
 * observed blended customer rate against known era customer rates.
 * Pre-Jan 2026: FC $1.39 / Std $1.08. From 2026-01-16 onwards: FC $0.87 / Std $0.63.
 * If the blended rate lies between the two era rates, solve the linear system
 * for the split that produces that blended rate; outside the range, assign
 * everything to the closer rate.
 */
function splitDailyPieces(dateISO: string, pieces: number, blendedRate: number): { fc: number; std: number } {
  // Known customer eras. When 8020REI changes pricing, add a new entry here
  // (or derive dynamically from dm_volume_summary — see dm-reports/route.ts
  // fetchCustomerEras for the live-detection pattern).
  const customerFc: number = dateISO <= '2026-01-15' ? 1.39 : 0.87;
  const customerStd: number = dateISO <= '2026-01-15' ? 1.08 : 0.63;
  if (pieces <= 0) return { fc: 0, std: 0 };
  if (Math.abs(customerFc - customerStd) < 0.005) return { fc: pieces, std: 0 };

  // Edge cases: blended outside the FC↔Std range → assume all one class
  if (blendedRate >= customerFc - 0.01) return { fc: pieces, std: 0 };
  if (blendedRate <= customerStd + 0.01) return { fc: 0, std: pieces };

  // Linear split: customerFc × fc + customerStd × (pieces − fc) = revenue
  const fcFraction = (blendedRate - customerStd) / (customerFc - customerStd);
  const fc = Math.max(0, Math.min(pieces, pieces * fcFraction));
  return { fc, std: pieces - fc };
}

// ─── Pricing History (daily per-piece rates over time) ───────

async function getPricingHistory(domain?: string) {
  const cacheKey = `pcm-validation:pricing-history:${domain || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!isAuroraConfigured()) {
    return NextResponse.json({ trend: [], dataAvailable: false });
  }

  const domainWhere = domain ? `AND domain = '${domain}'` : '';

  try {
    // Only read customer-side metrics from dm_volume_summary. daily_pcm_cost
    // is populated by the monolith from parameters.pcm_cost = $0.625/$0.875
    // which matches no invoice and is null for ~8% of lifetime / ~88% of recent
    // pieces (see session 4 report). Use the invoice-verified era rate from
    // pcm-pricing-eras.ts for the PCM line instead — same source Pricing
    // overview uses, so the two widgets tell the same story.
    const rows = await runAuroraQuery(`
      SELECT
        date,
        mail_class,
        ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 4) as our_rate,
        SUM(daily_sends) as sends
      FROM dm_volume_summary
      WHERE mail_class IN ('standard', 'first_class')
        AND daily_sends > 0
        AND domain NOT IN (${TEST_DOMAINS})
        ${domainWhere}
      GROUP BY date, mail_class
      ORDER BY date
    `);

    // Pivot into per-date rows with both mail classes
    const dateMap: Record<string, {
      date: string;
      ourStandardRate: number | null;
      pcmStandardRate: number | null;
      ourFirstClassRate: number | null;
      pcmFirstClassRate: number | null;
      standardSends: number;
      firstClassSends: number;
    }> = {};

    for (const row of rows) {
      const dateStr = String(row.date).slice(0, 10);
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          date: dateStr,
          ourStandardRate: null, pcmStandardRate: null,
          ourFirstClassRate: null, pcmFirstClassRate: null,
          standardSends: 0, firstClassSends: 0,
        };
      }
      const entry = dateMap[dateStr];
      // PCM era rate is applied per-date, per-mail-class from the shared
      // schedule. For a date inside Era 3 (2025-11 onward) this is $0.63/Std
      // and $0.87/FC regardless of what the monolith wrote.
      const pcmEraStd = pcmRate(dateStr, 'std');
      const pcmEraFc = pcmRate(dateStr, 'fc');
      if (row.mail_class === 'standard') {
        entry.ourStandardRate = Number(row.our_rate);
        entry.pcmStandardRate = pcmEraStd;
        entry.standardSends = Number(row.sends);
      } else if (row.mail_class === 'first_class') {
        entry.ourFirstClassRate = Number(row.our_rate);
        entry.pcmFirstClassRate = pcmEraFc;
        entry.firstClassSends = Number(row.sends);
      }
    }

    const trend = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    const dataAvailable = trend.length > 0;

    // Sync coverage footer data — exposes how fresh the customer-rate line is.
    // Mirrors the coverage field on getPriceDetection.
    const coverageRows = await runAuroraQuery(`
      SELECT
        mail_class,
        MAX(date)::text AS last_synced_date,
        COUNT(DISTINCT date) AS days_synced
      FROM dm_volume_summary
      WHERE mail_class IN ('standard', 'first_class')
        AND daily_sends > 0
        AND domain NOT IN (${TEST_DOMAINS})
        ${domainWhere}
      GROUP BY mail_class
    `);
    const stdCov = coverageRows.find(r => r.mail_class === 'standard');
    const fcCov = coverageRows.find(r => r.mail_class === 'first_class');
    const coverage = {
      standard: stdCov
        ? { lastSyncedDate: String(stdCov.last_synced_date).slice(0, 10), daysSynced: Number(stdCov.days_synced) }
        : null,
      firstClass: fcCov
        ? { lastSyncedDate: String(fcCov.last_synced_date).slice(0, 10), daysSynced: Number(fcCov.days_synced) }
        : null,
    };

    const result = { trend, coverage, dataAvailable };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('mail_class') || msg.includes('daily_pcm_cost')) {
      return NextResponse.json({ trend: [], coverage: { standard: null, firstClass: null }, dataAvailable: false });
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
