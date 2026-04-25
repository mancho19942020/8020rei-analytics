import { NextResponse } from 'next/server';
import { dynamoScanAll, isDynamoConfigured, SKIPTRACE_LOGS_TABLE } from '@/lib/dynamodb';

const PRICE_PER_HIT      = 0.08;
const COST_DS_PER_HIT    = 0.03;
const COMMITMENT_TOTAL   = 500_000;
const COMMITMENT_START   = new Date('2026-02-01T00:00:00Z').getTime();
const COMMITMENT_MONTHS  = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];
const COMMITMENT_DAYS    = 181; // Feb 1 – Jul 31 inclusive
// Feb DS hits not logged to DynamoDB — sourced from DirectSkip provider portal
const FEB_DS_HITS_ADJUSTMENT = 28_381;

const MONTH_LABELS: Record<string, string> = {
  '2026-02': 'Feb', '2026-03': 'Mar', '2026-04': 'Apr', '2026-05': 'May',
  '2026-06': 'Jun', '2026-07': 'Jul',
};

// ─── BatchData invoice data (from PDFs in Archivo 3) ─────────────────────────
interface InvoiceEntry { requests: number; amount: number; }
const INVOICE_DATA: Record<string, InvoiceEntry> = {
  '2025-01': { requests: 180,           amount: 12.60 },
  '2025-02': { requests: 292,           amount: 20.44 },
  '2025-03': { requests: 472_522,       amount: 2_362.60 },
  // no 2025-04 invoice
  '2025-05': { requests: 768_689,       amount: 3_843.44 },
  '2025-06': { requests: 1_010_740,     amount: 5_053.70 },
  '2025-07': { requests: 633_505,       amount: 3_167.52 },
  '2025-08': { requests: 326_439,       amount: 1_632.19 },
  '2025-09': { requests: 833_550,       amount: 4_167.74 },
  '2025-10': { requests: 37_742_001,    amount: 188_710.00 },
  '2025-11': { requests: 12_826_612,    amount: 64_133.06 },
  '2025-12': { requests: 429_037,       amount: 2_145.18 },
  '2026-01': { requests: 722_554,       amount: 3_612.77 },
  '2026-02': { requests: 740_273,       amount: 3_701.55 },
  '2026-03': { requests: 98_148,        amount: 490.74 },
};

function formatMonthLabel(ym: string): string {
  const NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [y, m] = ym.split('-');
  return `${NAMES[parseInt(m) - 1]} ${y}`;
}

interface ProviderStat {
  hits?: number;
  sent?: number;
}

interface SkiptraceLog {
  DomainDate: string;
  CreatedAt: number;
  TotalProperties?: number;
  TotalPropertiesFoundDB?: number;
  TotalHitsBatchLeads?: number;
  hitsBatch?: number;
  ProviderStats?: Record<string, ProviderStat>;
}

export async function GET() {
  if (!isDynamoConfigured()) {
    return NextResponse.json({ error: 'DynamoDB not configured' }, { status: 503 });
  }

  try {
    // Full historical scan — no date filter so BL hits include all time
    const items = await dynamoScanAll<SkiptraceLog>({
      TableName: SKIPTRACE_LOGS_TABLE,
      ProjectionExpression:
        'DomainDate, CreatedAt, TotalProperties, TotalPropertiesFoundDB, TotalHitsBatchLeads, hitsBatch, ProviderStats',
    });

    // Monthly accumulators keyed by 'YYYY-MM'
    const monthMap: Record<string, {
      ds_hits: number; bl_hits: number; cache_hits: number;
      total_props: number; domains: Set<string>;
    }> = {};
    for (const m of COMMITMENT_MONTHS) {
      monthMap[m] = { ds_hits: 0, bl_hits: 0, cache_hits: 0, total_props: 0, domains: new Set() };
    }

    // Client accumulators keyed by domain (commitment period only)
    const clientMap: Record<string, {
      ds_hits: number; bl_hits: number; cache_hits: number;
      total_props: number; last_active_ms: number; months: Set<string>;
    }> = {};

    // DS metrics scoped to commitment period; BL hits are all-time
    let total_ds_hits = 0, total_bl_hits = 0, total_cache = 0, total_props = 0;
    // BL hits grouped by month for reconciliation (all historical data)
    const blMonthMap: Record<string, number> = {};

for (const item of items) {
      const domain = item.DomainDate?.split('#')[0] ?? 'unknown';
      // Normalize: some older records store CreatedAt in seconds instead of ms
      const createdAtMs = item.CreatedAt < 1e12 ? item.CreatedAt * 1000 : item.CreatedAt;
      const month  = new Date(createdAtMs).toISOString().slice(0, 7);

      const ds_hits = item.ProviderStats?.directskip?.hits ?? item.hitsBatch ?? 0;
      const bl_hits = item.ProviderStats?.batchleads?.hits ?? item.TotalHitsBatchLeads ?? 0;
      const cache   = item.TotalPropertiesFoundDB ?? 0;
      const props   = item.TotalProperties ?? 0;

      // BL hits accumulated for all time regardless of date
      total_bl_hits += bl_hits;
      if (bl_hits > 0) blMonthMap[month] = (blMonthMap[month] ?? 0) + bl_hits;

      // DS metrics, cache, and properties within commitment period (Feb–Jul)
      if (createdAtMs >= COMMITMENT_START) {
        total_ds_hits += ds_hits;
        total_cache   += cache;
        total_props   += props;

        if (COMMITMENT_MONTHS.includes(month)) {
          monthMap[month].ds_hits    += ds_hits;
          monthMap[month].bl_hits    += bl_hits;
          monthMap[month].cache_hits += cache;
          monthMap[month].total_props += props;
          monthMap[month].domains.add(domain);
        }

        if (!clientMap[domain]) {
          clientMap[domain] = { ds_hits: 0, bl_hits: 0, cache_hits: 0, total_props: 0, last_active_ms: 0, months: new Set() };
        }
        clientMap[domain].ds_hits     += ds_hits;
        clientMap[domain].bl_hits     += bl_hits;
        clientMap[domain].cache_hits  += cache;
        clientMap[domain].total_props += props;
        clientMap[domain].last_active_ms = Math.max(clientMap[domain].last_active_ms, createdAtMs);
        if (COMMITMENT_MONTHS.includes(month)) clientMap[domain].months.add(month);
      }
    }

    // Apply February DS hits adjustment (not logged to DynamoDB, sourced from DirectSkip portal)
    total_ds_hits += FEB_DS_HITS_ADJUSTMENT;
    if (monthMap['2026-02']) monthMap['2026-02'].ds_hits += FEB_DS_HITS_ADJUSTMENT;

    // Commitment math
    const now          = Date.now();
    const days_elapsed = Math.max(1, Math.floor((now - COMMITMENT_START) / 86_400_000));
    const days_remaining = Math.max(0, COMMITMENT_DAYS - days_elapsed);
    const daily_rate   = total_ds_hits / days_elapsed;
    const projected    = Math.round(daily_rate * COMMITMENT_DAYS);
    const expected_by_now = Math.round(COMMITMENT_TOTAL * (days_elapsed / COMMITMENT_DAYS));
    const on_track     = total_ds_hits >= expected_by_now * 0.85;

    // Financials
    const revenue      = (total_ds_hits + total_bl_hits) * PRICE_PER_HIT;
    const cost_ds      = total_ds_hits * COST_DS_PER_HIT;
    const gross_margin = revenue - cost_ds;
    const margin_pct   = revenue > 0 ? (gross_margin / revenue) * 100 : 0;

    // By month output
    const current_month = new Date().toISOString().slice(0, 7);
    const by_month = COMMITMENT_MONTHS.map((m) => {
      const mo = monthMap[m];
      const rev = (mo.ds_hits + mo.bl_hits) * PRICE_PER_HIT;
      const cst = mo.ds_hits * COST_DS_PER_HIT;
      return {
        month: m,
        label: MONTH_LABELS[m],
        directskip_hits: mo.ds_hits,
        batchleads_hits: mo.bl_hits,
        cache_hits: mo.cache_hits,
        total_properties: mo.total_props,
        active_clients: mo.domains.size,
        revenue: rev,
        cost: cst,
        margin: rev - cst,
      };
    });

    // By client output
    const by_client = Object.entries(clientMap)
      .map(([domain, c]) => {
        const rev = (c.ds_hits + c.bl_hits) * PRICE_PER_HIT;
        const cst = c.ds_hits * COST_DS_PER_HIT;
        return {
          domain,
          directskip_hits: c.ds_hits,
          batchleads_hits: c.bl_hits,
          cache_hits: c.cache_hits,
          total_properties: c.total_props,
          revenue: rev,
          cost: cst,
          margin: rev - cst,
          last_active: new Date(c.last_active_ms).toISOString().slice(0, 10),
          months_active: c.months.size,
        };
      })
      .sort((a, b) => b.directskip_hits - a.directskip_hits);

    const active_clients_this_month = monthMap[current_month]?.domains.size ?? 0;

    // ─── Reconciliation: invoice data vs DynamoDB BL hits by month ────────────
    const reconMonths = Array.from(
      new Set([...Object.keys(INVOICE_DATA), ...Object.keys(blMonthMap)])
    ).sort();

    const reconciliation = reconMonths.map((m) => {
      const inv          = INVOICE_DATA[m] ?? null;
      const db_hits      = blMonthMap[m] ?? 0;
      const inv_requests = inv?.requests ?? null;
      const inv_amount   = inv?.amount ?? null;
      const delta        = inv_requests !== null ? db_hits - inv_requests : null;
      const match_pct    = inv_requests ? Math.round((db_hits / inv_requests) * 100) : null;
      return { month: m, label: formatMonthLabel(m), inv_requests, inv_amount, db_hits, delta, match_pct };
    });

    const total_inv_requests = Object.values(INVOICE_DATA).reduce((s, v) => s + v.requests, 0);
    const total_inv_cost     = Object.values(INVOICE_DATA).reduce((s, v) => s + v.amount, 0);
    const overall_match_pct  = total_inv_requests > 0
      ? Math.round((total_bl_hits / total_inv_requests) * 100)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        commitment: {
          used_hits: total_ds_hits,
          total: COMMITMENT_TOTAL,
          pct: (total_ds_hits / COMMITMENT_TOTAL) * 100,
          monthly_target: COMMITMENT_TOTAL / COMMITMENT_MONTHS.length,
          projected_total: projected,
          days_elapsed,
          days_remaining,
          on_track,
        },
        financials: {
          total_revenue: revenue,
          cost_directskip: cost_ds,
          gross_margin,
          margin_pct,
          directskip_hits: total_ds_hits,
          batchleads_hits: total_bl_hits,
          cache_hits: total_cache,
          total_properties: total_props,
        },
        by_month,
        by_client,
        active_clients_this_month,
        reconciliation,
        recon_summary: {
          total_inv_requests,
          total_inv_cost,
          total_db_hits: total_bl_hits,
          overall_match_pct,
        },
        as_of: new Date().toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Skiptrace API]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
