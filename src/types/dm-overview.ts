/**
 * DM Campaign Overview — Type Definitions
 *
 * Powers the DM Campaign → Overview sub-tab. Every metric explicitly carries
 * its source and (where applicable) the Aurora-vs-PCM delta. The rule is:
 * never hide inconsistencies, surface them.
 *
 * "Revenue" on this tab means COMPANY margin (what our business makes), NOT
 * client revenue. Per the Apr 17, 2026 meeting with Camilo: the audience is
 * Camilo's boss and the CEO, who want "is this tool making the company
 * money?". Client revenue lives on the Business Results tab.
 */

export interface DmOverviewAdoption {
  activeClients: number;
  totalClients: number;
  adoptionPct: number;
  sourceNote: string;
}

export interface DmOverviewLifetimePieces {
  pcm: number;
  aurora: number;
  delta: number;
  deltaPct: number;
  auroraDomainCount: number;
  sourceNote: string;
}

export interface DmOverviewPcmCostCoverage {
  sendsWithPcm: number;
  sendsWithoutPcm: number;
  totalSends: number;
  coveragePct: number;
  revenueWithoutPcm: number;
}

export interface DmOverviewCompanyMargin {
  /** Company margin = gross margin (invoice-based) − internal test cost */
  margin: number;
  marginPct: number;
  clientRevenue: number;
  /** PCM cost computed from PCM /order × invoice-verified era rates */
  pcmCostReal: number;
  pcmCostTest: number;
  /** Gross margin — revenue − invoice-verified PCM cost */
  grossMargin: number;
  grossMarginPct?: number;
  /** Aurora monolith's stored total_pcm_cost (for reconciliation/drift display) */
  auroraStoredPcmCost?: number;
  auroraStoredMargin?: number;
  /** Delta: PCM-invoice cost − Aurora-stored cost. Non-zero means the monolith is drifting. */
  pcmVsAuroraCostDelta?: number;
  /** Coverage of Aurora's stored PCM cost — informational */
  coverage?: DmOverviewPcmCostCoverage;
  sourceNote: string;
}

export interface DmOverviewActiveCampaigns {
  active: number;
  total: number;
  sourceNote: string;
}

export interface DmOverviewTestDomainRow {
  domain: string;
  pieces: number;
  cost: number;
  firstDate: string;
  lastDate: string;
}

export interface DmOverviewTestActivity {
  pieces: number;
  cost: number;
  domainCount: number;
  domains: string[];
  allKnownTestDomains: string[];
  perDomain: DmOverviewTestDomainRow[];
  firstDate: string;
  lastDate: string;
  sourceNote: string;
}

export interface DmOverviewHeadline {
  fetchedAt: string;
  adoption: DmOverviewAdoption;
  lifetimePieces: DmOverviewLifetimePieces;
  companyMargin: DmOverviewCompanyMargin;
  activeCampaigns: DmOverviewActiveCampaigns;
  testActivity: DmOverviewTestActivity;
  meta?: { pcmTotalOrders: number; pcmCanceled: number };
}

export interface DmOverviewSendTrendPoint {
  month: string;
  total: number;
  firstClass: number;
  standard: number;
}

export interface DmOverviewSendTrend {
  series: DmOverviewSendTrendPoint[];
  sourceNote: string;
  fetchedAt: string;
}

export interface DmOverviewBalanceDaily {
  date: string;
  pieces: number;
  cost: number;
  testCost: number;
}

export interface DmOverviewBalanceFlow {
  series: DmOverviewBalanceDaily[];
  balance: number;
  totalCost: number;
  sourceNote: string;
  fetchedAt: string;
}
