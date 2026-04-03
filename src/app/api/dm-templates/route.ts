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

async function getTemplateLeaderboard(domain?: string) {
  const cacheKey = `dm-templates:leaderboard:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      template_id,
      template_name,
      template_type,
      COALESCE(SUM(total_sent), 0) as total_sent,
      COALESCE(SUM(total_delivered), 0) as total_delivered,
      CASE WHEN COALESCE(SUM(total_sent), 0) > 0
        THEN ROUND(COALESCE(SUM(total_delivered), 0)::numeric / SUM(total_sent) * 100, 1)
        ELSE 0
      END as delivery_rate,
      COALESCE(SUM(total_cost), 0) as total_cost,
      COALESCE(SUM(unique_properties), 0) as unique_properties,
      COALESCE(SUM(leads_generated), 0) as leads_generated,
      COALESCE(SUM(appointments_generated), 0) as appointments_generated,
      COALESCE(SUM(contracts_generated), 0) as contracts_generated,
      COALESCE(SUM(deals_generated), 0) as deals_generated,
      CASE WHEN COALESCE(SUM(unique_properties), 0) > 0
        THEN ROUND(COALESCE(SUM(leads_generated), 0)::numeric / SUM(unique_properties) * 100, 2)
        ELSE 0
      END as lead_conversion_rate,
      CASE WHEN COALESCE(SUM(unique_properties), 0) > 0
        THEN ROUND(COALESCE(SUM(deals_generated), 0)::numeric / SUM(unique_properties) * 100, 2)
        ELSE 0
      END as deal_conversion_rate,
      COALESCE(SUM(total_revenue), 0) as total_revenue,
      CASE WHEN COALESCE(SUM(total_cost), 0) > 0
        THEN ROUND(COALESCE(SUM(total_revenue), 0) / SUM(total_cost), 2)
        ELSE 0
      END as roas,
      COALESCE(AVG(avg_days_to_lead), 0) as avg_days_to_lead,
      COUNT(DISTINCT domain) as campaigns_using
    FROM dm_template_performance
    WHERE ${domainFilter(domain)}
    GROUP BY template_id, template_name, template_type
    ORDER BY leads_generated DESC, total_sent DESC
  `);

  const data: DmTemplatePerformance[] = rows.map((r: Record<string, unknown>) => ({
    domain: domain || 'all',
    templateId: Number(r.template_id || 0),
    templateName: String(r.template_name || ''),
    templateType: String(r.template_type || ''),
    totalSent: Number(r.total_sent || 0),
    totalDelivered: Number(r.total_delivered || 0),
    deliveryRate: Number(r.delivery_rate || 0),
    totalCost: Number(Number(r.total_cost || 0).toFixed(2)),
    uniqueProperties: Number(r.unique_properties || 0),
    leadsGenerated: Number(r.leads_generated || 0),
    appointmentsGenerated: Number(r.appointments_generated || 0),
    contractsGenerated: Number(r.contracts_generated || 0),
    dealsGenerated: Number(r.deals_generated || 0),
    leadConversionRate: Number(r.lead_conversion_rate || 0),
    dealConversionRate: Number(r.deal_conversion_rate || 0),
    totalRevenue: Number(Number(r.total_revenue || 0).toFixed(2)),
    roas: Number(r.roas || 0),
    avgDaysToLead: Number(Number(r.avg_days_to_lead || 0).toFixed(0)),
    campaignsUsing: Number(r.campaigns_using || 0),
  }));

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

  const data: DmTemplatePerformance[] = rows.map((r: Record<string, unknown>) => ({
    domain: String(r.domain || ''),
    templateId: Number(r.template_id || 0),
    templateName: String(r.template_name || ''),
    templateType: String(r.template_type || ''),
    totalSent: Number(r.total_sent || 0),
    totalDelivered: Number(r.total_delivered || 0),
    deliveryRate: Number(r.delivery_rate || 0),
    totalCost: Number(Number(r.total_cost || 0).toFixed(2)),
    uniqueProperties: Number(r.unique_properties || 0),
    leadsGenerated: Number(r.leads_generated || 0),
    appointmentsGenerated: Number(r.appointments_generated || 0),
    contractsGenerated: Number(r.contracts_generated || 0),
    dealsGenerated: Number(r.deals_generated || 0),
    leadConversionRate: Number(r.lead_conversion_rate || 0),
    dealConversionRate: Number(r.deal_conversion_rate || 0),
    totalRevenue: Number(Number(r.total_revenue || 0).toFixed(2)),
    roas: Number(r.roas || 0),
    avgDaysToLead: Number(Number(r.avg_days_to_lead || 0).toFixed(0)),
    campaignsUsing: Number(r.campaigns_using || 0),
  }));

  return NextResponse.json({ success: true, data, cached: false });
}
