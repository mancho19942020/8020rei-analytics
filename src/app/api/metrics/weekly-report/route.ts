import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runProductQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getWeeklyDeliverablesQuery,
  getWeeklyBugStatusQuery,
  getWeeklyCriticalBugsQuery,
  getWeeklyDataInquiriesQuery,
  getWeeklySuggestionsQuery,
} from '@/lib/asana-queries';
import type {
  WeeklyReportData,
  WeeklyDeliverable,
  WeeklyBugStatus,
  WeeklyCriticalBugs,
  WeeklyDataInquiries,
  WeeklySuggestions,
} from '@/types/weekly-report';

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '7');

  const cacheKey = `weekly-report-v1:${days}`;
  const cached = getCached<WeeklyReportData>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true, timestamp: new Date().toISOString() });
  }

  try {
    const [deliverables, bugRows, criticalRows, inquiryRows, suggestionRows] = await Promise.all([
      runProductQuery<WeeklyDeliverable>(getWeeklyDeliverablesQuery(days)),
      runProductQuery<WeeklyBugStatus>(getWeeklyBugStatusQuery(days)),
      runProductQuery<WeeklyCriticalBugs>(getWeeklyCriticalBugsQuery(days)),
      runProductQuery<WeeklyDataInquiries>(getWeeklyDataInquiriesQuery(days)),
      runProductQuery<WeeklySuggestions>(getWeeklySuggestionsQuery(days)),
    ]);

    const weekEnd = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekEnd.getDate() - days);

    const data: WeeklyReportData = {
      deliverables,
      bugs: bugRows[0] || { reported_this_week: 0, closed_this_week: 0, open: 0, customer_reported: 0, internal_product: 0 },
      critical_bugs: criticalRows[0] || { reported_this_week: 0, closed_this_week: 0, open: 0 },
      data_inquiries: inquiryRows[0] || { reported_this_week: 0, open: 0 },
      suggestions: suggestionRows[0] || { new_this_week: 0, under_review: 0, in_execution: 0, in_backlog: 0, delivered: 0 },
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
    };

    setCache(cacheKey, data);

    return NextResponse.json({ success: true, data, cached: false, timestamp: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('BigQuery error (Weekly Report):', msg);
    return NextResponse.json(
      { success: false, error: `Failed to fetch weekly report data: ${msg}` },
      { status: 500 }
    );
  }
}
