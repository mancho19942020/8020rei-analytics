/**
 * Data Export Utilities
 *
 * Functions for exporting widget data to various formats.
 */

/**
 * Convert data to CSV format and trigger download
 */
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);

  // Build CSV content
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.map(escapeCSVValue).join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      return escapeCSVValue(value);
    });
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape a value for CSV format
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Format metrics data for export
 */
export function formatMetricsForExport(metrics: {
  total_users: number;
  total_events: number;
  page_views: number;
  active_clients: number;
}): Record<string, any>[] {
  return [
    { metric: 'Total Users', value: metrics.total_users },
    { metric: 'Total Events', value: metrics.total_events },
    { metric: 'Page Views', value: metrics.page_views },
    { metric: 'Active Clients', value: metrics.active_clients },
  ];
}

/**
 * Format time series data for export
 */
export function formatTimeSeriesForExport(
  data: { event_date: string; users: number; events: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    date: item.event_date,
    users: item.users,
    events: item.events,
  }));
}

/**
 * Format feature usage data for export
 */
export function formatFeatureUsageForExport(
  data: { feature: string; views: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    feature: item.feature,
    views: item.views,
  }));
}

/**
 * Format clients data for export
 */
export function formatClientsForExport(
  data: { client: string; events: number; users: number; page_views: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    client: item.client,
    events: item.events,
    users: item.users,
    page_views: item.page_views,
  }));
}

/**
 * Format user activity metrics (DAU/WAU/MAU) for export
 */
export function formatUserActivityForExport(data: {
  dau: number;
  wau: number;
  mau: number;
  trends?: {
    dau: { value: number; isPositive: boolean };
    wau: { value: number; isPositive: boolean };
    mau: { value: number; isPositive: boolean };
  };
}): Record<string, any>[] {
  return [
    {
      metric: 'Daily Active Users (DAU)',
      value: data.dau,
      trend_percent: data.trends?.dau.value?.toFixed(1) || '0',
      trend_direction: data.trends?.dau.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Weekly Active Users (WAU)',
      value: data.wau,
      trend_percent: data.trends?.wau.value?.toFixed(1) || '0',
      trend_direction: data.trends?.wau.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Monthly Active Users (MAU)',
      value: data.mau,
      trend_percent: data.trends?.mau.value?.toFixed(1) || '0',
      trend_direction: data.trends?.mau.isPositive ? 'Up' : 'Down',
    },
  ];
}

/**
 * Format new vs returning users data for export
 */
export function formatNewVsReturningForExport(
  data: { event_date: string; new_users: number; returning_users: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    date: `${item.event_date.slice(0, 4)}-${item.event_date.slice(4, 6)}-${item.event_date.slice(6, 8)}`,
    new_users: item.new_users,
    returning_users: item.returning_users,
    total_users: item.new_users + item.returning_users,
  }));
}

/**
 * Format engagement metrics for export
 */
export function formatEngagementMetricsForExport(data: {
  total_sessions: number;
  engaged_sessions: number;
  avg_engagement_time_sec: number;
  unique_users: number;
  sessions_per_user: number;
  engaged_rate: number;
  bounce_rate: number;
  trends?: {
    sessions_per_user: { value: number; isPositive: boolean };
    engaged_rate: { value: number; isPositive: boolean };
    bounce_rate: { value: number; isPositive: boolean };
    avg_engagement_time_sec: { value: number; isPositive: boolean };
  };
}): Record<string, any>[] {
  return [
    {
      metric: 'Sessions per User',
      value: data.sessions_per_user?.toFixed(2),
      trend_percent: data.trends?.sessions_per_user.value?.toFixed(1) || '0',
      trend_direction: data.trends?.sessions_per_user.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Engaged Sessions Rate',
      value: `${data.engaged_rate?.toFixed(1)}%`,
      trend_percent: data.trends?.engaged_rate.value?.toFixed(1) || '0',
      trend_direction: data.trends?.engaged_rate.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Bounce Rate',
      value: `${data.bounce_rate?.toFixed(1)}%`,
      trend_percent: data.trends?.bounce_rate.value?.toFixed(1) || '0',
      trend_direction: data.trends?.bounce_rate.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Avg Engagement Time (seconds)',
      value: data.avg_engagement_time_sec?.toFixed(1),
      trend_percent: data.trends?.avg_engagement_time_sec.value?.toFixed(1) || '0',
      trend_direction: data.trends?.avg_engagement_time_sec.isPositive ? 'Up' : 'Down',
    },
  ];
}

/**
 * Format session summary for export
 */
export function formatSessionSummaryForExport(data: {
  total_sessions: number;
  unique_users: number;
  trends?: {
    total_sessions: { value: number; isPositive: boolean };
    unique_users: { value: number; isPositive: boolean };
  };
}): Record<string, any>[] {
  return [
    {
      metric: 'Total Sessions',
      value: data.total_sessions,
      trend_percent: data.trends?.total_sessions.value?.toFixed(1) || '0',
      trend_direction: data.trends?.total_sessions.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Unique Users',
      value: data.unique_users,
      trend_percent: data.trends?.unique_users.value?.toFixed(1) || '0',
      trend_direction: data.trends?.unique_users.isPositive ? 'Up' : 'Down',
    },
  ];
}

// ============================================
// FEATURES CHAPTER EXPORT FORMATTERS
// ============================================

/**
 * Format feature views data for export
 */
export function formatFeatureViewsForExport(
  data: { feature: string; views: number; unique_users: number; trend?: { value: number; isPositive: boolean } }[]
): Record<string, any>[] {
  return data.map((item) => ({
    feature: item.feature,
    views: item.views,
    unique_users: item.unique_users,
    trend_percent: item.trend?.value?.toFixed(1) || '0',
    trend_direction: item.trend?.isPositive ? 'Up' : 'Down',
  }));
}

/**
 * Format feature distribution data for export
 */
export function formatFeatureDistributionForExport(
  data: { feature: string; views: number; unique_users: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.views, 0);
  return data.map((item) => ({
    feature: item.feature,
    views: item.views,
    percentage: total > 0 ? ((item.views / total) * 100).toFixed(1) : '0',
  }));
}

/**
 * Format feature adoption data for export
 */
export function formatFeatureAdoptionForExport(
  data: { feature: string; clients_using: number; adoption_pct: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    feature: item.feature,
    clients_using: item.clients_using,
    adoption_percent: item.adoption_pct,
  }));
}

/**
 * Format feature trend data for export
 */
export function formatFeatureTrendForExport(
  data: { event_date: string; feature: string; views: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    date: `${item.event_date.slice(0, 4)}-${item.event_date.slice(4, 6)}-${item.event_date.slice(6, 8)}`,
    feature: item.feature,
    views: item.views,
  }));
}

/**
 * Format top pages data for export
 */
export function formatTopPagesForExport(
  data: { page_url: string; client: string; path: string; views: number; unique_users: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    path: item.path || '/',
    client: item.client || '-',
    views: item.views,
    unique_users: item.unique_users,
    full_url: item.page_url,
  }));
}

// ============================================
// CLIENTS CHAPTER EXPORT FORMATTERS
// ============================================

/**
 * Format clients overview metrics for export
 */
export function formatClientsOverviewForExport(data: {
  total_clients: number;
  total_events: number;
  total_page_views: number;
  total_users: number;
  avg_users_per_client: number;
  trends?: {
    total_clients: { value: number; isPositive: boolean };
    total_events: { value: number; isPositive: boolean };
    total_page_views: { value: number; isPositive: boolean };
    total_users: { value: number; isPositive: boolean };
    avg_users_per_client: { value: number; isPositive: boolean };
  };
}): Record<string, any>[] {
  return [
    {
      metric: 'Active Clients',
      value: data.total_clients,
      trend_percent: data.trends?.total_clients.value?.toFixed(1) || '0',
      trend_direction: data.trends?.total_clients.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Total Events',
      value: data.total_events,
      trend_percent: data.trends?.total_events.value?.toFixed(1) || '0',
      trend_direction: data.trends?.total_events.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Total Page Views',
      value: data.total_page_views,
      trend_percent: data.trends?.total_page_views.value?.toFixed(1) || '0',
      trend_direction: data.trends?.total_page_views.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Total Users',
      value: data.total_users,
      trend_percent: data.trends?.total_users.value?.toFixed(1) || '0',
      trend_direction: data.trends?.total_users.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Avg Users per Client',
      value: data.avg_users_per_client?.toFixed(1),
      trend_percent: data.trends?.avg_users_per_client.value?.toFixed(1) || '0',
      trend_direction: data.trends?.avg_users_per_client.isPositive ? 'Up' : 'Down',
    },
  ];
}

/**
 * Format top clients detailed data for export
 */
export function formatTopClientsDetailedForExport(
  data: { client: string; events: number; users: number; page_views: number; features_used: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    client: item.client,
    events: item.events,
    users: item.users,
    page_views: item.page_views,
    features_used: item.features_used,
  }));
}

/**
 * Format client activity trend data for export
 */
export function formatClientActivityTrendForExport(
  data: { event_date: string; client: string; users: number; events: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    date: `${item.event_date.slice(0, 4)}-${item.event_date.slice(4, 6)}-${item.event_date.slice(6, 8)}`,
    client: item.client,
    users: item.users,
    events: item.events,
  }));
}

// ============================================
// TRAFFIC CHAPTER EXPORT FORMATTERS
// ============================================

/**
 * Format traffic by source data for export
 */
export function formatTrafficBySourceForExport(
  data: { source: string; users: number; events: number; trend?: { value: number; isPositive: boolean } }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  return data.map((item) => ({
    source: item.source || '(direct)',
    users: item.users,
    events: item.events,
    percentage: total > 0 ? ((item.users / total) * 100).toFixed(1) : '0',
    trend_percent: item.trend?.value?.toFixed(1) || '0',
    trend_direction: item.trend?.isPositive ? 'Up' : 'Down',
  }));
}

/**
 * Format traffic by medium data for export
 */
export function formatTrafficByMediumForExport(
  data: { medium: string; users: number; events: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  return data.map((item) => ({
    medium: item.medium || '(none)',
    users: item.users,
    events: item.events,
    percentage: total > 0 ? ((item.users / total) * 100).toFixed(1) : '0',
  }));
}

/**
 * Format screen resolution data for export
 */
export function formatScreenResolutionForExport(
  data: { resolution: string; users: number; events: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  return data.map((item) => ({
    resolution: item.resolution,
    users: item.users,
    events: item.events,
    percentage: total > 0 ? ((item.users / total) * 100).toFixed(1) : '0',
  }));
}

/**
 * Format traffic browser data for export
 */
export function formatTrafficBrowserForExport(
  data: { browser: string; users: number; events: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  return data.map((item) => ({
    browser: item.browser,
    users: item.users,
    events: item.events,
    percentage: total > 0 ? ((item.users / total) * 100).toFixed(1) : '0',
  }));
}

/**
 * Format top referrers data for export
 */
export function formatTopReferrersForExport(
  data: { referrer_domain: string; users: number; events: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    referrer_domain: item.referrer_domain,
    users: item.users,
    events: item.events,
  }));
}

/**
 * Format sessions by day of week data for export
 */
export function formatSessionsByDayForExport(
  data: { day_of_week: number; sessions: number }[]
): Record<string, any>[] {
  const dayNames = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return data.map((item) => ({
    day_of_week: dayNames[item.day_of_week] || `Day ${item.day_of_week}`,
    day_number: item.day_of_week,
    sessions: item.sessions,
  }));
}

/**
 * Format first visits trend data for export
 */
export function formatFirstVisitsTrendForExport(
  data: { event_date: string; first_visits: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    date: `${item.event_date.slice(0, 4)}-${item.event_date.slice(4, 6)}-${item.event_date.slice(6, 8)}`,
    first_visits: item.first_visits,
  }));
}

// ============================================
// TECHNOLOGY CHAPTER EXPORT FORMATTERS
// ============================================

/**
 * Format device category data for export
 */
export function formatDeviceCategoryForExport(
  data: { device_category: string; users: number; events: number; percentage?: number; trend?: { value: number; isPositive: boolean } }[]
): Record<string, any>[] {
  return data.map((item) => ({
    device_category: item.device_category || '(not set)',
    users: item.users,
    events: item.events,
    percentage: item.percentage?.toFixed(1) || '0',
    trend_percent: item.trend?.value?.toFixed(1) || '0',
    trend_direction: item.trend?.isPositive ? 'Up' : 'Down',
  }));
}

/**
 * Format browser distribution data for export
 */
export function formatBrowserDistributionForExport(
  data: { browser: string; users: number; events: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  return data.map((item) => ({
    browser: item.browser || '(not set)',
    users: item.users,
    events: item.events,
    percentage: total > 0 ? ((item.users / total) * 100).toFixed(1) : '0',
  }));
}

/**
 * Format operating system data for export
 */
export function formatOperatingSystemForExport(
  data: { os: string; users: number; events: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  return data.map((item) => ({
    operating_system: item.os || '(not set)',
    users: item.users,
    events: item.events,
    percentage: total > 0 ? ((item.users / total) * 100).toFixed(1) : '0',
  }));
}

/**
 * Format device language data for export
 */
export function formatDeviceLanguageForExport(
  data: { language: string; users: number; events: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  return data.map((item) => ({
    language: item.language || '(not set)',
    users: item.users,
    events: item.events,
    percentage: total > 0 ? ((item.users / total) * 100).toFixed(1) : '0',
  }));
}

// ============================================
// GEOGRAPHY CHAPTER EXPORT FORMATTERS
// ============================================

/**
 * Format country data for export
 */
export function formatCountryForExport(
  data: { country: string; users: number; events: number; percentage?: number; trend?: { value: number; isPositive: boolean } }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  return data.map((item) => ({
    country: item.country || '(not set)',
    users: item.users,
    events: item.events,
    percentage: item.percentage ?? (total > 0 ? ((item.users / total) * 100).toFixed(1) : '0'),
    trend_percent: item.trend?.value?.toFixed(1) || '0',
    trend_direction: item.trend?.isPositive ? 'Up' : 'Down',
  }));
}

/**
 * Format continent data for export
 */
export function formatContinentForExport(
  data: { continent: string; users: number; events: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  return data.map((item) => ({
    continent: item.continent || '(not set)',
    users: item.users,
    events: item.events,
    percentage: total > 0 ? ((item.users / total) * 100).toFixed(1) : '0',
  }));
}

/**
 * Format region data for export
 */
export function formatRegionForExport(
  data: { region: string; users: number; events: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  return data.map((item) => ({
    region: item.region || '(not set)',
    users: item.users,
    events: item.events,
    percentage: total > 0 ? ((item.users / total) * 100).toFixed(1) : '0',
  }));
}

/**
 * Format city data for export
 */
export function formatCityForExport(
  data: { city: string; region: string; users: number; events: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  return data.map((item) => ({
    city: item.city || '(not set)',
    state: item.region || '(not set)',
    users: item.users,
    events: item.events,
    percentage: total > 0 ? ((item.users / total) * 100).toFixed(1) : '0',
  }));
}

// ============================================
// EVENTS CHAPTER EXPORT FORMATTERS
// ============================================

/**
 * Format event breakdown data for export
 */
export function formatEventBreakdownForExport(
  data: { event_name: string; count: number; unique_users: number; percentage?: number; trend?: { value: number; isPositive: boolean } }[]
): Record<string, any>[] {
  return data.map((item) => ({
    event_name: item.event_name,
    count: item.count,
    unique_users: item.unique_users,
    percentage: item.percentage?.toFixed(1) || '0',
    trend_percent: item.trend?.value?.toFixed(1) || '0',
    trend_direction: item.trend?.isPositive ? 'Up' : 'Down',
  }));
}

/**
 * Format event volume trend data for export
 */
export function formatEventVolumeTrendForExport(
  data: { event_date: string; event_name: string; count: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    date: `${item.event_date.slice(0, 4)}-${item.event_date.slice(4, 6)}-${item.event_date.slice(6, 8)}`,
    event_name: item.event_name,
    count: item.count,
  }));
}

/**
 * Format event metrics data for export
 */
export function formatEventMetricsForExport(data: {
  total_events: number;
  total_sessions: number;
  events_per_session: number;
  form_starts: number;
  form_submits: number;
  form_conversion_rate: number;
  clicks: number;
  scrolls: number;
  trends?: {
    events_per_session: { value: number; isPositive: boolean };
    form_conversion_rate: { value: number; isPositive: boolean };
    total_events: { value: number; isPositive: boolean };
  };
}): Record<string, any>[] {
  return [
    {
      metric: 'Total Events',
      value: data.total_events,
      trend_percent: data.trends?.total_events.value?.toFixed(1) || '0',
      trend_direction: data.trends?.total_events.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Total Sessions',
      value: data.total_sessions,
    },
    {
      metric: 'Events per Session',
      value: data.events_per_session?.toFixed(2),
      trend_percent: data.trends?.events_per_session.value?.toFixed(1) || '0',
      trend_direction: data.trends?.events_per_session.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Form Starts',
      value: data.form_starts,
    },
    {
      metric: 'Form Submits',
      value: data.form_submits,
    },
    {
      metric: 'Form Conversion Rate',
      value: `${data.form_conversion_rate?.toFixed(1)}%`,
      trend_percent: data.trends?.form_conversion_rate.value?.toFixed(1) || '0',
      trend_direction: data.trends?.form_conversion_rate.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Clicks',
      value: data.clicks,
    },
    {
      metric: 'Scrolls',
      value: data.scrolls,
    },
  ];
}

/**
 * Format scroll depth data for export
 */
export function formatScrollDepthForExport(
  data: { page: string; scroll_events: number; unique_users: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.scroll_events, 0);
  return data.map((item) => ({
    page: item.page,
    scroll_events: item.scroll_events,
    unique_users: item.unique_users,
    percentage: total > 0 ? ((item.scroll_events / total) * 100).toFixed(1) : '0',
  }));
}

// ============================================
// INSIGHTS CHAPTER EXPORT FORMATTERS
// ============================================

/**
 * Format insights summary data for export
 */
export function formatInsightsSummaryForExport(data: {
  critical: number;
  warning: number;
  info: number;
  total: number;
  last_checked: string;
}): Record<string, any>[] {
  return [
    { severity: 'Critical', count: data.critical },
    { severity: 'Warning', count: data.warning },
    { severity: 'Info', count: data.info },
    { severity: 'Total', count: data.total },
    { severity: 'Last Checked', count: data.last_checked },
  ];
}

/**
 * Format alerts feed data for export
 */
export function formatAlertsFeedForExport(
  data: {
    id: string;
    name: string;
    severity: string;
    category: string;
    description: string;
    entity?: string;
    detected_at: string;
    action: string;
    metrics?: {
      baseline?: number;
      current?: number;
      change_pct?: number;
    };
  }[]
): Record<string, any>[] {
  return data.map((item) => ({
    alert_id: item.id,
    alert_name: item.name,
    severity: item.severity,
    category: item.category,
    entity: item.entity || '-',
    description: item.description,
    baseline: item.metrics?.baseline ?? '-',
    current: item.metrics?.current ?? '-',
    change_percent: item.metrics?.change_pct ?? '-',
    detected_at: item.detected_at,
    recommended_action: item.action,
  }));
}

/**
 * Format alerts by category data for export
 */
export function formatAlertsByCategoryForExport(
  data: { category: string; count: number }[]
): Record<string, any>[] {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return data.map((item) => ({
    category: item.category,
    count: item.count,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0',
  }));
}

// ============================================
// PRODUCT > CLIENT DOMAINS EXPORT FORMATTERS
// ============================================

/**
 * Format domain activity overview for export
 */
export function formatDomainActivityOverviewForExport(data: {
  total_active_domains: number;
  total_properties: number;
  leads_count: number;
  appointments_count: number;
  deals_count: number;
  total_revenue: number;
  trends?: {
    total_active_domains: { value: number; isPositive: boolean };
    total_properties: { value: number; isPositive: boolean };
    leads_count: { value: number; isPositive: boolean };
    total_revenue: { value: number; isPositive: boolean };
  };
}): Record<string, any>[] {
  return [
    {
      metric: 'Active Domains',
      value: data.total_active_domains,
      trend_percent: data.trends?.total_active_domains.value?.toFixed(1) || '0',
      trend_direction: data.trends?.total_active_domains.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Total Properties',
      value: data.total_properties,
      trend_percent: data.trends?.total_properties.value?.toFixed(1) || '0',
      trend_direction: data.trends?.total_properties.isPositive ? 'Up' : 'Down',
    },
    {
      metric: 'Leads',
      value: data.leads_count,
      trend_percent: data.trends?.leads_count.value?.toFixed(1) || '0',
      trend_direction: data.trends?.leads_count.isPositive ? 'Up' : 'Down',
    },
    { metric: 'Appointments', value: data.appointments_count },
    { metric: 'Deals', value: data.deals_count },
    {
      metric: 'Total Revenue',
      value: data.total_revenue,
      trend_percent: data.trends?.total_revenue.value?.toFixed(1) || '0',
      trend_direction: data.trends?.total_revenue.isPositive ? 'Up' : 'Down',
    },
  ];
}

/**
 * Format domain leaderboard data for export
 */
export function formatDomainLeaderboardForExport(
  data: {
    domain_name: string;
    total_properties: number;
    leads_count: number;
    appointments_count: number;
    deals_count: number;
    total_revenue: number;
    last_activity_date: string;
    days_since_activity: number;
    risk_level: string;
  }[]
): Record<string, any>[] {
  return data.map((item) => ({
    domain: item.domain_name,
    total_properties: item.total_properties,
    leads: item.leads_count,
    appointments: item.appointments_count,
    deals: item.deals_count,
    revenue: item.total_revenue,
    last_activity: item.last_activity_date,
    days_since_activity: item.days_since_activity,
    risk_level: item.risk_level,
  }));
}

/**
 * Format domain activity trend data for export
 */
export function formatDomainActivityTrendForExport(
  data: { date: string; properties_uploaded: number; domain_count: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    date: item.date,
    properties_uploaded: item.properties_uploaded,
    active_domains: item.domain_count,
  }));
}

/**
 * Format revenue by domain data for export
 */
export function formatRevenueByDomainForExport(
  data: { domain_name: string; revenue: number }[]
): Record<string, any>[] {
  return data.map((item) => ({
    domain: item.domain_name,
    revenue: item.revenue,
  }));
}

/**
 * Format flagged domains data for export
 */
export function formatFlaggedDomainsForExport(
  data: { domain_id: number; domain_name: string; flag: string; flag_info: string; date: string }[]
): Record<string, any>[] {
  return data.map((item) => ({
    domain_id: item.domain_id,
    domain: item.domain_name,
    flag: item.flag,
    flag_info: item.flag_info,
    date: item.date,
  }));
}

// ============================================
// PRODUCT > PRODUCT PROJECTS EXPORT FORMATTERS
// ============================================

/**
 * Format project status overview for export
 */
export function formatProjectStatusOverviewForExport(data: {
  active_projects: number;
  on_track: number;
  delayed: number;
  completed: number;
}): Record<string, any>[] {
  return [
    { metric: 'Active Projects', value: data.active_projects },
    { metric: 'On Track', value: data.on_track },
    { metric: 'Delayed', value: data.delayed },
    { metric: 'Completed', value: data.completed },
  ];
}

/**
 * Format projects table data for export
 */
export function formatProjectsTableForExport(
  data: {
    issue_key: string;
    summary: string;
    status: string;
    assignee: string;
    due_date: string;
    story_points_completed: number;
    story_points_total: number;
    days_of_delay: number;
  }[]
): Record<string, any>[] {
  return data.map((item) => ({
    issue_key: item.issue_key,
    summary: item.summary,
    status: item.status,
    assignee: item.assignee,
    due_date: item.due_date,
    sp_completed: item.story_points_completed,
    sp_total: item.story_points_total,
    sp_progress: item.story_points_total > 0
      ? `${((item.story_points_completed / item.story_points_total) * 100).toFixed(0)}%`
      : '0%',
    days_of_delay: item.days_of_delay,
  }));
}

/**
 * Format bug tracking data for export
 */
export function formatBugTrackingForExport(data: {
  total_unique_bugs: number;
  customer_bugs: number;
  critical_bugs: number;
  critical_open_bugs: number;
  bug_origins: { origin: string; count: number }[];
  weekly_trend: { week: string; count: number }[];
}): Record<string, any>[] {
  const summary: Record<string, any>[] = [
    { type: 'Summary', label: 'Total Unique Bugs', value: data.total_unique_bugs },
    { type: 'Summary', label: 'Customer Bugs', value: data.customer_bugs },
    { type: 'Summary', label: 'Critical Bugs', value: data.critical_bugs },
    { type: 'Summary', label: 'Critical Open Bugs', value: data.critical_open_bugs },
  ];
  const origins = data.bug_origins.map((item) => ({
    type: 'Origin',
    label: item.origin,
    value: item.count,
  }));
  const trends = data.weekly_trend.map((item) => ({
    type: 'Weekly Trend',
    label: item.week,
    value: item.count,
  }));
  return [...summary, ...origins, ...trends];
}

/**
 * Format team workload data for export
 */
export function formatTeamWorkloadForExport(
  data: {
    assignee: string;
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    delayed_tasks: number;
  }[]
): Record<string, any>[] {
  return data.map((item) => ({
    assignee: item.assignee,
    total_tasks: item.total_tasks,
    completed: item.completed_tasks,
    in_progress: item.in_progress_tasks,
    delayed: item.delayed_tasks,
  }));
}

/**
 * Format delivery timeline data for export
 */
export function formatDeliveryTimelineForExport(
  data: {
    issue_key: string;
    summary: string;
    due_date: string;
    resolved_date: string | null;
    days_of_delay: number;
  }[]
): Record<string, any>[] {
  return data.map((item) => ({
    issue_key: item.issue_key,
    summary: item.summary,
    due_date: item.due_date,
    resolved_date: item.resolved_date || 'Not resolved',
    days_of_delay: item.days_of_delay,
    status: item.days_of_delay > 0 ? 'Late' : item.days_of_delay === 0 ? 'On Time' : 'Early',
  }));
}
