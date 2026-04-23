/**
 * DM Campaign Business Results — Type Definitions
 *
 * Data interfaces for Layer 2 of the DM Campaign tab.
 * Maps to 3 Aurora tables: dm_property_conversions, dm_template_performance, dm_client_funnel
 */

// ---------------------------------------------------------------------------
// Funnel Stages & Data Integrity
// ---------------------------------------------------------------------------

export type FunnelStage = 'prospect' | 'lead' | 'appointment' | 'contract' | 'deal';

export type AttributionStatus = 'attributed' | 'other_campaign' | 'unattributed' | 'prospect';

/** ROAS confidence level — applied server-side based on data integrity rules */
export type RoasConfidence = 'confident' | 'low_sample' | 'revenue_no_deal' | 'none';

/**
 * Conversion confidence — flags data integrity issues on individual property conversions.
 * - clean: Conversion date is after first send with a reasonable time gap
 * - flagged: Conversion date is after first send but may be an auto-dated late upload
 *   (e.g., lead and deal on same day, or isBackfilled=true, or conversion within 2 days of sync)
 * - pre_send: Conversion date is before or equal to first send date (excluded from counts)
 * - short_window: Deal closed within 30 days of first send (suspicious for cash deals)
 */
export type ConversionConfidence = 'clean' | 'flagged' | 'pre_send' | 'short_window';

// ---------------------------------------------------------------------------
// dm_property_conversions
// ---------------------------------------------------------------------------

export interface DmPropertyConversion {
  domain: string;
  propertyId: number;
  campaignId: number;
  campaignName: string;
  campaignType: 'rr' | 'smartdrop';
  templateId: number;
  templateName: string;
  templateType: string;
  address: string;
  county: string;
  state: string;
  firstSentDate: string | null;
  lastSentDate: string | null;
  totalSends: number;
  totalDelivered: number;
  totalCost: number;
  hasFollowUp: boolean;
  currentStatus: string;
  becameLeadAt: string | null;
  becameAppointmentAt: string | null;
  becameContractAt: string | null;
  becameDealAt: string | null;
  isBackfilled: boolean;
  dealRevenue: number | null;
  dealSoldPrice: number | null;
  daysToLead: number | null;
  daysToDeal: number | null;
  leadsource: string | null;
  attributionStatus: AttributionStatus;
  /** Data integrity: confidence level for this property's conversion dates */
  conversionConfidence: ConversionConfidence;
  /** True when days_to_deal < 30 — suspicious for cash conversion cycle */
  shortConversionWarning: boolean;
}

// ---------------------------------------------------------------------------
// dm_template_performance
// ---------------------------------------------------------------------------

export interface DmTemplatePerformance {
  domain: string;
  templateId: number;
  templateName: string;
  templateType: string;
  totalSent: number;
  totalDelivered: number;
  deliveryRate: number;
  totalCost: number;
  uniqueProperties: number;
  leadsGenerated: number;
  appointmentsGenerated: number;
  contractsGenerated: number;
  dealsGenerated: number;
  leadConversionRate: number;
  dealConversionRate: number;
  totalRevenue: number;
  roas: number;
  avgDaysToLead: number;
  campaignsUsing: number;
  /** Data integrity: ROAS confidence level */
  roasConfidence: RoasConfidence;
  /** Data integrity: true when delivered=0 but leads>0 */
  deliveryWarning: boolean;
}

// ---------------------------------------------------------------------------
// dm_client_funnel
// ---------------------------------------------------------------------------

export interface DmClientFunnel {
  date: string;
  domain: string;
  campaignType: 'rr' | 'smartdrop';
  activeCampaigns: number;
  totalPropertiesMailed: number;
  totalSends: number;
  totalDelivered: number;
  prospects: number;
  leads: number;
  appointments: number;
  contracts: number;
  deals: number;
  prospectToLeadRate: number;
  leadToAppointmentRate: number;
  appointmentToDealRate: number;
  totalCost: number;
  totalRevenue: number;
  roas: number;
  topTemplateId: number | null;
  topTemplateName: string | null;
  unattributedConversions: number;
}

// ---------------------------------------------------------------------------
// Aggregated / Computed Types for Widgets
// ---------------------------------------------------------------------------

export interface DmFunnelOverview {
  totalMailed: number;
  totalDelivered: number;
  prospects: number;
  leads: number;
  appointments: number;
  contracts: number;
  deals: number;
  prospectToLeadRate: number;
  leadToAppointmentRate: number;
  appointmentToContractRate: number;
  contractToDealRate: number;
  overallConversionRate: number;
  totalCost: number;
  totalRevenue: number;
  roas: number;
  roasConfidence: RoasConfidence;
}

export interface DmClientPerformanceRow {
  domain: string;
  campaignType: string;
  activeCampaigns: number;
  /** Per-product (active, total) breakdown — e.g. { rr: {active: 2, total: 3}, smartdrop: {active: 1, total: 1} }.
   *  Used to render stacked "N RR · M SD" tags per client. */
  campaignBreakdown: Record<string, { active: number; total: number }>;
  totalMailed: number;
  totalSends: number;
  totalDelivered: number;
  leads: number;
  appointments: number;
  contracts: number;
  deals: number;
  totalCost: number;
  totalRevenue: number;
  roas: number;
  leadConversionRate: number;
  dealConversionRate: number;
  /** Cost per lead: totalCost / leads. Null when no leads. */
  costPerLead: number | null;
  /** Data integrity: ROAS confidence level */
  roasConfidence: RoasConfidence;
  unattributedConversions: number;
  /** Sync warning — shown when property data is still loading for this domain */
  syncWarning?: string | null;
  /** Best-available "stopped on" date for fully-inactive clients (zero active
   *  campaigns). Matches the per-campaign stoppedAt in Operational Health →
   *  Campaign table — both derive from the shared `campaign-lifecycle` helper.
   *  Null when any campaign is active (client still running work). */
  stoppedAt?: string | null;
  /** Provenance of stoppedAt — same semantics as `RrCampaignSnapshot.stoppedAtSource`. */
  stoppedAtSource?: 'observed' | 'last-sent' | null;
}

export interface DmGeoRow {
  /** Display label — county name or MSA name */
  geoLabel: string;
  /** 'county' for dense markets, 'msa' for rolled-up metro areas */
  geoType: 'county' | 'msa';
  state: string;
  /** @deprecated Use geoLabel instead — kept for backwards compat during migration */
  county: string;
  totalMailed: number;
  leads: number;
  deals: number;
  leadConversionRate: number;
  dealConversionRate: number;
  totalRevenue: number;
}

export interface DmDataQuality {
  totalProperties: number;
  attributedCount: number;
  unattributedCount: number;
  attributionRate: number;
  backfilledCount: number;
  backfilledRate: number;
  zeroRevenueDealCount: number;
  preSendConversions: number;
  totalClients?: number;
  totalTemplates?: number;
  deliveryIssues?: number;
  revenueMismatch?: number;
  propertyDataAvailable?: boolean;
}

// ---------------------------------------------------------------------------
// Alerts (Layer 2 — Business Results)
// ---------------------------------------------------------------------------

export type DmAlertSeverity = 'critical' | 'warning' | 'info';

export interface DmAlert {
  id: string;
  name: string;
  severity: DmAlertSeverity;
  category: 'dm-business-results';
  description: string;
  entity?: string;
  metrics?: {
    baseline?: number;
    current?: number;
    change_pct?: number;
  };
  detected_at: string;
  action: string;
}

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

export interface DmConversionsApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  cached?: boolean;
}
