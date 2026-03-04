/**
 * Properties API Metrics — Next.js API Route
 *
 * Queries Aurora directly (same pattern as /api/metrics uses BigQuery).
 * Supports: overview, usage-over-time, by-client, by-endpoint, errors, recent-logs
 * via the `type` query parameter.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { getCached, setCache } from '@/lib/cache';

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
      case 'usage-over-time':
        return await getUsageOverTime(days, params.get('granularity') || 'day');
      case 'by-client':
        return await getByClient(days, parseInt(params.get('limit') || '50'));
      case 'by-endpoint':
        return await getByEndpoint(days);
      case 'errors':
        return await getErrors(days);
      case 'recent-logs':
        return await getRecentLogs(days, params);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`[Properties API] Error fetching ${type}:`, error);
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
// Endpoint handlers
// ---------------------------------------------------------------------------

interface TrendData {
  value: number;
  isPositive: boolean;
}

function calculateTrend(current: number, previous: number, invertPositive = false): TrendData {
  if (!previous || previous === 0) {
    return { value: 0, isPositive: true };
  }
  const change = ((current - previous) / previous) * 100;
  const isPositive = invertPositive ? change <= 0 : change >= 0;
  return { value: Math.abs(change), isPositive };
}

async function getOverview(days: number) {
  const cacheKey = `properties-api:overview-v2:${days}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const overviewSql = `
    SELECT
      COUNT(*) as total_calls,
      COUNT(DISTINCT client_id) as unique_clients,
      COUNT(DISTINCT CASE WHEN domain IS NOT NULL THEN domain END) as unique_domains,
      COUNT(DISTINCT api_token_id) as unique_tokens,
      COALESCE(AVG(response_time_ms)::INTEGER, 0) as avg_response_ms,
      COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::INTEGER, 0) as p95_response_ms,
      COUNT(CASE WHEN response_status >= 400 THEN 1 END) as total_errors,
      ROUND(COUNT(CASE WHEN response_status >= 400 THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as error_rate,
      COALESCE(AVG(CASE WHEN response_status = 200 THEN results_count END)::INTEGER, 0) as avg_results_returned
    FROM api_token_usage_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
  `;

  const prevSql = `
    SELECT
      COUNT(*) as total_calls,
      COUNT(DISTINCT client_id) as unique_clients,
      COUNT(DISTINCT CASE WHEN domain IS NOT NULL THEN domain END) as unique_domains,
      COALESCE(AVG(response_time_ms)::INTEGER, 0) as avg_response_ms,
      ROUND(COUNT(CASE WHEN response_status >= 400 THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as error_rate
    FROM api_token_usage_logs
    WHERE created_at >= NOW() - INTERVAL '${days * 2} days'
      AND created_at < NOW() - INTERVAL '${days} days'
  `;

  const [rows, prevRows] = await Promise.all([
    runAuroraQuery(overviewSql),
    runAuroraQuery(prevSql),
  ]);

  const row = rows[0] || {};
  const prev = prevRows[0] || {};

  const totalCalls = Number(row.total_calls || 0);
  const uniqueDomains = Number(row.unique_domains || 0);
  const avgResponseMs = Number(row.avg_response_ms || 0);
  const errorRate = Number(row.error_rate || 0);

  const prevTotalCalls = Number(prev.total_calls || 0);
  const prevUniqueDomains = Number(prev.unique_domains || 0);
  const prevAvgResponseMs = Number(prev.avg_response_ms || 0);
  const prevErrorRate = Number(prev.error_rate || 0);

  const data = {
    totalCalls,
    uniqueClients: Number(row.unique_clients || 0),
    uniqueDomains,
    uniqueTokens: Number(row.unique_tokens || 0),
    avgResponseMs,
    p95ResponseMs: Number(row.p95_response_ms || 0),
    totalErrors: Number(row.total_errors || 0),
    errorRate,
    avgResultsReturned: Number(row.avg_results_returned || 0),
    trends: {
      totalCalls: calculateTrend(totalCalls, prevTotalCalls),
      uniqueDomains: calculateTrend(uniqueDomains, prevUniqueDomains),
      avgResponseMs: calculateTrend(avgResponseMs, prevAvgResponseMs, true),
      errorRate: calculateTrend(errorRate, prevErrorRate, true),
    },
  };

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

async function getUsageOverTime(days: number, granularity: string) {
  const cacheKey = `properties-api:usage-over-time:${days}:${granularity}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const dateExpr =
    granularity === 'hour'
      ? "TO_CHAR(DATE_TRUNC('hour', created_at), 'YYYY-MM-DD HH24:00')"
      : "TO_CHAR(DATE(created_at), 'YYYY-MM-DD')";

  const rows = await runAuroraQuery(`
    SELECT
      ${dateExpr} as date,
      COUNT(*) as calls,
      COUNT(DISTINCT client_id) as unique_clients,
      COALESCE(AVG(response_time_ms)::INTEGER, 0) as avg_response_ms,
      COUNT(CASE WHEN response_status >= 400 THEN 1 END) as errors,
      COUNT(CASE WHEN response_status < 400 THEN 1 END) as successes
    FROM api_token_usage_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY ${dateExpr}
    ORDER BY date ASC
  `);

  const data = rows.map((r) => ({
    date: String(r.date),
    calls: Number(r.calls || 0),
    uniqueClients: Number(r.unique_clients || 0),
    avgResponseMs: Number(r.avg_response_ms || 0),
    errors: Number(r.errors || 0),
    successes: Number(r.successes || 0),
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

async function getByClient(days: number, limit: number) {
  const cacheKey = `properties-api:by-client:${days}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      COALESCE(domain, 'unknown') as domain,
      COUNT(*) as total_calls,
      COUNT(DISTINCT api_token_id) as tokens_used,
      COALESCE(AVG(response_time_ms)::INTEGER, 0) as avg_response_ms,
      COALESCE(MAX(response_time_ms), 0) as max_response_ms,
      COUNT(CASE WHEN response_status >= 400 THEN 1 END) as errors,
      MIN(created_at)::TEXT as first_call,
      MAX(created_at)::TEXT as last_call
    FROM api_token_usage_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY COALESCE(domain, 'unknown')
    ORDER BY total_calls DESC
    LIMIT ${limit}
  `);

  const data = rows.map((r) => ({
    domain: String(r.domain || 'unknown'),
    totalCalls: Number(r.total_calls || 0),
    tokensUsed: Number(r.tokens_used || 0),
    avgResponseMs: Number(r.avg_response_ms || 0),
    maxResponseMs: Number(r.max_response_ms || 0),
    errors: Number(r.errors || 0),
    firstCall: String(r.first_call || ''),
    lastCall: String(r.last_call || ''),
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

async function getByEndpoint(days: number) {
  const cacheKey = `properties-api:by-endpoint:${days}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      endpoint,
      http_method,
      COUNT(*) as calls,
      COALESCE(AVG(response_time_ms)::INTEGER, 0) as avg_response_ms,
      COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::INTEGER, 0) as p95_ms,
      COALESCE(AVG(CASE WHEN response_status = 200 THEN results_count END)::INTEGER, 0) as avg_results,
      COUNT(CASE WHEN response_status >= 400 THEN 1 END) as errors
    FROM api_token_usage_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY endpoint, http_method
    ORDER BY calls DESC
  `);

  const data = rows.map((r) => ({
    endpoint: String(r.endpoint || ''),
    httpMethod: String(r.http_method || ''),
    calls: Number(r.calls || 0),
    avgResponseMs: Number(r.avg_response_ms || 0),
    p95Ms: Number(r.p95_ms || 0),
    avgResults: Number(r.avg_results || 0),
    errors: Number(r.errors || 0),
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

async function getErrors(days: number) {
  const cacheKey = `properties-api:errors:${days}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true });

  const rows = await runAuroraQuery(`
    SELECT
      response_status,
      error_message,
      COUNT(*) as occurrences,
      MIN(created_at)::TEXT as first_seen,
      MAX(created_at)::TEXT as last_seen,
      COUNT(DISTINCT client_id) as affected_clients,
      COUNT(DISTINCT CASE WHEN domain IS NOT NULL THEN domain END) as affected_domains
    FROM api_token_usage_logs
    WHERE response_status >= 400
      AND created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY response_status, error_message
    ORDER BY occurrences DESC
  `);

  const data = rows.map((r) => ({
    responseStatus: Number(r.response_status),
    errorMessage: r.error_message ? String(r.error_message) : null,
    occurrences: Number(r.occurrences || 0),
    firstSeen: String(r.first_seen || ''),
    lastSeen: String(r.last_seen || ''),
    affectedClients: Number(r.affected_clients || 0),
    affectedDomains: Number(r.affected_domains || 0),
  }));

  setCache(cacheKey, data);
  return NextResponse.json({ success: true, data, cached: false });
}

async function getRecentLogs(days: number, params: URLSearchParams) {
  const page = parseInt(params.get('page') || '1');
  const pageSize = Math.min(parseInt(params.get('pageSize') || '25'), 100);
  const clientId = params.get('clientId');
  const endpoint = params.get('endpoint');
  const status = params.get('status');
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [`created_at >= NOW() - INTERVAL '${days} days'`];
  if (clientId) conditions.push(`client_id = ${parseInt(clientId)}`);
  if (endpoint) conditions.push(`endpoint = '${endpoint.replace(/'/g, "''")}'`);
  if (status === 'error') conditions.push('response_status >= 400');
  if (status === 'success') conditions.push('response_status < 400');
  const whereClause = conditions.join(' AND ');

  const cacheKey = `properties-api:recent-logs:${days}:${page}:${pageSize}:${clientId || ''}:${endpoint || ''}:${status || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ success: true, ...(cached as object), cached: true });

  const [rows, countRows] = await Promise.all([
    runAuroraQuery(`
      SELECT id, api_token_id, client_id, COALESCE(domain, 'unknown') as domain,
             endpoint, http_method,
             response_status, results_count, response_time_ms,
             ip_address, user_agent, error_message, created_at::TEXT as created_at
      FROM api_token_usage_logs
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `),
    runAuroraQuery(`
      SELECT COUNT(*) as total FROM api_token_usage_logs WHERE ${whereClause}
    `),
  ]);

  const total = Number(countRows[0]?.total || 0);

  const data = rows.map((r) => ({
    id: Number(r.id),
    apiTokenId: Number(r.api_token_id),
    clientId: Number(r.client_id),
    domain: String(r.domain || 'unknown'),
    endpoint: String(r.endpoint || ''),
    httpMethod: String(r.http_method || ''),
    responseStatus: Number(r.response_status),
    resultsCount: r.results_count != null ? Number(r.results_count) : null,
    responseTimeMs: Number(r.response_time_ms || 0),
    ipAddress: String(r.ip_address || ''),
    userAgent: r.user_agent ? String(r.user_agent) : null,
    errorMessage: r.error_message ? String(r.error_message) : null,
    createdAt: String(r.created_at || ''),
  }));

  const result = {
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };

  setCache(cacheKey, result);
  return NextResponse.json({ success: true, ...result, cached: false });
}
