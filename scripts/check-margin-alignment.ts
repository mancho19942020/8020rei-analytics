/**
 * Standalone margin-alignment probe. Reads dm_overview_cache.headline and
 * asserts: revenue − clientPcmCost − testCost === reported net company margin.
 *
 * Use when investigating any recurrence of the Overview vs Profitability
 * margin drift (session 8 bug). Also included as section I of the main
 * diagnose-cross-tab-consistency.ts.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { RDSDataClient, ExecuteStatementCommand, type Field } from '@aws-sdk/client-rds-data';

function loadEnv(p: string) {
  try {
    for (const line of readFileSync(p, 'utf-8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {}
}
loadEnv(resolve(__dirname, '../.env.local'));
loadEnv(resolve(__dirname, '../backend/.env'));

const client = new RDSDataClient({
  region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY || '',
  },
});
const RESOURCE_ARN = process.env.DB_AURORA_RESOURCE_ARN || '';
const SECRET_ARN = process.env.DB_AURORA_SECRET_ARN || '';
const DATABASE = process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db';

function val(f: Field): unknown {
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.longValue !== undefined) return f.longValue;
  if (f.doubleValue !== undefined) return f.doubleValue;
  if (f.booleanValue !== undefined) return f.booleanValue;
  return null;
}

async function main() {
  const res = await client.send(new ExecuteStatementCommand({
    resourceArn: RESOURCE_ARN, secretArn: SECRET_ARN, database: DATABASE,
    sql: `SELECT payload::text AS payload FROM dm_overview_cache WHERE cache_key = 'headline' LIMIT 1`,
    includeResultMetadata: true,
  }));
  const cols = (res.columnMetadata || []).map(c => c.name || '');
  const row = (res.records || [])[0];
  if (!row) {
    console.log('dm_overview_cache.headline row missing.');
    process.exit(1);
  }
  const entry: Record<string, unknown> = {};
  row.forEach((f, i) => { entry[cols[i]] = val(f); });
  const payload = JSON.parse(String(entry.payload));
  const cm = payload.companyMargin;
  const revenue = Number(cm.clientRevenue);
  const clientCost = Number(cm.pcmCostReal);
  const testCost = Number(cm.pcmCostTest);
  const computedGross = Math.round((revenue - clientCost) * 100) / 100;
  const computedNet = Math.round((computedGross - testCost) * 100) / 100;
  const reportedGross = Number(cm.grossMargin);
  const reportedNet = Number(cm.margin);
  console.table([
    { field: 'revenue', value: revenue.toFixed(2) },
    { field: 'clientPcmCost', value: clientCost.toFixed(2) },
    { field: 'testCost', value: testCost.toFixed(2) },
    { field: 'reportedGross', value: reportedGross.toFixed(2) },
    { field: 'computedGross', value: computedGross.toFixed(2) },
    { field: 'reportedNet (shows on Overview)', value: reportedNet.toFixed(2) },
    { field: 'computedNet (shows on Profitability)', value: computedNet.toFixed(2) },
  ]);
  const pass = Math.abs(reportedGross - computedGross) < 0.02 && Math.abs(reportedNet - computedNet) < 0.02;
  console.log(pass
    ? '\n✅ PASS — Overview Company margin and Profitability Net company margin will match.'
    : '\n❌ FAIL — drift detected. Check compute.ts companyMargin field vs pcm-validation/route.ts netCompanyMargin wiring.');
}
main().catch(e => { console.error(e); process.exit(1); });
