/**
 * Campaign lifecycle helper — single source of truth for "is this campaign
 * active, and if not, when did it stop?".
 *
 * Both the Operational Health → Campaign table and Business Results → Client
 * Performance widgets import from here so the dates they display never diverge.
 *
 * Data source: Aurora `rr_campaign_snapshots` (append-only, hourly cron).
 * For each campaign_id we compute:
 *   - currentStatus: latest snapshot status ('active' | 'draft' | 'disabled' | 'eliminated')
 *   - stoppedAt: most recent snapshot_at where status transitioned `active -> non-active`.
 *     If the campaign is currently active (even after a prior stop), stoppedAt is NULL
 *     so the UI never claims a currently-active client is "stopped".
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
 *  Draft / eliminated campaigns that NEVER sent mail return `null` — we have no
 *  meaningful "stopped" date for a campaign that never ran.
 */
export type StoppedAtSource = 'observed' | 'last-sent';

export interface CampaignLifecycle {
  campaignId: string;
  campaignName: string;
  domain: string;
  currentStatus: string;
  /** ISO timestamp or null. Null when the campaign is currently active, or when
   *  we have no data at all (e.g. draft campaign never captured in a non-active
   *  snapshot and never sent mail). */
  stoppedAt: string | null;
  /** Provenance of stoppedAt. Null iff stoppedAt is null. */
  stoppedAtSource: StoppedAtSource | null;
  lastSentDate: string | null;
}

function sanitizeDomain(domain?: string | null): string | null {
  if (!domain) return null;
  return domain.replace(/[^a-zA-Z0-9_.]/g, '') || null;
}

/**
 * Query per-campaign lifecycle across all snapshots.
 * Returns one row per campaign_id present in rr_campaign_snapshots.
 */
export async function queryCampaignLifecycles(domain?: string): Promise<CampaignLifecycle[]> {
  const safeDomain = sanitizeDomain(domain);
  const domainClause = safeDomain ? `AND domain = '${safeDomain}'` : '';

  const rows = await runAuroraQuery(`
    WITH transitions AS (
      SELECT
        campaign_id,
        status,
        snapshot_at,
        LAG(status) OVER (PARTITION BY campaign_id ORDER BY snapshot_at) AS prev_status
      FROM rr_campaign_snapshots
      WHERE ${EXCLUDE_SEED}
        ${domainClause}
    ),
    stops AS (
      SELECT campaign_id, MAX(snapshot_at) AS observed_stopped_at
      FROM transitions
      WHERE prev_status = 'active' AND status <> 'active'
      GROUP BY campaign_id
    ),
    latest AS (
      SELECT DISTINCT ON (campaign_id)
        campaign_id, campaign_name, domain, status, last_sent_date
      FROM rr_campaign_snapshots
      WHERE ${EXCLUDE_SEED}
        ${domainClause}
      ORDER BY campaign_id, snapshot_at DESC
    )
    SELECT
      l.campaign_id,
      l.campaign_name,
      l.domain,
      l.status AS current_status,
      l.last_sent_date,
      s.observed_stopped_at
    FROM latest l
    LEFT JOIN stops s ON s.campaign_id = l.campaign_id
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
 * Build an in-memory index: campaignId -> lifecycle.
 * Convenience for API routes that already iterate rr_campaign_snapshots rows.
 */
export function indexLifecyclesByCampaignId(lifecycles: CampaignLifecycle[]): Map<string, CampaignLifecycle> {
  const m = new Map<string, CampaignLifecycle>();
  for (const lc of lifecycles) m.set(lc.campaignId, lc);
  return m;
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
