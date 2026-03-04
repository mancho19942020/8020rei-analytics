/**
 * Aurora Client
 *
 * Connects to AWS Aurora PostgreSQL via RDS Data API.
 * Used by Next.js API routes to query Properties API usage metrics.
 *
 * Follows the same pattern as lib/bigquery.ts:
 * - Local dev: uses env vars from .env.local
 * - Production (Cloud Run): uses env vars from deployment config
 */

import {
  RDSDataClient,
  ExecuteStatementCommand,
  type ExecuteStatementCommandOutput,
  type SqlParameter,
  type Field,
} from '@aws-sdk/client-rds-data';

const RESOURCE_ARN = process.env.DB_AURORA_RESOURCE_ARN || '';
const SECRET_ARN = process.env.DB_AURORA_SECRET_ARN || '';
const DATABASE = process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db';

function createAuroraClient(): RDSDataClient | null {
  if (!RESOURCE_ARN || !SECRET_ARN) {
    console.log('[Aurora] Not configured — missing RESOURCE_ARN or SECRET_ARN');
    return null;
  }

  console.log('[Aurora] Initialized with RDS Data API credentials');
  return new RDSDataClient({
    region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY || '',
    },
  });
}

const client = createAuroraClient();

/**
 * Check if Aurora is configured and ready to use.
 */
export function isAuroraConfigured(): boolean {
  return client !== null;
}

/**
 * Execute a SQL query and return parsed rows as plain objects.
 */
export async function runAuroraQuery<T = Record<string, unknown>>(
  sql: string,
  parameters?: SqlParameter[],
  database?: string
): Promise<T[]> {
  if (!client) {
    throw new Error('Aurora is not configured. Check DB_AURORA_* env vars.');
  }

  const command = new ExecuteStatementCommand({
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN,
    database: database || DATABASE,
    sql,
    parameters,
    includeResultMetadata: true,
  });

  const result = await client.send(command);
  return parseResult(result) as T[];
}

function parseResult(
  result: ExecuteStatementCommandOutput
): Record<string, unknown>[] {
  const columns =
    result.columnMetadata?.map((c) => c.name || `col_${c.label}`) || [];

  if (!result.records || result.records.length === 0) return [];

  return result.records.map((row) =>
    Object.fromEntries(
      row.map((field, i) => [columns[i], extractFieldValue(field)])
    )
  );
}

function extractFieldValue(field: Field): unknown {
  if (field.isNull) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.longValue !== undefined) return Number(field.longValue);
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.blobValue !== undefined) return field.blobValue;
  return null;
}
