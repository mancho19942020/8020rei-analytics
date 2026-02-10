import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getDauAnomalyQuery,
  getEventVolumeAnomalyQuery,
  getActiveClientsWowQuery,
  getClientDormancyQuery,
  getNewClientsQuery,
  getFeatureUsageWowQuery,
  getFirstVisitsAnomalyQuery,
  UserType
} from '@/lib/queries';

// ============================================
// Type Definitions
// ============================================

interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'platform' | 'client' | 'feature' | 'engagement' | 'growth';
  description: string;
  entity?: string;
  metrics?: {
    baseline?: number;
    current?: number;
    change_pct?: number;
  };
  detected_at: string;
  action: string;
  link?: string;
}

interface InsightsResponse {
  alerts: Alert[];
  summary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  alertsByCategory: { category: string; count: number }[];
  last_checked: string;
}

// ============================================
// Alert Detection Functions
// ============================================

function detectDauAlert(data: any[]): Alert | null {
  if (!data || data.length === 0) return null;

  const row = data[0];
  const zScore = row.z_score;

  if (!zScore || Math.abs(zScore) < 2) return null;

  const isSpike = zScore > 0;
  const severity = Math.abs(zScore) > 3 ? 'critical' : 'warning';

  return {
    id: isSpike ? 'P1' : 'P2',
    name: isSpike ? 'DAU Spike' : 'DAU Drop',
    severity: isSpike ? 'warning' : 'critical',
    category: 'platform',
    description: isSpike
      ? `Daily active users exceeded ${Math.abs(zScore).toFixed(1)}σ above the 14-day average (${row.dau} vs avg ${Math.round(row.rolling_avg)})`
      : `Daily active users fell ${Math.abs(zScore).toFixed(1)}σ below the 14-day average (${row.dau} vs avg ${Math.round(row.rolling_avg)})`,
    metrics: {
      baseline: Math.round(row.rolling_avg),
      current: row.dau,
      change_pct: row.rolling_avg > 0 ? Math.round(((row.dau - row.rolling_avg) / row.rolling_avg) * 100) : 0,
    },
    detected_at: new Date().toISOString(),
    action: isSpike
      ? 'Check if spike is from real users or bots. If real, identify the source (new client? marketing campaign?).'
      : 'Check platform uptime and error logs. Verify GA4 is still collecting data.',
    link: '/users',
  };
}

function detectEventVolumeAlert(data: any[]): Alert | null {
  if (!data || data.length === 0) return null;

  const row = data[0];
  const zScore = row.z_score;

  if (!zScore || Math.abs(zScore) < 2) return null;

  const isSpike = zScore > 0;

  return {
    id: 'P3',
    name: 'Event Volume Anomaly',
    severity: 'warning',
    category: 'platform',
    description: isSpike
      ? `Total daily events spiked ${Math.abs(zScore).toFixed(1)}σ above normal (${row.total_events?.toLocaleString()} vs avg ${Math.round(row.avg_events)?.toLocaleString()})`
      : `Total daily events dropped ${Math.abs(zScore).toFixed(1)}σ below normal (${row.total_events?.toLocaleString()} vs avg ${Math.round(row.avg_events)?.toLocaleString()})`,
    metrics: {
      baseline: Math.round(row.avg_events),
      current: row.total_events,
      change_pct: row.avg_events > 0 ? Math.round(((row.total_events - row.avg_events) / row.avg_events) * 100) : 0,
    },
    detected_at: new Date().toISOString(),
    action: isSpike
      ? 'Check Events chapter for which event type spiked. Look for bot activity.'
      : 'Verify gtag is still firing. Check if a deployment broke analytics tracking.',
    link: '/events',
  };
}

function detectActiveClientsAlert(data: any[]): Alert | null {
  if (!data || data.length === 0) return null;

  const row = data[0];
  const pctChange = row.pct_change;

  // Alert if drop is >20%
  if (!pctChange || pctChange >= -20) return null;

  return {
    id: 'P5',
    name: 'Active Clients Count Drop',
    severity: 'critical',
    category: 'platform',
    description: `Active clients dropped ${Math.abs(pctChange).toFixed(1)}% week-over-week (${row.this_week} this week vs ${row.last_week} last week)`,
    metrics: {
      baseline: row.last_week,
      current: row.this_week,
      change_pct: pctChange,
    },
    detected_at: new Date().toISOString(),
    action: 'Identify which specific clients went dormant. Cross-reference with CRM for churn risk.',
    link: '/clients',
  };
}

function detectDormantClientAlerts(data: any[]): Alert[] {
  if (!data || data.length === 0) return [];

  return data.map((row, index) => ({
    id: `C1-${index + 1}`,
    name: 'Client Going Dormant',
    severity: 'critical' as const,
    category: 'client' as const,
    description: `${row.client} averaged ${row.avg_weekly} events/week, now has ${row.events_last_7d} in the last 7 days`,
    entity: row.client,
    metrics: {
      baseline: row.avg_weekly,
      current: row.events_last_7d,
      change_pct: row.avg_weekly > 0 ? Math.round(((row.events_last_7d - row.avg_weekly) / row.avg_weekly) * 100) : -100,
    },
    detected_at: new Date().toISOString(),
    action: 'Immediate outreach. Check CRM for recent tickets. Review their last session data.',
    link: `/clients?filter=${row.client}`,
  }));
}

function detectNewClientAlerts(data: any[]): Alert[] {
  if (!data || data.length === 0) return [];

  return data.map((row, index) => ({
    id: `C4-${index + 1}`,
    name: 'New Client Detected',
    severity: 'info' as const,
    category: 'client' as const,
    description: `${row.client} appeared for the first time in the last 7 days`,
    entity: row.client,
    detected_at: new Date().toISOString(),
    action: 'Verify it\'s a legitimate new client. Track their onboarding journey. Set up welcome outreach.',
    link: `/clients?filter=${row.client}`,
  }));
}

function detectFeatureAlerts(data: any[]): Alert[] {
  if (!data || data.length === 0) return [];

  const alerts: Alert[] = [];

  data.forEach((row, index) => {
    const pctChange = row.pct_change;

    // Feature spike: >100% increase
    if (pctChange > 100) {
      alerts.push({
        id: `F1-${index + 1}`,
        name: 'Feature Usage Spike',
        severity: 'info',
        category: 'feature',
        description: `${row.feature} views increased ${pctChange.toFixed(1)}% WoW (${row.this_week} vs ${row.last_week})`,
        entity: row.feature,
        metrics: {
          baseline: row.last_week,
          current: row.this_week,
          change_pct: pctChange,
        },
        detected_at: new Date().toISOString(),
        action: 'Investigate what drove the spike. Check which clients drove the increase.',
        link: '/features',
      });
    }

    // Feature abandonment: >50% drop (minimum 20 views last week)
    if (pctChange < -50 && row.last_week > 20) {
      alerts.push({
        id: `F2-${index + 1}`,
        name: 'Feature Abandonment',
        severity: 'warning',
        category: 'feature',
        description: `${row.feature} views dropped ${Math.abs(pctChange).toFixed(1)}% WoW (${row.this_week} vs ${row.last_week})`,
        entity: row.feature,
        metrics: {
          baseline: row.last_week,
          current: row.this_week,
          change_pct: pctChange,
        },
        detected_at: new Date().toISOString(),
        action: 'Test the feature manually. Check if a deployment broke it. Review if the URL pattern changed.',
        link: '/features',
      });
    }
  });

  return alerts;
}

function detectFirstVisitsAlert(data: any[]): Alert | null {
  if (!data || data.length === 0) return null;

  const row = data[0];
  const zScore = row.z_score;

  // Only alert on significant spike (>2σ)
  if (!zScore || zScore < 2) return null;

  return {
    id: 'G1',
    name: 'First Visits Spike',
    severity: 'info',
    category: 'growth',
    description: `First-time visits exceeded ${zScore.toFixed(1)}σ above the 14-day average (${row.first_visits} vs avg ${Math.round(row.avg_visits)})`,
    metrics: {
      baseline: Math.round(row.avg_visits),
      current: row.first_visits,
      change_pct: row.avg_visits > 0 ? Math.round(((row.first_visits - row.avg_visits) / row.avg_visits) * 100) : 0,
    },
    detected_at: new Date().toISOString(),
    action: 'Cross-reference with Traffic chapter to identify the source. Measure conversion to active users.',
    link: '/traffic',
  };
}

// ============================================
// Main API Handler
// ============================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userType = (searchParams.get('userType') || 'all') as UserType;

  // Create a unique cache key
  const cacheKey = `insights-v1:${userType}`;

  // Check cache
  const cached = getCached<InsightsResponse>(cacheKey);

  if (cached) {
    console.log(`[API/Insights] Returning cached data`);
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[API/Insights] Cache miss - fetching fresh data from BigQuery, userType: ${userType}`);

  try {
    // Execute all alert queries in parallel
    const [
      dauAnomaly,
      eventVolumeAnomaly,
      activeClientsWow,
      dormantClients,
      newClients,
      featureWow,
      firstVisitsAnomaly,
    ] = await Promise.all([
      runQuery<any>(getDauAnomalyQuery(userType)),
      runQuery<any>(getEventVolumeAnomalyQuery(userType)),
      runQuery<any>(getActiveClientsWowQuery(userType)),
      runQuery<any>(getClientDormancyQuery(userType)),
      runQuery<any>(getNewClientsQuery(userType)),
      runQuery<any>(getFeatureUsageWowQuery(userType)),
      runQuery<any>(getFirstVisitsAnomalyQuery(userType)),
    ]);

    // Process alerts
    const alerts: Alert[] = [];

    // Platform alerts
    const dauAlert = detectDauAlert(dauAnomaly);
    if (dauAlert) alerts.push(dauAlert);

    const eventAlert = detectEventVolumeAlert(eventVolumeAnomaly);
    if (eventAlert) alerts.push(eventAlert);

    const clientsDropAlert = detectActiveClientsAlert(activeClientsWow);
    if (clientsDropAlert) alerts.push(clientsDropAlert);

    // Client alerts
    const dormantAlerts = detectDormantClientAlerts(dormantClients);
    alerts.push(...dormantAlerts);

    const newClientAlerts = detectNewClientAlerts(newClients);
    alerts.push(...newClientAlerts);

    // Feature alerts
    const featureAlerts = detectFeatureAlerts(featureWow);
    alerts.push(...featureAlerts);

    // Growth alerts
    const firstVisitsAlert = detectFirstVisitsAlert(firstVisitsAnomaly);
    if (firstVisitsAlert) alerts.push(firstVisitsAlert);

    // Sort alerts by severity (critical first, then warning, then info)
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Calculate summary
    const summary = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      total: alerts.length,
    };

    // Calculate alerts by category
    const categoryMap = new Map<string, number>();
    alerts.forEach(alert => {
      const count = categoryMap.get(alert.category) || 0;
      categoryMap.set(alert.category, count + 1);
    });
    const alertsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count,
    }));

    const data: InsightsResponse = {
      alerts,
      summary,
      alertsByCategory,
      last_checked: new Date().toISOString(),
    };

    // Cache for 5 minutes
    setCache(cacheKey, data);
    console.log(`[API/Insights] Data cached successfully`);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('BigQuery error (Insights):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insights data' },
      { status: 500 }
    );
  }
}
