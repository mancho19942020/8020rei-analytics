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
export const LAYOUT_STORAGE_KEY = 'axis-metrics-layout-v3';

/**
 * Users Tab Layout Storage Key
 */
export const USERS_LAYOUT_STORAGE_KEY = 'axis-users-layout-v2';

/**
 * Features Tab Layout Storage Key
 */
export const FEATURES_LAYOUT_STORAGE_KEY = 'axis-features-layout-v1';

/**
 * Clients Tab Layout Storage Key
 */
export const CLIENTS_LAYOUT_STORAGE_KEY = 'axis-clients-layout-v2';

/**
 * Traffic Tab Layout Storage Key
 */
export const TRAFFIC_LAYOUT_STORAGE_KEY = 'axis-traffic-layout-v1';

/**
 * Technology Tab Layout Storage Key
 */
export const TECHNOLOGY_LAYOUT_STORAGE_KEY = 'axis-technology-layout-v1';

/**
 * Geography Tab Layout Storage Key
 */
export const GEOGRAPHY_LAYOUT_STORAGE_KEY = 'axis-geography-layout-v1';

/**
 * Events Tab Layout Storage Key
 */
export const EVENTS_LAYOUT_STORAGE_KEY = 'axis-events-layout-v2';

/**
 * Insights Tab Layout Storage Key
 */
export const INSIGHTS_LAYOUT_STORAGE_KEY = 'axis-insights-layout-v2';

/**
 * Layout Version
 *
 * Used for migration when layout structure changes.
 */
export const LAYOUT_VERSION = '1.0.0';

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
    h: 10,     // Increased to 10 rows (600px) to show all 12+ features
    minW: 6,
    minH: 8,
    maxW: 12,
    maxH: 14,
  },
  {
    id: 'feature-distribution',
    type: 'feature-distribution',
    title: 'Feature distribution',
    x: 0,
    y: 10,     // Adjusted for feature-usage h:10
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
    y: 10,     // Adjusted for feature-usage h:10
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
    y: 15,     // Adjusted: 10 + 5
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
    y: 20,     // Adjusted: 15 + 5
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
    h: 6,
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
    y: 8,
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
 * The default arrangement of widgets for the Traffic tab.
 * Layout follows the design spec:
 * - Traffic by Source (bar) + Traffic by Medium (donut) side by side
 * - Top Referrers table (full width)
 * - Sessions By Day (bar) + First Visits Trend (line) side by side
 */
export const DEFAULT_TRAFFIC_LAYOUT: Widget[] = [
  {
    id: 'traffic-by-source',
    type: 'traffic-by-source',
    title: 'Traffic by source',
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
    id: 'traffic-by-medium',
    type: 'traffic-by-medium',
    title: 'Traffic by medium',
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
    id: 'top-referrers',
    type: 'top-referrers',
    title: 'Top referrers',
    x: 0,
    y: 5,
    w: 12,
    h: 5,
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    id: 'sessions-by-day',
    type: 'sessions-by-day',
    title: 'Sessions by day of week',
    x: 0,
    y: 10,
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
    title: 'First visits trend',
    x: 6,
    y: 10,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
];

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
    id: 'alerts-by-category',
    type: 'alerts-by-category',
    title: 'Alerts by category',
    x: 0,
    y: 2,
    w: 4,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 6,
    maxH: 8,
  },
  {
    id: 'alerts-feed',
    type: 'alerts-feed',
    title: 'Active alerts',
    x: 4,
    y: 2,
    w: 8,
    h: 10,
    minW: 6,
    minH: 5,
    maxW: 12,
    maxH: 14,
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
    description: 'Horizontal bar chart showing feature usage by views',
    iconKey: 'barChart',
    defaultSize: { w: 12, h: 10 },
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
 * Traffic Tab Widget Catalog
 */
export const TRAFFIC_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'traffic-by-source',
    title: 'Traffic by source',
    description: 'Bar chart showing traffic by source (direct, organic, referral)',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'traffic-by-medium',
    title: 'Traffic by medium',
    description: 'Donut chart showing traffic by medium distribution',
    iconKey: 'donutChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'top-referrers',
    title: 'Top referrers',
    description: 'Table showing top referring domains',
    iconKey: 'table',
    defaultSize: { w: 12, h: 5 },
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
    title: 'First visits trend',
    description: 'Line chart showing new user acquisition trend',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
];

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
export const PRODUCT_DOMAINS_LAYOUT_STORAGE_KEY = 'axis-feedback-import-layout-v2';

/**
 * Product > Product Projects Layout Storage Key
 */
export const PRODUCT_PROJECTS_LAYOUT_STORAGE_KEY = 'axis-product-projects-layout-v2';

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
// Features > 8020REI > Rapid Response Tab
// ---------------------------------------------------------------------------

export const RAPID_RESPONSE_LAYOUT_STORAGE_KEY = 'rapid-response-layout-v1';

export const DEFAULT_RAPID_RESPONSE_LAYOUT: Widget[] = [
  // Layer 1: The Three Pillars (System Status is a standalone callout above the grid)
  {
    id: 'rr-operational-pulse',
    type: 'rr-operational-pulse',
    title: 'Is it running?',
    x: 0, y: 0,
    w: 4, h: 4,
    minW: 3, minH: 3, maxW: 6, maxH: 6,
  },
  {
    id: 'rr-quality-metrics',
    type: 'rr-quality-metrics',
    title: 'Is it working?',
    x: 4, y: 0,
    w: 4, h: 4,
    minW: 3, minH: 3, maxW: 6, maxH: 6,
  },
  {
    id: 'rr-pcm-health',
    type: 'rr-pcm-health',
    title: 'Is it aligned?',
    x: 8, y: 0,
    w: 4, h: 4,
    minW: 3, minH: 3, maxW: 6, maxH: 6,
  },
  // Layer 2: The Detail
  {
    id: 'rr-sends-trend',
    type: 'rr-sends-trend',
    title: 'Send volume trend',
    x: 0, y: 4,
    w: 6, h: 5,
    minW: 4, minH: 3, maxW: 12, maxH: 8,
  },
  {
    id: 'rr-status-breakdown',
    type: 'rr-status-breakdown',
    title: 'Status breakdown',
    x: 6, y: 4,
    w: 6, h: 5,
    minW: 4, minH: 3, maxW: 12, maxH: 8,
  },
  // Layer 3: The Watchlist
  {
    id: 'rr-alerts-feed',
    type: 'rr-alerts-feed',
    title: 'Alerts',
    x: 0, y: 9,
    w: 12, h: 5,
    minW: 6, minH: 3, maxW: 12, maxH: 8,
  },
  // Layer 4: The Drill-Down
  {
    id: 'rr-campaign-table',
    type: 'rr-campaign-table',
    title: 'Campaigns',
    x: 0, y: 14,
    w: 7, h: 6,
    minW: 5, minH: 4, maxW: 12, maxH: 10,
  },
  {
    id: 'rr-cost-overview',
    type: 'rr-cost-overview',
    title: 'Cost overview',
    x: 7, y: 14,
    w: 5, h: 6,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
];

export const RAPID_RESPONSE_WIDGET_CATALOG: WidgetCatalogItem[] = [
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
    description: 'Stale records, orphaned orders, sync gap, delivery lag',
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
    type: 'rr-alerts-feed',
    title: 'Alerts',
    description: 'Active alerts with severity, description, and recommended actions',
    iconKey: 'alert',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'rr-campaign-table',
    title: 'Campaigns',
    description: 'Sortable table of all campaigns with status and metrics',
    iconKey: 'table',
    defaultSize: { w: 7, h: 6 },
  },
  {
    type: 'rr-cost-overview',
    title: 'Cost overview',
    description: 'Daily spend and cost per delivered piece chart',
    iconKey: 'lineChart',
    defaultSize: { w: 5, h: 6 },
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

/**
 * Combined catalog lookup by tab name
 */
export const TAB_WIDGET_CATALOGS: Record<string, WidgetCatalogItem[]> = {
  overview: OVERVIEW_WIDGET_CATALOG,
  users: USERS_WIDGET_CATALOG,
  features: FEATURES_WIDGET_CATALOG,
  clients: CLIENTS_WIDGET_CATALOG,
  traffic: TRAFFIC_WIDGET_CATALOG,
  technology: TECHNOLOGY_WIDGET_CATALOG,
  geography: GEOGRAPHY_WIDGET_CATALOG,
  events: EVENTS_WIDGET_CATALOG,
  insights: INSIGHTS_WIDGET_CATALOG,
  'import': PRODUCT_DOMAINS_WIDGET_CATALOG,
  'product-projects': PRODUCT_PROJECTS_WIDGET_CATALOG,
  'properties-api': PROPERTIES_API_WIDGET_CATALOG,
  'rapid-response': RAPID_RESPONSE_WIDGET_CATALOG,
};
