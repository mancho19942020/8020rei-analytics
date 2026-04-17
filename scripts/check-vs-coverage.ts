import { readFileSync } from 'fs';
import { resolve } from 'path';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

for (const p of ['../backend/.env', '../.env.local']) {
  try {
    const c = readFileSync(resolve(__dirname, p), 'utf-8');
    for (const line of c.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i > 0) {
        const k = t.slice(0, i).trim();
        const v = t.slice(i + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch {}
}

const client = new RDSDataClient({
  region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY || '',
  },
});

async function run(sql: string) {
  const r = await client.send(new ExecuteStatementCommand({
    resourceArn: process.env.DB_AURORA_RESOURCE_ARN || '',
    secretArn: process.env.DB_AURORA_SECRET_ARN || '',
    database: process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db',
    sql,
    includeResultMetadata: true,
  }));
  const cols = r.columnMetadata?.map(c => c.name || '') || [];
  return (r.records || []).map(rec => {
    const o: Record<string, unknown> = {};
    rec.forEach((f, i) => {
      const k = cols[i];
      o[k] = 'stringValue' in f ? f.stringValue : 'longValue' in f ? f.longValue : 'doubleValue' in f ? f.doubleValue : null;
    });
    return o;
  });
}

async function main() {
  console.log('dm_volume_summary coverage:');
  console.log(await run(`SELECT MIN(date)::text as min_d, MAX(date)::text as max_d, COUNT(DISTINCT date) as days, COUNT(*) as rows FROM dm_volume_summary WHERE daily_sends > 0`));

  console.log('\ndm_property_conversions coverage by first_sent_date:');
  console.log(await run(`SELECT MIN(first_sent_date)::text as min_d, MAX(first_sent_date)::text as max_d, COUNT(DISTINCT first_sent_date::date) as days FROM dm_property_conversions WHERE first_sent_date IS NOT NULL`));

  console.log('\ndm_volume_summary rows per month:');
  console.log(await run(`
    SELECT TO_CHAR(date, 'YYYY-MM') as mo, SUM(daily_sends) as pieces, SUM(daily_cost) as revenue
    FROM dm_volume_summary
    WHERE daily_sends > 0
      AND (mail_class = 'all' OR mail_class IS NULL)
    GROUP BY TO_CHAR(date, 'YYYY-MM')
    ORDER BY mo DESC
    LIMIT 6
  `));
}
main().catch(console.error);
