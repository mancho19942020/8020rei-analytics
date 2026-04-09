import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getFeatureViewsQuery,
  getFeatureAdoptionQuery,
  getFeatureTrendQuery,
  getTopPagesQuery,
  getPreviousFeatureViewsQuery,
  parseDateRangeFromSearchParams,
  UserType
} from '@/lib/queries';

interface FeatureViewData {
  feature: string;
  views: number;
  unique_users: number;
}

interface PreviousFeatureViewData {
  feature: string;
  views: number;
}

interface FeatureAdoptionData {
  feature: string;
  clients_using: number;
  adoption_pct: number;
}

interface FeatureTrendData {
  event_date: string;
  feature: string;
  views: number;
}

interface TopPageData {
  path: string;
  views: number;
  unique_users: number;
}

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface FeatureViewWithTrend extends FeatureViewData {
  trend?: TrendData;
}

interface FeaturesMetricsData {
  featureViews: FeatureViewWithTrend[];
  featureAdoption: FeatureAdoptionData[];
  featureTrend: FeatureTrendData[];
  topPages: TopPageData[];
  totalViews: number;
  totalFeatures: number;
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
  const cacheKey = `features-metrics-v1:${dateRange.startDate || dateRange.days || 30}:${dateRange.endDate || ''}:${userType}`;

  // Check if we have cached data
  const cached = getCached<FeaturesMetricsData>(cacheKey);

  if (cached) {
    console.log(`[API/Features] Returning cached data for dateRange:`, dateRange);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API/Features] Cache miss - fetching fresh data from BigQuery for dateRange:`, dateRange, `userType: ${userType}`);

  try {
    // Execute 5 queries in parallel
    const [
      featureViews,
      previousFeatureViews,
      featureAdoption,
      featureTrend,
      topPages,
    ] = await Promise.all([
      runQuery<FeatureViewData>(getFeatureViewsQuery(dateRange, userType)),
      runQuery<PreviousFeatureViewData>(getPreviousFeatureViewsQuery(dateRange, userType)),
      runQuery<FeatureAdoptionData>(getFeatureAdoptionQuery(dateRange, userType)),
      runQuery<FeatureTrendData>(getFeatureTrendQuery(dateRange, userType)),
      runQuery<TopPageData>(getTopPagesQuery(dateRange, userType)),
    ]);

    // Create a map of previous views by feature for trend calculation
    const previousViewsMap = new Map<string, number>();
    previousFeatureViews.forEach((item) => {
      previousViewsMap.set(item.feature, item.views);
    });

    // Add trend data to feature views
    const featureViewsWithTrends: FeatureViewWithTrend[] = featureViews.map((item) => ({
      ...item,
      trend: calculateTrend(item.views, previousViewsMap.get(item.feature) || 0),
    }));

    // Calculate totals
    const totalViews = featureViews.reduce((sum, item) => sum + item.views, 0);
    const totalFeatures = featureViews.length;

    const data: FeaturesMetricsData = {
      featureViews: featureViewsWithTrends,
      featureAdoption,
      featureTrend,
      topPages,
      totalViews,
      totalFeatures,
    };

    // Store in cache for 5 minutes
    setCache(cacheKey, data);
    console.log(`[API/Features] Data cached successfully for dateRange:`, dateRange);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('BigQuery error (Features):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch features metrics' },
      { status: 500 }
    );
  }
}
