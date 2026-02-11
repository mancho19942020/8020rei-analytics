/**
 * 8020METRICS HUB - Backend API
 *
 * This is the main entry point for the backend API service.
 * It handles data integration from multiple sources:
 * - BigQuery (GA4 Analytics)
 * - Salesforce (CRM data)
 * - AWS (Pipelines, Aurora, Athena)
 * - Skip Trace providers (Batch Elites, Direct Skip)
 * - QA systems (Back Office, Slack)
 * - ML Models (Data Science)
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import { analyticsRoutes } from './routes/analytics.js';
import { healthRoutes } from './routes/health.js';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
});

// Register plugins
async function registerPlugins() {
  // CORS - Allow frontend to connect
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:4000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });
}

// Register routes
async function registerRoutes() {
  // Health check routes
  await fastify.register(healthRoutes, { prefix: '/api/health' });

  // Analytics routes (BigQuery GA4)
  await fastify.register(analyticsRoutes, { prefix: '/api/v1/analytics' });

  // Future routes (to be implemented):
  // await fastify.register(salesforceRoutes, { prefix: '/api/v1/salesforce' });
  // await fastify.register(pipelinesRoutes, { prefix: '/api/v1/pipelines' });
  // await fastify.register(skiptraceRoutes, { prefix: '/api/v1/skiptrace' });
  // await fastify.register(qaRoutes, { prefix: '/api/v1/qa' });
  // await fastify.register(mlRoutes, { prefix: '/api/v1/ml' });
}

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    const port = parseInt(process.env.API_PORT || '4001', 10);
    const host = process.env.API_HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           8020METRICS HUB - Backend API                   ║
╠═══════════════════════════════════════════════════════════╣
║  Server running at: http://${host}:${port}                     ║
║  Health check: http://${host}:${port}/api/health               ║
║  Analytics API: http://${host}:${port}/api/v1/analytics        ║
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

start();
