/**
 * Health Check Routes
 *
 * Provides endpoints for monitoring the API health and
 * checking connectivity to various data sources.
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    name: string;
    status: 'connected' | 'disconnected' | 'not_configured';
    latency?: number;
    error?: string;
  }[];
}

export async function healthRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // Basic health check
  fastify.get('/', async (_request, _reply) => {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      services: [
        {
          name: 'bigquery',
          status: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'connected' : 'not_configured',
        },
        {
          name: 'salesforce',
          status: 'not_configured', // Future implementation
        },
        {
          name: 'redis',
          status: process.env.REDIS_URL ? 'connected' : 'not_configured',
        },
        {
          name: 'aws',
          status: 'not_configured', // Future implementation
        },
      ],
    };

    return health;
  });

  // Detailed health check with latency
  fastify.get('/detailed', async (_request, _reply) => {
    const services: HealthStatus['services'] = [];

    // Check BigQuery connectivity
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const start = Date.now();
      try {
        // TODO: Actually ping BigQuery
        services.push({
          name: 'bigquery',
          status: 'connected',
          latency: Date.now() - start,
        });
      } catch (error) {
        services.push({
          name: 'bigquery',
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      services.push({
        name: 'bigquery',
        status: 'not_configured',
      });
    }

    // Check Redis connectivity
    if (process.env.REDIS_URL) {
      const start = Date.now();
      try {
        // TODO: Actually ping Redis
        services.push({
          name: 'redis',
          status: 'connected',
          latency: Date.now() - start,
        });
      } catch (error) {
        services.push({
          name: 'redis',
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      services.push({
        name: 'redis',
        status: 'not_configured',
      });
    }

    // Future services (marked as not configured)
    services.push(
      { name: 'salesforce', status: 'not_configured' },
      { name: 'aws', status: 'not_configured' },
      { name: 'skiptrace-batch-elites', status: 'not_configured' },
      { name: 'skiptrace-direct-skip', status: 'not_configured' }
    );

    const hasUnhealthy = services.some((s) => s.status === 'disconnected');
    const health: HealthStatus = {
      status: hasUnhealthy ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      services,
    };

    return health;
  });

  // Readiness check (for Kubernetes/Cloud Run)
  fastify.get('/ready', async (_request, reply) => {
    // Check if critical services are available
    const isReady = true; // Add actual checks here

    if (isReady) {
      return { status: 'ready' };
    } else {
      reply.status(503);
      return { status: 'not_ready' };
    }
  });

  // Liveness check (for Kubernetes/Cloud Run)
  fastify.get('/live', async (_request, _reply) => {
    return { status: 'alive' };
  });
}
