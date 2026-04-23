/**
 * Per-tab data reliability summary.
 *
 * Every metric displayed on the four DM Campaign tabs is backed by one of three
 * sources: Aurora (monolith-written), PCM API, or the invoice-verified era
 * schedule in src/lib/pcm-pricing-eras.ts. This file captures the reliability
 * grade + caveats per tab so a single-line "ⓘ Data sources" hint can show the
 * reader how trustworthy the numbers in front of them are.
 *
 * Grades:
 *   - HIGH: single authoritative source, live updates, cross-checked where possible.
 *   - MEDIUM: single source but known sync lag or approximation.
 *   - LOW: known drift or stored-value corruption — do not trust as primary.
 *
 * Content mirrors the data-provenance ledger in
 * Design docs/audits/dm-campaign-consistency-audit-2026-04-17.md — update both
 * in the same change.
 */

export type ReliabilityGrade = 'HIGH' | 'MEDIUM' | 'LOW';

export interface MetricReliability {
  metric: string;
  grade: ReliabilityGrade;
  source: string;
  caveat?: string;
}

export type DmCampaignTab = 'overview' | 'operational-health' | 'business-results' | 'profitability';

export const DATA_RELIABILITY: Record<DmCampaignTab, MetricReliability[]> = {
  overview: [
    { metric: 'Lifetime pieces sent', grade: 'HIGH', source: 'dm_client_funnel + PCM /order cross-check' },
    { metric: 'Lifetime revenue', grade: 'HIGH', source: 'dm_client_funnel.total_cost' },
    { metric: 'Lifetime PCM cost', grade: 'HIGH', source: 'PCM /order × pcm-pricing-eras.ts' },
    { metric: 'Company margin %', grade: 'HIGH', source: 'Computed: revenue − PCM-invoice cost' },
    { metric: 'Active campaigns', grade: 'HIGH', source: 'rr_campaign_snapshots (hourly)' },
  ],
  'operational-health': [
    { metric: 'Is-it-running pulse', grade: 'HIGH', source: 'rr_campaign_snapshots (hourly)' },
    {
      metric: 'On-hold stale vs fresh',
      grade: 'MEDIUM',
      source: 'rr_campaign_snapshots snapshot history',
      caveat: 'Age inferred from campaign-level first-observed on-hold date — row-level piece ages live in monolith MySQL and do not sync to Aurora. Accurate for campaigns that are stable, approximate for campaigns with internal churn.',
    },
    { metric: 'Campaigns table on-hold badge', grade: 'MEDIUM', source: 'Same as above — uses the shared queryOnHoldAges helper' },
    { metric: 'Delivery rate', grade: 'HIGH', source: 'rr_daily_metrics (hourly)' },
    {
      metric: 'Send volume trend',
      grade: 'HIGH',
      source: 'rr_daily_metrics',
      caveat: '~5 days retained — "All time" charts use dm_property_conversions instead.',
    },
    { metric: 'Q2 volume goal + top contributors', grade: 'HIGH', source: 'rr_daily_metrics SUM in Q2 window' },
  ],
  'business-results': [
    { metric: 'Conversion funnel (leads/appts/deals)', grade: 'HIGH', source: 'dm_property_conversions cohort (first_sent_date in window)' },
    { metric: 'Client performance', grade: 'HIGH', source: 'dm_property_conversions per-domain cohort' },
    { metric: 'Mailing spend per client', grade: 'HIGH', source: 'dm_property_conversions.total_cost by first_sent_date' },
    { metric: 'Deal revenue per client', grade: 'HIGH', source: 'dm_property_conversions.became_deal_value by became_deal_at' },
    { metric: 'Template leaderboard', grade: 'HIGH', source: 'dm_property_conversions GROUP BY template' },
    { metric: 'Geographic breakdown', grade: 'HIGH', source: 'dm_property_conversions GROUP BY state' },
  ],
  profitability: [
    { metric: 'Margin summary (all-time)', grade: 'HIGH', source: 'Revenue (Aurora) − PCM /order × era rates' },
    { metric: 'Period summary (30d)', grade: 'HIGH', source: 'dm_volume_summary per-day split × era rates' },
    {
      metric: 'Customer rate (Std / FC)',
      grade: 'MEDIUM',
      source: 'dm_volume_summary 7-day blended average',
      caveat: 'Sync lag per mail class is surfaced inline — First Class currently ~5 days behind Standard.',
    },
    { metric: 'PCM vendor rate (Std / FC)', grade: 'HIGH', source: 'pcm-pricing-eras.ts (invoice-verified)' },
    {
      metric: 'Pricing history chart',
      grade: 'HIGH',
      source: 'dm_property_conversions (monthly) + era schedule overlay',
      caveat: 'Mid-month rate changes appear as dashed reference lines; the hosting month is a weighted blend.',
    },
    {
      metric: 'Aurora-vs-PCM cost delta',
      grade: 'LOW',
      source: 'dm_client_funnel.total_pcm_cost (stored)',
      caveat: 'Monolith writes $0.625/$0.875 rates instead of $0.63/$0.87 — used for reconciliation display only, never as primary. Delta is always shown.',
    },
    {
      metric: 'PCM vendor-rate drift alert',
      grade: 'MEDIUM',
      source: 'Manual commit review of pcm-pricing-eras.ts',
      caveat: 'Full automated drift detection is pending PCM invoice-total API access. Interim safeguard: any era change requires a reviewed commit.',
    },
  ],
};

export function reliabilitySummaryFor(tab: DmCampaignTab): MetricReliability[] {
  return DATA_RELIABILITY[tab];
}
