/**
 * Default Layout Configurations
 *
 * Pre-defined widget layouts for the workspace.
 */

import { Widget, GridConfig, WidgetType } from '@/types/widget';

/**
 * Icon Key Type
 *
 * Keys that map to SVG icons in WidgetCatalog.tsx
 */
export type IconKey = 'grid' | 'lineChart' | 'barChart' | 'table' | 'donutChart' | 'users' | 'globe' | 'device' | 'traffic' | 'events' | 'alert' | 'building';

/**
 * Widget Catalog Item Interface
 *
 * Defines the structure for items in the Add Widget catalog.
 * Used to populate the widget selection modal for each tab.
 */
export interface WidgetCatalogItem {
  /** Widget type identifier */
  type: WidgetType;
  /** Display title */
  title: string;
  /** Description of what the widget shows */
  description: string;
  /** Icon key - maps to SVG icons in WidgetCatalog.tsx */
  iconKey: IconKey;
  /** Default size when added to the grid */
  defaultSize: { w: number; h: number };
}

/**
 * Grid Configuration
 *
 * 12-column responsive grid system with 60px row height.
 */
export const GRID_CONFIG: GridConfig = {
  cols: {
    lg: 12,  // Large screens (≥960px container width)
    md: 10,  // Medium screens (≥720px)
    sm: 6,   // Small screens (≥540px)
    xs: 4,   // Extra small screens (≥380px)
    xxs: 2,  // Tiny screens (<380px)
  },
  breakpoints: {
    lg: 960,   // Lowered from 1200 — sidebar-aware (1200px viewport - 240px sidebar = 960px)
    md: 720,   // Lowered from 996
    sm: 540,   // Lowered from 768
    xs: 380,   // Lowered from 480
    xxs: 0,
  },
  rowHeight: 60,
  margin: [16, 16],  // 16px gaps between widgets for compact layout
  containerPadding: [0, 0],  // No container padding, let page handle it
};

/**
 * Default Widget Layout
 *
 * The default arrangement of widgets when users first load the workspace
 * or when they reset their layout.
 */
export const DEFAULT_LAYOUT: Widget[] = [
  {
    id: 'metrics-overview',
    type: 'metrics',
    title: 'Key metrics',
    x: 0,
    y: 0,
    w: 12,
    h: 2,
    minW: 6,
    minH: 2,
    maxH: 2,
  },
  {
    id: 'users-chart',
    type: 'timeseries',
    title: 'Users over time',
    x: 0,
    y: 2,
    w: 6,
    h: 5,
    minW: 4,
    minH: 3,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'features-chart',
    type: 'barchart',
    title: 'Feature usage',
    x: 6,
    y: 2,
    w: 6,
    h: 5,
    minW: 4,
    minH: 3,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'clients-table',
    type: 'table',
    title: 'Top clients',
    x: 0,
    y: 7,
    w: 12,
    h: 6,
    minW: 6,
    minH: 5,
    maxW: 12,
    maxH: 10,
  },
];

/**
 * Layout Storage Key
 *
 * Key used for localStorage persistence.
 */
export const LAYOUT_STORAGE_KEY = 'axis-metrics-layout-v4';

/**
 * Users Tab Layout Storage Key
 */
export const USERS_LAYOUT_STORAGE_KEY = 'axis-users-layout-v3';

/**
 * Features Tab Layout Storage Key
 */
export const FEATURES_LAYOUT_STORAGE_KEY = 'axis-features-layout-v2';

/**
 * Clients Tab Layout Storage Key
 */
export const CLIENTS_LAYOUT_STORAGE_KEY = 'axis-clients-layout-v4';

/**
 * Engagement Tab Layout Storage Key (formerly Traffic)
 */
export const ENGAGEMENT_LAYOUT_STORAGE_KEY = 'axis-engagement-layout-v1';

/** @deprecated Use ENGAGEMENT_LAYOUT_STORAGE_KEY */
export const TRAFFIC_LAYOUT_STORAGE_KEY = ENGAGEMENT_LAYOUT_STORAGE_KEY;

/**
 * Technology Tab Layout Storage Key
 */
export const TECHNOLOGY_LAYOUT_STORAGE_KEY = 'axis-technology-layout-v2';

/**
 * Geography Tab Layout Storage Key
 */
export const GEOGRAPHY_LAYOUT_STORAGE_KEY = 'axis-geography-layout-v2';

/**
 * Events Tab Layout Storage Key
 */
export const EVENTS_LAYOUT_STORAGE_KEY = 'axis-events-layout-v3';

/**
 * Insights Tab Layout Storage Key
 */
export const INSIGHTS_LAYOUT_STORAGE_KEY = 'axis-insights-layout-v4';

/**
 * Layout Schema Version
 *
 * Bump this number any time default layouts change (widget sizes, titles, new widgets, etc.).
 * When a user's stored version doesn't match, their cached layout is discarded
 * and replaced with the current defaults — no manual "Reset Layout" needed.
 */
export const LAYOUT_SCHEMA_VERSION = 5;

/**
 * Load a saved layout from localStorage, or fall back to defaults.
 * Automatically discards stale layouts when LAYOUT_SCHEMA_VERSION changes.
 */
export function loadLayout<T>(storageKey: string, defaults: T): T {
  if (typeof window === 'undefined') return defaults;

  const VERSION_KEY = 'axis-layout-schema-version';
  const storedVersion = Number(localStorage.getItem(VERSION_KEY) || '0');

  if (storedVersion !== LAYOUT_SCHEMA_VERSION) {
    // Version mismatch — wipe all cached layouts and stamp the new version
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.includes('-layout-')) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(VERSION_KEY, String(LAYOUT_SCHEMA_VERSION));
    return defaults;
  }

  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return JSON.parse(saved) as T;
    } catch {
      return defaults;
    }
  }
  return defaults;
}

/**
 * Default Users Tab Layout
 *
 * The default arrangement of widgets for the Users tab.
 */
export const DEFAULT_USERS_LAYOUT: Widget[] = [
  {
    id: 'user-activity',
    type: 'user-activity',
    title: 'User activity (DAU/WAU/MAU)',
    x: 0,
    y: 0,
    w: 12,
    h: 2,
    minW: 6,
    minH: 2,
    maxH: 2,
  },
  {
    id: 'new-vs-returning',
    type: 'new-vs-returning',
    title: 'New vs returning users',
    x: 0,
    y: 2,
    w: 12,
    h: 5,
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'engagement-metrics',
    type: 'engagement-metrics',
    title: 'Engagement metrics',
    x: 0,
    y: 7,
    w: 12,
    h: 2,
    minW: 6,
    minH: 2,
    maxH: 2,
  },
  {
    id: 'session-summary',
    type: 'session-summary',
    title: 'Session summary',
    x: 0,
    y: 9,
    w: 12,
    h: 2,
    minW: 6,
    minH: 2,
    maxH: 2,
  },
];

/**
 * Default Features Tab Layout
 *
 * The default arrangement of widgets for the Features tab.
 * Layout follows the design spec:
 * - Feature Usage bar chart (full width)
 * - Distribution donut + Adoption table (side by side)
 * - Feature Trend multi-line chart (full width)
 * - Top Pages table (full width)
 */
export const DEFAULT_FEATURES_LAYOUT: Widget[] = [
  {
    id: 'feature-usage',
    type: 'feature-usage',
    title: 'Views per feature',
    x: 0,
    y: 0,
    w: 12,
    h: 6,
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 10,
  },
  {
    id: 'feature-distribution',
    type: 'feature-distribution',
    title: 'Feature distribution',
    x: 0,
    y: 6,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 8,
    maxH: 8,
  },
  {
    id: 'feature-adoption',
    type: 'feature-adoption',
    title: 'Feature adoption rate',
    x: 6,
    y: 6,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 10,
  },
  {
    id: 'feature-trend',
    type: 'feature-trend',
    title: 'Feature trend over time',
    x: 0,
    y: 11,
    w: 12,
    h: 5,
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'top-pages',
    type: 'top-pages',
    title: 'Top 20 pages',
    x: 0,
    y: 16,
    w: 12,
    h: 6,
    minW: 6,
    minH: 5,
    maxW: 12,
    maxH: 10,
  },
];

/**
 * Default Clients Tab Layout
 *
 * The default arrangement of widgets for the Clients tab.
 * Layout follows the design spec:
 * - Clients Overview metrics (full width)
 * - Top Clients Table (full width, clickable for drill-down)
 * - Client Activity Trend chart (full width)
 */
export const DEFAULT_CLIENTS_LAYOUT: Widget[] = [
  {
    id: 'clients-overview',
    type: 'clients-overview',
    title: 'Client metrics overview',
    x: 0,
    y: 0,
    w: 12,
    h: 2,
    minW: 6,
    minH: 2,
    maxH: 2,
  },
  {
    id: 'clients-table',
    type: 'clients-table',
    title: 'Top clients',
    x: 0,
    y: 2,
    w: 12,
    h: 8,
    minW: 6,
    minH: 5,
    maxW: 12,
    maxH: 10,
  },
  {
    id: 'client-activity-trend',
    type: 'client-activity-trend',
    title: 'Client activity trend',
    x: 0,
    y: 10,
    w: 12,
    h: 5,
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
];

/**
 * Default Traffic Tab Layout
 *
 * Default Engagement Tab Layout (formerly Traffic)
 *
 * Layout: engagement patterns for a non-organic SaaS product.
 * - Peak hours heatmap (full width, tall)
 * - Sessions by day of week + First visits trend (side by side)
 * - Avg session duration + Sessions per user (side by side)
 * - Active days per user distribution (half width)
 */
export const DEFAULT_ENGAGEMENT_LAYOUT: Widget[] = [
  {
    id: 'peak-hours',
    type: 'peak-hours',
    title: 'Peak activity hours',
    tooltip: 'Heatmap showing when users are most active by hour and day of week',
    x: 0,
    y: 0,
    w: 12,
    h: 7,
    minW: 8,
    minH: 5,
    maxW: 12,
    maxH: 10,
  },
  {
    id: 'sessions-by-day',
    type: 'sessions-by-day',
    title: 'Sessions by day of week',
    x: 0,
    y: 7,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'first-visits-trend',
    type: 'first-visits-trend',
    title: 'New user acquisition',
    tooltip: 'Daily count of first-time visitors — tracks onboarding velocity',
    x: 6,
    y: 7,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'avg-session-duration',
    type: 'avg-session-duration',
    title: 'Average session duration',
    tooltip: 'Mean engagement time per session over time',
    x: 0,
    y: 12,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'sessions-per-user',
    type: 'sessions-per-user',
    title: 'Sessions per user',
    tooltip: 'How often users return — higher values indicate stronger engagement',
    x: 6,
    y: 12,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'active-days',
    type: 'active-days',
    title: 'Active days per user',
    tooltip: 'Distribution of how many distinct days each user was active in the period',
    x: 0,
    y: 17,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
];

/** @deprecated Use DEFAULT_ENGAGEMENT_LAYOUT */
export const DEFAULT_TRAFFIC_LAYOUT = DEFAULT_ENGAGEMENT_LAYOUT;

/**
 * Default Technology Tab Layout
 *
 * The default arrangement of widgets for the Technology tab.
 * Layout follows the design spec:
 * - Device Category + Browser + OS (3 cards in a row)
 * - Language table (full width)
 */
export const DEFAULT_TECHNOLOGY_LAYOUT: Widget[] = [
  {
    id: 'device-category',
    type: 'device-category',
    title: 'Device category',
    x: 0,
    y: 0,
    w: 4,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 6,
    maxH: 8,
  },
  {
    id: 'browser-distribution',
    type: 'browser-distribution',
    title: 'Browser distribution',
    x: 4,
    y: 0,
    w: 4,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 6,
    maxH: 8,
  },
  {
    id: 'operating-system',
    type: 'operating-system',
    title: 'Operating system',
    x: 8,
    y: 0,
    w: 4,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 6,
    maxH: 8,
  },
  {
    id: 'device-language',
    type: 'device-language',
    title: 'Device language',
    x: 0,
    y: 5,
    w: 12,
    h: 5,
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
];

/**
 * Default Geography Tab Layout
 *
 * The default arrangement of widgets for the Geography tab.
 * Layout follows the design spec:
 * - Country (bar chart) + Continent (donut chart) side by side
 * - Region (table) + City (table) side by side
 */
export const DEFAULT_GEOGRAPHY_LAYOUT: Widget[] = [
  {
    id: 'country',
    type: 'country',
    title: 'Users by country',
    x: 0,
    y: 0,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'continent',
    type: 'continent',
    title: 'Activity by continent',
    x: 6,
    y: 0,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 8,
    maxH: 8,
  },
  {
    id: 'region',
    type: 'region',
    title: 'Users by state (US)',
    x: 0,
    y: 5,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'city',
    type: 'city',
    title: 'Users by city (US)',
    x: 6,
    y: 5,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
];

/**
 * Default Events Tab Layout
 *
 * The default arrangement of widgets for the Events tab.
 * Layout order:
 * 1. Scroll Depth by Page (table, full width)
 * 2. Event Metrics (4 scorecards in a row)
 * 3. Event Volume Trend (stacked bar chart, full width)
 * 4. Event Breakdown (bar chart, full width)
 */
export const DEFAULT_EVENTS_LAYOUT: Widget[] = [
  {
    id: 'scroll-depth',
    type: 'scroll-depth',
    title: 'Scroll depth by page',
    x: 0,
    y: 0,
    w: 12,
    h: 5,
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'event-metrics',
    type: 'event-metrics',
    title: 'Event metrics',
    x: 0,
    y: 5,
    w: 12,
    h: 2,
    minW: 6,
    minH: 2,
    maxH: 2,
  },
  {
    id: 'event-volume-trend',
    type: 'event-volume-trend',
    title: 'Event volume trend',
    x: 0,
    y: 7,
    w: 12,
    h: 5,
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'event-breakdown',
    type: 'event-breakdown',
    title: 'Event breakdown',
    x: 0,
    y: 12,
    w: 12,
    h: 6,
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 10,
  },
];

/**
 * Default Insights Tab Layout
 *
 * The default arrangement of widgets for the Insights & Alerts tab.
 * Layout follows the design spec from Chapter 9:
 * - Severity Summary (3 scorecards: Critical, Warning, Info)
 * - Alerts by Category (donut chart showing distribution)
 * - Alert Feed (scrollable list of all alerts)
 */
export const DEFAULT_INSIGHTS_LAYOUT: Widget[] = [
  {
    id: 'insights-summary',
    type: 'insights-summary',
    title: 'Alert summary',
    x: 0,
    y: 0,
    w: 12,
    h: 2,
    minW: 6,
    minH: 2,
    maxH: 2,
  },
  {
    id: 'alerts-feed',
    type: 'alerts-feed',
    title: 'Active alerts',
    x: 0,
    y: 2,
    w: 12,
    h: 10,
    minW: 6,
    minH: 5,
    maxW: 12,
    maxH: 14,
  },
  {
    id: 'alerts-by-category',
    type: 'alerts-by-category',
    title: 'Alerts by category',
    x: 0,
    y: 12,
    w: 12,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
];

// ============================================================================
// WIDGET CATALOGS
// ============================================================================
// These catalogs define the available widgets for the "Add Widget" modal
// for each tab. Icons are referenced by key and rendered in WidgetCatalog.tsx.
// ============================================================================

/**
 * Overview Tab Widget Catalog
 */
export const OVERVIEW_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'metrics',
    title: 'Key metrics',
    description: 'Display 4 key metrics in a flush row',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'timeseries',
    title: 'Users over time',
    description: 'Line chart showing user activity trends',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'barchart',
    title: 'Feature usage',
    description: 'Horizontal bar chart of feature usage',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'table',
    title: 'Top clients',
    description: 'Sortable table of client activity',
    iconKey: 'table',
    defaultSize: { w: 12, h: 6 },
  },
];

/**
 * Users Tab Widget Catalog
 */
export const USERS_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'user-activity',
    title: 'User activity (DAU/WAU/MAU)',
    description: 'Scorecards showing daily, weekly, and monthly active users',
    iconKey: 'users',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'new-vs-returning',
    title: 'New vs returning users',
    description: 'Stacked bar chart comparing new and returning users over time',
    iconKey: 'barChart',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'engagement-metrics',
    title: 'Engagement metrics',
    description: 'Sessions per user, bounce rate, and engaged rate scorecards',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'session-summary',
    title: 'Session summary',
    description: 'Total sessions and unique users overview',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
];

/**
 * Features Tab Widget Catalog
 */
export const FEATURES_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'feature-usage',
    title: 'Views per feature',
    description: 'Table showing feature usage by views and unique users',
    iconKey: 'table',
    defaultSize: { w: 12, h: 6 },
  },
  {
    type: 'feature-distribution',
    title: 'Feature distribution',
    description: 'Donut chart showing distribution of feature usage',
    iconKey: 'donutChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'feature-adoption',
    title: 'Feature adoption rate',
    description: 'Table showing adoption rates with progress bars',
    iconKey: 'table',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'feature-trend',
    title: 'Feature trend over time',
    description: 'Multi-line chart showing feature trends over time',
    iconKey: 'lineChart',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'top-pages',
    title: 'Top 20 pages',
    description: 'Table showing most visited pages with views and users',
    iconKey: 'table',
    defaultSize: { w: 12, h: 6 },
  },
];

/**
 * Clients Tab Widget Catalog
 */
export const CLIENTS_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'clients-overview',
    title: 'Client metrics overview',
    description: 'Scorecards for total clients, events, page views, and avg users',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'clients-table',
    title: 'Top clients',
    description: 'Table showing top clients with drill-down capability',
    iconKey: 'table',
    defaultSize: { w: 12, h: 6 },
  },
  {
    type: 'client-activity-trend',
    title: 'Client activity trend',
    description: 'Line chart showing client activity over time',
    iconKey: 'lineChart',
    defaultSize: { w: 12, h: 5 },
  },
];

/**
 * Engagement Tab Widget Catalog (formerly Traffic)
 */
export const ENGAGEMENT_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'peak-hours',
    title: 'Peak activity hours',
    description: 'Heatmap showing when users are most active by hour and day of week',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 7 },
  },
  {
    type: 'sessions-by-day',
    title: 'Sessions by day of week',
    description: 'Bar chart showing session distribution by day',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'first-visits-trend',
    title: 'New user acquisition',
    description: 'Daily first-time visitors — tracks onboarding velocity',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'avg-session-duration',
    title: 'Average session duration',
    description: 'Mean engagement time per session over time',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'sessions-per-user',
    title: 'Sessions per user',
    description: 'How often users return — higher values mean stronger engagement',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'active-days',
    title: 'Active days per user',
    description: 'Distribution of how many distinct days each user was active',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
];

/** @deprecated Use ENGAGEMENT_WIDGET_CATALOG */
export const TRAFFIC_WIDGET_CATALOG = ENGAGEMENT_WIDGET_CATALOG;

/**
 * Technology Tab Widget Catalog
 */
export const TECHNOLOGY_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'device-category',
    title: 'Device category',
    description: 'Donut chart showing desktop, mobile, and tablet distribution',
    iconKey: 'device',
    defaultSize: { w: 4, h: 5 },
  },
  {
    type: 'browser-distribution',
    title: 'Browser distribution',
    description: 'Donut chart showing browser usage (Chrome, Safari, etc.)',
    iconKey: 'donutChart',
    defaultSize: { w: 4, h: 5 },
  },
  {
    type: 'operating-system',
    title: 'Operating system',
    description: 'Donut chart showing OS distribution (Windows, macOS, iOS, etc.)',
    iconKey: 'donutChart',
    defaultSize: { w: 4, h: 5 },
  },
  {
    type: 'device-language',
    title: 'Device language',
    description: 'Table showing user language preferences',
    iconKey: 'table',
    defaultSize: { w: 12, h: 5 },
  },
];

/**
 * Geography Tab Widget Catalog
 */
export const GEOGRAPHY_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'country',
    title: 'Users by country',
    description: 'Bar chart showing user distribution by country',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'continent',
    title: 'Activity by continent',
    description: 'Donut chart showing activity distribution by continent',
    iconKey: 'donutChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'region',
    title: 'Users by state (US)',
    description: 'Table showing user distribution by US state',
    iconKey: 'table',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'city',
    title: 'Users by city (US)',
    description: 'Table showing user distribution by US city',
    iconKey: 'table',
    defaultSize: { w: 6, h: 5 },
  },
];

/**
 * Events Tab Widget Catalog
 */
export const EVENTS_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'scroll-depth',
    title: 'Scroll depth by page',
    description: 'Table showing scroll engagement by page',
    iconKey: 'table',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'event-metrics',
    title: 'Event metrics',
    description: 'Scorecards for events/session, form conversion, clicks, scrolls',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'event-volume-trend',
    title: 'Event volume trend',
    description: 'Stacked bar chart showing event volume over time',
    iconKey: 'barChart',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'event-breakdown',
    title: 'Event breakdown',
    description: 'Bar chart showing event type distribution',
    iconKey: 'barChart',
    defaultSize: { w: 12, h: 6 },
  },
];

/**
 * Insights Tab Widget Catalog
 */
export const INSIGHTS_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'insights-summary',
    title: 'Alert summary',
    description: 'Scorecards showing critical, warning, and info alert counts',
    iconKey: 'alert',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'alerts-by-category',
    title: 'Alerts by category',
    description: 'Donut chart showing alert distribution by category',
    iconKey: 'donutChart',
    defaultSize: { w: 4, h: 5 },
  },
  {
    type: 'alerts-feed',
    title: 'Active alerts',
    description: 'Scrollable feed of all active alerts',
    iconKey: 'events',
    defaultSize: { w: 8, h: 10 },
  },
];

// ============================================================================
// FEEDBACK LOOP > IMPORT TAB LAYOUTS & CATALOGS
// ============================================================================

/**
 * Feedback Loop > Import Layout Storage Key
 */
export const PRODUCT_DOMAINS_LAYOUT_STORAGE_KEY = 'axis-feedback-import-layout-v3';

/**
 * Product > Product Projects Layout Storage Key
 */
export const PRODUCT_PROJECTS_LAYOUT_STORAGE_KEY = 'axis-product-projects-layout-v3';

/**
 * Default Feedback Loop > Import Tab Layout
 */
export const DEFAULT_PRODUCT_DOMAINS_LAYOUT: Widget[] = [
  {
    id: 'domain-activity-overview',
    type: 'domain-activity-overview',
    title: 'Import activity overview',
    x: 0, y: 0,
    w: 12, h: 2,
    minW: 6, minH: 2, maxH: 2,
  },
  {
    id: 'domain-leaderboard',
    type: 'domain-leaderboard',
    title: 'Client import leaderboard',
    x: 0, y: 2,
    w: 12, h: 6,
    minW: 6, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'domain-activity-trend',
    type: 'domain-activity-trend',
    title: 'Import volume trend',
    x: 0, y: 8,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
  {
    id: 'revenue-by-domain',
    type: 'revenue-by-domain',
    title: 'Revenue by client',
    x: 6, y: 8,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
];

/**
 * Default Product Projects Tab Layout
 */
export const DEFAULT_PRODUCT_PROJECTS_LAYOUT: Widget[] = [
  {
    id: 'project-status-overview',
    type: 'project-status-overview',
    title: 'Project status',
    x: 0, y: 0,
    w: 12, h: 2,
    minW: 6, minH: 2, maxH: 2,
  },
  {
    id: 'projects-table',
    type: 'projects-table',
    title: 'Projects',
    x: 0, y: 2,
    w: 12, h: 6,
    minW: 6, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'bug-tracking',
    type: 'bug-tracking',
    title: 'Bug tracking',
    x: 0, y: 8,
    w: 12, h: 6,
    minW: 6, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'team-workload',
    type: 'team-workload',
    title: 'Team workload',
    x: 0, y: 14,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
  {
    id: 'delivery-timeline',
    type: 'delivery-timeline',
    title: 'Delivery timeline',
    x: 6, y: 14,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
];

/**
 * Feedback Loop > Import Tab Widget Catalog
 */
export const PRODUCT_DOMAINS_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'domain-activity-overview',
    title: 'Import activity overview',
    description: 'KPI cards for active clients, imported properties, leads, appointments, deals, revenue',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'domain-leaderboard',
    title: 'Client import leaderboard',
    description: 'Ranked table of clients by import activity with risk indicators',
    iconKey: 'table',
    defaultSize: { w: 12, h: 6 },
  },
  {
    type: 'domain-activity-trend',
    title: 'Import volume trend',
    description: 'Line chart showing import volume over time',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'revenue-by-domain',
    title: 'Revenue by client',
    description: 'Horizontal bar chart of top clients by revenue',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
];

/**
 * Product Projects Tab Widget Catalog
 */
export const PRODUCT_PROJECTS_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'project-status-overview',
    title: 'Project status overview',
    description: 'KPI cards for active, on-track, delayed, and completed projects',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'projects-table',
    title: 'Projects table',
    description: 'Detailed table of projects with status, story points, and delays',
    iconKey: 'table',
    defaultSize: { w: 12, h: 6 },
  },
  {
    type: 'bug-tracking',
    title: 'Bug tracking',
    description: 'Bug KPIs and weekly trend chart',
    iconKey: 'events',
    defaultSize: { w: 12, h: 6 },
  },
  {
    type: 'team-workload',
    title: 'Team workload',
    description: 'Table showing task distribution and delays by team member',
    iconKey: 'users',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'delivery-timeline',
    title: 'Delivery timeline',
    description: 'Table showing project delivery variance (early/on-time/late)',
    iconKey: 'table',
    defaultSize: { w: 6, h: 5 },
  },
];

// ---------------------------------------------------------------------------
// Features > 8020REI > DM Campaign > Overview Tab
// ---------------------------------------------------------------------------

export const DM_OVERVIEW_LAYOUT_STORAGE_KEY = 'dm-overview-layout-v1';

export const DEFAULT_DM_OVERVIEW_LAYOUT: Widget[] = [
  {
    id: 'dm-overview-headline',
    type: 'dm-overview-headline',
    title: 'Headline metrics',
    tooltip:
      'Executive view of DM Campaign health. Active clients is Aurora-only (rr_campaign_snapshots, distinct domains with ≥1 status=active campaign). Lifetime pieces is PCM-authoritative with the Aurora delta surfaced visibly. Lifetime revenue is Aurora-only (PCM does not track customer revenue). Active campaigns is Aurora-only.',
    x: 0, y: 0,
    w: 12, h: 3,
    minW: 12, maxW: 12, minH: 3, maxH: 4,
    flushBody: true,
    timeBehavior: 'all-time',
  },
];

export const DM_OVERVIEW_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'dm-overview-headline',
    title: 'Headline metrics',
    description: 'Active clients, lifetime pieces (Aurora+PCM), revenue, and active campaigns',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 3 },
  },
];

// ---------------------------------------------------------------------------
// Features > 8020REI > Rapid Response Tab
// ---------------------------------------------------------------------------

export const RAPID_RESPONSE_LAYOUT_STORAGE_KEY = 'rapid-response-layout-v9';

export const DEFAULT_RAPID_RESPONSE_LAYOUT: Widget[] = [
  // Row 1: Is it running? | Is it working?  (side-by-side)
  {
    id: 'rr-operational-pulse',
    type: 'rr-operational-pulse',
    title: 'Is it running?',
    tooltip: 'Current campaign state. Not affected by the date filter.',
    x: 0, y: 0,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
    timeBehavior: 'all-time',
  },
  {
    id: 'rr-quality-metrics',
    type: 'rr-quality-metrics',
    title: 'Is it working?',
    tooltip: 'Lifetime send + delivery health. Delivery rate matches Profitability → Margin summary.',
    x: 6, y: 0,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
    timeBehavior: 'all-time',
  },
  // Row 2: Is it aligned? | Postal performance  (side-by-side)
  {
    id: 'rr-pcm-health',
    type: 'rr-pcm-health',
    title: 'Is it aligned?',
    tooltip: 'Do OUR records match PCM\'s records? Denominator = all DM-enrolled domains (historical + active). Click the "need attention" tag for the breakdown.',
    x: 0, y: 5,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
    timeBehavior: 'all-time',
  },
  {
    id: 'rr-postal-performance',
    type: 'rr-postal-performance',
    title: 'Postal performance',
    tooltip: 'How fast USPS delivers and how often addresses come back undeliverable. About the post office, not our record alignment.',
    x: 6, y: 5,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
    timeBehavior: 'all-time',
  },
  // Row 3: Q2 volume goal | Top contributors  (side-by-side)
  {
    id: 'rr-q2-goal',
    type: 'rr-q2-goal',
    title: 'Q2 volume goal',
    tooltip: 'Progress toward 400K DM pieces for Q2 2026 (April-June). Source: PCM /order via shared cache.',
    x: 0, y: 10,
    w: 6, h: 5,
    minW: 4, minH: 5, maxW: 12, maxH: 8,
    timeBehavior: 'all-time',
  },
  {
    id: 'rr-q2-top-contributors',
    type: 'rr-q2-top-contributors',
    title: 'Top contributors',
    tooltip: 'Per-client contribution toward the Q2 400K target.',
    x: 6, y: 10,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 10,
    timeBehavior: 'all-time',
  },
  // Row 4: Campaigns table (full width)
  {
    id: 'rr-campaign-table',
    type: 'rr-campaign-table',
    title: 'Campaigns',
    tooltip: 'All campaigns with their latest-snapshot totals — not affected by the date filter. Sent and Delivered show lifetime totals per campaign.',
    x: 0, y: 15,
    w: 12, h: 7,
    minW: 6, minH: 4, maxW: 12, maxH: 10,
    timeBehavior: 'all-time',
  },
  // Row 5: Period charts (date-filtered)
  {
    id: 'rr-sends-trend',
    type: 'rr-sends-trend',
    title: 'Send volume trend',
    tooltip: 'Daily mailing activity within the selected date range. For lifetime monthly send volume, see DM Campaign → Overview → Send volume trend.',
    x: 0, y: 22,
    w: 6, h: 5,
    minW: 4, minH: 3, maxW: 12, maxH: 8,
    timeBehavior: 'date-filtered',
  },
  {
    id: 'rr-status-breakdown',
    type: 'rr-status-breakdown',
    title: 'Status breakdown',
    tooltip: 'Mail-piece outcomes within the selected date range. Piece status ≠ campaign status (see "Is it running?" for campaign lifecycle).',
    x: 6, y: 22,
    w: 6, h: 5,
    minW: 4, minH: 3, maxW: 12, maxH: 8,
    timeBehavior: 'date-filtered',
  },
  // Row 6+: System health indicators
  {
    id: 'rr-system-coverage',
    type: 'rr-system-coverage',
    title: 'System coverage',
    tooltip: 'Data pipeline coverage: how many clients, templates, and properties are tracked, plus the attribution rate.',
    x: 0, y: 27,
    w: 12, h: 2,
    minW: 8, minH: 2, maxH: 2,
    flushBody: true,
    timeBehavior: 'all-time',
  },
  {
    id: 'rr-data-integrity',
    type: 'rr-data-integrity',
    title: 'Data integrity',
    tooltip: 'Data pipeline integrity checks: backfilled dates, unattributed conversions, zero-revenue deals, and pre-send conversions.',
    x: 0, y: 29,
    w: 12, h: 2,
    minW: 8, minH: 2, maxH: 2,
    flushBody: true,
    timeBehavior: 'all-time',
  },
];

export const RAPID_RESPONSE_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'rr-q2-goal',
    title: 'Q2 volume goal',
    description: 'Progress bar and key metrics for the 400K DM pieces Q2 target',
    iconKey: 'grid',
    defaultSize: { w: 4, h: 6 },
  },
  {
    type: 'rr-q2-top-contributors',
    title: 'Top contributors',
    description: 'Per-client send volume toward the Q2 400K target',
    iconKey: 'table',
    defaultSize: { w: 8, h: 6 },
  },
  {
    type: 'rr-operational-pulse',
    title: 'Is it running?',
    description: 'Active campaigns, sends today, last send time, on-hold count',
    iconKey: 'grid',
    defaultSize: { w: 4, h: 4 },
  },
  {
    type: 'rr-quality-metrics',
    title: 'Is it working?',
    description: 'Delivery rate, PCM submission rate, error rate',
    iconKey: 'grid',
    defaultSize: { w: 4, h: 4 },
  },
  {
    type: 'rr-pcm-health',
    title: 'Is it aligned?',
    description: 'Domain-level PCM sync health: synced vs out-of-sync domains, stale, orphaned, gap',
    iconKey: 'grid',
    defaultSize: { w: 4, h: 4 },
  },
  {
    type: 'rr-postal-performance',
    title: 'Postal performance',
    description: 'USPS delivery lag and undeliverable rate — post-office performance',
    iconKey: 'grid',
    defaultSize: { w: 4, h: 4 },
  },
  {
    type: 'rr-sends-trend',
    title: 'Send volume trend',
    description: 'Line chart showing sends, deliveries, and errors over time',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'rr-status-breakdown',
    title: 'Status breakdown',
    description: 'Donut chart of mailing status distribution',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'rr-campaign-table',
    title: 'Campaigns',
    description: 'Sortable table of all campaigns with status and metrics',
    iconKey: 'table',
    defaultSize: { w: 7, h: 6 },
  },
  {
    type: 'rr-system-coverage',
    title: 'System coverage',
    description: 'Clients, templates, properties tracked and attribution rate',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'rr-data-integrity',
    title: 'Data integrity',
    description: 'Backfilled dates, unattributed conversions, zero-revenue deals',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
];

// ---------------------------------------------------------------------------
// Features > 8020REI > DM Campaign Business Results Tab
// ---------------------------------------------------------------------------

export const DM_BUSINESS_RESULTS_LAYOUT_STORAGE_KEY = 'dm-business-results-layout-v4';

export const DEFAULT_DM_BUSINESS_RESULTS_LAYOUT: Widget[] = [
  // Row 1: Conversion Funnel — THE hero metric, answers "how is DM performing?"
  {
    id: 'dm-funnel-overview',
    type: 'dm-funnel-overview',
    title: 'Conversion funnel',
    tooltip: 'Cohort view: properties first mailed in the selected window, and their conversion outcomes (leads/appts/contracts/deals) — conversions are counted regardless of when they happened, as long as the property\'s first send is in-window. "Mailed" = unique properties (addresses), not individual mail pieces (Operational Health counts pieces, so numbers differ by design). Sum of per-client leads in Client performance + sum of daily bars in Conversion activity = this funnel\'s leads.',
    x: 0, y: 0,
    w: 12, h: 7,
    minW: 6, minH: 4, maxW: 12, maxH: 10,
    timeBehavior: 'date-filtered',
  },
  // Row 2: Client Performance (full width, taller for more rows)
  {
    id: 'dm-client-performance',
    type: 'dm-client-performance',
    title: 'Client performance',
    tooltip: 'Per-client breakdown filtered by the selected date range. "Mailed" = unique properties first mailed in the period. Click any number to see the actual properties.',
    x: 0, y: 7,
    w: 12, h: 8,
    minW: 6, minH: 5, maxW: 12, maxH: 10,
    timeBehavior: 'date-filtered',
  },
  // Row 3: Trends — more actionable than static template table
  {
    id: 'dm-conversion-trend',
    type: 'dm-conversion-trend',
    title: 'Conversion activity',
    tooltip: 'Cohort view: for properties first mailed in the selected window, the daily rhythm of conversions (buckets = the date each lead/appt/deal happened). Sum of bars reconciles bit-for-bit with the Conversion funnel\'s leads/appts/deals for the same window.',
    x: 0, y: 15,
    w: 6, h: 5,
    minW: 4, minH: 3, maxW: 12, maxH: 8,
    timeBehavior: 'date-filtered',
  },
  {
    id: 'dm-revenue-cost',
    type: 'dm-revenue-cost',
    title: 'Mailing spend vs. deal revenue',
    tooltip: 'Cohort view for the selected window: daily client mailing spend (red, bucketed by first_sent_date) and deal revenue earned (green, bucketed by became_deal_at). Same cohort as the Conversion funnel — sum of bars reconciles with the funnel\'s cost / revenue. Client ROI framing; see Profitability for 8020REI company margin.',
    x: 6, y: 15,
    w: 6, h: 5,
    minW: 4, minH: 3, maxW: 12, maxH: 8,
    timeBehavior: 'date-filtered',
  },
  // Row 4: Template Leaderboard — optimization detail, not first-glance
  {
    id: 'dm-template-leaderboard',
    type: 'dm-template-leaderboard',
    title: 'Template leaderboard',
    tooltip: 'Templates ranked by performance within the selected date range. Sent/Delivered = mail pieces (matches OH). Leads/Deals = properties from dm_property_conversions with became_* > first_sent_date. ROAS = client deal revenue ÷ client mail spend (client ROI, not 8020REI company margin).',
    x: 0, y: 20,
    w: 12, h: 6,
    minW: 6, minH: 5, maxW: 12, maxH: 10,
    timeBehavior: 'date-filtered',
  },
  // Row 5: Geographic Breakdown — supporting detail
  {
    id: 'dm-geo-breakdown',
    type: 'dm-geo-breakdown',
    title: 'Geographic breakdown',
    tooltip: 'Conversion rates by state and county within the selected date range. Identifies which geographic markets respond best to direct mail campaigns.',
    x: 0, y: 26,
    w: 12, h: 5,
    minW: 6, minH: 4, maxW: 12, maxH: 10,
    timeBehavior: 'date-filtered',
  },
];

export const DM_BUSINESS_RESULTS_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'dm-funnel-overview',
    title: 'Conversion funnel',
    description: 'Prospect → Lead → Appointment → Contract → Deal with conversion rates',
    iconKey: 'barChart',
    defaultSize: { w: 12, h: 6 },
  },
  {
    type: 'dm-client-performance',
    title: 'Client performance',
    description: 'Per-client mailing volume, conversions, spend, revenue, and cost per lead',
    iconKey: 'table',
    defaultSize: { w: 12, h: 7 },
  },
  {
    type: 'dm-template-leaderboard',
    title: 'Template leaderboard',
    description: 'Templates ranked by sends, leads, deals, and ROAS',
    iconKey: 'table',
    defaultSize: { w: 6, h: 7 },
  },
  {
    type: 'dm-conversion-trend',
    title: 'Conversion activity',
    description: 'Daily new leads, appointments, and deals',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'dm-revenue-cost',
    title: 'Mailing spend vs. deal revenue',
    description: 'Daily client mail spend vs. attributed deal revenue',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'dm-geo-breakdown',
    title: 'Geographic breakdown',
    description: 'Conversion rates by state and county',
    iconKey: 'globe',
    defaultSize: { w: 12, h: 6 },
  },
];

// ---------------------------------------------------------------------------
// Features > 8020REI > Properties API Tab
// ---------------------------------------------------------------------------

export const PROPERTIES_API_LAYOUT_STORAGE_KEY = 'properties-api-layout-v2';

export const DEFAULT_PROPERTIES_API_LAYOUT: Widget[] = [
  {
    id: 'api-overview',
    type: 'api-overview',
    title: 'API overview',
    x: 0, y: 0,
    w: 12, h: 2,
    minW: 6, minH: 2, maxH: 2,
  },
  {
    id: 'api-calls-trend',
    type: 'api-calls-trend',
    title: 'API calls over time',
    x: 0, y: 2,
    w: 6, h: 5,
    minW: 4, minH: 3, maxW: 12, maxH: 8,
  },
  {
    id: 'api-response-trend',
    type: 'api-response-trend',
    title: 'Response time trend',
    x: 6, y: 2,
    w: 6, h: 5,
    minW: 4, minH: 3, maxW: 12, maxH: 8,
  },
  {
    id: 'api-endpoint-breakdown',
    type: 'api-endpoint-breakdown',
    title: 'Usage by endpoint',
    x: 0, y: 7,
    w: 6, h: 7,
    minW: 4, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'api-top-clients',
    type: 'api-top-clients',
    title: 'Top clients',
    x: 6, y: 7,
    w: 6, h: 7,
    minW: 4, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'api-error-tracker',
    type: 'api-error-tracker',
    title: 'Error tracker',
    x: 0, y: 14,
    w: 12, h: 5,
    minW: 6, minH: 4, maxW: 12, maxH: 8,
  },
  {
    id: 'api-recent-logs',
    type: 'api-recent-logs',
    title: 'Recent API logs',
    x: 0, y: 19,
    w: 12, h: 7,
    minW: 6, minH: 5, maxW: 12, maxH: 12,
  },
];

export const PROPERTIES_API_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'api-overview',
    title: 'API overview',
    description: 'KPI cards for total calls, unique clients, response time, error rate',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'api-calls-trend',
    title: 'API calls over time',
    description: 'Line chart showing call volume and errors over time',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'api-response-trend',
    title: 'Response time trend',
    description: 'Line chart showing average response time trend',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'api-endpoint-breakdown',
    title: 'Usage by endpoint',
    description: 'Horizontal bar chart and table of calls per endpoint',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 7 },
  },
  {
    type: 'api-top-clients',
    title: 'Top clients',
    description: 'Table of top API clients by call volume',
    iconKey: 'table',
    defaultSize: { w: 6, h: 7 },
  },
  {
    type: 'api-error-tracker',
    title: 'Error tracker',
    description: 'Table of errors grouped by status code and message',
    iconKey: 'alert',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'api-recent-logs',
    title: 'Recent API logs',
    description: 'Paginated table of recent API call logs',
    iconKey: 'table',
    defaultSize: { w: 12, h: 7 },
  },
];

// ============================================================================
// PRODUCT TASKS > AI TASK BOARD
// ============================================================================

export const AI_TASK_BOARD_LAYOUT_STORAGE_KEY = 'axis-ai-task-board-layout-v1';

export const DEFAULT_AI_TASK_BOARD_LAYOUT: Widget[] = [
  {
    id: 'asana-board-overview',
    type: 'asana-board-overview',
    title: 'Board overview',
    x: 0, y: 0, w: 12, h: 2,
    minW: 6, minH: 2, maxH: 3,
  },
  {
    id: 'asana-tasks-table',
    type: 'asana-tasks-table',
    title: 'Tasks',
    x: 0, y: 2, w: 12, h: 6,
    minW: 6, minH: 4, maxH: 12,
  },
  {
    id: 'asana-team-workload',
    type: 'asana-team-workload',
    title: 'Team workload',
    x: 0, y: 8, w: 6, h: 5,
    minW: 4, minH: 4,
  },
  {
    id: 'asana-section-breakdown',
    type: 'asana-section-breakdown',
    title: 'Section breakdown',
    x: 6, y: 8, w: 6, h: 5,
    minW: 4, minH: 4,
  },
  {
    id: 'asana-weekly-trend',
    type: 'asana-weekly-trend',
    title: 'Weekly trend',
    x: 0, y: 13, w: 6, h: 5,
    minW: 4, minH: 4,
  },
  {
    id: 'asana-task-aging',
    type: 'asana-task-aging',
    title: 'Task aging',
    x: 6, y: 13, w: 6, h: 5,
    minW: 4, minH: 4,
  },
  {
    id: 'asana-alerts-feed',
    type: 'asana-alerts-feed',
    title: 'Alerts',
    x: 0, y: 18, w: 12, h: 4,
    minW: 6, minH: 3,
  },
];

export const AI_TASK_BOARD_WIDGET_CATALOG: WidgetCatalogItem[] = [
  { type: 'asana-board-overview', title: 'Board overview', description: 'KPI metric cards for board status', iconKey: 'grid', defaultSize: { w: 12, h: 2 } },
  { type: 'asana-tasks-table', title: 'Tasks table', description: 'Sortable table of all tasks', iconKey: 'table', defaultSize: { w: 12, h: 6 } },
  { type: 'asana-team-workload', title: 'Team workload', description: 'Stacked bar per assignee', iconKey: 'barChart', defaultSize: { w: 6, h: 5 } },
  { type: 'asana-section-breakdown', title: 'Section breakdown', description: 'Donut chart of task distribution', iconKey: 'donutChart', defaultSize: { w: 6, h: 5 } },
  { type: 'asana-weekly-trend', title: 'Weekly trend', description: 'Created vs completed per week', iconKey: 'lineChart', defaultSize: { w: 6, h: 5 } },
  { type: 'asana-task-aging', title: 'Task aging', description: 'Open task age distribution', iconKey: 'barChart', defaultSize: { w: 6, h: 5 } },
  { type: 'asana-alerts-feed', title: 'Alerts', description: 'Smart alerts for board health', iconKey: 'alert', defaultSize: { w: 12, h: 4 } },
];

// ============================================================================
// PRODUCT TASKS > BUGS & DI BOARD
// ============================================================================

export const BUGS_DI_BOARD_LAYOUT_STORAGE_KEY = 'axis-bugs-di-board-layout-v1';

export const DEFAULT_BUGS_DI_BOARD_LAYOUT: Widget[] = [
  {
    id: 'asana-bugs-overview',
    type: 'asana-bugs-overview',
    title: 'Board overview',
    x: 0, y: 0, w: 12, h: 2,
    minW: 6, minH: 2, maxH: 3,
  },
  {
    id: 'asana-bugs-table',
    type: 'asana-bugs-table',
    title: 'Bugs & data inquiries',
    x: 0, y: 2, w: 12, h: 6,
    minW: 6, minH: 4, maxH: 12,
  },
  {
    id: 'asana-bugs-team-workload',
    type: 'asana-bugs-team-workload',
    title: 'Team workload',
    x: 0, y: 8, w: 6, h: 5,
    minW: 4, minH: 4,
  },
  {
    id: 'asana-bugs-section-breakdown',
    type: 'asana-bugs-section-breakdown',
    title: 'Section breakdown',
    x: 6, y: 8, w: 6, h: 5,
    minW: 4, minH: 4,
  },
  {
    id: 'asana-bugs-weekly-trend',
    type: 'asana-bugs-weekly-trend',
    title: 'Weekly trend',
    x: 0, y: 13, w: 6, h: 5,
    minW: 4, minH: 4,
  },
  {
    id: 'asana-bugs-aging',
    type: 'asana-bugs-aging',
    title: 'Task aging',
    x: 6, y: 13, w: 6, h: 5,
    minW: 4, minH: 4,
  },
  {
    id: 'asana-bugs-alerts-feed',
    type: 'asana-bugs-alerts-feed',
    title: 'Alerts',
    x: 0, y: 18, w: 12, h: 4,
    minW: 6, minH: 3,
  },
];

export const BUGS_DI_BOARD_WIDGET_CATALOG: WidgetCatalogItem[] = [
  { type: 'asana-bugs-overview', title: 'Board overview', description: 'KPI metric cards for bugs board', iconKey: 'grid', defaultSize: { w: 12, h: 2 } },
  { type: 'asana-bugs-table', title: 'Bugs table', description: 'Sortable table of bugs and data inquiries', iconKey: 'table', defaultSize: { w: 12, h: 6 } },
  { type: 'asana-bugs-team-workload', title: 'Team workload', description: 'Stacked bar per assignee', iconKey: 'barChart', defaultSize: { w: 6, h: 5 } },
  { type: 'asana-bugs-section-breakdown', title: 'Section breakdown', description: 'Donut chart of task distribution', iconKey: 'donutChart', defaultSize: { w: 6, h: 5 } },
  { type: 'asana-bugs-weekly-trend', title: 'Weekly trend', description: 'Created vs completed per week', iconKey: 'lineChart', defaultSize: { w: 6, h: 5 } },
  { type: 'asana-bugs-aging', title: 'Task aging', description: 'Open task age distribution', iconKey: 'barChart', defaultSize: { w: 6, h: 5 } },
  { type: 'asana-bugs-alerts-feed', title: 'Alerts', description: 'Smart alerts for board health', iconKey: 'alert', defaultSize: { w: 12, h: 4 } },
];

// ============================================================================
// PLATFORM ANALYTICS TAB
// ============================================================================

export const PLATFORM_ANALYTICS_LAYOUT_STORAGE_KEY = 'axis-platform-analytics-layout-v1';

export const DEFAULT_PLATFORM_ANALYTICS_LAYOUT: Widget[] = [
  {
    id: 'pa-active-users',
    type: 'pa-active-users',
    title: 'Active users',
    tooltip: 'Unique users who accessed the platform in different time windows',
    x: 0, y: 0, w: 12, h: 2,
    minW: 6, minH: 2, maxH: 2,
  },
  {
    id: 'pa-visitor-log',
    type: 'pa-visitor-log',
    title: 'Visitor log',
    tooltip: 'Recent sessions with user info, duration, and most-used section',
    x: 0, y: 2, w: 12, h: 7,
    minW: 8, minH: 5, maxH: 12,
  },
  {
    id: 'pa-usage-trends',
    type: 'pa-usage-trends',
    title: 'Usage trends',
    tooltip: 'Daily sessions over time',
    x: 0, y: 9, w: 6, h: 5,
    minW: 4, minH: 3, maxH: 8,
  },
  {
    id: 'pa-popular-sections',
    type: 'pa-popular-sections',
    title: 'Popular sections',
    tooltip: 'Most visited sections of the platform',
    x: 6, y: 9, w: 6, h: 5,
    minW: 4, minH: 3, maxH: 8,
  },
  {
    id: 'pa-peak-hours',
    type: 'pa-peak-hours',
    title: 'Peak hours',
    tooltip: 'Platform activity by hour of day',
    x: 0, y: 14, w: 6, h: 5,
    minW: 4, minH: 3, maxH: 8,
  },
  {
    id: 'pa-user-engagement',
    type: 'pa-user-engagement',
    title: 'Time by section',
    tooltip: 'How time is distributed across platform sections',
    x: 6, y: 14, w: 6, h: 5,
    minW: 4, minH: 3, maxH: 8,
  },
];

export const PLATFORM_ANALYTICS_WIDGET_CATALOG: WidgetCatalogItem[] = [
  { type: 'pa-active-users', title: 'Active users', description: 'KPI cards for platform visitors', iconKey: 'grid', defaultSize: { w: 12, h: 2 } },
  { type: 'pa-visitor-log', title: 'Visitor log', description: 'Sortable table of recent sessions', iconKey: 'table', defaultSize: { w: 12, h: 7 } },
  { type: 'pa-usage-trends', title: 'Usage trends', description: 'Daily sessions over time', iconKey: 'lineChart', defaultSize: { w: 6, h: 5 } },
  { type: 'pa-popular-sections', title: 'Popular sections', description: 'Most visited sections', iconKey: 'barChart', defaultSize: { w: 6, h: 5 } },
  { type: 'pa-peak-hours', title: 'Peak hours', description: 'Activity by hour of day', iconKey: 'barChart', defaultSize: { w: 6, h: 5 } },
  { type: 'pa-user-engagement', title: 'Time by section', description: 'Time distribution across sections', iconKey: 'donutChart', defaultSize: { w: 6, h: 5 } },
];

// ─── Profitability Layout (formerly PCM & Profitability) ────────
// Story: Verdict → Trends → Pricing → Data Integrity → Details

export const PCM_VALIDATION_LAYOUT_STORAGE_KEY = 'pcm-validation-layout-v6';

export const DEFAULT_PCM_VALIDATION_LAYOUT: Widget[] = [
  // ─── THE VERDICT (all-time) ───
  {
    id: 'pcm-margin-summary',
    type: 'pcm-margin-summary',
    title: 'Margin summary',
    tooltip: 'All-time revenue, PCM cost, gross margin, and margin % across all clients. The verdict: are we making money?',
    x: 0, y: 0, w: 12, h: 2,
    minW: 8, minH: 2, maxH: 2,
    flushBody: true,
    timeBehavior: 'all-time',
  },
  // ─── THE VERDICT (filtered by date selector) ───
  {
    id: 'pcm-margin-period',
    type: 'pcm-margin-period',
    title: 'Period summary',
    tooltip: 'Revenue, PCM cost, gross margin, and margin % for the last 30 days (sliding window anchored to today). Independent of the header date filter — the backing table does not yet have enough history to honor wider ranges, so this view is pinned for trust.',
    x: 0, y: 2, w: 12, h: 2,
    minW: 8, minH: 2, maxH: 2,
    flushBody: true,
    timeBehavior: 'last-30-days',
  },
  // ─── THE TREND (all-time historical) ───
  {
    id: 'pcm-margin-trend',
    type: 'pcm-margin-trend',
    title: 'Pricing history',
    tooltip: 'Monthly per-piece rates since launch: what we charge clients (blue), what PCM charges us (red), and margin per piece (green). Updates automatically with each sync.',
    x: 0, y: 4, w: 12, h: 5,
    minW: 6, minH: 3, maxH: 8,
    timeBehavior: 'all-time',
  },
  // ─── THE PRICING ───
  {
    id: 'pcm-pricing-overview',
    type: 'pcm-pricing-overview',
    title: 'Pricing overview',
    tooltip: 'What we charge per piece vs what PCM charges us, margin per piece, and recent price change detection.',
    x: 0, y: 9, w: 6, h: 4,
    minW: 4, minH: 3, maxH: 6,
    timeBehavior: 'all-time',
  },
  // ─── DATA INTEGRITY (side by side with pricing) ───
  {
    id: 'pcm-data-match',
    type: 'pcm-data-match',
    title: 'Data match',
    tooltip: 'Domain-level alignment for the selected period. Bottom row shows lifetime totals (always all-time) for reference.',
    x: 6, y: 9, w: 6, h: 4,
    minW: 4, minH: 3, maxH: 6,
    timeBehavior: 'date-filtered',
  },
  // ─── CLIENT DETAILS (3 separate tables by health) ───
  {
    id: 'pcm-clients-profitable',
    type: 'pcm-clients-profitable',
    title: 'Profitable clients',
    tooltip: 'Clients with margins above 5%, sorted by highest margin first.',
    x: 0, y: 13, w: 12, h: 6,
    minW: 8, minH: 3, maxH: 10,
    timeBehavior: 'all-time',
  },
  {
    id: 'pcm-clients-breakeven',
    type: 'pcm-clients-breakeven',
    title: 'Break-even clients',
    tooltip: 'Clients with margins between 0-5%. Pricing review recommended.',
    x: 0, y: 19, w: 12, h: 6,
    minW: 8, minH: 3, maxH: 10,
    timeBehavior: 'all-time',
  },
  {
    id: 'pcm-clients-losing',
    type: 'pcm-clients-losing',
    title: 'Losing money',
    tooltip: 'Clients where we lose money on every piece sent. Worst margins first.',
    x: 0, y: 25, w: 12, h: 6,
    minW: 8, minH: 3, maxH: 10,
    timeBehavior: 'all-time',
  },
  // ─── DOMAIN & TEMPLATE DETAILS ───
  {
    id: 'pcm-domain-table',
    type: 'pcm-domain-table',
    title: 'Domain breakdown',
    tooltip: 'Per-domain send totals, delivery counts, and cost per piece.',
    x: 0, y: 31, w: 12, h: 6,
    minW: 8, minH: 3, maxH: 10,
    timeBehavior: 'all-time',
  },
  {
    id: 'pcm-template-table',
    type: 'pcm-template-table',
    title: 'Template catalog',
    tooltip: 'PostcardMania design templates — name, type, size, and mail classes.',
    x: 0, y: 37, w: 12, h: 6,
    minW: 8, minH: 3, maxH: 10,
    timeBehavior: 'all-time',
  },
];

export const PCM_VALIDATION_WIDGET_CATALOG: WidgetCatalogItem[] = [
  { type: 'pcm-margin-summary', title: 'Margin summary', description: 'All-time revenue, PCM cost, gross margin, and margin %', iconKey: 'grid', defaultSize: { w: 12, h: 2 } },
  { type: 'pcm-margin-period', title: 'Period summary', description: 'Date-filtered revenue, PCM cost, gross margin, and margin %', iconKey: 'grid', defaultSize: { w: 12, h: 2 } },
  { type: 'pcm-margin-trend', title: 'Pricing history', description: 'Per-piece rates over time: us vs PCM with margin', iconKey: 'lineChart', defaultSize: { w: 12, h: 5 } },
  { type: 'pcm-pricing-overview', title: 'Pricing overview', description: 'Our rates vs PCM rates with margin per piece', iconKey: 'grid', defaultSize: { w: 6, h: 4 } },
  { type: 'pcm-data-match', title: 'Data match', description: 'Domain-level PCM alignment + lifetime send vs order totals', iconKey: 'barChart', defaultSize: { w: 6, h: 4 } },
  { type: 'pcm-clients-profitable', title: 'Profitable clients', description: 'Clients with margins above 5%', iconKey: 'table', defaultSize: { w: 12, h: 6 } },
  { type: 'pcm-clients-breakeven', title: 'Break-even clients', description: 'Clients with margins 0-5%', iconKey: 'table', defaultSize: { w: 12, h: 6 } },
  { type: 'pcm-clients-losing', title: 'Losing money', description: 'Clients with negative margins', iconKey: 'table', defaultSize: { w: 12, h: 6 } },
  { type: 'pcm-domain-table', title: 'Domain breakdown', description: 'Per-domain send totals and cost', iconKey: 'table', defaultSize: { w: 12, h: 6 } },
  { type: 'pcm-template-table', title: 'Template catalog', description: 'PCM design templates', iconKey: 'table', defaultSize: { w: 12, h: 6 } },
];

/**
 * Combined catalog lookup by tab name
 */
export const TAB_WIDGET_CATALOGS: Record<string, WidgetCatalogItem[]> = {
  overview: OVERVIEW_WIDGET_CATALOG,
  users: USERS_WIDGET_CATALOG,
  features: FEATURES_WIDGET_CATALOG,
  clients: CLIENTS_WIDGET_CATALOG,
  engagement: ENGAGEMENT_WIDGET_CATALOG,
  technology: TECHNOLOGY_WIDGET_CATALOG,
  geography: GEOGRAPHY_WIDGET_CATALOG,
  events: EVENTS_WIDGET_CATALOG,
  insights: INSIGHTS_WIDGET_CATALOG,
  'import': PRODUCT_DOMAINS_WIDGET_CATALOG,
  'product-projects': PRODUCT_PROJECTS_WIDGET_CATALOG,
  'properties-api': PROPERTIES_API_WIDGET_CATALOG,
  'dm-overview': DM_OVERVIEW_WIDGET_CATALOG,
  'rapid-response': RAPID_RESPONSE_WIDGET_CATALOG,
  'ai-task-board': AI_TASK_BOARD_WIDGET_CATALOG,
  'bugs-di-board': BUGS_DI_BOARD_WIDGET_CATALOG,
  'platform-analytics': PLATFORM_ANALYTICS_WIDGET_CATALOG,
  'pcm-validation': PCM_VALIDATION_WIDGET_CATALOG,
};
