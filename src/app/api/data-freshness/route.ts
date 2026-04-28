/**
 * GET /api/data-freshness — Aurora staleness probe for the AuroraStaleBanner.
 *
 * Mirrors the rr-aurora-stale alert logic in /api/rapid-response (RR12) but
 * returns a slim payload optimized for client polling. Two cadences:
 *   • rr_campaign_snapshots — hourly cron (metrics:dispatch-to-aurora).
 *     Stale at ≥3h, critical at ≥6h.
 *   • dm_client_funnel — daily cron at 02:00 UTC.
 *     Stale at ≥27h (24h cycle + 3h grace), critical at ≥36h.
 *
 * Auth-free by design: the response is a non-PII status read. Same posture
 * as /api/version, which is also unauthenticated and polled by every tab.
 *
 * `dynamic = 'force-dynamic'` + `Cache-Control: no-store` together prevent
 * the Next data cache, the CDN, and the browser from holding a stale view.
 */

import { NextResponse } from 'next/server';
import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SNAPSHOT_WARN_H = 3;
const SNAPSHOT_CRIT_H = 6;
const FUNNEL_WARN_H = 27;
const FUNNEL_CRIT_H = 36;

interface FreshnessResponse {
  snapshotAgeHours: number | null;
  funnelAgeHours: number | null;
  snapshotStale: boolean;
  funnelStale: boolean;
  snapshotCritical: boolean;
  funnelCritical: boolean;
  isStale: boolean;
  isCritical: boolean;
  thresholds: {
    snapshotWarnH: number;
    snapshotCritH: number;
    funnelWarnH: number;
    funnelCritH: number;
  };
  error?: string;
}

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

export async function GET() {
  if (!isAuroraConfigured()) {
    const body: FreshnessResponse = {
      snapshotAgeHours: null,
      funnelAgeHours: null,
      snapshotStale: false,
      funnelStale: false,
      snapshotCritical: false,
      funnelCritical: false,
      isStale: false,
      isCritical: false,
      thresholds: { snapshotWarnH: SNAPSHOT_WARN_H, snapshotCritH: SNAPSHOT_CRIT_H, funnelWarnH: FUNNEL_WARN_H, funnelCritH: FUNNEL_CRIT_H },
      error: 'Aurora not configured',
    };
    return NextResponse.json(body, { headers: NO_CACHE });
  }

  try {
    const rows = await runAuroraQuery<Record<string, unknown>>(`
      SELECT
        EXTRACT(EPOCH FROM (NOW() - MAX(snapshot_at))) / 3600.0 AS rr_age_hours,
        EXTRACT(EPOCH FROM (NOW() - (SELECT MAX(date)::timestamp FROM dm_client_funnel))) / 3600.0 AS cf_age_hours
      FROM rr_campaign_snapshots
    `);

    const rrAgeHours = rows[0]?.rr_age_hours != null ? Number(rows[0].rr_age_hours) : null;
    const cfAgeHours = rows[0]?.cf_age_hours != null ? Number(rows[0].cf_age_hours) : null;

    const snapshotStale = rrAgeHours != null && rrAgeHours > SNAPSHOT_WARN_H;
    const funnelStale = cfAgeHours != null && cfAgeHours > FUNNEL_WARN_H;
    const snapshotCritical = rrAgeHours != null && rrAgeHours > SNAPSHOT_CRIT_H;
    const funnelCritical = cfAgeHours != null && cfAgeHours > FUNNEL_CRIT_H;

    const body: FreshnessResponse = {
      snapshotAgeHours: rrAgeHours,
      funnelAgeHours: cfAgeHours,
      snapshotStale,
      funnelStale,
      snapshotCritical,
      funnelCritical,
      isStale: snapshotStale || funnelStale,
      isCritical: snapshotCritical || funnelCritical,
      thresholds: { snapshotWarnH: SNAPSHOT_WARN_H, snapshotCritH: SNAPSHOT_CRIT_H, funnelWarnH: FUNNEL_WARN_H, funnelCritH: FUNNEL_CRIT_H },
    };

    return NextResponse.json(body, { headers: NO_CACHE });
  } catch (err) {
    const body: FreshnessResponse = {
      snapshotAgeHours: null,
      funnelAgeHours: null,
      snapshotStale: false,
      funnelStale: false,
      snapshotCritical: false,
      funnelCritical: false,
      isStale: false,
      isCritical: false,
      thresholds: { snapshotWarnH: SNAPSHOT_WARN_H, snapshotCritH: SNAPSHOT_CRIT_H, funnelWarnH: FUNNEL_WARN_H, funnelCritH: FUNNEL_CRIT_H },
      error: err instanceof Error ? err.message : 'probe failed',
    };
    return NextResponse.json(body, { status: 500, headers: NO_CACHE });
  }
}
