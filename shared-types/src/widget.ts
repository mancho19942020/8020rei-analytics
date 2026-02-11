/**
 * Widget Types
 *
 * Types for the dashboard widget system.
 * Shared between frontend (rendering) and backend (data formatting).
 */

// ============================================================================
// WIDGET TYPES
// ============================================================================

/**
 * All available widget types across the platform
 */
export type WidgetType =
  // Overview tab widgets
  | 'metrics'
  | 'timeseries'
  | 'barchart'
  | 'table'
  // Users tab widgets
  | 'user-activity'
  | 'new-vs-returning'
  | 'engagement-metrics'
  | 'session-summary'
  | 'first-visits-trend'
  | 'sessions-by-day'
  // Features tab widgets
  | 'feature-usage'
  | 'feature-distribution'
  | 'feature-adoption'
  | 'feature-trend'
  | 'top-pages'
  // Clients tab widgets
  | 'clients-overview'
  | 'clients-table'
  | 'client-activity-trend'
  // Traffic tab widgets
  | 'traffic-by-source'
  | 'traffic-by-medium'
  | 'traffic-browser'
  | 'top-referrers'
  // Technology tab widgets
  | 'device-category'
  | 'browser-distribution'
  | 'operating-system'
  | 'device-language'
  | 'screen-resolution'
  // Geography tab widgets
  | 'country'
  | 'continent'
  | 'region'
  | 'city'
  // Events tab widgets
  | 'event-breakdown'
  | 'event-volume-trend'
  | 'event-metrics'
  | 'scroll-depth'
  // Insights tab widgets
  | 'insights-summary'
  | 'alerts-feed'
  | 'alerts-by-category'
  // Future widgets (Salesforce, Pipelines, QA, ML)
  | 'salesforce-integrations'
  | 'leads-funnel'
  | 'pipeline-health'
  | 'axiom-results'
  | 'model-performance';

/**
 * Widget configuration
 */
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  config?: Record<string, unknown>;
}

/**
 * Widget catalog item (for add widget modal)
 */
export interface WidgetCatalogItem {
  type: WidgetType;
  title: string;
  description: string;
  iconKey: string;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
}

/**
 * Tab handle interface for unified toolbar
 */
export interface TabHandle {
  resetLayout: () => void;
  openWidgetCatalog: () => void;
}

// ============================================================================
// LAYOUT TYPES
// ============================================================================

/**
 * Grid breakpoint configuration
 */
export interface GridBreakpoint {
  lg: number;
  md: number;
  sm: number;
  xs: number;
  xxs: number;
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  cols: GridBreakpoint;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
}
