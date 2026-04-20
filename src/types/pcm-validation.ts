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
  totalPcmCost: number;        // PCM /order × invoice-verified era rates — REAL clients only
  grossMargin: number;         // computed: revenue - PCM-invoice cost (real clients, before test)
  /** Gross margin as percent of revenue. */
  grossMarginPct?: number;
  /**
   * Net company margin = grossMargin − internalTestCost. Cross-tab consistency
   * contract: this value MUST equal the Overview Company margin card's `.margin`.
   * Both read from the same dm_overview_cache.headline payload; if they drift,
   * scripts/diagnose-cross-tab-consistency.ts flags it.
   */
  netCompanyMargin?: number;
  netCompanyMarginPct?: number;
  /**
   * PCM-invoice cost of internal test-domain sends (QA / sandbox). 8020REI paid
   * PCM for these; no client revenue. Deducted from gross margin in the net
   * company margin above so the P&L is honest.
   */
  internalTestCost?: number;
  /** Legacy alias — historically meant gross margin %. Kept to avoid breaking
   *  existing consumers. New code should use `grossMarginPct` or `netCompanyMarginPct`. */
  marginPercent: number;
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
  /** True when this point represents the in-progress current month. For the
   *  current month, ourFcRate / ourStdRate come from the most recent daily
   *  rate in dm_volume_summary — not a monthly weighted blend — so the last
   *  point always reflects the rate clients are charged today. */
  isCurrentMonth?: boolean;
}

export interface RateHistoryData {
  trend: RateHistoryPoint[];
  dataAvailable: boolean;
  /** Metadata on the current-month point: which dates the latest-rate overrides
   *  came from (or null if no current-month data was available and we fell
   *  back to the blend). Lets the widget render a footnote like
   *  "Current month: latest rate as of YYYY-MM-DD". */
  currentMonth?: {
    month: string;
    standardLatestDate: string | null;
    firstClassLatestDate: string | null;
  };
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

export interface MailClassCoverage {
  /** Most recent sync date for this mail class in dm_volume_summary (YYYY-MM-DD). */
  lastSyncedDate: string;
  /** Distinct date count — reflects the rolling retention window (~5–7 days typically). */
  daysSynced: number;
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
  /**
   * Sync coverage per mail class. Surfaces Aurora sync lag honestly so readers
   * can see when a missing rate change is due to monolith sync lag rather than
   * a bug in the detection query. Added 2026-04-20 after the session surfaced
   * First Class price change not appearing due to Apr 15 being the last
   * FC-synced date.
   */
  coverage?: {
    standard: MailClassCoverage | null;
    firstClass: MailClassCoverage | null;
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
  /** Per-mail-class last synced date + days available. Lets the widget show a
   *  "synced through YYYY-MM-DD" footer so a flat customer-rate line isn't
   *  mistaken for "prices never changed" when the real cause is sync lag. */
  coverage?: {
    standard: MailClassCoverage | null;
    firstClass: MailClassCoverage | null;
  };
  dataAvailable: boolean;
}
