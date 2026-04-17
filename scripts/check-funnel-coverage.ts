/**
 * Inspect dm_client_funnel date coverage — to see whether it has true
 * historical rows for a margin trend, or just a latest snapshot per domain.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

const envPath = resolve(__dirname, '../backend/.env');
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq > 0) {
    const key = t.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = t.slice(eq + 1).trim();
  }
}

const client = new RDSDataClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY!,
  },
});

async function sql(q: string) {
  const r = await client.send(
    new ExecuteStatementCommand({
      resourceArn: process.env.DB_AURORA_RESOURCE_ARN!,
      secretArn: process.env.DB_AURORA_SECRET_ARN!,
      database: 'grafana8020db',
      sql: q,
      includeResultMetadata: true,
    })
  );
  const cols = r.columnMetadata?.map((c) => c.name || '') || [];
  return (r.records || []).map((rec) => {
    const o: Record<string, unknown> = {};
    rec.forEach((f: Record<string, unknown>, i: number) => {
      if ('stringValue' in f) o[cols[i]] = f.stringValue;
      else if ('longValue' in f) o[cols[i]] = f.longValue;
      else if ('doubleValue' in f) o[cols[i]] = f.doubleValue;
      else o[cols[i]] = null;
    });
    return o;
  });
}

(async () => {
  console.log('=== dm_client_funnel row count & date range ===');
  console.table(await sql(`
    SELECT
      COUNT(*) AS total_rows,
      COUNT(DISTINCT domain) AS distinct_domains,
      COUNT(DISTINCT date::DATE) AS distinct_dates,
      MIN(date::TEXT) AS first_date,
      MAX(date::TEXT) AS last_date
    FROM dm_client_funnel
    WHERE domain IS NOT NULL
  `));

  console.log('\n=== rows per month (all time) ===');
  console.table(await sql(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
      COUNT(*) AS rows,
      COUNT(DISTINCT domain) AS domains,
      ROUND(SUM(total_cost)::numeric, 2) AS total_revenue,
      ROUND(SUM(COALESCE(total_pcm_cost,0))::numeric, 2) AS total_pcm_cost,
      ROUND(SUM(COALESCE(margin,0))::numeric, 2) AS total_margin
    FROM dm_client_funnel
    WHERE domain IS NOT NULL
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY DATE_TRUNC('month', date)
  `));

  console.log('\n=== sample of one domain over time ===');
  console.table(await sql(`
    WITH dom AS (
      SELECT domain FROM dm_client_funnel
      WHERE domain IS NOT NULL AND total_cost > 1000
      GROUP BY domain
      ORDER BY MAX(total_cost) DESC
      LIMIT 1
    )
    SELECT
      date::TEXT as date,
      total_sends,
      total_delivered,
      ROUND(total_cost::numeric, 2) AS total_cost,
      ROUND(COALESCE(total_pcm_cost, 0)::numeric, 2) AS total_pcm_cost,
      ROUND(COALESCE(margin, 0)::numeric, 2) AS margin
    FROM dm_client_funnel
    WHERE domain = (SELECT domain FROM dom)
    ORDER BY date
    LIMIT 30
  `));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
