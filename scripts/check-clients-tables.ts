/**
 * Scan Aurora for any tables that could give us "total 8020REI client count"
 * (the denominator for the Overview adoption rate widget).
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

const aurora = new RDSDataClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY!,
  },
});

async function sql(query: string): Promise<Record<string, unknown>[]> {
  const r = await aurora.send(
    new ExecuteStatementCommand({
      resourceArn: process.env.DB_AURORA_RESOURCE_ARN,
      secretArn: process.env.DB_AURORA_SECRET_ARN,
      database: 'grafana8020db',
      sql: query,
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
      else if ('isNull' in f) o[cols[i]] = null;
      else o[cols[i]] = JSON.stringify(f);
    });
    return o;
  });
}

(async () => {
  const all = await sql(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log('All public tables:');
  for (const r of all) console.log(`  ${r.table_name}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
