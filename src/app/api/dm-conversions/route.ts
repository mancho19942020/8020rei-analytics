/**
 * DM Campaign Business Results — Conversions API Route
 *
 * Queries Aurora's dm_property_conversions and dm_client_funnel tables.
 * Supports: funnel-overview, client-performance, geo-breakdown, property-timeline,
 *           data-quality, alerts, domain-list
 *
 * Mirrors the pattern from /api/rapid-response/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
import type {
  DmFunnelOverview,
  DmClientPerformanceRow,
  DmGeoRow,
  DmDataQuality,
  DmAlert,
} from '@/types/dm-conversions';

const SEED_DOMAINS = "'8020rei_demo', '8020rei_migracion_test'";
const EXCLUDE_SEED = `domain NOT IN (${SEED_DOMAINS})`;

function domainFilter(domain?: string | null): string {
  if (domain) {
    const safe = domain.replace(/[^a-zA-Z0-9_.]/g, '');
    return `${EXCLUDE_SEED} AND domain = '${safe}'`;
  }
  return EXCLUDE_SEED;
}

export async function GET(request: NextRequest) {
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
// Funnel Overview — aggregated conversion funnel across all domains
// ---------------------------------------------------------------------------

async function getFunnelOverview(domain?: string) {
  const cacheKey = `dm-conversions:funnel:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      COUNT(DISTINCT property_id) as total_mailed,
      COUNT(DISTINCT CASE WHEN became_lead_at IS NULL AND became_appointment_at IS NULL AND became_contract_at IS NULL AND became_deal_at IS NULL THEN property_id END) as prospects,
      COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL THEN property_id END) as leads,
      COUNT(DISTINCT CASE WHEN became_appointment_at IS NOT NULL THEN property_id END) as appointments,
      COUNT(DISTINCT CASE WHEN became_contract_at IS NOT NULL THEN property_id END) as contracts,
      COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL THEN property_id END) as deals
    FROM dm_property_conversions
    WHERE ${domainFilter(domain)}
  `);

  const r = rows[0] || {};
  const totalMailed = Number(r.total_mailed || 0);
  const prospects = Number(r.prospects || 0);
  const leads = Number(r.leads || 0);
  const appointments = Number(r.appointments || 0);
  const contracts = Number(r.contracts || 0);
  const deals = Number(r.deals || 0);

  const data: DmFunnelOverview = {
    totalMailed,
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
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Client Performance — per-domain summary
// ---------------------------------------------------------------------------

async function getClientPerformance(domain?: string) {
  const cacheKey = `dm-conversions:client-perf:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      domain,
      COUNT(DISTINCT property_id) as total_mailed,
      COALESCE(SUM(total_sends), 0) as total_sends,
      COALESCE(SUM(total_delivered), 0) as total_delivered,
      COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL THEN property_id END) as leads,
      COUNT(DISTINCT CASE WHEN became_appointment_at IS NOT NULL THEN property_id END) as appointments,
      COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL THEN property_id END) as deals,
      COALESCE(SUM(total_cost), 0) as total_cost,
      COALESCE(SUM(deal_revenue), 0) as total_revenue
    FROM dm_property_conversions
    WHERE ${domainFilter(domain)}
    GROUP BY domain
    ORDER BY total_revenue DESC, leads DESC
  `);

  const data: DmClientPerformanceRow[] = rows.map((r: Record<string, unknown>) => {
    const totalMailed = Number(r.total_mailed || 0);
    const leads = Number(r.leads || 0);
    const deals = Number(r.deals || 0);
    const totalCost = Number(r.total_cost || 0);
    const totalRevenue = Number(r.total_revenue || 0);
    return {
      domain: String(r.domain || ''),
      totalMailed,
      totalSends: Number(r.total_sends || 0),
      totalDelivered: Number(r.total_delivered || 0),
      leads,
      appointments: Number(r.appointments || 0),
      deals,
      totalCost: Number(totalCost.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      roas: totalCost > 0 ? Number((totalRevenue / totalCost).toFixed(2)) : 0,
      leadConversionRate: totalMailed > 0 ? Number(((leads / totalMailed) * 100).toFixed(2)) : 0,
      dealConversionRate: totalMailed > 0 ? Number(((deals / totalMailed) * 100).toFixed(2)) : 0,
    };
  });

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Geographic Breakdown
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
      COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL THEN property_id END) as leads,
      COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL THEN property_id END) as deals,
      COALESCE(SUM(deal_revenue), 0) as total_revenue
    FROM dm_property_conversions
    WHERE ${domainFilter(domain)}
    GROUP BY state, county
    HAVING COUNT(DISTINCT property_id) > 0
    ORDER BY leads DESC, total_mailed DESC
    LIMIT 100
  `);

  const data: DmGeoRow[] = rows.map((r: Record<string, unknown>) => {
    const totalMailed = Number(r.total_mailed || 0);
    const leads = Number(r.leads || 0);
    const deals = Number(r.deals || 0);
    return {
      state: String(r.state || 'Unknown'),
      county: String(r.county || 'Unknown'),
      totalMailed,
      leads,
      deals,
      leadConversionRate: totalMailed > 0 ? Number(((leads / totalMailed) * 100).toFixed(2)) : 0,
      dealConversionRate: totalMailed > 0 ? Number(((deals / totalMailed) * 100).toFixed(2)) : 0,
      totalRevenue: Number(Number(r.total_revenue || 0).toFixed(2)),
    };
  });

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
  }));

  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Data Quality
// ---------------------------------------------------------------------------

async function getDataQuality(domain?: string) {
  const cacheKey = `dm-conversions:quality:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      COUNT(DISTINCT property_id) as total_properties,
      COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' THEN property_id END) as attributed,
      COUNT(DISTINCT CASE WHEN attribution_status = 'unattributed' THEN property_id END) as unattributed,
      COUNT(DISTINCT CASE WHEN is_backfilled = true THEN property_id END) as backfilled,
      COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL AND (deal_revenue IS NULL OR deal_revenue = 0) THEN property_id END) as zero_revenue_deals
    FROM dm_property_conversions
    WHERE ${domainFilter(domain)}
  `);

  const r = rows[0] || {};
  const total = Number(r.total_properties || 0);
  const attributed = Number(r.attributed || 0);
  const unattributed = Number(r.unattributed || 0);
  const backfilled = Number(r.backfilled || 0);

  const data: DmDataQuality = {
    totalProperties: total,
    attributedCount: attributed,
    unattributedCount: unattributed,
    attributionRate: total > 0 ? Number(((attributed / total) * 100).toFixed(1)) : 0,
    backfilledCount: backfilled,
    backfilledRate: total > 0 ? Number(((backfilled / total) * 100).toFixed(1)) : 0,
    zeroRevenueDealCount: Number(r.zero_revenue_deals || 0),
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

  const rows = await runAuroraQuery(`
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
  `);

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
// ROAS Trend (time series from dm_client_funnel)
// ---------------------------------------------------------------------------

async function getRoasTrend(days: number, domain?: string) {
  const cacheKey = `dm-conversions:roas-trend:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      date::TEXT as date,
      COALESCE(SUM(total_cost), 0) as total_cost,
      COALESCE(SUM(total_revenue), 0) as total_revenue,
      CASE WHEN COALESCE(SUM(total_cost), 0) > 0
        THEN ROUND(COALESCE(SUM(total_revenue), 0) / SUM(total_cost), 2)
        ELSE 0
      END as roas
    FROM dm_client_funnel
    WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      AND ${domainFilter(domain)}
    GROUP BY date
    ORDER BY date ASC
  `);

  const data = rows.map((r: Record<string, unknown>) => ({
    date: String(r.date || ''),
    totalCost: Number(Number(r.total_cost || 0).toFixed(2)),
    totalRevenue: Number(Number(r.total_revenue || 0).toFixed(2)),
    roas: Number(r.roas || 0),
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Alerts (Layer 2 — Business Results)
// ---------------------------------------------------------------------------

async function getAlerts(domain?: string) {
  const cacheKey = `dm-conversions:alerts:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const [clientRows, qualityRows] = await Promise.all([
    runAuroraQuery(`
      SELECT
        domain,
        COUNT(DISTINCT property_id) as total_mailed,
        COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL THEN property_id END) as leads,
        COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL THEN property_id END) as deals,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(deal_revenue), 0) as total_revenue
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
      GROUP BY domain
    `),
    runAuroraQuery(`
      SELECT
        COUNT(DISTINCT property_id) as total_properties,
        COUNT(DISTINCT CASE WHEN attribution_status = 'unattributed' THEN property_id END) as unattributed,
        COUNT(DISTINCT CASE WHEN is_backfilled = true THEN property_id END) as backfilled
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
    `),
  ]);

  const alerts: DmAlert[] = [];
  const now = new Date().toISOString();

  // DM-B1: Clients with high sends but zero conversions
  for (const r of clientRows) {
    const totalMailed = Number(r.total_mailed || 0);
    const leads = Number(r.leads || 0);
    const clientDomain = String(r.domain || '');

    if (totalMailed >= 500 && leads === 0) {
      alerts.push({
        id: `dm-no-conversions-${clientDomain}`,
        name: 'No conversions after significant sends',
        severity: 'critical',
        category: 'dm-business-results',
        description: `${clientDomain} has mailed ${totalMailed} properties with zero leads. Campaign targeting or template may need review.`,
        entity: clientDomain,
        metrics: { current: leads, baseline: totalMailed },
        detected_at: now,
        action: `Review campaign targeting and template performance for ${clientDomain}. Check if properties are being correctly matched to the target market.`,
      });
    }
  }

  // DM-B2: Negative ROAS (spending more than earning)
  for (const r of clientRows) {
    const totalCost = Number(r.total_cost || 0);
    const totalRevenue = Number(r.total_revenue || 0);
    const clientDomain = String(r.domain || '');
    const deals = Number(r.deals || 0);

    if (totalCost > 1000 && deals > 0 && totalRevenue > 0 && totalRevenue < totalCost) {
      const roas = Number((totalRevenue / totalCost).toFixed(2));
      alerts.push({
        id: `dm-low-roas-${clientDomain}`,
        name: 'ROAS below 1.0',
        severity: 'warning',
        category: 'dm-business-results',
        description: `${clientDomain} has a ROAS of ${roas}x — spending $${totalCost.toFixed(0)} but only generating $${totalRevenue.toFixed(0)} in revenue.`,
        entity: clientDomain,
        metrics: { current: roas, baseline: 1.0 },
        detected_at: now,
        action: `Analyze which templates and geographies are underperforming for ${clientDomain}. Consider pausing low-performing campaigns.`,
      });
    }
  }

  // DM-B3: High unattributed conversions
  const q = qualityRows[0] || {};
  const totalProps = Number(q.total_properties || 0);
  const unattributed = Number(q.unattributed || 0);
  if (totalProps > 100 && unattributed > 0) {
    const unattributedRate = Number(((unattributed / totalProps) * 100).toFixed(1));
    if (unattributedRate > 20) {
      alerts.push({
        id: 'dm-high-unattributed',
        name: 'High unattributed conversions',
        severity: 'warning',
        category: 'dm-business-results',
        description: `${unattributedRate}% of conversions (${unattributed} properties) have no campaign attribution. These conversions can't be linked to a specific mailing.`,
        metrics: { current: unattributedRate, baseline: 20 },
        detected_at: now,
        action: 'Check if the attribution system is working correctly. Conversions before Sep 2025 will have NULL attribution by design.',
      });
    }
  }

  // DM-B4: High backfilled dates
  const backfilled = Number(q.backfilled || 0);
  if (totalProps > 100 && backfilled > 0) {
    const backfilledRate = Number(((backfilled / totalProps) * 100).toFixed(1));
    if (backfilledRate > 40) {
      alerts.push({
        id: 'dm-high-backfilled',
        name: 'High backfilled conversion dates',
        severity: 'info',
        category: 'dm-business-results',
        description: `${backfilledRate}% of conversion dates (${backfilled} properties) were system-generated, not organic. Metrics like "avg days to lead" may be less accurate.`,
        metrics: { current: backfilledRate, baseline: 40 },
        detected_at: now,
        action: 'This is informational. Backfilled dates occur when properties jump directly to Deal status. The data quality widget provides more detail.',
      });
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const data = {
    alerts,
    summary: {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      total: alerts.length,
    },
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
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
