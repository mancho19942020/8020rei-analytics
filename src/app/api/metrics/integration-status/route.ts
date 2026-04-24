import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runProductQuery, runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import { getIntegrationStatusQuery } from '@/lib/product-queries';
import {
  getViewsByAffiliationQuery,
  getPreviousViewsByAffiliationQuery,
  parseDateRangeFromSearchParams,
} from '@/lib/queries';
import type { IntegrationStatusSummary, IntegrationStatusData, Ga4AffiliationViews } from '@/types/integration-status';

interface AffiliationRow {
  affiliation: string;
  total_users: number;
  page_views: number;
  avg_engagement_time_msec: number;
}

function pctChange(current: number, previous: number): number {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

function avgSessionMin(msec: number): number {
  return Math.round(msec / 60000);
}

function buildAffiliationViews(
  row: AffiliationRow | undefined,
  prevRow: AffiliationRow | undefined,
  totalViews: number,
): Ga4AffiliationViews {
  const views = row?.page_views ?? 0;
  const prevViews = prevRow?.page_views ?? 0;
  const msec = row?.avg_engagement_time_msec ?? 0;
  const prevMsec = prevRow?.avg_engagement_time_msec ?? 0;
  return {
    page_views: views,
    total_users: row?.total_users ?? 0,
    avg_session_min: avgSessionMin(msec),
    views_change_pct: pctChange(views, prevViews),
    session_change_pct: pctChange(msec, prevMsec),
    share_of_total_pct: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0,
  };
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const dateRange = parseDateRangeFromSearchParams(searchParams);
  const dateKey = dateRange.startDate && dateRange.endDate
    ? `${dateRange.startDate}_${dateRange.endDate}`
    : `${dateRange.days ?? 30}d`;

  const cacheKey = `integration-status-v3:${dateKey}`;
  const cached = getCached<IntegrationStatusData>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true, timestamp: new Date().toISOString() });
  }

  try {
    const [sfRows, viewRows, prevViewRows] = await Promise.all([
      runProductQuery<IntegrationStatusSummary>(getIntegrationStatusQuery()),
      runQuery<AffiliationRow>(getViewsByAffiliationQuery(dateRange)),
      runQuery<AffiliationRow>(getPreviousViewsByAffiliationQuery(dateRange)),
    ]);

    const summary = sfRows[0] || { total_integrated: 0, deal_issues: 0, lead_issues: 0 };

    const internal     = viewRows.find(r => r.affiliation === 'internal');
    const external     = viewRows.find(r => r.affiliation === 'external');
    const prevInternal = prevViewRows.find(r => r.affiliation === 'internal');
    const prevExternal = prevViewRows.find(r => r.affiliation === 'external');

    const totalViews = (internal?.page_views ?? 0) + (external?.page_views ?? 0);

    const data: IntegrationStatusData = {
      salesforce: summary,
      ga4: {
        internal: buildAffiliationViews(internal, prevInternal, totalViews),
        external: buildAffiliationViews(external, prevExternal, totalViews),
      },
      as_of: new Date().toISOString().split('T')[0],
    };

    setCache(cacheKey, data);

    return NextResponse.json({ success: true, data, cached: false, timestamp: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('BigQuery error (Integration Status):', msg);
    return NextResponse.json(
      { success: false, error: `Failed to fetch integration status: ${msg}` },
      { status: 500 }
    );
  }
}
