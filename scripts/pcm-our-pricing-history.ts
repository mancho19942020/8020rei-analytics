/**
 * Our Pricing History — Query Aurora for what WE charged customers over time
 *
 * Pulls dm_volume_summary daily data to compute effective per-piece customer
 * rates over the full history, aligned with PCM invoice pricing eras.
 *
 * Usage: npx tsx scripts/pcm-our-pricing-history.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  RDSDataClient,
  ExecuteStatementCommand,
} from '@aws-sdk/client-rds-data';

// Load .env from backend
const envPath = resolve(__dirname, '../backend/.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// Also load .env.local from the project root for Aurora credentials
try {
  const envLocalPath = resolve(__dirname, '../.env.local');
  const envLocalContent = readFileSync(envLocalPath, 'utf-8');
  for (const line of envLocalContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch { /* .env.local may not exist */ }

const RESOURCE_ARN = process.env.DB_AURORA_RESOURCE_ARN || '';
const SECRET_ARN = process.env.DB_AURORA_SECRET_ARN || '';
const DATABASE = process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db';

const client = new RDSDataClient({
  region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY || '',
  },
});

async function runQuery(sql: string): Promise<any[]> {
  const command = new ExecuteStatementCommand({
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN,
    database: DATABASE,
    sql,
    includeResultMetadata: true,
  });

  const result = await client.send(command);
  const columns = result.columnMetadata?.map(c => c.name || '') || [];
  const rows = (result.records || []).map(record => {
    const obj: Record<string, any> = {};
    record.forEach((field, i) => {
      const col = columns[i];
      if ('stringValue' in field) obj[col] = field.stringValue;
      else if ('longValue' in field) obj[col] = field.longValue;
      else if ('doubleValue' in field) obj[col] = field.doubleValue;
      else if ('booleanValue' in field) obj[col] = field.booleanValue;
      else if ('isNull' in field) obj[col] = null;
      else obj[col] = JSON.stringify(field);
    });
    return obj;
  });
  return rows;
}

async function main() {
  console.log('=== Our Customer Pricing History vs PCM Invoice Rates ===\n');

  // Query 1: Check what columns exist in dm_volume_summary
  console.log('--- Checking dm_volume_summary schema ---');
  try {
    const schemaRows = await runQuery(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'dm_volume_summary'
      ORDER BY ordinal_position
    `);
    console.log('Columns:');
    for (const r of schemaRows) {
      console.log(`  ${r.column_name}: ${r.data_type}`);
    }
    console.log('');
  } catch (e: any) {
    console.log('Schema query error:', e.message, '\n');
  }

  // Query 2: Get monthly aggregated pricing from dm_volume_summary
  // This gives us effective per-piece rates over time
  console.log('--- Monthly Customer Pricing History (dm_volume_summary) ---\n');
  try {
    const monthlyRows = await runQuery(`
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month,
        COALESCE(mail_class, 'all') as mail_class,
        SUM(daily_sends) as total_sends,
        SUM(daily_cost) as total_revenue,
        CASE WHEN SUM(daily_sends) > 0
          THEN ROUND(SUM(daily_cost) / SUM(daily_sends), 4)
          ELSE 0 END as effective_rate_per_piece,
        SUM(daily_pcm_cost) as total_pcm_cost,
        CASE WHEN SUM(daily_sends) > 0
          THEN ROUND(SUM(daily_pcm_cost) / SUM(daily_sends), 4)
          ELSE 0 END as effective_pcm_rate
      FROM dm_volume_summary
      WHERE domain NOT IN ('8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com')
      GROUP BY TO_CHAR(date, 'YYYY-MM'), COALESCE(mail_class, 'all')
      ORDER BY month, mail_class
    `);

    if (monthlyRows.length === 0) {
      console.log('No data found in dm_volume_summary.\n');
    } else {
      console.log('Month     | Mail Class   | Sends | Our Revenue | Eff Rate/pc | PCM Cost    | PCM Rate/pc');
      console.log('----------|-------------|-------|-------------|-------------|-------------|------------');
      for (const r of monthlyRows) {
        const mc = (r.mail_class || 'all').padEnd(12);
        const sends = String(r.total_sends || 0).padStart(5);
        const rev = `$${Number(r.total_revenue || 0).toFixed(2)}`.padStart(11);
        const rate = r.effective_rate_per_piece ? `$${Number(r.effective_rate_per_piece).toFixed(4)}`.padStart(11) : '     —     ';
        const pcmCost = r.total_pcm_cost != null ? `$${Number(r.total_pcm_cost || 0).toFixed(2)}`.padStart(11) : '     —     ';
        const pcmRate = r.effective_pcm_rate ? `$${Number(r.effective_pcm_rate).toFixed(4)}`.padStart(11) : '     —     ';
        console.log(`${r.month}    | ${mc} | ${sends} | ${rev} | ${rate} | ${pcmCost} | ${pcmRate}`);
      }
    }
  } catch (e: any) {
    console.log('Monthly query error:', e.message);
  }

  // Query 3: Weekly breakdown for the last 12 months to catch rate changes
  console.log('\n\n--- Weekly Customer Rate (blended, all mail classes) ---\n');
  try {
    const weeklyRows = await runQuery(`
      SELECT
        DATE_TRUNC('week', date)::date as week_start,
        SUM(daily_sends) as sends,
        SUM(daily_cost) as revenue,
        CASE WHEN SUM(daily_sends) > 0
          THEN ROUND(SUM(daily_cost) / SUM(daily_sends), 4)
          ELSE 0 END as rate
      FROM dm_volume_summary
      WHERE domain NOT IN ('8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com')
        AND (mail_class = 'all' OR mail_class IS NULL)
      GROUP BY DATE_TRUNC('week', date)
      HAVING SUM(daily_sends) > 0
      ORDER BY week_start
    `);

    if (weeklyRows.length > 0) {
      console.log('Week Starting  | Sends | Revenue     | Rate/piece');
      console.log('---------------|-------|-------------|----------');
      for (const r of weeklyRows) {
        const date = String(r.week_start || '').substring(0, 10);
        const sends = String(r.sends || 0).padStart(5);
        const rev = `$${Number(r.revenue || 0).toFixed(2)}`.padStart(11);
        const rate = `$${Number(r.rate || 0).toFixed(4)}`.padStart(9);
        console.log(`${date}     | ${sends} | ${rev} | ${rate}`);
      }
    }
  } catch (e: any) {
    console.log('Weekly query error:', e.message);
  }

  // Query 4: Check dm_client_funnel for per-client rate differences
  console.log('\n\n--- Per-Client Effective Rates (latest snapshot) ---\n');
  try {
    const clientRows = await runQuery(`
      SELECT
        domain,
        total_sends,
        total_cost as revenue,
        CASE WHEN total_sends > 0
          THEN ROUND(total_cost / total_sends, 4)
          ELSE 0 END as rate_per_piece,
        total_pcm_cost,
        margin,
        margin_pct
      FROM dm_client_funnel
      WHERE date = (SELECT MAX(date) FROM dm_client_funnel)
        AND domain NOT IN ('8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com')
        AND total_sends > 0
      ORDER BY total_sends DESC
    `);

    if (clientRows.length > 0) {
      console.log('Domain                          | Sends  | Revenue     | Rate/pc  | PCM Cost    | Margin');
      console.log('--------------------------------|--------|-------------|----------|-------------|--------');
      for (const r of clientRows) {
        const dom = String(r.domain || '').padEnd(31).substring(0, 31);
        const sends = String(r.total_sends || 0).padStart(6);
        const rev = `$${Number(r.revenue || 0).toFixed(2)}`.padStart(11);
        const rate = `$${Number(r.rate_per_piece || 0).toFixed(4)}`.padStart(8);
        const pcm = r.total_pcm_cost != null ? `$${Number(r.total_pcm_cost || 0).toFixed(2)}`.padStart(11) : '     —     ';
        const margin = r.margin != null ? `$${Number(r.margin || 0).toFixed(2)}`.padStart(8) : '   —   ';
        console.log(`${dom} | ${sends} | ${rev} | ${rate} | ${pcm} | ${margin}`);
      }
    }
  } catch (e: any) {
    console.log('Client query error:', e.message);
  }

  // Query 5: Check if there are distinct unit_cost values across dates
  // This would show if our pricing changed
  console.log('\n\n--- Distinct Effective Rates Found (grouped by rate) ---\n');
  try {
    const rateGroups = await runQuery(`
      SELECT
        ROUND(daily_cost / NULLIF(daily_sends, 0), 4) as rate,
        MIN(date) as first_seen,
        MAX(date) as last_seen,
        COUNT(*) as days_at_rate,
        SUM(daily_sends) as total_sends_at_rate
      FROM dm_volume_summary
      WHERE domain NOT IN ('8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com')
        AND daily_sends > 0
        AND (mail_class = 'all' OR mail_class IS NULL)
      GROUP BY ROUND(daily_cost / NULLIF(daily_sends, 0), 4)
      HAVING SUM(daily_sends) >= 5
      ORDER BY rate
    `);

    if (rateGroups.length > 0) {
      console.log('Rate/piece | First Seen  | Last Seen   | # Days | Total Sends');
      console.log('-----------|-------------|-------------|--------|------------');
      for (const r of rateGroups) {
        const rate = `$${Number(r.rate || 0).toFixed(4)}`.padStart(10);
        const first = String(r.first_seen || '').substring(0, 10);
        const last = String(r.last_seen || '').substring(0, 10);
        const days = String(r.days_at_rate || 0).padStart(6);
        const sends = String(r.total_sends_at_rate || 0).padStart(10);
        console.log(`${rate} | ${first} | ${last} | ${days} | ${sends}`);
      }
    }
  } catch (e: any) {
    console.log('Rate groups query error:', e.message);
  }

  console.log('\n=== END ===');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
