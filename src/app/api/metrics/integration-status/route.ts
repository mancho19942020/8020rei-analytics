import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runProductQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import { getIntegrationStatusQuery } from '@/lib/product-queries';
import type { IntegrationStatusSummary, IntegrationStatusData } from '@/types/integration-status';

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const cacheKey = 'integration-status-v1:30d';
  const cached = getCached<IntegrationStatusData>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true, timestamp: new Date().toISOString() });
  }

  try {
    const rows = await runProductQuery<IntegrationStatusSummary>(getIntegrationStatusQuery());

    const summary = rows[0] || { total_integrated: 0, deal_issues: 0, lead_issues: 0 };

    const data: IntegrationStatusData = {
      salesforce: summary,
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
