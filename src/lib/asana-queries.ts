/**
 * Asana BigQuery Queries
 *
 * Queries for the Product Tasks chapter:
 * - AI Task Board: bigquery-467404.asana.ai_task_board
 * - Bugs & DI Board: bigquery-467404.asana.bugs_di_board
 *
 * All queries target project: bigquery-467404, dataset: asana
 */

import { PRODUCT_PROJECT } from './bigquery';

export interface DateRangeParams {
  days?: number;
  startDate?: string;
  endDate?: string;
}

const ASANA_DATASET = 'asana';
const AI_TABLE = `\`${PRODUCT_PROJECT}.${ASANA_DATASET}.ai_task_board\``;
const BUGS_TABLE = `\`${PRODUCT_PROJECT}.${ASANA_DATASET}.bugs_di_board\``;

// ============================================================================
// DATE FILTER HELPERS
// ============================================================================

function getTimestampFilter(dateRange: DateRangeParams, col: string = 'created_at'): string {
  if (dateRange.startDate && dateRange.endDate) {
    return `${col} >= TIMESTAMP('${dateRange.startDate}') AND ${col} <= TIMESTAMP('${dateRange.endDate} 23:59:59')`;
  }
  const days = dateRange.days || 30;
  return `${col} >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))`;
}

function getPreviousTimestampFilter(dateRange: DateRangeParams, col: string = 'created_at'): string {
  if (dateRange.startDate && dateRange.endDate) {
    const rangeDays = Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / 86400000);
    const prevEnd = new Date(new Date(dateRange.startDate).getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - rangeDays * 86400000);
    return `${col} >= TIMESTAMP('${prevStart.toISOString().split('T')[0]}') AND ${col} <= TIMESTAMP('${prevEnd.toISOString().split('T')[0]} 23:59:59')`;
  }
  const days = dateRange.days || 30;
  return `${col} >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days * 2} DAY)) AND ${col} < TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))`;
}

// ============================================================================
// AI TASK BOARD QUERIES
// ============================================================================

/**
 * Board overview KPIs — counts by section + overdue + unassigned + avg business impact
 * Note: This queries ALL tasks (no date filter) for a snapshot of current board state.
 */
export function getAiTaskBoardOverviewQuery(): string {
  return `
    SELECT
      COUNT(*) as total_tasks,
      COUNTIF(section = 'In progress') as in_progress,
      COUNTIF(section = 'To do') as to_do,
      COUNTIF(section = 'Backlog') as backlog,
      COUNTIF(section = 'Done') as completed,
      COUNTIF(section != 'Done' AND due_on IS NOT NULL AND due_on < CURRENT_DATE()) as overdue,
      COUNTIF(assignee_name IS NULL AND section != 'Done') as unassigned,
      AVG(CASE WHEN section != 'Done' AND business_impact IS NOT NULL THEN business_impact END) as avg_business_impact
    FROM ${AI_TABLE}
  `;
}

/**
 * Previous period overview for trend calculation.
 * Uses synced_at to find the board state during the previous period.
 */
export function getPreviousAiTaskBoardOverviewQuery(dateRange: DateRangeParams = {}): string {
  const days = dateRange.days || 30;
  return `
    SELECT
      COUNT(*) as total_tasks,
      COUNTIF(section = 'Done') as completed,
      COUNTIF(section != 'Done' AND due_on IS NOT NULL AND due_on < DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)) as overdue
    FROM ${AI_TABLE}
    WHERE ${getPreviousTimestampFilter(dateRange, 'modified_at')}
  `;
}

/** Full task list for the table widget */
export function getAiTaskBoardTasksQuery(): string {
  return `
    SELECT
      gid,
      name,
      assignee_name,
      completed,
      section,
      CAST(due_on AS STRING) as due_on,
      CAST(start_on AS STRING) as start_on,
      FORMAT_TIMESTAMP('%Y-%m-%d', created_at) as created_at,
      FORMAT_TIMESTAMP('%Y-%m-%d', modified_at) as modified_at,
      permalink_url,
      business_impact,
      feature_type,
      estimated_days,
      aita_id,
      priority,
      task_status,
      CASE
        WHEN section != 'Done' AND due_on IS NOT NULL AND due_on < CURRENT_DATE()
        THEN DATE_DIFF(CURRENT_DATE(), due_on, DAY)
        ELSE NULL
      END as days_overdue
    FROM ${AI_TABLE}
    ORDER BY
      CASE section
        WHEN 'In progress' THEN 1
        WHEN 'To do' THEN 2
        WHEN 'Backlog' THEN 3
        WHEN 'Projects' THEN 4
        WHEN 'Done' THEN 5
        ELSE 6
      END,
      COALESCE(business_impact, 0) DESC
  `;
}

/** Team workload — tasks per assignee by status */
export function getAiTaskBoardTeamWorkloadQuery(): string {
  return `
    SELECT
      COALESCE(assignee_name, 'Unassigned') as assignee_name,
      COUNT(*) as total_tasks,
      COUNTIF(section = 'Done') as completed_tasks,
      COUNTIF(section = 'In progress') as in_progress_tasks,
      COUNTIF(section != 'Done' AND due_on IS NOT NULL AND due_on < CURRENT_DATE()) as overdue_tasks
    FROM ${AI_TABLE}
    GROUP BY assignee_name
    ORDER BY total_tasks DESC
  `;
}

/** Section breakdown — tasks per section */
export function getAiTaskBoardSectionBreakdownQuery(): string {
  return `
    SELECT
      section,
      COUNT(*) as count
    FROM ${AI_TABLE}
    GROUP BY section
    ORDER BY count DESC
  `;
}

/** Weekly trend — tasks created and completed per week */
export function getAiTaskBoardWeeklyTrendQuery(dateRange: DateRangeParams = {}): string {
  return `
    WITH created AS (
      SELECT
        FORMAT_DATE('%Y-%m-%d', DATE_TRUNC(DATE(created_at), WEEK)) as week,
        COUNT(*) as created
      FROM ${AI_TABLE}
      WHERE ${getTimestampFilter(dateRange, 'created_at')}
      GROUP BY week
    ),
    completed AS (
      SELECT
        FORMAT_DATE('%Y-%m-%d', DATE_TRUNC(DATE(completed_at), WEEK)) as week,
        COUNT(*) as completed
      FROM ${AI_TABLE}
      WHERE completed_at IS NOT NULL
        AND ${getTimestampFilter(dateRange, 'completed_at')}
      GROUP BY week
    )
    SELECT
      COALESCE(c.week, d.week) as week,
      COALESCE(c.created, 0) as created,
      COALESCE(d.completed, 0) as completed
    FROM created c
    FULL OUTER JOIN completed d ON c.week = d.week
    ORDER BY week
  `;
}

/** Task aging — bucket open tasks by age since creation */
export function getAiTaskBoardTaskAgingQuery(): string {
  return `
    SELECT
      CASE
        WHEN DATE_DIFF(CURRENT_DATE(), DATE(created_at), DAY) <= 7 THEN '0-7 days'
        WHEN DATE_DIFF(CURRENT_DATE(), DATE(created_at), DAY) <= 14 THEN '8-14 days'
        WHEN DATE_DIFF(CURRENT_DATE(), DATE(created_at), DAY) <= 30 THEN '15-30 days'
        WHEN DATE_DIFF(CURRENT_DATE(), DATE(created_at), DAY) <= 60 THEN '31-60 days'
        ELSE '60+ days'
      END as bucket,
      COUNT(*) as count
    FROM ${AI_TABLE}
    WHERE section != 'Done'
    GROUP BY bucket
    ORDER BY
      CASE bucket
        WHEN '0-7 days' THEN 1
        WHEN '8-14 days' THEN 2
        WHEN '15-30 days' THEN 3
        WHEN '31-60 days' THEN 4
        ELSE 5
      END
  `;
}

// ============================================================================
// BUGS & DI BOARD QUERIES
// ============================================================================

export function getBugsDiBoardOverviewQuery(): string {
  return `
    SELECT
      COUNT(*) as total_tasks,
      COUNTIF(section = 'In progress') as in_progress,
      COUNTIF(section = 'Open') as to_do,
      0 as backlog,
      COUNTIF(section = 'Done') as completed,
      COUNTIF(section != 'Done' AND due_on IS NOT NULL AND due_on < CURRENT_DATE()) as overdue,
      COUNTIF(assignee_name IS NULL AND section != 'Done') as unassigned,
      NULL as avg_business_impact
    FROM ${BUGS_TABLE}
  `;
}

export function getPreviousBugsDiBoardOverviewQuery(dateRange: DateRangeParams = {}): string {
  const days = dateRange.days || 30;
  return `
    SELECT
      COUNT(*) as total_tasks,
      COUNTIF(section = 'Done') as completed,
      COUNTIF(section != 'Done' AND due_on IS NOT NULL AND due_on < DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)) as overdue
    FROM ${BUGS_TABLE}
    WHERE ${getPreviousTimestampFilter(dateRange, 'modified_at')}
  `;
}

export function getBugsDiBoardTasksQuery(): string {
  return `
    SELECT
      gid,
      name,
      assignee_name,
      completed,
      section,
      CAST(due_on AS STRING) as due_on,
      FORMAT_TIMESTAMP('%Y-%m-%d', created_at) as created_at,
      FORMAT_TIMESTAMP('%Y-%m-%d', modified_at) as modified_at,
      permalink_url,
      type,
      resolution,
      origin,
      reporter,
      module,
      bug_priority,
      user_mistake,
      is_recurrent,
      labels,
      CASE
        WHEN section != 'Done' AND due_on IS NOT NULL AND due_on < CURRENT_DATE()
        THEN DATE_DIFF(CURRENT_DATE(), due_on, DAY)
        ELSE NULL
      END as days_overdue
    FROM ${BUGS_TABLE}
    ORDER BY
      CASE section
        WHEN 'In progress' THEN 1
        WHEN 'Open' THEN 2
        WHEN 'Done' THEN 3
        ELSE 4
      END,
      modified_at DESC
  `;
}

export function getBugsDiBoardTeamWorkloadQuery(): string {
  return `
    SELECT
      COALESCE(assignee_name, 'Unassigned') as assignee_name,
      COUNT(*) as total_tasks,
      COUNTIF(section = 'Done') as completed_tasks,
      COUNTIF(section = 'In progress') as in_progress_tasks,
      COUNTIF(section != 'Done' AND due_on IS NOT NULL AND due_on < CURRENT_DATE()) as overdue_tasks
    FROM ${BUGS_TABLE}
    GROUP BY assignee_name
    ORDER BY total_tasks DESC
  `;
}

export function getBugsDiBoardSectionBreakdownQuery(): string {
  return `
    SELECT section, COUNT(*) as count
    FROM ${BUGS_TABLE}
    GROUP BY section
    ORDER BY count DESC
  `;
}

export function getBugsDiBoardWeeklyTrendQuery(dateRange: DateRangeParams = {}): string {
  return `
    WITH created AS (
      SELECT
        FORMAT_DATE('%Y-%m-%d', DATE_TRUNC(DATE(created_at), WEEK)) as week,
        COUNT(*) as created
      FROM ${BUGS_TABLE}
      WHERE ${getTimestampFilter(dateRange, 'created_at')}
      GROUP BY week
    ),
    completed AS (
      SELECT
        FORMAT_DATE('%Y-%m-%d', DATE_TRUNC(DATE(completed_at), WEEK)) as week,
        COUNT(*) as completed
      FROM ${BUGS_TABLE}
      WHERE completed_at IS NOT NULL
        AND ${getTimestampFilter(dateRange, 'completed_at')}
      GROUP BY week
    )
    SELECT
      COALESCE(c.week, d.week) as week,
      COALESCE(c.created, 0) as created,
      COALESCE(d.completed, 0) as completed
    FROM created c
    FULL OUTER JOIN completed d ON c.week = d.week
    ORDER BY week
  `;
}

export function getBugsDiBoardTaskAgingQuery(): string {
  return `
    SELECT
      CASE
        WHEN DATE_DIFF(CURRENT_DATE(), DATE(created_at), DAY) <= 7 THEN '0-7 days'
        WHEN DATE_DIFF(CURRENT_DATE(), DATE(created_at), DAY) <= 14 THEN '8-14 days'
        WHEN DATE_DIFF(CURRENT_DATE(), DATE(created_at), DAY) <= 30 THEN '15-30 days'
        WHEN DATE_DIFF(CURRENT_DATE(), DATE(created_at), DAY) <= 60 THEN '31-60 days'
        ELSE '60+ days'
      END as bucket,
      COUNT(*) as count
    FROM ${BUGS_TABLE}
    WHERE section != 'Done'
    GROUP BY bucket
    ORDER BY
      CASE bucket
        WHEN '0-7 days' THEN 1
        WHEN '8-14 days' THEN 2
        WHEN '15-30 days' THEN 3
        WHEN '31-60 days' THEN 4
        ELSE 5
      END
  `;
}

/** Bugs by type (Bug, Data inquiry, etc.) */
export function getBugsByTypeQuery(): string {
  return `
    SELECT COALESCE(type, 'Unknown') as type, COUNT(*) as count
    FROM ${BUGS_TABLE}
    GROUP BY type
    ORDER BY count DESC
  `;
}

/** Bugs by module */
export function getBugsByModuleQuery(): string {
  return `
    SELECT COALESCE(module, 'Unknown') as module, COUNT(*) as count
    FROM ${BUGS_TABLE}
    WHERE module IS NOT NULL AND module != ''
    GROUP BY module
    ORDER BY count DESC
    LIMIT 15
  `;
}

/** Bugs by origin */
export function getBugsByOriginQuery(): string {
  return `
    SELECT COALESCE(origin, 'Unknown') as origin, COUNT(*) as count
    FROM ${BUGS_TABLE}
    WHERE origin IS NOT NULL AND origin != ''
    GROUP BY origin
    ORDER BY count DESC
  `;
}

// ============================================================================
// WEEKLY REPORT QUERIES
// ============================================================================

const SUGGESTIONS_TABLE = `\`${PRODUCT_PROJECT}.asana.tasks_unique\``;

function weeklyRangeFilter(col: string, days: number, startDate?: string, endDate?: string): string {
  if (startDate && endDate) {
    return `${col} >= TIMESTAMP('${startDate}') AND ${col} <= TIMESTAMP('${endDate} 23:59:59')`;
  }
  return `${col} >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))`;
}

/** Deliverables completed in the selected period from the AI Task Board */
export function getWeeklyDeliverablesQuery(days: number = 7, startDate?: string, endDate?: string): string {
  return `
    SELECT
      gid,
      name,
      COALESCE(assignee_name, 'Unassigned') as assignee_name,
      business_impact,
      FORMAT_TIMESTAMP('%Y-%m-%d', completed_at) as completed_at,
      feature_type
    FROM ${AI_TABLE}
    WHERE ${weeklyRangeFilter('completed_at', days, startDate, endDate)}
      AND section = 'Done'
    ORDER BY COALESCE(business_impact, 0) DESC, completed_at DESC
  `;
}

/** Bug status summary for the weekly report */
export function getWeeklyBugStatusQuery(days: number = 7, startDate?: string, endDate?: string): string {
  const rangeFilter = weeklyRangeFilter('created_at', days, startDate, endDate);
  const closedFilter = weeklyRangeFilter('completed_at', days, startDate, endDate);
  return `
    SELECT
      COUNTIF(${rangeFilter}) as reported_this_week,
      COUNTIF(${closedFilter} AND section = 'Done') as closed_this_week,
      COUNTIF(section != 'Done') as open,
      COUNTIF((${rangeFilter}) AND origin = 'Clients') as customer_reported,
      COUNTIF((${rangeFilter}) AND origin = 'Internal User') as internal_product
    FROM ${BUGS_TABLE}
    WHERE type = 'Bug'
      AND (resolution IS NULL OR resolution = '')
      AND origin IN ('Clients', 'Internal User')
  `;
}

/** Critical bugs (High + Highest priority) summary */
export function getWeeklyCriticalBugsQuery(days: number = 7, startDate?: string, endDate?: string): string {
  const rangeFilter = weeklyRangeFilter('created_at', days, startDate, endDate);
  const closedFilter = weeklyRangeFilter('completed_at', days, startDate, endDate);
  return `
    SELECT
      COUNTIF(${rangeFilter}) as reported_this_week,
      COUNTIF(${closedFilter} AND section = 'Done') as closed_this_week,
      COUNTIF(section != 'Done') as open
    FROM ${BUGS_TABLE}
    WHERE type = 'Bug'
      AND bug_priority IN ('High', 'Highest')
      AND origin IN ('Clients', 'Internal User')
  `;
}

/** Data inquiries summary */
export function getWeeklyDataInquiriesQuery(days: number = 7, startDate?: string, endDate?: string): string {
  return `
    SELECT
      COUNTIF(${weeklyRangeFilter('created_at', days, startDate, endDate)}) as reported_this_week,
      COUNTIF(section != 'Done') as open
    FROM ${BUGS_TABLE}
    WHERE type = 'Data inquiry'
  `;
}

/** Suggestions board summary — deduplicates by gid since tasks appear once per project membership */
export function getWeeklySuggestionsQuery(days: number = 7, startDate?: string, endDate?: string): string {
  const SUGGESTIONS_TASKS = `\`${PRODUCT_PROJECT}.asana.tasks\``;
  const createdFilter = weeklyRangeFilter('created_at', days, startDate, endDate);
  const completedFilter = weeklyRangeFilter('completed_at', days, startDate, endDate);
  return `
    WITH suggestions AS (
      SELECT DISTINCT gid, section, created_at, completed, completed_at
      FROM ${SUGGESTIONS_TASKS}
      WHERE project_name LIKE '%Suggestions Board%'
    )
    SELECT
      COUNTIF((completed IS NULL OR completed = false) AND (${createdFilter})) as new_this_week,
      COUNTIF((completed IS NULL OR completed = false) AND TRIM(section) LIKE '%Under Review%') as under_review,
      COUNTIF((completed IS NULL OR completed = false) AND TRIM(section) LIKE '%In Progress%') as in_execution,
      COUNTIF((completed IS NULL OR completed = false) AND TRIM(section) LIKE '%In Backlog%') as in_backlog,
      COUNTIF(TRIM(section) LIKE '%Implemented%' AND completed = true AND (${completedFilter})) as delivered
    FROM suggestions
  `;
}
