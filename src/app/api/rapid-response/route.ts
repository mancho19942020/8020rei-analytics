/**
 * Rapid Response Metrics — Next.js API Route
 *
 * Queries Aurora's rr_campaign_snapshots, rr_daily_metrics, rr_pcm_alignment tables.
 * Supports: overview, daily-trend, campaign-list, pcm-alignment, alerts, cost-trend
 *
 * Mirrors the pattern from /api/properties-api/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
import type {
  RrSystemStatus,
  RrOperationalPulse,
  RrQualityMetrics,
  RrPcmHealth,
  RrDailyMetric,
  RrCampaignSnapshot,
  RrAlert,
  RrStatusBreakdown,
  RrCostPoint,
  RrQ2Goal,
  RrQ2GoalClientRow,
} from '@/types/rapid-response';

// Exclude seed/test domains — must match the same list used in pcm-validation and dm-conversions
const SEED_DOMAINS = "'8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com'";
const EXCLUDE_SEED = `domain NOT IN (${SEED_DOMAINS})`;

/** Build a WHERE clause that excludes seed domains AND optionally filters to a specific domain */
function domainFilter(domain?: string | null): string {
  if (domain) {
    // Sanitize: only allow alphanumeric, underscore, dot
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
  const type = params.get('type') || 'overview';
  const days = parseInt(params.get('days') || '30');
  const domain = params.get('domain') || undefined;

  try {
    switch (type) {
      case 'overview':
        return await getOverview(days, domain);
      case 'daily-trend':
        return await getDailyTrend(days, domain);
      case 'campaign-list':
        return await getCampaignList(days, domain);
      case 'pcm-alignment':
        return await getPcmAlignment(domain);
      case 'alerts':
        return await getAlerts(days, domain);
      case 'cost-trend':
        return await getCostTrend(days, domain);
      case 'status-breakdown':
        return await getStatusBreakdown(days, domain);
      case 'domain-list':
        return await getDomainList();
      case 'q2-goal':
        return await getQ2Goal(domain);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`[Rapid Response] Error fetching ${type}:`, error);
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
// Overview — aggregated system status + three pillars
// ---------------------------------------------------------------------------

async function getOverview(days: number, domain?: string) {
  const cacheKey = `rapid-response:overview:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Run all four queries in parallel — includes dm_client_funnel for cross-tab consistency
  const domSubFilter = domain ? `AND dcf.domain = '${domain.replace(/[^a-zA-Z0-9_.]/g, '')}'` : '';
  const domFFilter = domain ? `AND f.domain = '${domain.replace(/[^a-zA-Z0-9_.]/g, '')}'` : '';

  const [pulseRows, qualityRows, pcmRows, funnelRows] = await Promise.all([
    // Operational Pulse: latest snapshot per campaign
    runAuroraQuery(`
      SELECT DISTINCT ON (domain, campaign_id)
        campaign_id, campaign_name, domain, campaign_type, status,
        total_sent, total_delivered, last_sent_date,
        on_hold_count, follow_up_pending_count, snapshot_at
      FROM rr_campaign_snapshots
      WHERE ${domainFilter(domain)}
      ORDER BY domain, campaign_id, snapshot_at DESC
    `),

    // Quality Metrics: aggregated daily metrics for the selected period
    runAuroraQuery(`
      SELECT
        COALESCE(SUM(sends_total), 0) as sends_total,
        COALESCE(SUM(sends_success), 0) as sends_success,
        COALESCE(SUM(sends_error), 0) as sends_error,
        COALESCE(SUM(delivered_count), 0) as delivered_count
      FROM rr_daily_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      AND ${domainFilter(domain)}
    `),

    // PCM Health: latest per-domain alignment check
    runAuroraQuery(`
      SELECT DISTINCT ON (domain)
        domain, stale_sent_count, orphaned_orders_count, oldest_stale_days,
        delivery_lag_median_days, back_office_sync_gap, checked_at
      FROM rr_pcm_alignment
      WHERE ${domainFilter(domain)}
      ORDER BY domain, checked_at DESC
    `),

    // Corrected lifetime totals from dm_client_funnel — THE source of truth.
    // Same table and query used by PCM & profitability tab and Business Results funnel.
    // This ensures delivery rate matches across all three tabs.
    runAuroraQuery(`
      SELECT
        COALESCE(SUM(f.total_sends), 0) as total_sends,
        COALESCE(SUM(f.total_delivered), 0) as total_delivered
      FROM dm_client_funnel f
      INNER JOIN (
        SELECT dcf.domain, MAX(dcf.date) as max_date
        FROM dm_client_funnel dcf
        WHERE dcf.domain IS NOT NULL
          AND dcf.domain NOT IN (${SEED_DOMAINS})
          ${domSubFilter}
        GROUP BY dcf.domain
      ) latest ON f.domain = latest.domain AND f.date = latest.max_date
      WHERE f.domain IS NOT NULL
        AND f.domain NOT IN (${SEED_DOMAINS})
        ${domFFilter}
    `),
  ]);

  // Compute Operational Pulse
  const activeCampaigns = pulseRows.filter((r: Record<string, unknown>) => r.status === 'active').length;
  const totalOnHold = pulseRows.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.on_hold_count || 0), 0);
  const totalFollowUp = pulseRows.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.follow_up_pending_count || 0), 0);

  // Find sends today from daily metrics
  const todayRows = await runAuroraQuery(`
    SELECT COALESCE(SUM(sends_total), 0) as sends_today
    FROM rr_daily_metrics
    WHERE date = CURRENT_DATE AND ${domainFilter(domain)}
  `);
  const sendsToday = Number(todayRows[0]?.sends_today || 0);

  // Find the most recent send across all campaigns
  const lastSendDates = pulseRows
    .map((r: Record<string, unknown>) => r.last_sent_date)
    .filter(Boolean)
    .sort()
    .reverse();

  const operationalPulse: RrOperationalPulse = {
    activeCampaigns,
    totalCampaigns: pulseRows.length,
    sendsToday,
    lastSendTime: lastSendDates[0] ? String(lastSendDates[0]) : null,
    totalOnHold,
    totalFollowUpPending: totalFollowUp,
  };

  // Compute Quality Metrics
  // Delivery rate uses dm_client_funnel (the corrected source of truth) — same table as
  // PCM & profitability tab and Business Results funnel. This ensures the delivery rate
  // shown here matches the other tabs exactly.
  const q = qualityRows[0] || {};
  const sendsTotal = Number(q.sends_total || 0);
  const sendsError = Number(q.sends_error || 0);
  const deliveredCount = Number(q.delivered_count || 0);

  // Lifetime totals from dm_client_funnel (same source as PCM & profitability tab)
  const funnel = funnelRows[0] || {};
  const funnelTotalSends = Number(funnel.total_sends || 0);
  const funnelTotalDelivered = Number(funnel.total_delivered || 0);

  const qualityMetrics: RrQualityMetrics = {
    deliveryRate30d: funnelTotalSends > 0
      ? Number(((funnelTotalDelivered / funnelTotalSends) * 100).toFixed(1))
      : 0,
    lifetimeSent: funnelTotalSends,
    lifetimeDelivered: funnelTotalDelivered,
    pcmSubmissionRate: 0, // deprecated — widget now uses lifetimeSent/lifetimeDelivered
    errorRate: sendsTotal > 0 ? Number(((sendsError / sendsTotal) * 100).toFixed(1)) : 0,
    sendsTotal7d: sendsTotal,
    deliveredTotal7d: deliveredCount,
  };

  // Compute PCM Health (aggregated across all domains)
  const pcmHealth: RrPcmHealth = {
    staleSentCount: pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.stale_sent_count || 0), 0),
    orphanedOrdersCount: pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.orphaned_orders_count || 0), 0),
    oldestStaleDays: pcmRows.reduce((m: number, r: Record<string, unknown>) => Math.max(m, Number(r.oldest_stale_days || 0)), 0),
    deliveryLagMedianDays: pcmRows.length > 0
      ? Number((pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.delivery_lag_median_days || 0), 0) / pcmRows.length).toFixed(1))
      : 0,
    backOfficeSyncGap: pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.back_office_sync_gap || 0), 0),
    undeliverableRate7d: pcmRows.length > 0
      ? Number((pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.undeliverable_rate_7d || 0), 0) / pcmRows.length).toFixed(1))
      : 0,
  };

  // Compute System Status (verdict banner)
  const systemStatus = computeSystemStatus(
    pulseRows.length,
    operationalPulse,
    qualityMetrics,
    pcmHealth,
    pcmRows.length > 0 ? String(pcmRows[0].checked_at || '') : null
  );

  const data = {
    systemStatus,
    operationalPulse,
    qualityMetrics,
    pcmHealth,
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Daily Trend
// ---------------------------------------------------------------------------

async function getDailyTrend(days: number, domain?: string) {
  const cacheKey = `rapid-response:daily-trend:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      date::TEXT as date,
      campaign_type,
      sends_total, sends_success, sends_on_hold, sends_protected,
      sends_undeliverable, sends_error, delivered_count,
      cost_total, avg_unit_cost, pcm_submission_rate, delivery_rate_30d,
      follow_up_sent, follow_up_failed
    FROM rr_daily_metrics
    WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      AND ${domainFilter(domain)}
    ORDER BY date ASC
  `);

  const data: RrDailyMetric[] = rows.map((r: Record<string, unknown>) => ({
    date: String(r.date || ''),
    domain: String(r.domain || ''),
    campaignType: String(r.campaign_type || ''),
    sendsTotal: Number(r.sends_total || 0),
    sendsSuccess: Number(r.sends_success || 0),
    sendsOnHold: Number(r.sends_on_hold || 0),
    sendsProtected: Number(r.sends_protected || 0),
    sendsUndeliverable: Number(r.sends_undeliverable || 0),
    sendsError: Number(r.sends_error || 0),
    deliveredCount: Number(r.delivered_count || 0),
    costTotal: Number(r.cost_total || 0),
    avgUnitCost: Number(r.avg_unit_cost || 0),
    pcmSubmissionRate: Number(r.pcm_submission_rate || 0),
    deliveryRate30d: Number(r.delivery_rate_30d || 0),
    followUpSent: Number(r.follow_up_sent || 0),
    followUpFailed: Number(r.follow_up_failed || 0),
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Campaign List
// ---------------------------------------------------------------------------

async function getCampaignList(days: number, domain?: string) {
  const cacheKey = `rapid-response:campaign-list:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Filter campaigns to those with activity in the date range.
  // last_sent_date tracks when the campaign last sent mail.
  const dateFilter = days < 365
    ? `AND last_sent_date >= CURRENT_DATE - INTERVAL '${days} days'`
    : '';

  const rows = await runAuroraQuery(`
    SELECT DISTINCT ON (domain, campaign_id)
      campaign_id, campaign_name, domain, campaign_type, status,
      total_sent, total_delivered, last_sent_date,
      letters_delivered_30d, postcards_delivered_30d,
      on_hold_count, follow_up_pending_count,
      smartdrop_authorization_status, snapshot_at
    FROM rr_campaign_snapshots
    WHERE ${domainFilter(domain)}
      ${dateFilter}
    ORDER BY domain, campaign_id, snapshot_at DESC
  `);

  const data: RrCampaignSnapshot[] = rows.map((r: Record<string, unknown>) => ({
    campaignId: String(r.campaign_id || ''),
    campaignName: String(r.campaign_name || ''),
    domain: String(r.domain || ''),
    campaignType: String(r.campaign_type || '') as 'rr' | 'smartdrop',
    status: String(r.status || ''),
    totalSent: Number(r.total_sent || 0),
    totalDelivered: Number(r.total_delivered || 0),
    lastSentDate: r.last_sent_date ? String(r.last_sent_date) : null,
    lettersDelivered30d: Number(r.letters_delivered_30d || 0),
    postcardsDelivered30d: Number(r.postcards_delivered_30d || 0),
    onHoldCount: Number(r.on_hold_count || 0),
    followUpPendingCount: Number(r.follow_up_pending_count || 0),
    smartdropAuthorizationStatus: r.smartdrop_authorization_status ? String(r.smartdrop_authorization_status) : null,
    snapshotAt: String(r.snapshot_at || ''),
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// PCM Alignment (time series)
// ---------------------------------------------------------------------------

async function getPcmAlignment(domain?: string) {
  const cacheKey = `rapid-response:pcm-alignment:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      checked_at::TEXT as checked_at,
      domain,
      stale_sent_count, orphaned_orders_count, oldest_stale_days,
      vendor_status_breakdown,
      delivery_lag_median_days, delivery_lag_p95_days,
      undeliverable_rate_7d, back_office_sync_gap
    FROM rr_pcm_alignment
    WHERE ${domainFilter(domain)}
    ORDER BY checked_at DESC
    LIMIT 48
  `);

  const data = rows.map((r: Record<string, unknown>) => ({
    checkedAt: String(r.checked_at || ''),
    domain: String(r.domain || ''),
    staleSentCount: Number(r.stale_sent_count || 0),
    orphanedOrdersCount: Number(r.orphaned_orders_count || 0),
    oldestStaleDays: Number(r.oldest_stale_days || 0),
    vendorStatusBreakdown: typeof r.vendor_status_breakdown === 'string'
      ? JSON.parse(r.vendor_status_breakdown)
      : (r.vendor_status_breakdown || {}),
    deliveryLagMedianDays: Number(r.delivery_lag_median_days || 0),
    deliveryLagP95Days: Number(r.delivery_lag_p95_days || 0),
    undeliverableRate7d: Number(r.undeliverable_rate_7d || 0),
    backOfficeSyncGap: Number(r.back_office_sync_gap || 0),
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Status Breakdown (for donut/bar chart)
// ---------------------------------------------------------------------------

async function getStatusBreakdown(days: number, domain?: string) {
  const cacheKey = `rapid-response:status-breakdown:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      COALESCE(SUM(sends_success), 0) as sent,
      COALESCE(SUM(delivered_count), 0) as delivered,
      COALESCE(SUM(sends_on_hold), 0) as on_hold,
      COALESCE(SUM(sends_protected), 0) as protected,
      COALESCE(SUM(sends_undeliverable), 0) as undeliverable,
      COALESCE(SUM(sends_error), 0) as error
    FROM rr_daily_metrics
    WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      AND ${domainFilter(domain)}
  `);

  const r = rows[0] || {};
  const data: RrStatusBreakdown[] = [
    { status: 'Delivered', count: Number(r.delivered || 0) },
    { status: 'Sent (In Transit)', count: Number(r.sent || 0) - Number(r.delivered || 0) },
    { status: 'On Hold', count: Number(r.on_hold || 0) },
    { status: 'Protected', count: Number(r.protected || 0) },
    { status: 'Undeliverable', count: Number(r.undeliverable || 0) },
    { status: 'Error', count: Number(r.error || 0) },
  ].filter(d => d.count > 0);

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Cost Trend
// ---------------------------------------------------------------------------

async function getCostTrend(days: number, domain?: string) {
  const cacheKey = `rapid-response:cost-trend:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      date::TEXT as date,
      COALESCE(SUM(cost_total), 0) as cost_total,
      COALESCE(AVG(avg_unit_cost), 0) as avg_unit_cost,
      COALESCE(SUM(sends_total), 0) as sends_total
    FROM rr_daily_metrics
    WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      AND ${domainFilter(domain)}
    GROUP BY date
    ORDER BY date ASC
  `);

  const data: RrCostPoint[] = rows.map((r: Record<string, unknown>) => ({
    date: String(r.date || ''),
    costTotal: Number(Number(r.cost_total || 0).toFixed(2)),
    avgUnitCost: Number(Number(r.avg_unit_cost || 0).toFixed(2)),
    sendsTotal: Number(r.sends_total || 0),
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

async function getAlerts(days: number, domain?: string) {
  const cacheKey = `rapid-response:alerts:${days}:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Fetch the data needed for alert evaluation
  const [pulseRows, qualityRows, pcmRows, todayRows] = await Promise.all([
    runAuroraQuery(`
      SELECT DISTINCT ON (domain, campaign_id)
        campaign_id, campaign_name, domain, status, on_hold_count, snapshot_at
      FROM rr_campaign_snapshots
      WHERE ${domainFilter(domain)}
      ORDER BY domain, campaign_id, snapshot_at DESC
    `),
    runAuroraQuery(`
      SELECT
        COALESCE(SUM(sends_total), 0) as sends_total,
        COALESCE(SUM(sends_error), 0) as sends_error,
        COALESCE(AVG(delivery_rate_30d), 0) as avg_delivery_rate,
        COALESCE(AVG(pcm_submission_rate), 0) as avg_pcm_rate
      FROM rr_daily_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      AND ${domainFilter(domain)}
    `),
    runAuroraQuery(`
      SELECT DISTINCT ON (domain)
        domain, stale_sent_count, orphaned_orders_count, oldest_stale_days,
        delivery_lag_median_days, back_office_sync_gap, undeliverable_rate_7d, checked_at
      FROM rr_pcm_alignment
      WHERE ${domainFilter(domain)}
      ORDER BY domain, checked_at DESC
    `),
    runAuroraQuery(`
      SELECT COALESCE(SUM(sends_total), 0) as sends_today
      FROM rr_daily_metrics
      WHERE date = CURRENT_DATE AND ${domainFilter(domain)}
    `),
  ]);

  const alerts: RrAlert[] = [];
  const now = new Date().toISOString();

  const activeCampaigns = pulseRows.filter((r: Record<string, unknown>) => r.status === 'active').length;
  const sendsToday = Number(todayRows[0]?.sends_today || 0);
  const q = qualityRows[0] || {};

  // Aggregate PCM data across all domains
  const totalStale = pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.stale_sent_count || 0), 0);
  const totalOrphaned = pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.orphaned_orders_count || 0), 0);
  const totalSyncGap = pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.back_office_sync_gap || 0), 0);

  // Helper: list affected domains for a condition
  function affectedDomains(rows: Record<string, unknown>[], field: string): string {
    const domains = rows
      .filter(r => Number(r[field] || 0) > 0)
      .map(r => String(r.domain || ''));
    if (domains.length === 0) return '';
    return ` Affected: ${domains.join(', ')}.`;
  }

  // RR1: No sends detected — list which active campaigns and domains are affected
  if (activeCampaigns > 0 && sendsToday === 0) {
    const activeCampaignDetails = pulseRows
      .filter((r: Record<string, unknown>) => r.status === 'active')
      .map((r: Record<string, unknown>) => `${String(r.campaign_name || 'Unnamed')} (${String(r.domain || 'unknown')})`)
      .join(', ');

    alerts.push({
      id: 'rr-no-sends',
      name: 'No sends detected',
      severity: 'critical',
      category: 'rapid-response',
      description: `${activeCampaigns} campaigns are active but zero sends have been recorded today. The dispatch system may be stopped. Affected campaigns: ${activeCampaignDetails}.`,
      entity: activeCampaignDetails,
      metrics: { current: sendsToday, baseline: activeCampaigns },
      detected_at: now,
      action: 'Check the dispatch job logs and verify the cron is running on the backoffice server. Verify that the dispatch cron for each listed domain is scheduled and executing.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // RR2: PCM pipeline stale — per-domain breakdown
  if (totalStale > 0) {
    const staleBreakdown = pcmRows
      .filter((r: Record<string, unknown>) => Number(r.stale_sent_count || 0) > 0)
      .map((r: Record<string, unknown>) => `${String(r.domain || 'unknown')}: ${r.stale_sent_count} stale (oldest: ${r.oldest_stale_days}d)`)
      .join('; ');

    alerts.push({
      id: 'rr-pcm-stale',
      name: 'PCM pipeline stale',
      severity: 'critical',
      category: 'rapid-response',
      description: `${totalStale} mailings stuck in "sent" for 14+ days — PCM pipeline may be broken. Breakdown by client: ${staleBreakdown}.`,
      entity: affectedDomains(pcmRows, 'stale_sent_count').replace(' Affected: ', '').replace('.', ''),
      metrics: { current: totalStale },
      detected_at: now,
      action: 'Investigate the back-office PCM bridge for each affected client. Check if status updates from PCM are being received and forwarded correctly.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // RR3: Orphaned orders — per-domain breakdown
  if (totalOrphaned > 0) {
    const orphanBreakdown = pcmRows
      .filter((r: Record<string, unknown>) => Number(r.orphaned_orders_count || 0) > 0)
      .map((r: Record<string, unknown>) => `${String(r.domain || 'unknown')}: ${r.orphaned_orders_count} orphaned`)
      .join('; ');

    alerts.push({
      id: 'rr-orphaned-orders',
      name: 'Orphaned orders',
      severity: 'critical',
      category: 'rapid-response',
      description: `${totalOrphaned} mailings sent without a PCM order ID — these orders cannot be tracked. Breakdown by client: ${orphanBreakdown}.`,
      entity: affectedDomains(pcmRows, 'orphaned_orders_count').replace(' Affected: ', '').replace('.', ''),
      metrics: { current: totalOrphaned },
      detected_at: now,
      action: 'Check recent PCM API responses for each affected client. Look for API timeouts or rejection patterns that prevented order IDs from being stored.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // RR4: Back-office sync gap
  if (totalSyncGap > 0) {
    alerts.push({
      id: 'rr-sync-gap',
      name: 'Back-office sync gap',
      severity: 'critical',
      category: 'rapid-response',
      description: `${totalSyncGap} orders missing from back-office bridge table.${affectedDomains(pcmRows, 'back_office_sync_gap')}`,
      entity: affectedDomains(pcmRows, 'back_office_sync_gap').replace(' Affected: ', '').replace('.', ''),
      metrics: { current: totalSyncGap },
      detected_at: now,
      action: 'Verify the bridge table for the affected clients.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // RR5: Delivery rate drop
  const deliveryRate = Number(q.avg_delivery_rate || 0);
  if (deliveryRate > 0 && deliveryRate < 70) {
    alerts.push({
      id: 'rr-delivery-rate',
      name: 'Delivery rate below threshold',
      severity: 'warning',
      category: 'rapid-response',
      description: `The 30-day delivery rate is ${deliveryRate.toFixed(1)}%, below the 70% threshold.`,
      metrics: { current: deliveryRate, baseline: 70 },
      detected_at: now,
      action: 'Review undeliverable addresses and PCM rejection reasons.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // RR6: On-hold mailings — include which campaigns and domains have holds
  const onHoldDetails: { domain: string; campaign: string; count: number }[] = [];
  pulseRows.forEach((r: Record<string, unknown>) => {
    const hold = Number(r.on_hold_count || 0);
    if (hold > 0) {
      onHoldDetails.push({
        domain: String(r.domain || 'unknown'),
        campaign: String(r.campaign_name || 'Unnamed'),
        count: hold,
      });
    }
  });
  const totalOnHold = onHoldDetails.reduce((s, d) => s + d.count, 0);
  if (totalOnHold > 0) {
    const holdBreakdown = onHoldDetails
      .map(d => `${d.campaign} (${d.domain}): ${d.count} on hold`)
      .join('; ');
    const holdDomains = [...new Set(onHoldDetails.map(d => d.domain))].join(', ');

    alerts.push({
      id: 'rr-on-hold',
      name: 'Mailings on hold',
      severity: 'warning',
      category: 'rapid-response',
      description: `${totalOnHold} mailings on hold due to insufficient balance. Breakdown: ${holdBreakdown}.`,
      entity: holdDomains,
      metrics: { current: totalOnHold },
      detected_at: now,
      action: 'Check account balances for the affected clients.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // RR7: PCM submission rate low
  const pcmRate = Number(q.avg_pcm_rate || 0);
  if (pcmRate > 0 && pcmRate < 95) {
    alerts.push({
      id: 'rr-pcm-rate',
      name: 'PCM submission rate low',
      severity: 'warning',
      category: 'rapid-response',
      description: `The PCM submission success rate is ${pcmRate.toFixed(1)}%, below the 95% threshold. More sends are failing to reach PCM than expected.`,
      metrics: { current: pcmRate, baseline: 95 },
      detected_at: now,
      action: 'Review PCM API error logs. Check for systematic rejection patterns (bad addresses, rate limiting).',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // RR8: Delivery lag high (average across domains)
  const avgDeliveryLag = pcmRows.length > 0
    ? pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.delivery_lag_median_days || 0), 0) / pcmRows.length
    : 0;
  if (avgDeliveryLag > 10) {
    const lagDomains = pcmRows
      .filter((r: Record<string, unknown>) => Number(r.delivery_lag_median_days || 0) > 10)
      .map((r: Record<string, unknown>) => String(r.domain || ''));
    alerts.push({
      id: 'rr-delivery-lag',
      name: 'Delivery lag above normal',
      severity: 'info',
      category: 'rapid-response',
      description: `Median delivery time is ${avgDeliveryLag.toFixed(1)} days, above the 10-day threshold.${lagDomains.length > 0 ? ` Affected: ${lagDomains.join(', ')}.` : ''}`,
      entity: lagDomains.join(', ') || undefined,
      metrics: { current: avgDeliveryLag, baseline: 10 },
      detected_at: now,
      action: 'Monitor PCM vendor status distribution for processing bottlenecks.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // -------------------------------------------------------------------------
  // DM data-integrity alerts (moved from business results — product issues)
  // -------------------------------------------------------------------------

  // Source of truth: dm_property_conversions for all conversion + delivery data
  // Per unified data model: never use dm_template_performance.leads_generated/deals_generated
  // or dm_client_funnel.leads/deals for alert triggers.
  const [dmTemplateRows, dmClientRows] = await Promise.all([
    runAuroraQuery(`
      SELECT
        domain,
        COALESCE(template_name, 'Unknown template') as template_name,
        SUM(total_sends) as total_sent,
        SUM(total_delivered) as total_delivered,
        COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as leads,
        COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as deals,
        COALESCE(SUM(CASE WHEN deal_revenue > 0 AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN deal_revenue ELSE 0 END), 0) as total_revenue
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
      GROUP BY domain, template_name
    `),
    runAuroraQuery(`
      SELECT
        domain,
        COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as leads,
        COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL AND became_deal_at > first_sent_date AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as deals,
        COUNT(DISTINCT CASE WHEN attribution_status = 'unattributed' AND became_lead_at IS NOT NULL AND became_lead_at > first_sent_date THEN property_id END) as unattributed
      FROM dm_property_conversions
      WHERE ${domainFilter(domain)}
        AND ${verifiedDomainsFilter(domain)}
      GROUP BY domain
    `),
  ]);

  // RR9: Revenue without matching deal status (data integrity)
  for (const r of dmTemplateRows) {
    const deals = Number(r.deals || 0);
    const revenue = Number(r.total_revenue || 0);
    const templateName = String(r.template_name || '');
    const templateDomain = String(r.domain || '');

    if (deals === 0 && revenue > 500) {
      alerts.push({
        id: `rr-revenue-no-deal-${templateDomain}-${templateName}`,
        name: 'Revenue without matching deal status',
        severity: 'warning',
        category: 'rapid-response',
        description: `"${templateName}" (${templateDomain}) shows $${revenue.toLocaleString()} revenue but 0 deals. Revenue and deal status are out of sync.`,
        entity: templateDomain,
        metrics: { current: revenue, baseline: 0 },
        detected_at: now,
        action: 'Data integrity issue — revenue exists in reverse_buybox_deals but no deal status in log_status_properties. Check the status sync pipeline.',
        link: '/features/features-rei/dm-campaign/operational-health',
      });
    }
  }

  // RR10: Leads without delivery confirmation (tracking misconfiguration)
  for (const r of dmTemplateRows) {
    const totalSent = Number(r.total_sent || 0);
    const delivered = Number(r.total_delivered || 0);
    const leads = Number(r.leads || 0);
    const templateName = String(r.template_name || '');
    const templateDomain = String(r.domain || '');

    if (totalSent > 200 && delivered === 0 && leads > 0) {
      alerts.push({
        id: `rr-delivery-tracking-${templateDomain}-${templateName}`,
        name: 'Leads without delivery confirmation',
        severity: 'warning',
        category: 'rapid-response',
        description: `"${templateName}" (${templateDomain}) generated ${leads} leads but shows 0 deliveries. Delivery tracking may not be configured.`,
        entity: templateDomain,
        metrics: { current: delivered, baseline: totalSent },
        detected_at: now,
        action: 'Check if delivery status is being tracked correctly for this domain. The monolith may use a different status string than "delivered".',
        link: '/features/features-rei/dm-campaign/operational-health',
      });
    }
  }

  // RR11: High unattributed conversions (attribution system issue)
  for (const row of dmClientRows) {
    const clientLeads = Number(row.leads || 0);
    const clientDeals = Number(row.deals || 0);
    const unattributed = Number(row.unattributed || 0);
    const clientDomain = String(row.domain || '');
    const totalConversions = clientLeads + clientDeals;

    if (totalConversions > 0 && unattributed > 0) {
      const rate = Number(((unattributed / totalConversions) * 100).toFixed(1));
      if (rate > 30) {
        alerts.push({
          id: `rr-high-unattributed-${clientDomain}`,
          name: 'High unattributed conversions',
          severity: 'warning',
          category: 'rapid-response',
          description: `${clientDomain} has ${rate}% unattributed conversions (${unattributed} of ${totalConversions}).`,
          entity: clientDomain,
          metrics: { current: rate, baseline: 30 },
          detected_at: now,
          action: 'Check attribution system. Conversions before Sep 2025 will have NULL attribution by design.',
          link: '/features/features-rei/dm-campaign/operational-health',
        });
      }
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
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Q2 Volume Goal — tracks progress toward 400K DM pieces in Q2 2026
// Source: dm_volume_summary preferred (daily_sends), falls back to rr_daily_metrics
// until dm_volume_summary accumulates daily data over multiple cron cycles.
// ---------------------------------------------------------------------------

const Q2_TARGET = 400_000;
const Q2_START = '2026-04-01';
const Q2_END = '2026-06-30';

async function getQ2Goal(domain?: string): Promise<ReturnType<typeof NextResponse.json>> {
  const cacheKey = `rapid-response:q2-goal:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Try dm_volume_summary first (preferred source once daily data populates)
  const vsCheck = await runAuroraQuery(`
    SELECT COALESCE(SUM(daily_sends), 0) as total
    FROM dm_volume_summary
    WHERE date >= '${Q2_START}' AND date <= '${Q2_END}'
      AND daily_sends IS NOT NULL AND daily_sends > 0
      AND (mail_class = 'all' OR mail_class IS NULL)
      AND ${domainFilter(domain)}
  `);
  const vsHasData = Number(vsCheck[0]?.total || 0) > 0;

  let summaryRows, clientRows;

  if (vsHasData) {
    // dm_volume_summary has daily data — use it (preferred)
    [summaryRows, clientRows] = await Promise.all([
      runAuroraQuery(`
        SELECT
          COALESCE(SUM(daily_sends), 0) as total_sends,
          COALESCE(SUM(daily_delivered), 0) as total_delivered,
          COALESCE(SUM(daily_cost), 0) as total_cost,
          COUNT(DISTINCT date) as days_with_data,
          COUNT(DISTINCT domain) as active_clients
        FROM dm_volume_summary
        WHERE date >= '${Q2_START}' AND date <= '${Q2_END}'
          AND (mail_class = 'all' OR mail_class IS NULL)
          AND ${domainFilter(domain)}
      `),
      // Use dm_client_funnel for lifetime_sends (corrected source of truth)
      // instead of MAX(cumulative_sends) which includes inflated historical rows
      runAuroraQuery(`
        SELECT
          vs.domain,
          vs.campaign_type,
          SUM(vs.daily_sends) as total_sends,
          COALESCE(cf.total_sends, 0) as lifetime_sends
        FROM dm_volume_summary vs
        LEFT JOIN (
          SELECT f.domain, f.total_sends
          FROM dm_client_funnel f
          INNER JOIN (SELECT domain, MAX(date) as md FROM dm_client_funnel GROUP BY domain) fl
            ON f.domain = fl.domain AND f.date = fl.md
        ) cf ON vs.domain = cf.domain
        WHERE vs.date >= '${Q2_START}' AND vs.date <= '${Q2_END}'
          AND (vs.mail_class = 'all' OR vs.mail_class IS NULL)
          AND ${domainFilter(domain).replace(/domain /g, 'vs.domain ')}
        GROUP BY vs.domain, vs.campaign_type, cf.total_sends
        ORDER BY total_sends DESC
      `),
    ]);
  } else {
    // Fallback: rr_daily_metrics (available since Apr 3, has Q2 data)
    [summaryRows, clientRows] = await Promise.all([
      runAuroraQuery(`
        SELECT
          COALESCE(SUM(sends_total), 0) as total_sends,
          0 as total_delivered,
          COALESCE(SUM(cost_total), 0) as total_cost,
          COUNT(DISTINCT date) as days_with_data,
          COUNT(DISTINCT domain) as active_clients
        FROM rr_daily_metrics
        WHERE date >= '${Q2_START}' AND date <= '${Q2_END}'
          AND ${domainFilter(domain)}
      `),
      runAuroraQuery(`
        SELECT
          domain,
          campaign_type,
          SUM(sends_total) as total_sends,
          0 as lifetime_sends
        FROM rr_daily_metrics
        WHERE date >= '${Q2_START}' AND date <= '${Q2_END}'
          AND ${domainFilter(domain)}
        GROUP BY domain, campaign_type
        ORDER BY total_sends DESC
      `),
    ]);
  }

  const summary = summaryRows[0] || {};
  const currentSends = Number(summary.total_sends || 0);
  const deliveredCount = Number(summary.total_delivered || 0);
  const totalCost = Number(summary.total_cost || 0);
  const activeClients = Number(summary.active_clients || 0);

  // Calculate elapsed and remaining days in Q2
  const now = new Date();
  const q2Start = new Date(Q2_START);
  const q2End = new Date(Q2_END);
  const effectiveNow = now > q2End ? q2End : now < q2Start ? q2Start : now;
  const daysElapsed = Math.max(1, Math.floor((effectiveNow.getTime() - q2Start.getTime()) / 86400000));
  const totalQ2Days = Math.floor((q2End.getTime() - q2Start.getTime()) / 86400000);
  const daysRemaining = Math.max(0, totalQ2Days - daysElapsed);

  const progressPercent = Q2_TARGET > 0 ? Number(((currentSends / Q2_TARGET) * 100).toFixed(1)) : 0;
  const weeksElapsed = Math.max(1, daysElapsed / 7);
  const weeksRemaining = Math.max(0.1, daysRemaining / 7);
  const weeklyPace = Math.round(currentSends / weeksElapsed);
  const remaining = Q2_TARGET - currentSends;
  const requiredWeeklyPace = remaining > 0 ? Math.round(remaining / weeksRemaining) : 0;

  const clientBreakdown: RrQ2GoalClientRow[] = clientRows.map((r: Record<string, unknown>) => ({
    domain: String(r.domain || ''),
    campaignType: String(r.campaign_type || 'rr'),
    totalSends: Number(r.total_sends || 0),
    lifetimeSends: Number(r.lifetime_sends || 0),
  }));

  const data: RrQ2Goal = {
    target: Q2_TARGET,
    currentSends,
    deliveredCount,
    totalCost,
    daysElapsed,
    daysRemaining,
    activeClients,
    progressPercent,
    weeklyPace,
    requiredWeeklyPace,
    onTrack: weeklyPace >= requiredWeeklyPace,
    clientBreakdown,
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// Domain List
// ---------------------------------------------------------------------------

async function getDomainList() {
  const cacheKey = 'rapid-response:domain-list';
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Pull unique domains from all three tables for a comprehensive list
  const rows = await runAuroraQuery(`
    SELECT DISTINCT domain FROM (
      SELECT DISTINCT domain FROM rr_campaign_snapshots WHERE ${EXCLUDE_SEED}
      UNION
      SELECT DISTINCT domain FROM rr_daily_metrics WHERE ${EXCLUDE_SEED}
      UNION
      SELECT DISTINCT domain FROM rr_pcm_alignment WHERE ${EXCLUDE_SEED}
    ) all_domains
    ORDER BY domain ASC
  `);

  const data = rows.map((r: Record<string, unknown>) => String(r.domain || ''));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// System Status
// ---------------------------------------------------------------------------

function computeSystemStatus(
  totalCampaigns: number,
  pulse: RrOperationalPulse,
  quality: RrQualityMetrics,
  pcm: RrPcmHealth,
  lastSyncAt: string | null
): RrSystemStatus {
  // No data yet
  if (totalCampaigns === 0) {
    return {
      level: 'awaiting-data',
      headline: 'Awaiting data',
      detail: 'Rapid Response data sync has not started yet. Metrics will appear once the hourly sync begins populating data.',
      lastSyncAt,
    };
  }

  // Critical: broken PCM pipeline or zero sends with active campaigns
  if (pcm.staleSentCount > 0 || pcm.backOfficeSyncGap > 0) {
    return {
      level: 'critical',
      headline: 'Critical issues detected',
      detail: pcm.staleSentCount > 0
        ? `${pcm.staleSentCount} mailings stuck in sent status for ${pcm.oldestStaleDays}+ days — PCM pipeline may be broken.`
        : `${pcm.backOfficeSyncGap} orders missing from back-office bridge — status updates will be lost.`,
      lastSyncAt,
    };
  }

  if (pulse.activeCampaigns > 0 && pulse.sendsToday === 0) {
    return {
      level: 'critical',
      headline: 'No sends today',
      detail: `${pulse.activeCampaigns} campaigns are active but no sends have been recorded today.`,
      lastSyncAt,
    };
  }

  if (pcm.orphanedOrdersCount > 0) {
    return {
      level: 'critical',
      headline: 'Orphaned orders found',
      detail: `${pcm.orphanedOrdersCount} mailings sent without a PCM order ID — API submission may have failed.`,
      lastSyncAt,
    };
  }

  // Warning: declining quality metrics
  if (quality.deliveryRate30d < 70 || quality.pcmSubmissionRate < 95 || pulse.totalOnHold > 0) {
    const issues: string[] = [];
    if (quality.deliveryRate30d < 70) issues.push(`delivery rate at ${quality.deliveryRate30d}%`);
    if (quality.pcmSubmissionRate < 95) issues.push(`PCM submission rate at ${quality.pcmSubmissionRate}%`);
    if (pulse.totalOnHold > 0) issues.push(`${pulse.totalOnHold} mailings on hold`);
    return {
      level: 'warning',
      headline: 'Needs attention',
      detail: issues.join(', ') + '.',
      lastSyncAt,
    };
  }

  // Healthy
  return {
    level: 'healthy',
    headline: 'Operating normally',
    detail: `${pulse.activeCampaigns} active campaigns, ${pulse.sendsToday} sends today, ${quality.deliveryRate30d}% delivery rate.`,
    lastSyncAt,
  };
}
