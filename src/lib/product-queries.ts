/**
 * Product SQL Queries
 *
 * BigQuery queries for the Product subsection:
 * - Client Domains: feedback_clients_unique table (domain dataset)
 * - Product Projects: Jira issues tables (jira dataset)
 *
 * All queries target project: bigquery-467404
 * All queries use date filters to control scan costs.
 */

import { PRODUCT_PROJECT, PRODUCT_DATASET } from './bigquery';

/** Date range parameters for custom period filtering */
export interface DateRangeParams {
  days?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

const TABLE = `\`${PRODUCT_PROJECT}.${PRODUCT_DATASET}.feedback_clients_unique\``;
const JIRA_DATASET = 'jira';

// ============================================================================
// DATE FILTER HELPERS
// ============================================================================

/** Returns a SQL condition for the current period on a DATE column */
function getProductDateFilter(dateRange: DateRangeParams, dateColumn: string = 'date'): string {
  if (dateRange.startDate && dateRange.endDate) {
    return `${dateColumn} >= '${dateRange.startDate}' AND ${dateColumn} <= '${dateRange.endDate}'`;
  }
  const days = dateRange.days || 30;
  return `${dateColumn} >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)`;
}

/** Returns a SQL condition for the previous period on a DATE column */
function getProductPreviousDateFilter(dateRange: DateRangeParams, dateColumn: string = 'date'): string {
  if (dateRange.startDate && dateRange.endDate) {
    const rangeDays = Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / 86400000);
    const prevEnd = new Date(new Date(dateRange.startDate).getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - rangeDays * 86400000);
    const fmtStart = prevStart.toISOString().split('T')[0];
    const fmtEnd = prevEnd.toISOString().split('T')[0];
    return `${dateColumn} >= '${fmtStart}' AND ${dateColumn} <= '${fmtEnd}'`;
  }
  const days = dateRange.days || 30;
  return `${dateColumn} >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days * 2} DAY) AND ${dateColumn} < DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)`;
}

/** Returns a SQL condition for the current period on a TIMESTAMP column */
function getProductTimestampFilter(dateRange: DateRangeParams, tsColumn: string = 'updated'): string {
  if (dateRange.startDate && dateRange.endDate) {
    return `${tsColumn} >= TIMESTAMP('${dateRange.startDate}') AND ${tsColumn} <= TIMESTAMP('${dateRange.endDate} 23:59:59')`;
  }
  const days = dateRange.days || 30;
  return `${tsColumn} >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))`;
}

/** Returns a SQL condition for the previous period on a TIMESTAMP column */
function getProductPreviousTimestampFilter(dateRange: DateRangeParams, tsColumn: string = 'updated'): string {
  if (dateRange.startDate && dateRange.endDate) {
    const rangeDays = Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / 86400000);
    const prevEnd = new Date(new Date(dateRange.startDate).getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - rangeDays * 86400000);
    const fmtStart = prevStart.toISOString().split('T')[0];
    const fmtEnd = prevEnd.toISOString().split('T')[0];
    return `${tsColumn} >= TIMESTAMP('${fmtStart}') AND ${tsColumn} <= TIMESTAMP('${fmtEnd} 23:59:59')`;
  }
  const days = dateRange.days || 30;
  return `${tsColumn} >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days * 2} DAY)) AND ${tsColumn} < TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))`;
}

/** Returns a SQL "before current period" boundary for TIMESTAMP columns (used in previous-period snapshots) */
function getProductTimestampBefore(dateRange: DateRangeParams, tsColumn: string = 'updated'): string {
  if (dateRange.startDate) {
    return `${tsColumn} < TIMESTAMP('${dateRange.startDate}')`;
  }
  const days = dateRange.days || 30;
  return `${tsColumn} < TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))`;
}

/** Returns a SQL "before current period" boundary for DATE columns (used in previous-period snapshots) */
function getProductDateBefore(dateRange: DateRangeParams, dateColumn: string = 'date'): string {
  if (dateRange.startDate) {
    return `${dateColumn} < '${dateRange.startDate}'`;
  }
  const days = dateRange.days || 30;
  return `${dateColumn} < DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)`;
}

// ============================================================================
// CLIENT DOMAINS QUERIES
// ============================================================================

/**
 * Domain Activity Overview - KPI summary
 * Returns: total domains, properties, leads, appointments, deals, revenue
 */
export function getDomainActivityOverviewQuery(dateRange: DateRangeParams = {}): string {
  return `
    SELECT
      COUNT(DISTINCT domain_name) as total_active_domains,
      COUNT(*) as total_properties,
      COUNTIF(LOWER(record_type) = 'lead') as leads_count,
      COUNTIF(LOWER(record_type) = 'appointment') as appointments_count,
      COUNTIF(LOWER(record_type) = 'deal') as deals_count,
      COALESCE(SUM(revenue), 0) as total_revenue
    FROM ${TABLE}
    WHERE ${getProductDateFilter(dateRange)}
  `;
}

/**
 * Previous period overview for trend calculation
 */
export function getPreviousDomainOverviewQuery(dateRange: DateRangeParams = {}): string {
  return `
    SELECT
      COUNT(DISTINCT domain_name) as prev_total_active_domains,
      COUNT(*) as prev_total_properties,
      COUNTIF(LOWER(record_type) = 'lead') as prev_leads_count,
      COUNTIF(LOWER(record_type) = 'appointment') as prev_appointments_count,
      COUNTIF(LOWER(record_type) = 'deal') as prev_deals_count,
      COALESCE(SUM(revenue), 0) as prev_total_revenue
    FROM ${TABLE}
    WHERE ${getProductPreviousDateFilter(dateRange)}
  `;
}

/**
 * Domain Leaderboard - all domains ever recorded, ranked by activity in the selected period.
 * The domain list is NOT date-filtered so every domain always appears.
 * Metrics (properties, leads, etc.) are scoped to the selected period via conditional aggregates.
 * Risk level is derived from all-time last activity date.
 */
export function getDomainLeaderboardQuery(dateRange: DateRangeParams = {}): string {
  const dateCondition = dateRange.startDate && dateRange.endDate
    ? `date >= '${dateRange.startDate}' AND date <= '${dateRange.endDate}'`
    : `date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${dateRange.days || 30} DAY)`;
  return `
    SELECT
      domain_name,
      COUNTIF(${dateCondition}) as total_properties,
      COUNTIF(LOWER(record_type) = 'lead' AND ${dateCondition}) as leads_count,
      COUNTIF(LOWER(record_type) = 'appointment' AND ${dateCondition}) as appointments_count,
      COUNTIF(LOWER(record_type) = 'deal' AND ${dateCondition}) as deals_count,
      COALESCE(SUM(CASE WHEN ${dateCondition} THEN revenue ELSE NULL END), 0) as total_revenue,
      FORMAT_DATE('%Y-%m-%d', MAX(CASE WHEN date <= CURRENT_DATE() THEN date ELSE NULL END)) as last_activity_date,
      DATE_DIFF(CURRENT_DATE(), MAX(CASE WHEN date <= CURRENT_DATE() THEN date ELSE NULL END), DAY) as days_since_activity,
      CASE
        WHEN DATE_DIFF(CURRENT_DATE(), MAX(CASE WHEN date <= CURRENT_DATE() THEN date ELSE NULL END), DAY) <= 15 THEN 'healthy'
        WHEN DATE_DIFF(CURRENT_DATE(), MAX(CASE WHEN date <= CURRENT_DATE() THEN date ELSE NULL END), DAY) <= 90 THEN 'at-risk'
        ELSE 'inactive'
      END as risk_level
    FROM ${TABLE}
    GROUP BY domain_name
    ORDER BY total_properties DESC
  `;
}

/**
 * Domain Activity Trend - properties uploaded per day
 */
export function getDomainActivityTrendQuery(dateRange: DateRangeParams = {}): string {
  return `
    SELECT
      FORMAT_DATE('%Y-%m-%d', date) as date,
      COUNT(*) as properties_uploaded,
      COUNT(DISTINCT domain_name) as domain_count
    FROM ${TABLE}
    WHERE ${getProductDateFilter(dateRange)}
    GROUP BY date
    ORDER BY date ASC
  `;
}

/**
 * Revenue by Domain - top 20 domains by revenue
 */
export function getRevenueByDomainQuery(dateRange: DateRangeParams = {}): string {
  return `
    SELECT
      domain_name,
      COALESCE(SUM(revenue), 0) as revenue
    FROM ${TABLE}
    WHERE ${getProductDateFilter(dateRange)}
      AND revenue IS NOT NULL
      AND revenue > 0
    GROUP BY domain_name
    ORDER BY revenue DESC
    LIMIT 20
  `;
}


// ============================================================================
// PRODUCT PROJECTS QUERIES (Jira)
// Dataset: bigquery-467404.jira
// Tables: issues_unique (deduplicated, 13K rows), issues_bugs (bug view, 1.4K rows)
// Status categories: "Done", "To Do", "In Progress"
// Critical = priority IN ('Highest', 'High')
// ============================================================================

const ISSUES_TABLE = `\`${PRODUCT_PROJECT}.${JIRA_DATASET}.issues_unique\``;
const BUGS_TABLE = `\`${PRODUCT_PROJECT}.${JIRA_DATASET}.issues_bugs\``;

/**
 * Project Status Overview - counts by status category
 * Uses issues_unique filtered by updated date (Jira has no single "date" column)
 */
export function getProjectStatusOverviewQuery(dateRange: DateRangeParams = {}): string {
  return `
    SELECT
      COUNTIF(status_category IN ('To Do', 'In Progress')) as active_projects,
      COUNTIF(status_category = 'In Progress') as on_track,
      COUNTIF(status_category IN ('To Do', 'In Progress') AND due_date IS NOT NULL AND due_date < CURRENT_DATE()) as delayed,
      COUNTIF(status_category = 'Done' AND ${getProductTimestampFilter(dateRange)}) as completed
    FROM ${ISSUES_TABLE}
    WHERE issue_type = 'Epic'
  `;
}

/**
 * Previous period project status for trend calculation.
 * Snapshots the same counters but shifted back to the previous period.
 * active/on_track/delayed use the updated timestamp to approximate the previous window.
 */
export function getPreviousProjectStatusOverviewQuery(dateRange: DateRangeParams = {}): string {
  return `
    SELECT
      COUNTIF(status_category IN ('To Do', 'In Progress') AND ${getProductTimestampBefore(dateRange)}) as prev_active_projects,
      COUNTIF(status_category = 'In Progress' AND ${getProductTimestampBefore(dateRange)}) as prev_on_track,
      COUNTIF(status_category IN ('To Do', 'In Progress') AND due_date IS NOT NULL AND ${getProductDateBefore(dateRange, 'due_date')} AND ${getProductTimestampBefore(dateRange)}) as prev_delayed,
      COUNTIF(status_category = 'Done' AND ${getProductPreviousTimestampFilter(dateRange)}) as prev_completed
    FROM ${ISSUES_TABLE}
    WHERE issue_type = 'Epic'
  `;
}

/**
 * Projects Table - Epics with progress and delay info
 */
export function getProjectsTableQuery(dateRange: DateRangeParams = {}): string {
  return `
    WITH epic_progress AS (
      SELECT
        e.key as issue_key,
        e.summary,
        e.status,
        COALESCE(e.assignee_name, 'Unassigned') as assignee,
        FORMAT_DATE('%Y-%m-%d', e.due_date) as due_date,
        COALESCE(SUM(CASE WHEN c.status_category = 'Done' THEN COALESCE(c.story_points, 0) ELSE 0 END), 0) as story_points_completed,
        COALESCE(SUM(COALESCE(c.story_points, 0)), 0) as story_points_total,
        CASE
          WHEN e.due_date IS NOT NULL AND e.status_category != 'Done' AND e.due_date < CURRENT_DATE()
          THEN DATE_DIFF(CURRENT_DATE(), e.due_date, DAY)
          ELSE 0
        END as days_of_delay
      FROM ${ISSUES_TABLE} e
      LEFT JOIN ${ISSUES_TABLE} c ON c.epic_key = e.key
      WHERE e.issue_type = 'Epic'
        AND (e.status_category IN ('To Do', 'In Progress')
             OR (e.status_category = 'Done' AND ${getProductTimestampFilter(dateRange, 'e.updated')}))
      GROUP BY e.key, e.summary, e.status, e.assignee_name, e.due_date, e.status_category
    )
    SELECT * FROM epic_progress
    ORDER BY days_of_delay DESC, issue_key
    LIMIT 50
  `;
}

/**
 * Bug Tracking Overview - KPI counts from issues_bugs
 */
export function getBugTrackingOverviewQuery(dateRange: DateRangeParams = {}): string {
  return `
    SELECT
      COUNT(*) as total_unique_bugs,
      COUNTIF(origin = 'Clients') as customer_bugs,
      COUNTIF(priority IN ('Highest', 'High')) as critical_bugs,
      COUNTIF(priority IN ('Highest', 'High') AND status_category != 'Done') as critical_open_bugs
    FROM ${BUGS_TABLE}
    WHERE ${getProductDateFilter(dateRange, 'created')}
  `;
}

/**
 * Bug Origins - count by origin source
 */
export function getBugOriginsQuery(dateRange: DateRangeParams = {}): string {
  return `
    SELECT
      COALESCE(origin, 'Unknown') as origin,
      COUNT(*) as count
    FROM ${BUGS_TABLE}
    WHERE ${getProductDateFilter(dateRange, 'created')}
    GROUP BY origin
    ORDER BY count DESC
  `;
}

/**
 * Weekly Bug Trend - bugs created per week
 */
export function getWeeklyBugTrendQuery(dateRange: DateRangeParams = {}): string {
  return `
    SELECT
      FORMAT_DATE('%Y-W%V', created) as week,
      COUNT(*) as count
    FROM ${BUGS_TABLE}
    WHERE ${getProductDateFilter(dateRange, 'created')}
    GROUP BY week
    ORDER BY week ASC
  `;
}

/**
 * Team Workload - tasks per assignee with status breakdown
 */
export function getTeamWorkloadQuery(dateRange: DateRangeParams = {}): string {
  return `
    SELECT
      COALESCE(assignee_name, 'Unassigned') as assignee,
      COUNT(*) as total_tasks,
      COUNTIF(status_category = 'Done') as completed_tasks,
      COUNTIF(status_category = 'In Progress') as in_progress_tasks,
      COUNTIF(status_category != 'Done' AND due_date IS NOT NULL AND due_date < CURRENT_DATE()) as delayed_tasks
    FROM ${ISSUES_TABLE}
    WHERE ${getProductTimestampFilter(dateRange)}
      AND issue_type NOT IN ('Epic')
    GROUP BY assignee_name
    ORDER BY total_tasks DESC
    LIMIT 30
  `;
}

// ============================================================================
// INTEGRATION STATUS QUERIES (feedback_clients_unique)
// Salesforce integration health: deal/lead sync gaps per client
// Window is always fixed at 30 days — this is a business definition,
// not driven by the global date filter.
// ============================================================================

/**
 * Integration Status Summary — Salesforce
 *
 * Counts:
 *  - total_integrated: clients with active Salesforce integration
 *  - deal_issues: integrated clients with no deals in the last 30 days
 *  - lead_issues: integrated clients with no leads in the last 30 days
 */
export function getIntegrationStatusQuery(): string {
  return `
    WITH integrated AS (
      SELECT DISTINCT domain_name
      FROM ${TABLE}
      WHERE client_salesforce_integration IN ('Integrated 2-way', 'CRM → 8020REI')
    ),
    deals_recent AS (
      SELECT DISTINCT domain_name
      FROM ${TABLE}
      WHERE LOWER(record_type) = 'deal'
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
    ),
    leads_recent AS (
      SELECT DISTINCT domain_name
      FROM ${TABLE}
      WHERE LOWER(record_type) = 'lead'
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    )
    SELECT
      COUNT(DISTINCT i.domain_name)              AS total_integrated,
      COUNTIF(d.domain_name IS NULL)             AS deal_issues,
      COUNTIF(l.domain_name IS NULL)             AS lead_issues
    FROM integrated i
    LEFT JOIN deals_recent d ON i.domain_name = d.domain_name
    LEFT JOIN leads_recent l ON i.domain_name = l.domain_name
  `;
}

/**
 * Delivery Timeline - issues with due dates and delay
 */
export function getDeliveryTimelineQuery(dateRange: DateRangeParams = {}): string {
  return `
    SELECT
      key as issue_key,
      summary,
      FORMAT_DATE('%Y-%m-%d', due_date) as due_date,
      FORMAT_TIMESTAMP('%Y-%m-%d', resolution_date) as resolved_date,
      CASE
        WHEN status_category = 'Done' AND resolution_date IS NOT NULL AND due_date IS NOT NULL
        THEN DATE_DIFF(DATE(resolution_date), due_date, DAY)
        WHEN status_category != 'Done' AND due_date IS NOT NULL AND due_date < CURRENT_DATE()
        THEN DATE_DIFF(CURRENT_DATE(), due_date, DAY)
        ELSE 0
      END as days_of_delay
    FROM ${ISSUES_TABLE}
    WHERE due_date IS NOT NULL
      AND ${getProductTimestampFilter(dateRange)}
    ORDER BY days_of_delay DESC
    LIMIT 50
  `;
}
