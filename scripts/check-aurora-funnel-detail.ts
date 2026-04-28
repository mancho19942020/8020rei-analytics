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
  console.log('=== dm_client_funnel last 5 dates ===');
  const r1 = await q(`
    SELECT date::text, COUNT(*) AS rows, COUNT(DISTINCT domain) AS domains
    FROM dm_client_funnel
    GROUP BY date
    ORDER BY date DESC
    LIMIT 5
  `);
  for (const row of r1 ?? []) {
    console.log(`  ${row[0]?.stringValue}  rows: ${row[1]?.longValue}  domains: ${row[2]?.longValue}`);
  }

  console.log('\n=== rr_campaign_snapshots last 5 hourly buckets ===');
  const r2 = await q(`
    SELECT date_trunc('hour', snapshot_at)::text AS hr, COUNT(*) AS rows
    FROM rr_campaign_snapshots
    WHERE snapshot_at >= NOW() - INTERVAL '24 hours'
    GROUP BY hr
    ORDER BY hr DESC
    LIMIT 10
  `);
  for (const row of r2 ?? []) {
    console.log(`  ${row[0]?.stringValue}  rows: ${row[1]?.longValue}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
