/**
 * Rapid Response Metrics — Next.js API Route
 *
 * Queries Aurora's rr_campaign_snapshots, rr_daily_metrics, rr_pcm_alignment tables.
 * Supports: overview, daily-trend, campaign-list, pcm-alignment, alerts, status-breakdown, q2-goal
 *
 * Mirrors the pattern from /api/properties-api/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
import { readCache as readOverviewCache, getCachedPcmOrdersSlim } from '@/app/api/dm-overview/compute';
// Test-domain exclusion — canonical source. Any change applies everywhere simultaneously.
import { TEST_DOMAINS_SQL as SEED_DOMAINS, EXCLUDE_TEST_DOMAINS_SQL as EXCLUDE_SEED } from '@/lib/domain-filter';
// On-hold stale/fresh helper — single source of truth shared with slack-alerts
import {
  queryOnHoldAges,
  ON_HOLD_STALE_THRESHOLD_DAYS,
  type OnHoldCampaignRow,
} from '@/lib/on-hold-ages';
// Campaign lifecycle (currentStatus + stoppedAt) — shared with Business Results
// → Client Performance so both widgets agree on "who stopped and when".
import {
  queryCampaignLifecycles,
  indexLifecyclesByCampaignKey,
  lifecycleKey,
} from '@/lib/campaign-lifecycle';
import type {
  RrSystemStatus,
  RrOperationalPulse,
  RrQualityMetrics,
  RrPcmHealth,
  RrDailyMetric,
  RrCampaignSnapshot,
  RrAlert,
  RrStatusBreakdown,
  RrQ2Goal,
  RrQ2GoalClientRow,
} from '@/types/rapid-response';

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
      case 'status-breakdown':
        return await getStatusBreakdown(days, domain);
      case 'domain-list':
        return await getDomainList();
      case 'q2-goal':
        return await getQ2Goal(domain);
      case 'integration-summary':
        return await getIntegrationSummary();
      case 'on-hold-breakdown':
        return await getOnHoldBreakdown(domain);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    // Full error (including any Postgres / SQL detail) stays in the server log.
    // We return a generic message to the client so stakeholders never see raw
    // traces or error codes — that's a trust-killer for the dashboard.
    console.error(`[Rapid Response] Error fetching ${type}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Unable to load ${type}. Please retry.`,
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

    // Quality Metrics: aggregated daily metrics for the selected period.
    // Filtered to campaign_type='rr' so the Operational Health "Is it working?"
    // pill represents Rapid Response health only. SmartDrop health, once
    // live tenants exist, will get its own dedicated surface (tracked as a
    // future DM-wide or per-type visualization) rather than silently blending
    // into this RR-labelled widget.
    runAuroraQuery(`
      SELECT
        COALESCE(SUM(sends_total), 0) as sends_total,
        COALESCE(SUM(sends_success), 0) as sends_success,
        COALESCE(SUM(sends_error), 0) as sends_error,
        COALESCE(SUM(delivered_count), 0) as delivered_count
      FROM rr_daily_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      AND campaign_type = 'rr'
      AND ${domainFilter(domain)}
    `),

    // PCM Health: latest per-domain alignment check, scoped to the CANONICAL
    // active-domains set (domains with a row in dm_client_funnel — the same 18
    // clients used by every other widget). Previously this pulled every domain
    // ever alignment-checked (170+ historical / inactive / dead entries),
    // which made the widget read "160/170 synced" and contradicted the 18/18
    // domain parity the audit reports everywhere else.
    runAuroraQuery(`
      SELECT DISTINCT ON (a.domain)
        a.domain, a.stale_sent_count, a.orphaned_orders_count, a.oldest_stale_days,
        a.delivery_lag_median_days, a.back_office_sync_gap, a.checked_at
      FROM rr_pcm_alignment a
      INNER JOIN (
        SELECT DISTINCT domain FROM dm_client_funnel
        WHERE domain IS NOT NULL AND domain NOT IN (${SEED_DOMAINS})
      ) canonical ON a.domain = canonical.domain
      WHERE a.domain NOT IN (${SEED_DOMAINS})
        AND a.checked_at >= CURRENT_DATE - INTERVAL '${days} days'
        ${domain ? `AND a.domain = '${domain.replace(/[^a-zA-Z0-9_.]/g, '')}'` : ''}
      ORDER BY a.domain, a.checked_at DESC
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

  // Stale vs fresh split — same source as Campaigns table + slack alert + future
  // on-hold breakdown. The sum of stale + fresh must equal totalOnHold above;
  // any delta is a data discrepancy that should surface in the diagnostic.
  const onHoldAges = await queryOnHoldAges(domain);

  // Find sends today + month-to-date from daily metrics
  const [todayRows, monthRows] = await Promise.all([
    runAuroraQuery(`
      SELECT COALESCE(SUM(sends_total), 0) as sends_today
      FROM rr_daily_metrics
      WHERE date = CURRENT_DATE AND ${domainFilter(domain)}
    `),
    runAuroraQuery(`
      SELECT COALESCE(SUM(sends_total), 0) as sends_month
      FROM rr_daily_metrics
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE) AND ${domainFilter(domain)}
    `),
  ]);
  const sendsToday = Number(todayRows[0]?.sends_today || 0);
  const sendsThisMonth = Number(monthRows[0]?.sends_month || 0);

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
    sendsThisMonth,
    lastSendTime: lastSendDates[0] ? String(lastSendDates[0]) : null,
    totalOnHold,
    staleOnHold: onHoldAges.staleOnHold,
    freshOnHold: onHoldAges.freshOnHold,
    staleCampaigns: onHoldAges.staleCampaigns,
    oldestOnHoldDays: onHoldAges.oldestAgeDays,
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

  // Cross-tab consistency: when no domain filter is applied, pull the PCM-authoritative
  // lifetime piece count from dm_overview_cache.headline. This is the SAME number the
  // Overview tab's "Lifetime pieces" card shows — guaranteed match by construction.
  // Aurora (funnelTotalSends) is surfaced as a visible delta, never hidden, per the
  // dual-source principle established 2026-04-17.
  let lifetimePiecesPcm: number | null = null;
  let piecesDelta: number | null = null;
  let piecesDeltaPct: number | null = null;
  if (!domain) {
    try {
      const headlineCache = await readOverviewCache<{
        lifetimePieces: { pcm: number; aurora: number; delta: number; deltaPct: number };
      }>('headline');
      if (headlineCache?.data?.lifetimePieces) {
        lifetimePiecesPcm = headlineCache.data.lifetimePieces.pcm;
        // Recompute delta against our Aurora number (authoritative for this widget's
        // context) rather than reusing the cache's aurora field, in case the caches
        // are a few minutes apart.
        piecesDelta = funnelTotalSends - lifetimePiecesPcm;
        piecesDeltaPct = lifetimePiecesPcm > 0
          ? Number(((piecesDelta / lifetimePiecesPcm) * 100).toFixed(2))
          : 0;
      }
    } catch (e) {
      // Cache miss is non-fatal — widget will fall back to Aurora-only display.
      console.warn('[rapid-response] overview cache read failed:', e instanceof Error ? e.message : String(e));
    }
  }

  const qualityMetrics: RrQualityMetrics = {
    deliveryRate30d: funnelTotalSends > 0
      ? Number(((funnelTotalDelivered / funnelTotalSends) * 100).toFixed(1))
      : 0,
    lifetimeSent: funnelTotalSends,
    lifetimeDelivered: funnelTotalDelivered,
    lifetimePiecesPcm,
    piecesDelta,
    piecesDeltaPct,
    pcmSubmissionRate: 0, // deprecated — widget now uses lifetimeSent/lifetimeDelivered
    errorRate: sendsTotal > 0 ? Number(((sendsError / sendsTotal) * 100).toFixed(1)) : 0,
    sendsTotal7d: sendsTotal,
    deliveredTotal7d: deliveredCount,
  };

  // Compute PCM Health (aggregated across all domains) with domain-level counts.
  //
  // Threshold rationale (2026-04-17): a domain is counted as "out of sync" only
  // when its gap exceeds what our alert system considers noise. The alerts
  // module fires at sync_gap > 50 (warning) and > 200 (critical); anything
  // below 50 is normal pipeline lag (PCM updates in real-time, Aurora sync is
  // periodic). Previously ANY non-zero gap counted as out-of-sync, which made
  // the widget read "8 of 18 synced" when in reality only a handful had
  // meaningful gaps. Same thresholding for stale + orphaned: zero = healthy,
  // small = noise, large = actionable.
  const SYNC_GAP_THRESHOLD = 50;
  const STALE_THRESHOLD = 10;
  const ORPHAN_THRESHOLD = 5;

  // Set of domains with ≥1 status='active' campaign right now — used to mark
  // flagged domains as active (priority) vs legacy (cleanup). Active domains
  // matter more because active campaigns are currently sending mail.
  const activeDomainSet = new Set<string>();
  for (const r of pulseRows as Record<string, unknown>[]) {
    if (r.status === 'active') activeDomainSet.add(String(r.domain || ''));
  }

  // Per-domain issue lists — sorted worst-first so the user can name-and-shame
  // the specific clients responsible. An aggregate "2 need attention" without
  // names isn't actionable; these arrays feed the widget tooltips.
  const gapDomains = (pcmRows as Record<string, unknown>[])
    .filter(r => Number(r.back_office_sync_gap || 0) >= SYNC_GAP_THRESHOLD)
    .map(r => ({
      domain: String(r.domain || ''),
      value: Math.max(0, Number(r.back_office_sync_gap || 0)),
      isActive: activeDomainSet.has(String(r.domain || '')),
    }))
    .sort((a, b) => b.value - a.value);

  const staleDomains = (pcmRows as Record<string, unknown>[])
    .filter(r => Number(r.stale_sent_count || 0) >= STALE_THRESHOLD)
    .map(r => ({
      domain: String(r.domain || ''),
      value: Number(r.stale_sent_count || 0),
      detail: Number(r.oldest_stale_days || 0) > 0
        ? `oldest: ${Number(r.oldest_stale_days)}d`
        : undefined,
      isActive: activeDomainSet.has(String(r.domain || '')),
    }))
    .sort((a, b) => b.value - a.value);

  const orphanedDomains = (pcmRows as Record<string, unknown>[])
    .filter(r => Number(r.orphaned_orders_count || 0) >= ORPHAN_THRESHOLD)
    .map(r => ({
      domain: String(r.domain || ''),
      value: Number(r.orphaned_orders_count || 0),
      isActive: activeDomainSet.has(String(r.domain || '')),
    }))
    .sort((a, b) => b.value - a.value);

  const domainsWithGaps = gapDomains.length;
  const domainsWithStale = staleDomains.length;
  const domainsWithOrphaned = orphanedDomains.length;

  const pcmHealth: RrPcmHealth = {
    staleSentCount: pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.stale_sent_count || 0), 0),
    orphanedOrdersCount: pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.orphaned_orders_count || 0), 0),
    oldestStaleDays: pcmRows.reduce((m: number, r: Record<string, unknown>) => Math.max(m, Number(r.oldest_stale_days || 0)), 0),
    deliveryLagMedianDays: pcmRows.length > 0
      ? Number((pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.delivery_lag_median_days || 0), 0) / pcmRows.length).toFixed(1))
      : 0,
    backOfficeSyncGap: pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Math.max(0, Number(r.back_office_sync_gap || 0)), 0),
    undeliverableRate7d: pcmRows.length > 0
      ? Number((pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.undeliverable_rate_7d || 0), 0) / pcmRows.length).toFixed(1))
      : 0,
    totalDomains: pcmRows.length,
    syncedDomains: pcmRows.length - domainsWithGaps,
    domainsWithGaps,
    domainsWithStale,
    domainsWithOrphaned,
    gapDomains,
    staleDomains,
    orphanedDomains,
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

async function getCampaignList(_days: number, domain?: string) {
  // Return the full historical portfolio (one row per campaign_id, latest snapshot)
  // so the table's row count always matches the "Is it running?" pill. Period
  // filtering happens client-side via the `last_sent_date` / `status` columns.
  const cacheKey = `rapid-response:campaign-list:all:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Run three queries in parallel:
  //   1. per-campaign latest snapshot (the rows themselves)
  //   2. on-hold age-bucket via queryOnHoldAges (fresh / stale Nd badge)
  //   3. lifecycle (currentStatus + stoppedAt) via queryCampaignLifecycles —
  //      shared helper so the client-performance widget shows the same dates.
  const [rows, ages, lifecycles] = await Promise.all([
    runAuroraQuery(`
      SELECT DISTINCT ON (domain, campaign_id)
        campaign_id, campaign_name, domain, campaign_type, status,
        total_sent, total_delivered, last_sent_date,
        letters_delivered_30d, postcards_delivered_30d,
        on_hold_count, follow_up_pending_count,
        smartdrop_authorization_status, snapshot_at
      FROM rr_campaign_snapshots
      WHERE ${domainFilter(domain)}
      ORDER BY domain, campaign_id, snapshot_at DESC
    `),
    queryOnHoldAges(domain),
    queryCampaignLifecycles(domain),
  ]);

  const ageIndex = new Map<string, OnHoldCampaignRow>();
  for (const c of ages.perCampaign) {
    ageIndex.set(`${c.domain}::${String(c.campaignId)}`, c);
  }

  const lifecycleIndex = indexLifecyclesByCampaignKey(lifecycles);

  const data: RrCampaignSnapshot[] = rows.map((r: Record<string, unknown>) => {
    const onHold = Number(r.on_hold_count || 0);
    const ageRow = onHold > 0
      ? ageIndex.get(`${String(r.domain || '')}::${String(r.campaign_id || '')}`)
      : undefined;
    const lifecycle = lifecycleIndex.get(lifecycleKey(String(r.domain || ''), String(r.campaign_id || '')));
    return {
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
      onHoldCount: onHold,
      followUpPendingCount: Number(r.follow_up_pending_count || 0),
      smartdropAuthorizationStatus: r.smartdrop_authorization_status ? String(r.smartdrop_authorization_status) : null,
      snapshotAt: String(r.snapshot_at || ''),
      daysSinceFirstHold: ageRow?.daysSinceFirstHold ?? null,
      onHoldAgeBucket: ageRow?.ageBucket ?? null,
      stoppedAt: lifecycle?.stoppedAt ?? null,
      stoppedAtSource: lifecycle?.stoppedAtSource ?? null,
    };
  });

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
    backOfficeSyncGap: Math.max(0, Number(r.back_office_sync_gap || 0)),
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

  // Filtered to campaign_type='rr' so the Operational Health status breakdown
  // donut (delivered/on-hold/protected/undeliverable/error) represents Rapid
  // Response only — preserves pre-SmartDrop meaning. SmartDrop status
  // distribution, once live, will get its own surface.
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
      AND campaign_type = 'rr'
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
    // Filtered to campaign_type='rr' so alert thresholds (delivery rate,
    // error rate, PCM submission rate) fire on Rapid Response degradation
    // only — we don't want a SmartDrop quality dip to raise an alert labeled
    // against RR. SmartDrop-specific alerting will be added separately.
    runAuroraQuery(`
      SELECT
        COALESCE(SUM(sends_total), 0) as sends_total,
        COALESCE(SUM(sends_error), 0) as sends_error,
        COALESCE(AVG(delivery_rate_30d), 0) as avg_delivery_rate,
        COALESCE(AVG(pcm_submission_rate), 0) as avg_pcm_rate
      FROM rr_daily_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      AND campaign_type = 'rr'
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
    // Filtered to campaign_type='rr' — the in-app "No sends today" alert mirrors
    // the Slack digest version; both must agree. SmartDrop volume must not
    // mask an RR dispatch failure.
    runAuroraQuery(`
      SELECT COALESCE(SUM(sends_total), 0) as sends_today
      FROM rr_daily_metrics
      WHERE date = CURRENT_DATE
        AND campaign_type = 'rr'
        AND ${domainFilter(domain)}
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
  const totalSyncGap = pcmRows.reduce((s: number, r: Record<string, unknown>) => s + Math.max(0, Number(r.back_office_sync_gap || 0)), 0);

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
  // Threshold: warning at >10, critical at >50 (avoids noise from 1-2 ancient stale items)
  if (totalStale > 10) {
    const staleBreakdown = pcmRows
      .filter((r: Record<string, unknown>) => Number(r.stale_sent_count || 0) > 0)
      .map((r: Record<string, unknown>) => `${String(r.domain || 'unknown')}: ${r.stale_sent_count} stale (oldest: ${r.oldest_stale_days}d)`)
      .join('; ');

    alerts.push({
      id: 'rr-pcm-stale',
      name: 'PCM pipeline stale',
      severity: totalStale > 50 ? 'critical' : 'warning',
      category: 'rapid-response',
      description: `${totalStale} mailings stuck in "sent" for 14+ days across ${pcmRows.filter((r: Record<string, unknown>) => Number(r.stale_sent_count || 0) > 0).length} domain(s) — PCM pipeline may be broken. Breakdown: ${staleBreakdown}.`,
      entity: affectedDomains(pcmRows, 'stale_sent_count').replace(' Affected: ', '').replace('.', ''),
      metrics: { current: totalStale },
      detected_at: now,
      action: 'Investigate the back-office PCM bridge for each affected client. Check if status updates from PCM are being received and forwarded correctly.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // RR3: Orphaned orders — per-domain breakdown
  // Threshold: warning at >5, critical at >20 (a few orphans can be transient API blips)
  if (totalOrphaned > 5) {
    const orphanBreakdown = pcmRows
      .filter((r: Record<string, unknown>) => Number(r.orphaned_orders_count || 0) > 0)
      .map((r: Record<string, unknown>) => `${String(r.domain || 'unknown')}: ${r.orphaned_orders_count} orphaned`)
      .join('; ');

    alerts.push({
      id: 'rr-orphaned-orders',
      name: 'Orphaned orders',
      severity: totalOrphaned > 20 ? 'critical' : 'warning',
      category: 'rapid-response',
      description: `${totalOrphaned} mailings sent without a PCM order ID across ${pcmRows.filter((r: Record<string, unknown>) => Number(r.orphaned_orders_count || 0) > 0).length} domain(s) — these orders cannot be tracked. Breakdown: ${orphanBreakdown}.`,
      entity: affectedDomains(pcmRows, 'orphaned_orders_count').replace(' Affected: ', '').replace('.', ''),
      metrics: { current: totalOrphaned },
      detected_at: now,
      action: 'Check recent PCM API responses for each affected client. Look for API timeouts or rejection patterns that prevented order IDs from being stored.',
      link: '/features/features-rei/dm-campaign/operational-health',
    });
  }

  // RR4: Back-office sync gap
  // Threshold: warning at >50, critical at >200 (small gaps can be normal pipeline lag)
  if (totalSyncGap > 50) {
    alerts.push({
      id: 'rr-sync-gap',
      name: 'Back-office sync gap',
      severity: totalSyncGap > 200 ? 'critical' : 'warning',
      category: 'rapid-response',
      description: `${totalSyncGap} orders missing from back-office bridge table across ${pcmRows.filter((r: Record<string, unknown>) => Number(r.back_office_sync_gap || 0) > 0).length} domain(s).${affectedDomains(pcmRows, 'back_office_sync_gap')}`,
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
//
// PREFERRED SOURCE: PCM /order (via the IN-MEMORY cache maintained by the
// dm-overview compute module). This endpoint NEVER triggers a fresh PCM
// pagination — pagination takes ~90s and would block the entire OH tab. If
// the cache is warm (populated by the 30-min /refresh cron or a recent
// Overview tab load), we filter it to Q2 for accurate numbers matching the
// Overview send-trend. If the cache is cold, we fall back to rr_daily_metrics
// immediately so OH still loads fast; the next cron cycle will warm the cache
// and subsequent Q2 renders will switch to PCM-sourced numbers.
// ---------------------------------------------------------------------------

const Q2_TARGET = 400_000;
const Q2_START = '2026-04-01';
const Q2_END = '2026-06-30';

// PCM invoice-verified pricing eras — matches dm-overview/compute.ts. Sum of
// era rates per piece gives us an accurate Q2 cost estimate without needing
// PCM's invoice endpoint.
function pcmEraRate(dateISO: string, mc: 'fc' | 'std'): number {
  if (dateISO <= '2025-06-27') return mc === 'fc' ? 0.94 : 0.74;
  if (dateISO <= '2025-10-31') return mc === 'fc' ? 1.14 : 0.93;
  return mc === 'fc' ? 0.87 : 0.63;
}

async function getQ2Goal(domain?: string): Promise<ReturnType<typeof NextResponse.json>> {
  const cacheKey = `rapid-response:q2-goal:${domain || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Sanitize domain (same pattern as domainFilter)
  const safeDomain = domain ? domain.replace(/[^a-zA-Z0-9_.]/g, '') : null;

  // Non-blocking: read the in-memory PCM cache maintained by the dm-overview
  // compute module. Returns null if cold — we don't wait on a ~90s pagination
  // here, the /refresh cron owns that. OH tab stays fast either way.
  let currentSends = 0;
  let totalCost = 0;
  const perDomain = new Map<string, { sends: number; cost: number }>();
  let pcmSucceeded = false;

  const cachedOrders = getCachedPcmOrdersSlim();
  if (cachedOrders && cachedOrders.length > 0) {
    pcmSucceeded = true;
    for (const o of cachedOrders) {
      if (o.canceled || o.isTestDomain) continue;
      if (!o.date || o.date < Q2_START || o.date > Q2_END) continue;
      if (safeDomain && o.domain !== safeDomain) continue;
      currentSends++;
      const rate = pcmEraRate(o.date, o.mailClass);
      totalCost += rate;
      const entry = perDomain.get(o.domain) || { sends: 0, cost: 0 };
      entry.sends++;
      entry.cost += rate;
      perDomain.set(o.domain, entry);
    }
  }

  // Lifetime sends per domain — from dm_client_funnel latest-per-domain
  // (same source as Profitability's margin summary → used here for the "Share
  // of lifetime" column in the Top contributors table).
  // NOTE: both `f` and the subquery `fl` expose a `domain` column; every
  // reference below MUST be explicitly qualified to avoid a 42702 ambiguous
  // column error.
  const domainSqlPart = domain
    ? `AND f.domain = '${domain.replace(/[^a-zA-Z0-9_.]/g, '')}'`
    : '';
  const lifetimeRows = await runAuroraQuery(`
    SELECT f.domain, f.total_sends
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT domain, MAX(date) as md
      FROM dm_client_funnel
      GROUP BY domain
    ) fl ON f.domain = fl.domain AND f.date = fl.md
    WHERE f.domain IS NOT NULL
      AND f.domain NOT IN (${SEED_DOMAINS})
      ${domainSqlPart}
  `);
  const lifetimeByDomain = new Map<string, number>();
  for (const r of lifetimeRows as Record<string, unknown>[]) {
    lifetimeByDomain.set(String(r.domain || ''), Number(r.total_sends || 0));
  }

  // Delivered in Q2 window — Aurora rr_daily_metrics (PCM /order doesn't expose
  // per-piece delivery status in this endpoint). Acceptable because this is a
  // period-specific number and rr_daily_metrics has the last 15 days, covering
  // most of Q2 so far.
  const deliveredRows = await runAuroraQuery(`
    SELECT COALESCE(SUM(delivered_count), 0) as delivered
    FROM rr_daily_metrics
    WHERE date >= '${Q2_START}' AND date <= '${Q2_END}'
      AND ${domainFilter(domain)}
  `);
  const deliveredCount = Number(deliveredRows[0]?.delivered || 0);

  // Fallback path: if PCM fetch returned nothing, use rr_daily_metrics for the
  // Q2 aggregate so the widget still renders with limited-history numbers.
  let clientRows: Record<string, unknown>[] = [];
  if (!pcmSucceeded) {
    const [rrSummary, rrClients] = await Promise.all([
      runAuroraQuery(`
        SELECT
          COALESCE(SUM(sends_total), 0) as total_sends,
          COALESCE(SUM(cost_total), 0) as total_cost
        FROM rr_daily_metrics
        WHERE date >= '${Q2_START}' AND date <= '${Q2_END}'
          AND ${domainFilter(domain)}
      `),
      runAuroraQuery(`
        SELECT
          domain,
          campaign_type,
          SUM(sends_total) as total_sends
        FROM rr_daily_metrics
        WHERE date >= '${Q2_START}' AND date <= '${Q2_END}'
          AND ${domainFilter(domain)}
        GROUP BY domain, campaign_type
        ORDER BY total_sends DESC
      `),
    ]);
    const s = rrSummary[0] || {};
    currentSends = Number(s.total_sends || 0);
    totalCost = Number(s.total_cost || 0);
    clientRows = rrClients as Record<string, unknown>[];
  } else {
    // Convert perDomain Map → clientRows shape expected below.
    clientRows = [...perDomain.entries()].map(([d, v]) => ({
      domain: d,
      campaign_type: 'rr',
      total_sends: v.sends,
    }));
  }

  const activeClients = pcmSucceeded ? perDomain.size : (clientRows.length);

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

  const clientBreakdown: RrQ2GoalClientRow[] = clientRows
    .map((r: Record<string, unknown>) => {
      const d = String(r.domain || '');
      return {
        domain: d,
        campaignType: String(r.campaign_type || 'rr'),
        totalSends: Number(r.total_sends || 0),
        // PCM path has no campaign-type split, so we look up lifetime from the
        // dm_client_funnel snapshot (authoritative pre-computed total).
        lifetimeSends: Number(r.lifetime_sends || lifetimeByDomain.get(d) || 0),
      };
    })
    .sort((a, b) => b.totalSends - a.totalSends);

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

// ---------------------------------------------------------------------------
// Integration Summary — lightweight KPIs for the Integration Status tab
// Same source as DM Campaign tab:
//   - active clients: rr_campaign_snapshots (latest status per campaign)
//   - letters last 7 days: dm_volume_summary (preferred) → rr_daily_metrics (fallback)
// ---------------------------------------------------------------------------

async function getIntegrationSummary() {
  const cacheKey = 'rapid-response:integration-summary:7d';
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  // Same query as operational-health overview: latest snapshot per (domain, campaign_id)
  // then filter active in JS — mirrors exact logic in getOverview()
  const [pulseRows, lettersRows] = await Promise.all([
    runAuroraQuery(`
      SELECT DISTINCT ON (domain, campaign_id)
        domain, campaign_id, status
      FROM rr_campaign_snapshots
      WHERE ${EXCLUDE_SEED}
      ORDER BY domain, campaign_id, snapshot_at DESC
    `),
    runAuroraQuery(`
      SELECT COALESCE(SUM(sends_total), 0) AS letters_last_week
      FROM rr_daily_metrics
      WHERE ${EXCLUDE_SEED}
        AND date >= CURRENT_DATE - INTERVAL '7 days'
    `),
  ]);

  const activeCampaigns = pulseRows.filter((r: Record<string, unknown>) => r.status === 'active').length;

  const data = {
    active_clients: activeCampaigns,
    letters_last_week: Number(lettersRows[0]?.letters_last_week || 0),
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

// ---------------------------------------------------------------------------
// On-hold age-bucket breakdown
// ---------------------------------------------------------------------------

/**
 * On-hold age-bucket breakdown — exposes the gap between "on-hold pieces that
 * are still within the expected 7-day window" vs "stale pieces the monolith's
 * auto-delivery timer should have converted to undelivered but hasn't".
 *
 * The monolith's row-level rapid_response_history table (which has per-piece
 * created_at timestamps) does not sync to Aurora — we only receive hourly
 * campaign snapshots in rr_campaign_snapshots. So we infer piece age by
 * tracking when each campaign first showed on_hold_count > 0: if that was
 * ≥ 7 days ago and current on_hold_count is still > 0, those pieces should
 * have been auto-flipped to undelivered by now.
 *
 * Assumption: the monolith's FIFO-ish on-hold handling means the oldest
 * pieces were on hold first. A campaign with on_hold_count > 0 for 17 days
 * has pieces at least 17 days old somewhere in that count. This is an
 * approximation — the authoritative row-level age can only come from the
 * monolith's MySQL.
 */
async function getOnHoldBreakdown(domain?: string) {
  const cacheKey = `rapid-response:on-hold-breakdown:${domain || 'all'}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return NextResponse.json(cached);

  // Delegates to the shared helper so every surface (pulse + campaigns table +
  // slack alert + this endpoint) reads from the same query. Any future refinement
  // to age inference happens in one place.
  const ages = await queryOnHoldAges(domain);
  const result = {
    totalOnHold: ages.totalOnHold,
    staleOnHold: ages.staleOnHold,
    freshOnHold: ages.freshOnHold,
    oldestAgeDays: ages.oldestAgeDays,
    campaignsWithHold: ages.campaignsWithHold,
    staleCampaigns: ages.staleCampaigns,
    campaigns: ages.perCampaign.map(c => ({
      domain: c.domain,
      campaignName: c.campaignName,
      currentHold: c.currentHold,
      firstOnHoldSeen: c.firstOnHoldSeen,
      daysSinceFirstHold: c.daysSinceFirstHold,
      ageBucket: c.ageBucket,
    })),
    thresholdDays: ON_HOLD_STALE_THRESHOLD_DAYS,
    dataAvailable: true,
  };
  setCache(cacheKey, result);
  return NextResponse.json(result);
}
