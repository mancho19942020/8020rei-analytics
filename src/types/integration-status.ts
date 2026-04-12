/**
 * Integration Status Types
 *
 * Executive summary: Salesforce integration health per client.
 * Data source: bigquery-467404.domain.feedback_clients_unique
 */

export interface IntegrationStatusSummary {
  total_integrated: number;
  deal_issues: number;
  lead_issues: number;
}

export interface IntegrationStatusData {
  salesforce: IntegrationStatusSummary;
  as_of: string;
}
