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
}

export interface RrOperationalPulse {
  activeCampaigns: number;
  totalCampaigns: number;
  sendsToday: number;
  lastSendTime: string | null;
  totalOnHold: number;
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

export interface RrPcmHealth {
  staleSentCount: number;
  orphanedOrdersCount: number;
  oldestStaleDays: number;
  deliveryLagMedianDays: number;
  backOfficeSyncGap: number;
  undeliverableRate7d: number;
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

export interface RrCostPoint {
  date: string;
  costTotal: number;
  avgUnitCost: number;
  sendsTotal: number;
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
  costTrend: RrCostPoint[];
  vendorStatusBreakdown: Record<string, number>;
}
