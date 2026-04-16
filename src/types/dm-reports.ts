/**
 * DM Reports — Type Definitions
 *
 * Types for the Reports tab in DM Campaign section.
 * Supports multiple report types with a registry pattern.
 */

// ─── Report Metadata ────────────────────────────────────────────

export interface ReportMetadata {
  id: string;
  slug: string;
  title: string;
  description: string;
  dateRange: { start: string; end: string };
  status: 'published' | 'draft';
  publishedDate: string;
  tags: string[];
}

export interface ReportCardPreview extends ReportMetadata {
  summary: {
    totalPieces: number;
    grossMarginPct: number;
    totalRevenue: number;
  } | null;
}

// ─── Profitability Report Data ──────────────────────────────────

export interface ExecutiveSummary {
  totalPieces: number;
  totalRevenue: number;
  totalPcmCost: number;
  grossMargin: number;
  marginPercent: number;
}

export interface DataQualityClient {
  domain: string;
  auroraSends: number;
  pcmOrders: number;
  delta: number;
  matchPercent: number;
}

export interface DataQuality {
  pcmOrders: number;
  auroraSends: number;
  delta: number;
  matchRate: number;
  clients: DataQualityClient[];
}

export interface PricingEra {
  label: string;
  period: string;
  fcRate: number;
  stdRate: number;
}

export interface MarginEra {
  period: string;
  pcmFc: number;
  pcmStd: number;
  ourFc: number;
  ourStd: number;
  marginFc: number;
  marginStd: number;
  status: string;
}

export interface MonthlyPcmCost {
  month: string;
  fcPieces: number;
  stdPieces: number;
  totalPieces: number;
  pcmCost: number;
  era: string;
}

export interface MonthlyRevenue {
  month: string;
  sends: number;
  revenue: number;
  avgRate: number;
}

export interface AllTimeSummary {
  totalSends: number;
  totalRevenue: number;
  totalPcmCost: number;
  grossMargin: number;
  marginPercent: number;
  revenuePerPiece: number;
  costPerPiece: number;
  marginPerPiece: number;
}

export interface ClientProfitability {
  domain: string;
  sends: number;
  revenue: number;
  pcmCost: number;
  margin: number;
  marginPercent: number;
  blendedRate: number;
}

export interface ProfitabilityReportData {
  executiveSummary: ExecutiveSummary;
  dataQuality: DataQuality;
  pricingHistory: {
    pcmEras: PricingEra[];
    customerEras: PricingEra[];
    marginEras: MarginEra[];
  };
  monthlyPcmCosts: MonthlyPcmCost[];
  monthlyRevenue: MonthlyRevenue[];
  allTimeSummary: AllTimeSummary;
  clientProfitability: ClientProfitability[];
  generatedAt: string;
}
