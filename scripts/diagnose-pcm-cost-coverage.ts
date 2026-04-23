/**
 * Diagnose PCM cost coverage — quantify exactly how many sends have a
 * stored daily_pcm_cost vs how many don't, across both the last 30 days
 * and all time. This is the number we need to quote back to the audit:
 * "X% of period sends have PCM cost tracked."
 *
 * Usage: npx tsx scripts/diagnose-pcm-cost-coverage.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

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

const TEST_DOMAINS = `'8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com', 'qapre_8020rei_com', 'testing5_8020rei_com', 'showcaseproductsecomllc_8020rei_com'`;

async function runQuery(sql: string): Promise<Record<string, unknown>[]> {
  const command = new ExecuteStatementCommand({
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN,
    database: DATABASE,
    sql,
    includeResultMetadata: true,
  });
  const result = await client.send(command);
  const columns = result.columnMetadata?.map(c => c.name || '') || [];
  return (result.records || []).map(record => {
    const obj: Record<string, unknown> = {};
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
}

async function main() {
  console.log('=== PCM Cost Coverage Diagnostic ===\n');

  // 1. Coverage in dm_volume_summary (30-day period)
  console.log('--- dm_volume_summary — last 30 days ---');
  const vs30 = await runQuery(`
    SELECT
      COUNT(*) as total_rows,
      SUM(daily_sends) as total_sends,
      SUM(CASE WHEN daily_pcm_cost > 0 THEN daily_sends ELSE 0 END) as sends_with_pcm,
      SUM(CASE WHEN daily_pcm_cost = 0 OR daily_pcm_cost IS NULL THEN daily_sends ELSE 0 END) as sends_missing_pcm,
      SUM(daily_cost) as total_revenue,
      SUM(daily_pcm_cost) as total_pcm_cost,
      SUM(daily_margin) as total_stored_margin,
      SUM(daily_cost) - SUM(COALESCE(daily_pcm_cost, 0)) as computed_margin
    FROM dm_volume_summary
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      AND daily_sends > 0
      AND (mail_class = 'all' OR mail_class IS NULL)
      AND domain NOT IN (${TEST_DOMAINS})
  `);
  const r30 = vs30[0];
  const totalSends30 = Number(r30.total_sends || 0);
  const withPcm30 = Number(r30.sends_with_pcm || 0);
  const missingPcm30 = Number(r30.sends_missing_pcm || 0);
  const revenue30 = Number(r30.total_revenue || 0);
  const pcmCost30 = Number(r30.total_pcm_cost || 0);
  const storedMargin30 = Number(r30.total_stored_margin || 0);
  const computedMargin30 = Number(r30.computed_margin || 0);
  const coverage30 = totalSends30 > 0 ? (withPcm30 / totalSends30) * 100 : 0;

  console.log(`  Total sends: ${totalSends30}`);
  console.log(`  Sends WITH PCM cost (>0): ${withPcm30}`);
  console.log(`  Sends WITHOUT PCM cost (0 or NULL): ${missingPcm30}`);
  console.log(`  Coverage: ${coverage30.toFixed(1)}%`);
  console.log(`  Revenue: $${revenue30.toFixed(2)}`);
  console.log(`  Stored PCM cost: $${pcmCost30.toFixed(2)}`);
  console.log(`  STORED margin (SUM(daily_margin)): $${storedMargin30.toFixed(2)}`);
  console.log(`  COMPUTED margin (revenue - pcm_cost): $${computedMargin30.toFixed(2)}`);
  console.log(`  DELTA (stored - computed): $${(storedMargin30 - computedMargin30).toFixed(2)}  <-- this is why the math doesn't close`);

  // 2. Same check on dm_client_funnel (all-time latest-per-domain)
  console.log('\n--- dm_client_funnel — latest per domain (all time) ---');
  const cf = await runQuery(`
    SELECT
      COUNT(*) as domain_count,
      SUM(f.total_sends) as total_sends,
      SUM(CASE WHEN f.total_pcm_cost > 0 THEN f.total_sends ELSE 0 END) as sends_with_pcm,
      SUM(CASE WHEN f.total_pcm_cost = 0 OR f.total_pcm_cost IS NULL THEN f.total_sends ELSE 0 END) as sends_missing_pcm,
      SUM(f.total_cost) as total_revenue,
      SUM(f.total_pcm_cost) as total_pcm_cost,
      SUM(f.margin) as total_stored_margin,
      SUM(f.total_cost) - SUM(COALESCE(f.total_pcm_cost, 0)) as computed_margin
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT domain, MAX(date) as md
      FROM dm_client_funnel
      WHERE domain NOT IN (${TEST_DOMAINS}) AND domain IS NOT NULL
      GROUP BY domain
    ) latest ON f.domain = latest.domain AND f.date = latest.md
    WHERE f.domain NOT IN (${TEST_DOMAINS}) AND f.domain IS NOT NULL
  `);
  const rcf = cf[0];
  const totalSendsCF = Number(rcf.total_sends || 0);
  const withPcmCF = Number(rcf.sends_with_pcm || 0);
  const missingPcmCF = Number(rcf.sends_missing_pcm || 0);
  const revenueCF = Number(rcf.total_revenue || 0);
  const pcmCostCF = Number(rcf.total_pcm_cost || 0);
  const storedMarginCF = Number(rcf.total_stored_margin || 0);
  const computedMarginCF = Number(rcf.computed_margin || 0);
  const coverageCF = totalSendsCF > 0 ? (withPcmCF / totalSendsCF) * 100 : 0;

  console.log(`  Distinct domains: ${rcf.domain_count}`);
  console.log(`  Total sends: ${totalSendsCF}`);
  console.log(`  Sends WITH PCM cost (>0): ${withPcmCF}`);
  console.log(`  Sends WITHOUT PCM cost: ${missingPcmCF}`);
  console.log(`  Coverage: ${coverageCF.toFixed(1)}%`);
  console.log(`  Revenue: $${revenueCF.toFixed(2)}`);
  console.log(`  Stored PCM cost: $${pcmCostCF.toFixed(2)}`);
  console.log(`  STORED margin (SUM(f.margin)): $${storedMarginCF.toFixed(2)}`);
  console.log(`  COMPUTED margin (revenue - pcm_cost): $${computedMarginCF.toFixed(2)}`);
  console.log(`  DELTA (stored - computed): $${(storedMarginCF - computedMarginCF).toFixed(2)}`);

  // 3. Per-domain breakdown — which clients have pcm_cost missing
  console.log('\n--- Per-domain PCM-cost coverage (latest snapshot) ---');
  const perDomain = await runQuery(`
    SELECT
      f.domain,
      f.total_sends,
      f.total_cost as revenue,
      f.total_pcm_cost as pcm_cost,
      f.margin as stored_margin,
      f.total_cost - COALESCE(f.total_pcm_cost, 0) as computed_margin,
      CASE
        WHEN f.total_pcm_cost > 0 THEN 'tracked'
        ELSE 'MISSING'
      END as status
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT domain, MAX(date) as md
      FROM dm_client_funnel
      WHERE domain NOT IN (${TEST_DOMAINS}) AND domain IS NOT NULL
      GROUP BY domain
    ) latest ON f.domain = latest.domain AND f.date = latest.md
    WHERE f.domain NOT IN (${TEST_DOMAINS}) AND f.domain IS NOT NULL
    ORDER BY f.total_sends DESC
  `);

  console.log('Domain                          | Sends  | Revenue    | PCM cost   | Stored margin | Computed margin | Delta      | Status');
  console.log('--------------------------------|--------|------------|------------|---------------|-----------------|------------|--------');
  for (const r of perDomain) {
    const dom = String(r.domain || '').padEnd(31).substring(0, 31);
    const sends = String(r.total_sends || 0).padStart(6);
    const rev = `$${Number(r.revenue || 0).toFixed(2)}`.padStart(10);
    const pcm = `$${Number(r.pcm_cost || 0).toFixed(2)}`.padStart(10);
    const sm = `$${Number(r.stored_margin || 0).toFixed(2)}`.padStart(13);
    const cm = `$${Number(r.computed_margin || 0).toFixed(2)}`.padStart(15);
    const delta = Number(r.stored_margin || 0) - Number(r.computed_margin || 0);
    const deltaStr = `${delta < 0 ? '-' : ''}$${Math.abs(delta).toFixed(2)}`.padStart(10);
    const status = String(r.status).padEnd(7);
    console.log(`${dom} | ${sends} | ${rev} | ${pcm} | ${sm} | ${cm} | ${deltaStr} | ${status}`);
  }

  console.log('\n=== END ===\n');
  console.log('Key takeaways for the audit:');
  console.log(`  - Period (30d): ${coverage30.toFixed(0)}% of sends have PCM cost tracked (${missingPcm30} of ${totalSends30} missing)`);
  console.log(`  - All time: ${coverageCF.toFixed(0)}% of sends have PCM cost tracked`);
  console.log(`  - STORED margin column diverges from revenue-minus-cost by $${Math.abs(storedMargin30 - computedMargin30).toFixed(2)} on the period and $${Math.abs(storedMarginCF - computedMarginCF).toFixed(2)} all-time`);
  console.log(`  - Fix: compute margin locally as (revenue - pcm_cost), not SUM(margin). Flag completeness.`);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
