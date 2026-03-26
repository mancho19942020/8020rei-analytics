import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getMetricsQuery,
  getPreviousMetricsQuery,
  getUsersByDayQuery,
  getFeatureUsageQuery,
  getTopClientsQuery,
  parseDateRangeFromSearchParams,
  UserType,
} from '@/lib/queries';

interface Metrics {
  total_users: number;
  total_events: number;
  page_views: number;
  active_clients: number;
}

interface DailyData {
  event_date: string;
  users: number;
  events: number;
}

interface FeatureData {
  feature: string;
  views: number;
}

interface ClientData {
  client: string;
  events: number;
  users: number;
  page_views: number;
}

interface MetricsData {
  metrics: Metrics;
  previousMetrics: Metrics | null;
  usersByDay: DailyData[];
  featureUsage: FeatureData[];
  topClients: ClientData[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateRange = parseDateRangeFromSearchParams(searchParams);
  const userType = (searchParams.get('userType') || 'all') as UserType;

  // Create a unique cache key based on the query parameters
  const cacheKey = `metrics:${dateRange.startDate || dateRange.days || 30}:${dateRange.endDate || ''}:${userType}`;

  // Check if we have cached data
  const cached = getCached<MetricsData>(cacheKey);

  if (cached) {
    console.log(`[API] Returning cached data for dateRange:`, dateRange);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API] Cache miss - fetching fresh data from BigQuery for dateRange:`, dateRange, `userType: ${userType}`);

  try {
    // Execute 5 queries in parallel (includes previous period for trend comparison)
    const [metrics, previousMetrics, usersByDay, featureUsage, topClients] = await Promise.all([
      runQuery<Metrics>(getMetricsQuery(dateRange, userType)),
      runQuery<Metrics>(getPreviousMetricsQuery(dateRange, userType)),
      runQuery<DailyData>(getUsersByDayQuery(dateRange, userType)),
      runQuery<FeatureData>(getFeatureUsageQuery(dateRange, userType)),
      runQuery<ClientData>(getTopClientsQuery(dateRange, userType)),
    ]);

    const data: MetricsData = {
      metrics: metrics[0],
      previousMetrics: previousMetrics[0] || null,
      usersByDay,
      featureUsage,
      topClients,
    };

    // Store in cache for 5 minutes
    setCache(cacheKey, data);
    console.log(`[API] Data cached successfully for dateRange:`, dateRange);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('BigQuery error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
