import { readFileSync } from 'fs';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

try {
  const envContent = readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  console.error('Could not read .env.local');
  process.exit(1);
}

const client = new RDSDataClient({
  region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY!,
  },
});

const RESOURCE_ARN = process.env.DB_AURORA_RESOURCE_ARN!;
const SECRET_ARN = process.env.DB_AURORA_SECRET_ARN!;
const DATABASE = process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db';

async function run(sql: string) {
  const cmd = new ExecuteStatementCommand({
    resourceArn: RESOURCE_ARN, secretArn: SECRET_ARN, database: DATABASE, sql,
  });
  return client.send(cmd);
}

async function main() {
  console.log('=== Cleaning seed data from Aurora ===\n');

  // Count before
  for (const table of ['rr_campaign_snapshots', 'rr_daily_metrics', 'rr_pcm_alignment']) {
    const res = await run(`SELECT COUNT(*) as cnt FROM ${table}`);
    const count = res.records?.[0]?.[0]?.longValue ?? 0;
    console.log(`  ${table}: ${count} rows`);
  }

  console.log('\nDeleting seed data (domain = 8020rei_demo)...');
  
  // The seed script used domain '8020rei_demo' for all rows
  // Production data will use real domain names, so this is safe
  await run("DELETE FROM rr_campaign_snapshots WHERE domain = '8020rei_demo'");
  await run("DELETE FROM rr_daily_metrics WHERE domain = '8020rei_demo'");
  await run("DELETE FROM rr_pcm_alignment WHERE domain = '8020rei_demo'");

  console.log('\nAfter cleanup:');
  for (const table of ['rr_campaign_snapshots', 'rr_daily_metrics', 'rr_pcm_alignment']) {
    const res = await run(`SELECT COUNT(*) as cnt FROM ${table}`);
    const count = res.records?.[0]?.[0]?.longValue ?? 0;
    console.log(`  ${table}: ${count} rows`);
  }

  console.log('\nDone! Tables are clean and ready for production data.');
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });
