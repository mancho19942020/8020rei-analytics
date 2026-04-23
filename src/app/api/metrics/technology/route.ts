import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getDeviceCategoryQuery,
  getBrowserDistributionQuery,
  getOperatingSystemQuery,
  getDeviceLanguageQuery,
  getPreviousDeviceCategoryQuery,
  parseDateRangeFromSearchParams,
  UserType
} from '@/lib/queries';

interface DeviceCategoryData {
  device_category: string;
  users: number;
  events: number;
}

interface BrowserData {
  browser: string;
  users: number;
  events: number;
}

interface OperatingSystemData {
  os: string;
  users: number;
  events: number;
}

interface LanguageData {
  language: string;
  users: number;
  events: number;
}

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface DeviceCategoryWithTrend extends DeviceCategoryData {
  trend?: TrendData;
  percentage?: number;
}

interface TechnologyMetricsData {
  deviceCategory: DeviceCategoryWithTrend[];
  browserDistribution: BrowserData[];
  operatingSystem: OperatingSystemData[];
  deviceLanguage: LanguageData[];
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
  const authError = await requireAuth(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const dateRange = parseDateRangeFromSearchParams(searchParams);
  const userType = (searchParams.get('userType') || 'all') as UserType;

  // Create a unique cache key based on the query parameters
  const cacheKey = `technology-metrics-v1:${dateRange.startDate || dateRange.days || 30}:${dateRange.endDate || ''}:${userType}`;

  // Check if we have cached data
  const cached = getCached<TechnologyMetricsData>(cacheKey);

  if (cached) {
    console.log(`[API/Technology] Returning cached data for dateRange:`, dateRange);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API/Technology] Cache miss - fetching fresh data from BigQuery for dateRange:`, dateRange, `userType: ${userType}`);

  try {
    // Execute 5 queries in parallel (4 current + 1 previous period for trends)
    const [
      deviceCategory,
      browserDistribution,
      operatingSystem,
      deviceLanguage,
      prevDeviceCategory
    ] = await Promise.all([
      runQuery<DeviceCategoryData>(getDeviceCategoryQuery(dateRange, userType)),
      runQuery<BrowserData>(getBrowserDistributionQuery(dateRange, userType)),
      runQuery<OperatingSystemData>(getOperatingSystemQuery(dateRange, userType)),
      runQuery<LanguageData>(getDeviceLanguageQuery(dateRange, userType)),
      runQuery<DeviceCategoryData>(getPreviousDeviceCategoryQuery(dateRange, userType)),
    ]);

    // Create a map of previous period data for trend calculation
    const prevCategoryMap = new Map<string, number>();
    prevDeviceCategory.forEach(item => {
      prevCategoryMap.set(item.device_category, item.users);
    });

    // Calculate total users for percentage calculation
    const totalUsers = deviceCategory.reduce((sum, item) => sum + item.users, 0);

    // Add trend data and percentage to device category
    const deviceCategoryWithTrends: DeviceCategoryWithTrend[] = deviceCategory.map(item => {
      const prevUsers = prevCategoryMap.get(item.device_category) || 0;
      return {
        ...item,
        trend: calculateTrend(item.users, prevUsers),
        percentage: totalUsers > 0 ? Math.round((item.users / totalUsers) * 100 * 10) / 10 : 0,
      };
    });

    const data: TechnologyMetricsData = {
      deviceCategory: deviceCategoryWithTrends,
      browserDistribution,
      operatingSystem,
      deviceLanguage,
    };

    // Store in cache for 5 minutes
    setCache(cacheKey, data);
    console.log(`[API/Technology] Data cached successfully for dateRange:`, dateRange);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('BigQuery error (Technology):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch technology metrics' },
      { status: 500 }
    );
  }
}
