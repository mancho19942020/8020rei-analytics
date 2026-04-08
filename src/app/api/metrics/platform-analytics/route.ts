/**
 * Platform Analytics API
 *
 * Queries the platform_events tracking table to provide data
 * for the Platform Analytics tab (visitor log, trends, etc.).
 */

import { NextRequest, NextResponse } from 'next/server';
import { bigquery, PROJECT } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';

const DATASET = 'metrics_hub_tracking';
const TABLE = `${PROJECT}.${DATASET}.platform_events`;

function getDateFilter(days: number, startDate?: string, endDate?: string): string {
  if (startDate && endDate) {
    return `timestamp >= '${startDate}' AND timestamp < TIMESTAMP_ADD('${endDate}', INTERVAL 1 DAY)`;
  }
  return `timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${days} DAY)`;
}

async function runQuery<T>(query: string): Promise<T[]> {
  try {
    const [rows] = await bigquery.query({ query });
    return rows as T[];
  } catch (err: unknown) {
    const error = err as { code?: number; message?: string };
    // Return empty if table doesn't exist yet (no tracking data yet)
    if (error.code === 404 || error.message?.includes('Not found')) {
      return [];
    }
    throw err;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const cacheKey = `platform-analytics:${days}:${startDate || ''}:${endDate || ''}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true, timestamp: new Date().toISOString() });
  }

  const dateFilter = getDateFilter(days, startDate, endDate);

  try {
    const [
      visitorLog,
      activeUsers,
      usageTrends,
      popularSections,
      peakHours,
      userEngagement,
    ] = await Promise.all([
      // 1. Visitor log — recent sessions with user info, duration, most-used tab
      runQuery<Record<string, unknown>>(`
        WITH sessions AS (
          SELECT
            session_id,
            user_email,
            user_name,
            MIN(timestamp) AS session_start,
            MAX(timestamp) AS session_end,
            TIMESTAMP_DIFF(MAX(timestamp), MIN(timestamp), SECOND) AS duration_seconds,
            COUNT(*) AS event_count,
            ARRAY_AGG(STRUCT(section, subsection, detail_tab) ORDER BY timestamp) AS nav_path
          FROM \`${TABLE}\`
          WHERE ${dateFilter}
            AND event_type IN ('tab_change', 'session_start', 'action')
          GROUP BY session_id, user_email, user_name
        ),
        top_tabs AS (
          SELECT
            session_id,
            section,
            COUNT(*) AS visit_count
          FROM \`${TABLE}\`
          WHERE ${dateFilter} AND section IS NOT NULL
          GROUP BY session_id, section
        ),
        ranked_tabs AS (
          SELECT
            session_id,
            section AS most_used_section,
            ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY visit_count DESC) AS rn
          FROM top_tabs
        )
        SELECT
          s.session_id,
          s.user_email,
          s.user_name,
          s.session_start,
          s.session_end,
          s.duration_seconds,
          s.event_count,
          COALESCE(rt.most_used_section, 'N/A') AS most_used_section
        FROM sessions s
        LEFT JOIN ranked_tabs rt ON s.session_id = rt.session_id AND rt.rn = 1
        ORDER BY s.session_start DESC
        LIMIT 100
      `),

      // 2. Active users KPIs
      runQuery<Record<string, unknown>>(`
        SELECT
          COUNT(DISTINCT CASE
            WHEN timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
            THEN user_email END) AS users_today,
          COUNT(DISTINCT CASE
            WHEN timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
            THEN user_email END) AS users_7d,
          COUNT(DISTINCT CASE
            WHEN timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
            THEN user_email END) AS users_30d,
          COUNT(DISTINCT session_id) AS total_sessions,
          COUNT(DISTINCT user_email) AS unique_users
        FROM \`${TABLE}\`
        WHERE ${dateFilter}
      `),

      // 3. Usage trends — daily visits over time
      runQuery<Record<string, unknown>>(`
        SELECT
          DATE(timestamp) AS event_date,
          COUNT(DISTINCT user_email) AS unique_users,
          COUNT(DISTINCT session_id) AS sessions
        FROM \`${TABLE}\`
        WHERE ${dateFilter}
        GROUP BY event_date
        ORDER BY event_date
      `),

      // 4. Popular sections — most visited tabs/sections
      runQuery<Record<string, unknown>>(`
        SELECT
          COALESCE(section, 'unknown') AS section,
          COALESCE(subsection, '') AS subsection,
          COALESCE(detail_tab, '') AS detail_tab,
          COUNT(*) AS views,
          COUNT(DISTINCT user_email) AS unique_users
        FROM \`${TABLE}\`
        WHERE ${dateFilter}
          AND event_type = 'tab_change'
          AND section IS NOT NULL
        GROUP BY section, subsection, detail_tab
        ORDER BY views DESC
        LIMIT 20
      `),

      // 5. Peak hours — activity by hour of day
      runQuery<Record<string, unknown>>(`
        SELECT
          EXTRACT(HOUR FROM timestamp) AS hour,
          COUNT(*) AS events,
          COUNT(DISTINCT user_email) AS unique_users
        FROM \`${TABLE}\`
        WHERE ${dateFilter}
        GROUP BY hour
        ORDER BY hour
      `),

      // 6. User engagement — time distribution per section
      runQuery<Record<string, unknown>>(`
        WITH section_time AS (
          SELECT
            session_id,
            user_email,
            section,
            timestamp AS event_time,
            LEAD(timestamp) OVER (PARTITION BY session_id ORDER BY timestamp) AS next_event_time
          FROM \`${TABLE}\`
          WHERE ${dateFilter}
            AND section IS NOT NULL
        )
        SELECT
          COALESCE(section, 'unknown') AS section,
          SUM(
            CASE
              WHEN next_event_time IS NOT NULL
              THEN LEAST(TIMESTAMP_DIFF(next_event_time, event_time, SECOND), 600)
              ELSE 30
            END
          ) AS total_seconds,
          COUNT(DISTINCT user_email) AS unique_users
        FROM section_time
        GROUP BY section
        ORDER BY total_seconds DESC
      `),
    ]);

    const data = {
      visitorLog,
      activeUsers: activeUsers[0] || {
        users_today: 0, users_7d: 0, users_30d: 0,
        total_sessions: 0, unique_users: 0,
      },
      usageTrends,
      popularSections,
      peakHours,
      userEngagement,
    };

    setCache(cacheKey, data);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Platform Analytics] Query error:', err);
    // Return empty state if table doesn't exist yet
    const emptyData = {
      visitorLog: [],
      activeUsers: { users_today: 0, users_7d: 0, users_30d: 0, total_sessions: 0, unique_users: 0 },
      usageTrends: [],
      popularSections: [],
      peakHours: [],
      userEngagement: [],
    };
    return NextResponse.json({
      success: true,
      data: emptyData,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  }
}
