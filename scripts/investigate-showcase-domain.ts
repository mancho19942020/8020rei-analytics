/**
 * Investigate the showcaseproductsecomllc_8020rei_com orphan domain.
 *
 * Aurora has 1 campaign; PCM has 0 orders. This script surfaces every
 * Aurora row that mentions the domain, plus a cross-check against PCM.
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

const PCM_BASE = 'https://v3.pcmintegrations.com';
let pcmToken: string | null = null;

async function pcmAuth(): Promise<string> {
  if (pcmToken) return pcmToken;
  const r = await fetch(`${PCM_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ apiKey: process.env.PCM_API_KEY, apiSecret: process.env.PCM_API_SECRET }),
  });
  pcmToken = ((await r.json()) as { token: string }).token;
  return pcmToken!;
}

async function pcmGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await pcmAuth();
  const url = new URL(`${PCM_BASE}${path}`);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  return r.json() as Promise<T>;
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

const DOMAIN = 'showcaseproductsecomllc_8020rei_com';

async function main() {
  console.log(`\n━━━ Investigating orphan domain: ${DOMAIN} ━━━\n`);

  // 1. rr_campaign_snapshots — the campaign definition
  console.log('1. rr_campaign_snapshots:');
  const snapshots = await sql(`
    SELECT campaign_id, campaign_name, campaign_type, status,
           total_sent, total_delivered, last_sent_date, snapshot_at,
           on_hold_count, follow_up_pending_count
    FROM rr_campaign_snapshots
    WHERE domain = '${DOMAIN}'
    ORDER BY snapshot_at DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(snapshots, null, 2));

  // 2. dm_client_funnel — any funnel rows?
  console.log('\n2. dm_client_funnel:');
  const funnel = await sql(`
    SELECT date::TEXT as date, total_sends, total_delivered, total_cost
    FROM dm_client_funnel
    WHERE domain = '${DOMAIN}'
    ORDER BY date DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(funnel, null, 2));

  // 3. dm_property_conversions — any properties?
  console.log('\n3. dm_property_conversions:');
  const props = await sql(`
    SELECT COUNT(*) as property_count,
           SUM(total_sends) as total_sends,
           MIN(first_sent_date) as first_sent,
           MAX(first_sent_date) as last_sent
    FROM dm_property_conversions
    WHERE domain = '${DOMAIN}'
  `);
  console.log(JSON.stringify(props, null, 2));

  // 4. rr_daily_metrics — any rows?
  console.log('\n4. rr_daily_metrics:');
  const daily = await sql(`
    SELECT date::TEXT as date, sends_total, delivered_count, cost_total
    FROM rr_daily_metrics
    WHERE domain = '${DOMAIN}'
    ORDER BY date DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(daily, null, 2));

  // 5. rr_pcm_alignment — any alignment rows?
  console.log('\n5. rr_pcm_alignment:');
  const alignment = await sql(`
    SELECT checked_at::TEXT as checked_at, stale_sent_count,
           orphaned_orders_count, back_office_sync_gap
    FROM rr_pcm_alignment
    WHERE domain = '${DOMAIN}'
    ORDER BY checked_at DESC
    LIMIT 3
  `);
  console.log(JSON.stringify(alignment, null, 2));

  // 6. PCM direct search
  console.log('\n6. PCM /order search (by extRefNbr prefix):');
  let found = 0;
  let page = 1;
  while (page <= 999) {
    const r = await pcmGet<{ results: Record<string, unknown>[]; pagination: { totalPages: number } }>(
      '/order',
      { page: String(page), perPage: '100' }
    );
    if (!r.results?.length) break;
    const matches = r.results.filter((o) =>
      String(o.extRefNbr || '').startsWith(DOMAIN)
    );
    found += matches.length;
    if (matches.length > 0) {
      console.log(`  Page ${page}: ${matches.length} matches`);
      for (const m of matches) {
        console.log(`    ${JSON.stringify({
          extRefNbr: m.extRefNbr,
          status: m.status,
          orderDate: m.orderDate,
          mailClass: m.mailClass,
        })}`);
      }
    }
    if (page >= r.pagination.totalPages) break;
    page++;
  }
  console.log(`  Total PCM matches: ${found}`);

  console.log('\n━━━ Done ━━━\n');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
