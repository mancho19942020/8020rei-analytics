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

const SEED_DOMAINS = "'8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com'";
const EXCLUDE_SEED = `domain NOT IN (${SEED_DOMAINS})`;

function domainFilter(domain?: string | null): string {
  if (domain) {
    const safe = domain.replace(/[^a-zA-Z0-9_.]/g, '');
    return `${EXCLUDE_SEED} AND domain = '${safe}'`;
  }
  return EXCLUDE_SEED;
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

  try {
    switch (type) {
      case 'template-leaderboard':
        return await getTemplateLeaderboard(domain);
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

async function getTemplateLeaderboard(domain?: string) {
  const cacheKey = `dm-templates:leaderboard:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // dm_property_conversions is the SINGLE SOURCE OF TRUTH for conversion counts.
  // dm_template_performance provides operational metadata (template_id, avg_days_to_lead, campaigns_using).
  const [tpRows, pcRows] = await Promise.all([
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
    // Source of truth for ALL conversion counts and revenue
    runAuroraQuery(`
      SELECT
        domain,
        COALESCE(template_name, 'Unknown template') as template_name,
        COALESCE(template_type, 'unknown') as template_type,
        COUNT(DISTINCT property_id) as unique_properties,
        SUM(total_sends) as total_sent,
        SUM(total_delivered) as total_delivered,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL THEN property_id END) as leads_generated,
        COUNT(DISTINCT CASE WHEN became_appointment_at IS NOT NULL THEN property_id END) as appointments_generated,
        COUNT(DISTINCT CASE WHEN became_contract_at IS NOT NULL THEN property_id END) as contracts_generated,
        COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL THEN property_id END) as deals_generated,
        COALESCE(SUM(CASE WHEN deal_revenue > 0 THEN deal_revenue ELSE 0 END), 0) as total_revenue
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
      GROUP BY domain, template_name, template_type
    `),
  ]);

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

  // Build all rows from dm_property_conversions (source of truth)
  const allRows: DmTemplatePerformance[] = [];

  for (const r of pcRows) {
    const d = String(r.domain || '');
    const tName = String(r.template_name || 'Unknown template');
    const key = `${d}::${tName}`;
    const meta = tpMeta.get(key);

    const uniqueProps = Number(r.unique_properties || 0);
    const totalSent = Number(r.total_sent || 0);
    const delivered = Number(r.total_delivered || 0);
    const leads = Number(r.leads_generated || 0);
    const deals = Number(r.deals_generated || 0);
    const totalCost = Number(r.total_cost || 0);
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

  const rows = await runAuroraQuery(`
    SELECT *
    FROM dm_template_performance
    WHERE template_id = ${safeId}
      AND ${domainFilter(domain)}
    ORDER BY leads_generated DESC
  `);

  const data: DmTemplatePerformance[] = rows.map((r: Record<string, unknown>) => {
    const deals = Number(r.deals_generated || 0);
    const revenue = Number(r.total_revenue || 0);
    const delivered = Number(r.total_delivered || 0);
    const leads = Number(r.leads_generated || 0);
    const confidence = getRoasConfidence(deals, revenue);

    return {
      domain: String(r.domain || ''),
      templateId: Number(r.template_id || 0),
      templateName: String(r.template_name || ''),
      templateType: String(r.template_type || ''),
      totalSent: Number(r.total_sent || 0),
      totalDelivered: delivered,
      deliveryRate: Number(r.delivery_rate || 0),
      totalCost: Number(Number(r.total_cost || 0).toFixed(2)),
      uniqueProperties: Number(r.unique_properties || 0),
      leadsGenerated: leads,
      appointmentsGenerated: Number(r.appointments_generated || 0),
      contractsGenerated: Number(r.contracts_generated || 0),
      dealsGenerated: deals,
      leadConversionRate: Number(r.lead_conversion_rate || 0),
      dealConversionRate: Number(r.deal_conversion_rate || 0),
      totalRevenue: Number(revenue.toFixed(2)),
      roas: confidence === 'revenue_no_deal' ? 0 : Number(r.roas || 0),
      avgDaysToLead: Number(Number(r.avg_days_to_lead || 0).toFixed(0)),
      campaignsUsing: Number(r.campaigns_using || 0),
      roasConfidence: confidence,
      deliveryWarning: delivered === 0 && leads > 0,
    };
  });

  return NextResponse.json({ success: true, data, cached: false });
}
