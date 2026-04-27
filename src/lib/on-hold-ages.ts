/**
 * On-hold age helper — single source of truth for the stale vs fresh split.
 *
 * Used by:
 *   - /api/rapid-response?type=overview         (Is-it-running pulse payload)
 *   - /api/rapid-response?type=campaign-list    (per-row age badge)
 *   - /api/rapid-response?type=on-hold-breakdown (full detail)
 *   - /api/rapid-response/slack-alerts          (Mailings on hold alert)
 *
 * Age is inferred from `rr_campaign_snapshots` snapshot history because the
 * monolith's row-level `rapid_response_history` (which has per-piece
 * created_at timestamps) does not sync to Aurora. We use MIN(snapshot_at)
 * FILTER (WHERE on_hold_count > 0) per campaign as a proxy for "when this
 * campaign first became stuck." Imperfect but the best signal available in
 * Aurora — the session-5/6 audit doc captures the caveat explicitly.
 *
 * Rule: every consumer calls this helper. Copy-pasting the CTE is forbidden;
 * the only way to change the classification logic is to edit this one file.
 */

import { runAuroraQuery } from '@/lib/aurora';
import { EXCLUDE_TEST_DOMAINS_SQL as EXCLUDE_SEED } from '@/lib/domain-filter';

/** Campaigns held this many days or more are "stale" — overdue for the monolith's
 *  handleOnHoldRapidResponses auto-delivery timer to convert them to undelivered.
 *  This describes the platform's behavior; alert callers may use a stricter
 *  cutoff via queryOnHoldAges(domain, thresholdDays). */
export const ON_HOLD_STALE_THRESHOLD_DAYS = 7;

export interface OnHoldCampaignRow {
  domain: string;
  campaignId: number | string;
  campaignName: string;
  currentHold: number;
  firstOnHoldSeen: string | null;
  daysSinceFirstHold: number;
  ageBucket: 'stale' | 'fresh';
}

export interface OnHoldAgeResult {
  totalOnHold: number;
  staleOnHold: number;
  freshOnHold: number;
  oldestAgeDays: number;
  campaignsWithHold: number;
  staleCampaigns: number;
  perCampaign: OnHoldCampaignRow[];
}

export async function queryOnHoldAges(
  domain?: string | null,
  thresholdDays: number = ON_HOLD_STALE_THRESHOLD_DAYS,
): Promise<OnHoldAgeResult> {
  const domainClause = domain
    ? `AND domain = '${String(domain).replace(/[^a-zA-Z0-9_.]/g, '')}'`
    : '';
  const safeThreshold = Number.isFinite(thresholdDays) && thresholdDays > 0 ? Math.floor(thresholdDays) : ON_HOLD_STALE_THRESHOLD_DAYS;
  const rows = await runAuroraQuery<Record<string, unknown>>(`
    WITH per_campaign AS (
      SELECT
        domain,
        campaign_id,
        campaign_name,
        MIN(snapshot_at) FILTER (WHERE on_hold_count > 0) AS first_on_hold_seen
      FROM rr_campaign_snapshots
      WHERE ${EXCLUDE_SEED}
        ${domainClause}
      GROUP BY domain, campaign_id, campaign_name
    ),
    latest AS (
      SELECT DISTINCT ON (domain, campaign_id)
        domain, campaign_id, on_hold_count AS current_hold, snapshot_at
      FROM rr_campaign_snapshots
      WHERE ${EXCLUDE_SEED}
        ${domainClause}
      ORDER BY domain, campaign_id, snapshot_at DESC
    )
    SELECT
      p.domain,
      p.campaign_id,
      p.campaign_name,
      p.first_on_hold_seen,
      l.current_hold,
      EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.first_on_hold_seen))::int AS days_since_first_hold,
      CASE
        WHEN p.first_on_hold_seen <= CURRENT_TIMESTAMP - INTERVAL '${safeThreshold} days'
        THEN 'stale'
        ELSE 'fresh'
      END AS age_bucket
    FROM per_campaign p
    JOIN latest l ON l.domain = p.domain AND l.campaign_id = p.campaign_id
    WHERE l.current_hold > 0
    ORDER BY days_since_first_hold DESC, l.current_hold DESC
  `);

  let stale = 0;
  let fresh = 0;
  let oldest = 0;
  const perCampaign: OnHoldCampaignRow[] = rows.map(r => {
    const hold = Number(r.current_hold || 0);
    const days = Number(r.days_since_first_hold || 0);
    const bucket = String(r.age_bucket) as 'stale' | 'fresh';
    if (bucket === 'stale') stale += hold;
    else fresh += hold;
    if (days > oldest) oldest = days;
    return {
      domain: String(r.domain),
      campaignId: r.campaign_id as number | string,
      campaignName: String(r.campaign_name),
      currentHold: hold,
      firstOnHoldSeen: r.first_on_hold_seen
        ? new Date(String(r.first_on_hold_seen)).toISOString()
        : null,
      daysSinceFirstHold: days,
      ageBucket: bucket,
    };
  });
  return {
    totalOnHold: stale + fresh,
    staleOnHold: stale,
    freshOnHold: fresh,
    oldestAgeDays: oldest,
    campaignsWithHold: perCampaign.length,
    staleCampaigns: perCampaign.filter(c => c.ageBucket === 'stale').length,
    perCampaign,
  };
}
