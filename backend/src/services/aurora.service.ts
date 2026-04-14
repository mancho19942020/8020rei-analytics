/**
 * Aurora Service
 *
 * Handles all AWS Aurora PostgreSQL operations.
 *
 * Two connection modes (prefers direct pg, falls back to RDS Data API):
 *
 * 1. DIRECT PG (preferred — free, fast):
 *    - Local: SSM tunnel → localhost:5433 → Aurora:5432
 *    - Production: Direct connection to Aurora endpoint (requires VPC/network path)
 *    - Env: AURORA_PG_HOST, AURORA_PG_PORT, AURORA_PG_USER, AURORA_PG_PASSWORD, AURORA_PG_DATABASE
 *
 * 2. RDS DATA API (fallback — per-request cost):
 *    - HTTP-based, no pg driver needed
 *    - Env: DB_AURORA_RESOURCE_ARN, DB_AURORA_SECRET_ARN, DB_AURORA_ACCESS_KEY_ID, etc.
 *
 * Database: grafana8020db (Aurora Serverless v2, us-east-1)
 */

import pg from 'pg';
const { Pool } = pg;

import {
  RDSDataClient,
  ExecuteStatementCommand,
  type ExecuteStatementCommandOutput,
  type SqlParameter,
  type Field,
} from '@aws-sdk/client-rds-data';

type ConnectionMode = 'pg' | 'rds-data-api' | 'none';

export class AuroraService {
  // Direct PG connection
  private pool: InstanceType<typeof Pool> | null = null;

  // RDS Data API (fallback)
  private rdsClient: RDSDataClient | null = null;
  private resourceArn: string;
  private secretArn: string;

  private database: string;
  private mode: ConnectionMode;

  constructor() {
    this.resourceArn = process.env.DB_AURORA_RESOURCE_ARN || '';
    this.secretArn = process.env.DB_AURORA_SECRET_ARN || '';
    this.database = process.env.AURORA_PG_DATABASE || process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db';

    // Prefer direct PG connection
    const pgHost = process.env.AURORA_PG_HOST;
    const pgUser = process.env.AURORA_PG_USER;
    const pgPassword = process.env.AURORA_PG_PASSWORD;

    if (pgHost && pgUser && pgPassword) {
      this.mode = 'pg';
      this.pool = new Pool({
        host: pgHost,
        port: parseInt(process.env.AURORA_PG_PORT || '5433', 10),
        user: pgUser,
        password: pgPassword,
        database: this.database,
        ssl: process.env.AURORA_PG_SSL === 'false' ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      console.log(`[Aurora] Initialized with direct PG connection → ${pgHost}:${process.env.AURORA_PG_PORT || '5433'}`);
    } else if (this.resourceArn && this.secretArn) {
      this.mode = 'rds-data-api';
      this.rdsClient = new RDSDataClient({
        region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY || '',
        },
      });
      console.log('[Aurora] Initialized with RDS Data API (fallback — consider switching to direct PG)');
    } else {
      this.mode = 'none';
      console.log('[Aurora] Not configured — set AURORA_PG_* or DB_AURORA_* env vars');
    }
  }

  isConfigured(): boolean {
    return this.mode !== 'none';
  }

  getConnectionMode(): ConnectionMode {
    return this.mode;
  }

  /**
   * Execute a SQL query and return parsed rows.
   */
  async executeQuery(
    sql: string,
    parameters?: SqlParameter[]
  ): Promise<Record<string, unknown>[]> {
    if (this.mode === 'pg') {
      return this.executeQueryPg(sql, parameters);
    }
    if (this.mode === 'rds-data-api') {
      return this.executeQueryRds(sql, parameters);
    }
    throw new Error('Aurora service is not configured. Check env vars.');
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
    if (this.mode === 'none') return false;
    try {
      await this.executeQuery('SELECT 1 AS ok');
      return true;
    } catch (error) {
      console.error(`[Aurora] Health check failed (${this.mode}):`, error);
      return false;
    }
  }

  /**
   * Gracefully shut down the connection pool (for clean server shutdown).
   */
  async shutdown(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('[Aurora] PG pool closed');
    }
  }

  // ─── Direct PG ─────────────────────────────────────────────────────────

  private async executeQueryPg(
    sql: string,
    parameters?: SqlParameter[]
  ): Promise<Record<string, unknown>[]> {
    if (!this.pool) throw new Error('PG pool not initialized');

    // Convert RDS Data API SqlParameter[] to pg positional params if present
    if (parameters && parameters.length > 0) {
      const { text, values } = this.convertRdsParamsToPg(sql, parameters);
      const result = await this.pool.query(text, values);
      return result.rows;
    }

    const result = await this.pool.query(sql);
    return result.rows;
  }

  /**
   * Convert RDS Data API named parameters (:paramName) to pg positional ($1, $2...).
   * This allows all existing SQL queries to work without modification.
   */
  private convertRdsParamsToPg(
    sql: string,
    parameters: SqlParameter[]
  ): { text: string; values: unknown[] } {
    const values: unknown[] = [];
    let text = sql;
    let paramIndex = 1;

    for (const param of parameters) {
      const name = param.name;
      if (!name) continue;

      const value = this.extractRdsParamValue(param.value);
      const regex = new RegExp(`:${name}\\b`, 'g');

      if (regex.test(text)) {
        text = text.replace(regex, `$${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    return { text, values };
  }

  private extractRdsParamValue(field?: Field): unknown {
    if (!field) return null;
    if (field.isNull) return null;
    if (field.stringValue !== undefined) return field.stringValue;
    if (field.longValue !== undefined) return Number(field.longValue);
    if (field.doubleValue !== undefined) return field.doubleValue;
    if (field.booleanValue !== undefined) return field.booleanValue;
    if (field.blobValue !== undefined) return field.blobValue;
    return null;
  }

  // ─── RDS Data API (fallback) ───────────────────────────────────────────

  private async executeQueryRds(
    sql: string,
    parameters?: SqlParameter[]
  ): Promise<Record<string, unknown>[]> {
    if (!this.rdsClient) throw new Error('RDS client not initialized');

    const command = new ExecuteStatementCommand({
      resourceArn: this.resourceArn,
      secretArn: this.secretArn,
      database: this.database,
      sql,
      parameters,
      includeResultMetadata: true,
    });

    const result = await this.rdsClient.send(command);
    return this.parseRdsResult(result);
  }

  private parseRdsResult(
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
