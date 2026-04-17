/**
 * Integration Status Types
 *
 * Executive summary: Salesforce integration health per client + GA4 engagement by affiliation.
 * Data sources:
 *  - bigquery-467404.domain.feedback_clients_unique (Salesforce)
 *  - web-app-production-451214 GA4 events (views + engagement time)
 */

export interface IntegrationStatusSummary {
  total_integrated: number;
  deal_issues: number;
  lead_issues: number;
}

export interface Ga4AffiliationViews {
  page_views: number;
  total_users: number;
  avg_session_min: number;
  views_change_pct: number;    // % change vs previous period
  session_change_pct: number;  // % change in avg session duration vs previous period
  share_of_total_pct: number;  // % of total views (internal + external)
}

export interface IntegrationStatusData {
  salesforce: IntegrationStatusSummary;
  ga4?: {
    internal: Ga4AffiliationViews;
    external: Ga4AffiliationViews;
  };
  as_of: string;
}
