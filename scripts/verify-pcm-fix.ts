import { readFileSync } from 'fs';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

try {
  const envContent = readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
} catch { process.exit(1); }

const client = new RDSDataClient({
  region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
  credentials: { accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID!, secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY! },
});

async function q(sql: string) {
  const res = await client.send(new ExecuteStatementCommand({
    resourceArn: process.env.DB_AURORA_RESOURCE_ARN!, secretArn: process.env.DB_AURORA_SECRET_ARN!,
    database: process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db', sql,
  }));
  return res.records;
}

async function main() {
  console.log('=== PR #1882 Verification: PCM Data Fix ===');
  console.log('Expected: total_sends ≈ 23,038 (PostcardMania actual)\n');

  // 1. dm_client_funnel — latest snapshot per domain (correct query)
  const funnel = await q(`
    SELECT f.domain, f.total_sends, f.total_delivered, f.total_cost, f.total_properties_mailed, f.date::text
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT domain, campaign_type, MAX(date) AS max_date
      FROM dm_client_funnel GROUP BY domain, campaign_type
    ) latest ON f.domain = latest.domain
      AND f.campaign_type = latest.campaign_type
      AND f.date = latest.max_date
    WHERE f.domain NOT IN ('8020rei_demo','8020rei_migracion_test','_test_debug','_test_debug3','supertest_8020rei_com','sandbox_8020rei_com')
    ORDER BY f.total_sends DESC
  `);

  console.log('--- dm_client_funnel (latest snapshot per domain) ---');
  let totalSends = 0, totalDelivered = 0, totalCost = 0;
  funnel?.forEach((r: any) => {
    const domain = r[0]?.stringValue || '';
    const sends = r[1]?.longValue || 0;
    const delivered = r[2]?.longValue || 0;
    const cost = parseFloat(r[3]?.stringValue || r[3]?.doubleValue || '0');
    const mailed = r[4]?.longValue || 0;
    const date = r[5]?.stringValue || '';
    totalSends += sends;
    totalDelivered += delivered;
    totalCost += cost;
    console.log(`  ${domain}: sends=${sends}, delivered=${delivered}, cost=$${cost.toFixed(2)}, mailed_props=${mailed}, date=${date}`);
  });
  console.log(`\n  TOTAL: sends=${totalSends}, delivered=${totalDelivered}, cost=$${totalCost.toFixed(2)}`);
  console.log(`  PCM reference: sends=23,038, cost=$17,014.13`);
  console.log(`  Match: ${Math.abs(totalSends - 23038) < 2000 ? 'CLOSE' : 'MISMATCH — investigate'}`);

  // 2. dm_volume_summary — latest per domain
  console.log('\n--- dm_volume_summary (latest per domain) ---');
  const volume = await q(`
    SELECT domain, cumulative_sends, cumulative_delivered, cumulative_cost, date::text
    FROM dm_volume_summary
    WHERE date = (SELECT MAX(date) FROM dm_volume_summary)
      AND domain NOT IN ('8020rei_demo','8020rei_migracion_test','_test_debug','_test_debug3','supertest_8020rei_com','sandbox_8020rei_com')
    ORDER BY cumulative_sends DESC
  `);

  let volSends = 0, volCost = 0;
  volume?.forEach((r: any) => {
    const domain = r[0]?.stringValue || '';
    const sends = r[1]?.longValue || 0;
    const cost = parseFloat(r[3]?.stringValue || r[3]?.doubleValue || '0');
    const date = r[4]?.stringValue || '';
    volSends += sends;
    volCost += cost;
    console.log(`  ${domain}: cumulative_sends=${sends}, cost=$${cost.toFixed(2)}, date=${date}`);
  });
  console.log(`\n  TOTAL: cumulative_sends=${volSends}, cost=$${volCost.toFixed(2)}`);

  // 3. Cross-validation
  console.log('\n--- Cross-validation ---');
  console.log(`  dm_client_funnel total_sends: ${totalSends}`);
  console.log(`  dm_volume_summary cumulative_sends: ${volSends}`);
  console.log(`  PostcardMania dashboard: 23,038`);
  console.log(`  Delta (funnel vs PCM): ${totalSends - 23038} (${((totalSends / 23038 - 1) * 100).toFixed(1)}%)`);
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
