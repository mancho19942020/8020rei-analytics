import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getMetricsQuery,
  getUsersByDayQuery,
  getFeatureUsageQuery,
  getTopClientsQuery
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
  usersByDay: DailyData[];
  featureUsage: FeatureData[];
  topClients: ClientData[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');

  // Create a unique cache key based on the query parameter
  const cacheKey = `metrics:${days}`;

  // Check if we have cached data
  const cached = getCached<MetricsData>(cacheKey);

  if (cached) {
    console.log(`[API] Returning cached data for ${days} days`);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API] Cache miss - fetching fresh data from BigQuery for ${days} days`);

  try {
    // Execute 4 queries in parallel
    const [metrics, usersByDay, featureUsage, topClients] = await Promise.all([
      runQuery<Metrics>(getMetricsQuery(days)),
      runQuery<DailyData>(getUsersByDayQuery(days)),
      runQuery<FeatureData>(getFeatureUsageQuery(days)),
      runQuery<ClientData>(getTopClientsQuery(days)),
    ]);

    const data: MetricsData = {
      metrics: metrics[0],
      usersByDay,
      featureUsage,
      topClients,
    };

    // Store in cache for 5 minutes
    setCache(cacheKey, data);
    console.log(`[API] Data cached successfully for ${days} days`);

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
