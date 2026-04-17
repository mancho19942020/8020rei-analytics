import { NextResponse } from 'next/server';
import { dynamoScanAll, isDynamoConfigured, SKIPTRACE_LOGS_TABLE } from '@/lib/dynamodb';

const PRICE_PER_HIT      = 0.08;
const COST_DS_PER_HIT    = 0.03;
const COMMITMENT_TOTAL   = 500_000;
const COMMITMENT_START   = new Date('2026-03-01T00:00:00Z').getTime();
const COMMITMENT_MONTHS  = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];
const COMMITMENT_DAYS    = 153; // Mar 1 – Jul 31 inclusive

const MONTH_LABELS: Record<string, string> = {
  '2026-03': 'Mar', '2026-04': 'Apr', '2026-05': 'May',
  '2026-06': 'Jun', '2026-07': 'Jul',
};

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
  ProviderStats?: Record<string, ProviderStat>;
}

export async function GET() {
  if (!isDynamoConfigured()) {
    return NextResponse.json({ error: 'DynamoDB not configured' }, { status: 503 });
  }

  try {
    const items = await dynamoScanAll<SkiptraceLog>({
      TableName: SKIPTRACE_LOGS_TABLE,
      FilterExpression: 'CreatedAt >= :start',
      ExpressionAttributeValues: { ':start': COMMITMENT_START },
      ProjectionExpression:
        'DomainDate, CreatedAt, TotalProperties, TotalPropertiesFoundDB, TotalHitsBatchLeads, ProviderStats',
    });

    // Monthly accumulators keyed by 'YYYY-MM'
    const monthMap: Record<string, {
      ds_hits: number; bl_hits: number; cache_hits: number;
      total_props: number; domains: Set<string>;
    }> = {};
    for (const m of COMMITMENT_MONTHS) {
      monthMap[m] = { ds_hits: 0, bl_hits: 0, cache_hits: 0, total_props: 0, domains: new Set() };
    }

    // Client accumulators keyed by domain
    const clientMap: Record<string, {
      ds_hits: number; bl_hits: number; cache_hits: number;
      total_props: number; last_active_ms: number; months: Set<string>;
    }> = {};

    let total_ds_hits = 0, total_bl_hits = 0, total_cache = 0, total_props = 0;

    for (const item of items) {
      const domain = item.DomainDate?.split('#')[0] ?? 'unknown';
      const month  = new Date(item.CreatedAt).toISOString().slice(0, 7);

      const ds_hits = item.ProviderStats?.directskip?.hits ?? 0;
      const bl_hits = item.ProviderStats?.batchleads?.hits ?? item.TotalHitsBatchLeads ?? 0;
      const cache   = item.TotalPropertiesFoundDB ?? 0;
      const props   = item.TotalProperties ?? 0;

      total_ds_hits += ds_hits;
      total_bl_hits += bl_hits;
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
      clientMap[domain].last_active_ms = Math.max(clientMap[domain].last_active_ms, item.CreatedAt);
      if (COMMITMENT_MONTHS.includes(month)) clientMap[domain].months.add(month);
    }

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

    return NextResponse.json({
      success: true,
      data: {
        commitment: {
          used_hits: total_ds_hits,
          total: COMMITMENT_TOTAL,
          pct: (total_ds_hits / COMMITMENT_TOTAL) * 100,
          monthly_target: COMMITMENT_TOTAL / 5,
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
        as_of: new Date().toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Skiptrace API]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
