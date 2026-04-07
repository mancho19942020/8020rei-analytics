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
  console.log('=== Aurora Table Audit ===\n');

  const r1 = await q('SELECT DISTINCT domain FROM rr_campaign_snapshots');
  console.log('Campaign snapshot domains:', r1?.map(r => r[0]?.stringValue));

  const r2 = await q('SELECT DISTINCT domain FROM rr_daily_metrics');
  console.log('Daily metrics domains:', r2?.map(r => r[0]?.stringValue));

  const r3 = await q('SELECT DISTINCT domain FROM rr_pcm_alignment');
  console.log('PCM alignment domains:', r3?.map(r => r[0]?.stringValue));

  const counts = await q(`
    SELECT
      (SELECT COUNT(*) FROM rr_campaign_snapshots) as c1,
      (SELECT COUNT(*) FROM rr_daily_metrics) as c2,
      (SELECT COUNT(*) FROM rr_pcm_alignment) as c3
  `);
  console.log('\nRow counts:');
  console.log('  campaign_snapshots:', counts?.[0]?.[0]?.longValue);
  console.log('  daily_metrics:', counts?.[0]?.[1]?.longValue);
  console.log('  pcm_alignment:', counts?.[0]?.[2]?.longValue);

  // Check non-demo data
  const realSnap = await q("SELECT COUNT(*) FROM rr_campaign_snapshots WHERE domain != '8020rei_demo'");
  const realDaily = await q("SELECT COUNT(*) FROM rr_daily_metrics WHERE domain != '8020rei_demo'");
  const realPcm = await q("SELECT COUNT(*) FROM rr_pcm_alignment WHERE domain != '8020rei_demo'");
  console.log('\nReal (non-demo) rows:');
  console.log('  campaign_snapshots:', realSnap?.[0]?.[0]?.longValue);
  console.log('  daily_metrics:', realDaily?.[0]?.[0]?.longValue);
  console.log('  pcm_alignment:', realPcm?.[0]?.[0]?.longValue);
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
