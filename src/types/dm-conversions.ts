/**
 * DM Campaign Business Results — Type Definitions
 *
 * Data interfaces for Layer 2 of the DM Campaign tab.
 * Maps to 3 Aurora tables: dm_property_conversions, dm_template_performance, dm_client_funnel
 */

// ---------------------------------------------------------------------------
// Funnel Stages
// ---------------------------------------------------------------------------

export type FunnelStage = 'prospect' | 'lead' | 'appointment' | 'contract' | 'deal';

export type AttributionStatus = 'attributed' | 'other_campaign' | 'unattributed' | 'prospect';

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
}

export interface DmClientPerformanceRow {
  domain: string;
  totalMailed: number;
  totalSends: number;
  totalDelivered: number;
  leads: number;
  appointments: number;
  deals: number;
  totalCost: number;
  totalRevenue: number;
  roas: number;
  leadConversionRate: number;
  dealConversionRate: number;
}

export interface DmGeoRow {
  state: string;
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
