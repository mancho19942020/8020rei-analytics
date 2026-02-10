import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getUserActivityMetricsQuery,
  getNewVsReturningUsersQuery,
  getEngagementMetricsQuery,
  getPreviousUserActivityMetricsQuery,
  getPreviousEngagementMetricsQuery,
  UserType
} from '@/lib/queries';

interface UserActivityMetrics {
  dau: number;
  wau: number;
  mau: number;
}

interface PreviousUserActivityMetrics {
  prev_dau: number;
  prev_wau: number;
  prev_mau: number;
}

interface NewVsReturningData {
  event_date: string;
  new_users: number;
  returning_users: number;
}

interface EngagementMetrics {
  total_sessions: number;
  engaged_sessions: number;
  avg_engagement_time_sec: number;
  unique_users: number;
  sessions_per_user: number;
  engaged_rate: number;
  bounce_rate: number;
}

interface PreviousEngagementMetrics {
  prev_total_sessions: number;
  prev_engaged_sessions: number;
  prev_avg_engagement_time_sec: number;
  prev_unique_users: number;
  prev_sessions_per_user: number;
  prev_engaged_rate: number;
  prev_bounce_rate: number;
}

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface ActivityMetricsWithTrends extends UserActivityMetrics {
  trends: {
    dau: TrendData;
    wau: TrendData;
    mau: TrendData;
  };
}

interface EngagementMetricsWithTrends extends EngagementMetrics {
  trends: {
    total_sessions: TrendData;
    engaged_sessions: TrendData;
    avg_engagement_time_sec: TrendData;
    unique_users: TrendData;
    sessions_per_user: TrendData;
    engaged_rate: TrendData;
    bounce_rate: TrendData;
  };
}

interface UsersMetricsData {
  activityMetrics: ActivityMetricsWithTrends;
  newVsReturning: NewVsReturningData[];
  engagementMetrics: EngagementMetricsWithTrends;
}

// Calculate trend from current and previous values
function calculateTrend(current: number, previous: number, invertPositive = false): TrendData {
  if (!previous || previous === 0) {
    return { value: 0, isPositive: true };
  }
  const change = ((current - previous) / previous) * 100;
  // For metrics like bounce rate, a decrease is positive
  const isPositive = invertPositive ? change <= 0 : change >= 0;
  return { value: Math.abs(change), isPositive };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');
  const userType = (searchParams.get('userType') || 'all') as UserType;

  // Create a unique cache key based on the query parameters
  const cacheKey = `users-metrics-v2:${days}:${userType}`;

  // Check if we have cached data
  const cached = getCached<UsersMetricsData>(cacheKey);

  if (cached) {
    console.log(`[API/Users] Returning cached data for ${days} days`);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API/Users] Cache miss - fetching fresh data from BigQuery for ${days} days, userType: ${userType}`);

  try {
    // Execute 5 queries in parallel (current + previous period data)
    const [
      activityMetrics,
      prevActivityMetrics,
      newVsReturning,
      engagementMetrics,
      prevEngagementMetrics
    ] = await Promise.all([
      runQuery<UserActivityMetrics>(getUserActivityMetricsQuery(days, userType)),
      runQuery<PreviousUserActivityMetrics>(getPreviousUserActivityMetricsQuery(userType)),
      runQuery<NewVsReturningData>(getNewVsReturningUsersQuery(days, userType)),
      runQuery<EngagementMetrics>(getEngagementMetricsQuery(days, userType)),
      runQuery<PreviousEngagementMetrics>(getPreviousEngagementMetricsQuery(days, userType)),
    ]);

    const currentActivity = activityMetrics[0] || { dau: 0, wau: 0, mau: 0 };
    const prevActivity = prevActivityMetrics[0] || { prev_dau: 0, prev_wau: 0, prev_mau: 0 };

    const currentEngagement = engagementMetrics[0] || {
      total_sessions: 0,
      engaged_sessions: 0,
      avg_engagement_time_sec: 0,
      unique_users: 0,
      sessions_per_user: 0,
      engaged_rate: 0,
      bounce_rate: 0,
    };

    const prevEngagement = prevEngagementMetrics[0] || {
      prev_total_sessions: 0,
      prev_engaged_sessions: 0,
      prev_avg_engagement_time_sec: 0,
      prev_unique_users: 0,
      prev_sessions_per_user: 0,
      prev_engaged_rate: 0,
      prev_bounce_rate: 0,
    };

    const data: UsersMetricsData = {
      activityMetrics: {
        ...currentActivity,
        trends: {
          dau: calculateTrend(currentActivity.dau, prevActivity.prev_dau),
          wau: calculateTrend(currentActivity.wau, prevActivity.prev_wau),
          mau: calculateTrend(currentActivity.mau, prevActivity.prev_mau),
        },
      },
      newVsReturning,
      engagementMetrics: {
        ...currentEngagement,
        trends: {
          total_sessions: calculateTrend(currentEngagement.total_sessions, prevEngagement.prev_total_sessions),
          engaged_sessions: calculateTrend(currentEngagement.engaged_sessions, prevEngagement.prev_engaged_sessions),
          avg_engagement_time_sec: calculateTrend(currentEngagement.avg_engagement_time_sec, prevEngagement.prev_avg_engagement_time_sec),
          unique_users: calculateTrend(currentEngagement.unique_users, prevEngagement.prev_unique_users),
          sessions_per_user: calculateTrend(currentEngagement.sessions_per_user, prevEngagement.prev_sessions_per_user),
          engaged_rate: calculateTrend(currentEngagement.engaged_rate, prevEngagement.prev_engaged_rate),
          // For bounce rate, lower is better
          bounce_rate: calculateTrend(currentEngagement.bounce_rate, prevEngagement.prev_bounce_rate, true),
        },
      },
    };

    // Store in cache for 5 minutes
    setCache(cacheKey, data);
    console.log(`[API/Users] Data cached successfully for ${days} days`);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('BigQuery error (Users):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users metrics' },
      { status: 500 }
    );
  }
}
