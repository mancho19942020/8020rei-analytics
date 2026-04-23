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

export interface CampaignLifecycle {
  campaignId: string;
  campaignName: string;
  domain: string;
  currentStatus: string;
  /** ISO timestamp or null. Null when campaign is currently active, or when the
   *  snapshot history never contains an active→non-active transition. */
  stoppedAt: string | null;
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
      SELECT campaign_id, MAX(snapshot_at) AS stopped_at
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
      s.stopped_at
    FROM latest l
    LEFT JOIN stops s ON s.campaign_id = l.campaign_id
    ORDER BY l.domain, l.campaign_id
  `);

  return rows.map((r: Record<string, unknown>) => {
    const currentStatus = String(r.current_status || '');
    const rawStopped = r.stopped_at ? String(r.stopped_at) : null;
    // Currently-active campaigns never show a stoppedAt — even if they were
    // stopped in the past and later re-activated.
    const stoppedAt = currentStatus === 'active' ? null : rawStopped;
    return {
      campaignId: String(r.campaign_id || ''),
      campaignName: String(r.campaign_name || ''),
      domain: String(r.domain || ''),
      currentStatus,
      stoppedAt,
      lastSentDate: r.last_sent_date ? String(r.last_sent_date) : null,
    };
  });
}

/**
 * Given a client's campaigns, return the client-level stoppedAt date.
 * Returns null if ANY campaign is active (client still has work running).
 * Otherwise returns the most recent stoppedAt across the client's campaigns.
 */
export function deriveClientStoppedAt(lifecycles: CampaignLifecycle[]): string | null {
  if (lifecycles.length === 0) return null;
  const anyActive = lifecycles.some(c => c.currentStatus === 'active');
  if (anyActive) return null;
  const stops = lifecycles
    .map(c => c.stoppedAt)
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
  if (stops.length === 0) return null;
  // Lexicographic sort works for ISO timestamps — most recent last.
  stops.sort();
  return stops[stops.length - 1];
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
