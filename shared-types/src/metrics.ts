/**
 * Metrics Types
 *
 * Standardized data structures for metrics across all data sources.
 * These types ensure consistency between frontend widgets and backend APIs.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * A single metric value with optional trend information
 */
export interface MetricValue {
  label: string;
  value: number;
  previousValue?: number;
  change?: number; // Percentage change
  trend?: 'up' | 'down' | 'flat';
  isPositive?: boolean; // Whether the trend direction is good for business
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Multi-series time series data
 */
export interface TimeSeriesData {
  labels: string[];
  datasets: {
    name: string;
    values: number[];
    color?: string;
  }[];
}

/**
 * Categorical data point (for charts)
 */
export interface CategoricalDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

/**
 * Table column definition
 */
export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  sortable?: boolean;
  width?: string;
}

/**
 * Table data structure
 */
export interface TableData {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  total?: number;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// ANALYTICS TYPES (GA4)
// ============================================================================

/**
 * Main dashboard metrics
 */
export interface DashboardMetrics {
  total_users: number;
  total_events: number;
  page_views: number;
  active_clients: number;
  avg_session_duration?: number;
  bounce_rate?: number;
}

/**
 * User activity metrics (DAU, WAU, MAU)
 */
export interface UserActivityMetrics {
  dau: number;
  wau: number;
  mau: number;
  dau_trend?: MetricValue['trend'];
  wau_trend?: MetricValue['trend'];
  mau_trend?: MetricValue['trend'];
}

/**
 * User engagement metrics
 */
export interface EngagementMetrics {
  avg_session_duration: number;
  avg_pages_per_session: number;
  bounce_rate: number;
  engagement_rate: number;
}

/**
 * Feature usage data
 */
export interface FeatureUsage {
  feature: string;
  views: number;
  unique_users: number;
  trend?: MetricValue['trend'];
}

/**
 * Client data
 */
export interface ClientData {
  client: string;
  events: number;
  users: number;
  page_views: number;
  last_active?: string;
}

/**
 * Traffic source data
 */
export interface TrafficSource {
  source: string;
  sessions: number;
  users: number;
  bounce_rate?: number;
}

/**
 * Geographic data
 */
export interface GeographicData {
  location: string;
  sessions: number;
  users: number;
  percentage?: number;
}

/**
 * Technology/device data
 */
export interface TechnologyData {
  category: string;
  sessions: number;
  users: number;
  percentage?: number;
}

// ============================================================================
// SALESFORCE TYPES (Future)
// ============================================================================

/**
 * Salesforce integration status
 */
export interface SalesforceIntegration {
  client_id: string;
  client_name: string;
  status: 'active' | 'inactive' | 'error';
  last_sync?: string;
  leads_count: number;
  deals_count: number;
}

/**
 * Lead funnel data
 */
export interface LeadFunnelData {
  stage: string;
  count: number;
  conversion_rate?: number;
}

// ============================================================================
// PIPELINE TYPES (Future)
// ============================================================================

/**
 * Pipeline status
 */
export interface PipelineStatus {
  name: string;
  stage: 'bronze' | 'silver' | 'gold';
  status: 'healthy' | 'warning' | 'error';
  records_processed: number;
  last_run: string;
  latency_ms?: number;
}

// ============================================================================
// QA TYPES (Future)
// ============================================================================

/**
 * Axiom validation result
 */
export interface AxiomValidation {
  axiom_id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message?: string;
  timestamp: string;
}

// ============================================================================
// ML TYPES (Future)
// ============================================================================

/**
 * Model performance metrics
 */
export interface ModelPerformance {
  model_id: string;
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  last_trained: string;
  drift_detected?: boolean;
}
