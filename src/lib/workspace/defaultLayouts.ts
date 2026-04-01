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
    title: 'Key Metrics',
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
    title: 'Users Over Time',
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
    title: 'Feature Usage',
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
    title: 'Top Clients',
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
    title: 'User Activity (DAU/WAU/MAU)',
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
    title: 'New vs Returning Users',
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
    title: 'Engagement Metrics',
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
    title: 'Session Summary',
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
    title: 'Views per Feature',
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
    title: 'Feature Distribution',
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
    title: 'Feature Adoption Rate',
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
    title: 'Feature Trend Over Time',
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
    title: 'Top 20 Pages',
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
    title: 'Client Metrics Overview',
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
    title: 'Top Clients',
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
    title: 'Client Activity Trend',
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
    title: 'Traffic by Source',
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
    title: 'Traffic by Medium',
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
    title: 'Top Referrers',
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
    title: 'Sessions by Day of Week',
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
    title: 'First Visits Trend',
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
    title: 'Device Category',
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
    title: 'Browser Distribution',
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
    title: 'Operating System',
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
    title: 'Device Language',
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
    title: 'Users by Country',
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
    title: 'Activity by Continent',
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
    title: 'Users by State (US)',
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
    title: 'Users by City (US)',
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
    title: 'Scroll Depth by Page',
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
    title: 'Event Metrics',
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
    title: 'Event Volume Trend',
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
    title: 'Event Breakdown',
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
    title: 'Alert Summary',
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
    title: 'Alerts by Category',
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
    title: 'Active Alerts',
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
    title: 'Key Metrics',
    description: 'Display 4 key metrics in a flush row',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'timeseries',
    title: 'Users Over Time',
    description: 'Line chart showing user activity trends',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'barchart',
    title: 'Feature Usage',
    description: 'Horizontal bar chart of feature usage',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'table',
    title: 'Top Clients',
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
    title: 'User Activity (DAU/WAU/MAU)',
    description: 'Scorecards showing daily, weekly, and monthly active users',
    iconKey: 'users',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'new-vs-returning',
    title: 'New vs Returning Users',
    description: 'Stacked bar chart comparing new and returning users over time',
    iconKey: 'barChart',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'engagement-metrics',
    title: 'Engagement Metrics',
    description: 'Sessions per user, bounce rate, and engaged rate scorecards',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'session-summary',
    title: 'Session Summary',
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
    title: 'Views per Feature',
    description: 'Horizontal bar chart showing feature usage by views',
    iconKey: 'barChart',
    defaultSize: { w: 12, h: 10 },
  },
  {
    type: 'feature-distribution',
    title: 'Feature Distribution',
    description: 'Donut chart showing distribution of feature usage',
    iconKey: 'donutChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'feature-adoption',
    title: 'Feature Adoption Rate',
    description: 'Table showing adoption rates with progress bars',
    iconKey: 'table',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'feature-trend',
    title: 'Feature Trend Over Time',
    description: 'Multi-line chart showing feature trends over time',
    iconKey: 'lineChart',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'top-pages',
    title: 'Top 20 Pages',
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
    title: 'Client Metrics Overview',
    description: 'Scorecards for total clients, events, page views, and avg users',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'clients-table',
    title: 'Top Clients',
    description: 'Table showing top clients with drill-down capability',
    iconKey: 'table',
    defaultSize: { w: 12, h: 6 },
  },
  {
    type: 'client-activity-trend',
    title: 'Client Activity Trend',
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
    title: 'Traffic by Source',
    description: 'Bar chart showing traffic by source (direct, organic, referral)',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'traffic-by-medium',
    title: 'Traffic by Medium',
    description: 'Donut chart showing traffic by medium distribution',
    iconKey: 'donutChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'top-referrers',
    title: 'Top Referrers',
    description: 'Table showing top referring domains',
    iconKey: 'table',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'sessions-by-day',
    title: 'Sessions by Day of Week',
    description: 'Bar chart showing session distribution by day',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'first-visits-trend',
    title: 'First Visits Trend',
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
    title: 'Device Category',
    description: 'Donut chart showing desktop, mobile, and tablet distribution',
    iconKey: 'device',
    defaultSize: { w: 4, h: 5 },
  },
  {
    type: 'browser-distribution',
    title: 'Browser Distribution',
    description: 'Donut chart showing browser usage (Chrome, Safari, etc.)',
    iconKey: 'donutChart',
    defaultSize: { w: 4, h: 5 },
  },
  {
    type: 'operating-system',
    title: 'Operating System',
    description: 'Donut chart showing OS distribution (Windows, macOS, iOS, etc.)',
    iconKey: 'donutChart',
    defaultSize: { w: 4, h: 5 },
  },
  {
    type: 'device-language',
    title: 'Device Language',
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
    title: 'Users by Country',
    description: 'Bar chart showing user distribution by country',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'continent',
    title: 'Activity by Continent',
    description: 'Donut chart showing activity distribution by continent',
    iconKey: 'donutChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'region',
    title: 'Users by State (US)',
    description: 'Table showing user distribution by US state',
    iconKey: 'table',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'city',
    title: 'Users by City (US)',
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
    title: 'Scroll Depth by Page',
    description: 'Table showing scroll engagement by page',
    iconKey: 'table',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'event-metrics',
    title: 'Event Metrics',
    description: 'Scorecards for events/session, form conversion, clicks, scrolls',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'event-volume-trend',
    title: 'Event Volume Trend',
    description: 'Stacked bar chart showing event volume over time',
    iconKey: 'barChart',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'event-breakdown',
    title: 'Event Breakdown',
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
    title: 'Alert Summary',
    description: 'Scorecards showing critical, warning, and info alert counts',
    iconKey: 'alert',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'alerts-by-category',
    title: 'Alerts by Category',
    description: 'Donut chart showing alert distribution by category',
    iconKey: 'donutChart',
    defaultSize: { w: 4, h: 5 },
  },
  {
    type: 'alerts-feed',
    title: 'Active Alerts',
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
    title: 'Import Activity Overview',
    x: 0, y: 0,
    w: 12, h: 2,
    minW: 6, minH: 2, maxH: 2,
  },
  {
    id: 'domain-leaderboard',
    type: 'domain-leaderboard',
    title: 'Client Import Leaderboard',
    x: 0, y: 2,
    w: 12, h: 6,
    minW: 6, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'domain-activity-trend',
    type: 'domain-activity-trend',
    title: 'Import Volume Trend',
    x: 0, y: 8,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
  {
    id: 'revenue-by-domain',
    type: 'revenue-by-domain',
    title: 'Revenue by Client',
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
    title: 'Project Status',
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
    title: 'Bug Tracking',
    x: 0, y: 8,
    w: 12, h: 6,
    minW: 6, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'team-workload',
    type: 'team-workload',
    title: 'Team Workload',
    x: 0, y: 14,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
  {
    id: 'delivery-timeline',
    type: 'delivery-timeline',
    title: 'Delivery Timeline',
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
    title: 'Import Activity Overview',
    description: 'KPI cards for active clients, imported properties, leads, appointments, deals, revenue',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'domain-leaderboard',
    title: 'Client Import Leaderboard',
    description: 'Ranked table of clients by import activity with risk indicators',
    iconKey: 'table',
    defaultSize: { w: 12, h: 6 },
  },
  {
    type: 'domain-activity-trend',
    title: 'Import Volume Trend',
    description: 'Line chart showing import volume over time',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'revenue-by-domain',
    title: 'Revenue by Client',
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
    title: 'Project Status Overview',
    description: 'KPI cards for active, on-track, delayed, and completed projects',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'projects-table',
    title: 'Projects Table',
    description: 'Detailed table of projects with status, story points, and delays',
    iconKey: 'table',
    defaultSize: { w: 12, h: 6 },
  },
  {
    type: 'bug-tracking',
    title: 'Bug Tracking',
    description: 'Bug KPIs and weekly trend chart',
    iconKey: 'events',
    defaultSize: { w: 12, h: 6 },
  },
  {
    type: 'team-workload',
    title: 'Team Workload',
    description: 'Table showing task distribution and delays by team member',
    iconKey: 'users',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'delivery-timeline',
    title: 'Delivery Timeline',
    description: 'Table showing project delivery variance (early/on-time/late)',
    iconKey: 'table',
    defaultSize: { w: 6, h: 5 },
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
    title: 'API Overview',
    x: 0, y: 0,
    w: 12, h: 2,
    minW: 6, minH: 2, maxH: 2,
  },
  {
    id: 'api-calls-trend',
    type: 'api-calls-trend',
    title: 'API Calls Over Time',
    x: 0, y: 2,
    w: 6, h: 5,
    minW: 4, minH: 3, maxW: 12, maxH: 8,
  },
  {
    id: 'api-response-trend',
    type: 'api-response-trend',
    title: 'Response Time Trend',
    x: 6, y: 2,
    w: 6, h: 5,
    minW: 4, minH: 3, maxW: 12, maxH: 8,
  },
  {
    id: 'api-endpoint-breakdown',
    type: 'api-endpoint-breakdown',
    title: 'Usage by Endpoint',
    x: 0, y: 7,
    w: 6, h: 7,
    minW: 4, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'api-top-clients',
    type: 'api-top-clients',
    title: 'Top Clients',
    x: 6, y: 7,
    w: 6, h: 7,
    minW: 4, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'api-error-tracker',
    type: 'api-error-tracker',
    title: 'Error Tracker',
    x: 0, y: 14,
    w: 12, h: 5,
    minW: 6, minH: 4, maxW: 12, maxH: 8,
  },
  {
    id: 'api-recent-logs',
    type: 'api-recent-logs',
    title: 'Recent API Logs',
    x: 0, y: 19,
    w: 12, h: 7,
    minW: 6, minH: 5, maxW: 12, maxH: 12,
  },
];

export const PROPERTIES_API_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'api-overview',
    title: 'API Overview',
    description: 'KPI cards for total calls, unique clients, response time, error rate',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 2 },
  },
  {
    type: 'api-calls-trend',
    title: 'API Calls Over Time',
    description: 'Line chart showing call volume and errors over time',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'api-response-trend',
    title: 'Response Time Trend',
    description: 'Line chart showing average response time trend',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'api-endpoint-breakdown',
    title: 'Usage by Endpoint',
    description: 'Horizontal bar chart and table of calls per endpoint',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 7 },
  },
  {
    type: 'api-top-clients',
    title: 'Top Clients',
    description: 'Table of top API clients by call volume',
    iconKey: 'table',
    defaultSize: { w: 6, h: 7 },
  },
  {
    type: 'api-error-tracker',
    title: 'Error Tracker',
    description: 'Table of errors grouped by status code and message',
    iconKey: 'alert',
    defaultSize: { w: 12, h: 5 },
  },
  {
    type: 'api-recent-logs',
    title: 'Recent API Logs',
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
};
