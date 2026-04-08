import { NextRequest, NextResponse } from 'next/server';
import { runProductQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getAiTaskBoardOverviewQuery,
  getPreviousAiTaskBoardOverviewQuery,
  getAiTaskBoardTasksQuery,
  getAiTaskBoardTeamWorkloadQuery,
  getAiTaskBoardSectionBreakdownQuery,
  getAiTaskBoardWeeklyTrendQuery,
  getAiTaskBoardTaskAgingQuery,
} from '@/lib/asana-queries';
import type { DateRangeParams } from '@/lib/asana-queries';
import type {
  AiTaskBoardData,
  AiTaskBoardEntry,
  AsanaBoardOverview,
  AsanaTeamWorkloadEntry,
  AsanaSectionBreakdownEntry,
  AsanaWeeklyTrendEntry,
  AsanaTaskAgingEntry,
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
    ? `asana-ai-board-v1:${startDate}_${endDate}`
    : `asana-ai-board-v1:${days}`;
  const cached = getCached<AiTaskBoardData>(cacheKey);

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
    ] = await Promise.all([
      runProductQuery<AsanaBoardOverview>(getAiTaskBoardOverviewQuery()),
      runProductQuery<PreviousOverview>(getPreviousAiTaskBoardOverviewQuery(dateRange)),
      runProductQuery<AiTaskBoardEntry>(getAiTaskBoardTasksQuery()),
      runProductQuery<AsanaTeamWorkloadEntry>(getAiTaskBoardTeamWorkloadQuery()),
      runProductQuery<AsanaSectionBreakdownEntry>(getAiTaskBoardSectionBreakdownQuery()),
      runProductQuery<AsanaWeeklyTrendEntry>(getAiTaskBoardWeeklyTrendQuery(dateRange)),
      runProductQuery<AsanaTaskAgingEntry>(getAiTaskBoardTaskAgingQuery()),
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

    const data: AiTaskBoardData = {
      overview,
      tasks: tasksResult,
      teamWorkload: workloadResult,
      sectionBreakdown: sectionResult,
      weeklyTrend: weeklyTrendResult,
      taskAging: agingResult,
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
    console.error('BigQuery error (AI Task Board):', msg);
    return NextResponse.json(
      { success: false, error: `Failed to fetch AI task board data: ${msg}` },
      { status: 500 }
    );
  }
}
