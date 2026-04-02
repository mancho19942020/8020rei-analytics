/**
 * Rapid Response Metrics — Next.js API Route
 *
 * Queries Aurora's rr_campaign_snapshots, rr_daily_metrics, rr_pcm_alignment tables.
 * Supports: overview, daily-trend, campaign-list, pcm-alignment, alerts, cost-trend
 *
 * Mirrors the pattern from /api/properties-api/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
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
  SystemHealthLevel,
} from '@/types/rapid-response';

// Exclude seed/test domains from production queries
const EXCLUDED_DOMAINS = "'8020rei_demo', '8020rei_migracion_test'";
const DOMAIN_FILTER = `domain NOT IN (${EXCLUDED_DOMAINS})`;

export async function GET(request: NextRequest) {
  if (!isAuroraConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Aurora data source is not configured' },
      { status: 503 }
    );
  }

  const params = request.nextUrl.searchParams;
  const type = params.get('type') || 'overview';
  const days = parseInt(params.get('days') || '30');

  try {
    switch (type) {
      case 'overview':
        return await getOverview(days);
      case 'daily-trend':
        return await getDailyTrend(days);
      case 'campaign-list':
        return await getCampaignList();
      case 'pcm-alignment':
        return await getPcmAlignment();
      case 'alerts':
        return await getAlerts(days);
      case 'cost-trend':
        return await getCostTrend(days);
      case 'status-breakdown':
        return await getStatusBreakdown(days);
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

async function getOverview(days: number) {
  const cacheKey = `rapid-response:overview:${days}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Run all three pillar queries in parallel
  const [pulseRows, qualityRows, pcmRows] = await Promise.all([
    // Operational Pulse: latest snapshot per campaign
    runAuroraQuery(`
      SELECT DISTINCT ON (campaign_id)
        campaign_id, campaign_name, domain, campaign_type, status,
        total_sent, total_delivered, last_sent_date,
        on_hold_count, follow_up_pending_count, snapshot_at
      FROM rr_campaign_snapshots
      WHERE ${DOMAIN_FILTER}
      ORDER BY campaign_id, snapshot_at DESC
    `),

    // Quality Metrics: aggregated daily metrics for last N days
    runAuroraQuery(`
      SELECT
        COALESCE(SUM(sends_total), 0) as sends_total,
        COALESCE(SUM(sends_success), 0) as sends_success,
        COALESCE(SUM(sends_error), 0) as sends_error,
        COALESCE(SUM(delivered_count), 0) as delivered_count,
        COALESCE(AVG(pcm_submission_rate), 0) as avg_pcm_rate,
        COALESCE(AVG(delivery_rate_30d), 0) as avg_delivery_rate
      FROM rr_daily_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
        AND ${DOMAIN_FILTER}
    `),

    // PCM Health: latest alignment check
    runAuroraQuery(`
      SELECT *
      FROM rr_pcm_alignment
      WHERE ${DOMAIN_FILTER}
      ORDER BY checked_at DESC
      LIMIT 1
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
    WHERE date = CURRENT_DATE AND ${DOMAIN_FILTER}
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
  const q = qualityRows[0] || {};
  const sendsTotal = Number(q.sends_total || 0);
  const sendsError = Number(q.sends_error || 0);
  const qualityMetrics: RrQualityMetrics = {
    deliveryRate30d: Number(Number(q.avg_delivery_rate || 0).toFixed(1)),
    pcmSubmissionRate: Number(Number(q.avg_pcm_rate || 0).toFixed(1)),
    errorRate: sendsTotal > 0 ? Number(((sendsError / sendsTotal) * 100).toFixed(1)) : 0,
    sendsTotal7d: sendsTotal,
    deliveredTotal7d: Number(q.delivered_count || 0),
  };

  // Compute PCM Health
  const p = pcmRows[0] || {};
  const pcmHealth: RrPcmHealth = {
    staleSentCount: Number(p.stale_sent_count || 0),
    orphanedOrdersCount: Number(p.orphaned_orders_count || 0),
    oldestStaleDays: Number(p.oldest_stale_days || 0),
    deliveryLagMedianDays: Number(Number(p.delivery_lag_median_days || 0).toFixed(1)),
    backOfficeSyncGap: Number(p.back_office_sync_gap || 0),
    undeliverableRate7d: Number(Number(p.undeliverable_rate_7d || 0).toFixed(1)),
  };

  // Compute System Status (verdict banner)
  const systemStatus = computeSystemStatus(
    pulseRows.length,
    operationalPulse,
    qualityMetrics,
    pcmHealth,
    p.checked_at ? String(p.checked_at) : null
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

async function getDailyTrend(days: number) {
  const cacheKey = `rapid-response:daily-trend:${days}`;
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
      AND ${DOMAIN_FILTER}
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

async function getCampaignList() {
  const cacheKey = 'rapid-response:campaign-list';
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT DISTINCT ON (campaign_id)
      campaign_id, campaign_name, domain, campaign_type, status,
      total_sent, total_delivered, last_sent_date,
      letters_delivered_30d, postcards_delivered_30d,
      on_hold_count, follow_up_pending_count,
      smartdrop_authorization_status, snapshot_at
    FROM rr_campaign_snapshots
    WHERE ${DOMAIN_FILTER}
    ORDER BY campaign_id, snapshot_at DESC
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

async function getPcmAlignment() {
  const cacheKey = 'rapid-response:pcm-alignment';
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
    WHERE ${DOMAIN_FILTER}
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

async function getStatusBreakdown(days: number) {
  const cacheKey = `rapid-response:status-breakdown:${days}`;
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
      AND ${DOMAIN_FILTER}
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

async function getCostTrend(days: number) {
  const cacheKey = `rapid-response:cost-trend:${days}`;
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
      AND ${DOMAIN_FILTER}
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

async function getAlerts(days: number) {
  const cacheKey = `rapid-response:alerts:${days}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Fetch the data needed for alert evaluation
  const [pulseRows, qualityRows, pcmRows, todayRows] = await Promise.all([
    runAuroraQuery(`
      SELECT DISTINCT ON (campaign_id)
        campaign_id, status, on_hold_count, snapshot_at
      FROM rr_campaign_snapshots
      WHERE ${DOMAIN_FILTER}
      ORDER BY campaign_id, snapshot_at DESC
    `),
    runAuroraQuery(`
      SELECT
        COALESCE(SUM(sends_total), 0) as sends_total,
        COALESCE(SUM(sends_error), 0) as sends_error,
        COALESCE(AVG(delivery_rate_30d), 0) as avg_delivery_rate,
        COALESCE(AVG(pcm_submission_rate), 0) as avg_pcm_rate
      FROM rr_daily_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
        AND ${DOMAIN_FILTER}
    `),
    runAuroraQuery(`
      SELECT * FROM rr_pcm_alignment
      WHERE ${DOMAIN_FILTER}
      ORDER BY checked_at DESC LIMIT 1
    `),
    runAuroraQuery(`
      SELECT COALESCE(SUM(sends_total), 0) as sends_today
      FROM rr_daily_metrics
      WHERE date = CURRENT_DATE AND ${DOMAIN_FILTER}
    `),
  ]);

  const alerts: RrAlert[] = [];
  const now = new Date().toISOString();

  const activeCampaigns = pulseRows.filter((r: Record<string, unknown>) => r.status === 'active').length;
  const sendsToday = Number(todayRows[0]?.sends_today || 0);
  const q = qualityRows[0] || {};
  const p = pcmRows[0] || {};

  // RR1: No sends detected
  if (activeCampaigns > 0 && sendsToday === 0) {
    alerts.push({
      id: 'rr-no-sends',
      name: 'No sends detected',
      severity: 'critical',
      category: 'rapid-response',
      description: `${activeCampaigns} campaigns are active but zero sends have been recorded today. The dispatch system may be stopped.`,
      metrics: { current: sendsToday, baseline: activeCampaigns },
      detected_at: now,
      action: 'Check the dispatch job logs and verify the cron is running on the backoffice server.',
      link: '/features/features-rei/rapid-response',
    });
  }

  // RR2: PCM pipeline stale
  const staleSentCount = Number(p.stale_sent_count || 0);
  if (staleSentCount > 0) {
    alerts.push({
      id: 'rr-pcm-stale',
      name: 'PCM pipeline stale',
      severity: 'critical',
      category: 'rapid-response',
      description: `${staleSentCount} mailings have been stuck in "sent" status for 14+ days. The PCM status pipeline may be broken — the back-office middleman might not be forwarding updates.`,
      metrics: { current: staleSentCount },
      detected_at: now,
      action: 'Investigate the back-office PCM bridge. Check if the middleman server is receiving and forwarding status updates from PCM.',
      link: '/features/features-rei/rapid-response',
    });
  }

  // RR3: Orphaned orders
  const orphanedOrders = Number(p.orphaned_orders_count || 0);
  if (orphanedOrders > 0) {
    alerts.push({
      id: 'rr-orphaned-orders',
      name: 'Orphaned orders',
      severity: 'critical',
      category: 'rapid-response',
      description: `${orphanedOrders} mailings were marked as "sent" but have no PCM order ID. The API submission to PCM may have partially failed.`,
      metrics: { current: orphanedOrders },
      detected_at: now,
      action: 'Check recent PCM API responses for errors. These orders need to be resubmitted or manually reconciled.',
      link: '/features/features-rei/rapid-response',
    });
  }

  // RR4: Back-office sync gap
  const syncGap = Number(p.back_office_sync_gap || 0);
  if (syncGap > 0) {
    alerts.push({
      id: 'rr-sync-gap',
      name: 'Back-office sync gap',
      severity: 'critical',
      category: 'rapid-response',
      description: `${syncGap} orders that PCM accepted are missing from the back-office bridge table. Status updates for these orders WILL be lost.`,
      metrics: { current: syncGap },
      detected_at: now,
      action: 'Verify the back-office bridge table is being populated correctly. These specific orders need manual bridge entries.',
      link: '/features/features-rei/rapid-response',
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
      description: `The 30-day delivery rate is ${deliveryRate.toFixed(1)}%, below the 70% threshold. This may indicate address quality issues or PCM delays.`,
      metrics: { current: deliveryRate, baseline: 70 },
      detected_at: now,
      action: 'Review undeliverable addresses and PCM rejection reasons. Consider enabling address validation for new sends.',
      link: '/features/features-rei/rapid-response',
    });
  }

  // RR6: On-hold mailings
  const totalOnHold = pulseRows.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.on_hold_count || 0), 0);
  if (totalOnHold > 0) {
    alerts.push({
      id: 'rr-on-hold',
      name: 'Mailings on hold',
      severity: 'warning',
      category: 'rapid-response',
      description: `${totalOnHold} mailings are currently on hold due to insufficient account balance. These campaigns are blocked from sending.`,
      metrics: { current: totalOnHold },
      detected_at: now,
      action: 'Check client account balances. Notify account managers for affected domains.',
      link: '/features/features-rei/rapid-response',
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
      link: '/features/features-rei/rapid-response',
    });
  }

  // RR8: Delivery lag high
  const deliveryLag = Number(p.delivery_lag_median_days || 0);
  if (deliveryLag > 10) {
    alerts.push({
      id: 'rr-delivery-lag',
      name: 'Delivery lag above normal',
      severity: 'info',
      category: 'rapid-response',
      description: `Median delivery time is ${deliveryLag.toFixed(1)} days, above the 10-day threshold. This may indicate USPS delays or PCM processing backlogs.`,
      metrics: { current: deliveryLag, baseline: 10 },
      detected_at: now,
      action: 'Monitor PCM vendor status distribution for processing bottlenecks. This may resolve naturally.',
      link: '/features/features-rei/rapid-response',
    });
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
