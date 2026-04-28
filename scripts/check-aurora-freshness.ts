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

function fmtAge(hours: number): string {
  if (hours < 1) return `${(hours * 60).toFixed(0)}min`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

async function main() {
  console.log('=== Aurora freshness probe ===');
  console.log(`now: ${new Date().toISOString()}\n`);

  const r = await q(`
    SELECT
      (SELECT MAX(snapshot_at)::text FROM rr_campaign_snapshots) AS rr_snapshots_latest,
      (SELECT EXTRACT(EPOCH FROM (NOW() - MAX(snapshot_at))) / 3600.0 FROM rr_campaign_snapshots) AS rr_snapshots_age_h,
      (SELECT MAX(date)::text FROM dm_client_funnel) AS funnel_latest,
      (SELECT EXTRACT(EPOCH FROM (NOW() - (SELECT MAX(date)::timestamp FROM dm_client_funnel))) / 3600.0) AS funnel_age_h,
      (SELECT MAX(date)::text FROM rr_daily_metrics) AS daily_latest,
      (SELECT EXTRACT(EPOCH FROM (NOW() - (SELECT MAX(date)::timestamp FROM rr_daily_metrics))) / 3600.0) AS daily_age_h,
      (SELECT MAX(checked_at)::text FROM rr_pcm_alignment) AS pcm_latest,
      (SELECT EXTRACT(EPOCH FROM (NOW() - MAX(checked_at))) / 3600.0 FROM rr_pcm_alignment) AS pcm_age_h
  `);

  const row = r?.[0];
  if (!row) { console.error('no row'); process.exit(1); }

  const get = (i: number) => row[i]?.stringValue ?? row[i]?.doubleValue ?? row[i]?.longValue ?? null;

  const rrLatest = String(get(0) ?? 'null');
  const rrAge = Number(get(1) ?? 0);
  const funnelLatest = String(get(2) ?? 'null');
  const funnelAge = Number(get(3) ?? 0);
  const dailyLatest = String(get(4) ?? 'null');
  const dailyAge = Number(get(5) ?? 0);
  const pcmLatest = String(get(6) ?? 'null');
  const pcmAge = Number(get(7) ?? 0);

  console.log(`rr_campaign_snapshots  latest: ${rrLatest}    age: ${fmtAge(rrAge)}`);
  console.log(`dm_client_funnel       latest: ${funnelLatest}      age: ${fmtAge(funnelAge)}`);
  console.log(`rr_daily_metrics       latest: ${dailyLatest}      age: ${fmtAge(dailyAge)}`);
  console.log(`rr_pcm_alignment       latest: ${pcmLatest}    age: ${fmtAge(pcmAge)}`);

  const maxAge = Math.max(rrAge, funnelAge, dailyAge, pcmAge);
  const verdict = maxAge < 2 ? '✅ within hourly cadence'
    : maxAge < 6 ? '⚠️  stale (>2h)'
    : '❌ critically stale (>6h)';
  console.log(`\nverdict: ${verdict} — oldest table is ${fmtAge(maxAge)} behind`);
}

main().catch(e => { console.error(e); process.exit(1); });
