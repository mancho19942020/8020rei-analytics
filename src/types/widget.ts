/**
 * Widget Type Definitions
 *
 * Type definitions for the grid-based workspace widget system.
 */

import { Layout } from 'react-grid-layout';

/**
 * Widget Types
 *
 * Overview tab types: metrics, timeseries, barchart, table
 * Users tab types: user-activity, new-vs-returning, engagement-metrics, session-summary
 * Features tab types: feature-usage, feature-distribution, feature-adoption, feature-trend, top-pages
 * Clients tab types: clients-overview, clients-table, client-activity-trend
 * Traffic tab types: traffic-by-source, traffic-by-medium, top-referrers, sessions-by-day, first-visits-trend
 * Traffic tab types: traffic-by-source, traffic-by-medium, traffic-browser, top-referrers, top-pages, sessions-by-day, first-visits-trend
 * Technology tab types: device-category, browser-distribution, operating-system, device-language, screen-resolution
 * Geography tab types: country, continent, region, city
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
  | 'top-pages'
  | 'sessions-by-day'
  | 'first-visits-trend'
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
  // Product > Client Domains tab widgets
  | 'domain-activity-overview'
  | 'domain-leaderboard'
  | 'domain-activity-trend'
  | 'revenue-by-domain'
  | 'flagged-domains'
  // Product > Product Projects tab widgets
  | 'project-status-overview'
  | 'projects-table'
  | 'bug-tracking'
  | 'team-workload'
  | 'delivery-timeline';

/**
 * Widget Configuration
 *
 * Defines the structure and behavior of a widget in the grid workspace.
 */
export interface Widget {
  /** Unique identifier for the widget */
  id: string;

  /** Type of widget */
  type: WidgetType;

  /** Display title */
  title: string;

  /** Grid column position (0-based) */
  x: number;

  /** Grid row position (0-based) */
  y: number;

  /** Width in grid columns */
  w: number;

  /** Height in grid rows */
  h: number;

  /** Minimum width (optional) */
  minW?: number;

  /** Minimum height (optional) */
  minH?: number;

  /** Maximum width (optional) */
  maxW?: number;

  /** Maximum height (optional) */
  maxH?: number;

  /** Whether widget is static (cannot be moved/resized) */
  static?: boolean;

  /** Widget-specific configuration */
  config?: Record<string, any>;
}

/**
 * Saved Layout
 *
 * Structure for persisting user layouts.
 */
export interface SavedLayout {
  /** Layout version for migrations */
  version: string;

  /** User ID (optional, for multi-user support) */
  userId?: string;

  /** Timestamp of when layout was saved */
  timestamp: string;

  /** Widget layout configuration */
  layout: Widget[];

  /** Active tab (optional) */
  activeTab?: string;
}

/**
 * Grid Configuration
 *
 * Configuration for the responsive grid system.
 */
export interface GridConfig {
  /** Number of columns at each breakpoint */
  cols: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
    xxs: number;
  };

  /** Breakpoint widths in pixels */
  breakpoints: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
    xxs: number;
  };

  /** Height of each grid row in pixels */
  rowHeight: number;

  /** Margin between widgets [horizontal, vertical] */
  margin: [number, number];

  /** Padding around the grid container [horizontal, vertical] */
  containerPadding: [number, number];
}

/**
 * Widget Props
 *
 * Base props for all widget components.
 */
export interface WidgetProps {
  /** Widget configuration */
  widget: Widget;

  /** Whether the workspace is in edit mode */
  editMode?: boolean;

  /** Callback when widget is removed */
  onRemove?: (widgetId: string) => void;

  /** Callback when widget settings are changed */
  onSettingsChange?: (widgetId: string, config: Record<string, any>) => void;
}

/**
 * Tab Handle Interface
 *
 * Methods exposed by tab components via ref for parent control.
 * Used to enable unified toolbar actions (Reset Layout, Add Widget)
 * across all dashboard tabs.
 */
export interface TabHandle {
  /** Reset the tab's layout to default configuration */
  resetLayout: () => void;
  /** Open the widget catalog modal */
  openWidgetCatalog: () => void;
}
