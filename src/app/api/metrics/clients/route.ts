import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getClientsOverviewQuery,
  getPreviousClientsOverviewQuery,
  getTopClientsDetailedQuery,
  getClientActivityTrendQuery,
  UserType
} from '@/lib/queries';

interface ClientsOverview {
  total_clients: number;
  total_events: number;
  total_page_views: number;
  total_users: number;
  avg_users_per_client: number;
}

interface PreviousClientsOverview {
  prev_total_clients: number;
  prev_total_events: number;
  prev_total_page_views: number;
  prev_total_users: number;
  prev_avg_users_per_client: number;
}

interface ClientData {
  client: string;
  events: number;
  users: number;
  page_views: number;
  features_used: number;
}

interface ClientActivityData {
  event_date: string;
  client: string;
  users: number;
  events: number;
}

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface ClientsOverviewWithTrends extends ClientsOverview {
  trends: {
    total_clients: TrendData;
    total_events: TrendData;
    total_page_views: TrendData;
    total_users: TrendData;
    avg_users_per_client: TrendData;
  };
}

interface ClientsMetricsData {
  overview: ClientsOverviewWithTrends;
  topClients: ClientData[];
  activityTrend: ClientActivityData[];
}

// Calculate trend from current and previous values
function calculateTrend(current: number, previous: number, invertPositive = false): TrendData {
  if (!previous || previous === 0) {
    return { value: 0, isPositive: true };
  }
  const change = ((current - previous) / previous) * 100;
  // For metrics where a decrease is positive, use invertPositive
  const isPositive = invertPositive ? change <= 0 : change >= 0;
  return { value: Math.abs(change), isPositive };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');
  const userType = (searchParams.get('userType') || 'all') as UserType;

  // Create a unique cache key based on the query parameters
  const cacheKey = `clients-metrics-v1:${days}:${userType}`;

  // Check if we have cached data
  const cached = getCached<ClientsMetricsData>(cacheKey);

  if (cached) {
    console.log(`[API/Clients] Returning cached data for ${days} days`);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API/Clients] Cache miss - fetching fresh data from BigQuery for ${days} days, userType: ${userType}`);

  try {
    // Execute 4 queries in parallel (current + previous period data + top clients + trend)
    const [
      overviewResult,
      prevOverviewResult,
      topClientsResult,
      activityTrendResult
    ] = await Promise.all([
      runQuery<ClientsOverview>(getClientsOverviewQuery(days, userType)),
      runQuery<PreviousClientsOverview>(getPreviousClientsOverviewQuery(days, userType)),
      runQuery<ClientData>(getTopClientsDetailedQuery(days, userType)),
      runQuery<ClientActivityData>(getClientActivityTrendQuery(days, userType)),
    ]);

    const currentOverview = overviewResult[0] || {
      total_clients: 0,
      total_events: 0,
      total_page_views: 0,
      total_users: 0,
      avg_users_per_client: 0,
    };

    const prevOverview = prevOverviewResult[0] || {
      prev_total_clients: 0,
      prev_total_events: 0,
      prev_total_page_views: 0,
      prev_total_users: 0,
      prev_avg_users_per_client: 0,
    };

    const data: ClientsMetricsData = {
      overview: {
        ...currentOverview,
        trends: {
          total_clients: calculateTrend(currentOverview.total_clients, prevOverview.prev_total_clients),
          total_events: calculateTrend(currentOverview.total_events, prevOverview.prev_total_events),
          total_page_views: calculateTrend(currentOverview.total_page_views, prevOverview.prev_total_page_views),
          total_users: calculateTrend(currentOverview.total_users, prevOverview.prev_total_users),
          avg_users_per_client: calculateTrend(currentOverview.avg_users_per_client, prevOverview.prev_avg_users_per_client),
        },
      },
      topClients: topClientsResult,
      activityTrend: activityTrendResult,
    };

    // Store in cache for 5 minutes
    setCache(cacheKey, data);
    console.log(`[API/Clients] Data cached successfully for ${days} days`);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('BigQuery error (Clients):', errorMessage);
    console.error('Full error:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch clients metrics: ${errorMessage}` },
      { status: 500 }
    );
  }
}
