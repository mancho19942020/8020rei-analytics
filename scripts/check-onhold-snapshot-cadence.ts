/**
 * Inspect rr_campaign_snapshots to understand how we can detect "stale" on-holds
 * without a row-level rapid_response_history table.
 *
 * Approach: if a campaign has had on_hold_count > 0 for N consecutive snapshots
 * spanning ≥ 7 days, those pieces are "stale" (should have been auto-delivered).
 *
 * Usage: npx tsx scripts/check-onhold-snapshot-cadence.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { RDSDataClient, ExecuteStatementCommand, type Field } from '@aws-sdk/client-rds-data';

function loadEnv(path: string) {
  try {
    const content = readFileSync(path, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch {}
}
loadEnv(resolve(__dirname, '../.env.local'));
loadEnv(resolve(__dirname, '../backend/.env'));

const aurora = new RDSDataClient({
  region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY || '',
  },
});
const RESOURCE_ARN = process.env.DB_AURORA_RESOURCE_ARN || '';
const SECRET_ARN = process.env.DB_AURORA_SECRET_ARN || '';
const DATABASE = process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db';
const TEST_DOMAINS = `'8020rei_demo','8020rei_migracion_test','_test_debug','_test_debug3','supertest_8020rei_com','sandbox_8020rei_com','qapre_8020rei_com','testing5_8020rei_com','showcaseproductsecomllc_8020rei_com'`;

function val(f: Field): unknown {
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.longValue !== undefined) return f.longValue;
  if (f.doubleValue !== undefined) return f.doubleValue;
  if (f.booleanValue !== undefined) return f.booleanValue;
  return null;
}
async function q(sql: string) {
  const res = await aurora.send(new ExecuteStatementCommand({
    resourceArn: RESOURCE_ARN, secretArn: SECRET_ARN, database: DATABASE, sql, includeResultMetadata: true,
  }));
  const cols = (res.columnMetadata || []).map(c => c.name || '');
  return (res.records || []).map(row => {
    const obj: Record<string, unknown> = {};
    row.forEach((f, i) => { obj[cols[i]] = val(f); });
    return obj;
  });
}

function hr(title: string) { console.log('\n' + '='.repeat(68) + '\n' + title + '\n' + '='.repeat(68)); }

async function main() {
  hr('rr_campaign_snapshots columns');
  const cols = await q(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'rr_campaign_snapshots' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  console.table(cols);

  hr('rr_campaign_snapshots row count + date range');
  const stats = await q(`
    SELECT
      COUNT(*) AS rows,
      MIN(snapshot_at) AS oldest,
      MAX(snapshot_at) AS newest,
      COUNT(DISTINCT domain) AS domains
    FROM rr_campaign_snapshots
  `);
  console.table(stats);

  hr('Snapshot cadence — rows per day');
  const cadence = await q(`
    SELECT
      DATE(snapshot_at) AS snap_date,
      COUNT(*) AS rows,
      COUNT(DISTINCT domain) AS domains
    FROM rr_campaign_snapshots
    WHERE snapshot_at >= CURRENT_DATE - INTERVAL '14 days'
    GROUP BY DATE(snapshot_at)
    ORDER BY snap_date DESC
  `);
  console.table(cadence);

  hr('Campaigns with on_hold_count > 0 that have been held for 7+ days');
  const stale = await q(`
    WITH per_campaign AS (
      SELECT
        domain, campaign_id, campaign_name,
        MAX(snapshot_at) AS last_snapshot,
        MIN(snapshot_at) FILTER (WHERE on_hold_count > 0) AS first_on_hold_seen,
        COUNT(DISTINCT DATE(snapshot_at)) FILTER (WHERE on_hold_count > 0) AS days_with_hold,
        MAX(on_hold_count) AS max_hold
      FROM rr_campaign_snapshots
      WHERE domain NOT IN (${TEST_DOMAINS})
      GROUP BY domain, campaign_id, campaign_name
    ),
    latest AS (
      SELECT DISTINCT ON (domain, campaign_id)
        domain, campaign_id, on_hold_count AS current_hold
      FROM rr_campaign_snapshots
      ORDER BY domain, campaign_id, snapshot_at DESC
    )
    SELECT
      p.domain,
      p.campaign_name,
      p.first_on_hold_seen,
      p.days_with_hold,
      l.current_hold,
      EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.first_on_hold_seen))::int AS days_since_first_hold
    FROM per_campaign p
    JOIN latest l ON l.domain = p.domain AND l.campaign_id = p.campaign_id
    WHERE l.current_hold > 0
      AND p.first_on_hold_seen <= CURRENT_TIMESTAMP - INTERVAL '7 days'
    ORDER BY days_since_first_hold DESC, l.current_hold DESC
    LIMIT 30
  `);
  console.table(stale);

  hr('Total current on-hold vs stale (7d+) on-hold');
  const totals = await q(`
    WITH per_campaign AS (
      SELECT
        domain, campaign_id,
        MIN(snapshot_at) FILTER (WHERE on_hold_count > 0) AS first_on_hold_seen
      FROM rr_campaign_snapshots
      WHERE domain NOT IN (${TEST_DOMAINS})
      GROUP BY domain, campaign_id
    ),
    latest AS (
      SELECT DISTINCT ON (domain, campaign_id)
        domain, campaign_id, on_hold_count AS current_hold
      FROM rr_campaign_snapshots
      WHERE domain NOT IN (${TEST_DOMAINS})
      ORDER BY domain, campaign_id, snapshot_at DESC
    )
    SELECT
      SUM(l.current_hold) AS total_current_hold,
      SUM(l.current_hold) FILTER (WHERE p.first_on_hold_seen <= CURRENT_TIMESTAMP - INTERVAL '7 days') AS stale_7d_hold,
      SUM(l.current_hold) FILTER (WHERE p.first_on_hold_seen > CURRENT_TIMESTAMP - INTERVAL '7 days') AS fresh_hold,
      COUNT(*) FILTER (WHERE l.current_hold > 0) AS campaigns_with_hold,
      COUNT(*) FILTER (WHERE l.current_hold > 0 AND p.first_on_hold_seen <= CURRENT_TIMESTAMP - INTERVAL '7 days') AS stale_campaigns
    FROM per_campaign p
    JOIN latest l ON l.domain = p.domain AND l.campaign_id = p.campaign_id
  `);
  console.table(totals);
}

main().catch(e => { console.error(e); process.exit(1); });
