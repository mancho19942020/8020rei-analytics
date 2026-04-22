/**
 * Machine-readable widget contracts.
 *
 * Source of truth: docs/alignment-contracts.md (human-readable).
 * This file is the subset the reconciler actually executes against.
 *
 * Each entry is what gets emitted per reconciliation cycle (one Firestore doc
 * per entry, or three docs when `splits_by_campaign_type` is true).
 *
 * Initial coverage (Phase 3): widgets whose PCM ground truth is directly
 * produced by `computeHeadline()` / `computeSendTrend()` / `computeBalanceFlow()`.
 * Other widgets are registered here with `autocorrect_action = 'flag-monolith'`
 * and `pcm_value = null` (emit `info` severity) until their reconcilers land
 * in Phase 3b/c.
 */

import type { WidgetContract } from '@/types/pcm-alignment';
import { DEFAULT_THRESHOLDS } from '@/types/pcm-alignment';

export const WIDGET_CONTRACTS: readonly WidgetContract[] = [
  // ─── DM Overview tab ───
  {
    widget_key: 'dm-overview-headline',
    sub_key: 'active-clients',
    tab: 'overview',
    thresholds: DEFAULT_THRESHOLDS,
    autocorrect_action: 'flag-monolith',
    label: 'Active clients',
    splits_by_campaign_type: false,
  },
  {
    widget_key: 'dm-overview-headline',
    sub_key: 'lifetime-pieces',
    tab: 'overview',
    thresholds: DEFAULT_THRESHOLDS,
    autocorrect_action: 'refresh-cache',
    label: 'Lifetime pieces',
    splits_by_campaign_type: true,
  },
  {
    widget_key: 'dm-overview-headline',
    sub_key: 'company-margin',
    tab: 'overview',
    // Margin is sensitive — tighter tolerance + sign flip detection
    thresholds: { yellowPct: 1, redPct: 2, sign_flip_is_red: true },
    autocorrect_action: 'refresh-cache',
    label: 'Company margin',
    splits_by_campaign_type: false,
  },
  {
    widget_key: 'dm-overview-headline',
    sub_key: 'active-campaigns',
    tab: 'overview',
    thresholds: DEFAULT_THRESHOLDS,
    autocorrect_action: 'flag-monolith',
    label: 'Active campaigns',
    splits_by_campaign_type: false,
  },
  {
    widget_key: 'dm-overview-send-trend',
    sub_key: null,
    tab: 'overview',
    thresholds: DEFAULT_THRESHOLDS,
    autocorrect_action: 'refresh-cache',
    label: 'Send volume trend',
    splits_by_campaign_type: true,
  },
  {
    widget_key: 'dm-overview-test-cost-cards',
    sub_key: 'total',
    tab: 'overview',
    thresholds: DEFAULT_THRESHOLDS,
    autocorrect_action: 'refresh-cache',
    label: 'Internal test cost (total)',
    splits_by_campaign_type: false,
  },
  {
    widget_key: 'dm-overview-balance-flow',
    sub_key: 'account-balance',
    tab: 'overview',
    thresholds: DEFAULT_THRESHOLDS,
    autocorrect_action: 'refresh-cache',
    label: 'PCM account balance',
    splits_by_campaign_type: false,
  },

  // ─── Profitability tab ───
  {
    widget_key: 'pcm-margin-summary',
    sub_key: 'total-revenue',
    tab: 'profitability',
    thresholds: DEFAULT_THRESHOLDS,
    autocorrect_action: 'refresh-cache',
    label: 'Total revenue',
    splits_by_campaign_type: false,
  },
  {
    widget_key: 'pcm-margin-summary',
    sub_key: 'pcm-cost-clients',
    tab: 'profitability',
    // Tighter tolerance — this is the $20.6K vs $22.7K number Germán is asking about
    thresholds: { yellowPct: 1, redPct: 3 },
    autocorrect_action: 'refresh-cache',
    label: 'PCM cost (clients)',
    splits_by_campaign_type: true,
  },
  {
    widget_key: 'pcm-margin-summary',
    sub_key: 'gross-margin',
    tab: 'profitability',
    thresholds: { yellowPct: 1, redPct: 2, sign_flip_is_red: true },
    autocorrect_action: 'refresh-cache',
    label: 'Gross margin',
    splits_by_campaign_type: false,
  },
  {
    widget_key: 'pcm-margin-summary',
    sub_key: 'internal-test-cost',
    tab: 'profitability',
    thresholds: DEFAULT_THRESHOLDS,
    autocorrect_action: 'refresh-cache',
    label: 'Internal test cost',
    splits_by_campaign_type: false,
  },
  {
    widget_key: 'pcm-margin-summary',
    sub_key: 'net-company-margin',
    tab: 'profitability',
    // The cross-tab invariant — any drift = red
    thresholds: { yellowPct: 0.01, redPct: 0.01, sign_flip_is_red: true },
    autocorrect_action: 'refresh-cache',
    label: 'Net company margin',
    splits_by_campaign_type: false,
  },

  // ─── Stubs: no PCM-equivalent in Phase 3 scope ───
  // Reconciler emits `info` severity + a freshness stamp; Phase 3b/c adds real reconcilers.
  // Listed here so the widget chrome in Phase 4 can still read a "Reconciled: N min ago" footer.
  { widget_key: 'rr-operational-pulse',   sub_key: null, tab: 'operational-health', thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'Is it working?',           splits_by_campaign_type: false },
  { widget_key: 'rr-quality-metrics',     sub_key: null, tab: 'operational-health', thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'Quality metrics',         splits_by_campaign_type: false },
  { widget_key: 'rr-pcm-health',          sub_key: null, tab: 'operational-health', thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'refresh-cache', label: 'Is it aligned?',          splits_by_campaign_type: false },
  { widget_key: 'rr-postal-performance',  sub_key: null, tab: 'operational-health', thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'Postal performance',      splits_by_campaign_type: false },
  { widget_key: 'rr-q2-goal',             sub_key: null, tab: 'operational-health', thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'Q2 sends goal',           splits_by_campaign_type: false },
  { widget_key: 'rr-q2-top-contributors', sub_key: null, tab: 'operational-health', thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'Q2 top contributors',     splits_by_campaign_type: false },
  { widget_key: 'rr-campaign-table',      sub_key: null, tab: 'operational-health', thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'Campaign table',          splits_by_campaign_type: false },
  { widget_key: 'rr-sends-trend',         sub_key: null, tab: 'operational-health', thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'Sends trend',             splits_by_campaign_type: false },
  { widget_key: 'rr-system-coverage',     sub_key: null, tab: 'operational-health', thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'System coverage',         splits_by_campaign_type: false },
  { widget_key: 'rr-data-integrity',      sub_key: null, tab: 'operational-health', thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'refresh-cache', label: 'Data integrity',          splits_by_campaign_type: false },
  { widget_key: 'dm-funnel-overview',     sub_key: null, tab: 'business-results',   thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'Funnel overview',         splits_by_campaign_type: false },
  { widget_key: 'dm-client-performance',  sub_key: null, tab: 'business-results',   thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'Client performance',      splits_by_campaign_type: false },
  { widget_key: 'dm-template-leaderboard',sub_key: null, tab: 'business-results',   thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'Template leaderboard',    splits_by_campaign_type: false },
  { widget_key: 'dm-geo-breakdown',       sub_key: null, tab: 'business-results',   thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'none',          label: 'Geo breakdown',           splits_by_campaign_type: false },
  { widget_key: 'pcm-margin-period',      sub_key: null, tab: 'profitability',      thresholds: { yellowPct: 1, redPct: 2 }, autocorrect_action: 'flag-monolith', label: 'Period summary', splits_by_campaign_type: false },
  { widget_key: 'pcm-margin-trend',       sub_key: null, tab: 'profitability',      thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'none',          label: 'Pricing history',         splits_by_campaign_type: false },
  { widget_key: 'pcm-pricing-overview',   sub_key: null, tab: 'profitability',      thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'none',          label: 'Pricing overview',        splits_by_campaign_type: false },
  // Phase 3c: customer-rate drift detector. Compares the 7-day-avg rate against
  // the single most recent day's observed rate, per mail class. When they diverge
  // by >1%, either a rate transition is in progress OR orders landed at an
  // unexpected rate (monolith pricing update not propagated). Flag-only — we
  // can't "fix" customer pricing from the hub; the monolith owns the source.
  { widget_key: 'pcm-pricing-overview',   sub_key: 'standard-rate-drift',    tab: 'profitability', thresholds: { yellowPct: 1, redPct: 3 }, autocorrect_action: 'flag-monolith', label: 'Standard customer rate drift',    splits_by_campaign_type: false },
  { widget_key: 'pcm-pricing-overview',   sub_key: 'first-class-rate-drift', tab: 'profitability', thresholds: { yellowPct: 1, redPct: 3 }, autocorrect_action: 'flag-monolith', label: 'First Class customer rate drift', splits_by_campaign_type: false },
  { widget_key: 'pcm-data-match',         sub_key: null, tab: 'profitability',      thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'refresh-cache', label: 'Data match',              splits_by_campaign_type: false },
  { widget_key: 'pcm-domain-table',       sub_key: null, tab: 'profitability',      thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'flag-monolith', label: 'Domain breakdown',        splits_by_campaign_type: true  },
  { widget_key: 'pcm-template-table',     sub_key: null, tab: 'profitability',      thresholds: DEFAULT_THRESHOLDS, autocorrect_action: 'refresh-cache', label: 'Template catalog',        splits_by_campaign_type: false },
];

/** Contract ids that have a real Phase-3 reconciler. Others emit `info`. */
export const IMPLEMENTED_RECONCILERS = new Set<string>([
  'dm-overview-headline.active-clients',
  'dm-overview-headline.lifetime-pieces',
  'dm-overview-headline.company-margin',
  'dm-overview-headline.active-campaigns',
  'dm-overview-send-trend',
  'dm-overview-test-cost-cards.total',
  'dm-overview-balance-flow.account-balance',
  'pcm-margin-summary.total-revenue',
  'pcm-margin-summary.pcm-cost-clients',
  'pcm-margin-summary.gross-margin',
  'pcm-margin-summary.internal-test-cost',
  'pcm-margin-summary.net-company-margin',
  // Phase 3c — customer rate drift detection (data-driven, no hardcoded rates)
  'pcm-pricing-overview.standard-rate-drift',
  'pcm-pricing-overview.first-class-rate-drift',
]);

export function contractId(c: { widget_key: string; sub_key: string | null }): string {
  return c.sub_key ? `${c.widget_key}.${c.sub_key}` : c.widget_key;
}

/**
 * The set of widget `type` values that have a reconciliation contract.
 * Used by the Widget wrapper to decide whether to render the alignment tag —
 * non-DM-Campaign widgets (Users, Features, Engagement, Geography, etc.) do
 * NOT reconcile against PCM and must NOT show a "Reconciled Xm ago" tag.
 */
export const RECONCILED_WIDGET_KEYS: ReadonlySet<string> = new Set(
  WIDGET_CONTRACTS.map((c) => c.widget_key),
);

