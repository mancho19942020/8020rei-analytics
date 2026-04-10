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
import type {
  DmFunnelOverview,
  DmClientPerformanceRow,
  DmGeoRow,
  DmDataQuality,
  DmAlert,
  RoasConfidence,
  ConversionConfidence,
} from '@/types/dm-conversions';

const SEED_DOMAINS = "'8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com'";
const EXCLUDE_SEED = `domain NOT IN (${SEED_DOMAINS})`;

function domainFilter(domain?: string | null): string {
  if (domain) {
    const safe = domain.replace(/[^a-zA-Z0-9_.]/g, '');
    return `${EXCLUDE_SEED} AND domain = '${safe}'`;
  }
  return EXCLUDE_SEED;
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
  const days = parseInt(params.get('days') || '90');
  const domain = params.get('domain') || undefined;

  try {
    switch (type) {
      case 'funnel-overview':
        return await getFunnelOverview(domain);
      case 'client-performance':
        return await getClientPerformance(domain);
      case 'geo-breakdown':
        return await getGeoBreakdown(domain);
      case 'property-timeline':
        return await getPropertyTimeline(params.get('propertyId'), params.get('campaignId'), domain);
      case 'data-quality':
        return await getDataQuality(domain);
      case 'alerts':
        return await getAlerts(domain);
      case 'conversion-trend':
        return await getConversionTrend(days, domain);
      case 'roas-trend':
        return await getRoasTrend(days, domain);
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
    console.error(`[DM Conversions] Error fetching ${type}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
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

async function getMergedClientData(domain?: string): Promise<MergedDomainRow[]> {
  // dm_property_conversions is the SINGLE SOURCE OF TRUTH for all conversion counts
  // (leads, appointments, contracts, deals, revenue). This guarantees that the numbers
  // shown in tables always match what users see in the property drilldown modal.
  //
  // dm_client_funnel provides operational fields only: mailed, sends, delivered, cost.
  // rr_campaign_snapshots provides campaign status (active/inactive) and type.
  const [funnelRows, campaignStatusRows, propertyRows] = await Promise.all([
    runAuroraQuery(`
      SELECT
        domain,
        campaign_type,
        COALESCE(active_campaigns, 0) as active_campaigns,
        COALESCE(total_properties_mailed, 0) as total_mailed,
        COALESCE(total_sends, 0) as total_sends,
        COALESCE(total_delivered, 0) as total_delivered,
        COALESCE(total_cost, 0) as total_cost
      FROM dm_client_funnel
      WHERE date = (SELECT MAX(date) FROM dm_client_funnel WHERE ${domainFilter(domain)})
        AND ${domainFilter(domain)}
    `),
    runAuroraQuery(`
      SELECT domain, campaign_type,
        COUNT(*) FILTER (WHERE status = 'active') as active_campaigns
      FROM (
        SELECT DISTINCT ON (domain, campaign_id)
          domain, campaign_id, campaign_type, status
        FROM rr_campaign_snapshots
        WHERE ${domainFilter(domain)}
        ORDER BY domain, campaign_id, snapshot_at DESC
      ) latest
      GROUP BY domain, campaign_type
    `),
    // Source of truth for ALL conversion counts — what the drilldown modal shows
    runAuroraQuery(`
      SELECT
        domain,
        COUNT(DISTINCT property_id) as total_mailed,
        SUM(total_sends) as total_sends,
        SUM(total_delivered) as total_delivered,
        COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as leads,
        COUNT(DISTINCT CASE WHEN became_appointment_at IS NOT NULL AND became_appointment_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as appointments,
        COUNT(DISTINCT CASE WHEN became_contract_at IS NOT NULL AND became_contract_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as contracts,
        COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as deals,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(CASE WHEN deal_revenue > 0 AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN deal_revenue ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT CASE WHEN attribution_status = 'unattributed' AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as unattributed,
        COUNT(DISTINCT CASE WHEN (became_lead_at IS NOT NULL AND became_lead_at <= first_sent_date) OR (became_deal_at IS NOT NULL AND became_deal_at <= first_sent_date) THEN property_id END) as pre_send_excluded
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
      GROUP BY domain
    `),
  ]);

  // Check sync coverage: compare dm_property_conversions count vs dm_volume_summary cumulative
  // If a domain has < 90% coverage, flag it so the UI can show a warning
  const coverageRows = await runAuroraQuery(`
    SELECT
      vs.domain,
      vs.cumulative_sends as expected_sends,
      COALESCE(pc.actual_sends, 0) as actual_sends,
      CASE WHEN vs.cumulative_sends > 0
        THEN ROUND((COALESCE(pc.actual_sends, 0)::NUMERIC / vs.cumulative_sends) * 100, 0)
        ELSE 100 END as coverage_pct
    FROM dm_volume_summary vs
    LEFT JOIN (
      SELECT domain, SUM(total_sends) as actual_sends
      FROM dm_property_conversions
      GROUP BY domain
    ) pc ON vs.domain = pc.domain
    WHERE vs.cumulative_sends > 0
      AND CASE WHEN vs.cumulative_sends > 0
        THEN ROUND((COALESCE(pc.actual_sends, 0)::NUMERIC / vs.cumulative_sends) * 100, 0)
        ELSE 100 END < 90
  `);
  const syncWarnings = new Map<string, string>();
  for (const r of coverageRows) {
    const d = String(r.domain || '');
    const pct = Number(r.coverage_pct || 0);
    syncWarnings.set(d, `Data sync in progress — ${pct}% of property records loaded. Conversion numbers (leads, deals, revenue) may be lower than actual. This resolves automatically with each nightly sync.`);
  }

  // Build active campaigns lookup
  const activeCampaignsMap = new Map<string, { count: number; type: string }>();
  for (const r of campaignStatusRows) {
    const d = String(r.domain || '');
    const existing = activeCampaignsMap.get(d);
    const count = Number(r.active_campaigns || 0);
    if (!existing || count > existing.count) {
      activeCampaignsMap.set(d, { count, type: String(r.campaign_type || 'rr') });
    }
  }

  // Build operational data lookup from dm_client_funnel (mailed, sends, delivered, cost)
  const funnelMap = new Map<string, { campaignType: string; activeCampaigns: number; totalMailed: number; totalSends: number; totalDelivered: number; totalCost: number }>();
  for (const r of funnelRows) {
    const d = String(r.domain || '');
    funnelMap.set(d, {
      campaignType: String(r.campaign_type || 'rr'),
      activeCampaigns: Number(r.active_campaigns || 0),
      totalMailed: Number(r.total_mailed || 0),
      totalSends: Number(r.total_sends || 0),
      totalDelivered: Number(r.total_delivered || 0),
      totalCost: Number(r.total_cost || 0),
    });
  }

  // Build final merged data — dm_property_conversions drives all domains and conversion counts
  const domainMap = new Map<string, MergedDomainRow>();

  for (const r of propertyRows) {
    const d = String(r.domain || '');
    const liveStatus = activeCampaignsMap.get(d);
    const funnel = funnelMap.get(d);

    // Operational fields: prefer dm_client_funnel when available (has more accurate mailed/cost)
    // Conversion fields: ALWAYS from dm_property_conversions (single source of truth)
    const totalMailed = funnel ? funnel.totalMailed : Number(r.total_mailed || 0);
    const totalSends = funnel ? funnel.totalSends : Number(r.total_sends || 0);
    const totalDelivered = funnel ? funnel.totalDelivered : Number(r.total_delivered || 0);
    const totalCost = funnel ? funnel.totalCost : Number(r.total_cost || 0);
    const leads = Number(r.leads || 0);

    domainMap.set(d, {
      domain: d,
      campaignType: liveStatus?.type || funnel?.campaignType || 'rr',
      activeCampaigns: liveStatus?.count ?? funnel?.activeCampaigns ?? 0,
      totalMailed,
      totalSends,
      totalDelivered,
      prospects: totalMailed - leads,
      leads,
      appointments: Number(r.appointments || 0),
      contracts: Number(r.contracts || 0),
      deals: Number(r.deals || 0),
      totalCost,
      totalRevenue: Number(r.total_revenue || 0),
      unattributedConversions: Number(r.unattributed || 0),
      syncWarning: syncWarnings.get(d) || null,
    });
  }

  // Add domains that exist in dm_client_funnel but not in dm_property_conversions
  // (show operational data with zero conversions — we can't verify conversions without property records)
  for (const r of funnelRows) {
    const d = String(r.domain || '');
    if (domainMap.has(d)) continue;
    const liveStatus = activeCampaignsMap.get(d);
    domainMap.set(d, {
      domain: d,
      campaignType: liveStatus?.type || String(r.campaign_type || 'rr'),
      activeCampaigns: liveStatus?.count ?? Number(r.active_campaigns || 0),
      totalMailed: Number(r.total_mailed || 0),
      totalSends: Number(r.total_sends || 0),
      totalDelivered: Number(r.total_delivered || 0),
      prospects: Number(r.total_mailed || 0),
      leads: 0,
      appointments: 0,
      contracts: 0,
      deals: 0,
      totalCost: Number(r.total_cost || 0),
      totalRevenue: 0,
      unattributedConversions: 0,
    });
  }

  return Array.from(domainMap.values());
}

// ---------------------------------------------------------------------------
// Funnel Overview — aggregated from merged client data (same source as table)
// ---------------------------------------------------------------------------

async function getFunnelOverview(domain?: string) {
  const cacheKey = `dm-conversions:funnel:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Use the same merged data source as client performance table
  const mergedRows = await getMergedClientData(domain);

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

async function getClientPerformance(domain?: string) {
  const cacheKey = `dm-conversions:client-perf:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const mergedRows = await getMergedClientData(domain);

  const data: DmClientPerformanceRow[] = mergedRows.map((row) => {
    const confidence = getRoasConfidence(row.deals, row.totalRevenue);
    return {
      domain: row.domain,
      campaignType: row.campaignType,
      activeCampaigns: row.activeCampaigns,
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
      roasConfidence: confidence,
      unattributedConversions: row.unattributedConversions,
      syncWarning: row.syncWarning || null,
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

async function getGeoBreakdown(domain?: string) {
  const cacheKey = `dm-conversions:geo:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      COALESCE(state, 'Unknown') as state,
      COALESCE(county, 'Unknown') as county,
      COUNT(DISTINCT property_id) as total_mailed,
      COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as leads,
      COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as deals,
      COALESCE(SUM(CASE WHEN deal_revenue > 0 AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN deal_revenue ELSE 0 END), 0) as total_revenue
    FROM dm_property_conversions
    WHERE ${domainFilter(domain)}
    GROUP BY state, county
    HAVING COUNT(DISTINCT property_id) > 0
    ORDER BY leads DESC, total_mailed DESC
    LIMIT 200
  `);

  // Parse raw county rows
  const rawRows = rows.map((r: Record<string, unknown>) => ({
    state: String(r.state || 'Unknown'),
    county: String(r.county || 'Unknown'),
    totalMailed: Number(r.total_mailed || 0),
    leads: Number(r.leads || 0),
    deals: Number(r.deals || 0),
    totalRevenue: Number(Number(r.total_revenue || 0).toFixed(2)),
  }));

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

async function getDataQuality(domain?: string) {
  const cacheKey = `dm-conversions:quality:${domain || 'all'}`;
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

async function getConversionTrend(days: number, domain?: string) {
  const cacheKey = `dm-conversions:conv-trend:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Use dm_client_funnel (has time series) but supplement with dm_property_conversions
  // for a cumulative total row. This way the trend shows daily changes for 9 domains
  // (from CF) and the latest point includes all 19 domains (from PC).
  // When the monolith fix lands, CF will have all domains and this becomes seamless.
  const [cfRows, pcTotalRows] = await Promise.all([
    runAuroraQuery(`
      SELECT
        date::TEXT as date,
        COALESCE(SUM(leads), 0) as leads,
        COALESCE(SUM(appointments), 0) as appointments,
        COALESCE(SUM(contracts), 0) as contracts,
        COALESCE(SUM(deals), 0) as deals,
        COALESCE(SUM(total_revenue), 0) as total_revenue
      FROM dm_client_funnel
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
        AND ${domainFilter(domain)}
      GROUP BY date
      ORDER BY date ASC
    `),
    // Get the current total from dm_property_conversions (all domains)
    runAuroraQuery(`
      SELECT
        CURRENT_DATE::TEXT as date,
        COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as leads,
        COUNT(DISTINCT CASE WHEN became_appointment_at IS NOT NULL AND became_appointment_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as appointments,
        COUNT(DISTINCT CASE WHEN became_contract_at IS NOT NULL AND became_contract_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as contracts,
        COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as deals,
        COALESCE(SUM(CASE WHEN deal_revenue > 0 AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN deal_revenue ELSE 0 END), 0) as total_revenue
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
    `),
  ]);

  // Use CF rows for the time series, but ensure the latest date reflects PC totals
  const rows = cfRows.length > 0 ? cfRows : [];
  const pcTotal = pcTotalRows[0];

  // If PC total has more data than the latest CF row, update/add today's entry
  if (pcTotal) {
    const pcLeads = Number(pcTotal.leads || 0);
    const today = String(pcTotal.date || '');
    const lastCfRow = rows.length > 0 ? rows[rows.length - 1] : null;
    const lastCfDate = lastCfRow ? String(lastCfRow.date || '') : '';

    if (pcLeads > 0) {
      if (lastCfDate === today) {
        // Replace today's CF entry with the more complete PC data
        rows[rows.length - 1] = pcTotal;
      } else {
        // Add today as a new point
        rows.push(pcTotal);
      }
    }
  }

  const data = rows.map((r: Record<string, unknown>) => ({
    date: String(r.date || ''),
    leads: Number(r.leads || 0),
    appointments: Number(r.appointments || 0),
    contracts: Number(r.contracts || 0),
    deals: Number(r.deals || 0),
    totalRevenue: Number(Number(r.total_revenue || 0).toFixed(2)),
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// ROAS Trend (time series from dm_client_funnel) — Rule 1 applied
// ---------------------------------------------------------------------------

async function getRoasTrend(days: number, domain?: string) {
  const cacheKey = `dm-conversions:roas-trend:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Same approach as conversion trend: CF for time series, PC for accurate totals
  const [cfRows, pcTotalRows] = await Promise.all([
    runAuroraQuery(`
      SELECT
        date::TEXT as date,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(total_revenue), 0) as total_revenue,
        COALESCE(SUM(deals), 0) as deals
      FROM dm_client_funnel
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
        AND ${domainFilter(domain)}
      GROUP BY date
      ORDER BY date ASC
    `),
    runAuroraQuery(`
      SELECT
        CURRENT_DATE::TEXT as date,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(CASE WHEN deal_revenue > 0 AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN deal_revenue ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as deals
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
    `),
  ]);

  const roasRows = cfRows.length > 0 ? [...cfRows] : [];
  const pcRoas = pcTotalRows[0];

  if (pcRoas && Number(pcRoas.deals || 0) > 0) {
    const today = String(pcRoas.date || '');
    const lastDate = roasRows.length > 0 ? String(roasRows[roasRows.length - 1].date || '') : '';
    if (lastDate === today) {
      roasRows[roasRows.length - 1] = pcRoas;
    } else {
      roasRows.push(pcRoas);
    }
  }

  const data = roasRows.map((r: Record<string, unknown>) => {
    const totalCost = Number(r.total_cost || 0);
    const totalRevenue = Number(r.total_revenue || 0);
    const deals = Number(r.deals || 0);

    // Rule 1: Only show ROAS when there are deals (not just revenue)
    let roas: number | null = null;
    if (deals > 0 && totalCost > 0) {
      roas = Number((totalRevenue / totalCost).toFixed(2));
    }

    return {
      date: String(r.date || ''),
      totalCost: Number(totalCost.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      deals,
      roas,
    };
  });

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Business Results Alerts — uses shared getAlertsData() from get-alerts-data.ts
// ---------------------------------------------------------------------------

async function getAlerts(domain?: string) {
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
