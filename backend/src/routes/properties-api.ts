/**
 * Properties API Routes
 *
 * Endpoints for Properties API usage metrics from AWS Aurora.
 * Data source: api_token_usage_logs table in grafana8020db.
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { type SqlParameter } from '@aws-sdk/client-rds-data';
import { AuroraService } from '../services/aurora.service.js';
import { CacheService } from '../services/cache.service.js';

// Shared query param schemas
const baseQuerySchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
});

const paginatedQuerySchema = baseQuerySchema.extend({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

const recentLogsQuerySchema = paginatedQuerySchema.extend({
  clientId: z.coerce.number().optional(),
  endpoint: z.string().optional(),
  status: z.enum(['success', 'error']).optional(),
});

const usageOverTimeQuerySchema = baseQuerySchema.extend({
  granularity: z.enum(['day', 'hour']).default('day'),
});

const byClientQuerySchema = baseQuerySchema.extend({
  sortBy: z.enum(['calls', 'avgMs', 'errors']).default('calls'),
  limit: z.coerce.number().min(1).max(200).default(50),
});

// Service singletons
let auroraService: AuroraService | null = null;
let cacheService: CacheService | null = null;

export async function propertiesApiRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // Lazy-init services
  fastify.addHook('onRequest', async () => {
    if (!auroraService) {
      auroraService = new AuroraService();
    }
    if (!cacheService) {
      cacheService = new CacheService();
    }
  });

  /**
   * GET /overview
   * Summary KPIs for the selected time range.
   */
  fastify.get('/overview', async (request, reply) => {
    try {
      const { days } = baseQuerySchema.parse(request.query);

      const cacheKey = `properties-api:overview:${days}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true, timestamp: new Date().toISOString() };
      }

      const rows = await auroraService!.executeQuery(`
        SELECT
          COUNT(*) as total_calls,
          COUNT(DISTINCT client_id) as unique_clients,
          COUNT(DISTINCT api_token_id) as unique_tokens,
          COALESCE(AVG(response_time_ms)::INTEGER, 0) as avg_response_ms,
          COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::INTEGER, 0) as p95_response_ms,
          COUNT(CASE WHEN response_status >= 400 THEN 1 END) as total_errors,
          ROUND(COUNT(CASE WHEN response_status >= 400 THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as error_rate,
          COALESCE(AVG(CASE WHEN response_status = 200 THEN results_count END)::INTEGER, 0) as avg_results_returned
        FROM api_token_usage_logs
        WHERE created_at >= NOW() - INTERVAL '${days} days'
      `);

      const row = rows[0] || {};
      const data = {
        totalCalls: Number(row.total_calls || 0),
        uniqueClients: Number(row.unique_clients || 0),
        uniqueTokens: Number(row.unique_tokens || 0),
        avgResponseMs: Number(row.avg_response_ms || 0),
        p95ResponseMs: Number(row.p95_response_ms || 0),
        totalErrors: Number(row.total_errors || 0),
        errorRate: Number(row.error_rate || 0),
        avgResultsReturned: Number(row.avg_results_returned || 0),
      };

      await cacheService?.set(cacheKey, data, 300); // 5 min
      return { success: true, data, cached: false, timestamp: new Date().toISOString() };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch overview' };
    }
  });

  /**
   * GET /usage-over-time
   * Time-series data for charts. Supports day or hour granularity.
   */
  fastify.get('/usage-over-time', async (request, reply) => {
    try {
      const { days, granularity } = usageOverTimeQuerySchema.parse(request.query);

      const cacheKey = `properties-api:usage-over-time:${days}:${granularity}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const dateExpr = granularity === 'hour'
        ? "TO_CHAR(DATE_TRUNC('hour', created_at), 'YYYY-MM-DD HH24:00')"
        : "TO_CHAR(DATE(created_at), 'YYYY-MM-DD')";

      const rows = await auroraService!.executeQuery(`
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

      await cacheService?.set(cacheKey, data, 300);
      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch usage over time' };
    }
  });

  /**
   * GET /by-client
   * Per-client usage breakdown.
   */
  fastify.get('/by-client', async (request, reply) => {
    try {
      const { days, sortBy, limit } = byClientQuerySchema.parse(request.query);

      const orderColumn = sortBy === 'avgMs' ? 'avg_response_ms' : sortBy === 'errors' ? 'errors' : 'total_calls';
      const cacheKey = `properties-api:by-client:${days}:${sortBy}:${limit}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const rows = await auroraService!.executeQuery(`
        SELECT
          client_id,
          COUNT(*) as total_calls,
          COUNT(DISTINCT api_token_id) as tokens_used,
          COALESCE(AVG(response_time_ms)::INTEGER, 0) as avg_response_ms,
          COALESCE(MAX(response_time_ms), 0) as max_response_ms,
          COUNT(CASE WHEN response_status >= 400 THEN 1 END) as errors,
          MIN(created_at)::TEXT as first_call,
          MAX(created_at)::TEXT as last_call
        FROM api_token_usage_logs
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY client_id
        ORDER BY ${orderColumn} DESC
        LIMIT ${limit}
      `);

      const data = rows.map((r) => ({
        clientId: Number(r.client_id),
        totalCalls: Number(r.total_calls || 0),
        tokensUsed: Number(r.tokens_used || 0),
        avgResponseMs: Number(r.avg_response_ms || 0),
        maxResponseMs: Number(r.max_response_ms || 0),
        errors: Number(r.errors || 0),
        firstCall: String(r.first_call || ''),
        lastCall: String(r.last_call || ''),
      }));

      await cacheService?.set(cacheKey, data, 300);
      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch client breakdown' };
    }
  });

  /**
   * GET /by-endpoint
   * Per-endpoint breakdown (schema, search, get-by-id).
   */
  fastify.get('/by-endpoint', async (request, reply) => {
    try {
      const { days } = baseQuerySchema.parse(request.query);

      const cacheKey = `properties-api:by-endpoint:${days}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const rows = await auroraService!.executeQuery(`
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

      await cacheService?.set(cacheKey, data, 600); // 10 min — rarely changes shape
      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch endpoint breakdown' };
    }
  });

  /**
   * GET /errors
   * Error analysis grouped by status + message.
   */
  fastify.get('/errors', async (request, reply) => {
    try {
      const { days } = baseQuerySchema.parse(request.query);

      const cacheKey = `properties-api:errors:${days}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const rows = await auroraService!.executeQuery(`
        SELECT
          response_status,
          error_message,
          COUNT(*) as occurrences,
          MIN(created_at)::TEXT as first_seen,
          MAX(created_at)::TEXT as last_seen,
          COUNT(DISTINCT client_id) as affected_clients
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
      }));

      await cacheService?.set(cacheKey, data, 300);
      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch errors' };
    }
  });

  /**
   * GET /recent-logs
   * Paginated raw log viewer with optional filters.
   */
  fastify.get('/recent-logs', async (request, reply) => {
    try {
      const { days, page, pageSize, clientId, endpoint, status } =
        recentLogsQuerySchema.parse(request.query);

      const offset = (page - 1) * pageSize;

      // Build WHERE clause with parameterized values to prevent SQL injection
      const conditions: string[] = [`created_at >= NOW() - INTERVAL '${days} days'`];
      const sqlParams: SqlParameter[] = [];

      if (clientId) {
        conditions.push(`client_id = :clientId`);
        sqlParams.push({ name: 'clientId', value: { longValue: clientId } });
      }
      if (endpoint) {
        conditions.push(`endpoint = :endpoint`);
        sqlParams.push({ name: 'endpoint', value: { stringValue: endpoint } });
      }
      if (status === 'error') conditions.push('response_status >= 400');
      if (status === 'success') conditions.push('response_status < 400');
      const whereClause = conditions.join(' AND ');

      const cacheKey = `properties-api:recent-logs:${days}:${page}:${pageSize}:${clientId || ''}:${endpoint || ''}:${status || ''}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, ...cached, cached: true };
      }

      // Parallel: fetch rows + count (using parameterized queries)
      const [rows, countRows] = await Promise.all([
        auroraService!.executeQuery(`
          SELECT id, api_token_id, client_id, endpoint, http_method,
                 response_status, results_count, response_time_ms,
                 ip_address, user_agent, error_message, created_at::TEXT as created_at
          FROM api_token_usage_logs
          WHERE ${whereClause}
          ORDER BY created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `, sqlParams),
        auroraService!.executeQuery(`
          SELECT COUNT(*) as total
          FROM api_token_usage_logs
          WHERE ${whereClause}
        `, sqlParams),
      ]);

      const total = Number(countRows[0]?.total || 0);

      const data = rows.map((r) => ({
        id: Number(r.id),
        apiTokenId: Number(r.api_token_id),
        clientId: Number(r.client_id),
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
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };

      await cacheService?.set(cacheKey, result, 60); // 1 min — near-real-time
      return { success: true, ...result, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch recent logs' };
    }
  });
}
