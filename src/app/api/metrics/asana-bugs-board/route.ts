import { NextRequest, NextResponse } from 'next/server';
import { runProductQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getBugsDiBoardOverviewQuery,
  getPreviousBugsDiBoardOverviewQuery,
  getBugsDiBoardTasksQuery,
  getBugsDiBoardTeamWorkloadQuery,
  getBugsDiBoardSectionBreakdownQuery,
  getBugsDiBoardWeeklyTrendQuery,
  getBugsDiBoardTaskAgingQuery,
  getBugsByTypeQuery,
  getBugsByModuleQuery,
  getBugsByOriginQuery,
} from '@/lib/asana-queries';
import type { DateRangeParams } from '@/lib/asana-queries';
import type {
  BugsDiBoardData,
  BugsDiBoardEntry,
  AsanaBoardOverview,
  AsanaTeamWorkloadEntry,
  AsanaSectionBreakdownEntry,
  AsanaWeeklyTrendEntry,
  AsanaTaskAgingEntry,
  BugsByTypeEntry,
  BugsByModuleEntry,
  BugsByOriginEntry,
} from '@/types/asana-tasks';
import { TrendData } from '@/types/product';

interface PreviousOverview {
  total_tasks: number;
  completed: number;
  overdue: number;
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
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const dateRange: DateRangeParams = startDate && endDate ? { startDate, endDate } : { days };

  const cacheKey = startDate && endDate
    ? `asana-bugs-board-v1:${startDate}_${endDate}`
    : `asana-bugs-board-v1:${days}`;
  const cached = getCached<BugsDiBoardData>(cacheKey);

  if (cached) {
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const [
      overviewResult,
      prevOverviewResult,
      tasksResult,
      workloadResult,
      sectionResult,
      weeklyTrendResult,
      agingResult,
      typeResult,
      moduleResult,
      originResult,
    ] = await Promise.all([
      runProductQuery<AsanaBoardOverview>(getBugsDiBoardOverviewQuery()),
      runProductQuery<PreviousOverview>(getPreviousBugsDiBoardOverviewQuery(dateRange)),
      runProductQuery<BugsDiBoardEntry>(getBugsDiBoardTasksQuery()),
      runProductQuery<AsanaTeamWorkloadEntry>(getBugsDiBoardTeamWorkloadQuery()),
      runProductQuery<AsanaSectionBreakdownEntry>(getBugsDiBoardSectionBreakdownQuery()),
      runProductQuery<AsanaWeeklyTrendEntry>(getBugsDiBoardWeeklyTrendQuery(dateRange)),
      runProductQuery<AsanaTaskAgingEntry>(getBugsDiBoardTaskAgingQuery()),
      runProductQuery<BugsByTypeEntry>(getBugsByTypeQuery()),
      runProductQuery<BugsByModuleEntry>(getBugsByModuleQuery()),
      runProductQuery<BugsByOriginEntry>(getBugsByOriginQuery()),
    ]);

    const current = overviewResult[0] || {
      total_tasks: 0, in_progress: 0, to_do: 0, backlog: 0,
      completed: 0, overdue: 0, unassigned: 0, avg_business_impact: null,
    };

    const prev = prevOverviewResult[0] || {
      total_tasks: 0, completed: 0, overdue: 0,
    };

    const overview: AsanaBoardOverview = {
      ...current,
      trends: {
        total_tasks: calculateTrend(current.total_tasks, prev.total_tasks),
        completed: calculateTrend(current.completed, prev.completed),
        overdue: calculateTrend(current.overdue, prev.overdue, true),
      },
    };

    const data: BugsDiBoardData = {
      overview,
      tasks: tasksResult,
      teamWorkload: workloadResult,
      sectionBreakdown: sectionResult,
      weeklyTrend: weeklyTrendResult,
      taskAging: agingResult,
      bugsByType: typeResult,
      bugsByModule: moduleResult,
      bugsByOrigin: originResult,
    };

    setCache(cacheKey, data);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('BigQuery error (Bugs DI Board):', msg);
    return NextResponse.json(
      { success: false, error: `Failed to fetch Bugs & DI board data: ${msg}` },
      { status: 500 }
    );
  }
}
