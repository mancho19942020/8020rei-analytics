import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getSessionsByDayOfWeekQuery,
  getFirstVisitsTrendQuery,
  getPeakHoursQuery,
  getAvgSessionDurationTrendQuery,
  getSessionsPerUserTrendQuery,
  getActiveDaysPerUserQuery,
  parseDateRangeFromSearchParams,
  UserType,
} from '@/lib/queries';

interface SessionsByDayOfWeek {
  day_of_week: number;
  sessions: number;
}

interface FirstVisitsTrend {
  event_date: string;
  first_visits: number;
}

interface PeakHours {
  day_of_week: number;
  hour: number;
  sessions: number;
}

interface AvgSessionDuration {
  event_date: string;
  avg_duration_sec: number;
  total_sessions: number;
}

interface SessionsPerUser {
  event_date: string;
  sessions_per_user: number;
  total_sessions: number;
  unique_users: number;
}

interface ActiveDays {
  active_days: number;
  user_count: number;
}

interface EngagementMetricsData {
  sessionsByDayOfWeek: SessionsByDayOfWeek[];
  firstVisitsTrend: FirstVisitsTrend[];
  peakHours: PeakHours[];
  avgSessionDuration: AvgSessionDuration[];
  sessionsPerUser: SessionsPerUser[];
  activeDays: ActiveDays[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateRange = parseDateRangeFromSearchParams(searchParams);
  const userType = (searchParams.get('userType') || 'all') as UserType;

  const cacheKey = `engagement-metrics-v1:${dateRange.startDate || dateRange.days || 30}:${dateRange.endDate || ''}:${userType}`;

  const cached = getCached<EngagementMetricsData>(cacheKey);

  if (cached) {
    console.log(`[API/Engagement] Returning cached data for dateRange:`, dateRange);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API/Engagement] Cache miss - fetching from BigQuery for dateRange:`, dateRange, `userType: ${userType}`);

  try {
    const [
      sessionsByDayOfWeek,
      firstVisitsTrend,
      peakHours,
      avgSessionDuration,
      sessionsPerUser,
      activeDays,
    ] = await Promise.all([
      runQuery<SessionsByDayOfWeek>(getSessionsByDayOfWeekQuery(dateRange, userType)),
      runQuery<FirstVisitsTrend>(getFirstVisitsTrendQuery(dateRange, userType)),
      runQuery<PeakHours>(getPeakHoursQuery(dateRange, userType)),
      runQuery<AvgSessionDuration>(getAvgSessionDurationTrendQuery(dateRange, userType)),
      runQuery<SessionsPerUser>(getSessionsPerUserTrendQuery(dateRange, userType)),
      runQuery<ActiveDays>(getActiveDaysPerUserQuery(dateRange, userType)),
    ]);

    const data: EngagementMetricsData = {
      sessionsByDayOfWeek,
      firstVisitsTrend,
      peakHours,
      avgSessionDuration,
      sessionsPerUser,
      activeDays,
    };

    setCache(cacheKey, data);
    console.log(`[API/Engagement] Data cached successfully for dateRange:`, dateRange);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('BigQuery error (Engagement):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch engagement metrics' },
      { status: 500 }
    );
  }
}
