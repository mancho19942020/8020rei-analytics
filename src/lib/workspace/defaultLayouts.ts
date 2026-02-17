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
    lg: 12,  // Large screens (≥1200px)
    md: 10,  // Medium screens (≥996px)
    sm: 6,   // Small screens (≥768px)
    xs: 4,   // Extra small screens (≥480px)
    xxs: 2,  // Tiny screens (<480px)
  },
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
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
    h: 3,  // Height of 3 to fit metric cards properly (180px)
    minW: 6,
    minH: 3,
    maxH: 4,
  },
  {
    id: 'users-chart',
    type: 'timeseries',
    title: 'Users Over Time',
    x: 0,
    y: 3,  // Adjusted for Key Metrics height of 3
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
    y: 3,  // Adjusted for Key Metrics height of 3
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
    y: 8,  // Adjusted y position (3 + 5)
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
export const LAYOUT_STORAGE_KEY = 'axis-metrics-layout-v2';

/**
 * Users Tab Layout Storage Key
 */
export const USERS_LAYOUT_STORAGE_KEY = 'axis-users-layout-v1';

/**
 * Features Tab Layout Storage Key
 */
export const FEATURES_LAYOUT_STORAGE_KEY = 'axis-features-layout-v1';

/**
 * Clients Tab Layout Storage Key
 */
export const CLIENTS_LAYOUT_STORAGE_KEY = 'axis-clients-layout-v1';

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
export const EVENTS_LAYOUT_STORAGE_KEY = 'axis-events-layout-v1';

/**
 * Insights Tab Layout Storage Key
 */
export const INSIGHTS_LAYOUT_STORAGE_KEY = 'axis-insights-layout-v1';

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
    h: 3,
    minW: 6,
    minH: 3,
    maxH: 4,
  },
  {
    id: 'new-vs-returning',
    type: 'new-vs-returning',
    title: 'New vs Returning Users',
    x: 0,
    y: 3,
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
    y: 8,
    w: 12,
    h: 3,
    minW: 6,
    minH: 3,
    maxH: 4,
  },
  {
    id: 'session-summary',
    type: 'session-summary',
    title: 'Session Summary',
    x: 0,
    y: 11,
    w: 12,
    h: 3,
    minW: 6,
    minH: 3,
    maxH: 4,
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
    h: 3,
    minW: 6,
    minH: 3,
    maxH: 4,
  },
  {
    id: 'clients-table',
    type: 'clients-table',
    title: 'Top Clients',
    x: 0,
    y: 3,
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
    y: 9,
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
    h: 3,
    minW: 6,
    minH: 3,
    maxH: 4,
  },
  {
    id: 'event-volume-trend',
    type: 'event-volume-trend',
    title: 'Event Volume Trend',
    x: 0,
    y: 8,
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
    y: 13,
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
    h: 3,
    minW: 6,
    minH: 3,
    maxH: 4,
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
    description: 'Display 4 key metrics in a 2x2 grid',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 3 },
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
    defaultSize: { w: 12, h: 3 },
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
    defaultSize: { w: 12, h: 3 },
  },
  {
    type: 'session-summary',
    title: 'Session Summary',
    description: 'Total sessions and unique users overview',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 3 },
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
    defaultSize: { w: 12, h: 3 },
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
    defaultSize: { w: 12, h: 3 },
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
    defaultSize: { w: 12, h: 3 },
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
// PRODUCT TAB LAYOUTS & CATALOGS
// ============================================================================

/**
 * Product > Client Domains Layout Storage Key
 */
export const PRODUCT_DOMAINS_LAYOUT_STORAGE_KEY = 'axis-product-domains-layout-v1';

/**
 * Product > Product Projects Layout Storage Key
 */
export const PRODUCT_PROJECTS_LAYOUT_STORAGE_KEY = 'axis-product-projects-layout-v1';

/**
 * Default Client Domains Tab Layout
 */
export const DEFAULT_PRODUCT_DOMAINS_LAYOUT: Widget[] = [
  {
    id: 'domain-activity-overview',
    type: 'domain-activity-overview',
    title: 'Domain Activity Overview',
    x: 0, y: 0,
    w: 12, h: 3,
    minW: 6, minH: 3, maxH: 4,
  },
  {
    id: 'domain-leaderboard',
    type: 'domain-leaderboard',
    title: 'Domain Leaderboard',
    x: 0, y: 3,
    w: 12, h: 6,
    minW: 6, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'domain-activity-trend',
    type: 'domain-activity-trend',
    title: 'Domain Activity Trend',
    x: 0, y: 9,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
  {
    id: 'revenue-by-domain',
    type: 'revenue-by-domain',
    title: 'Revenue by Domain',
    x: 6, y: 9,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
  {
    id: 'flagged-domains',
    type: 'flagged-domains',
    title: 'Flagged Domains',
    x: 0, y: 14,
    w: 12, h: 5,
    minW: 6, minH: 4, maxW: 12, maxH: 8,
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
    w: 12, h: 3,
    minW: 6, minH: 3, maxH: 4,
  },
  {
    id: 'projects-table',
    type: 'projects-table',
    title: 'Projects',
    x: 0, y: 3,
    w: 12, h: 6,
    minW: 6, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'bug-tracking',
    type: 'bug-tracking',
    title: 'Bug Tracking',
    x: 0, y: 9,
    w: 12, h: 6,
    minW: 6, minH: 5, maxW: 12, maxH: 10,
  },
  {
    id: 'team-workload',
    type: 'team-workload',
    title: 'Team Workload',
    x: 0, y: 15,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
  {
    id: 'delivery-timeline',
    type: 'delivery-timeline',
    title: 'Delivery Timeline',
    x: 6, y: 15,
    w: 6, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
];

/**
 * Client Domains Tab Widget Catalog
 */
export const PRODUCT_DOMAINS_WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'domain-activity-overview',
    title: 'Domain Activity Overview',
    description: 'KPI cards for active domains, properties, leads, appointments, deals, revenue',
    iconKey: 'grid',
    defaultSize: { w: 12, h: 3 },
  },
  {
    type: 'domain-leaderboard',
    title: 'Domain Leaderboard',
    description: 'Ranked table of domains by activity with risk indicators',
    iconKey: 'table',
    defaultSize: { w: 12, h: 6 },
  },
  {
    type: 'domain-activity-trend',
    title: 'Domain Activity Trend',
    description: 'Line chart showing properties uploaded over time',
    iconKey: 'lineChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'revenue-by-domain',
    title: 'Revenue by Domain',
    description: 'Horizontal bar chart of top domains by revenue',
    iconKey: 'barChart',
    defaultSize: { w: 6, h: 5 },
  },
  {
    type: 'flagged-domains',
    title: 'Flagged Domains',
    description: 'Table of domains with flag issues requiring attention',
    iconKey: 'alert',
    defaultSize: { w: 12, h: 5 },
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
    defaultSize: { w: 12, h: 3 },
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
  'client-domains': PRODUCT_DOMAINS_WIDGET_CATALOG,
  'product-projects': PRODUCT_PROJECTS_WIDGET_CATALOG,
};
