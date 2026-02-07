import { PROJECT, DATASET } from './bigquery';

const TABLE = `\`${PROJECT}.${DATASET}.events_*\``;

export function getDateFilter(days: number = 30): string {
  return `_TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))`;
}

export function getMetricsQuery(days: number): string {
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

export function getUsersByDayQuery(days: number): string {
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

export function getFeatureUsageQuery(days: number): string {
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

export function getTopClientsQuery(days: number): string {
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
    LIMIT 20
  `;
}
