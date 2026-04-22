/**
 * Rapid Response Type Definitions
 *
 * Data interfaces for the Rapid Response tab.
 * Maps to the 3 Aurora tables: rr_campaign_snapshots, rr_daily_metrics, rr_pcm_alignment
 */

// ---------------------------------------------------------------------------
// System Status (computed from all 3 tables)
// ---------------------------------------------------------------------------

export type SystemHealthLevel = 'healthy' | 'warning' | 'critical' | 'awaiting-data';

export interface RrSystemStatus {
  level: SystemHealthLevel;
  headline: string;
  detail: string;
  lastSyncAt: string | null;
}

// ---------------------------------------------------------------------------
// Operational Pulse (from rr_campaign_snapshots)
// ---------------------------------------------------------------------------

export interface RrCampaignSnapshot {
  campaignId: string;
  campaignName: string;
  domain: string;
  campaignType: 'rr' | 'smartdrop';
  status: string;
  totalSent: number;
  totalDelivered: number;
  lastSentDate: string | null;
  lettersDelivered30d: number;
  postcardsDelivered30d: number;
  onHoldCount: number;
  followUpPendingCount: number;
  smartdropAuthorizationStatus: string | null;
  snapshotAt: string;
  /** Days since this campaign first showed on_hold_count > 0 in rr_campaign_snapshots.
   *  Null when the campaign currently has no on-hold pieces. Used to render the
   *  fresh / stale badge next to the On-hold column. Age is inferred from
   *  snapshot history (row-level rapid_response_history does not sync to Aurora). */
  daysSinceFirstHold: number | null;
  /** 'stale' if daysSinceFirstHold ≥ 7 (overdue for monolith auto-delivery timer),
   *  'fresh' if < 7, null if no on-hold. */
  onHoldAgeBucket: 'stale' | 'fresh' | null;
}

export interface RrOperationalPulse {
  activeCampaigns: number;
  totalCampaigns: number;
  sendsToday: number;
  /** Pieces sent month-to-date (from day 1 of current month through today). Added 2026-04-22 for the Ops status strip. */
  sendsThisMonth: number;
  lastSendTime: string | null;
  totalOnHold: number;
  /** Pieces in campaigns where first on-hold ≥ 7 days ago (monolith timer gap). */
  staleOnHold: number;
  /** Pieces in campaigns where first on-hold < 7 days ago (within normal window). */
  freshOnHold: number;
  /** Count of campaigns whose on-hold age is stale. */
  staleCampaigns: number;
  /** Oldest days-in-on-hold across any campaign currently holding pieces. */
  oldestOnHoldDays: number;
  totalFollowUpPending: number;
}

// ---------------------------------------------------------------------------
// Quality Metrics (from rr_daily_metrics)
// ---------------------------------------------------------------------------

export interface RrDailyMetric {
  date: string;
  domain: string;
  campaignType: string;
  sendsTotal: number;
  sendsSuccess: number;
  sendsOnHold: number;
  sendsProtected: number;
  sendsUndeliverable: number;
  sendsError: number;
  deliveredCount: number;
  costTotal: number;
  avgUnitCost: number;
  pcmSubmissionRate: number;
  deliveryRate30d: number;
  followUpSent: number;
  followUpFailed: number;
}

export interface RrQualityMetrics {
  /** Lifetime delivery rate from dm_client_funnel (same source as PCM & profitability tab) */
  deliveryRate30d: number;
  /** Lifetime total mail pieces sent (from dm_client_funnel) — for cross-tab verification */
  lifetimeSent: number;
  /** Lifetime total mail pieces delivered (from dm_client_funnel) — for cross-tab verification */
  lifetimeDelivered: number;
  /**
   * PCM authoritative lifetime piece count — sum of /order results (non-canceled, excluding test domains).
   * Exact same number as the DM Campaign Overview → Lifetime pieces card. When this is present the widget
   * should render PCM as the primary number and Aurora (lifetimeSent) as a visible delta. Null if the
   * dm_overview_cache has not yet been warmed (cron runs every 30 min).
   */
  lifetimePiecesPcm: number | null;
  /** Aurora − PCM (usually negative: in-pipeline pieces not yet counted in Aurora). Null when pcm count absent. */
  piecesDelta: number | null;
  /** (piecesDelta / lifetimePiecesPcm) × 100, rounded. Null when pcm count absent. */
  piecesDeltaPct: number | null;
  /** @deprecated Use lifetimeSent. Previously: pre-computed pcm_submission_rate from rr_daily_metrics */
  pcmSubmissionRate: number;
  errorRate: number;
  sendsTotal7d: number;
  deliveredTotal7d: number;
}

// ---------------------------------------------------------------------------
// PCM Alignment (from rr_pcm_alignment)
// ---------------------------------------------------------------------------

export interface RrPcmAlignmentRow {
  checkedAt: string;
  domain: string;
  staleSentCount: number;
  orphanedOrdersCount: number;
  oldestStaleDays: number;
  vendorStatusBreakdown: Record<string, number>;
  deliveryLagMedianDays: number;
  deliveryLagP95Days: number;
  undeliverableRate7d: number;
  backOfficeSyncGap: number;
}

/**
 * A single domain flagged for a specific alignment issue. `value` is the count
 * of the issue (e.g., stale pieces, orphan orders, sync-gap orders). `detail`
 * is optional human-readable context (e.g., "oldest: 23d" for stale).
 * `isActive` distinguishes currently-active DM clients (priority to fix) from
 * legacy clients no longer running DM campaigns (cleanup queue).
 */
export interface RrPcmDomainIssue {
  domain: string;
  value: number;
  detail?: string;
  isActive: boolean;
}

export interface RrPcmHealth {
  staleSentCount: number;
  orphanedOrdersCount: number;
  oldestStaleDays: number;
  deliveryLagMedianDays: number;
  backOfficeSyncGap: number;
  undeliverableRate7d: number;
  // Domain-level alignment counts
  totalDomains: number;
  syncedDomains: number;
  domainsWithGaps: number;
  domainsWithStale: number;
  domainsWithOrphaned: number;
  // Per-domain issue lists — sorted by value descending so the worst offenders
  // lead. Empty arrays are valid (everything healthy).
  gapDomains: RrPcmDomainIssue[];
  staleDomains: RrPcmDomainIssue[];
  orphanedDomains: RrPcmDomainIssue[];
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export type RrAlertSeverity = 'critical' | 'warning' | 'info';

export interface RrAlert {
  id: string;
  name: string;
  severity: RrAlertSeverity;
  category: 'rapid-response';
  description: string;
  entity?: string;
  metrics?: {
    baseline?: number;
    current?: number;
    change_pct?: number;
  };
  detected_at: string;
  action: string;
  link?: string;
}

// ---------------------------------------------------------------------------
// Q2 Volume Goal (from rr_daily_metrics, Q2 2026 date range)
// ---------------------------------------------------------------------------

export interface RrQ2GoalClientRow {
  domain: string;
  campaignType: string;
  totalSends: number;
  lifetimeSends: number;
}

export interface RrQ2Goal {
  target: number;
  currentSends: number;
  deliveredCount: number;
  totalCost: number;
  daysElapsed: number;
  daysRemaining: number;
  activeClients: number;
  progressPercent: number;
  weeklyPace: number;
  requiredWeeklyPace: number;
  onTrack: boolean;
  clientBreakdown: RrQ2GoalClientRow[];
}

// ---------------------------------------------------------------------------
// Aggregated data for the tab
// ---------------------------------------------------------------------------

export interface RrStatusBreakdown {
  status: string;
  count: number;
}

export interface RapidResponseData {
  systemStatus: RrSystemStatus;
  operationalPulse: RrOperationalPulse;
  qualityMetrics: RrQualityMetrics;
  pcmHealth: RrPcmHealth;
  dailyTrend: RrDailyMetric[];
  statusBreakdown: RrStatusBreakdown[];
  campaigns: RrCampaignSnapshot[];
  alerts: RrAlert[];
  vendorStatusBreakdown: Record<string, number>;
}
