/**
 * Verify the Pricing history chart's current-month override will correctly
 * show the LATEST observed daily rate (not the month-blended average) for
 * Apr 2026. Also reports what each closed month reports so we can sanity-check
 * the chart line.
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
const TEST = `'8020rei_demo','8020rei_migracion_test','_test_debug','_test_debug3','supertest_8020rei_com','sandbox_8020rei_com','qapre_8020rei_com','testing5_8020rei_com','showcaseproductsecomllc_8020rei_com'`;

function val(f: Field): unknown {
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.longValue !== undefined) return f.longValue;
  if (f.doubleValue !== undefined) return f.doubleValue;
  if (f.booleanValue !== undefined) return f.booleanValue;
  return null;
}
async function q(sql: string) {
  const res = await client.send(new ExecuteStatementCommand({
    resourceArn: RESOURCE_ARN, secretArn: SECRET_ARN, database: DATABASE, sql, includeResultMetadata: true,
  }));
  const cols = (res.columnMetadata || []).map(c => c.name || '');
  return (res.records || []).map(row => {
    const obj: Record<string, unknown> = {};
    row.forEach((f, i) => { obj[cols[i]] = val(f); });
    return obj;
  });
}

async function main() {
  console.log('\n=== Latest daily rate per mail class within current month ===');
  const currentMonth = new Date().toISOString().slice(0, 7);
  const latest = await q(`
    SELECT DISTINCT ON (mail_class)
      mail_class,
      date AS latest_date,
      ROUND((daily_cost / NULLIF(daily_sends, 0))::numeric, 4) AS latest_rate,
      daily_sends
    FROM dm_volume_summary
    WHERE mail_class IN ('standard','first_class')
      AND daily_sends > 0
      AND domain NOT IN (${TEST})
      AND to_char(date, 'YYYY-MM') = '${currentMonth}'
    ORDER BY mail_class, date DESC
  `);
  console.table(latest);

  console.log(`\n=== Monthly blend for ${currentMonth} (what the chart USED to show) ===`);
  const blend = await q(`
    SELECT
      mail_class,
      ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 4) AS blended_rate,
      SUM(daily_sends) AS pieces
    FROM dm_volume_summary
    WHERE mail_class IN ('standard','first_class')
      AND daily_sends > 0
      AND domain NOT IN (${TEST})
      AND to_char(date, 'YYYY-MM') = '${currentMonth}'
    GROUP BY mail_class
  `);
  console.table(blend);

  console.log('\n=== Diff: what the chart will now show vs blended ===');
  for (const m of ['standard', 'first_class']) {
    const l = latest.find(r => r.mail_class === m);
    const b = blend.find(r => r.mail_class === m);
    console.log(`${m}: was ${b?.blended_rate ?? '—'} (blended), now ${l?.latest_rate ?? '—'} (latest day ${l?.latest_date ?? '—'})`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
