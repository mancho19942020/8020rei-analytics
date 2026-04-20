/**
 * PCM Validation Types
 *
 * Types for the PCM reconciliation data served by the backend.
 */

export interface PcmReconciliationSummary {
  lastRunAt: string | null;
  lastRunDurationMs: number;
  nextRunAt: string | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  error: string | null;

  // PCM account info
  pcmBalance: number;
  pcmOrderCount: number;
  pcmDesignCount: number;

  // Aurora totals
  auroraTotalSends: number;
  auroraTotalDelivered: number;
  auroraTotalCost: number;
  auroraDomainCount: number;

  // Comparison
  volumeDelta: number;
  volumeDeltaPercent: number;
  matchRate: number;

  // Breakdown
  domainBreakdown: PcmDomainBreakdownRow[];
  pcmStatusDistribution: Record<string, number>;
  pcmDesigns: PcmDesignSummary[];
}

export interface PcmDomainBreakdownRow {
  domain: string;
  auroraSends: number;
  auroraDelivered: number;
  auroraCost: number;
  auroraMailed: number;
  pcmOrders: number;
  delta: number;
}

export interface PcmDesignSummary {
  designID: number;
  name: string;
  productType: string;
  approvedDate: string;
  mailClasses: string[];
}

export interface PcmStatusComparison {
  pcm: Record<string, number>;
  aurora: {
    totalSends: number;
    totalDelivered: number;
  };
}

/** Aggregated data for all PCM validation widgets */
export interface PcmValidationData {
  summary: PcmReconciliationSummary | null;
  loading: boolean;
  error: string | null;
}

// ─── Profitability Types ──────────────────────────────────────

export interface PcmAuroraReconciliation {
  /** What Aurora's stored total_pcm_cost says (monolith-computed, often drifts) */
  auroraStoredPcmCost: number;
  /** Margin if you used Aurora's stored PCM cost instead of the invoice rate */
  auroraStoredMargin: number;
  /** PCM-invoice cost MINUS Aurora stored cost — non-zero means monolith drifts */
  pcmVsAuroraCostDelta: number;
  note: string;
}

export interface ProfitabilitySummary {
  totalRevenue: number;        // dm_client_funnel.total_cost (what we charge clients)
  totalPcmCost: number;        // PCM /order × invoice-verified era rates (authoritative)
  grossMargin: number;         // computed: revenue - PCM-invoice cost
  marginPercent: number;       // (margin / revenue) * 100
  totalSends: number;
  /** Pieces counted in the invoice-cost figure (from PCM /order) */
  pcmPiecesInvoice?: number;
  revenuePerPiece: number;
  pcmCostPerPiece: number;
  dataAvailable: boolean;
  reconciliation?: PcmAuroraReconciliation;
}

export interface MailClassMargin {
  mailClass: 'standard' | 'first_class';
  sends: number;
  revenue: number;
  pcmCost: number;
  margin: number;
  marginPercent: number;
}

export interface ClientMarginRow {
  domain: string;
  sends: number;
  revenue: number;
  pcmCost: number;
  margin: number;
  marginPercent: number;
}

export interface MarginTrendPoint {
  date: string;
  dailyRevenue: number;
  dailyPcmCost: number;
  dailyMargin: number;
}

export interface RateHistoryPoint {
  month: string;           // YYYY-MM
  ourFcRate: number;       // what we charge per FC piece
  ourStdRate: number;      // what we charge per Std piece
  pcmFcRate: number;       // what PCM charges per FC piece
  pcmStdRate: number;      // what PCM charges per Std piece
  fcMargin: number;        // ourFcRate - pcmFcRate
  stdMargin: number;       // ourStdRate - pcmStdRate
  blendedMargin: number;   // weighted avg margin
  fcSends: number;         // FC volume for that month
  stdSends: number;        // Std volume for that month
}

export interface RateHistoryData {
  trend: RateHistoryPoint[];
  dataAvailable: boolean;
}

export interface PriceAlertData {
  overallMarginPct: number;
  standardMarginPct: number | null;
  firstClassMarginPct: number | null;
  alertLevel: 'ok' | 'warning' | 'critical';
  alerts: string[];
}

// ─── Price Change Detection Types ────────────────────────────

export interface DetectedPriceChange {
  changeDate: string;
  mailClass: 'standard' | 'first_class';
  oldRate: number;
  newRate: number;
  rateDelta: number;
  sendsOnChangeDay: number;
}

export interface RolloutDomain {
  domain: string;
  currentRate: number;
  migrated: boolean;
  lastSendDate: string;
}

export interface RolloutStatus {
  newRate: number;
  migratedDomains: number;
  pendingDomains: number;
  totalDomains: number;
  domains: RolloutDomain[];
}

export interface PriceDetectionData {
  currentRates: {
    standard: number | null;
    firstClass: number | null;
    periodStart: string | null;
    periodEnd: string | null;
  };
  changes: DetectedPriceChange[];
  rolloutStatus: {
    standard: RolloutStatus | null;
    firstClass: RolloutStatus | null;
  };
  dataAvailable: boolean;
}

export interface PriceImpactEntry {
  mailClass: 'standard' | 'first_class';
  changeDate: string;
  beforeRate: number;
  afterRate: number;
  rateDelta: number;
  beforeDailyMargin: number;
  afterDailyMargin: number;
  marginDelta: number;
  beforeRevenuePerPiece: number;
  afterRevenuePerPiece: number;
  projectedMonthlyMarginImpact: number;
  daysSinceChange: number;
  totalImpactSinceChange: number;
}

export interface PriceImpactData {
  impacts: PriceImpactEntry[];
  dataAvailable: boolean;
}

export interface CurrentRatesData {
  /** What 8020REI charges customers — derived from dm_volume_summary last 7 days */
  standard: number | null;
  firstClass: number | null;
  blended: number | null;
  /** What PCM charges 8020REI — invoice-verified era rates (NOT monolith-derived) */
  pcmStandard?: number;
  pcmFirstClass?: number;
  pcmEraLabel?: string;
  pcmEraStart?: string;
  periodStart: string | null;
  periodEnd: string | null;
  dataAvailable: boolean;
}

// ─── Pricing History Types ───────────────────────────────────

export interface PricingHistoryPoint {
  date: string;
  ourStandardRate: number | null;
  pcmStandardRate: number | null;
  ourFirstClassRate: number | null;
  pcmFirstClassRate: number | null;
  standardSends: number;
  firstClassSends: number;
}

export interface PricingHistoryData {
  trend: PricingHistoryPoint[];
  dataAvailable: boolean;
}
