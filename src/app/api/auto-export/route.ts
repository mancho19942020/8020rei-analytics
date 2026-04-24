/**
 * Auto Export metrics — Next.js API route.
 *
 * Reads the three Aurora tables (`auto_export_config_snapshot`,
 * `auto_export_run_log`, `auto_export_daily_metrics`) and multiplexes on
 * ?type= so the AutoExportTab can fetch all widgets in parallel.
 *
 * Mirrors the /api/properties-api route conventions:
 *   - requireAuth(request) guard
 *   - isAuroraConfigured() short-circuit
 *   - EXCLUDE_TEST_DOMAINS_SQL injected into every WHERE
 *   - getCached / setCache, 5-min TTL, typed cache keys
 *   - Returns { success, data, cached }
 *
 * Until PR #1979 + backoffice #10 deploy and Carolina flips the cron, the
 * Aurora tables are empty — every widget renders its empty state, which is
 * the expected behavior during the "Option A" pre-data audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';
import { EXCLUDE_TEST_DOMAINS_SQL, TEST_DOMAINS_SQL } from '@/lib/domain-filter';
import { AUTO_EXPORT_ACTIVE_CLIENTS_GOAL } from '@/lib/auto-export-goals';

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
  const days = clampDays(parseInt(params.get('days') || '30'));

  try {
    switch (type) {
      case 'overview':
        return await getOverview(days);
      case 'adoption':
        return await getAdoption();
      case 'reliability':
        return await getReliability(days);
      case 'volume':
        return await getVolume();
      case 'config-health':
        return await getConfigHealth();
      case 'top-clients':
        return await getTopClients(days);
      case 'run-log':
        return await getRunLog(days, params);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`[Auto Export] Error fetching ${type}:`, error);
    return NextResponse.json(
      { success: false, error: `Unable to load ${type}. Please retry.` },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampDays(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 30;
  return Math.min(n, 365);
}

interface Trend {
  value: number;
  isPositive: boolean;
}

function calculateTrend(current: number, previous: number, invertPositive = false): Trend {
  if (!previous || previous === 0) return { value: 0, isPositive: true };
  const change = ((current - previous) / previous) * 100;
  const isPositive = invertPositive ? change <= 0 : change >= 0;
  return { value: Math.abs(change), isPositive };
}

// ---------------------------------------------------------------------------
// Endpoint handlers
// ---------------------------------------------------------------------------

async function getOverview(days: number) {
  const cacheKey = `auto-export:overview:${days}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const activeClientsSql = `
    SELECT COUNT(DISTINCT domain)::int AS active_clients
      FROM auto_export_config_snapshot
     WHERE snapshot_date = CURRENT_DATE
       AND active_configs > 0
       AND ${EXCLUDE_TEST_DOMAINS_SQL}
  `;

  const currentRunsSql = `
    SELECT
        COALESCE(SUM(total_runs), 0)::bigint                                  AS total_runs,
        COALESCE(SUM(sent_runs), 0)::bigint                                   AS sent_runs,
        COALESCE(SUM(total_properties_exported), 0)::bigint                   AS properties_exported
      FROM auto_export_daily_metrics
     WHERE metric_date >= CURRENT_DATE - INTERVAL '${days} days'
       AND metric_date <= CURRENT_DATE
       AND ${EXCLUDE_TEST_DOMAINS_SQL}
  `;

  const prevRunsSql = `
    SELECT
        COALESCE(SUM(total_runs), 0)::bigint                                  AS total_runs,
        COALESCE(SUM(sent_runs), 0)::bigint                                   AS sent_runs,
        COALESCE(SUM(total_properties_exported), 0)::bigint                   AS properties_exported
      FROM auto_export_daily_metrics
     WHERE metric_date >= CURRENT_DATE - INTERVAL '${days * 2} days'
       AND metric_date <  CURRENT_DATE - INTERVAL '${days} days'
       AND ${EXCLUDE_TEST_DOMAINS_SQL}
  `;

  const prevActiveSql = `
    SELECT COUNT(DISTINCT domain)::int AS active_clients
      FROM auto_export_config_snapshot
     WHERE snapshot_date = CURRENT_DATE - INTERVAL '${days} days'
       AND active_configs > 0
       AND ${EXCLUDE_TEST_DOMAINS_SQL}
  `;

  const [activeRows, curRows, prevRows, prevActiveRows] = await Promise.all([
    runAuroraQuery(activeClientsSql),
    runAuroraQuery(currentRunsSql),
    runAuroraQuery(prevRunsSql),
    runAuroraQuery(prevActiveSql),
  ]);

  const activeClients = Number(activeRows[0]?.active_clients ?? 0);
  const prevActiveClients = Number(prevActiveRows[0]?.active_clients ?? 0);

  const totalRuns = Number(curRows[0]?.total_runs ?? 0);
  const sentRuns = Number(curRows[0]?.sent_runs ?? 0);
  const propertiesExported = Number(curRows[0]?.properties_exported ?? 0);
  const successRate = totalRuns > 0 ? sentRuns / totalRuns : 0;

  const prevTotalRuns = Number(prevRows[0]?.total_runs ?? 0);
  const prevSentRuns = Number(prevRows[0]?.sent_runs ?? 0);
  const prevProperties = Number(prevRows[0]?.properties_exported ?? 0);
  const prevSuccessRate = prevTotalRuns > 0 ? prevSentRuns / prevTotalRuns : 0;

  const data = {
    activeClients,
    totalRuns,
    successRate,
    propertiesExported,
    trends: {
      activeClients: calculateTrend(activeClients, prevActiveClients),
      totalRuns: calculateTrend(totalRuns, prevTotalRuns),
      successRate: calculateTrend(successRate, prevSuccessRate),
      propertiesExported: calculateTrend(propertiesExported, prevProperties),
    },
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

async function getAdoption() {
  const cacheKey = 'auto-export:adoption:90';
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
        TO_CHAR(snapshot_date, 'YYYY-MM-DD')                            AS date,
        COUNT(DISTINCT domain) FILTER (WHERE active_configs > 0)::int   AS active_clients
      FROM auto_export_config_snapshot
     WHERE snapshot_date >= CURRENT_DATE - INTERVAL '90 days'
       AND snapshot_date <= CURRENT_DATE
       AND ${EXCLUDE_TEST_DOMAINS_SQL}
     GROUP BY snapshot_date
     ORDER BY snapshot_date ASC
  `);

  const data = {
    series: rows.map((r) => ({
      date: String(r.date ?? ''),
      activeClients: Number(r.active_clients ?? 0),
    })),
    goal: AUTO_EXPORT_ACTIVE_CLIENTS_GOAL,
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

async function getReliability(days: number) {
  const cacheKey = `auto-export:reliability:${days}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const stacksSql = `
    SELECT
        TO_CHAR(metric_date, 'YYYY-MM-DD')          AS date,
        COALESCE(SUM(sent_runs), 0)::bigint         AS sent,
        COALESCE(SUM(failed_runs), 0)::bigint       AS failed,
        COALESCE(SUM(no_results_runs), 0)::bigint   AS no_results,
        COALESCE(SUM(pending_runs), 0)::bigint      AS pending
      FROM auto_export_daily_metrics
     WHERE metric_date >= CURRENT_DATE - INTERVAL '${days} days'
       AND metric_date <= CURRENT_DATE
       AND ${EXCLUDE_TEST_DOMAINS_SQL}
     GROUP BY metric_date
     ORDER BY metric_date ASC
  `;

  const runtimeSql = `
    SELECT
        TO_CHAR(metric_date, 'YYYY-MM-DD')                  AS date,
        AVG(avg_runtime_seconds)::numeric(10,2)             AS avg_runtime_seconds,
        AVG(p95_runtime_seconds)::numeric(10,2)             AS p95_runtime_seconds
      FROM auto_export_daily_metrics
     WHERE metric_date >= CURRENT_DATE - INTERVAL '${days} days'
       AND metric_date <= CURRENT_DATE
       AND ${EXCLUDE_TEST_DOMAINS_SQL}
       AND avg_runtime_seconds IS NOT NULL
     GROUP BY metric_date
     ORDER BY metric_date ASC
  `;

  const failureReasonsSql = `
    SELECT
        COALESCE(error_message, '(no message)')             AS error_message,
        COUNT(*)::bigint                                    AS occurrences,
        MIN(created_at)::text                               AS first_seen,
        MAX(created_at)::text                               AS last_seen,
        COUNT(DISTINCT domain)::int                         AS affected_domains,
        COUNT(DISTINCT configuration_id)::int               AS affected_configs
      FROM auto_export_run_log
     WHERE status = 'failed'
       AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
       AND ${EXCLUDE_TEST_DOMAINS_SQL}
     GROUP BY COALESCE(error_message, '(no message)')
     ORDER BY occurrences DESC
     LIMIT 10
  `;

  const [stackRows, runtimeRows, failureRows] = await Promise.all([
    runAuroraQuery(stacksSql),
    runAuroraQuery(runtimeSql),
    runAuroraQuery(failureReasonsSql),
  ]);

  const data = {
    stacks: stackRows.map((r) => ({
      date: String(r.date ?? ''),
      sent: Number(r.sent ?? 0),
      failed: Number(r.failed ?? 0),
      noResults: Number(r.no_results ?? 0),
      pending: Number(r.pending ?? 0),
    })),
    runtime: runtimeRows.map((r) => ({
      date: String(r.date ?? ''),
      avgRuntimeSeconds: Number(r.avg_runtime_seconds ?? 0),
      p95RuntimeSeconds: Number(r.p95_runtime_seconds ?? 0),
    })),
    failureReasons: failureRows.map((r) => ({
      errorMessage: String(r.error_message ?? ''),
      occurrences: Number(r.occurrences ?? 0),
      firstSeen: String(r.first_seen ?? ''),
      lastSeen: String(r.last_seen ?? ''),
      affectedDomains: Number(r.affected_domains ?? 0),
      affectedConfigs: Number(r.affected_configs ?? 0),
    })),
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

async function getVolume() {
  const cacheKey = 'auto-export:volume:60';
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const seriesSql = `
    SELECT
        TO_CHAR(metric_date, 'YYYY-MM-DD')                      AS date,
        COALESCE(SUM(total_properties_exported), 0)::bigint     AS properties_exported
      FROM auto_export_daily_metrics
     WHERE metric_date >= CURRENT_DATE - INTERVAL '60 days'
       AND metric_date <= CURRENT_DATE
       AND ${EXCLUDE_TEST_DOMAINS_SQL}
     GROUP BY metric_date
     ORDER BY metric_date ASC
  `;

  const frequencySql = `
    WITH latest_snapshot AS (
      SELECT DISTINCT ON (domain) *
        FROM auto_export_config_snapshot
       WHERE snapshot_date <= CURRENT_DATE
       ORDER BY domain, snapshot_date DESC
    )
    SELECT
        COALESCE(SUM(daily_count), 0)::bigint       AS daily,
        COALESCE(SUM(weekly_count), 0)::bigint      AS weekly,
        COALESCE(SUM(monthly_count), 0)::bigint     AS monthly,
        COALESCE(SUM(quarterly_count), 0)::bigint   AS quarterly
      FROM latest_snapshot
     WHERE ${EXCLUDE_TEST_DOMAINS_SQL}
  `;

  const [seriesRows, freqRows] = await Promise.all([
    runAuroraQuery(seriesSql),
    runAuroraQuery(frequencySql),
  ]);

  const freq = freqRows[0] ?? {};
  const data = {
    series: seriesRows.map((r) => ({
      date: String(r.date ?? ''),
      propertiesExported: Number(r.properties_exported ?? 0),
    })),
    frequency: {
      daily: Number(freq.daily ?? 0),
      weekly: Number(freq.weekly ?? 0),
      monthly: Number(freq.monthly ?? 0),
      quarterly: Number(freq.quarterly ?? 0),
    },
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

async function getConfigHealth() {
  const cacheKey = 'auto-export:config-health';
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    WITH latest_snapshot AS (
      SELECT DISTINCT ON (domain) *
        FROM auto_export_config_snapshot
       WHERE snapshot_date <= CURRENT_DATE
       ORDER BY domain, snapshot_date DESC
    )
    SELECT
        COALESCE(SUM(orphaned_configs), 0)::bigint   AS orphaned,
        COALESCE(SUM(never_run_configs), 0)::bigint  AS never_run,
        COALESCE(SUM(stale_configs), 0)::bigint      AS stale
      FROM latest_snapshot
     WHERE ${EXCLUDE_TEST_DOMAINS_SQL}
  `);

  const row = rows[0] ?? {};
  const data = {
    orphaned: Number(row.orphaned ?? 0),
    neverRun: Number(row.never_run ?? 0),
    stale: Number(row.stale ?? 0),
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

async function getTopClients(days: number) {
  const cacheKey = `auto-export:top-clients:${days}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    WITH latest_snapshot AS (
      SELECT DISTINCT ON (domain) *
        FROM auto_export_config_snapshot
       WHERE snapshot_date <= CURRENT_DATE
       ORDER BY domain, snapshot_date DESC
    ),
    window_metrics AS (
      SELECT
          domain,
          SUM(total_runs)::bigint                 AS runs,
          SUM(sent_runs)::bigint                  AS sent,
          SUM(total_properties_exported)::bigint  AS properties,
          MAX(metric_date)::text                  AS last_activity
        FROM auto_export_daily_metrics
       WHERE metric_date >= CURRENT_DATE - INTERVAL '${days} days'
         AND metric_date <= CURRENT_DATE
       GROUP BY domain
    )
    SELECT
        w.domain,
        COALESCE(s.active_configs, 0)::int                                      AS active_configs,
        w.runs,
        CASE WHEN w.runs = 0 THEN 0 ELSE w.sent::decimal / w.runs END           AS success_rate,
        w.properties,
        w.last_activity
      FROM window_metrics w
      LEFT JOIN latest_snapshot s USING (domain)
     WHERE w.domain NOT IN (${TEST_DOMAINS_SQL})
     ORDER BY w.runs DESC
     LIMIT 10
  `);

  const data = rows.map((r) => ({
    domain: String(r.domain ?? ''),
    activeConfigs: Number(r.active_configs ?? 0),
    runs: Number(r.runs ?? 0),
    successRate: Number(r.success_rate ?? 0),
    propertiesExported: Number(r.properties ?? 0),
    lastActivity: String(r.last_activity ?? ''),
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

async function getRunLog(days: number, params: URLSearchParams) {
  const page = Math.max(parseInt(params.get('page') || '1'), 1);
  const pageSize = Math.min(parseInt(params.get('pageSize') || '25'), 100);
  const status = params.get('status');
  const domain = params.get('domain');
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [
    `created_at >= CURRENT_DATE - INTERVAL '${days} days'`,
    EXCLUDE_TEST_DOMAINS_SQL,
  ];
  const sqlParams: import('@aws-sdk/client-rds-data').SqlParameter[] = [];

  if (status) {
    conditions.push('status = :status');
    sqlParams.push({ name: 'status', value: { stringValue: status } });
  }
  if (domain) {
    conditions.push('domain = :domain');
    sqlParams.push({ name: 'domain', value: { stringValue: domain } });
  }

  const whereClause = conditions.join(' AND ');

  const cacheKey = `auto-export:run-log:${days}:${page}:${pageSize}:${status || ''}:${domain || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, ...(cached as object), cached: true });

  const [rows, countRows] = await Promise.all([
    runAuroraQuery(
      `
        SELECT
            id, domain, configuration_id, configured_filter_name,
            frequency, filter_properties_by, status, retry_count,
            properties_count, file_format, recipients_count, error_message,
            duration_seconds, created_by,
            started_at::text AS started_at,
            finished_at::text AS finished_at,
            created_at::text AS created_at
          FROM auto_export_run_log
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ${pageSize} OFFSET ${offset}
      `,
      sqlParams.length > 0 ? sqlParams : undefined
    ),
    runAuroraQuery(
      `SELECT COUNT(*)::bigint AS total FROM auto_export_run_log WHERE ${whereClause}`,
      sqlParams.length > 0 ? sqlParams : undefined
    ),
  ]);

  const total = Number(countRows[0]?.total ?? 0);

  const data = rows.map((r) => ({
    id: Number(r.id ?? 0),
    domain: String(r.domain ?? ''),
    configurationId: Number(r.configuration_id ?? 0),
    configuredFilterName: r.configured_filter_name != null ? String(r.configured_filter_name) : null,
    frequency: String(r.frequency ?? ''),
    filterPropertiesBy: String(r.filter_properties_by ?? ''),
    status: String(r.status ?? ''),
    retryCount: Number(r.retry_count ?? 0),
    propertiesCount: r.properties_count != null ? Number(r.properties_count) : null,
    fileFormat: r.file_format != null ? String(r.file_format) : null,
    recipientsCount: Number(r.recipients_count ?? 0),
    errorMessage: r.error_message != null ? String(r.error_message) : null,
    durationSeconds: r.duration_seconds != null ? Number(r.duration_seconds) : null,
    createdBy: r.created_by != null ? Number(r.created_by) : null,
    startedAt: r.started_at != null ? String(r.started_at) : null,
    finishedAt: r.finished_at != null ? String(r.finished_at) : null,
    createdAt: String(r.created_at ?? ''),
  }));

  const result = {
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };

  setCache(cacheKey, result);
  return NextResponse.json({ success: true, ...result, cached: false });
}
