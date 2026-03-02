import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getTrafficBySourceQuery,
  getTrafficByMediumQuery,
  getTopReferrersQuery,
  getSessionsByDayOfWeekQuery,
  getFirstVisitsTrendQuery,
  UserType
} from '@/lib/queries';

interface TrafficBySource {
  source: string;
  users: number;
  events: number;
}

interface TrafficByMedium {
  medium: string;
  users: number;
  events: number;
}

interface TopReferrer {
  referrer_domain: string;
  users: number;
  events: number;
}

interface SessionsByDayOfWeek {
  day_of_week: number;
  sessions: number;
}

interface FirstVisitsTrend {
  event_date: string;
  first_visits: number;
}

interface TrafficMetricsData {
  trafficBySource: TrafficBySource[];
  trafficByMedium: TrafficByMedium[];
  topReferrers: TopReferrer[];
  sessionsByDayOfWeek: SessionsByDayOfWeek[];
  firstVisitsTrend: FirstVisitsTrend[];
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

  // Create a unique cache key based on the query parameters
  const cacheKey = `traffic-metrics-v3:${startDate && endDate ? `${startDate}:${endDate}` : days}:${userType}`;

  // Check if we have cached data
  const cached = getCached<TrafficMetricsData>(cacheKey);

  if (cached) {
    console.log(`[API/Traffic] Returning cached data for ${days} days`);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API/Traffic] Cache miss - fetching fresh data from BigQuery for ${days} days, userType: ${userType}`);

  try {
    // Execute 5 queries in parallel
    const [
      trafficBySource,
      trafficByMedium,
      topReferrers,
      sessionsByDayOfWeek,
      firstVisitsTrend
    ] = await Promise.all([
      runQuery<TrafficBySource>(getTrafficBySourceQuery(days, userType, startDate, endDate)),
      runQuery<TrafficByMedium>(getTrafficByMediumQuery(days, userType, startDate, endDate)),
      runQuery<TopReferrer>(getTopReferrersQuery(days, userType, startDate, endDate)),
      runQuery<SessionsByDayOfWeek>(getSessionsByDayOfWeekQuery(days, userType, startDate, endDate)),
      runQuery<FirstVisitsTrend>(getFirstVisitsTrendQuery(days, userType, startDate, endDate)),
    ]);

    const data: TrafficMetricsData = {
      trafficBySource,
      trafficByMedium,
      topReferrers,
      sessionsByDayOfWeek,
      firstVisitsTrend,
    };

    // Store in cache for 5 minutes
    setCache(cacheKey, data);
    console.log(`[API/Traffic] Data cached successfully for ${days} days`);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('BigQuery error (Traffic):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch traffic metrics' },
      { status: 500 }
    );
  }
}
