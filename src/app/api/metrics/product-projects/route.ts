import { NextRequest, NextResponse } from 'next/server';
import { runProductQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getProjectStatusOverviewQuery,
  getPreviousProjectStatusOverviewQuery,
  getProjectsTableQuery,
  getBugTrackingOverviewQuery,
  getBugOriginsQuery,
  getWeeklyBugTrendQuery,
  getTeamWorkloadQuery,
  getDeliveryTimelineQuery,
} from '@/lib/product-queries';
import type {
  ProductProjectsData,
  ProjectStatusOverview,
  ProjectEntry,
  BugEntry,
  WeeklyBugTrend,
  TeamWorkloadEntry,
  DeliveryTimelineEntry,
} from '@/types/product';

interface BugOverviewResult {
  total_unique_bugs: number;
  customer_bugs: number;
  critical_bugs: number;
  critical_open_bugs: number;
}

interface PreviousProjectOverview {
  prev_active_projects: number;
  prev_on_track: number;
  prev_delayed: number;
  prev_completed: number;
}

interface TrendData {
  value: number;
  isPositive: boolean;
}

function calculateTrend(current: number, previous: number, invertPositive = false): TrendData {
  if (!previous || previous === 0) {
    return { value: 0, isPositive: true };
  }
  const change = ((current - previous) / previous) * 100;
  const isPositive = invertPositive ? change <= 0 : change >= 0;
  return { value: Math.abs(change), isPositive };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');

  const cacheKey = `product-projects-v2:${days}`;
  const cached = getCached<ProductProjectsData>(cacheKey);

  if (cached) {
    console.log(`[API/ProductProjects] Returning cached data for ${days} days`);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API/ProductProjects] Cache miss - fetching from BigQuery for ${days} days`);

  try {
    const [
      overviewResult,
      prevOverviewResult,
      projectsResult,
      bugOverviewResult,
      bugOriginsResult,
      weeklyTrendResult,
      workloadResult,
      timelineResult,
    ] = await Promise.all([
      runProductQuery<ProjectStatusOverview>(getProjectStatusOverviewQuery(days)),
      runProductQuery<PreviousProjectOverview>(getPreviousProjectStatusOverviewQuery(days)),
      runProductQuery<ProjectEntry>(getProjectsTableQuery(days)),
      runProductQuery<BugOverviewResult>(getBugTrackingOverviewQuery(days)),
      runProductQuery<BugEntry>(getBugOriginsQuery(days)),
      runProductQuery<WeeklyBugTrend>(getWeeklyBugTrendQuery(days)),
      runProductQuery<TeamWorkloadEntry>(getTeamWorkloadQuery(days)),
      runProductQuery<DeliveryTimelineEntry>(getDeliveryTimelineQuery(days)),
    ]);

    const current = overviewResult[0] || {
      active_projects: 0,
      on_track: 0,
      delayed: 0,
      completed: 0,
    };

    const prev = prevOverviewResult[0] || {
      prev_active_projects: 0,
      prev_on_track: 0,
      prev_delayed: 0,
      prev_completed: 0,
    };

    const overview: ProjectStatusOverview = {
      ...current,
      trends: {
        active_projects: calculateTrend(current.active_projects, prev.prev_active_projects),
        on_track: calculateTrend(current.on_track, prev.prev_on_track),
        delayed: calculateTrend(current.delayed, prev.prev_delayed, true),
        completed: calculateTrend(current.completed, prev.prev_completed),
      },
    };

    const bugOverview = bugOverviewResult[0] || {
      total_unique_bugs: 0,
      customer_bugs: 0,
      critical_bugs: 0,
      critical_open_bugs: 0,
    };

    const data: ProductProjectsData = {
      overview,
      projects: projectsResult,
      bugTracking: {
        ...bugOverview,
        bug_origins: bugOriginsResult,
        weekly_trend: weeklyTrendResult,
      },
      teamWorkload: workloadResult,
      deliveryTimeline: timelineResult,
    };

    setCache(cacheKey, data);
    console.log(`[API/ProductProjects] Data cached for ${days} days`);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('BigQuery error (Product Projects):', errorMessage);
    return NextResponse.json(
      { success: false, error: `Failed to fetch project metrics: ${errorMessage}` },
      { status: 500 }
    );
  }
}
