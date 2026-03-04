/**
 * Aurora Service
 *
 * Handles all AWS Aurora PostgreSQL operations via the RDS Data API.
 * Used for Properties API usage metrics from the api_token_usage_logs table.
 *
 * Connection method: RDS Data API (HTTP-based, no pg driver needed).
 * Database: grafana8020db (Aurora Serverless v2, us-east-1)
 */

import {
  RDSDataClient,
  ExecuteStatementCommand,
  type ExecuteStatementCommandOutput,
  type SqlParameter,
  type Field,
} from '@aws-sdk/client-rds-data';

export class AuroraService {
  private client: RDSDataClient;
  private resourceArn: string;
  private secretArn: string;
  private database: string;
  private configured: boolean;

  constructor() {
    this.resourceArn = process.env.DB_AURORA_RESOURCE_ARN || '';
    this.secretArn = process.env.DB_AURORA_SECRET_ARN || '';
    this.database = process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db';

    this.configured = !!(this.resourceArn && this.secretArn);

    this.client = new RDSDataClient({
      region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY || '',
      },
    });

    if (this.configured) {
      console.log('[Aurora] Initialized with RDS Data API credentials');
    } else {
      console.log('[Aurora] Not configured — missing RESOURCE_ARN or SECRET_ARN');
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Execute a SQL query via RDS Data API and return parsed rows.
   */
  async executeQuery(
    sql: string,
    parameters?: SqlParameter[]
  ): Promise<Record<string, unknown>[]> {
    if (!this.configured) {
      throw new Error('Aurora service is not configured. Check env vars.');
    }

    const command = new ExecuteStatementCommand({
      resourceArn: this.resourceArn,
      secretArn: this.secretArn,
      database: this.database,
      sql,
      parameters,
      includeResultMetadata: true,
    });

    const result = await this.client.send(command);
    return this.parseResult(result);
  }

  /**
   * Execute a SQL query and return a single scalar value.
   */
  async executeScalar<T = unknown>(
    sql: string,
    parameters?: SqlParameter[]
  ): Promise<T | null> {
    const rows = await this.executeQuery(sql, parameters);
    if (rows.length === 0) return null;
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);
    if (keys.length === 0) return null;
    return firstRow[keys[0]] as T;
  }

  /**
   * Health check — run a simple SELECT 1.
   */
  async isConnected(): Promise<boolean> {
    if (!this.configured) return false;
    try {
      await this.executeQuery('SELECT 1 AS ok');
      return true;
    } catch (error) {
      console.error('[Aurora] Health check failed:', error);
      return false;
    }
  }

  /**
   * Parse the RDS Data API column-based response into plain JS objects.
   */
  private parseResult(
    result: ExecuteStatementCommandOutput
  ): Record<string, unknown>[] {
    const columns =
      result.columnMetadata?.map((c) => c.name || `col_${c.label}`) || [];

    if (!result.records || result.records.length === 0) return [];

    return result.records.map((row) =>
      Object.fromEntries(
        row.map((field, i) => [columns[i], this.extractFieldValue(field)])
      )
    );
  }

  /**
   * Extract a typed value from an RDS Data API Field.
   */
  private extractFieldValue(field: Field): unknown {
    if (field.isNull) return null;
    if (field.stringValue !== undefined) return field.stringValue;
    if (field.longValue !== undefined) return Number(field.longValue);
    if (field.doubleValue !== undefined) return field.doubleValue;
    if (field.booleanValue !== undefined) return field.booleanValue;
    if (field.blobValue !== undefined) return field.blobValue;
    return null;
  }
}
