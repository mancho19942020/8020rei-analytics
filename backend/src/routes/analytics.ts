/**
 * Analytics Routes
 *
 * Handles all Google Analytics related endpoints.
 * Currently supports GA4 data from BigQuery for 8020REI and 8020Roofing.
 *
 * These routes will eventually replace the Next.js API routes
 * once the backend is fully integrated.
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { BigQueryService } from '../services/bigquery.service.js';
import { CacheService } from '../services/cache.service.js';

// Query parameter validation schema
const metricsQuerySchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
  userType: z.enum(['all', 'internal', 'external']).default('all'),
  property: z.enum(['8020rei', '8020roofing']).default('8020rei'),
});

// Initialize services
let bigQueryService: BigQueryService | null = null;
let cacheService: CacheService | null = null;

export async function analyticsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // Initialize services on first request
  fastify.addHook('onRequest', async () => {
    if (!bigQueryService) {
      bigQueryService = new BigQueryService();
    }
    if (!cacheService) {
      cacheService = new CacheService();
    }
  });

  /**
   * GET /api/v1/analytics/metrics
   *
   * Returns aggregated metrics for the dashboard overview.
   * This is the main endpoint that provides KPIs.
   */
  fastify.get('/metrics', async (request, reply) => {
    try {
      const query = metricsQuerySchema.parse(request.query);
      const { days, userType, property } = query;

      // Check cache first
      const cacheKey = `metrics:${property}:${days}:${userType}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          timestamp: new Date().toISOString(),
        };
      }

      // Fetch from BigQuery
      const data = await bigQueryService?.getMetrics(property, days, userType);

      // Cache the result
      await cacheService?.set(cacheKey, data, 300); // 5 min TTL

      return {
        success: true,
        data,
        cached: false,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
      };
    }
  });

  /**
   * GET /api/v1/analytics/users
   *
   * Returns user-related metrics (DAU, WAU, MAU, engagement, etc.)
   */
  fastify.get('/users', async (request, reply) => {
    try {
      const query = metricsQuerySchema.parse(request.query);
      const { days, userType, property } = query;

      const cacheKey = `users:${property}:${days}:${userType}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const data = await bigQueryService?.getUserMetrics(property, days, userType);
      await cacheService?.set(cacheKey, data, 300);

      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: 'Failed to fetch user metrics' };
    }
  });

  /**
   * GET /api/v1/analytics/features
   *
   * Returns feature usage and adoption metrics
   */
  fastify.get('/features', async (request, reply) => {
    try {
      const query = metricsQuerySchema.parse(request.query);
      const { days, userType, property } = query;

      const cacheKey = `features:${property}:${days}:${userType}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const data = await bigQueryService?.getFeatureMetrics(property, days, userType);
      await cacheService?.set(cacheKey, data, 300);

      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: 'Failed to fetch feature metrics' };
    }
  });

  /**
   * GET /api/v1/analytics/clients
   *
   * Returns client activity metrics
   */
  fastify.get('/clients', async (request, reply) => {
    try {
      const query = metricsQuerySchema.parse(request.query);
      const { days, userType, property } = query;

      const cacheKey = `clients:${property}:${days}:${userType}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const data = await bigQueryService?.getClientMetrics(property, days, userType);
      await cacheService?.set(cacheKey, data, 300);

      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: 'Failed to fetch client metrics' };
    }
  });

  /**
   * GET /api/v1/analytics/traffic
   *
   * Returns traffic source metrics
   */
  fastify.get('/traffic', async (request, reply) => {
    try {
      const query = metricsQuerySchema.parse(request.query);
      const { days, userType, property } = query;

      const cacheKey = `traffic:${property}:${days}:${userType}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const data = await bigQueryService?.getTrafficMetrics(property, days, userType);
      await cacheService?.set(cacheKey, data, 300);

      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: 'Failed to fetch traffic metrics' };
    }
  });

  /**
   * GET /api/v1/analytics/technology
   *
   * Returns device/browser/OS metrics
   */
  fastify.get('/technology', async (request, reply) => {
    try {
      const query = metricsQuerySchema.parse(request.query);
      const { days, userType, property } = query;

      const cacheKey = `technology:${property}:${days}:${userType}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const data = await bigQueryService?.getTechnologyMetrics(property, days, userType);
      await cacheService?.set(cacheKey, data, 300);

      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: 'Failed to fetch technology metrics' };
    }
  });

  /**
   * GET /api/v1/analytics/geography
   *
   * Returns geographic metrics
   */
  fastify.get('/geography', async (request, reply) => {
    try {
      const query = metricsQuerySchema.parse(request.query);
      const { days, userType, property } = query;

      const cacheKey = `geography:${property}:${days}:${userType}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const data = await bigQueryService?.getGeographyMetrics(property, days, userType);
      await cacheService?.set(cacheKey, data, 300);

      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: 'Failed to fetch geography metrics' };
    }
  });

  /**
   * GET /api/v1/analytics/events
   *
   * Returns event metrics
   */
  fastify.get('/events', async (request, reply) => {
    try {
      const query = metricsQuerySchema.parse(request.query);
      const { days, userType, property } = query;

      const cacheKey = `events:${property}:${days}:${userType}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const data = await bigQueryService?.getEventMetrics(property, days, userType);
      await cacheService?.set(cacheKey, data, 300);

      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: 'Failed to fetch event metrics' };
    }
  });

  /**
   * GET /api/v1/analytics/insights
   *
   * Returns alerts and insights
   */
  fastify.get('/insights', async (request, reply) => {
    try {
      const query = metricsQuerySchema.parse(request.query);
      const { days, userType, property } = query;

      const cacheKey = `insights:${property}:${days}:${userType}`;
      const cached = await cacheService?.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, cached: true };
      }

      const data = await bigQueryService?.getInsights(property, days, userType);
      await cacheService?.set(cacheKey, data, 300);

      return { success: true, data, cached: false };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { success: false, error: 'Failed to fetch insights' };
    }
  });
}
