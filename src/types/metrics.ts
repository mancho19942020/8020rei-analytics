/**
 * Dashboard Metrics Type Definitions
 *
 * Types for BigQuery analytics data used throughout the dashboard.
 */

export interface MetricsSummary {
  total_users: number;
  total_events: number;
  page_views: number;
  active_clients: number;
}

export interface UsersByDay {
  event_date: string;
  users: number;
  events: number;
}

export interface FeatureUsage {
  feature: string;
  views: number;
}

export interface ClientMetrics {
  client: string;
  events: number;
  users: number;
  page_views: number;
}

export interface DashboardData {
  metrics: MetricsSummary;
  usersByDay: UsersByDay[];
  featureUsage: FeatureUsage[];
  topClients: ClientMetrics[];
}

export interface DashboardResponse {
  success: boolean;
  data?: DashboardData;
  error?: string;
  timestamp?: string;
  cached?: boolean;
}
