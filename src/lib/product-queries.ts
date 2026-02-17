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

const TABLE = `\`${PRODUCT_PROJECT}.${PRODUCT_DATASET}.feedback_clients_unique\``;
const JIRA_DATASET = 'jira';

// ============================================================================
// CLIENT DOMAINS QUERIES
// ============================================================================

/**
 * Domain Activity Overview - KPI summary
 * Returns: total domains, properties, leads, appointments, deals, revenue
 */
export function getDomainActivityOverviewQuery(days: number): string {
  return `
    SELECT
      COUNT(DISTINCT domain_name) as total_active_domains,
      COUNT(*) as total_properties,
      COUNTIF(LOWER(record_type) = 'lead') as leads_count,
      COUNTIF(LOWER(record_type) = 'appointment') as appointments_count,
      COUNTIF(LOWER(record_type) = 'deal') as deals_count,
      COALESCE(SUM(revenue), 0) as total_revenue
    FROM ${TABLE}
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
  `;
}

/**
 * Previous period overview for trend calculation
 */
export function getPreviousDomainOverviewQuery(days: number): string {
  return `
    SELECT
      COUNT(DISTINCT domain_name) as prev_total_active_domains,
      COUNT(*) as prev_total_properties,
      COUNTIF(LOWER(record_type) = 'lead') as prev_leads_count,
      COALESCE(SUM(revenue), 0) as prev_total_revenue
    FROM ${TABLE}
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days * 2} DAY)
      AND date < DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
  `;
}

/**
 * Domain Leaderboard - ranked by activity
 * Includes risk_level based on days since last activity
 */
export function getDomainLeaderboardQuery(days: number): string {
  return `
    SELECT
      domain_name,
      COUNT(*) as total_properties,
      COUNTIF(LOWER(record_type) = 'lead') as leads_count,
      COUNTIF(LOWER(record_type) = 'appointment') as appointments_count,
      COUNTIF(LOWER(record_type) = 'deal') as deals_count,
      COALESCE(SUM(revenue), 0) as total_revenue,
      FORMAT_DATE('%Y-%m-%d', MAX(date)) as last_activity_date,
      DATE_DIFF(CURRENT_DATE(), MAX(date), DAY) as days_since_activity,
      CASE
        WHEN DATE_DIFF(CURRENT_DATE(), MAX(date), DAY) <= 7 THEN 'healthy'
        WHEN DATE_DIFF(CURRENT_DATE(), MAX(date), DAY) <= 30 THEN 'at-risk'
        ELSE 'inactive'
      END as risk_level
    FROM ${TABLE}
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
    GROUP BY domain_name
    ORDER BY total_properties DESC
    LIMIT 50
  `;
}

/**
 * Domain Activity Trend - properties uploaded per day
 */
export function getDomainActivityTrendQuery(days: number): string {
  return `
    SELECT
      FORMAT_DATE('%Y-%m-%d', date) as date,
      COUNT(*) as properties_uploaded,
      COUNT(DISTINCT domain_name) as domain_count
    FROM ${TABLE}
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
    GROUP BY date
    ORDER BY date ASC
  `;
}

/**
 * Revenue by Domain - top 20 domains by revenue
 */
export function getRevenueByDomainQuery(days: number): string {
  return `
    SELECT
      domain_name,
      COALESCE(SUM(revenue), 0) as revenue
    FROM ${TABLE}
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
      AND revenue IS NOT NULL
      AND revenue > 0
    GROUP BY domain_name
    ORDER BY revenue DESC
    LIMIT 20
  `;
}

/**
 * Flagged Domains - domains with flag issues
 */
export function getFlaggedDomainsQuery(days: number): string {
  return `
    SELECT
      domain_id,
      domain_name,
      flag,
      flag_info,
      FORMAT_DATE('%Y-%m-%d', date) as date
    FROM ${TABLE}
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
      AND flag IS NOT NULL
      AND TRIM(flag) != ''
    ORDER BY date DESC
    LIMIT 100
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
export function getProjectStatusOverviewQuery(days: number): string {
  return `
    SELECT
      COUNTIF(status_category IN ('To Do', 'In Progress')) as active_projects,
      COUNTIF(status_category = 'In Progress') as on_track,
      COUNTIF(status_category IN ('To Do', 'In Progress') AND due_date IS NOT NULL AND due_date < CURRENT_DATE()) as delayed,
      COUNTIF(status_category = 'Done' AND updated >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))) as completed
    FROM ${ISSUES_TABLE}
    WHERE issue_type = 'Epic'
  `;
}

/**
 * Projects Table - Epics with progress and delay info
 */
export function getProjectsTableQuery(days: number): string {
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
             OR (e.status_category = 'Done' AND e.updated >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))))
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
export function getBugTrackingOverviewQuery(days: number): string {
  return `
    SELECT
      COUNT(*) as total_unique_bugs,
      COUNTIF(origin = 'Clients') as customer_bugs,
      COUNTIF(priority IN ('Highest', 'High')) as critical_bugs,
      COUNTIF(priority IN ('Highest', 'High') AND status_category != 'Done') as critical_open_bugs
    FROM ${BUGS_TABLE}
    WHERE created >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
  `;
}

/**
 * Bug Origins - count by origin source
 */
export function getBugOriginsQuery(days: number): string {
  return `
    SELECT
      COALESCE(origin, 'Unknown') as origin,
      COUNT(*) as count
    FROM ${BUGS_TABLE}
    WHERE created >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
    GROUP BY origin
    ORDER BY count DESC
  `;
}

/**
 * Weekly Bug Trend - bugs created per week
 */
export function getWeeklyBugTrendQuery(days: number): string {
  return `
    SELECT
      FORMAT_DATE('%Y-W%V', created) as week,
      COUNT(*) as count
    FROM ${BUGS_TABLE}
    WHERE created >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
    GROUP BY week
    ORDER BY week ASC
  `;
}

/**
 * Team Workload - tasks per assignee with status breakdown
 */
export function getTeamWorkloadQuery(days: number): string {
  return `
    SELECT
      COALESCE(assignee_name, 'Unassigned') as assignee,
      COUNT(*) as total_tasks,
      COUNTIF(status_category = 'Done') as completed_tasks,
      COUNTIF(status_category = 'In Progress') as in_progress_tasks,
      COUNTIF(status_category != 'Done' AND due_date IS NOT NULL AND due_date < CURRENT_DATE()) as delayed_tasks
    FROM ${ISSUES_TABLE}
    WHERE updated >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
      AND issue_type NOT IN ('Epic')
    GROUP BY assignee_name
    ORDER BY total_tasks DESC
    LIMIT 30
  `;
}

/**
 * Delivery Timeline - issues with due dates and delay
 */
export function getDeliveryTimelineQuery(days: number): string {
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
      AND updated >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
    ORDER BY days_of_delay DESC
    LIMIT 50
  `;
}
