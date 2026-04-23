/**
 * External-agent prompt query #2: does dm_volume_summary show a price
 * transition $0.63 → $0.66 (standard) and $0.87 → $0.90 (first class)?
 * Also reports Aurora target + cluster id so we can confirm prod vs QA.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { RDSDataClient, ExecuteStatementCommand, type Field } from '@aws-sdk/client-rds-data';

function loadEnv(p: string) {
  try { for (const l of readFileSync(p,'utf-8').split('\n')) { const t=l.trim(); if(!t||t.startsWith('#'))continue; const i=t.indexOf('='); if(i<0)continue; const k=t.slice(0,i).trim(); const v=t.slice(i+1).trim().replace(/^["']|["']$/g,''); if(!process.env[k]) process.env[k]=v; } } catch {}
}
loadEnv(resolve(__dirname, '../.env.local'));
loadEnv(resolve(__dirname, '../backend/.env'));

const client = new RDSDataClient({
  region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
  credentials: { accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID || '', secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY || '' },
});
function val(f: Field): unknown {
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.longValue !== undefined) return f.longValue;
  if (f.doubleValue !== undefined) return f.doubleValue;
  if (f.booleanValue !== undefined) return f.booleanValue;
  return null;
}
async function q(sql: string) {
  const res = await client.send(new ExecuteStatementCommand({
    resourceArn: process.env.DB_AURORA_RESOURCE_ARN || '',
    secretArn: process.env.DB_AURORA_SECRET_ARN || '',
    database: process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db',
    sql, includeResultMetadata: true,
  }));
  const cols = (res.columnMetadata || []).map(c => c.name || '');
  return (res.records || []).map(row => { const obj: Record<string, unknown> = {}; row.forEach((f, i) => { obj[cols[i]] = val(f); }); return obj; });
}
const TEST = `'8020rei_demo','8020rei_migracion_test','_test_debug','_test_debug3','supertest_8020rei_com','sandbox_8020rei_com','qapre_8020rei_com','testing5_8020rei_com','showcaseproductsecomllc_8020rei_com'`;

async function main() {
  console.log('Aurora DB:', process.env.AWS_AURORA_GRAFANA_DB);
  const arn = process.env.DB_AURORA_RESOURCE_ARN || '';
  const clusterPart = arn.split(':cluster:')[1] || arn;
  console.log('Aurora cluster id:', clusterPart);
  console.log();

  const rows = await q(`
    SELECT mail_class, date::text AS date,
           SUM(daily_cost)::numeric AS cost,
           SUM(daily_sends) AS sends,
           ROUND((SUM(daily_cost) / NULLIF(SUM(daily_sends),0))::numeric, 4) AS implied_unit_price
    FROM dm_volume_summary
    WHERE date >= CURRENT_DATE - 30
      AND daily_sends > 0
      AND domain NOT IN (${TEST})
    GROUP BY mail_class, date
    ORDER BY mail_class, date DESC
  `);
  console.table(rows);

  // Per-day rate transition
  console.log('\nPer-class rate transition summary:');
  const byClass: Record<string, Array<{date: string; rate: number}>> = { standard: [], first_class: [] };
  for (const r of rows) {
    const mc = String(r.mail_class);
    if (!byClass[mc]) continue;
    byClass[mc].push({ date: String(r.date), rate: Number(r.implied_unit_price) });
  }
  for (const mc of Object.keys(byClass)) {
    const series = byClass[mc].sort((a, b) => a.date.localeCompare(b.date));
    let prev: number | null = null;
    const transitions: Array<{date: string; from: number; to: number}> = [];
    for (const p of series) {
      if (prev !== null && Math.abs(p.rate - prev) > 0.005) {
        transitions.push({ date: p.date, from: prev, to: p.rate });
      }
      prev = p.rate;
    }
    console.log(`  ${mc}: ${series.length} days, ${transitions.length} transitions`);
    for (const t of transitions) console.log(`    ${t.date}: $${t.from.toFixed(4)} → $${t.to.toFixed(4)}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
