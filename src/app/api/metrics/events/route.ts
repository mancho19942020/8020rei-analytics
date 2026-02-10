import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getEventBreakdownQuery,
  getPreviousEventBreakdownQuery,
  getEventVolumeTrendQuery,
  getEventMetricsQuery,
  getPreviousEventMetricsQuery,
  getScrollDepthByPageQuery,
  UserType
} from '@/lib/queries';

interface EventBreakdownData {
  event_name: string;
  count: number;
  unique_users: number;
}

interface EventVolumeTrendData {
  event_date: string;
  event_name: string;
  count: number;
}

interface EventMetricsData {
  total_events: number;
  total_sessions: number;
  form_starts: number;
  form_submits: number;
  clicks: number;
  scrolls: number;
}

interface ScrollDepthData {
  page: string;
  scroll_events: number;
  unique_users: number;
}

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface EventBreakdownWithTrend extends EventBreakdownData {
  trend?: TrendData;
  percentage?: number;
}

interface EventsMetricsResponse {
  eventBreakdown: EventBreakdownWithTrend[];
  eventVolumeTrend: EventVolumeTrendData[];
  eventMetrics: {
    total_events: number;
    total_sessions: number;
    events_per_session: number;
    form_starts: number;
    form_submits: number;
    form_conversion_rate: number;
    clicks: number;
    scrolls: number;
    trends?: {
      events_per_session: TrendData;
      form_conversion_rate: TrendData;
      total_events: TrendData;
    };
  };
  scrollDepthByPage: ScrollDepthData[];
}

// Calculate trend from current and previous values
function calculateTrend(current: number, previous: number): TrendData {
  if (!previous || previous === 0) {
    return { value: 0, isPositive: true };
  }
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(change), isPositive: change >= 0 };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');
  const userType = (searchParams.get('userType') || 'all') as UserType;

  // Create a unique cache key based on the query parameters
  const cacheKey = `events-metrics-v1:${days}:${userType}`;

  // Check if we have cached data
  const cached = getCached<EventsMetricsResponse>(cacheKey);

  if (cached) {
    console.log(`[API/Events] Returning cached data for ${days} days`);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API/Events] Cache miss - fetching fresh data from BigQuery for ${days} days, userType: ${userType}`);

  try {
    // Execute 6 queries in parallel
    const [
      eventBreakdown,
      prevEventBreakdown,
      eventVolumeTrend,
      eventMetrics,
      prevEventMetrics,
      scrollDepthByPage
    ] = await Promise.all([
      runQuery<EventBreakdownData>(getEventBreakdownQuery(days, userType)),
      runQuery<EventBreakdownData>(getPreviousEventBreakdownQuery(days, userType)),
      runQuery<EventVolumeTrendData>(getEventVolumeTrendQuery(days, userType)),
      runQuery<EventMetricsData>(getEventMetricsQuery(days, userType)),
      runQuery<EventMetricsData>(getPreviousEventMetricsQuery(days, userType)),
      runQuery<ScrollDepthData>(getScrollDepthByPageQuery(days, userType)),
    ]);

    // Create a map of previous period data for trend calculation
    const prevEventMap = new Map<string, number>();
    prevEventBreakdown.forEach(item => {
      prevEventMap.set(item.event_name, item.count);
    });

    // Calculate total events for percentage calculation
    const totalEvents = eventBreakdown.reduce((sum, item) => sum + item.count, 0);

    // Add trend data and percentage to event breakdown
    const eventBreakdownWithTrends: EventBreakdownWithTrend[] = eventBreakdown.map(item => {
      const prevCount = prevEventMap.get(item.event_name) || 0;
      return {
        ...item,
        trend: calculateTrend(item.count, prevCount),
        percentage: totalEvents > 0 ? Math.round((item.count / totalEvents) * 100 * 10) / 10 : 0,
      };
    });

    // Calculate derived metrics
    const currentMetrics = eventMetrics[0] || {
      total_events: 0,
      total_sessions: 0,
      form_starts: 0,
      form_submits: 0,
      clicks: 0,
      scrolls: 0,
    };

    const prevMetricsData = prevEventMetrics[0] || {
      total_events: 0,
      total_sessions: 0,
      form_starts: 0,
      form_submits: 0,
      clicks: 0,
      scrolls: 0,
    };

    const eventsPerSession = currentMetrics.total_sessions > 0
      ? currentMetrics.total_events / currentMetrics.total_sessions
      : 0;

    const prevEventsPerSession = prevMetricsData.total_sessions > 0
      ? prevMetricsData.total_events / prevMetricsData.total_sessions
      : 0;

    const formConversionRate = currentMetrics.form_starts > 0
      ? (currentMetrics.form_submits / currentMetrics.form_starts) * 100
      : 0;

    const prevFormConversionRate = prevMetricsData.form_starts > 0
      ? (prevMetricsData.form_submits / prevMetricsData.form_starts) * 100
      : 0;

    const data: EventsMetricsResponse = {
      eventBreakdown: eventBreakdownWithTrends,
      eventVolumeTrend,
      eventMetrics: {
        total_events: currentMetrics.total_events,
        total_sessions: currentMetrics.total_sessions,
        events_per_session: Math.round(eventsPerSession * 100) / 100,
        form_starts: currentMetrics.form_starts,
        form_submits: currentMetrics.form_submits,
        form_conversion_rate: Math.round(formConversionRate * 10) / 10,
        clicks: currentMetrics.clicks,
        scrolls: currentMetrics.scrolls,
        trends: {
          events_per_session: calculateTrend(eventsPerSession, prevEventsPerSession),
          form_conversion_rate: calculateTrend(formConversionRate, prevFormConversionRate),
          total_events: calculateTrend(currentMetrics.total_events, prevMetricsData.total_events),
        },
      },
      scrollDepthByPage,
    };

    // Store in cache for 5 minutes
    setCache(cacheKey, data);
    console.log(`[API/Events] Data cached successfully for ${days} days`);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('BigQuery error (Events):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events metrics' },
      { status: 500 }
    );
  }
}
