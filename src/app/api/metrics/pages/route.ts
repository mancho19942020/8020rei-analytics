import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import { getTopPagesQuery, UserType } from '@/lib/queries';

interface TopPageData {
  page_url: string;
  client: string;
  path: string;
  views: number;
  unique_users: number;
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

  const cacheKey = `pages-metrics-v1:${startDate && endDate ? `${startDate}:${endDate}` : days}:${userType}`;

  const cached = getCached<TopPageData[]>(cacheKey);
  if (cached) {
    console.log(`[API/Pages] Returning cached data for ${days} days`);
    return NextResponse.json({ success: true, data: cached, cached: true, timestamp: new Date().toISOString() });
  }

  console.log(`[API/Pages] Cache miss - fetching from BigQuery for ${days} days, userType: ${userType}`);

  try {
    const data = await runQuery<TopPageData>(getTopPagesQuery(days, userType, startDate, endDate));

    setCache(cacheKey, data);
    console.log(`[API/Pages] Data cached for ${days} days`);

    return NextResponse.json({ success: true, data, cached: false, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('BigQuery error (Pages):', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pages data' }, { status: 500 });
  }
}
