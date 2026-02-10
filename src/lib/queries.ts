import { PROJECT, DATASET } from './bigquery';

const TABLE = `\`${PROJECT}.${DATASET}.events_*\``;

export type UserType = 'all' | 'internal' | 'external';

export function getDateFilter(days: number = 30): string {
  return `_TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))`;
}

/**
 * Returns a SQL filter for a specific date range (for previous period comparison).
 * Example: getPreviousPeriodDateFilter(30) returns filter for days 31-60 ago
 */
export function getPreviousPeriodDateFilter(days: number = 30): string {
  return `_TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days * 2} DAY))
    AND _TABLE_SUFFIX < FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))`;
}

/**
 * Returns a SQL filter for internal/external users based on the user_affiliation property.
 *
 * IMPORTANT: A user might arrive unauthenticated then log in during the same session.
 * We must use the LAST (most recent) user_affiliation value per session to correctly
 * identify whether a user is internal or external.
 *
 * The main 8020REI platform sends a user_affiliation property with GA4 events:
 * - 'internal': Users with @8020rei.com email addresses (company employees)
 * - 'external': Users with other email domains (clients)
 * - Empty/null: Unauthenticated/anonymous users
 *
 * In GA4 BigQuery, user properties are stored in the user_properties array.
 */
export function getUserTypeFilter(userType: UserType): string {
  if (userType === 'all') {
    return '1=1'; // No filter
  }

  if (userType === 'internal') {
    // Internal: last user_affiliation in session = 'internal'
    return `(
      SELECT value.string_value
      FROM UNNEST(user_properties)
      WHERE key = 'user_affiliation'
    ) = 'internal'`;
  }

  // External: last user_affiliation in session = 'external'
  return `(
    SELECT value.string_value
    FROM UNNEST(user_properties)
    WHERE key = 'user_affiliation'
  ) = 'external'`;
}

/**
 * Helper function to get the last user_affiliation per session.
 * This creates a subquery that finds the most recent user_affiliation value
 * for each user_pseudo_id (session identifier).
 */
export function getSessionAffiliationSubquery(): string {
  return `
    SELECT
      user_pseudo_id,
      LAST_VALUE(
        (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
        IGNORE NULLS
      ) OVER (
        PARTITION BY user_pseudo_id
        ORDER BY event_timestamp
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
      ) as final_affiliation
    FROM ${TABLE}
  `;
}

export function getMetricsQuery(days: number, userType: UserType = 'all'): string {
  // For 'all' users, we can use a simple query
  if (userType === 'all') {
    return `
      SELECT
        COUNT(DISTINCT user_pseudo_id) as total_users,
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views,
        COUNT(DISTINCT
          REGEXP_EXTRACT(
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
            r'https://([^.]+)\\.8020rei\\.com'
          )
        ) as active_clients
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    `;
  }

  // For internal/external filtering, we need to get the LAST affiliation per session
  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COUNT(DISTINCT e.user_pseudo_id) as total_users,
      COUNT(*) as total_events,
      COUNT(CASE WHEN e.event_name = 'page_view' THEN 1 END) as page_views,
      COUNT(DISTINCT
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        )
      ) as active_clients
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
  `;
}

export function getUsersByDayQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        event_date,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY event_date
      ORDER BY event_date
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      e.event_date,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY e.event_date
    ORDER BY e.event_date
  `;
}

export function getFeatureUsageQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        CASE
          WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
          WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
          WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
          WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
          WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
          WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
          WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
          WHEN REGEXP_CONTAINS(page_url, '/session/login') THEN 'Login'
          ELSE 'Other'
        END as feature,
        COUNT(*) as views
      FROM (
        SELECT
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
          AND event_name = 'page_view'
      )
      WHERE page_url IS NOT NULL
      GROUP BY feature
      HAVING feature != 'Other'
      ORDER BY views DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      CASE
        WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
        WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
        WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
        WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
        WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
        WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
        WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
        WHEN REGEXP_CONTAINS(page_url, '/session/login') THEN 'Login'
        ELSE 'Other'
      END as feature,
      COUNT(*) as views
    FROM (
      SELECT
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location') as page_url
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
        AND e.event_name = 'page_view'
    )
    WHERE page_url IS NOT NULL
    GROUP BY feature
    HAVING feature != 'Other'
    ORDER BY views DESC
  `;
}

export function getTopClientsQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        ) as client,
        COUNT(*) as events,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY client
      HAVING client IS NOT NULL
      ORDER BY events DESC
      LIMIT 50
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      REGEXP_EXTRACT(
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
        r'https://([^.]+)\\.8020rei\\.com'
      ) as client,
      COUNT(*) as events,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(CASE WHEN e.event_name = 'page_view' THEN 1 END) as page_views
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY client
    HAVING client IS NOT NULL
    ORDER BY events DESC
    LIMIT 50
  `;
}

// ============================================
// USERS CHAPTER QUERIES
// ============================================

/**
 * Get DAU, WAU, MAU (Daily/Weekly/Monthly Active Users)
 * Uses distinct user_pseudo_id counts over different time windows.
 */
export function getUserActivityMetricsQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COUNT(DISTINCT CASE
          WHEN _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
          THEN user_pseudo_id END) as dau,
        COUNT(DISTINCT CASE
          WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
          THEN user_pseudo_id END) as wau,
        COUNT(DISTINCT CASE
          WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
          THEN user_pseudo_id END) as mau
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COUNT(DISTINCT CASE
        WHEN e._TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
        THEN e.user_pseudo_id END) as dau,
      COUNT(DISTINCT CASE
        WHEN e._TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
        THEN e.user_pseudo_id END) as wau,
      COUNT(DISTINCT CASE
        WHEN e._TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
        THEN e.user_pseudo_id END) as mau
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
  `;
}

/**
 * Get New vs Returning users per day
 * New users are identified by the 'first_visit' event.
 */
export function getNewVsReturningUsersQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        event_date,
        COUNT(DISTINCT CASE WHEN event_name = 'first_visit' THEN user_pseudo_id END) as new_users,
        COUNT(DISTINCT user_pseudo_id) - COUNT(DISTINCT CASE WHEN event_name = 'first_visit' THEN user_pseudo_id END) as returning_users
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY event_date
      ORDER BY event_date
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      e.event_date,
      COUNT(DISTINCT CASE WHEN e.event_name = 'first_visit' THEN e.user_pseudo_id END) as new_users,
      COUNT(DISTINCT e.user_pseudo_id) - COUNT(DISTINCT CASE WHEN e.event_name = 'first_visit' THEN e.user_pseudo_id END) as returning_users
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY e.event_date
    ORDER BY e.event_date
  `;
}

/**
 * Get engagement metrics:
 * - Total sessions
 * - Engaged sessions (session_engaged = 1)
 * - Average engagement time (from engagement_time_msec)
 * - Sessions per user
 * - Bounce rate (1 - engaged rate)
 */
export function getEngagementMetricsQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH session_data AS (
        SELECT
          user_pseudo_id,
          (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') as session_id,
          MAX(CASE WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'session_engaged') = 1 THEN 1 ELSE 0 END) as is_engaged,
          SUM(CASE WHEN event_name = 'user_engagement'
            THEN COALESCE((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec'), 0)
            ELSE 0 END) as engagement_time_ms
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
        GROUP BY user_pseudo_id, session_id
      )
      SELECT
        COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))) as total_sessions,
        COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END) as engaged_sessions,
        ROUND(AVG(engagement_time_ms) / 1000, 1) as avg_engagement_time_sec,
        COUNT(DISTINCT user_pseudo_id) as unique_users,
        ROUND(SAFE_DIVIDE(COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))), COUNT(DISTINCT user_pseudo_id)), 2) as sessions_per_user,
        ROUND(SAFE_DIVIDE(
          COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END),
          COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))
        ) * 100, 1) as engaged_rate,
        ROUND((1 - SAFE_DIVIDE(
          COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END),
          COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))
        )) * 100, 1) as bounce_rate
      FROM session_data
      WHERE session_id IS NOT NULL
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    session_data AS (
      SELECT
        e.user_pseudo_id,
        (SELECT value.int_value FROM UNNEST(e.event_params) WHERE key = 'ga_session_id') as session_id,
        MAX(CASE WHEN (SELECT value.int_value FROM UNNEST(e.event_params) WHERE key = 'session_engaged') = 1 THEN 1 ELSE 0 END) as is_engaged,
        SUM(CASE WHEN e.event_name = 'user_engagement'
          THEN COALESCE((SELECT value.int_value FROM UNNEST(e.event_params) WHERE key = 'engagement_time_msec'), 0)
          ELSE 0 END) as engagement_time_ms
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
      GROUP BY e.user_pseudo_id, session_id
    )
    SELECT
      COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))) as total_sessions,
      COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END) as engaged_sessions,
      ROUND(AVG(engagement_time_ms) / 1000, 1) as avg_engagement_time_sec,
      COUNT(DISTINCT user_pseudo_id) as unique_users,
      ROUND(SAFE_DIVIDE(COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))), COUNT(DISTINCT user_pseudo_id)), 2) as sessions_per_user,
      ROUND(SAFE_DIVIDE(
        COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END),
        COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))
      ) * 100, 1) as engaged_rate,
      ROUND((1 - SAFE_DIVIDE(
        COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END),
        COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))
      )) * 100, 1) as bounce_rate
    FROM session_data
    WHERE session_id IS NOT NULL
  `;
}

/**
 * Get previous period user activity metrics for trend calculation.
 * Compares: DAU (2 days ago), WAU (days 8-14), MAU (days 31-60)
 */
export function getPreviousUserActivityMetricsQuery(userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COUNT(DISTINCT CASE
          WHEN _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY))
          THEN user_pseudo_id END) as prev_dau,
        COUNT(DISTINCT CASE
          WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
          AND _TABLE_SUFFIX < FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
          THEN user_pseudo_id END) as prev_wau,
        COUNT(DISTINCT CASE
          WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY))
          AND _TABLE_SUFFIX < FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
          THEN user_pseudo_id END) as prev_mau
      FROM ${TABLE}
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY))
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        _TABLE_SUFFIX as table_suffix,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY))
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id, table_suffix
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COUNT(DISTINCT CASE
        WHEN table_suffix = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY))
        THEN user_pseudo_id END) as prev_dau,
      COUNT(DISTINCT CASE
        WHEN table_suffix >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
        AND table_suffix < FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
        THEN user_pseudo_id END) as prev_wau,
      COUNT(DISTINCT CASE
        WHEN table_suffix >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY))
        AND table_suffix < FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
        THEN user_pseudo_id END) as prev_mau
    FROM filtered_sessions
  `;
}

/**
 * Get previous period engagement metrics for trend calculation.
 */
export function getPreviousEngagementMetricsQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH session_data AS (
        SELECT
          user_pseudo_id,
          (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') as session_id,
          MAX(CASE WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'session_engaged') = 1 THEN 1 ELSE 0 END) as is_engaged,
          SUM(CASE WHEN event_name = 'user_engagement'
            THEN COALESCE((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec'), 0)
            ELSE 0 END) as engagement_time_ms
        FROM ${TABLE}
        WHERE ${getPreviousPeriodDateFilter(days)}
        GROUP BY user_pseudo_id, session_id
      )
      SELECT
        COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))) as prev_total_sessions,
        COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END) as prev_engaged_sessions,
        ROUND(AVG(engagement_time_ms) / 1000, 1) as prev_avg_engagement_time_sec,
        COUNT(DISTINCT user_pseudo_id) as prev_unique_users,
        ROUND(SAFE_DIVIDE(COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))), COUNT(DISTINCT user_pseudo_id)), 2) as prev_sessions_per_user,
        ROUND(SAFE_DIVIDE(
          COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END),
          COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))
        ) * 100, 1) as prev_engaged_rate,
        ROUND((1 - SAFE_DIVIDE(
          COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END),
          COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))
        )) * 100, 1) as prev_bounce_rate
      FROM session_data
      WHERE session_id IS NOT NULL
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    session_data AS (
      SELECT
        e.user_pseudo_id,
        (SELECT value.int_value FROM UNNEST(e.event_params) WHERE key = 'ga_session_id') as session_id,
        MAX(CASE WHEN (SELECT value.int_value FROM UNNEST(e.event_params) WHERE key = 'session_engaged') = 1 THEN 1 ELSE 0 END) as is_engaged,
        SUM(CASE WHEN e.event_name = 'user_engagement'
          THEN COALESCE((SELECT value.int_value FROM UNNEST(e.event_params) WHERE key = 'engagement_time_msec'), 0)
          ELSE 0 END) as engagement_time_ms
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getPreviousPeriodDateFilter(days)}
      GROUP BY e.user_pseudo_id, session_id
    )
    SELECT
      COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))) as prev_total_sessions,
      COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END) as prev_engaged_sessions,
      ROUND(AVG(engagement_time_ms) / 1000, 1) as prev_avg_engagement_time_sec,
      COUNT(DISTINCT user_pseudo_id) as prev_unique_users,
      ROUND(SAFE_DIVIDE(COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))), COUNT(DISTINCT user_pseudo_id)), 2) as prev_sessions_per_user,
      ROUND(SAFE_DIVIDE(
        COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END),
        COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))
      ) * 100, 1) as prev_engaged_rate,
      ROUND((1 - SAFE_DIVIDE(
        COUNT(DISTINCT CASE WHEN is_engaged = 1 THEN CONCAT(user_pseudo_id, CAST(session_id AS STRING)) END),
        COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))
      )) * 100, 1) as prev_bounce_rate
    FROM session_data
    WHERE session_id IS NOT NULL
  `;
}

// ============================================
// FEATURES CHAPTER QUERIES
// ============================================

/**
 * Get views per feature (horizontal bar chart data).
 * Groups page views by feature based on URL patterns.
 */
export function getFeatureViewsQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        CASE
          WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
          WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
          WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
          WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
          WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
          WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
          WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
          WHEN REGEXP_CONTAINS(page_url, '/session/login') THEN 'Login'
          WHEN REGEXP_CONTAINS(page_url, '/skip-trace') THEN 'Skip Trace'
          WHEN REGEXP_CONTAINS(page_url, '/rapid-response') THEN 'Rapid Response'
          WHEN REGEXP_CONTAINS(page_url, '/buyers-list') THEN 'Buyers List'
          WHEN REGEXP_CONTAINS(page_url, '/reports') THEN 'Reports'
          ELSE 'Other'
        END as feature,
        COUNT(*) as views,
        COUNT(DISTINCT user_pseudo_id) as unique_users
      FROM (
        SELECT
          user_pseudo_id,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
          AND event_name = 'page_view'
      )
      WHERE page_url IS NOT NULL
      GROUP BY feature
      HAVING feature != 'Other'
      ORDER BY views DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      CASE
        WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
        WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
        WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
        WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
        WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
        WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
        WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
        WHEN REGEXP_CONTAINS(page_url, '/session/login') THEN 'Login'
        WHEN REGEXP_CONTAINS(page_url, '/skip-trace') THEN 'Skip Trace'
        WHEN REGEXP_CONTAINS(page_url, '/rapid-response') THEN 'Rapid Response'
        WHEN REGEXP_CONTAINS(page_url, '/buyers-list') THEN 'Buyers List'
        WHEN REGEXP_CONTAINS(page_url, '/reports') THEN 'Reports'
        ELSE 'Other'
      END as feature,
      COUNT(*) as views,
      COUNT(DISTINCT e.user_pseudo_id) as unique_users
    FROM (
      SELECT
        e.user_pseudo_id,
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location') as page_url
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
        AND e.event_name = 'page_view'
    ) e
    WHERE page_url IS NOT NULL
    GROUP BY feature
    HAVING feature != 'Other'
    ORDER BY views DESC
  `;
}

/**
 * Get feature adoption rate (% of clients that use each feature).
 * Shows how many clients have accessed each feature.
 */
export function getFeatureAdoptionQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH total_clients AS (
        SELECT COUNT(DISTINCT REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        )) as total
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
          AND event_name = 'page_view'
      ),
      feature_clients AS (
        SELECT
          CASE
            WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
            WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
            WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
            WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
            WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
            WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
            WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
            WHEN REGEXP_CONTAINS(page_url, '/skip-trace') THEN 'Skip Trace'
            WHEN REGEXP_CONTAINS(page_url, '/rapid-response') THEN 'Rapid Response'
            WHEN REGEXP_CONTAINS(page_url, '/buyers-list') THEN 'Buyers List'
            WHEN REGEXP_CONTAINS(page_url, '/reports') THEN 'Reports'
            ELSE 'Other'
          END as feature,
          COUNT(DISTINCT REGEXP_EXTRACT(page_url, r'https://([^.]+)\\.8020rei\\.com')) as clients_using
        FROM (
          SELECT (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
          FROM ${TABLE}
          WHERE ${getDateFilter(days)}
            AND event_name = 'page_view'
        )
        WHERE page_url IS NOT NULL
        GROUP BY feature
      )
      SELECT
        feature,
        clients_using,
        ROUND(clients_using * 100.0 / NULLIF(total, 0), 1) as adoption_pct
      FROM feature_clients, total_clients
      WHERE feature != 'Other' AND feature != 'Login'
      ORDER BY clients_using DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    total_clients AS (
      SELECT COUNT(DISTINCT REGEXP_EXTRACT(
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
        r'https://([^.]+)\\.8020rei\\.com'
      )) as total
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
        AND e.event_name = 'page_view'
    ),
    feature_clients AS (
      SELECT
        CASE
          WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
          WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
          WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
          WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
          WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
          WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
          WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
          WHEN REGEXP_CONTAINS(page_url, '/skip-trace') THEN 'Skip Trace'
          WHEN REGEXP_CONTAINS(page_url, '/rapid-response') THEN 'Rapid Response'
          WHEN REGEXP_CONTAINS(page_url, '/buyers-list') THEN 'Buyers List'
          WHEN REGEXP_CONTAINS(page_url, '/reports') THEN 'Reports'
          ELSE 'Other'
        END as feature,
        COUNT(DISTINCT REGEXP_EXTRACT(page_url, r'https://([^.]+)\\.8020rei\\.com')) as clients_using
      FROM (
        SELECT (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location') as page_url
        FROM ${TABLE} e
        INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
        WHERE ${getDateFilter(days)}
          AND e.event_name = 'page_view'
      )
      WHERE page_url IS NOT NULL
      GROUP BY feature
    )
    SELECT
      feature,
      clients_using,
      ROUND(clients_using * 100.0 / NULLIF(total, 0), 1) as adoption_pct
    FROM feature_clients, total_clients
    WHERE feature != 'Other' AND feature != 'Login'
    ORDER BY clients_using DESC
  `;
}

/**
 * Get feature trend over time (for multi-line chart).
 * Returns daily views per feature.
 */
export function getFeatureTrendQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        event_date,
        CASE
          WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
          WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
          WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
          WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
          WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
          ELSE 'Other'
        END as feature,
        COUNT(*) as views
      FROM (
        SELECT
          event_date,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
          AND event_name = 'page_view'
      )
      WHERE page_url IS NOT NULL
      GROUP BY event_date, feature
      HAVING feature != 'Other'
      ORDER BY event_date, views DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      event_date,
      CASE
        WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
        WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
        WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
        WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
        WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
        ELSE 'Other'
      END as feature,
      COUNT(*) as views
    FROM (
      SELECT
        e.event_date,
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location') as page_url
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
        AND e.event_name = 'page_view'
    )
    WHERE page_url IS NOT NULL
    GROUP BY event_date, feature
    HAVING feature != 'Other'
    ORDER BY event_date, views DESC
  `;
}

/**
 * Get top 20 pages by views.
 * Returns the most viewed page URLs.
 */
export function getTopPagesQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        page_url,
        REGEXP_EXTRACT(page_url, r'https://([^.]+)\\.8020rei\\.com') as client,
        REGEXP_EXTRACT(page_url, r'https://[^/]+(/[^?#]*)') as path,
        COUNT(*) as views,
        COUNT(DISTINCT user_pseudo_id) as unique_users
      FROM (
        SELECT
          user_pseudo_id,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
          AND event_name = 'page_view'
      )
      WHERE page_url IS NOT NULL
        AND REGEXP_CONTAINS(page_url, r'8020rei\\.com')
      GROUP BY page_url, client, path
      ORDER BY views DESC
      LIMIT 20
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      page_url,
      REGEXP_EXTRACT(page_url, r'https://([^.]+)\\.8020rei\\.com') as client,
      REGEXP_EXTRACT(page_url, r'https://[^/]+(/[^?#]*)') as path,
      COUNT(*) as views,
      COUNT(DISTINCT e.user_pseudo_id) as unique_users
    FROM (
      SELECT
        e.user_pseudo_id,
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location') as page_url
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
        AND e.event_name = 'page_view'
    ) e
    WHERE page_url IS NOT NULL
      AND REGEXP_CONTAINS(page_url, r'8020rei\\.com')
    GROUP BY page_url, client, path
    ORDER BY views DESC
    LIMIT 20
  `;
}

/**
 * Get previous period feature views for trend comparison.
 */
export function getPreviousFeatureViewsQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        CASE
          WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
          WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
          WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
          WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
          WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
          WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
          WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
          WHEN REGEXP_CONTAINS(page_url, '/session/login') THEN 'Login'
          ELSE 'Other'
        END as feature,
        COUNT(*) as views
      FROM (
        SELECT
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
        FROM ${TABLE}
        WHERE ${getPreviousPeriodDateFilter(days)}
          AND event_name = 'page_view'
      )
      WHERE page_url IS NOT NULL
      GROUP BY feature
      HAVING feature != 'Other'
      ORDER BY views DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      CASE
        WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
        WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
        WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
        WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
        WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
        WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
        WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
        WHEN REGEXP_CONTAINS(page_url, '/session/login') THEN 'Login'
        ELSE 'Other'
      END as feature,
      COUNT(*) as views
    FROM (
      SELECT
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location') as page_url
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getPreviousPeriodDateFilter(days)}
        AND e.event_name = 'page_view'
    )
    WHERE page_url IS NOT NULL
    GROUP BY feature
    HAVING feature != 'Other'
    ORDER BY views DESC
  `;
}

// ============================================
// CLIENTS CHAPTER QUERIES
// ============================================

/**
 * Get client overview metrics (summary scorecards).
 * Returns total clients, total events across all clients, avg users per client.
 */
export function getClientsOverviewQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH client_data AS (
        SELECT
          REGEXP_EXTRACT(
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
            r'https://([^.]+)\\.8020rei\\.com'
          ) as client,
          user_pseudo_id,
          COUNT(*) as events,
          COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
        GROUP BY client, user_pseudo_id
      ),
      client_stats AS (
        SELECT client, COUNT(DISTINCT user_pseudo_id) as user_count, SUM(events) as events, SUM(page_views) as page_views
        FROM client_data
        WHERE client IS NOT NULL
        GROUP BY client
      ),
      total_users_count AS (
        SELECT COUNT(DISTINCT user_pseudo_id) as total_users
        FROM client_data
        WHERE client IS NOT NULL
      )
      SELECT
        COUNT(DISTINCT client) as total_clients,
        SUM(events) as total_events,
        SUM(page_views) as total_page_views,
        (SELECT total_users FROM total_users_count) as total_users,
        ROUND(AVG(user_count), 1) as avg_users_per_client
      FROM client_stats
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    client_data AS (
      SELECT
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        ) as client,
        e.user_pseudo_id,
        COUNT(*) as events,
        COUNT(CASE WHEN e.event_name = 'page_view' THEN 1 END) as page_views
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
      GROUP BY client, e.user_pseudo_id
    ),
    client_stats AS (
      SELECT client, COUNT(DISTINCT user_pseudo_id) as user_count, SUM(events) as events, SUM(page_views) as page_views
      FROM client_data
      WHERE client IS NOT NULL
      GROUP BY client
    ),
    total_users_count AS (
      SELECT COUNT(DISTINCT user_pseudo_id) as total_users
      FROM client_data
      WHERE client IS NOT NULL
    )
    SELECT
      COUNT(DISTINCT client) as total_clients,
      SUM(events) as total_events,
      SUM(page_views) as total_page_views,
      (SELECT total_users FROM total_users_count) as total_users,
      ROUND(AVG(user_count), 1) as avg_users_per_client
    FROM client_stats
  `;
}

/**
 * Get previous period client overview metrics for trend calculation.
 */
export function getPreviousClientsOverviewQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH client_data AS (
        SELECT
          REGEXP_EXTRACT(
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
            r'https://([^.]+)\\.8020rei\\.com'
          ) as client,
          user_pseudo_id,
          COUNT(*) as events,
          COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views
        FROM ${TABLE}
        WHERE ${getPreviousPeriodDateFilter(days)}
        GROUP BY client, user_pseudo_id
      ),
      client_stats AS (
        SELECT client, COUNT(DISTINCT user_pseudo_id) as user_count, SUM(events) as events, SUM(page_views) as page_views
        FROM client_data
        WHERE client IS NOT NULL
        GROUP BY client
      ),
      total_users_count AS (
        SELECT COUNT(DISTINCT user_pseudo_id) as total_users
        FROM client_data
        WHERE client IS NOT NULL
      )
      SELECT
        COUNT(DISTINCT client) as prev_total_clients,
        SUM(events) as prev_total_events,
        SUM(page_views) as prev_total_page_views,
        (SELECT total_users FROM total_users_count) as prev_total_users,
        ROUND(AVG(user_count), 1) as prev_avg_users_per_client
      FROM client_stats
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    client_data AS (
      SELECT
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        ) as client,
        e.user_pseudo_id,
        COUNT(*) as events,
        COUNT(CASE WHEN e.event_name = 'page_view' THEN 1 END) as page_views
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getPreviousPeriodDateFilter(days)}
      GROUP BY client, e.user_pseudo_id
    ),
    client_stats AS (
      SELECT client, COUNT(DISTINCT user_pseudo_id) as user_count, SUM(events) as events, SUM(page_views) as page_views
      FROM client_data
      WHERE client IS NOT NULL
      GROUP BY client
    ),
    total_users_count AS (
      SELECT COUNT(DISTINCT user_pseudo_id) as total_users
      FROM client_data
      WHERE client IS NOT NULL
    )
    SELECT
      COUNT(DISTINCT client) as prev_total_clients,
      SUM(events) as prev_total_events,
      SUM(page_views) as prev_total_page_views,
      (SELECT total_users FROM total_users_count) as prev_total_users,
      ROUND(AVG(user_count), 1) as prev_avg_users_per_client
    FROM client_stats
  `;
}

/**
 * Get top clients with detailed metrics.
 * Returns clients ranked by events with users, page views, and features count.
 */
export function getTopClientsDetailedQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        client,
        COUNT(*) as events,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views,
        COUNT(DISTINCT CASE
          WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
          WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
          WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
          WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
          WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
        END) as features_used
      FROM (
        SELECT
          user_pseudo_id, event_name,
          REGEXP_EXTRACT(
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
            r'https://([^.]+)\\.8020rei\\.com'
          ) as client,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
      )
      WHERE client IS NOT NULL
      GROUP BY client
      ORDER BY events DESC
      LIMIT 50
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      client,
      COUNT(*) as events,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(CASE WHEN e.event_name = 'page_view' THEN 1 END) as page_views,
      COUNT(DISTINCT CASE
        WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
        WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
        WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
        WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
        WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
      END) as features_used
    FROM (
      SELECT
        e.user_pseudo_id, e.event_name,
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        ) as client,
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location') as page_url
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
    ) e
    WHERE client IS NOT NULL
    GROUP BY client
    ORDER BY events DESC
    LIMIT 50
  `;
}

/**
 * Get client activity trend over time.
 * Returns daily users and events for all clients (for stacked or multi-line chart).
 */
export function getClientActivityTrendQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        event_date,
        client,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM (
        SELECT event_date, user_pseudo_id,
          REGEXP_EXTRACT(
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
            r'https://([^.]+)\\.8020rei\\.com'
          ) as client
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
      )
      WHERE client IS NOT NULL
      GROUP BY event_date, client
      ORDER BY event_date, events DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      event_date,
      client,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM (
      SELECT e.event_date, e.user_pseudo_id,
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        ) as client
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
    ) e
    WHERE client IS NOT NULL
    GROUP BY event_date, client
    ORDER BY event_date, events DESC
  `;
}

/**
 * Get single client activity trend (for drill-down view).
 * Returns daily users and events for a specific client.
 */
export function getSingleClientActivityQuery(days: number, clientName: string, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT event_date, COUNT(DISTINCT user_pseudo_id) as users, COUNT(*) as events
      FROM (
        SELECT event_date, user_pseudo_id,
          REGEXP_EXTRACT(
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
            r'https://([^.]+)\\.8020rei\\.com'
          ) as client
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
      )
      WHERE client = '${clientName}'
      GROUP BY event_date
      ORDER BY event_date
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT event_date, COUNT(DISTINCT e.user_pseudo_id) as users, COUNT(*) as events
    FROM (
      SELECT e.event_date, e.user_pseudo_id,
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        ) as client
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
    ) e
    WHERE client = '${clientName}'
    GROUP BY event_date
    ORDER BY event_date
  `;
}

/**
 * Get client feature breakdown (for drill-down view).
 * Returns features used by a specific client.
 */
export function getClientFeaturesQuery(days: number, clientName: string, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        CASE
          WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
          WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
          WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
          WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
          WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
          WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
          WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
          ELSE 'Other'
        END as feature,
        COUNT(*) as views,
        COUNT(DISTINCT user_pseudo_id) as unique_users
      FROM (
        SELECT user_pseudo_id,
          REGEXP_EXTRACT(
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
            r'https://([^.]+)\\.8020rei\\.com'
          ) as client,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
          AND event_name = 'page_view'
      )
      WHERE client = '${clientName}'
      GROUP BY feature
      HAVING feature != 'Other'
      ORDER BY views DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      CASE
        WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
        WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
        WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
        WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
        WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
        WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
        WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
        ELSE 'Other'
      END as feature,
      COUNT(*) as views,
      COUNT(DISTINCT e.user_pseudo_id) as unique_users
    FROM (
      SELECT e.user_pseudo_id,
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        ) as client,
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location') as page_url
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
        AND e.event_name = 'page_view'
    ) e
    WHERE client = '${clientName}'
    GROUP BY feature
    HAVING feature != 'Other'
    ORDER BY views DESC
  `;
}

// ============================================
// TRAFFIC CHAPTER QUERIES
// ============================================

/**
 * Get traffic by source (google, direct, etc.)
 * Uses first-touch attribution from traffic_source.source
 */
export function getTrafficBySourceQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(traffic_source.source, '(direct)') as source,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY source
      ORDER BY users DESC
      LIMIT 10
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(e.traffic_source.source, '(direct)') as source,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY source
    ORDER BY users DESC
    LIMIT 10
  `;
}

/**
 * Get traffic by medium (organic, cpc, referral, etc.)
 * Uses first-touch attribution from traffic_source.medium
 */
export function getTrafficByMediumQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(traffic_source.medium, '(none)') as medium,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY medium
      ORDER BY users DESC
      LIMIT 10
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(e.traffic_source.medium, '(none)') as medium,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY medium
    ORDER BY users DESC
    LIMIT 10
  `;
}

/**
 * Get users by screen resolution.
 * Uses device.screen_resolution from GA4.
 */
export function getScreenResolutionQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(device.screen_resolution, '(not set)') as resolution,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY resolution
      ORDER BY users DESC
      LIMIT 10
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(e.device.screen_resolution, '(not set)') as resolution,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY resolution
    ORDER BY users DESC
    LIMIT 10
  `;
}

/**
 * Get users by browser.
 * Uses device.web_info.browser from GA4.
 */
export function getTrafficBrowserQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(device.web_info.browser, '(not set)') as browser,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY browser
      ORDER BY users DESC
      LIMIT 10
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(e.device.web_info.browser, '(not set)') as browser,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY browser
    ORDER BY users DESC
    LIMIT 10
  `;
}

/**
 * Get top referrers from page_referrer event param.
 * Extracts domain from the full referrer URL.
 */
export function getTopReferrersQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(
          REGEXP_EXTRACT(
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_referrer'),
            r'https?://([^/]+)'
          ),
          '(direct)'
        ) as referrer_domain,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
        AND event_name = 'page_view'
      GROUP BY referrer_domain
      HAVING referrer_domain != '(direct)'
        AND NOT REGEXP_CONTAINS(referrer_domain, r'8020rei\\.com')
      ORDER BY users DESC
      LIMIT 10
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_referrer'),
          r'https?://([^/]+)'
        ),
        '(direct)'
      ) as referrer_domain,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
      AND e.event_name = 'page_view'
    GROUP BY referrer_domain
    HAVING referrer_domain != '(direct)'
      AND NOT REGEXP_CONTAINS(referrer_domain, r'8020rei\\.com')
    ORDER BY users DESC
    LIMIT 10
  `;
}

/**
 * Get sessions by day of week.
 * Uses DAYOFWEEK: 1=Sunday, 2=Monday, ..., 7=Saturday
 */
export function getSessionsByDayOfWeekQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        EXTRACT(DAYOFWEEK FROM PARSE_DATE('%Y%m%d', event_date)) as day_of_week,
        COUNT(DISTINCT CONCAT(user_pseudo_id,
          CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
        )) as sessions
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY day_of_week
      ORDER BY day_of_week
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      EXTRACT(DAYOFWEEK FROM PARSE_DATE('%Y%m%d', e.event_date)) as day_of_week,
      COUNT(DISTINCT CONCAT(e.user_pseudo_id,
        CAST((SELECT value.int_value FROM UNNEST(e.event_params) WHERE key = 'ga_session_id') AS STRING)
      )) as sessions
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY day_of_week
    ORDER BY day_of_week
  `;
}

/**
 * Get first visits trend over time.
 * Tracks new user acquisition by day.
 */
export function getFirstVisitsTrendQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        event_date,
        COUNT(*) as first_visits
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
        AND event_name = 'first_visit'
      GROUP BY event_date
      ORDER BY event_date
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      e.event_date,
      COUNT(*) as first_visits
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
      AND e.event_name = 'first_visit'
    GROUP BY e.event_date
    ORDER BY e.event_date
  `;
}

/**
 * Get previous period traffic by source for trend calculation.
 */
export function getPreviousTrafficBySourceQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(traffic_source.source, '(direct)') as source,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
      GROUP BY source
      ORDER BY users DESC
      LIMIT 10
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(e.traffic_source.source, '(direct)') as source,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getPreviousPeriodDateFilter(days)}
    GROUP BY source
    ORDER BY users DESC
    LIMIT 10
  `;
}

// ============================================
// TECHNOLOGY CHAPTER QUERIES
// ============================================

/**
 * Get device category distribution (desktop, mobile, tablet).
 * Uses device.category field from GA4 BigQuery.
 */
export function getDeviceCategoryQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        device.category as device_category,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY device_category
      ORDER BY users DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      e.device.category as device_category,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY device_category
    ORDER BY users DESC
  `;
}

/**
 * Get browser distribution (Chrome, Safari, Firefox, Edge, etc.).
 * Uses device.web_info.browser from GA4 BigQuery (device.browser is often null).
 */
export function getBrowserDistributionQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(device.web_info.browser, '(not set)') as browser,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY browser
      ORDER BY users DESC
      LIMIT 10
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(e.device.web_info.browser, '(not set)') as browser,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY browser
    ORDER BY users DESC
    LIMIT 10
  `;
}

/**
 * Get operating system distribution (Windows, macOS, iOS, Android, etc.).
 * Uses device.operating_system field from GA4 BigQuery.
 */
export function getOperatingSystemQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        device.operating_system as os,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY os
      ORDER BY users DESC
      LIMIT 10
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      e.device.operating_system as os,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY os
    ORDER BY users DESC
    LIMIT 10
  `;
}

/**
 * Get device language distribution (en-us, es, etc.).
 * Uses device.language field from GA4 BigQuery.
 */
export function getDeviceLanguageQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        device.language as language,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY language
      ORDER BY users DESC
      LIMIT 15
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      e.device.language as language,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY language
    ORDER BY users DESC
    LIMIT 15
  `;
}

/**
 * Get previous period device category distribution for trend calculation.
 */
export function getPreviousDeviceCategoryQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        device.category as device_category,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
      GROUP BY device_category
      ORDER BY users DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      e.device.category as device_category,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getPreviousPeriodDateFilter(days)}
    GROUP BY device_category
    ORDER BY users DESC
  `;
}

/**
 * Diagnostic query to inspect user affiliation data.
 * This verifies that the user_affiliation property is being sent correctly
 * and shows the distribution of internal vs external users.
 *
 * IMPORTANT: Shows the LAST (final) user_affiliation per session, as users
 * may authenticate mid-session.
 */
export function getDiagnosticUserDataQuery(days: number = 7): string {
  return `
    WITH session_data AS (
      SELECT
        user_pseudo_id,
        user_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation,
        COUNT(*) as event_count,
        COUNT(DISTINCT event_date) as active_days,
        MIN(event_timestamp) as first_event,
        MAX(event_timestamp) as last_event
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY user_pseudo_id, user_id, event_timestamp, user_properties
    )
    SELECT
      final_affiliation,
      user_id,
      user_pseudo_id,
      SUM(event_count) as total_events,
      MAX(active_days) as active_days,
      MIN(first_event) as first_seen,
      MAX(last_event) as last_seen
    FROM session_data
    GROUP BY final_affiliation, user_id, user_pseudo_id
    ORDER BY total_events DESC
    LIMIT 100
  `;
}

// ============================================
// GEOGRAPHY CHAPTER QUERIES
// ============================================

/**
 * Get Users by Country
 * Returns top countries by user count.
 */
export function getCountryQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(geo.country, '(not set)') as country,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY country
      ORDER BY users DESC
      LIMIT 20
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(e.geo.country, '(not set)') as country,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY country
    ORDER BY users DESC
    LIMIT 20
  `;
}

/**
 * Get Users by Region/State (filtered to US by default for relevance)
 * Returns top regions by user count.
 */
export function getRegionQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(geo.region, '(not set)') as region,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
        AND geo.country = 'United States'
      GROUP BY region
      ORDER BY users DESC
      LIMIT 20
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(e.geo.region, '(not set)') as region,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
      AND e.geo.country = 'United States'
    GROUP BY region
    ORDER BY users DESC
    LIMIT 20
  `;
}

/**
 * Get Users by City (filtered to US by default for relevance)
 * Returns top cities by user count.
 */
export function getCityQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(geo.city, '(not set)') as city,
        COALESCE(geo.region, '(not set)') as region,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
        AND geo.country = 'United States'
      GROUP BY city, region
      ORDER BY users DESC
      LIMIT 20
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(e.geo.city, '(not set)') as city,
      COALESCE(e.geo.region, '(not set)') as region,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
      AND e.geo.country = 'United States'
    GROUP BY city, region
    ORDER BY users DESC
    LIMIT 20
  `;
}

/**
 * Get Users by Continent
 * Returns activity breakdown by continent.
 */
export function getContinentQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(geo.continent, '(not set)') as continent,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY continent
      ORDER BY users DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(e.geo.continent, '(not set)') as continent,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY continent
    ORDER BY users DESC
  `;
}

/**
 * Get Previous Period Users by Country (for trend calculation)
 */
export function getPreviousCountryQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COALESCE(geo.country, '(not set)') as country,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
      GROUP BY country
      ORDER BY users DESC
      LIMIT 20
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COALESCE(e.geo.country, '(not set)') as country,
      COUNT(DISTINCT e.user_pseudo_id) as users,
      COUNT(*) as events
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getPreviousPeriodDateFilter(days)}
    GROUP BY country
    ORDER BY users DESC
    LIMIT 20
  `;
}

// ============================================
// EVENTS CHAPTER QUERIES
// ============================================

/**
 * Get Event Breakdown
 * Returns count of each event type.
 */
export function getEventBreakdownQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        event_name,
        COUNT(*) as count,
        COUNT(DISTINCT user_pseudo_id) as unique_users
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
      GROUP BY event_name
      ORDER BY count DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      e.event_name,
      COUNT(*) as count,
      COUNT(DISTINCT e.user_pseudo_id) as unique_users
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
    GROUP BY e.event_name
    ORDER BY count DESC
  `;
}

/**
 * Get Previous Period Event Breakdown (for trend calculation)
 */
export function getPreviousEventBreakdownQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        event_name,
        COUNT(*) as count,
        COUNT(DISTINCT user_pseudo_id) as unique_users
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
      GROUP BY event_name
      ORDER BY count DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      e.event_name,
      COUNT(*) as count,
      COUNT(DISTINCT e.user_pseudo_id) as unique_users
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getPreviousPeriodDateFilter(days)}
    GROUP BY e.event_name
    ORDER BY count DESC
  `;
}

/**
 * Get Event Volume Trend (for stacked area chart)
 * Returns daily event counts by event type.
 */
export function getEventVolumeTrendQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        event_date,
        event_name,
        COUNT(*) as count
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
        AND event_name IN ('page_view', 'click', 'scroll', 'user_engagement', 'form_start', 'session_start')
      GROUP BY event_date, event_name
      ORDER BY event_date, count DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      e.event_date,
      e.event_name,
      COUNT(*) as count
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
      AND e.event_name IN ('page_view', 'click', 'scroll', 'user_engagement', 'form_start', 'session_start')
    GROUP BY e.event_date, e.event_name
    ORDER BY e.event_date, count DESC
  `;
}

/**
 * Get Events per Session and Form Conversion metrics
 */
export function getEventMetricsQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT CONCAT(
          user_pseudo_id, '-',
          CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
        )) as total_sessions,
        COUNT(CASE WHEN event_name = 'form_start' THEN 1 END) as form_starts,
        COUNT(CASE WHEN event_name = 'form_submit' THEN 1 END) as form_submits,
        COUNT(CASE WHEN event_name = 'click' THEN 1 END) as clicks,
        COUNT(CASE WHEN event_name = 'scroll' THEN 1 END) as scrolls
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COUNT(*) as total_events,
      COUNT(DISTINCT CONCAT(
        e.user_pseudo_id, '-',
        CAST((SELECT value.int_value FROM UNNEST(e.event_params) WHERE key = 'ga_session_id') AS STRING)
      )) as total_sessions,
      COUNT(CASE WHEN e.event_name = 'form_start' THEN 1 END) as form_starts,
      COUNT(CASE WHEN e.event_name = 'form_submit' THEN 1 END) as form_submits,
      COUNT(CASE WHEN e.event_name = 'click' THEN 1 END) as clicks,
      COUNT(CASE WHEN e.event_name = 'scroll' THEN 1 END) as scrolls
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getDateFilter(days)}
  `;
}

/**
 * Get Previous Period Event Metrics (for trend calculation)
 */
export function getPreviousEventMetricsQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT CONCAT(
          user_pseudo_id, '-',
          CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
        )) as total_sessions,
        COUNT(CASE WHEN event_name = 'form_start' THEN 1 END) as form_starts,
        COUNT(CASE WHEN event_name = 'form_submit' THEN 1 END) as form_submits,
        COUNT(CASE WHEN event_name = 'click' THEN 1 END) as clicks,
        COUNT(CASE WHEN event_name = 'scroll' THEN 1 END) as scrolls
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getPreviousPeriodDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      COUNT(*) as total_events,
      COUNT(DISTINCT CONCAT(
        e.user_pseudo_id, '-',
        CAST((SELECT value.int_value FROM UNNEST(e.event_params) WHERE key = 'ga_session_id') AS STRING)
      )) as total_sessions,
      COUNT(CASE WHEN e.event_name = 'form_start' THEN 1 END) as form_starts,
      COUNT(CASE WHEN e.event_name = 'form_submit' THEN 1 END) as form_submits,
      COUNT(CASE WHEN e.event_name = 'click' THEN 1 END) as clicks,
      COUNT(CASE WHEN e.event_name = 'scroll' THEN 1 END) as scrolls
    FROM ${TABLE} e
    INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
    WHERE ${getPreviousPeriodDateFilter(days)}
  `;
}

/**
 * Get Scroll Depth by Page
 * Returns scroll events grouped by page/feature.
 */
export function getScrollDepthByPageQuery(days: number, userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      SELECT
        CASE
          WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
          WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
          WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
          WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
          WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
          WHEN REGEXP_CONTAINS(page_url, '/session/login') THEN 'Login'
          ELSE 'Other'
        END as page,
        COUNT(*) as scroll_events,
        COUNT(DISTINCT user_pseudo_id) as unique_users
      FROM (
        SELECT
          user_pseudo_id,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
        FROM ${TABLE}
        WHERE ${getDateFilter(days)}
          AND event_name = 'scroll'
      )
      WHERE page_url IS NOT NULL
      GROUP BY page
      HAVING page != 'Other'
      ORDER BY scroll_events DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE ${getDateFilter(days)}
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    )
    SELECT
      CASE
        WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
        WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
        WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
        WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
        WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
        WHEN REGEXP_CONTAINS(page_url, '/session/login') THEN 'Login'
        ELSE 'Other'
      END as page,
      COUNT(*) as scroll_events,
      COUNT(DISTINCT e.user_pseudo_id) as unique_users
    FROM (
      SELECT
        e.user_pseudo_id,
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location') as page_url
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE ${getDateFilter(days)}
        AND e.event_name = 'scroll'
    ) e
    WHERE page_url IS NOT NULL
    GROUP BY page
    HAVING page != 'Other'
    ORDER BY scroll_events DESC
  `;
}

// ============================================
// INSIGHTS & ALERTS CHAPTER QUERIES
// ============================================

/**
 * Get DAU Z-Score Alert (P1/P2 - DAU Spike/Drop)
 * Returns whether today's DAU deviates significantly from the 14-day rolling average.
 */
export function getDauAnomalyQuery(userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH daily_users AS (
        SELECT event_date,
          COUNT(DISTINCT user_pseudo_id) AS dau
        FROM ${TABLE}
        WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY))
        GROUP BY event_date
      ),
      stats AS (
        SELECT *,
          AVG(dau) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS rolling_avg,
          STDDEV(dau) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS rolling_std
        FROM daily_users
      )
      SELECT event_date, dau, rolling_avg, rolling_std,
        ROUND((dau - rolling_avg) / NULLIF(rolling_std, 0), 2) AS z_score
      FROM stats
      WHERE event_date = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id, event_date,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY))
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id, event_date
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    daily_users AS (
      SELECT event_date, COUNT(DISTINCT user_pseudo_id) AS dau
      FROM filtered_sessions
      GROUP BY event_date
    ),
    stats AS (
      SELECT *,
        AVG(dau) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS rolling_avg,
        STDDEV(dau) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS rolling_std
      FROM daily_users
    )
    SELECT event_date, dau, rolling_avg, rolling_std,
      ROUND((dau - rolling_avg) / NULLIF(rolling_std, 0), 2) AS z_score
    FROM stats
    WHERE event_date = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
  `;
}

/**
 * Get Event Volume Anomaly (P3)
 * Detects if total daily events deviated >2σ from the 14-day average.
 */
export function getEventVolumeAnomalyQuery(userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH daily_events AS (
        SELECT event_date, COUNT(*) AS total_events
        FROM ${TABLE}
        WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY))
        GROUP BY event_date
      ),
      stats AS (
        SELECT *,
          AVG(total_events) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS avg_events,
          STDDEV(total_events) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS std_events
        FROM daily_events
      )
      SELECT event_date, total_events, avg_events,
        ROUND((total_events - avg_events) / NULLIF(std_events, 0), 2) AS z_score
      FROM stats
      WHERE event_date = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY))
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    daily_events AS (
      SELECT e.event_date, COUNT(*) AS total_events
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE e._TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY))
      GROUP BY e.event_date
    ),
    stats AS (
      SELECT *,
        AVG(total_events) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS avg_events,
        STDDEV(total_events) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS std_events
      FROM daily_events
    )
    SELECT event_date, total_events, avg_events,
      ROUND((total_events - avg_events) / NULLIF(std_events, 0), 2) AS z_score
    FROM stats
    WHERE event_date = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
  `;
}

/**
 * Get Active Clients WoW Comparison (P5)
 * Detects if the number of unique active client subdomains dropped >20% WoW.
 */
export function getActiveClientsWowQuery(userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH weekly_clients AS (
        SELECT
          CASE
            WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
              THEN 'this_week'
            ELSE 'last_week'
          END AS period,
          COUNT(DISTINCT REGEXP_EXTRACT(
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
            r'https://([^.]+)\\.8020rei\\.com'
          )) AS active_clients
        FROM ${TABLE}
        WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
        GROUP BY period
      )
      SELECT
        tw.active_clients AS this_week,
        lw.active_clients AS last_week,
        ROUND((tw.active_clients - lw.active_clients) * 100.0 / NULLIF(lw.active_clients, 0), 1) AS pct_change
      FROM (SELECT active_clients FROM weekly_clients WHERE period = 'this_week') tw,
           (SELECT active_clients FROM weekly_clients WHERE period = 'last_week') lw
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    weekly_clients AS (
      SELECT
        CASE
          WHEN e._TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
            THEN 'this_week'
          ELSE 'last_week'
        END AS period,
        COUNT(DISTINCT REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        )) AS active_clients
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE e._TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
      GROUP BY period
    )
    SELECT
      tw.active_clients AS this_week,
      lw.active_clients AS last_week,
      ROUND((tw.active_clients - lw.active_clients) * 100.0 / NULLIF(lw.active_clients, 0), 1) AS pct_change
    FROM (SELECT active_clients FROM weekly_clients WHERE period = 'this_week') tw,
         (SELECT active_clients FROM weekly_clients WHERE period = 'last_week') lw
  `;
}

/**
 * Get Client Dormancy Alert (C1)
 * Detects clients that averaged >50 events/week over past 4 weeks but have <5 events in last 7 days.
 */
export function getClientDormancyQuery(userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH client_history AS (
        SELECT
          REGEXP_EXTRACT(
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
            r'https://([^.]+)\\.8020rei\\.com'
          ) AS client,
          COUNTIF(_TABLE_SUFFIX BETWEEN
            FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 35 DAY))
            AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
          ) AS events_prev_4w,
          COUNTIF(_TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)))
            AS events_last_7d
        FROM ${TABLE}
        WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 35 DAY))
        GROUP BY client
        HAVING client IS NOT NULL
      )
      SELECT client,
        events_prev_4w, ROUND(events_prev_4w / 4.0, 0) AS avg_weekly,
        events_last_7d
      FROM client_history
      WHERE events_prev_4w / 4.0 > 50
        AND events_last_7d < 5
      ORDER BY events_prev_4w DESC
      LIMIT 10
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 35 DAY))
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    client_history AS (
      SELECT
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        ) AS client,
        COUNTIF(e._TABLE_SUFFIX BETWEEN
          FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 35 DAY))
          AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
        ) AS events_prev_4w,
        COUNTIF(e._TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)))
          AS events_last_7d
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE e._TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 35 DAY))
      GROUP BY client
      HAVING client IS NOT NULL
    )
    SELECT client,
      events_prev_4w, ROUND(events_prev_4w / 4.0, 0) AS avg_weekly,
      events_last_7d
    FROM client_history
    WHERE events_prev_4w / 4.0 > 50
      AND events_last_7d < 5
    ORDER BY events_prev_4w DESC
    LIMIT 10
  `;
}

/**
 * Get New Client Detection (C4)
 * Detects subdomains that appeared in the last 7 days but not in the previous 30 days.
 */
export function getNewClientsQuery(userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH recent_clients AS (
        SELECT DISTINCT REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        ) AS client
        FROM ${TABLE}
        WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
      ),
      historical_clients AS (
        SELECT DISTINCT REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        ) AS client
        FROM ${TABLE}
        WHERE _TABLE_SUFFIX BETWEEN
          FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 37 DAY))
          AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
      )
      SELECT r.client
      FROM recent_clients r
      LEFT JOIN historical_clients h ON r.client = h.client
      WHERE h.client IS NULL
        AND r.client IS NOT NULL
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 37 DAY))
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    recent_clients AS (
      SELECT DISTINCT REGEXP_EXTRACT(
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
        r'https://([^.]+)\\.8020rei\\.com'
      ) AS client
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE e._TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
    ),
    historical_clients AS (
      SELECT DISTINCT REGEXP_EXTRACT(
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location'),
        r'https://([^.]+)\\.8020rei\\.com'
      ) AS client
      FROM ${TABLE} e
      INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
      WHERE e._TABLE_SUFFIX BETWEEN
        FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 37 DAY))
        AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
    )
    SELECT r.client
    FROM recent_clients r
    LEFT JOIN historical_clients h ON r.client = h.client
    WHERE h.client IS NULL
      AND r.client IS NOT NULL
  `;
}

/**
 * Get Feature Usage WoW (F1/F2 - Feature Spike/Abandonment)
 * Returns feature usage changes week-over-week.
 */
export function getFeatureUsageWowQuery(userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH feature_weekly AS (
        SELECT
          CASE
            WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
            WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox Deals'
            WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
            WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
            WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
            WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
            ELSE 'Other'
          END AS feature,
          CASE
            WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
              THEN 'this_week'
            ELSE 'last_week'
          END AS period,
          COUNT(*) AS views
        FROM (
          SELECT (SELECT value.string_value FROM UNNEST(event_params)
            WHERE key = 'page_location') AS page_url, _TABLE_SUFFIX
          FROM ${TABLE}
          WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
            AND event_name = 'page_view'
        )
        GROUP BY feature, period
      )
      SELECT tw.feature, tw.views AS this_week, lw.views AS last_week,
        ROUND((tw.views - lw.views) * 100.0 / NULLIF(lw.views, 0), 1) AS pct_change
      FROM (SELECT * FROM feature_weekly WHERE period = 'this_week') tw
      JOIN (SELECT * FROM feature_weekly WHERE period = 'last_week') lw ON tw.feature = lw.feature
      WHERE tw.feature != 'Other'
      ORDER BY ABS((tw.views - lw.views) * 100.0 / NULLIF(lw.views, 0)) DESC
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
    ),
    filtered_sessions AS (
      SELECT DISTINCT user_pseudo_id
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    feature_weekly AS (
      SELECT
        CASE
          WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
          WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox Deals'
          WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
          WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
          WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
          WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
          ELSE 'Other'
        END AS feature,
        CASE
          WHEN e._TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
            THEN 'this_week'
          ELSE 'last_week'
        END AS period,
        COUNT(*) AS views
      FROM (
        SELECT e.user_pseudo_id, e._TABLE_SUFFIX,
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'page_location') AS page_url
        FROM ${TABLE} e
        INNER JOIN filtered_sessions fs ON e.user_pseudo_id = fs.user_pseudo_id
        WHERE e._TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
          AND e.event_name = 'page_view'
      ) e
      GROUP BY feature, period
    )
    SELECT tw.feature, tw.views AS this_week, lw.views AS last_week,
      ROUND((tw.views - lw.views) * 100.0 / NULLIF(lw.views, 0), 1) AS pct_change
    FROM (SELECT * FROM feature_weekly WHERE period = 'this_week') tw
    JOIN (SELECT * FROM feature_weekly WHERE period = 'last_week') lw ON tw.feature = lw.feature
    WHERE tw.feature != 'Other'
    ORDER BY ABS((tw.views - lw.views) * 100.0 / NULLIF(lw.views, 0)) DESC
  `;
}

/**
 * Get First Visits Anomaly (G1)
 * Detects if first_visit events exceeded >2σ above the 14-day average.
 */
export function getFirstVisitsAnomalyQuery(userType: UserType = 'all'): string {
  if (userType === 'all') {
    return `
      WITH daily_first_visits AS (
        SELECT event_date, COUNT(*) AS first_visits
        FROM ${TABLE}
        WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY))
          AND event_name = 'first_visit'
        GROUP BY event_date
      ),
      stats AS (
        SELECT *,
          AVG(first_visits) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS avg_visits,
          STDDEV(first_visits) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS std_visits
        FROM daily_first_visits
      )
      SELECT event_date, first_visits, avg_visits,
        ROUND((first_visits - avg_visits) / NULLIF(std_visits, 0), 2) AS z_score
      FROM stats
      WHERE event_date = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
    `;
  }

  const targetAffiliation = userType === 'internal' ? 'internal' : 'external';

  return `
    WITH session_affiliation AS (
      SELECT
        user_pseudo_id, event_date,
        LAST_VALUE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation')
          IGNORE NULLS
        ) OVER (
          PARTITION BY user_pseudo_id
          ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as final_affiliation
      FROM ${TABLE}
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY))
        AND event_name = 'first_visit'
    ),
    filtered_events AS (
      SELECT event_date
      FROM session_affiliation
      WHERE final_affiliation = '${targetAffiliation}'
    ),
    daily_first_visits AS (
      SELECT event_date, COUNT(*) AS first_visits
      FROM filtered_events
      GROUP BY event_date
    ),
    stats AS (
      SELECT *,
        AVG(first_visits) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS avg_visits,
        STDDEV(first_visits) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS std_visits
      FROM daily_first_visits
    )
    SELECT event_date, first_visits, avg_visits,
      ROUND((first_visits - avg_visits) / NULLIF(std_visits, 0), 2) AS z_score
    FROM stats
    WHERE event_date = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
  `;
}
