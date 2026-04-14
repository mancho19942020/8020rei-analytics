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

export interface ProfitabilitySummary {
  totalRevenue: number;        // dm_client_funnel.total_cost (what we charge clients)
  totalPcmCost: number;        // dm_client_funnel.total_pcm_cost (what PCM charges us)
  grossMargin: number;         // revenue - PCM cost
  marginPercent: number;       // (margin / revenue) * 100
  totalSends: number;
  revenuePerPiece: number;
  pcmCostPerPiece: number;
  dataAvailable: boolean;      // false when new columns don't exist yet
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

export interface PriceAlertData {
  overallMarginPct: number;
  standardMarginPct: number | null;
  firstClassMarginPct: number | null;
  alertLevel: 'ok' | 'warning' | 'critical';
  alerts: string[];
}
