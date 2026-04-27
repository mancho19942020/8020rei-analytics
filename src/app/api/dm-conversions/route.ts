/**
 * DM Campaign Business Results — Conversions API Route
 *
 * Queries Aurora's dm_client_funnel and dm_property_conversions tables.
 * Supports: funnel-overview, client-performance, geo-breakdown, property-timeline,
 *           data-quality, alerts, conversion-trend, roas-trend, domain-list
 *
 * Data integrity rules applied server-side:
 * - Rule 1: ROAS requires deals (revenue_no_deal confidence)
 * - Rule 3: Low-sample ROAS (< 3 deals = low_sample)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
import { getAlertsData } from './get-alerts-data';
import { groupByMSA } from '@/lib/msa-lookup';
// Test-domain exclusion — canonical source. Any change applies everywhere simultaneously.
import { TEST_DOMAINS_SQL as SEED_DOMAINS, EXCLUDE_TEST_DOMAINS_SQL as EXCLUDE_SEED } from '@/lib/domain-filter';
// Campaign lifecycle helper — shared with Operational Health → Campaign table
// so both widgets derive "stopped on" from the same source.
import {
  queryCampaignLifecycles,
  indexLifecyclesByDomain,
  deriveClientStoppedAt,
} from '@/lib/campaign-lifecycle';
import type {
  DmFunnelOverview,
  DmClientPerformanceRow,
  DmGeoRow,
  DmDataQuality,
  DmAlert,
  RoasConfidence,
  ConversionConfidence,
} from '@/types/dm-conversions';

function domainFilter(domain?: string | null): string {
  if (domain) {
    const safe = domain.replace(/[^a-zA-Z0-9_.]/g, '');
    return `${EXCLUDE_SEED} AND domain = '${safe}'`;
  }
  return EXCLUDE_SEED;
}

/**
 * DATA INTEGRITY: dm_property_conversions contains inflated rows from before
 * monolith PR #1882 (April 11, 2026). Properties that were on-hold, protected,
 * or errored (vendor_id IS NULL) were counted as "sent" — they never reached PCM.
 *
 * ALL dm_property_conversions queries MUST include this filter to restrict
 * results to domains with verified sends in dm_client_funnel.
 *
 * Rule: dm_client_funnel = source of truth for send counts (mailed, sends, delivered, cost).
 *       dm_property_conversions = source of truth for conversions ONLY (leads, deals, revenue).
 */
function verifiedDomainsFilter(domain?: string | null): string {
  const domainClause = domain
    ? `AND dcf.domain = '${domain.replace(/[^a-zA-Z0-9_.]/g, '')}'`
    : '';
  return `domain IN (
    SELECT DISTINCT dcf.domain FROM dm_client_funnel dcf
    INNER JOIN (SELECT domain, MAX(date) as md FROM dm_client_funnel GROUP BY domain) vdf_l
      ON dcf.domain = vdf_l.domain AND dcf.date = vdf_l.md
    WHERE dcf.domain IS NOT NULL ${domainClause}
  )`;
}

interface DateContext {
  days: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Build a SQL date filter clause for a given date column.
 * Handles both preset days (days=30) and custom ranges (startDate/endDate).
 * Returns empty string if no filter should be applied (all-time view).
 *
 * Note: a previous version short-circuited for ranges >= 365 days, silently
 * dropping the date filter on long custom ranges. That made the displayed
 * date-range label cosmetic. Filter now applies at any positive range; volume
 * vs. conversion source-table selection is still controlled by isDateFiltered
 * downstream so all-time volume keeps coming from dm_client_funnel.
 */
function buildSqlDateFilter(
  column: string,
  days: number,
  startDate?: string,
  endDate?: string,
): string {
  if (!days || days <= 0) return '';
  if (startDate && endDate) {
    const safeStart = startDate.replace(/[^0-9-]/g, '');
    const safeEnd = endDate.replace(/[^0-9-]/g, '');
    return `AND ${column} >= '${safeStart}' AND ${column} <= '${safeEnd}'`;
  }
  return `AND ${column} >= CURRENT_DATE - INTERVAL '${days} days'`;
}

/**
 * Compute conversion confidence for a single property record.
 * Handles the 4 cases from Lauren's meeting:
 * 1. pre_send: conversion before first send (false flag, excluded from counts)
 * 2. flagged: auto-dated late upload (isBackfilled, or lead+deal same day)
 * 3. short_window: deal closed < 30 days after first send (suspicious)
 * 4. clean: reasonable timeline
 */
function getConversionConfidence(
  firstSentDate: string | null,
  becameLeadAt: string | null,
  becameDealAt: string | null,
  daysToLead: number | null,
  daysToDeal: number | null,
  isBackfilled: boolean,
): { conversionConfidence: ConversionConfidence; shortConversionWarning: boolean } {
  const hasConversion = becameLeadAt || becameDealAt;
  if (!hasConversion) {
    return { conversionConfidence: 'clean', shortConversionWarning: false };
  }

  // Case 1: Conversion before first send — false flag
  if (firstSentDate) {
    const sent = new Date(firstSentDate);
    if (becameLeadAt && new Date(becameLeadAt) <= sent) {
      return { conversionConfidence: 'pre_send', shortConversionWarning: false };
    }
    if (becameDealAt && new Date(becameDealAt) <= sent) {
      return { conversionConfidence: 'pre_send', shortConversionWarning: false };
    }
  }

  // Case 2: Late feedback loop upload — isBackfilled or lead+deal on exact same day
  if (isBackfilled) {
    return { conversionConfidence: 'flagged', shortConversionWarning: false };
  }
  if (becameLeadAt && becameDealAt) {
    const leadDay = becameLeadAt.substring(0, 10);
    const dealDay = becameDealAt.substring(0, 10);
    if (leadDay === dealDay) {
      return { conversionConfidence: 'flagged', shortConversionWarning: false };
    }
  }

  // Case 3: Suspiciously short conversion window (deal < 30 days)
  const shortDeal = daysToDeal !== null && daysToDeal < 30 && daysToDeal >= 0;
  if (shortDeal) {
    return { conversionConfidence: 'short_window', shortConversionWarning: true };
  }

  // Case 4: Clean
  return { conversionConfidence: 'clean', shortConversionWarning: false };
}

function getRoasConfidence(deals: number, revenue: number): RoasConfidence {
  if (deals === 0 && revenue > 0) return 'revenue_no_deal';
  if (deals === 0) return 'none';
  if (deals < 3) return 'low_sample';
  return 'confident';
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  if (!isAuroraConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Aurora data source is not configured' },
      { status: 503 }
    );
  }

  const params = request.nextUrl.searchParams;
  const type = params.get('type') || 'funnel-overview';
  const domain = params.get('domain') || undefined;

  // Date filter: supports both preset days (days=30) and custom ranges (startDate/endDate).
  // When startDate/endDate are provided, compute equivalent days for the threshold check.
  const startDate = params.get('startDate') || undefined;
  const endDate = params.get('endDate') || undefined;
  let days: number;
  if (startDate && endDate) {
    const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
    days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } else {
    days = parseInt(params.get('days') || '0');
  }

  // Package date context for all handlers
  const dateCtx = { days, startDate, endDate };

  try {
    switch (type) {
      case 'funnel-overview':
        return await getFunnelOverview(dateCtx, domain);
      case 'client-performance':
        return await getClientPerformance(dateCtx, domain);
      case 'geo-breakdown':
        return await getGeoBreakdown(dateCtx, domain);
      case 'property-timeline':
        return await getPropertyTimeline(params.get('propertyId'), params.get('campaignId'), domain);
      case 'data-quality':
        return await getDataQuality(dateCtx, domain);
      case 'alerts':
        return await getAlerts(dateCtx, domain);
      case 'conversion-trend':
        return await getConversionTrend(dateCtx, domain);
      case 'roas-trend':
        return await getRoasTrend(dateCtx, domain);
      case 'property-drilldown':
        return await getPropertyDrilldown(
          params.get('domain') || undefined,
          params.get('status') || 'mailed',
          params.get('campaignId') || undefined,
          params.get('templateName') || undefined,
          params.get('county') || undefined,
          params.get('state') || undefined,
        );
      case 'domain-list':
        return await getDomainList();
      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    // Full trace → server log. Generic message → client (never expose SQL / stack to stakeholders).
    console.error(`[DM Conversions] Error fetching ${type}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Unable to load ${type}. Please retry.`,
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Shared: merge dm_client_funnel + dm_template_performance per domain
// Both funnel overview and client performance use this so totals always match.
// ---------------------------------------------------------------------------

interface MergedDomainRow {
  domain: string;
  campaignType: string;
  activeCampaigns: number;
  /** Per-product breakdown (active + total) — e.g. { rr: {active: 2, total: 3}, smartdrop: {active: 1, total: 1} } */
  campaignBreakdown: Record<string, { active: number; total: number }>;
  totalMailed: number;
  totalSends: number;
  totalDelivered: number;
  prospects: number;
  leads: number;
  appointments: number;
  contracts: number;
  deals: number;
  totalCost: number;
  totalRevenue: number;
  unattributedConversions: number;
  syncWarning?: string | null;
}

async function getMergedClientData(domain?: string, dateCtx?: DateContext): Promise<MergedDomainRow[]> {
  const days = dateCtx?.days;
  const startDate = dateCtx?.startDate;
  const endDate = dateCtx?.endDate;
  // HYBRID approach for volume + conversions:
  //
  // ALL-TIME (no date filter or range >= 365 days):
  //   Volume (mailed, sends, delivered, cost) → dm_client_funnel (complete, 23,632 sends, 100% PCM match)
  //   Conversions (leads, deals, revenue) → dm_property_conversions (best source for conversions)
  //
  // DATE-FILTERED (preset days < 365 or custom range < 365 days):
  //   ALL metrics → dm_property_conversions filtered by first_sent_date
  //   This makes everything respond to the date filter together
  //
  // Why: dm_property_conversions only has a subset of properties synced so far.
  // Using it for all-time volume undercounts. dm_client_funnel has correct all-time totals.
  const isDateFiltered = days && days > 0 && days < 365;
  const dateFilter = buildSqlDateFilter('first_sent_date', days || 0, startDate, endDate);

  const [funnelRows, campaignStatusRows, propertyRows] = await Promise.all([
    // dm_client_funnel latest-per-domain. PREVIOUSLY used a single global MAX(date),
    // which dropped any domain that hadn't synced on the exact max date — producing
    // a variable row count (e.g. 16 instead of 18). Latest-per-domain always returns
    // every DM-enrolled domain's most recent cumulative snapshot.
    //
    // NOTE: no outer WHERE needed — the INNER JOIN against the filtered subquery
    // is sufficient to exclude test domains. Adding `WHERE domain NOT IN (...)`
    // at the outer level creates an ambiguous-column reference because both `cf`
    // and the joined subquery expose `domain`.
    runAuroraQuery(`
      SELECT
        cf.domain,
        cf.campaign_type,
        COALESCE(cf.active_campaigns, 0) as active_campaigns,
        COALESCE(cf.total_properties_mailed, 0) as total_mailed,
        COALESCE(cf.total_sends, 0) as total_sends,
        COALESCE(cf.total_delivered, 0) as total_delivered,
        COALESCE(cf.total_cost, 0) as total_cost
      FROM dm_client_funnel cf
      INNER JOIN (
        SELECT domain, MAX(date) as md
        FROM dm_client_funnel
        WHERE domain IS NOT NULL AND ${EXCLUDE_SEED}
        ${domain ? `AND domain = '${domain.replace(/[^a-zA-Z0-9_.]/g, '')}'` : ''}
        GROUP BY domain
      ) l ON cf.domain = l.domain AND cf.date = l.md
    `),
    // Per-(domain, campaign_type) active counts + total campaign counts.
    // Used to render stacked "N RR · M SD" breakdown per client — no longer
    // collapses mixed-product clients into a single type.
    runAuroraQuery(`
      SELECT
        domain,
        campaign_type,
        COUNT(*) FILTER (WHERE status = 'active') as active_campaigns,
        COUNT(*) as total_campaigns
      FROM (
        SELECT DISTINCT ON (domain, campaign_id)
          domain, campaign_id, campaign_type, status
        FROM rr_campaign_snapshots
        WHERE ${domainFilter(domain)}
        ORDER BY domain, campaign_id, snapshot_at DESC
      ) latest
      GROUP BY domain, campaign_type
    `),
    // ALL metrics from dm_property_conversions — mailed, delivered cohort, sends, cost, AND conversions
    // All filtered by first_sent_date when date filter is active
    runAuroraQuery(`
      SELECT
        domain,
        COUNT(DISTINCT property_id) as mailed,
        COUNT(DISTINCT CASE WHEN total_delivered > 0 THEN property_id END) as delivered_properties,
        COALESCE(SUM(total_sends), 0) as sends,
        COALESCE(SUM(total_delivered), 0) as delivered,
        COALESCE(SUM(total_cost), 0) as cost,
        -- Strict attribution + platform-aligned: count any property whose
        -- log_status_properties row at this stage carries this campaign's
        -- rapid_response_id, regardless of date. Mirrors the platform's
        -- StatisticsRepository::getStatusCounts exactly (no date arithmetic).
        -- The earlier "became_X_at > first_sent_date" gate excluded real wins
        -- where the campaign accelerated an already-tagged lead through the
        -- funnel; verified empirically (e.g. HFH lost $51K in attributed
        -- deals to that gate). See funnel-fixes/02-deeper-review.
        COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' AND became_lead_at IS NOT NULL THEN property_id END) as leads,
        COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' AND became_appointment_at IS NOT NULL THEN property_id END) as appointments,
        COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' AND became_contract_at IS NOT NULL THEN property_id END) as contracts,
        COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' AND became_deal_at IS NOT NULL THEN property_id END) as deals,
        COALESCE(SUM(CASE WHEN attribution_status = 'attributed' AND deal_revenue > 0 THEN deal_revenue ELSE 0 END), 0) as total_revenue,
        -- Mirrors the attributed lead counter (no temporal gate) so that "X unattributed
        -- conversions excluded" in the UI represents the same shape as the included count.
        COUNT(DISTINCT CASE WHEN attribution_status = 'unattributed' AND became_lead_at IS NOT NULL THEN property_id END) as unattributed,
        COUNT(DISTINCT CASE WHEN (became_lead_at IS NOT NULL AND became_lead_at <= first_sent_date) OR (became_deal_at IS NOT NULL AND became_deal_at <= first_sent_date) THEN property_id END) as pre_send_excluded
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
        ${dateFilter}
      GROUP BY domain
    `),
  ]);

  // Check sync coverage: compare dm_client_funnel sends vs dm_property_conversions property count
  // Uses dm_client_funnel as the source of truth (corrected after monolith PR #1882)
  const coverageRows = await runAuroraQuery(`
    SELECT
      cf.domain,
      cf.total_properties_mailed as expected_properties,
      COALESCE(pc.actual_properties, 0) as actual_properties,
      CASE WHEN cf.total_properties_mailed > 0
        THEN ROUND((COALESCE(pc.actual_properties, 0)::NUMERIC / cf.total_properties_mailed) * 100, 0)
        ELSE 100 END as coverage_pct
    FROM dm_client_funnel cf
    INNER JOIN (
      SELECT domain, MAX(date) as max_date FROM dm_client_funnel GROUP BY domain
    ) cf_l ON cf.domain = cf_l.domain AND cf.date = cf_l.max_date
    LEFT JOIN (
      SELECT domain, COUNT(DISTINCT property_id) as actual_properties
      FROM dm_property_conversions
      WHERE ${EXCLUDE_SEED}
      GROUP BY domain
    ) pc ON cf.domain = pc.domain
    WHERE cf.total_properties_mailed > 0
      AND CASE WHEN cf.total_properties_mailed > 0
        THEN ROUND((COALESCE(pc.actual_properties, 0)::NUMERIC / cf.total_properties_mailed) * 100, 0)
        ELSE 100 END < 90
  `);
  const syncWarnings = new Map<string, string>();
  for (const r of coverageRows) {
    const d = String(r.domain || '');
    const pct = Number(r.coverage_pct || 0);
    syncWarnings.set(d, `Data sync in progress — ${pct}% of property records loaded. Conversion numbers (leads, deals, revenue) may be lower than actual. This resolves automatically with each nightly sync.`);
  }

  // Per-domain, per-product campaign breakdown (active + total per type) —
  // replaces the old "collapse to single type" logic that hid Smart Drop
  // campaigns when a client also ran RR.
  const campaignBreakdownMap = new Map<string, Record<string, { active: number; total: number }>>();
  const activeCampaignsMap = new Map<string, { count: number; type: string }>();
  for (const r of campaignStatusRows) {
    const d = String(r.domain || '');
    const type = String(r.campaign_type || 'rr');
    const active = Number(r.active_campaigns || 0);
    const total = Number(r.total_campaigns || 0);

    const bucket = campaignBreakdownMap.get(d) || {};
    bucket[type] = { active, total };
    campaignBreakdownMap.set(d, bucket);

    // Preserve the scalar activeCampaigns/type for back-compat with fields that
    // still expect a single value. Sum of active campaigns across all products.
    const existing = activeCampaignsMap.get(d);
    const summedActive = Object.values(bucket).reduce((s, v) => s + v.active, 0);
    if (!existing || active > existing.count) {
      activeCampaignsMap.set(d, { count: summedActive, type });
    } else {
      existing.count = summedActive;
    }
  }

  // Build corrected domain totals from dm_client_funnel (for proportional scaling)
  const correctedTotals = new Map<string, { campaignType: string; activeCampaigns: number; sends: number }>();
  for (const r of funnelRows) {
    correctedTotals.set(String(r.domain || ''), {
      campaignType: String(r.campaign_type || 'rr'),
      activeCampaigns: Number(r.active_campaigns || 0),
      sends: Number(r.total_sends || 0),
    });
  }

  // Build property data lookup — ALL metrics come from here (date-filtered)
  const propertyMap = new Map<string, Record<string, unknown>>();
  for (const r of propertyRows) {
    propertyMap.set(String(r.domain || ''), r);
  }

  // Compute uncapped per-domain send totals from dm_property_conversions for scaling
  const uncappedSends = new Map<string, number>();
  for (const r of propertyRows) {
    uncappedSends.set(String(r.domain || ''), Number(r.sends || 0));
  }

  // Build final merged data
  const domainMap = new Map<string, MergedDomainRow>();

  for (const r of funnelRows) {
    const d = String(r.domain || '');
    const liveStatus = activeCampaignsMap.get(d);
    const funnel = correctedTotals.get(d);
    if (!funnel) continue;

    const pc = propertyMap.get(d);
    const leads = Number(pc?.leads || 0);

    let mailed: number, sends: number, delivered: number, cost: number;

    // "totalMailed" downstream is now the DELIVERED-PROPERTY cohort: distinct
    // addresses where at least one piece was confirmed delivered. Matches the
    // user-facing "Total delivered" funnel/per-client semantics. dm_client_funnel
    // doesn't aggregate this, so dm_property_conversions is the source for both
    // date-filtered and all-time paths. Sends/delivered/cost still pull from
    // dm_client_funnel for all-time (PCM-matched volumes).
    const deliveredProperties = Number(pc?.delivered_properties || 0);

    if (isDateFiltered) {
      // DATE-FILTERED: all volume from dm_property_conversions (filtered by first_sent_date)
      mailed = deliveredProperties;
      sends = Number(pc?.sends || 0);
      delivered = Number(pc?.delivered || 0);
      cost = Number(pc?.cost || 0);
    } else {
      // ALL-TIME: dm_client_funnel for sends/delivered/cost (PCM-matched);
      // delivered-properties cohort still comes from dm_property_conversions
      mailed = deliveredProperties;
      sends = Number(r.total_sends || 0);
      delivered = Number(r.total_delivered || 0);
      cost = Number(r.total_cost || 0);
    }

    domainMap.set(d, {
      domain: d,
      campaignType: liveStatus?.type || funnel.campaignType || 'rr',
      activeCampaigns: liveStatus?.count ?? funnel.activeCampaigns ?? 0,
      campaignBreakdown: campaignBreakdownMap.get(d) || {},
      totalMailed: mailed,
      totalSends: sends,
      totalDelivered: delivered,
      totalCost: cost,
      prospects: mailed - leads,
      // Conversions ALWAYS from dm_property_conversions (with date filter when active)
      leads,
      appointments: Number(pc?.appointments || 0),
      contracts: Number(pc?.contracts || 0),
      deals: Number(pc?.deals || 0),
      totalRevenue: Number(pc?.total_revenue || 0),
      unattributedConversions: Number(pc?.unattributed || 0),
      syncWarning: syncWarnings.get(d) || null,
    });
  }

  return Array.from(domainMap.values());
}

// ---------------------------------------------------------------------------
// Funnel Overview — aggregated from merged client data (same source as table)
// ---------------------------------------------------------------------------

async function getFunnelOverview(dateCtx: DateContext, domain?: string) {
  const { days } = dateCtx;
  const cacheKey = `dm-conversions:funnel:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const mergedRows = await getMergedClientData(domain, dateCtx);

  // Sum across all domains
  let totalMailed = 0, totalDelivered = 0, prospects = 0, leads = 0;
  let appointments = 0, contracts = 0, deals = 0, totalCost = 0, totalRevenue = 0;

  for (const row of mergedRows) {
    totalMailed += row.totalMailed;
    totalDelivered += row.totalDelivered;
    prospects += row.prospects;
    leads += row.leads;
    appointments += row.appointments;
    contracts += row.contracts;
    deals += row.deals;
    totalCost += row.totalCost;
    totalRevenue += row.totalRevenue;
  }

  const confidence = getRoasConfidence(deals, totalRevenue);

  const data: DmFunnelOverview = {
    totalMailed,
    totalDelivered,
    prospects,
    leads,
    appointments,
    contracts,
    deals,
    prospectToLeadRate: totalMailed > 0 ? Number(((leads / totalMailed) * 100).toFixed(2)) : 0,
    leadToAppointmentRate: leads > 0 ? Number(((appointments / leads) * 100).toFixed(2)) : 0,
    appointmentToContractRate: appointments > 0 ? Number(((contracts / appointments) * 100).toFixed(2)) : 0,
    contractToDealRate: contracts > 0 ? Number(((deals / contracts) * 100).toFixed(2)) : 0,
    overallConversionRate: totalMailed > 0 ? Number(((deals / totalMailed) * 100).toFixed(2)) : 0,
    totalCost: Number(totalCost.toFixed(2)),
    totalRevenue: Number(totalRevenue.toFixed(2)),
    roas: confidence === 'revenue_no_deal' ? 0 : (totalCost > 0 ? Number((totalRevenue / totalCost).toFixed(2)) : 0),
    roasConfidence: confidence,
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Client Performance — uses shared merged data (same source as funnel)
// ---------------------------------------------------------------------------

async function getClientPerformance(dateCtx: DateContext, domain?: string) {
  const { days } = dateCtx;
  const cacheKey = `dm-conversions:client-perf:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Fetch merged funnel/conversion data and per-campaign lifecycle in parallel.
  // The lifecycle helper gives us a per-campaign stoppedAt; we aggregate per
  // domain — a client shows a stoppedAt ONLY when ALL their campaigns are
  // non-active (see deriveClientStoppedAt). Same helper feeds the Operational
  // Health → Campaign table widget, so the two tables never disagree.
  const [mergedRows, lifecycles] = await Promise.all([
    getMergedClientData(domain, dateCtx),
    queryCampaignLifecycles(domain),
  ]);

  const perDomainLifecycles = indexLifecyclesByDomain(lifecycles);

  const data: DmClientPerformanceRow[] = mergedRows.map((row) => {
    const confidence = getRoasConfidence(row.deals, row.totalRevenue);
    const clientLifecycles = perDomainLifecycles.get(row.domain) || [];
    const clientStop = deriveClientStoppedAt(clientLifecycles);
    return {
      domain: row.domain,
      campaignType: row.campaignType,
      activeCampaigns: row.activeCampaigns,
      campaignBreakdown: row.campaignBreakdown,
      totalMailed: row.totalMailed,
      totalSends: row.totalSends,
      totalDelivered: row.totalDelivered,
      leads: row.leads,
      appointments: row.appointments,
      contracts: row.contracts,
      deals: row.deals,
      totalCost: Number(row.totalCost.toFixed(2)),
      totalRevenue: Number(row.totalRevenue.toFixed(2)),
      roas: confidence === 'revenue_no_deal' ? 0 : (row.totalCost > 0 ? Number((row.totalRevenue / row.totalCost).toFixed(2)) : 0),
      leadConversionRate: row.totalMailed > 0 ? Number(((row.leads / row.totalMailed) * 100).toFixed(2)) : 0,
      dealConversionRate: row.totalMailed > 0 ? Number(((row.deals / row.totalMailed) * 100).toFixed(2)) : 0,
      costPerLead: row.leads > 0 ? Number((row.totalCost / row.leads).toFixed(2)) : null,
      roasConfidence: confidence,
      unattributedConversions: row.unattributedConversions,
      syncWarning: row.syncWarning || null,
      stoppedAt: clientStop.stoppedAt,
      stoppedAtSource: clientStop.stoppedAtSource,
    };
  });

  // Sort by leads DESC, then deals DESC, then mailed DESC (best performers first)
  data.sort((a, b) => b.leads - a.leads || b.deals - a.deals || b.totalMailed - a.totalMailed);

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Geographic Breakdown — county for dense markets, MSA for sparse markets
// ---------------------------------------------------------------------------

async function getGeoBreakdown(dateCtx: DateContext, domain?: string) {
  const { days, startDate, endDate } = dateCtx;
  const cacheKey = `dm-conversions:geo:${days}:${startDate || ''}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const dateFilter = buildSqlDateFilter('first_sent_date', days, startDate, endDate);

  // Fetch geo data AND corrected domain totals in parallel
  const [rows, cfRows] = await Promise.all([
    runAuroraQuery(`
      SELECT
        domain,
        COALESCE(state, 'Unknown') as state,
        COALESCE(county, 'Unknown') as county,
        COUNT(DISTINCT property_id) as total_mailed,
        -- Strict attribution + platform-aligned (no temporal gate). See getMergedClientData.
        COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' AND became_lead_at IS NOT NULL THEN property_id END) as leads,
        COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' AND became_deal_at IS NOT NULL THEN property_id END) as deals,
        COALESCE(SUM(CASE WHEN attribution_status = 'attributed' AND deal_revenue > 0 THEN deal_revenue ELSE 0 END), 0) as total_revenue
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
        ${dateFilter}
      GROUP BY domain, state, county
      HAVING COUNT(DISTINCT property_id) > 0
      ORDER BY leads DESC, total_mailed DESC
    `),
    // Corrected domain-level mailed totals from dm_client_funnel
    runAuroraQuery(`
      SELECT f.domain, COALESCE(f.total_properties_mailed, 0) as corrected_mailed
      FROM dm_client_funnel f
      INNER JOIN (
        SELECT dcf.domain, MAX(dcf.date) as md FROM dm_client_funnel dcf
        WHERE dcf.domain IS NOT NULL AND dcf.domain NOT IN (${SEED_DOMAINS})
        GROUP BY dcf.domain
      ) latest ON f.domain = latest.domain AND f.date = latest.md
      WHERE f.domain IS NOT NULL
        AND f.domain NOT IN (${SEED_DOMAINS})
        ${domain ? `AND f.domain = '${domain.replace(/[^a-zA-Z0-9_.]/g, '')}'` : ''}
    `),
  ]);

  // Build corrected mailed totals per domain
  const correctedMailed = new Map<string, number>();
  for (const r of cfRows) correctedMailed.set(String(r.domain), Number(r.corrected_mailed || 0));

  // Compute uncapped mailed totals per domain from dm_property_conversions
  const uncappedDomainMailed = new Map<string, number>();
  for (const r of rows) {
    const d = String(r.domain || '');
    uncappedDomainMailed.set(d, (uncappedDomainMailed.get(d) || 0) + Number(r.total_mailed || 0));
  }

  // Parse and scale raw rows — cap per-domain mailed to corrected totals
  const rawRows = rows.map((r: Record<string, unknown>) => {
    const d = String(r.domain || '');
    const rawMailed = Number(r.total_mailed || 0);
    const corrected = correctedMailed.get(d) || 0;
    const uncapped = uncappedDomainMailed.get(d) || 1;

    // Scale mailed proportionally if dm_property_conversions is inflated for this domain
    let totalMailed = rawMailed;
    if (corrected > 0 && uncapped > corrected) {
      totalMailed = Math.round(rawMailed * (corrected / uncapped));
    }

    return {
      state: String(r.state || 'Unknown'),
      county: String(r.county || 'Unknown'),
      totalMailed,
      leads: Number(r.leads || 0),
      deals: Number(r.deals || 0),
      totalRevenue: Number(Number(r.total_revenue || 0).toFixed(2)),
    };
  });

  // Group: dense counties stay, sparse counties roll up to MSA
  const grouped = groupByMSA(rawRows);

  // Map to DmGeoRow with computed rates
  const data: DmGeoRow[] = grouped.map(g => ({
    geoLabel: g.geoLabel,
    geoType: g.geoType,
    state: g.state,
    county: g.geoLabel, // backwards compat
    totalMailed: g.totalMailed,
    leads: g.leads,
    deals: g.deals,
    leadConversionRate: g.totalMailed > 0 ? Number(((g.leads / g.totalMailed) * 100).toFixed(2)) : 0,
    dealConversionRate: g.totalMailed > 0 ? Number(((g.deals / g.totalMailed) * 100).toFixed(2)) : 0,
    totalRevenue: g.totalRevenue,
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Property Timeline — all mailings + conversions for a single property
// ---------------------------------------------------------------------------

async function getPropertyTimeline(propertyId: string | null, campaignId: string | null, domain?: string) {
  if (!propertyId) {
    return NextResponse.json({ success: false, error: 'propertyId is required' }, { status: 400 });
  }

  const safePropertyId = propertyId.replace(/[^0-9]/g, '');
  const campaignFilter = campaignId ? `AND campaign_id = ${campaignId.replace(/[^0-9]/g, '')}` : '';

  const rows = await runAuroraQuery(`
    SELECT *
    FROM dm_property_conversions
    WHERE property_id = ${safePropertyId}
      ${campaignFilter}
      AND ${domainFilter(domain)}
    ORDER BY first_sent_date ASC
  `);

  const data = rows.map((r: Record<string, unknown>) => ({
    domain: String(r.domain || ''),
    propertyId: Number(r.property_id || 0),
    campaignId: Number(r.campaign_id || 0),
    campaignName: String(r.campaign_name || ''),
    campaignType: String(r.campaign_type || '') as 'rr' | 'smartdrop',
    templateId: Number(r.template_id || 0),
    templateName: String(r.template_name || ''),
    templateType: String(r.template_type || ''),
    address: String(r.address || ''),
    county: String(r.county || ''),
    state: String(r.state || ''),
    firstSentDate: r.first_sent_date ? String(r.first_sent_date) : null,
    lastSentDate: r.last_sent_date ? String(r.last_sent_date) : null,
    totalSends: Number(r.total_sends || 0),
    totalDelivered: Number(r.total_delivered || 0),
    totalCost: Number(r.total_cost || 0),
    hasFollowUp: Boolean(r.has_follow_up),
    currentStatus: String(r.current_status || 'Prospect'),
    becameLeadAt: r.became_lead_at ? String(r.became_lead_at) : null,
    becameAppointmentAt: r.became_appointment_at ? String(r.became_appointment_at) : null,
    becameContractAt: r.became_contract_at ? String(r.became_contract_at) : null,
    becameDealAt: r.became_deal_at ? String(r.became_deal_at) : null,
    isBackfilled: Boolean(r.is_backfilled),
    dealRevenue: r.deal_revenue !== null ? Number(r.deal_revenue) : null,
    dealSoldPrice: r.deal_sold_price !== null ? Number(r.deal_sold_price) : null,
    daysToLead: r.days_to_lead !== null ? Number(r.days_to_lead) : null,
    daysToDeal: r.days_to_deal !== null ? Number(r.days_to_deal) : null,
    leadsource: r.leadsource ? String(r.leadsource) : null,
    attributionStatus: String(r.attribution_status || 'prospect'),
    ...getConversionConfidence(
      r.first_sent_date ? String(r.first_sent_date) : null,
      r.became_lead_at ? String(r.became_lead_at) : null,
      r.became_deal_at ? String(r.became_deal_at) : null,
      r.days_to_lead !== null ? Number(r.days_to_lead) : null,
      r.days_to_deal !== null ? Number(r.days_to_deal) : null,
      Boolean(r.is_backfilled),
    ),
  }));

  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Data Quality — partial real data from available tables
// ---------------------------------------------------------------------------

async function getDataQuality(dateCtx: DateContext, domain?: string) {
  const { days, startDate, endDate } = dateCtx;
  const cacheKey = `dm-conversions:quality:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Source of truth: dm_property_conversions for all quality metrics
  // dm_template_performance only for template count + delivery issues (operational)
  // dm_client_funnel only for total_clients count
  const [templateRows, funnelRows, propertyRows] = await Promise.all([
    runAuroraQuery(`
      SELECT
        COUNT(DISTINCT template_id) as total_templates,
        COUNT(DISTINCT CASE WHEN total_delivered = 0 AND total_sent > 0 THEN template_id END) as delivery_issues
      FROM dm_template_performance
      WHERE ${domainFilter(domain)}
    `),
    runAuroraQuery(`
      SELECT COUNT(DISTINCT domain) as total_clients
      FROM dm_client_funnel
      WHERE date = (SELECT MAX(date) FROM dm_client_funnel WHERE ${domainFilter(domain)})
        AND ${domainFilter(domain)}
    `),
    runAuroraQuery(`
      SELECT
        COUNT(DISTINCT property_id) as total_properties,
        COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' THEN property_id END) as attributed,
        COUNT(DISTINCT CASE WHEN attribution_status = 'unattributed' THEN property_id END) as unattributed,
        COUNT(DISTINCT CASE WHEN is_backfilled = true THEN property_id END) as backfilled,
        COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL AND (deal_revenue IS NULL OR deal_revenue = 0) AND became_deal_at > first_sent_date THEN property_id END) as zero_revenue_deals,
        COUNT(DISTINCT CASE WHEN (became_lead_at IS NOT NULL AND became_lead_at <= first_sent_date) OR (became_deal_at IS NOT NULL AND became_deal_at <= first_sent_date) THEN property_id END) as pre_send_conversions,
        COUNT(DISTINCT CASE WHEN deal_revenue > 0 AND (became_deal_at IS NULL OR became_deal_at <= first_sent_date) THEN property_id END) as revenue_mismatch
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
        ${buildSqlDateFilter('first_sent_date', days, startDate, endDate)}
    `),
  ]);

  const t = templateRows[0] || {};
  const f = funnelRows[0] || {};
  const p = propertyRows[0] || {};

  const totalProperties = Number(p.total_properties || 0);
  const attributed = Number(p.attributed || 0);
  const unattributed = Number(p.unattributed || 0);
  const backfilled = Number(p.backfilled || 0);

  const data: DmDataQuality & {
    totalTemplates: number;
    totalClients: number;
    deliveryIssues: number;
    revenueMismatch: number;
    propertyDataAvailable: boolean;
  } = {
    // From dm_property_conversions (will be 0 until table populates)
    totalProperties,
    attributedCount: attributed,
    unattributedCount: unattributed,
    attributionRate: totalProperties > 0 ? Number(((attributed / totalProperties) * 100).toFixed(1)) : 0,
    backfilledCount: backfilled,
    backfilledRate: totalProperties > 0 ? Number(((backfilled / totalProperties) * 100).toFixed(1)) : 0,
    zeroRevenueDealCount: Number(p.zero_revenue_deals || 0),
    preSendConversions: Number(p.pre_send_conversions || 0),
    // From available tables
    totalTemplates: Number(t.total_templates || 0),
    totalClients: Number(f.total_clients || 0),
    deliveryIssues: Number(t.delivery_issues || 0),
    revenueMismatch: Number(p.revenue_mismatch || 0),
    propertyDataAvailable: totalProperties > 0,
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Conversion Trend (time series from dm_client_funnel)
// ---------------------------------------------------------------------------

async function getConversionTrend(dateCtx: DateContext, domain?: string) {
  const { days, startDate, endDate } = dateCtx;
  const cacheKey = `dm-conversions:conv-trend:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // COHORT-ALIGNED with the Conversion funnel + Client performance:
  //   - Filter: properties whose `first_sent_date` falls in the selected window.
  //   - Bucket by DATE(became_X_at) — the chart shows when conversions happened
  //     for that cohort, even if the conversion date falls outside the window.
  //
  // This is the same cohort the funnel sums: sum(activity bars) = funnel total.
  //
  // The previous implementation filtered by `became_X_at` in window (activity
  // semantic), which double-counted conversions for properties first mailed
  // long ago — producing Activity totals that didn't reconcile with the funnel.

  // Cohort filter: restricts to properties first mailed in the window.
  const cohortFilter = buildSqlDateFilter('first_sent_date', days, startDate, endDate);

  const [leadRows, apptRows, dealRows] = await Promise.all([
    runAuroraQuery(`
      SELECT DATE(became_lead_at)::TEXT as date,
        COUNT(DISTINCT property_id) as leads
      FROM dm_property_conversions
      WHERE attribution_status = 'attributed'
        AND became_lead_at IS NOT NULL
        AND ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
        ${cohortFilter}
      GROUP BY DATE(became_lead_at)
    `),
    runAuroraQuery(`
      SELECT DATE(became_appointment_at)::TEXT as date,
        COUNT(DISTINCT property_id) as appointments
      FROM dm_property_conversions
      WHERE attribution_status = 'attributed'
        AND became_appointment_at IS NOT NULL
        AND ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
        ${cohortFilter}
      GROUP BY DATE(became_appointment_at)
    `),
    runAuroraQuery(`
      SELECT DATE(became_deal_at)::TEXT as date,
        COUNT(DISTINCT property_id) as deals
      FROM dm_property_conversions
      WHERE attribution_status = 'attributed'
        AND became_deal_at IS NOT NULL
        AND ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
        ${cohortFilter}
      GROUP BY DATE(became_deal_at)
    `),
  ]);

  // Merge by date client-side.
  const dayMap = new Map<string, { date: string; leads: number; appointments: number; contracts: number; deals: number; totalRevenue: number }>();
  const ensureRow = (date: string) => {
    let row = dayMap.get(date);
    if (!row) {
      row = { date, leads: 0, appointments: 0, contracts: 0, deals: 0, totalRevenue: 0 };
      dayMap.set(date, row);
    }
    return row;
  };
  for (const r of leadRows) ensureRow(String(r.date)).leads = Number(r.leads || 0);
  for (const r of apptRows) ensureRow(String(r.date)).appointments = Number(r.appointments || 0);
  for (const r of dealRows) ensureRow(String(r.date)).deals = Number(r.deals || 0);

  const data = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// ROAS Trend (time series from dm_client_funnel) — Rule 1 applied
// ---------------------------------------------------------------------------

async function getRoasTrend(dateCtx: DateContext, domain?: string) {
  const { days, startDate, endDate } = dateCtx;
  const cacheKey = `dm-conversions:roas-trend:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // COHORT-ALIGNED with the Conversion funnel + Client performance + Activity:
  //   - Filter: properties with `first_sent_date` in the selected window.
  //   - Spend bucketed by DATE(first_sent_date) = when mailing kicked off.
  //   - Revenue bucketed by DATE(became_deal_at) = when deals closed.
  //   - Both series represent the SAME cohort, so sum(spend bars) ≈ funnel cost
  //     and sum(revenue bars) = funnel revenue.
  const cohortFilter = buildSqlDateFilter('first_sent_date', days, startDate, endDate);

  const [spendRows, dealRows] = await Promise.all([
    runAuroraQuery(`
      SELECT DATE(first_sent_date)::TEXT as date,
        COALESCE(SUM(total_cost), 0) as total_cost
      FROM dm_property_conversions
      WHERE first_sent_date IS NOT NULL
        AND ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
        ${cohortFilter}
      GROUP BY DATE(first_sent_date)
    `),
    runAuroraQuery(`
      SELECT DATE(became_deal_at)::TEXT as date,
        COALESCE(SUM(deal_revenue), 0) as total_revenue,
        COUNT(DISTINCT property_id) as deals
      FROM dm_property_conversions
      WHERE attribution_status = 'attributed'
        AND became_deal_at IS NOT NULL
        AND deal_revenue > 0
        AND ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
        ${cohortFilter}
      GROUP BY DATE(became_deal_at)
    `),
  ]);

  const dayMap = new Map<string, { date: string; totalCost: number; totalRevenue: number; deals: number; roas: number | null }>();
  const ensureRow = (date: string) => {
    let row = dayMap.get(date);
    if (!row) {
      row = { date, totalCost: 0, totalRevenue: 0, deals: 0, roas: null };
      dayMap.set(date, row);
    }
    return row;
  };
  for (const r of spendRows) ensureRow(String(r.date)).totalCost = Number(Number(r.total_cost || 0).toFixed(2));
  for (const r of dealRows) {
    const row = ensureRow(String(r.date));
    row.totalRevenue = Number(Number(r.total_revenue || 0).toFixed(2));
    row.deals = Number(r.deals || 0);
  }
  // ROAS per day: only when both deals and spend exist on the SAME day.
  for (const row of dayMap.values()) {
    if (row.deals > 0 && row.totalCost > 0) {
      row.roas = Number((row.totalRevenue / row.totalCost).toFixed(2));
    }
  }

  const data = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Business Results Alerts — uses shared getAlertsData() from get-alerts-data.ts
// ---------------------------------------------------------------------------

async function getAlerts(_dateCtx: DateContext, domain?: string) {
  // Alerts are computed against a fixed 30-day activity window — dateCtx is
  // ignored. Kept in the signature so the route handler shape stays uniform.
  const data = await getAlertsData(domain);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Property Drilldown — list of properties for a domain filtered by status
// Clickable numbers in client performance table open this.
// ---------------------------------------------------------------------------

async function getPropertyDrilldown(domain?: string, status?: string, campaignId?: string, templateName?: string, county?: string, state?: string) {
  if (!domain) {
    return NextResponse.json({ success: false, error: 'domain is required' }, { status: 400 });
  }

  // "_all" means show all domains (used by funnel drilldown when no domain filter is active)
  let filter: string;
  if (domain === '_all') {
    filter = EXCLUDE_SEED;
  } else {
    const safeDomain = domain.replace(/[^a-zA-Z0-9_.]/g, '');
    filter = `${EXCLUDE_SEED} AND domain = '${safeDomain}'`;
  }

  // Optional: filter by specific campaign (used by Operational Health drilldown)
  if (campaignId) {
    const safeCampaignId = campaignId.replace(/[^0-9]/g, '');
    filter += ` AND campaign_id = ${safeCampaignId}`;
  }

  // Optional: filter by template (used by Template Leaderboard drilldown)
  // 'Unknown template' is a display label for NULL template_name in the leaderboard
  if (templateName) {
    if (templateName === 'Unknown template') {
      filter += ` AND template_name IS NULL`;
    } else {
      const safeName = templateName.replace(/'/g, "''");
      filter += ` AND template_name = '${safeName}'`;
    }
  }

  // Optional: filter by geography (used by Geo Breakdown drilldown)
  // 'Unknown' is a display label for NULL county/state in the geo breakdown
  if (county) {
    if (county === 'Unknown') {
      filter += ` AND county IS NULL`;
    } else {
      const safeCounty = county.replace(/'/g, "''");
      filter += ` AND county = '${safeCounty}'`;
    }
  }
  if (state) {
    if (state === 'Unknown') {
      filter += ` AND state IS NULL`;
    } else {
      const safeState = state.replace(/'/g, "''");
      filter += ` AND state = '${safeState}'`;
    }
  }

  // Build status filter based on which column was clicked
  let statusCondition = '';
  let orderBy = `
    ORDER BY
      CASE WHEN became_deal_at IS NOT NULL THEN 0
           WHEN became_contract_at IS NOT NULL THEN 1
           WHEN became_appointment_at IS NOT NULL THEN 2
           WHEN became_lead_at IS NOT NULL THEN 3
           ELSE 4 END ASC,
      first_sent_date DESC`;

  switch (status) {
    case 'lead':
      statusCondition = 'AND became_lead_at IS NOT NULL';
      orderBy = 'ORDER BY became_lead_at DESC';
      break;
    case 'appointment':
      statusCondition = 'AND became_appointment_at IS NOT NULL';
      orderBy = 'ORDER BY became_appointment_at DESC';
      break;
    case 'contract':
      statusCondition = 'AND became_contract_at IS NOT NULL';
      orderBy = 'ORDER BY became_contract_at DESC';
      break;
    case 'deal':
      statusCondition = 'AND became_deal_at IS NOT NULL';
      orderBy = 'ORDER BY became_deal_at DESC';
      break;
    case 'sent':
      statusCondition = ''; // All properties in the campaign
      orderBy = 'ORDER BY first_sent_date DESC';
      break;
    case 'delivered':
      statusCondition = 'AND total_delivered > 0';
      orderBy = 'ORDER BY last_sent_date DESC';
      break;
    case 'mailed':
    default:
      statusCondition = '';
      break;
  }

  const rows = await runAuroraQuery(`
    SELECT
      property_id,
      address,
      county,
      state,
      campaign_name,
      campaign_type,
      template_name,
      template_type,
      current_status,
      first_sent_date,
      last_sent_date,
      total_sends,
      total_delivered,
      total_cost,
      became_lead_at,
      became_appointment_at,
      became_contract_at,
      became_deal_at,
      deal_revenue,
      days_to_lead,
      days_to_deal,
      attribution_status,
      is_backfilled
    FROM dm_property_conversions
    WHERE ${filter}
      AND ${verifiedDomainsFilter(domain)}
      ${statusCondition}
    ${orderBy}
    LIMIT 500
  `);

  const data = rows.map((r: Record<string, unknown>) => ({
    propertyId: Number(r.property_id || 0),
    address: String(r.address || '—'),
    county: String(r.county || ''),
    state: String(r.state || ''),
    campaignName: String(r.campaign_name || ''),
    campaignType: String(r.campaign_type || 'rr'),
    templateName: String(r.template_name || ''),
    templateType: String(r.template_type || ''),
    currentStatus: String(r.current_status || 'Prospect'),
    firstSentDate: r.first_sent_date ? String(r.first_sent_date) : null,
    lastSentDate: r.last_sent_date ? String(r.last_sent_date) : null,
    totalSends: Number(r.total_sends || 0),
    totalDelivered: Number(r.total_delivered || 0),
    totalCost: Number(r.total_cost || 0),
    becameLeadAt: r.became_lead_at ? String(r.became_lead_at) : null,
    becameAppointmentAt: r.became_appointment_at ? String(r.became_appointment_at) : null,
    becameContractAt: r.became_contract_at ? String(r.became_contract_at) : null,
    becameDealAt: r.became_deal_at ? String(r.became_deal_at) : null,
    dealRevenue: r.deal_revenue !== null ? Number(r.deal_revenue) : null,
    daysToLead: r.days_to_lead !== null ? Number(r.days_to_lead) : null,
    daysToDeal: r.days_to_deal !== null ? Number(r.days_to_deal) : null,
    attributionStatus: String(r.attribution_status || 'prospect'),
    isBackfilled: Boolean(r.is_backfilled),
    ...getConversionConfidence(
      r.first_sent_date ? String(r.first_sent_date) : null,
      r.became_lead_at ? String(r.became_lead_at) : null,
      r.became_deal_at ? String(r.became_deal_at) : null,
      r.days_to_lead !== null ? Number(r.days_to_lead) : null,
      r.days_to_deal !== null ? Number(r.days_to_deal) : null,
      Boolean(r.is_backfilled),
    ),
  }));

  return NextResponse.json({ success: true, data, total: data.length, cached: false });
}

// ---------------------------------------------------------------------------
// Domain List (from all 3 Layer 2 tables)
// ---------------------------------------------------------------------------

async function getDomainList() {
  const cacheKey = 'dm-conversions:domain-list';
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT DISTINCT domain FROM (
      SELECT DISTINCT domain FROM dm_property_conversions WHERE ${EXCLUDE_SEED}
      UNION
      SELECT DISTINCT domain FROM dm_template_performance WHERE ${EXCLUDE_SEED}
      UNION
      SELECT DISTINCT domain FROM dm_client_funnel WHERE ${EXCLUDE_SEED}
    ) all_domains
    ORDER BY domain ASC
  `);

  const data = rows.map((r: Record<string, unknown>) => String(r.domain || ''));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}
