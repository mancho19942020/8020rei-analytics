/**
 * Shared alerts data fetcher — used by both the main dm-conversions route
 * and the business-alerts Slack digest route.
 *
 * Extracted to avoid internal HTTP self-fetch which fails on Cloud Run.
 */

import { runAuroraQuery } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
import type { DmAlert } from '@/types/dm-conversions';

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

interface MergedDomainRow {
  domain: string;
  totalMailed: number;
  totalSends: number;
  totalDelivered: number;
  leads: number;
  appointments: number;
  contracts: number;
  deals: number;
  totalCost: number;
  totalRevenue: number;
}

interface AlertsResult {
  alerts: DmAlert[];
  summary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
}

export async function getAlertsData(domain?: string, days?: number): Promise<AlertsResult> {
  const cacheKey = `dm-conversions:alerts:${days || 'all'}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached as AlertsResult;

  const [clientRows, templateRows] = await Promise.all([
    getMergedClientDataForAlerts(domain),
    // Use dm_property_conversions (source of truth) with date validation for conversion counts.
    // dm_template_performance is pre-aggregated and may include pre-send false positives.
    runAuroraQuery(`
      SELECT
        domain,
        COALESCE(template_name, 'Unknown template') as template_name,
        SUM(total_sends) as total_sent,
        SUM(total_delivered) as total_delivered,
        CASE WHEN SUM(total_sends) > 0
          THEN ROUND((SUM(total_delivered)::NUMERIC / SUM(total_sends)) * 100, 1)
          ELSE 0 END as delivery_rate,
        COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as deals,
        COALESCE(SUM(CASE WHEN deal_revenue > 0 AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN deal_revenue ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as leads
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
        ${days && days < 365 ? `AND first_sent_date >= CURRENT_DATE - INTERVAL '${days} days'` : ''}
      GROUP BY domain, template_name
    `),
  ]);

  const alerts: DmAlert[] = [];
  const now = new Date().toISOString();

  // BR-1: Underperforming campaign
  // Industry response rate for DM in real estate is ~0.3-0.4%.
  // At 0.3%, 2,000 mailings → ~6 expected leads (statistically meaningful).
  // 5,000 mailings with 0 leads is genuinely critical.
  for (const row of clientRows) {
    const { totalMailed, leads, totalCost, totalRevenue, domain: clientDomain } = row;
    if (totalMailed >= 5000 && leads === 0) {
      const costNote = totalCost > 500
        ? ` The campaign has spent $${totalCost.toLocaleString()} with $0 revenue.`
        : '';
      alerts.push({
        id: `br-underperforming-${clientDomain}`,
        name: 'Underperforming campaign',
        severity: 'critical',
        category: 'dm-business-results',
        description: `${clientDomain} has mailed ${totalMailed.toLocaleString()} properties with zero leads.${costNote} At industry-average response rates (~0.3%), this volume should have produced ~${Math.round(totalMailed * 0.003)} leads.`,
        entity: clientDomain,
        metrics: { current: leads, baseline: totalMailed },
        detected_at: now,
        action: `Review the template and targeting criteria with the client. Consider using a different template or changing the design of the current one, expanding the geographic area, or adjusting the property type filter.`,
      });
    } else if (totalMailed >= 2000 && leads === 0) {
      const costNote = totalCost > 500
        ? ` The campaign has spent $${totalCost.toLocaleString()} with $0 revenue.`
        : '';
      alerts.push({
        id: `br-underperforming-${clientDomain}`,
        name: 'Underperforming campaign',
        severity: 'warning',
        category: 'dm-business-results',
        description: `${clientDomain} has mailed ${totalMailed.toLocaleString()} properties with zero leads.${costNote} At ~0.3% response rate, ~${Math.round(totalMailed * 0.003)} leads were expected. Volume may still be building.`,
        entity: clientDomain,
        metrics: { current: leads, baseline: totalMailed },
        detected_at: now,
        action: `Monitor for another cycle. If still zero leads after 5,000+ mailings, review template design and targeting criteria with the client.`,
      });
    }
  }

  // BR-2: Template underperforming vs peers
  const templatesByDomain = new Map<string, Array<{ name: string; leads: number; sent: number }>>();
  for (const r of templateRows) {
    const d = String(r.domain || '');
    const entry = { name: String(r.template_name || ''), leads: Number(r.leads || 0), sent: Number(r.total_sent || 0) };
    if (!templatesByDomain.has(d)) templatesByDomain.set(d, []);
    templatesByDomain.get(d)!.push(entry);
  }
  for (const [d, templates] of templatesByDomain) {
    const hasPerforming = templates.some(t => t.leads > 0);
    if (!hasPerforming) continue;
    for (const t of templates) {
      if (t.leads === 0 && t.sent >= 500) {
        const bestTemplate = templates.reduce((best, cur) => cur.leads > best.leads ? cur : best, templates[0]);
        alerts.push({
          id: `br-template-underperform-${d}-${t.name}`,
          name: 'Template underperforming vs peers',
          severity: 'warning',
          category: 'dm-business-results',
          description: `"${t.name}" (${d}) has ${t.sent.toLocaleString()} sends but 0 leads, while "${bestTemplate.name}" has ${bestTemplate.leads} leads. This template may need to be replaced.`,
          entity: d,
          metrics: { current: 0, baseline: bestTemplate.leads },
          detected_at: now,
          action: `Suggest the client switch from "${t.name}" to "${bestTemplate.name}" or review the underperforming template's design and messaging.`,
        });
      }
    }
  }

  // BR-3: Low delivery rate
  for (const r of templateRows) {
    const totalSent = Number(r.total_sent || 0);
    const deliveryRate = Number(r.delivery_rate || 0);
    const delivered = Number(r.total_delivered || 0);
    const templateName = String(r.template_name || '');
    const templateDomain = String(r.domain || '');
    if (totalSent > 50 && deliveryRate > 0 && deliveryRate < 50) {
      alerts.push({
        id: `br-low-delivery-${templateDomain}-${templateName}`,
        name: 'Low delivery rate',
        severity: 'warning',
        category: 'dm-business-results',
        description: `"${templateName}" (${templateDomain}) has a ${deliveryRate}% delivery rate (${delivered.toLocaleString()} of ${totalSent.toLocaleString()} sent). Mail list quality may be an issue.`,
        entity: templateDomain,
        metrics: { current: deliveryRate, baseline: 50 },
        detected_at: now,
        action: `Review property data quality for ${templateDomain}. Bad addresses or outdated property records may be reducing delivery rates. Consider enabling address verification.`,
      });
    }
  }

  // BR-4: Leads coming in but no deals closing
  // Real estate deals take months to close. Raised from 5 to 10 leads
  // to avoid false alarms on campaigns that are still in early pipeline.
  for (const row of clientRows) {
    const { leads, deals, domain: clientDomain } = row;
    if (leads >= 10 && deals === 0) {
      alerts.push({
        id: `br-leads-no-deals-${clientDomain}`,
        name: 'Leads coming in but no deals closing',
        severity: 'warning',
        category: 'dm-business-results',
        description: `${clientDomain} has ${leads} leads but 0 deals. Leads are being generated but none are converting to closed deals.`,
        entity: clientDomain,
        metrics: { current: deals, baseline: leads },
        detected_at: now,
        action: `Check the client's follow-up process and deal pipeline. Are leads being contacted promptly? Is the CRM being updated? Consider a CS check-in to review their sales workflow.`,
      });
    }
  }

  // BR-5: Stagnant campaign
  // At 0.3% response rate, 500 sends → ~1.5 leads is EXPECTED.
  // Only flag as stagnant at higher volumes where the lead count is clearly below expectations.
  // 2,000 mailings → ~6 expected; getting 1-3 is genuinely below average.
  for (const row of clientRows) {
    const { totalMailed, leads, deals, domain: clientDomain } = row;
    if (totalMailed >= 2000 && leads > 0 && leads <= 3 && deals === 0) {
      const expectedLeads = Math.round(totalMailed * 0.003);
      alerts.push({
        id: `br-stagnant-${clientDomain}`,
        name: 'Stagnant campaign',
        severity: 'info',
        category: 'dm-business-results',
        description: `${clientDomain} has mailed ${totalMailed.toLocaleString()} properties but only generated ${leads} lead${leads > 1 ? 's' : ''} with 0 deals. At ~0.3% response rate, ~${expectedLeads} leads were expected.`,
        entity: clientDomain,
        metrics: { current: leads, baseline: totalMailed },
        detected_at: now,
        action: `Suggest expanding targeting criteria — broader geographic area, additional property types, or higher price range. Consider refreshing the template with a new design.`,
      });
    }
  }

  // BR-6: Pipeline leakage
  for (const row of clientRows) {
    const { leads, appointments, contracts, deals, domain: clientDomain } = row;
    if (leads < 5) continue;
    const stages: { from: string; to: string; fromCount: number; toCount: number }[] = [
      { from: 'leads', to: 'appointments', fromCount: leads, toCount: appointments },
      { from: 'appointments', to: 'contracts', fromCount: appointments, toCount: contracts },
      { from: 'contracts', to: 'deals', fromCount: contracts, toCount: deals },
    ];
    for (const stage of stages) {
      if (stage.fromCount >= 5 && stage.toCount === 0) {
        alerts.push({
          id: `br-pipeline-leak-${clientDomain}-${stage.from}-${stage.to}`,
          name: 'Pipeline leakage',
          severity: 'warning',
          category: 'dm-business-results',
          description: `${clientDomain} has ${stage.fromCount} ${stage.from} but 0 ${stage.to}. There may be a bottleneck in the client's ${stage.to} process.`,
          entity: clientDomain,
          metrics: { current: stage.toCount, baseline: stage.fromCount },
          detected_at: now,
          action: `Check with the client what's happening at the ${stage.from} → ${stage.to} stage. Are they following up? Is there a process gap or CRM issue preventing progression?`,
        });
        break;
      }
    }
  }

  // BR-7: Negative ROAS
  for (const row of clientRows) {
    const { totalCost, totalRevenue, deals, domain: clientDomain } = row;
    if (deals > 0 && totalCost > 0 && totalRevenue > 0 && totalRevenue < totalCost) {
      const roas = Number((totalRevenue / totalCost).toFixed(2));
      alerts.push({
        id: `br-negative-roas-${clientDomain}`,
        name: 'Negative ROAS',
        severity: 'warning',
        category: 'dm-business-results',
        description: `${clientDomain} has a ${roas}x ROAS — spending $${totalCost.toLocaleString()} but only earning $${totalRevenue.toLocaleString()} from ${deals} deal${deals > 1 ? 's' : ''}. The campaign is losing money.`,
        entity: clientDomain,
        metrics: { current: roas, baseline: 1 },
        detected_at: now,
        action: `Review deal values and campaign costs with the client. If deal sizes are consistently small, consider targeting higher-value properties or reducing mailing frequency to improve cost efficiency.`,
      });
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const data: AlertsResult = {
    alerts,
    summary: {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      total: alerts.length,
    },
  };

  setCache(cacheKey, data);
  return data;
}

// dm_property_conversions is the SINGLE SOURCE OF TRUTH for conversion counts.
// dm_client_funnel provides operational fields (mailed, cost) when available.
// This mirrors getMergedClientData() in route.ts for full consistency.
async function getMergedClientDataForAlerts(domain?: string): Promise<MergedDomainRow[]> {
  const [funnelRows, propertyRows] = await Promise.all([
    runAuroraQuery(`
      SELECT
        domain,
        COALESCE(total_properties_mailed, 0) as total_mailed,
        COALESCE(total_sends, 0) as total_sends,
        COALESCE(total_delivered, 0) as total_delivered,
        COALESCE(total_cost, 0) as total_cost
      FROM dm_client_funnel
      WHERE date = (SELECT MAX(date) FROM dm_client_funnel WHERE ${domainFilter(domain)})
        AND ${domainFilter(domain)}
    `),
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
        COALESCE(SUM(CASE WHEN deal_revenue > 0 AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN deal_revenue ELSE 0 END), 0) as total_revenue
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
      GROUP BY domain
    `),
  ]);

  // Build operational data lookup from dm_client_funnel
  const funnelMap = new Map<string, { totalMailed: number; totalSends: number; totalDelivered: number; totalCost: number }>();
  for (const r of funnelRows) {
    const d = String(r.domain || '');
    funnelMap.set(d, {
      totalMailed: Number(r.total_mailed || 0),
      totalSends: Number(r.total_sends || 0),
      totalDelivered: Number(r.total_delivered || 0),
      totalCost: Number(r.total_cost || 0),
    });
  }

  // dm_property_conversions drives all domains and conversion counts
  const domainMap = new Map<string, MergedDomainRow>();
  for (const r of propertyRows) {
    const d = String(r.domain || '');
    const funnel = funnelMap.get(d);
    domainMap.set(d, {
      domain: d,
      totalMailed: funnel ? funnel.totalMailed : Number(r.total_mailed || 0),
      totalSends: funnel ? funnel.totalSends : Number(r.total_sends || 0),
      totalDelivered: funnel ? funnel.totalDelivered : Number(r.total_delivered || 0),
      leads: Number(r.leads || 0),
      appointments: Number(r.appointments || 0),
      contracts: Number(r.contracts || 0),
      deals: Number(r.deals || 0),
      totalCost: funnel ? funnel.totalCost : Number(r.total_cost || 0),
      totalRevenue: Number(r.total_revenue || 0),
    });
  }

  return Array.from(domainMap.values());
}
