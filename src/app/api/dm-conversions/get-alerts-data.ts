/**
 * Shared alerts data fetcher — used by both the main dm-conversions route
 * and the business-alerts Slack digest route.
 *
 * Extracted to avoid internal HTTP self-fetch which fails on Cloud Run.
 */

import { runAuroraQuery } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
// Test-domain exclusion — canonical source. Any change applies everywhere simultaneously.
import { TEST_DOMAINS_SQL as SEED_DOMAINS, EXCLUDE_TEST_DOMAINS_SQL as EXCLUDE_SEED } from '@/lib/domain-filter';
// Campaign / client lifecycle alerts — shared with the operational digest so
// both Slack channels surface the same events with matching IDs.
import { queryRecentCampaignStops, queryRecentClientDeactivations } from '@/lib/campaign-lifecycle';
import type { DmAlert } from '@/types/dm-conversions';

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
  firstSentDate: string | null;
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

export async function getAlertsData(domain?: string): Promise<AlertsResult> {
  // Alerts are computed against a fixed 30-day activity window — no per-call
  // date scoping. Cache key only varies by domain.
  const cacheKey = `dm-conversions:alerts:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached as AlertsResult;

  // 30-day activity window — clients/campaigns whose most recent send was more
  // than 30 days ago drop out of every business alert. Stale data shouldn't
  // fire warnings; we only want to surface what's happening *now*.
  const ACTIVITY_WINDOW_DAYS = 30;

  const [clientRows, clientLatestRows] = await Promise.all([
    getMergedClientDataForAlerts(domain),
    runAuroraQuery(`
      SELECT domain, MAX(first_sent_date) as last_sent_date
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
      GROUP BY domain
    `),
  ]);

  const activeDomains = new Set<string>(
    clientLatestRows
      .filter((r: Record<string, unknown>) => {
        const d = r.last_sent_date ? new Date(String(r.last_sent_date)) : null;
        if (!d) return false;
        const ageDays = (Date.now() - d.getTime()) / 86_400_000;
        return ageDays <= ACTIVITY_WINDOW_DAYS;
      })
      .map((r: Record<string, unknown>) => String(r.domain)),
  );

  const activeClientRows = clientRows.filter(r => activeDomains.has(r.domain));

  const alerts: DmAlert[] = [];
  const now = new Date().toISOString();

  // BR-1: Underperforming campaign — strict, client-level.
  // Volume gate: ≥20,000 delivered. Below that, response-rate noise dominates
  // (a 0.3% baseline implies ~60 expected leads at 20K — statistically robust).
  //   - Critical: zero leads at 20K+ delivered. Almost certainly broken.
  //   - Warning : leads > 0 but response rate < 0.3% (industry baseline).
  // No info tier; we want fewer, sharper alerts. Folded BR-5 ("Stagnant").
  const RESPONSE_RATE_THRESHOLD = 0.003;
  const VOLUME_GATE_DELIVERED = 20_000;
  for (const row of activeClientRows) {
    const { totalDelivered, leads, totalCost, totalRevenue, domain: clientDomain } = row;
    if (totalDelivered < VOLUME_GATE_DELIVERED) continue;

    const expectedLeads = Math.max(1, Math.round(totalDelivered * RESPONSE_RATE_THRESHOLD));
    const costNote = totalCost > 500
      ? ` The campaign has spent $${totalCost.toLocaleString()} with $${totalRevenue.toLocaleString()} revenue.`
      : '';

    if (leads === 0) {
      alerts.push({
        id: `br-underperforming-${clientDomain}`,
        name: 'Underperforming campaign',
        severity: 'critical',
        category: 'dm-business-results',
        description: `${clientDomain} has delivered ${totalDelivered.toLocaleString()} pieces with zero leads.${costNote} At the 0.3% industry baseline, this volume should have produced ~${expectedLeads} leads.`,
        entity: clientDomain,
        metrics: { current: leads, baseline: totalDelivered },
        detected_at: now,
        action: `Review the template and targeting criteria with the client. Consider switching templates, refreshing the design, expanding the geographic area, or adjusting the property type filter.`,
      });
    } else {
      const responseRate = leads / totalDelivered;
      if (responseRate < RESPONSE_RATE_THRESHOLD) {
        alerts.push({
          id: `br-underperforming-${clientDomain}`,
          name: 'Underperforming campaign',
          severity: 'warning',
          category: 'dm-business-results',
          description: `${clientDomain} has delivered ${totalDelivered.toLocaleString()} pieces and produced ${leads} lead${leads > 1 ? 's' : ''} (${(responseRate * 100).toFixed(2)}% response rate, below the 0.3% industry baseline).${costNote} At baseline, ~${expectedLeads} leads were expected.`,
          entity: clientDomain,
          metrics: { current: leads, baseline: expectedLeads },
          detected_at: now,
          action: `Suggest expanding targeting criteria — broader geography, additional property types, or higher price range. Consider refreshing the template with a new design.`,
        });
      }
    }
  }

  // BR-2: Template underperforming vs peers — REMOVED 2026-04-27.
  // Per-template alerts are too granular and noisy; client-level signal lives
  // in BR-1 (underperforming campaign).

  // BR-3: Low delivery rate — client-level, not per-template.
  // Fires only when a client has ≥5,000 delivered, <50% delivery rate, and
  // their oldest piece is ≥14 days old (excludes PCM-in-transit false positives).
  for (const row of activeClientRows) {
    const { totalSends, totalDelivered, firstSentDate, domain: clientDomain } = row;
    if (totalSends < 5000) continue;
    const deliveryRate = totalSends > 0 ? (totalDelivered / totalSends) * 100 : 0;
    if (deliveryRate <= 0 || deliveryRate >= 50) continue;
    const firstSent = firstSentDate ? new Date(firstSentDate) : null;
    const ageDays = firstSent ? Math.floor((Date.now() - firstSent.getTime()) / 86_400_000) : 0;
    if (ageDays < 14) continue;

    alerts.push({
      id: `br-low-delivery-${clientDomain}`,
      name: 'Low delivery rate',
      severity: 'warning',
      category: 'dm-business-results',
      description: `${clientDomain} has a ${deliveryRate.toFixed(1)}% delivery rate (${totalDelivered.toLocaleString()} of ${totalSends.toLocaleString()} sent, oldest piece ${ageDays}d old). Mail list quality may be an issue, or pieces are stuck upstream in PCM.`,
      entity: clientDomain,
      metrics: { current: Math.round(deliveryRate * 10) / 10, baseline: 50 },
      detected_at: now,
      action: `Review property data quality for ${clientDomain}. If addresses look clean, check Operational Health → Campaigns table for pieces stuck in 'Sent' status — that points at PCM, not list quality.`,
    });
  }

  // BR-4: Leads coming in but no deals closing
  // Real estate deals take 3-6 months. 90-day cohort age gate stops this from
  // firing on month-old campaigns where no-deals is just early-pipeline reality.
  for (const row of activeClientRows) {
    const { leads, deals, domain: clientDomain, firstSentDate } = row;
    const cohortAgeDays = firstSentDate
      ? Math.floor((Date.now() - new Date(firstSentDate).getTime()) / 86_400_000)
      : 0;
    if (leads >= 10 && deals === 0 && cohortAgeDays >= 90) {
      alerts.push({
        id: `br-leads-no-deals-${clientDomain}`,
        name: 'Leads coming in but no deals closing',
        severity: 'warning',
        category: 'dm-business-results',
        description: `${clientDomain} has ${leads} leads but 0 deals across a cohort that's ${cohortAgeDays}d old. Leads are being generated but none are converting after the typical 3-6 month real-estate close window.`,
        entity: clientDomain,
        metrics: { current: deals, baseline: leads },
        detected_at: now,
        action: `Check the client's follow-up process and deal pipeline. Are leads being contacted promptly? Is the CRM being updated? Consider a CS check-in to review their sales workflow.`,
      });
    }
  }

  // BR-5 was "Stagnant campaign" — REMOVED 2026-04-27. Originally folded into
  // BR-1 as an info tier; subsequent simplification dropped the info tier
  // entirely in favor of stricter critical/warning gates.

  // BR-6: Pipeline leakage
  for (const row of activeClientRows) {
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
  for (const row of activeClientRows) {
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

  // BR-8: Campaign / client lifecycle alerts.
  // Same detection the ops digest uses — shared IDs so the two channels stay
  // in sync when a campaign/client flips. 7-day window keeps recent events
  // fresh; older inactives drop out of the digest.
  try {
    const LIFECYCLE_WINDOW_DAYS = 7;
    const [stops, deactivations] = await Promise.all([
      queryRecentCampaignStops(LIFECYCLE_WINDOW_DAYS, domain),
      queryRecentClientDeactivations(LIFECYCLE_WINDOW_DAYS, domain),
    ]);

    for (const evt of stops) {
      const stoppedDate = evt.stoppedAt.slice(0, 10);
      const lastSentLine = evt.lastSentDate
        ? ` Last mail sent: ${evt.lastSentDate.slice(0, 10)}.`
        : '';
      alerts.push({
        id: `rr-campaign-stopped:${evt.domain}:${evt.campaignId}`,
        name: 'Campaign went inactive',
        severity: 'warning',
        category: 'dm-business-results',
        description: `Campaign *${evt.campaignName}* (${evt.domain}) transitioned from active → ${evt.finalStatus} on ${stoppedDate}.${lastSentLine}`,
        entity: `${evt.domain} / ${evt.campaignName}`,
        detected_at: evt.stoppedAt || now,
        action: 'Confirm with the client if this was intentional; if not, re-enable in the platform. Reach out to understand why.',
      });
    }

    for (const evt of deactivations) {
      const deactivatedDate = evt.deactivatedAt.slice(0, 10);
      alerts.push({
        id: `rr-client-inactive:${evt.domain}`,
        name: 'Client went inactive',
        severity: 'critical',
        category: 'dm-business-results',
        description: `${evt.domain} now has zero active campaigns (${evt.totalCampaigns} total, all non-active). Most recent flip: *${evt.lastCampaign.campaignName}* → ${evt.lastCampaign.finalStatus} on ${deactivatedDate}.`,
        entity: evt.domain,
        metrics: { current: 0, baseline: evt.totalCampaigns },
        detected_at: evt.deactivatedAt || now,
        action: 'Contact the client to understand why they stopped. Candidate for CS outreach / churn risk review.',
      });
    }
  } catch (err) {
    console.error('[get-alerts-data] Lifecycle alerts probe failed:', err);
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
        -- Strict attribution + platform-aligned (no temporal gate). See dm-conversions/route.ts.
        COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' AND became_lead_at IS NOT NULL THEN property_id END) as leads,
        COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' AND became_appointment_at IS NOT NULL THEN property_id END) as appointments,
        COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' AND became_contract_at IS NOT NULL THEN property_id END) as contracts,
        COUNT(DISTINCT CASE WHEN attribution_status = 'attributed' AND became_deal_at IS NOT NULL THEN property_id END) as deals,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(CASE WHEN attribution_status = 'attributed' AND deal_revenue > 0 THEN deal_revenue ELSE 0 END), 0) as total_revenue,
        MIN(first_sent_date) as first_sent_date
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
      firstSentDate: r.first_sent_date ? String(r.first_sent_date) : null,
    });
  }

  return Array.from(domainMap.values());
}
