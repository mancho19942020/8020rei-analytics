/**
 * Configuration
 *
 * Centralized configuration management for the backend API.
 * All environment variables are validated and typed here.
 */

import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(4001),
  API_HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Frontend URL (for CORS)
  FRONTEND_URL: z.string().url().optional().default('http://localhost:4000'),

  // BigQuery
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().optional(),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),

  // Future integrations
  SALESFORCE_CLIENT_ID: z.string().optional(),
  SALESFORCE_CLIENT_SECRET: z.string().optional(),
  SALESFORCE_INSTANCE_URL: z.string().url().optional(),

  BATCH_ELITES_API_KEY: z.string().optional(),
  BATCH_ELITES_API_URL: z.string().url().optional(),

  DIRECT_SKIP_API_KEY: z.string().optional(),
  DIRECT_SKIP_API_URL: z.string().url().optional(),

  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
});

// Parse and validate environment variables
function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}

// Export validated config
export const config = loadConfig();

// Export typed config interface
export type Config = z.infer<typeof envSchema>;

// Helper to check if a data source is configured
export const isDataSourceConfigured = {
  bigquery: () => !!config.GOOGLE_APPLICATION_CREDENTIALS_JSON,
  redis: () => !!config.REDIS_URL,
  salesforce: () => !!(config.SALESFORCE_CLIENT_ID && config.SALESFORCE_CLIENT_SECRET),
  batchElites: () => !!config.BATCH_ELITES_API_KEY,
  directSkip: () => !!config.DIRECT_SKIP_API_KEY,
  aws: () => !!(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY),
};
