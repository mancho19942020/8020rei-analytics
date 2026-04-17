/**
 * DM Campaign Business Results — Templates API Route
 *
 * Queries Aurora's dm_template_performance table.
 * Supports: template-leaderboard, template-detail
 *
 * Mirrors the pattern from /api/rapid-response/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
import type { DmTemplatePerformance } from '@/types/dm-conversions';

// Exclude seed/test domains — must match the same list used in pcm-validation and rapid-response
// showcaseproductsecomllc added 2026-04-17 — "Inaugural RR Test" (disabled, Sep 2025, 0 PCM orders).
const SEED_DOMAINS = "'8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com', 'showcaseproductsecomllc_8020rei_com'";
const EXCLUDE_SEED = `domain NOT IN (${SEED_DOMAINS})`;

function domainFilter(domain?: string | null): string {
  if (domain) {
    const safe = domain.replace(/[^a-zA-Z0-9_.]/g, '');
    return `${EXCLUDE_SEED} AND domain = '${safe}'`;
  }
  return EXCLUDE_SEED;
}

/** Restrict dm_property_conversions to domains verified in dm_client_funnel (corrected data) */
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
  const type = params.get('type') || 'template-leaderboard';
  const domain = params.get('domain') || undefined;
  const days = parseInt(params.get('days') || '0') || undefined;

  try {
    switch (type) {
      case 'template-leaderboard':
        return await getTemplateLeaderboard(domain, days);
      case 'template-detail':
        return await getTemplateDetail(params.get('templateId'), domain);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`[DM Templates] Error fetching ${type}:`, error);
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
// Template Leaderboard — all templates ranked by performance
// ---------------------------------------------------------------------------

/**
 * Compute ROAS confidence level based on data integrity rules.
 * - revenue_no_deal: revenue exists but 0 deals (data mismatch)
 * - none: no deals and no revenue
 * - low_sample: fewer than 3 deals (not statistically meaningful)
 * - confident: 3+ deals
 */
function getRoasConfidence(deals: number, revenue: number): 'confident' | 'low_sample' | 'revenue_no_deal' | 'none' {
  if (deals === 0 && revenue > 0) return 'revenue_no_deal';
  if (deals === 0) return 'none';
  if (deals < 3) return 'low_sample';
  return 'confident';
}

async function getTemplateLeaderboard(domain?: string, days?: number) {
  const cacheKey = `dm-templates:leaderboard:${domain || 'all'}:${days || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // THREE data sources, each trusted for different things:
  //   1. dm_client_funnel → CORRECTED send/delivered/cost totals per domain (source of truth for volume)
  //   2. dm_property_conversions → per-template conversions (leads, deals, revenue)
  //   3. dm_template_performance → operational metadata only (template_id, avg_days_to_lead)
  //
  // CRITICAL: dm_property_conversions.total_sends is STILL INFLATED for large clients
  // (Hall of Fame etc.) because the re-sync runs nightly and needs multiple cycles.
  // We use dm_client_funnel totals to cap per-template volumes so they never exceed
  // the corrected domain-level numbers.
  const [cfRows, tpRows, pcRows] = await Promise.all([
    // CORRECTED domain-level totals from dm_client_funnel
    runAuroraQuery(`
      SELECT
        f.domain,
        COALESCE(f.total_sends, 0) as corrected_sends,
        COALESCE(f.total_delivered, 0) as corrected_delivered,
        COALESCE(f.total_cost, 0) as corrected_cost,
        COALESCE(f.total_properties_mailed, 0) as corrected_mailed
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
    // Operational metadata only — conversion counts NOT used from this table
    runAuroraQuery(`
      SELECT
        domain,
        template_id,
        template_name,
        COALESCE(avg_days_to_lead, 0) as avg_days_to_lead,
        COALESCE(campaigns_using, 0) as campaigns_using
      FROM dm_template_performance
      WHERE ${domainFilter(domain)}
    `),
    // Per-template breakdown — conversions are reliable, volume numbers need capping
    runAuroraQuery(`
      SELECT
        domain,
        COALESCE(template_name, 'Unknown template') as template_name,
        COALESCE(template_type, 'unknown') as template_type,
        COUNT(DISTINCT property_id) as unique_properties,
        SUM(total_sends) as total_sent,
        SUM(total_delivered) as total_delivered,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as leads_generated,
        COUNT(DISTINCT CASE WHEN became_appointment_at IS NOT NULL AND became_appointment_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as appointments_generated,
        COUNT(DISTINCT CASE WHEN became_contract_at IS NOT NULL AND became_contract_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as contracts_generated,
        COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as deals_generated,
        COALESCE(SUM(CASE WHEN deal_revenue > 0 AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN deal_revenue ELSE 0 END), 0) as total_revenue
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
        ${days && days < 365 ? `AND first_sent_date >= CURRENT_DATE - INTERVAL '${days} days'` : ''}
      GROUP BY domain, template_name, template_type
    `),
  ]);

  // Build corrected domain-level totals lookup from dm_client_funnel
  const correctedTotals = new Map<string, { sends: number; delivered: number; cost: number; mailed: number }>();
  for (const r of cfRows) {
    correctedTotals.set(String(r.domain), {
      sends: Number(r.corrected_sends || 0),
      delivered: Number(r.corrected_delivered || 0),
      cost: Number(r.corrected_cost || 0),
      mailed: Number(r.corrected_mailed || 0),
    });
  }

  // Build uncapped per-template sums per domain (to compute proportional scaling)
  const domainTemplateTotals = new Map<string, number>();
  for (const r of pcRows) {
    const d = String(r.domain || '');
    domainTemplateTotals.set(d, (domainTemplateTotals.get(d) || 0) + Number(r.total_sent || 0));
  }

  // Build operational metadata lookup from dm_template_performance
  const tpMeta = new Map<string, { templateId: number; avgDaysToLead: number; campaignsUsing: number }>();
  for (const r of tpRows) {
    const key = `${String(r.domain || '')}::${String(r.template_name || '')}`;
    tpMeta.set(key, {
      templateId: Number(r.template_id || 0),
      avgDaysToLead: Number(Number(r.avg_days_to_lead || 0).toFixed(0)),
      campaignsUsing: Number(r.campaigns_using || 0),
    });
  }

  // Build all rows — cap volume numbers to corrected domain totals
  const allRows: DmTemplatePerformance[] = [];

  for (const r of pcRows) {
    const d = String(r.domain || '');
    const tName = String(r.template_name || 'Unknown template');
    const key = `${d}::${tName}`;
    const meta = tpMeta.get(key);
    const corrected = correctedTotals.get(d);
    const uncappedDomainTotal = domainTemplateTotals.get(d) || 1;

    const rawSent = Number(r.total_sent || 0);
    const rawDelivered = Number(r.total_delivered || 0);
    const rawCost = Number(r.total_cost || 0);

    // Proportionally scale per-template numbers to match corrected domain totals.
    // If dm_property_conversions says Hall of Fame templates sum to 22K sent,
    // but dm_client_funnel says the corrected total is 4,587 — scale each template
    // proportionally so they sum to the corrected total.
    let totalSent = rawSent;
    let delivered = rawDelivered;
    let totalCost = rawCost;

    if (corrected && uncappedDomainTotal > corrected.sends && corrected.sends > 0) {
      const scaleFactor = corrected.sends / uncappedDomainTotal;
      totalSent = Math.round(rawSent * scaleFactor);
      delivered = Math.round(rawDelivered * scaleFactor);
      totalCost = Number((rawCost * scaleFactor).toFixed(2));
    }

    const uniqueProps = Number(r.unique_properties || 0);
    const leads = Number(r.leads_generated || 0);
    const deals = Number(r.deals_generated || 0);
    const revenue = Number(r.total_revenue || 0);
    const confidence = getRoasConfidence(deals, revenue);
    const deliveryRate = totalSent > 0 ? Number(((delivered / totalSent) * 100).toFixed(2)) : 0;
    const leadRate = uniqueProps > 0 ? Number(((leads / uniqueProps) * 100).toFixed(2)) : 0;
    const dealRate = uniqueProps > 0 ? Number(((deals / uniqueProps) * 100).toFixed(2)) : 0;
    const roas = confidence === 'confident' || confidence === 'low_sample'
      ? Number((revenue / totalCost).toFixed(2)) || 0
      : 0;

    allRows.push({
      domain: d,
      templateId: meta?.templateId || 0,
      templateName: tName,
      templateType: String(r.template_type || 'unknown'),
      totalSent,
      totalDelivered: delivered,
      deliveryRate,
      totalCost: Number(totalCost.toFixed(2)),
      uniqueProperties: uniqueProps,
      leadsGenerated: leads,
      appointmentsGenerated: Number(r.appointments_generated || 0),
      contractsGenerated: Number(r.contracts_generated || 0),
      dealsGenerated: deals,
      leadConversionRate: leadRate,
      dealConversionRate: dealRate,
      totalRevenue: Number(revenue.toFixed(2)),
      roas,
      avgDaysToLead: meta?.avgDaysToLead || 0,
      campaignsUsing: meta?.campaignsUsing || 0,
      roasConfidence: confidence,
      deliveryWarning: delivered === 0 && leads > 0,
    });
  }

  // Sort by leads DESC, then sent DESC
  const data = allRows.sort((a, b) =>
    b.leadsGenerated - a.leadsGenerated || b.totalSent - a.totalSent
  );

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Template Detail — single template performance across domains
// ---------------------------------------------------------------------------

async function getTemplateDetail(templateId: string | null, domain?: string) {
  if (!templateId) {
    return NextResponse.json({ success: false, error: 'templateId is required' }, { status: 400 });
  }

  const safeId = templateId.replace(/[^0-9]/g, '');

  // Same 3-source approach as leaderboard: dm_client_funnel for corrected volume,
  // dm_property_conversions for per-template conversions, dm_template_performance for metadata.
  const [pcRows, metaRows, cfRows] = await Promise.all([
    runAuroraQuery(`
      SELECT
        domain,
        template_id,
        COALESCE(template_name, 'Unknown template') as template_name,
        COUNT(DISTINCT property_id) as unique_properties,
        SUM(total_sends) as total_sent,
        SUM(total_delivered) as total_delivered,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as leads,
        COUNT(DISTINCT CASE WHEN became_appointment_at IS NOT NULL AND became_appointment_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as appointments,
        COUNT(DISTINCT CASE WHEN became_contract_at IS NOT NULL AND became_contract_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as contracts,
        COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as deals,
        COALESCE(SUM(CASE WHEN deal_revenue > 0 AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN deal_revenue ELSE 0 END), 0) as total_revenue
      FROM dm_property_conversions
      WHERE template_id = ${safeId}
        AND ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
      GROUP BY domain, template_id, template_name
    `),
    runAuroraQuery(`
      SELECT domain, template_type, avg_days_to_lead, campaigns_using
      FROM dm_template_performance
      WHERE template_id = ${safeId}
        AND ${domainFilter(domain)}
    `),
    // Corrected domain-level totals
    runAuroraQuery(`
      SELECT f.domain, COALESCE(f.total_sends, 0) as corrected_sends,
        COALESCE(f.total_delivered, 0) as corrected_delivered
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

  // Build corrected totals + metadata lookups
  const correctedTotals = new Map<string, { sends: number; delivered: number }>();
  for (const r of cfRows) correctedTotals.set(String(r.domain), {
    sends: Number(r.corrected_sends || 0), delivered: Number(r.corrected_delivered || 0),
  });

  const metaMap = new Map<string, Record<string, unknown>>();
  for (const m of metaRows) metaMap.set(String(m.domain || ''), m);

  const data: DmTemplatePerformance[] = pcRows.map((r: Record<string, unknown>) => {
    const dom = String(r.domain || '');
    const meta = metaMap.get(dom) || {};
    const corrected = correctedTotals.get(dom);
    const deals = Number(r.deals || 0);
    const leads = Number(r.leads || 0);
    const revenue = Number(r.total_revenue || 0);

    const rawSent = Number(r.total_sent || 0);
    const rawDelivered = Number(r.total_delivered || 0);
    const rawCost = Number(r.total_cost || 0);

    // Cap to corrected domain totals — single template per domain in detail view,
    // so cap directly to the domain total
    let totalSent = rawSent;
    let delivered = rawDelivered;
    let cost = rawCost;
    if (corrected && rawSent > corrected.sends && corrected.sends > 0) {
      totalSent = corrected.sends;
      delivered = Math.min(rawDelivered, corrected.delivered);
      cost = Number((rawCost * (corrected.sends / rawSent)).toFixed(2));
    }

    const uniqueProps = Number(r.unique_properties || 0);
    const confidence = getRoasConfidence(deals, revenue);

    return {
      domain: dom,
      templateId: Number(r.template_id || 0),
      templateName: String(r.template_name || ''),
      templateType: String(meta.template_type || ''),
      totalSent,
      totalDelivered: delivered,
      deliveryRate: totalSent > 0 ? Number(((delivered / totalSent) * 100).toFixed(1)) : 0,
      totalCost: Number(cost.toFixed(2)),
      uniqueProperties: uniqueProps,
      leadsGenerated: leads,
      appointmentsGenerated: Number(r.appointments || 0),
      contractsGenerated: Number(r.contracts || 0),
      dealsGenerated: deals,
      leadConversionRate: uniqueProps > 0 ? Number(((leads / uniqueProps) * 100).toFixed(1)) : 0,
      dealConversionRate: uniqueProps > 0 ? Number(((deals / uniqueProps) * 100).toFixed(1)) : 0,
      totalRevenue: Number(revenue.toFixed(2)),
      roas: confidence === 'revenue_no_deal' ? 0 : (cost > 0 ? Number((revenue / cost).toFixed(1)) : 0),
      avgDaysToLead: Number(Number(meta.avg_days_to_lead || 0).toFixed(0)),
      campaignsUsing: Number(meta.campaigns_using || 0),
      roasConfidence: confidence,
      deliveryWarning: delivered === 0 && leads > 0,
    };
  });

  return NextResponse.json({ success: true, data, cached: false });
}
