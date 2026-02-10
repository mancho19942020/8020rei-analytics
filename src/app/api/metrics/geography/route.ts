import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getCountryQuery,
  getRegionQuery,
  getCityQuery,
  getContinentQuery,
  getPreviousCountryQuery,
  UserType
} from '@/lib/queries';

interface CountryData {
  country: string;
  users: number;
  events: number;
}

interface RegionData {
  region: string;
  users: number;
  events: number;
}

interface CityData {
  city: string;
  region: string;
  users: number;
  events: number;
}

interface ContinentData {
  continent: string;
  users: number;
  events: number;
}

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface CountryWithTrend extends CountryData {
  trend?: TrendData;
  percentage?: number;
}

interface GeographyMetricsData {
  byCountry: CountryWithTrend[];
  byRegion: RegionData[];
  byCity: CityData[];
  byContinent: ContinentData[];
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
  const cacheKey = `geography-metrics-v1:${days}:${userType}`;

  // Check if we have cached data
  const cached = getCached<GeographyMetricsData>(cacheKey);

  if (cached) {
    console.log(`[API/Geography] Returning cached data for ${days} days`);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API/Geography] Cache miss - fetching fresh data from BigQuery for ${days} days, userType: ${userType}`);

  try {
    // Execute 5 queries in parallel (4 current + 1 previous period for trends)
    const [
      byCountry,
      byRegion,
      byCity,
      byContinent,
      prevCountry
    ] = await Promise.all([
      runQuery<CountryData>(getCountryQuery(days, userType)),
      runQuery<RegionData>(getRegionQuery(days, userType)),
      runQuery<CityData>(getCityQuery(days, userType)),
      runQuery<ContinentData>(getContinentQuery(days, userType)),
      runQuery<CountryData>(getPreviousCountryQuery(days, userType)),
    ]);

    // Create a map of previous period data for trend calculation
    const prevCountryMap = new Map<string, number>();
    prevCountry.forEach(item => {
      prevCountryMap.set(item.country, item.users);
    });

    // Calculate total users for percentage calculation
    const totalUsers = byCountry.reduce((sum, item) => sum + item.users, 0);

    // Add trend data and percentage to country data
    const countryWithTrends: CountryWithTrend[] = byCountry.map(item => {
      const prevUsers = prevCountryMap.get(item.country) || 0;
      return {
        ...item,
        trend: calculateTrend(item.users, prevUsers),
        percentage: totalUsers > 0 ? Math.round((item.users / totalUsers) * 100 * 10) / 10 : 0,
      };
    });

    const data: GeographyMetricsData = {
      byCountry: countryWithTrends,
      byRegion,
      byCity,
      byContinent,
    };

    // Store in cache for 5 minutes
    setCache(cacheKey, data);
    console.log(`[API/Geography] Data cached successfully for ${days} days`);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('BigQuery error (Geography):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch geography metrics' },
      { status: 500 }
    );
  }
}
