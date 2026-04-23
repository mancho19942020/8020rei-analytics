/**
 * Campaign lifecycle helper — single source of truth for "is this campaign
 * active, and if not, when did it stop?".
 *
 * Both the Operational Health → Campaign table and Business Results → Client
 * Performance widgets import from here so the dates they display never diverge.
 *
 * Data source: Aurora `rr_campaign_snapshots` (append-only, hourly cron) +
 * `dm_property_conversions` for authoritative per-campaign last-send dates.
 * For each (domain, campaign_id) pair we compute:
 *   - currentStatus: latest snapshot status ('active' | 'draft' | 'disabled' | 'eliminated' | 'paused')
 *   - stoppedAt: hour-precise active→non-active transition if observed in
 *     snapshot history, else the campaign's real last-send date.
 *   - stoppedAtSource: 'observed' | 'last-sent' | null — drives the tooltip.
 *
 * IMPORTANT: `campaign_id` is NOT globally unique — each tenant monolith has
 * its own `rapid_responses` table with its own id sequence, so two different
 * clients can both have campaign_id=1. The unique key is (domain, campaign_id).
 * All aggregations and lookups here partition by that composite key.
 */
import { runAuroraQuery } from './aurora';
import { EXCLUDE_TEST_DOMAINS_SQL as EXCLUDE_SEED } from './domain-filter';

/** Provenance of `stoppedAt`. Drives the tooltip so readers can judge the date.
 *  - `observed`   — we saw the exact active→non-active transition in snapshot history.
 *                    Most accurate; matches the hour of the status flip.
 *  - `last-sent`  — transition predates our snapshot history, so we surface the
 *                    campaign's last_sent_date as the most business-meaningful
 *                    "effectively stopped" proxy ("last mailed on this day").
 *
 *  Campaigns that never sent mail and were never seen flipping return `null`.
 */
export type StoppedAtSource = 'observed' | 'last-sent';

export interface CampaignLifecycle {
  campaignId: string;
  campaignName: string;
  domain: string;
  currentStatus: string;
  /** ISO timestamp or null. Null when the campaign is currently active, or when
   *  we have no usable data (e.g. draft campaign never sent + never flipped). */
  stoppedAt: string | null;
  /** Provenance of stoppedAt. Null iff stoppedAt is null. */
  stoppedAtSource: StoppedAtSource | null;
  lastSentDate: string | null;
}

function sanitizeDomain(domain?: string | null): string | null {
  if (!domain) return null;
  return domain.replace(/[^a-zA-Z0-9_.]/g, '') || null;
}

/** Composite key for a campaign unique across tenants. */
export function lifecycleKey(domain: string, campaignId: string | number): string {
  return `${domain}::${String(campaignId)}`;
}

/**
 * Query per-campaign lifecycle across all snapshots.
 * Returns one row per (domain, campaign_id) pair present in rr_campaign_snapshots.
 */
export async function queryCampaignLifecycles(domain?: string): Promise<CampaignLifecycle[]> {
  const safeDomain = sanitizeDomain(domain);
  const domainClause = safeDomain ? `AND domain = '${safeDomain}'` : '';

  const rows = await runAuroraQuery(`
    WITH transitions AS (
      SELECT
        domain,
        campaign_id,
        status,
        snapshot_at,
        LAG(status) OVER (PARTITION BY domain, campaign_id ORDER BY snapshot_at) AS prev_status
      FROM rr_campaign_snapshots
      WHERE ${EXCLUDE_SEED}
        ${domainClause}
    ),
    stops AS (
      SELECT domain, campaign_id, MAX(snapshot_at) AS observed_stopped_at
      FROM transitions
      WHERE prev_status = 'active' AND status <> 'active'
      GROUP BY domain, campaign_id
    ),
    -- Authoritative per-campaign last-send date. We query dm_property_conversions
    -- (not rr_campaign_snapshots.last_sent_date) because the snapshot's
    -- last_sent_date mirrors a denormalized monolith column that's NULL for
    -- many historical campaigns. dm_property_conversions has MAX(last_sent_date)
    -- per (domain, campaign_id) derived from real send rows — populated
    -- whenever mail was sent.
    real_last_send AS (
      SELECT domain, campaign_id, MAX(last_sent_date) AS last_sent
      FROM dm_property_conversions
      WHERE ${EXCLUDE_SEED}
        ${domainClause}
        AND last_sent_date IS NOT NULL
      GROUP BY domain, campaign_id
    ),
    latest AS (
      SELECT DISTINCT ON (domain, campaign_id)
        domain, campaign_id, campaign_name, status
      FROM rr_campaign_snapshots
      WHERE ${EXCLUDE_SEED}
        ${domainClause}
      ORDER BY domain, campaign_id, snapshot_at DESC
    )
    SELECT
      l.domain,
      l.campaign_id,
      l.campaign_name,
      l.status AS current_status,
      rls.last_sent AS last_sent_date,
      s.observed_stopped_at
    FROM latest l
    LEFT JOIN stops s
      ON s.domain = l.domain AND s.campaign_id = l.campaign_id
    LEFT JOIN real_last_send rls
      ON rls.domain = l.domain AND rls.campaign_id = l.campaign_id
    ORDER BY l.domain, l.campaign_id
  `);

  return rows.map((r: Record<string, unknown>) => {
    const currentStatus = String(r.current_status || '');
    const observed = r.observed_stopped_at ? String(r.observed_stopped_at) : null;
    const lastSent = r.last_sent_date ? String(r.last_sent_date) : null;

    // Only "stopped" states (disabled / eliminated / paused) carry a stoppedAt.
    // Active campaigns are still running. Draft campaigns were never running.
    // For stopped states we prefer the observed transition timestamp (the
    // hourly cron captures every status flip within ~60min going forward).
    // When the flip predates snapshot history, last_sent_date is the best
    // business-meaningful proxy ("last day this campaign effectively ran").
    const isStopped =
      currentStatus === 'disabled' ||
      currentStatus === 'eliminated' ||
      currentStatus === 'paused';
    let stoppedAt: string | null = null;
    let stoppedAtSource: StoppedAtSource | null = null;
    if (isStopped) {
      if (observed) {
        stoppedAt = observed;
        stoppedAtSource = 'observed';
      } else if (lastSent) {
        stoppedAt = lastSent;
        stoppedAtSource = 'last-sent';
      }
    }

    return {
      campaignId: String(r.campaign_id || ''),
      campaignName: String(r.campaign_name || ''),
      domain: String(r.domain || ''),
      currentStatus,
      stoppedAt,
      stoppedAtSource,
      lastSentDate: lastSent,
    };
  });
}

/**
 * Given a client's campaigns, return the client-level stoppedAt date + its source.
 * Returns { stoppedAt: null, stoppedAtSource: null } if any campaign is active
 * (client still has work running). Otherwise returns the most recent stoppedAt
 * across the client's campaigns, carrying over the winning campaign's source.
 */
export function deriveClientStoppedAt(
  lifecycles: CampaignLifecycle[]
): { stoppedAt: string | null; stoppedAtSource: StoppedAtSource | null } {
  if (lifecycles.length === 0) return { stoppedAt: null, stoppedAtSource: null };
  const anyActive = lifecycles.some(c => c.currentStatus === 'active');
  if (anyActive) return { stoppedAt: null, stoppedAtSource: null };
  const withDates = lifecycles.filter(
    (c): c is CampaignLifecycle & { stoppedAt: string; stoppedAtSource: StoppedAtSource } =>
      typeof c.stoppedAt === 'string' && c.stoppedAt.length > 0 && c.stoppedAtSource !== null
  );
  if (withDates.length === 0) return { stoppedAt: null, stoppedAtSource: null };
  // Lexicographic sort works for ISO timestamps — most recent last.
  withDates.sort((a, b) => a.stoppedAt.localeCompare(b.stoppedAt));
  const winner = withDates[withDates.length - 1];
  return { stoppedAt: winner.stoppedAt, stoppedAtSource: winner.stoppedAtSource };
}

/**
 * Build an in-memory index: "${domain}::${campaignId}" -> lifecycle.
 * campaign_id is NOT globally unique — it's per-tenant — so we must index by
 * the composite (domain, campaignId) key.
 */
export function indexLifecyclesByCampaignKey(lifecycles: CampaignLifecycle[]): Map<string, CampaignLifecycle> {
  const m = new Map<string, CampaignLifecycle>();
  for (const lc of lifecycles) m.set(lifecycleKey(lc.domain, lc.campaignId), lc);
  return m;
}

/**
 * A campaign that transitioned from `active` → non-active in snapshot history.
 * Used by the Slack digest alerts to surface "campaign stopped" notifications.
 */
export interface CampaignStopEvent {
  campaignId: string;
  campaignName: string;
  domain: string;
  /** Current (latest-snapshot) status — typically 'disabled' | 'eliminated' | 'paused'. */
  finalStatus: string;
  /** ISO timestamp of the observed active→non-active transition. */
  stoppedAt: string;
  /** Last time this campaign sent mail (from dm_property_conversions). */
  lastSentDate: string | null;
}

/**
 * Return all observed campaign stop events within the last `withinDays` days.
 * Only returns campaigns whose CURRENT status is still non-active — if a
 * campaign was re-activated after the transition we don't fire an alert.
 *
 * Filter is on the TRANSITION TIMESTAMP, not the current time — so a campaign
 * that stopped on day 0 will keep appearing for `withinDays` days, letting the
 * existing "new vs persistent" digest logic handle day-over-day classification.
 */
export async function queryRecentCampaignStops(
  withinDays: number,
  domain?: string
): Promise<CampaignStopEvent[]> {
  const safeDomain = sanitizeDomain(domain);
  const domainClause = safeDomain ? `AND domain = '${safeDomain}'` : '';
  const safeDays = Math.max(1, Math.min(365, Math.floor(withinDays)));

  const rows = await runAuroraQuery(`
    WITH transitions AS (
      SELECT
        domain,
        campaign_id,
        status,
        snapshot_at,
        LAG(status) OVER (PARTITION BY domain, campaign_id ORDER BY snapshot_at) AS prev_status
      FROM rr_campaign_snapshots
      WHERE ${EXCLUDE_SEED}
        ${domainClause}
    ),
    recent_stops AS (
      SELECT domain, campaign_id, MAX(snapshot_at) AS stopped_at
      FROM transitions
      WHERE prev_status = 'active' AND status <> 'active'
        AND snapshot_at >= NOW() - INTERVAL '${safeDays} days'
      GROUP BY domain, campaign_id
    ),
    latest AS (
      SELECT DISTINCT ON (domain, campaign_id)
        domain, campaign_id, campaign_name, status
      FROM rr_campaign_snapshots
      WHERE ${EXCLUDE_SEED}
        ${domainClause}
      ORDER BY domain, campaign_id, snapshot_at DESC
    ),
    real_last_send AS (
      SELECT domain, campaign_id, MAX(last_sent_date) AS last_sent
      FROM dm_property_conversions
      WHERE ${EXCLUDE_SEED}
        ${domainClause}
        AND last_sent_date IS NOT NULL
      GROUP BY domain, campaign_id
    )
    SELECT
      s.domain,
      s.campaign_id,
      s.stopped_at,
      l.campaign_name,
      l.status AS final_status,
      rls.last_sent
    FROM recent_stops s
    JOIN latest l ON l.domain = s.domain AND l.campaign_id = s.campaign_id
    LEFT JOIN real_last_send rls ON rls.domain = s.domain AND rls.campaign_id = s.campaign_id
    WHERE l.status <> 'active'
    ORDER BY s.stopped_at DESC
  `);

  return rows.map((r: Record<string, unknown>) => ({
    campaignId: String(r.campaign_id || ''),
    campaignName: String(r.campaign_name || ''),
    domain: String(r.domain || ''),
    finalStatus: String(r.final_status || ''),
    stoppedAt: String(r.stopped_at || ''),
    lastSentDate: r.last_sent ? String(r.last_sent) : null,
  }));
}

/**
 * A client that just became fully inactive — had ≥1 active campaign before,
 * now has zero active campaigns, and at least one of the transitions was
 * observed in the last `withinDays` days (so it's a recent, fresh event).
 */
export interface ClientDeactivationEvent {
  domain: string;
  /** When the client's most recent campaign flipped (the one that pushed them to zero active). */
  deactivatedAt: string;
  /** The campaign that triggered the client's deactivation. */
  lastCampaign: {
    campaignId: string;
    campaignName: string;
    finalStatus: string;
  };
  /** Total campaigns this client has (all currently non-active). */
  totalCampaigns: number;
}

/**
 * Return all clients that just became fully inactive within the last
 * `withinDays` days. Built on top of the shared lifecycle helper so the
 * detection uses the same rows that power the "Stopped on" columns.
 */
export async function queryRecentClientDeactivations(
  withinDays: number,
  domain?: string
): Promise<ClientDeactivationEvent[]> {
  const lifecycles = await queryCampaignLifecycles(domain);
  const byDomain = indexLifecyclesByDomain(lifecycles);
  const thresholdMs = Date.now() - withinDays * 24 * 60 * 60 * 1000;

  const events: ClientDeactivationEvent[] = [];
  for (const [dom, campaigns] of byDomain.entries()) {
    if (campaigns.length === 0) continue;
    const anyActive = campaigns.some(c => c.currentStatus === 'active');
    if (anyActive) continue;

    // Only fire when at least one transition was OBSERVED (not just a stale
    // last-sent date) inside the alert window. This avoids alerting on clients
    // who have been inactive for months — only fresh deactivations surface.
    const recentObserved = campaigns.filter(c =>
      c.stoppedAtSource === 'observed' &&
      c.stoppedAt !== null &&
      new Date(c.stoppedAt).getTime() >= thresholdMs
    );
    if (recentObserved.length === 0) continue;

    recentObserved.sort((a, b) =>
      (b.stoppedAt ?? '').localeCompare(a.stoppedAt ?? '')
    );
    const latest = recentObserved[0];
    events.push({
      domain: dom,
      deactivatedAt: latest.stoppedAt as string,
      lastCampaign: {
        campaignId: latest.campaignId,
        campaignName: latest.campaignName,
        finalStatus: latest.currentStatus,
      },
      totalCampaigns: campaigns.length,
    });
  }
  // Most-recent deactivations first
  events.sort((a, b) => b.deactivatedAt.localeCompare(a.deactivatedAt));
  return events;
}

/**
 * Build an in-memory index: domain -> CampaignLifecycle[].
 * Convenience for client-level aggregation.
 */
export function indexLifecyclesByDomain(lifecycles: CampaignLifecycle[]): Map<string, CampaignLifecycle[]> {
  const m = new Map<string, CampaignLifecycle[]>();
  for (const lc of lifecycles) {
    const list = m.get(lc.domain) || [];
    list.push(lc);
    m.set(lc.domain, list);
  }
  return m;
}
