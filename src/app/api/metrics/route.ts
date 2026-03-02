import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getMetricsQuery,
  getUsersByDayQuery,
  getFeatureUsageQuery,
  getTopClientsQuery,
  UserType
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
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;
  const rawDays = parseInt(searchParams.get('days') || '30');
  const days = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) || rawDays
    : rawDays;
  const userType = (searchParams.get('userType') || 'all') as UserType;

  const cacheKey = `metrics:${startDate && endDate ? `${startDate}:${endDate}` : days}:${userType}`;

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

  console.log(`[API] Cache miss - fetching fresh data from BigQuery for ${days} days, userType: ${userType}`);

  try {
    // Execute 4 queries in parallel
    const [metrics, usersByDay, featureUsage, topClients] = await Promise.all([
      runQuery<Metrics>(getMetricsQuery(days, userType, startDate, endDate)),
      runQuery<DailyData>(getUsersByDayQuery(days, userType, startDate, endDate)),
      runQuery<FeatureData>(getFeatureUsageQuery(days, userType, startDate, endDate)),
      runQuery<ClientData>(getTopClientsQuery(days, userType, startDate, endDate)),
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
