import { NextRequest, NextResponse } from 'next/server';
import { runProductQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getDomainActivityOverviewQuery,
  getPreviousDomainOverviewQuery,
  getDomainLeaderboardQuery,
  getDomainActivityTrendQuery,
  getRevenueByDomainQuery,
  getFlaggedDomainsQuery,
} from '@/lib/product-queries';
import type {
  ClientDomainsData,
  DomainActivityOverview,
  DomainLeaderboardEntry,
  DomainActivityTrendEntry,
  RevenueByDomainEntry,
  FlaggedDomainEntry,
  TrendData,
} from '@/types/product';

interface PreviousDomainOverview {
  prev_total_active_domains: number;
  prev_total_properties: number;
  prev_leads_count: number;
  prev_total_revenue: number;
}

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

  const cacheKey = `product-domains-v1:${days}`;
  const cached = getCached<ClientDomainsData>(cacheKey);

  if (cached) {
    console.log(`[API/ProductDomains] Returning cached data for ${days} days`);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API/ProductDomains] Cache miss - fetching from BigQuery for ${days} days`);

  try {
    const [
      overviewResult,
      prevOverviewResult,
      leaderboardResult,
      trendResult,
      revenueResult,
      flaggedResult,
    ] = await Promise.all([
      runProductQuery<DomainActivityOverview>(getDomainActivityOverviewQuery(days)),
      runProductQuery<PreviousDomainOverview>(getPreviousDomainOverviewQuery(days)),
      runProductQuery<DomainLeaderboardEntry>(getDomainLeaderboardQuery(days)),
      runProductQuery<DomainActivityTrendEntry>(getDomainActivityTrendQuery(days)),
      runProductQuery<RevenueByDomainEntry>(getRevenueByDomainQuery(days)),
      runProductQuery<FlaggedDomainEntry>(getFlaggedDomainsQuery(days)),
    ]);

    const current = overviewResult[0] || {
      total_active_domains: 0,
      total_properties: 0,
      leads_count: 0,
      appointments_count: 0,
      deals_count: 0,
      total_revenue: 0,
    };

    const prev = prevOverviewResult[0] || {
      prev_total_active_domains: 0,
      prev_total_properties: 0,
      prev_leads_count: 0,
      prev_total_revenue: 0,
    };

    const data: ClientDomainsData = {
      overview: {
        ...current,
        trends: {
          total_active_domains: calculateTrend(current.total_active_domains, prev.prev_total_active_domains),
          total_properties: calculateTrend(current.total_properties, prev.prev_total_properties),
          leads_count: calculateTrend(current.leads_count, prev.prev_leads_count),
          total_revenue: calculateTrend(current.total_revenue, prev.prev_total_revenue),
        },
      },
      leaderboard: leaderboardResult,
      activityTrend: trendResult,
      revenueByDomain: revenueResult,
      flaggedDomains: flaggedResult,
    };

    setCache(cacheKey, data);
    console.log(`[API/ProductDomains] Data cached for ${days} days`);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('BigQuery error (Product Domains):', errorMessage);
    return NextResponse.json(
      { success: false, error: `Failed to fetch domain metrics: ${errorMessage}` },
      { status: 500 }
    );
  }
}
