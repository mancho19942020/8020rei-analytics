/**
 * PCM Alignment — type definitions
 *
 * The audit log produced by the 30-min reconciler. One `AlignmentDoc` per
 * (widget × campaign_type × run) is written to the Firestore collection
 * `pcm_alignment_runs`. Widgets read the latest doc per widget_key to
 * render the drift footer + InconsistencyIcon.
 *
 * Spec: personal-documents/8020-metrics-hub/2026-04-22/phase-2-schema.md
 * Contract: docs/alignment-contracts.md
 */

export type AlignmentSeverity = 'green' | 'yellow' | 'red' | 'info';

export type AlignmentCampaignType = 'total' | 'rr' | 'smartdrop';

export type AlignmentAutocorrectAction = 'none' | 'refresh-cache' | 'flag-monolith';

export type AlignmentTab =
  | 'overview'
  | 'operational-health'
  | 'business-results'
  | 'profitability';

/**
 * One row in the Firestore audit log.
 *
 * Document id convention:
 *   `<run_id>__<widget_key>[__<sub_key>][__<campaign_type>]`
 *
 * Example: `2026-04-22T14:00:00Z__dm-overview-headline__company-margin__total`
 */
export interface AlignmentDoc {
  run_id: string;                         // ISO timestamp bucketed per cron run
  widget_key: string;                     // Matches defaultLayouts.ts widget type id
  sub_key: string | null;                 // Sub-metric within a widget (e.g. 'company-margin')
  campaign_type: AlignmentCampaignType;   // 'total' | 'rr' | 'smartdrop'
  tab: AlignmentTab;
  hub_value: number | null;               // What the hub shows
  pcm_value: number | null;               // What PCM reports (null for Aurora-only metrics)
  delta: number | null;                   // hub − pcm (null if no pcm equivalent)
  delta_pct: number | null;               // 100 * delta / pcm (null if no pcm equivalent)
  severity: AlignmentSeverity;
  autocorrect_action: AlignmentAutocorrectAction;
  autocorrected: boolean;                 // Did the reconciler actually correct it this run?
  notes: Record<string, unknown>;         // Free-form JSON for root-cause attribution
  computed_at: string;                    // ISO timestamp, same as serverTimestamp in Firestore
}

/**
 * The shape a widget reads from GET /api/pcm-alignment/latest?widget_key=xxx.
 * Groups all sub_key × campaign_type variants for a single widget_key.
 */
export interface WidgetAlignmentPayload {
  widget_key: string;
  last_computed_at: string | null;         // max(computed_at) across the returned docs
  sub_metrics: Record<string, AlignmentSubMetric>;
}

export interface AlignmentSubMetric {
  total: AlignmentDoc | null;
  rr: AlignmentDoc | null;
  smartdrop: AlignmentDoc | null;
}

/**
 * Threshold override per widget_key/sub_key, per docs/alignment-contracts.md.
 * Defaults come from the contract: green <1%, yellow 1–5%, red >5%.
 */
export interface AlignmentThresholds {
  yellowPct: number;        // above this → yellow
  redPct: number;           // above this → red
  sign_flip_is_red?: boolean; // margin sign flip always red regardless of magnitude
}

export const DEFAULT_THRESHOLDS: AlignmentThresholds = {
  yellowPct: 1,
  redPct: 5,
};

/**
 * Contract row — the shape of the per-widget reconciliation definition.
 * Used by the reconciler to know what to compute + compare + store.
 */
export interface WidgetContract {
  widget_key: string;
  sub_key: string | null;
  tab: AlignmentTab;
  thresholds: AlignmentThresholds;
  autocorrect_action: AlignmentAutocorrectAction;
  /** Human-readable label used in alerts and UI tooltips. */
  label: string;
  /** If true, the reconciler emits three rows per cycle (total/rr/smartdrop). */
  splits_by_campaign_type: boolean;
}

/**
 * Result of one reconciliation pass — what /api/pcm-alignment/reconcile returns.
 */
export interface ReconcileRunResult {
  run_id: string;
  dry_run: boolean;
  docs_written: number;
  autocorrections_applied: number;
  alerts_fired: number;
  severity_counts: Record<AlignmentSeverity, number>;
  duration_ms: number;
  errors: string[];
}
