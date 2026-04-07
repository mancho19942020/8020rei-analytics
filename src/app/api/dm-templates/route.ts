/**
 * DM Campaign Business Results — Templates API Route
 *
 * Queries Aurora's dm_template_performance table.
 * Supports: template-leaderboard, template-detail
 *
 * Mirrors the pattern from /api/rapid-response/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
import type { DmTemplatePerformance } from '@/types/dm-conversions';

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

  // Per-domain rows — no cross-domain aggregation (Rule 5)
  const rows = await runAuroraQuery(`
    SELECT
      domain,
      template_id,
      template_name,
      template_type,
      COALESCE(total_sent, 0) as total_sent,
      COALESCE(total_delivered, 0) as total_delivered,
      COALESCE(delivery_rate, 0) as delivery_rate,
      COALESCE(total_cost, 0) as total_cost,
      COALESCE(unique_properties, 0) as unique_properties,
      COALESCE(leads_generated, 0) as leads_generated,
      COALESCE(appointments_generated, 0) as appointments_generated,
      COALESCE(contracts_generated, 0) as contracts_generated,
      COALESCE(deals_generated, 0) as deals_generated,
      COALESCE(lead_conversion_rate, 0) as lead_conversion_rate,
      COALESCE(deal_conversion_rate, 0) as deal_conversion_rate,
      COALESCE(total_revenue, 0) as total_revenue,
      COALESCE(roas, 0) as roas,
      COALESCE(avg_days_to_lead, 0) as avg_days_to_lead,
      COALESCE(campaigns_using, 0) as campaigns_using
    FROM dm_template_performance
    WHERE ${domainFilter(domain)}
    ORDER BY leads_generated DESC, total_sent DESC
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
