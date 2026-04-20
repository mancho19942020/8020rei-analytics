/**
 * DM Campaign Audit Snapshot
 *
 * Produces a compact JSON snapshot of the metrics that back the
 * DM Campaign consistency audit (Design docs/audits/dm-campaign-consistency-audit-2026-04-17.md).
 *
 * Both sides for every headline number: Aurora AND PCM. Side-by-side, zero assumptions.
 *
 * Run: ./backend/node_modules/.bin/tsx scripts/dm-audit-snapshot.ts
 * Output: Design docs/audits/snapshots/dm-audit-snapshot-<YYYY-MM-DD>.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

// ─── Env ──────────────────────────────────────────────────────
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

// ─── PCM API ──────────────────────────────────────────────────
const PCM_BASE = 'https://v3.pcmintegrations.com';
let pcmToken: string | null = null;

async function pcmAuth(): Promise<string> {
  if (pcmToken) return pcmToken;
  const r = await fetch(`${PCM_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      apiKey: process.env.PCM_API_KEY,
      apiSecret: process.env.PCM_API_SECRET,
    }),
  });
  if (!r.ok) throw new Error(`PCM auth failed: ${r.status}`);
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
  if (!r.ok) throw new Error(`PCM GET ${path} failed: ${r.status}`);
  return r.json() as Promise<T>;
}

// ─── Aurora ──────────────────────────────────────────────────
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

// ─── Test-domain exclusion (must match app) ─────────────────
const TEST_DOMAINS = [
  '8020rei_demo',
  '8020rei_migracion_test',
  '_test_debug',
  '_test_debug3',
  'supertest_8020rei_com',
  'sandbox_8020rei_com',
  'qapre_8020rei_com',
  'testing5_8020rei_com',
  'showcaseproductsecomllc_8020rei_com',
];
const TEST_DOMAINS_SQL = TEST_DOMAINS.map((d) => `'${d}'`).join(', ');

function extractDomain(extRefNbr: string): string {
  const m = extRefNbr.match(/^(.+)-\d+$/);
  return m ? m[1] : extRefNbr;
}

// ─── PCM pricing eras (from verified invoice PDFs) ──────────
function pcmRate(dateStr: string, mc: 'fc' | 'std'): number {
  if (dateStr <= '2025-06-27') return mc === 'fc' ? 0.94 : 0.74;
  if (dateStr <= '2025-10-31') return mc === 'fc' ? 1.14 : 0.93;
  return mc === 'fc' ? 0.87 : 0.63;
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  const startedAt = new Date().toISOString();
  console.log(`[${startedAt}] DM audit snapshot starting…`);

  // ═══ PCM ═══
  console.log('Fetching PCM /order (paginated)…');
  const pcmOrders: Record<string, unknown>[] = [];
  let page = 1;
  let totalPages = 999;
  while (page <= totalPages) {
    if (page % 25 === 0) process.stdout.write(`  page ${page}\n`);
    const r = await pcmGet<{ results: Record<string, unknown>[]; pagination: { totalPages: number; totalResults: number } }>(
      '/order',
      { page: String(page), perPage: '100' }
    );
    if (!r.results?.length) break;
    pcmOrders.push(...r.results);
    totalPages = r.pagination?.totalPages || totalPages;
    if (page >= totalPages) break;
    page++;
  }
  console.log(`  PCM returned ${pcmOrders.length} orders`);

  const pcmBalance = await pcmGet<{ moneyOnAccount: number }>('/integration/balance').catch(() => ({ moneyOnAccount: 0 }));
  const pcmDesigns = await pcmGet<{ pagination: { totalResults: number } }>('/design', { page: '1', perPage: '1' }).catch(() => ({ pagination: { totalResults: 0 } }));

  // Aggregate PCM orders
  const pcmAll = pcmOrders.length;
  const pcmActive = pcmOrders.filter((o) => {
    const s = String(o.status || '').toLowerCase();
    const d = extractDomain(String(o.extRefNbr || ''));
    return s !== 'canceled' && s !== 'cancelled' && !TEST_DOMAINS.includes(d);
  });
  const pcmCanceled = pcmOrders.filter((o) => {
    const s = String(o.status || '').toLowerCase();
    return s === 'canceled' || s === 'cancelled';
  });

  const pcmDomainCounts = new Map<string, number>();
  const pcmByStatus = new Map<string, number>();
  const pcmByMailClass = new Map<string, number>();
  const pcmByMonth = new Map<string, number>();
  const pcmByDay = new Map<string, number>();
  const pcmDailyCost = new Map<string, number>();
  let pcmTotalCost = 0;

  for (const o of pcmActive) {
    const d = extractDomain(String(o.extRefNbr || ''));
    pcmDomainCounts.set(d, (pcmDomainCounts.get(d) || 0) + 1);

    const status = String(o.status || 'unknown').toLowerCase();
    pcmByStatus.set(status, (pcmByStatus.get(status) || 0) + 1);

    const mc = String(o.mailClass || '').toLowerCase().includes('first') ? 'first_class' : 'standard';
    pcmByMailClass.set(mc, (pcmByMailClass.get(mc) || 0) + 1);

    const date = String(o.orderDate || '').split('T')[0];
    if (date) {
      const month = date.substring(0, 7);
      pcmByMonth.set(month, (pcmByMonth.get(month) || 0) + 1);
      pcmByDay.set(date, (pcmByDay.get(date) || 0) + 1);
      const rate = pcmRate(date, mc === 'first_class' ? 'fc' : 'std');
      pcmTotalCost += rate;
      pcmDailyCost.set(date, (pcmDailyCost.get(date) || 0) + rate);
    }
  }

  // ═══ Aurora ═══
  console.log('Fetching Aurora…');

  const campaignSnapshotRows = await sql(`
    SELECT DISTINCT ON (domain, campaign_id)
      campaign_id, domain, status, total_sent, total_delivered, last_sent_date, snapshot_at
    FROM rr_campaign_snapshots
    WHERE domain NOT IN (${TEST_DOMAINS_SQL})
    ORDER BY domain, campaign_id, snapshot_at DESC
  `);

  const campaignSnapshotAll = campaignSnapshotRows.length;
  const campaignSnapshotActive = campaignSnapshotRows.filter((r) => r.status === 'active').length;
  const auroraDomainCampaignCounts = new Map<string, number>();
  for (const r of campaignSnapshotRows) {
    const d = String(r.domain || '');
    auroraDomainCampaignCounts.set(d, (auroraDomainCampaignCounts.get(d) || 0) + 1);
  }
  const clientsWithActiveCampaign = new Set<string>();
  for (const r of campaignSnapshotRows) {
    if (r.status === 'active') clientsWithActiveCampaign.add(String(r.domain || ''));
  }

  const clientFunnelRows = await sql(`
    SELECT
      COALESCE(SUM(f.total_sends), 0) as total_sends,
      COALESCE(SUM(f.total_delivered), 0) as total_delivered,
      COALESCE(SUM(f.total_cost), 0) as total_cost,
      COUNT(DISTINCT f.domain) as domain_count
    FROM dm_client_funnel f
    INNER JOIN (
      SELECT dcf.domain, MAX(dcf.date) as max_date
      FROM dm_client_funnel dcf
      WHERE dcf.domain IS NOT NULL
        AND dcf.domain NOT IN (${TEST_DOMAINS_SQL})
      GROUP BY dcf.domain
    ) latest ON f.domain = latest.domain AND f.date = latest.max_date
    WHERE f.domain IS NOT NULL AND f.domain NOT IN (${TEST_DOMAINS_SQL})
  `);

  const clientFunnel = clientFunnelRows[0] || {};
  const auroraTotalSends = Number(clientFunnel.total_sends || 0);
  const auroraTotalDelivered = Number(clientFunnel.total_delivered || 0);
  const auroraTotalCost = Number(clientFunnel.total_cost || 0);
  const auroraDomainCount = Number(clientFunnel.domain_count || 0);
  const auroraDeliveryRate = auroraTotalSends > 0 ? (auroraTotalDelivered / auroraTotalSends) * 100 : 0;

  const propertyConvRows = await sql(`
    SELECT
      COALESCE(SUM(total_cost), 0) as revenue,
      COALESCE(SUM(total_sends), 0) as sends,
      COUNT(DISTINCT domain) as domain_count,
      COUNT(*) as property_count
    FROM dm_property_conversions
    WHERE domain NOT IN (${TEST_DOMAINS_SQL})
  `);
  const propertyConv = propertyConvRows[0] || {};

  const rrDailyRows = await sql(`
    SELECT
      date::TEXT as date,
      COALESCE(SUM(sends_total), 0) as sends_total,
      COALESCE(SUM(sends_success), 0) as sends_success,
      COALESCE(SUM(delivered_count), 0) as delivered_count,
      COALESCE(SUM(cost_total), 0) as cost_total
    FROM rr_daily_metrics
    WHERE domain NOT IN (${TEST_DOMAINS_SQL})
    GROUP BY date
    ORDER BY date
  `);

  const rrDailyCount = rrDailyRows.length;
  const rrDailyFirst = rrDailyRows[0]?.date;
  const rrDailyLast = rrDailyRows[rrDailyRows.length - 1]?.date;

  // ═══ Cross-checks ═══
  const deltaSends = auroraTotalSends - pcmActive.length;
  const deltaSendsPct = pcmActive.length > 0 ? (deltaSends / pcmActive.length) * 100 : 0;
  const deltaDomains = auroraDomainCount - pcmDomainCounts.size;
  const deltaCost = auroraTotalCost - pcmTotalCost;

  // ═══ Output ═══
  const output = {
    metadata: {
      startedAt,
      finishedAt: new Date().toISOString(),
      pcmOrdersFetched: pcmOrders.length,
      auroraRowsChecked: campaignSnapshotAll + rrDailyCount,
      testDomainsExcluded: TEST_DOMAINS,
    },
    headline: {
      pcmActiveMailPieces: pcmActive.length,
      pcmCanceledOrders: pcmCanceled.length,
      auroraFunnelSends: auroraTotalSends,
      delta: { value: deltaSends, pct: Number(deltaSendsPct.toFixed(2)) },
      auroraFunnelDelivered: auroraTotalDelivered,
      auroraDeliveryRatePct: Number(auroraDeliveryRate.toFixed(2)),
      auroraFunnelCost: Number(auroraTotalCost.toFixed(2)),
      pcmComputedCost: Number(pcmTotalCost.toFixed(2)),
      costDelta: Number(deltaCost.toFixed(2)),
      auroraDomainCount,
      pcmDomainCount: pcmDomainCounts.size,
      deltaDomains,
      pcmBalanceOnAccount: Number((pcmBalance.moneyOnAccount || 0).toFixed(2)),
      pcmDesignCatalogSize: pcmDesigns.pagination?.totalResults || 0,
    },
    campaigns: {
      auroraTotalCampaignsDistinctLatest: campaignSnapshotAll,
      auroraActiveCampaigns: campaignSnapshotActive,
      auroraClientsWithAtLeastOneActiveCampaign: clientsWithActiveCampaign.size,
      note:
        'PCM does not have a campaign primitive — campaigns are an 8020REI abstraction on top of PCM orders. PCM-side counterpart is orders-per-domain.',
      auroraCampaignsPerDomain: Object.fromEntries(auroraDomainCampaignCounts),
      pcmOrdersPerDomain: Object.fromEntries(pcmDomainCounts),
    },
    propertyConversions: {
      revenueTotal: Number(Number(propertyConv.revenue || 0).toFixed(2)),
      sendsTotal: Number(propertyConv.sends || 0),
      domainCount: Number(propertyConv.domain_count || 0),
      propertyCount: Number(propertyConv.property_count || 0),
      note:
        'Property conversions are a SUBSET (~5% historically) of PCM orders. NEVER use as the sole source for all-time volume. Valid for revenue and conversion metrics only.',
    },
    dailyCadence: {
      rrDailyMetricRows: rrDailyCount,
      rrDailyFirstDate: rrDailyFirst,
      rrDailyLastDate: rrDailyLast,
      pcmDailyEntryCount: pcmByDay.size,
      pcmFirstOrderDate: [...pcmByDay.keys()].sort()[0],
      pcmLastOrderDate: [...pcmByDay.keys()].sort().slice(-1)[0],
    },
    breakdowns: {
      pcmByStatus: Object.fromEntries(pcmByStatus),
      pcmByMailClass: Object.fromEntries(pcmByMailClass),
      pcmByMonth: Object.fromEntries([...pcmByMonth.entries()].sort()),
    },
  };

  // Write snapshot
  const today = new Date().toISOString().split('T')[0];
  const outDir = resolve(__dirname, '../Design docs/audits/snapshots');
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, `dm-audit-snapshot-${today}.json`);
  writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`\nSnapshot written to: ${outFile}`);

  // Terse console summary
  console.log('\n━━ Headline ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`PCM active mail pieces:        ${output.headline.pcmActiveMailPieces.toLocaleString()}`);
  console.log(`Aurora funnel sends:           ${output.headline.auroraFunnelSends.toLocaleString()}`);
  console.log(`Δ:                             ${output.headline.delta.value} (${output.headline.delta.pct}%)`);
  console.log(`Aurora delivery rate:          ${output.headline.auroraDeliveryRatePct}%`);
  console.log(`Aurora total cost:             $${output.headline.auroraFunnelCost.toLocaleString()}`);
  console.log(`PCM computed cost:             $${output.headline.pcmComputedCost.toLocaleString()}`);
  console.log(`Aurora domains:                ${output.headline.auroraDomainCount}`);
  console.log(`PCM domains:                   ${output.headline.pcmDomainCount}`);
  console.log(`PCM balance on account:        $${output.headline.pcmBalanceOnAccount.toLocaleString()}`);
  console.log('\n━━ Campaigns (Aurora-only concept) ━━━━━');
  console.log(`Aurora total campaigns:        ${output.campaigns.auroraTotalCampaignsDistinctLatest}`);
  console.log(`Aurora active campaigns:       ${output.campaigns.auroraActiveCampaigns}`);
  console.log(`Clients w/ ≥1 active campaign: ${output.campaigns.auroraClientsWithAtLeastOneActiveCampaign}`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
