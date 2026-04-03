/**
 * RapidResponseTab Component
 *
 * Features > 8020REI > Rapid Response tab.
 * Displays operational health, quality metrics, PCM alignment, and alerts
 * from the rr_campaign_snapshots, rr_daily_metrics, rr_pcm_alignment Aurora tables.
 *
 * Narrative layout: Verdict → Three Pillars → Trends → Alerts → Drill-Down
 *
 * Data source: AWS Aurora PostgreSQL via RDS Data API
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { buildDateQueryString } from '@/lib/date-utils';
import { AxisSkeleton, AxisCallout, AxisButton, AxisTag, AxisDomainSearch } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  RrOperationalPulseWidget,
  RrQualityMetricsWidget,
  RrPcmHealthWidget,
  RrSendsTrendWidget,
  RrStatusBreakdownWidget,
  RrAlertsFeedWidget,
  RrCampaignTableWidget,
  RrCostOverviewWidget,
  DmAlertsFeedWidget,
  DmFunnelOverviewWidget,
  DmClientPerformanceWidget,
  DmTemplateLeaderboardWidget,
  DmConversionTrendWidget,
  DmRoasTrendWidget,
  DmGeoBreakdownWidget,
  DmDataQualityWidget,
  DmPropertyTimelineModal,
} from '@/components/workspace/widgets';
import {
  DEFAULT_RAPID_RESPONSE_LAYOUT,
  RAPID_RESPONSE_LAYOUT_STORAGE_KEY,
  RAPID_RESPONSE_WIDGET_CATALOG,
  DEFAULT_DM_BUSINESS_RESULTS_LAYOUT,
  DM_BUSINESS_RESULTS_LAYOUT_STORAGE_KEY,
  DM_BUSINESS_RESULTS_WIDGET_CATALOG,
} from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import type {
  RrSystemStatus,
  RrOperationalPulse,
  RrQualityMetrics,
  RrPcmHealth,
  RrDailyMetric,
  RrCampaignSnapshot,
  RrAlert,
  RrStatusBreakdown,
  RrCostPoint,
} from '@/types/rapid-response';
import type {
  DmFunnelOverview,
  DmClientPerformanceRow,
  DmTemplatePerformance,
  DmGeoRow,
  DmDataQuality,
  DmAlert,
} from '@/types/dm-conversions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RapidResponseData {
  systemStatus: RrSystemStatus | null;
  operationalPulse: RrOperationalPulse | null;
  qualityMetrics: RrQualityMetrics | null;
  pcmHealth: RrPcmHealth | null;
  dailyTrend: RrDailyMetric[];
  statusBreakdown: RrStatusBreakdown[];
  campaigns: RrCampaignSnapshot[];
  alerts: RrAlert[];
  costTrend: RrCostPoint[];
}

interface BusinessResultsData {
  funnelOverview: DmFunnelOverview | null;
  clientPerformance: DmClientPerformanceRow[];
  templateLeaderboard: DmTemplatePerformance[];
  geoBreakdown: DmGeoRow[];
  dataQuality: DmDataQuality | null;
  alerts: DmAlert[];
  conversionTrend: { date: string; leads: number; appointments: number; contracts: number; deals: number }[];
  roasTrend: { date: string; totalCost: number; totalRevenue: number; roas: number }[];
}

interface RapidResponseTabProps {
  days: number;
  startDate?: string;
  endDate?: string;
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
  activeSubTab?: string;
}

// ---------------------------------------------------------------------------
// Mock data for preview when Aurora tables are empty
// ---------------------------------------------------------------------------

function generateMockTrend(days: number) {
  const data = [];
  const base = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const leads = Math.floor(Math.random() * 12) + 2;
    const appts = Math.floor(leads * (0.3 + Math.random() * 0.2));
    const deals = Math.floor(appts * (0.2 + Math.random() * 0.15));
    data.push({ date: dateStr, leads, appointments: appts, contracts: Math.floor(appts * 0.6), deals });
  }
  return data;
}

function generateMockRoasTrend(days: number) {
  const data = [];
  const base = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const cost = Math.floor(Math.random() * 800) + 200;
    const rev = Math.floor(cost * (1.2 + Math.random() * 2));
    data.push({ date: dateStr, totalCost: cost, totalRevenue: rev, roas: Number((rev / cost).toFixed(2)) });
  }
  return data;
}

const MOCK_BUSINESS_RESULTS: BusinessResultsData = {
  funnelOverview: {
    totalMailed: 14280,
    prospects: 12450,
    leads: 1240,
    appointments: 385,
    contracts: 142,
    deals: 53,
    prospectToLeadRate: 8.68,
    leadToAppointmentRate: 31.05,
    appointmentToContractRate: 36.88,
    contractToDealRate: 37.32,
    overallConversionRate: 0.37,
  },
  clientPerformance: [
    { domain: 'smith_investments_8020rei_com', totalMailed: 3200, totalSends: 4100, totalDelivered: 3800, leads: 310, appointments: 95, deals: 14, totalCost: 4680, totalRevenue: 28400, roas: 6.07, leadConversionRate: 9.69, dealConversionRate: 0.44 },
    { domain: 'martinez_realty_8020rei_com', totalMailed: 2800, totalSends: 3500, totalDelivered: 3200, leads: 245, appointments: 72, deals: 11, totalCost: 3920, totalRevenue: 19800, roas: 5.05, leadConversionRate: 8.75, dealConversionRate: 0.39 },
    { domain: 'johnson_properties_8020rei_com', totalMailed: 2400, totalSends: 3000, totalDelivered: 2750, leads: 198, appointments: 58, deals: 8, totalCost: 3360, totalRevenue: 12600, roas: 3.75, leadConversionRate: 8.25, dealConversionRate: 0.33 },
    { domain: 'williams_capital_8020rei_com', totalMailed: 2100, totalSends: 2600, totalDelivered: 2400, leads: 175, appointments: 55, deals: 9, totalCost: 2940, totalRevenue: 15300, roas: 5.2, leadConversionRate: 8.33, dealConversionRate: 0.43 },
    { domain: 'davis_acquisitions_8020rei_com', totalMailed: 1880, totalSends: 2300, totalDelivered: 2100, leads: 152, appointments: 48, deals: 6, totalCost: 2632, totalRevenue: 8700, roas: 3.31, leadConversionRate: 8.09, dealConversionRate: 0.32 },
    { domain: 'chen_holdings_8020rei_com', totalMailed: 1900, totalSends: 2400, totalDelivered: 2200, leads: 160, appointments: 57, deals: 5, totalCost: 2660, totalRevenue: 6200, roas: 2.33, leadConversionRate: 8.42, dealConversionRate: 0.26 },
  ],
  templateLeaderboard: [
    { domain: 'all', templateId: 101, templateName: 'Cash Offer — Direct', templateType: 'letter', totalSent: 5200, totalDelivered: 4800, deliveryRate: 92.3, totalCost: 7280, uniqueProperties: 4100, leadsGenerated: 410, appointmentsGenerated: 128, contractsGenerated: 47, dealsGenerated: 18, leadConversionRate: 10.0, dealConversionRate: 0.44, totalRevenue: 32400, roas: 4.45, avgDaysToLead: 34, campaignsUsing: 8 },
    { domain: 'all', templateId: 102, templateName: 'We Buy Houses — Postcard', templateType: 'postcard', totalSent: 4100, totalDelivered: 3900, deliveryRate: 95.1, totalCost: 2870, uniqueProperties: 3600, leadsGenerated: 320, appointmentsGenerated: 98, contractsGenerated: 38, dealsGenerated: 14, leadConversionRate: 8.89, dealConversionRate: 0.39, totalRevenue: 22100, roas: 7.7, avgDaysToLead: 28, campaignsUsing: 6 },
    { domain: 'all', templateId: 103, templateName: 'Market Analysis — CheckLetter', templateType: 'checkletter', totalSent: 2800, totalDelivered: 2600, deliveryRate: 92.9, totalCost: 5040, uniqueProperties: 2400, leadsGenerated: 265, appointmentsGenerated: 82, contractsGenerated: 31, dealsGenerated: 12, leadConversionRate: 11.04, dealConversionRate: 0.5, totalRevenue: 19800, roas: 3.93, avgDaysToLead: 41, campaignsUsing: 5 },
    { domain: 'all', templateId: 104, templateName: 'Neighborhood Update', templateType: 'letter', totalSent: 1200, totalDelivered: 1100, deliveryRate: 91.7, totalCost: 1680, uniqueProperties: 1050, leadsGenerated: 125, appointmentsGenerated: 40, contractsGenerated: 15, dealsGenerated: 5, leadConversionRate: 11.9, dealConversionRate: 0.48, totalRevenue: 8500, roas: 5.06, avgDaysToLead: 22, campaignsUsing: 4 },
    { domain: 'all', templateId: 105, templateName: 'About Us — Intro', templateType: 'letter', totalSent: 980, totalDelivered: 900, deliveryRate: 91.8, totalCost: 1372, uniqueProperties: 850, leadsGenerated: 120, appointmentsGenerated: 37, contractsGenerated: 11, dealsGenerated: 4, leadConversionRate: 14.12, dealConversionRate: 0.47, totalRevenue: 5200, roas: 3.79, avgDaysToLead: 19, campaignsUsing: 3 },
  ],
  geoBreakdown: [
    { state: 'TX', county: 'Harris', totalMailed: 2100, leads: 210, deals: 8, leadConversionRate: 10.0, dealConversionRate: 0.38, totalRevenue: 14200 },
    { state: 'TX', county: 'Dallas', totalMailed: 1800, leads: 175, deals: 7, leadConversionRate: 9.72, dealConversionRate: 0.39, totalRevenue: 11800 },
    { state: 'FL', county: 'Miami-Dade', totalMailed: 1600, leads: 140, deals: 6, leadConversionRate: 8.75, dealConversionRate: 0.38, totalRevenue: 9600 },
    { state: 'FL', county: 'Broward', totalMailed: 1400, leads: 125, deals: 5, leadConversionRate: 8.93, dealConversionRate: 0.36, totalRevenue: 7800 },
    { state: 'GA', county: 'Fulton', totalMailed: 1200, leads: 110, deals: 4, leadConversionRate: 9.17, dealConversionRate: 0.33, totalRevenue: 6200 },
    { state: 'NC', county: 'Mecklenburg', totalMailed: 1100, leads: 98, deals: 4, leadConversionRate: 8.91, dealConversionRate: 0.36, totalRevenue: 5800 },
    { state: 'AZ', county: 'Maricopa', totalMailed: 950, leads: 85, deals: 3, leadConversionRate: 8.95, dealConversionRate: 0.32, totalRevenue: 4200 },
    { state: 'OH', county: 'Cuyahoga', totalMailed: 880, leads: 78, deals: 5, leadConversionRate: 8.86, dealConversionRate: 0.57, totalRevenue: 6100 },
    { state: 'TN', county: 'Shelby', totalMailed: 750, leads: 72, deals: 4, leadConversionRate: 9.6, dealConversionRate: 0.53, totalRevenue: 5400 },
    { state: 'PA', county: 'Philadelphia', totalMailed: 700, leads: 62, deals: 3, leadConversionRate: 8.86, dealConversionRate: 0.43, totalRevenue: 3800 },
  ],
  dataQuality: {
    totalProperties: 14280,
    attributedCount: 11850,
    unattributedCount: 2430,
    attributionRate: 83.0,
    backfilledCount: 1680,
    backfilledRate: 11.8,
    zeroRevenueDealCount: 3,
  },
  alerts: [
    { id: 'dm-no-conversions-chen_holdings', name: 'No conversions after significant sends', severity: 'critical', category: 'dm-business-results', description: 'chen_holdings has mailed 1,900 properties with only 5 deals. Campaign targeting or template may need review.', entity: 'chen_holdings', metrics: { current: 5, baseline: 1900 }, detected_at: new Date().toISOString(), action: 'Review campaign targeting and template performance for chen_holdings.' },
    { id: 'dm-low-roas-davis', name: 'ROAS below target', severity: 'warning', category: 'dm-business-results', description: 'davis_acquisitions has a ROAS of 3.31x — below the 4.0x target for Q2.', entity: 'davis_acquisitions', metrics: { current: 3.31, baseline: 4.0 }, detected_at: new Date().toISOString(), action: 'Analyze which templates and geographies are underperforming for davis_acquisitions.' },
    { id: 'dm-high-unattributed', name: 'High unattributed conversions', severity: 'warning', category: 'dm-business-results', description: '17% of conversions (2,430 properties) have no campaign attribution.', metrics: { current: 17, baseline: 20 }, detected_at: new Date().toISOString(), action: 'Check attribution system. Conversions before Sep 2025 will have NULL attribution by design.' },
  ],
  conversionTrend: generateMockTrend(30),
  roasTrend: generateMockRoasTrend(30),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RapidResponseTab = forwardRef<TabHandle, RapidResponseTabProps>(
  function RapidResponseTab({ days, startDate, endDate, editMode, activeSubTab = 'operational-health' }, ref) {
    const [data, setData] = useState<RapidResponseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
    const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

    // Domain filter
    const [selectedDomain, setSelectedDomain] = useState('');
    const [availableDomains, setAvailableDomains] = useState<string[]>([]);
    const [domainsLoading, setDomainsLoading] = useState(true);

    // Business Results state (Layer 2)
    const [brData, setBrData] = useState<BusinessResultsData | null>(null);
    const [brLoading, setBrLoading] = useState(false);
    const [brError, setBrError] = useState<string | null>(null);
    const [brUsingMock, setBrUsingMock] = useState(false);
    const [timelinePropertyId, setTimelinePropertyId] = useState<number | null>(null);

    // Load layout from localStorage or use default
    const [layout, setLayout] = useState<Widget[]>(() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(RAPID_RESPONSE_LAYOUT_STORAGE_KEY);
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (e) {
            console.error('Failed to parse saved rapid-response layout:', e);
          }
        }
      }
      return DEFAULT_RAPID_RESPONSE_LAYOUT;
    });

    // Business Results layout
    const [brLayout, setBrLayout] = useState<Widget[]>(() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(DM_BUSINESS_RESULTS_LAYOUT_STORAGE_KEY);
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (e) {
            console.error('Failed to parse saved business-results layout:', e);
          }
        }
      }
      return DEFAULT_DM_BUSINESS_RESULTS_LAYOUT;
    });

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      resetLayout: activeSubTab === 'business-results' ? handleResetBrLayout : handleResetLayout,
      openWidgetCatalog: () => setShowWidgetCatalog(true),
    }));

    // Fetch domain list on mount
    useEffect(() => {
      fetch('/api/rapid-response?type=domain-list')
        .then(r => r.json())
        .then(res => {
          if (res.success) setAvailableDomains(res.data);
        })
        .catch(() => {})
        .finally(() => setDomainsLoading(false));
    }, []);

    // Re-fetch data when date range or domain changes
    useEffect(() => {
      if (activeSubTab === 'operational-health') fetchData();
    }, [days, startDate, endDate, selectedDomain, activeSubTab]);

    // Fetch business results when switching to that sub-tab
    useEffect(() => {
      if (activeSubTab === 'business-results') fetchBusinessResults();
    }, [days, startDate, endDate, selectedDomain, activeSubTab]);

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const dp = buildDateQueryString(days, startDate, endDate);
        const domainParam = selectedDomain ? `&domain=${encodeURIComponent(selectedDomain)}` : '';
        const [overviewRes, trendRes, campaignRes, alertsRes, statusRes, costRes] =
          await Promise.all([
            fetch(`/api/rapid-response?type=overview&${dp}${domainParam}`).then(r => r.json()),
            fetch(`/api/rapid-response?type=daily-trend&${dp}${domainParam}`).then(r => r.json()),
            fetch(`/api/rapid-response?type=campaign-list${domainParam}`).then(r => r.json()),
            fetch(`/api/rapid-response?type=alerts&${dp}${domainParam}`).then(r => r.json()),
            fetch(`/api/rapid-response?type=status-breakdown&${dp}${domainParam}`).then(r => r.json()),
            fetch(`/api/rapid-response?type=cost-trend&${dp}${domainParam}`).then(r => r.json()),
          ]);

        setData({
          systemStatus: overviewRes.success ? overviewRes.data.systemStatus : null,
          operationalPulse: overviewRes.success ? overviewRes.data.operationalPulse : null,
          qualityMetrics: overviewRes.success ? overviewRes.data.qualityMetrics : null,
          pcmHealth: overviewRes.success ? overviewRes.data.pcmHealth : null,
          dailyTrend: trendRes.success ? trendRes.data : [],
          statusBreakdown: statusRes.success ? statusRes.data : [],
          campaigns: campaignRes.success ? campaignRes.data : [],
          alerts: alertsRes.success ? alertsRes.data.alerts : [],
          costTrend: costRes.success ? costRes.data : [],
        });

        const allSuccess = [overviewRes, trendRes, campaignRes, alertsRes, statusRes, costRes].every(r => r.success);
        if (!allSuccess) {
          const firstError = [overviewRes, trendRes, campaignRes, alertsRes, statusRes, costRes].find(r => !r.success);
          setError(firstError?.error || 'Some data failed to load');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to API');
      }

      setLoading(false);
    }

    async function fetchBusinessResults() {
      setBrLoading(true);
      setBrError(null);

      try {
        const dp = buildDateQueryString(days, startDate, endDate);
        const domainParam = selectedDomain ? `&domain=${encodeURIComponent(selectedDomain)}` : '';
        const [funnelRes, clientRes, templateRes, geoRes, qualityRes, alertsRes, convTrendRes, roasTrendRes] =
          await Promise.all([
            fetch(`/api/dm-conversions?type=funnel-overview${domainParam}`).then(r => r.json()),
            fetch(`/api/dm-conversions?type=client-performance${domainParam}`).then(r => r.json()),
            fetch(`/api/dm-templates?type=template-leaderboard${domainParam}`).then(r => r.json()),
            fetch(`/api/dm-conversions?type=geo-breakdown${domainParam}`).then(r => r.json()),
            fetch(`/api/dm-conversions?type=data-quality${domainParam}`).then(r => r.json()),
            fetch(`/api/dm-conversions?type=alerts${domainParam}`).then(r => r.json()),
            fetch(`/api/dm-conversions?type=conversion-trend&${dp}${domainParam}`).then(r => r.json()),
            fetch(`/api/dm-conversions?type=roas-trend&${dp}${domainParam}`).then(r => r.json()),
          ]);

        const result: BusinessResultsData = {
          funnelOverview: funnelRes.success ? funnelRes.data : null,
          clientPerformance: clientRes.success ? clientRes.data : [],
          templateLeaderboard: templateRes.success ? templateRes.data : [],
          geoBreakdown: geoRes.success ? geoRes.data : [],
          dataQuality: qualityRes.success ? qualityRes.data : null,
          alerts: alertsRes.success ? alertsRes.data.alerts : [],
          conversionTrend: convTrendRes.success ? convTrendRes.data : [],
          roasTrend: roasTrendRes.success ? roasTrendRes.data : [],
        };

        // If all data is empty (tables not populated yet), use mock data for preview
        const isEmpty = (!result.funnelOverview || result.funnelOverview.totalMailed === 0)
          && result.clientPerformance.length === 0
          && result.templateLeaderboard.length === 0;

        if (isEmpty) {
          setBrData(MOCK_BUSINESS_RESULTS);
          setBrUsingMock(true);
        } else {
          setBrData(result);
          setBrUsingMock(false);
        }

        const allSuccess = [funnelRes, clientRes, templateRes, geoRes, qualityRes, alertsRes, convTrendRes, roasTrendRes].every(r => r.success);
        if (!allSuccess) {
          const firstError = [funnelRes, clientRes, templateRes, geoRes, qualityRes, alertsRes, convTrendRes, roasTrendRes].find(r => !r.success);
          setBrError(firstError?.error || 'Some data failed to load');
        }
      } catch {
        // API not reachable (e.g. Aurora not configured) — show mock data for preview
        setBrData(MOCK_BUSINESS_RESULTS);
        setBrUsingMock(true);
      }

      setBrLoading(false);
    }

    // Layout handlers
    const handleLayoutChange = (newLayout: Widget[]) => {
      setLayout(newLayout);
      if (typeof window !== 'undefined') {
        localStorage.setItem(RAPID_RESPONSE_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
      }
    };

    const handleResetLayout = () => {
      setLayout(DEFAULT_RAPID_RESPONSE_LAYOUT);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(RAPID_RESPONSE_LAYOUT_STORAGE_KEY);
      }
    };

    const handleAddWidget = (type: string, title: string, size: { w: number; h: number }) => {
      const maxY = layout.reduce((max, w) => Math.max(max, w.y + w.h), 0);
      const newWidget: Widget = {
        id: `${type}-${Date.now()}`,
        type: type as Widget['type'],
        title,
        x: 0,
        y: maxY,
        w: size.w,
        h: size.h,
      };
      handleLayoutChange([...layout, newWidget]);
    };

    const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
      handleLayoutChange(layout.map(w => (w.id === widgetId ? { ...w, ...updates } : w)));
    };

    const handleDeleteWidget = (widgetId: string) => {
      handleLayoutChange(layout.filter(w => w.id !== widgetId));
    };

    const handleOpenWidgetSettings = (widgetId: string) => {
      const widget = layout.find(w => w.id === widgetId);
      if (widget) setSelectedWidgetForSettings(widget);
    };

    const handleWidgetExport = useCallback((_widgetId: string) => {
      // Export functionality can be added later
    }, []);

    // Business Results layout handlers
    const handleBrLayoutChange = (newLayout: Widget[]) => {
      setBrLayout(newLayout);
      if (typeof window !== 'undefined') {
        localStorage.setItem(DM_BUSINESS_RESULTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
      }
    };

    const handleResetBrLayout = () => {
      setBrLayout(DEFAULT_DM_BUSINESS_RESULTS_LAYOUT);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(DM_BUSINESS_RESULTS_LAYOUT_STORAGE_KEY);
      }
    };

    const handleBrAddWidget = (type: string, title: string, size: { w: number; h: number }) => {
      const maxY = brLayout.reduce((max, w) => Math.max(max, w.y + w.h), 0);
      const newWidget: Widget = {
        id: `${type}-${Date.now()}`,
        type: type as Widget['type'],
        title,
        x: 0,
        y: maxY,
        w: size.w,
        h: size.h,
      };
      handleBrLayoutChange([...brLayout, newWidget]);
    };

    const handleBrUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
      handleBrLayoutChange(brLayout.map(w => (w.id === widgetId ? { ...w, ...updates } : w)));
    };

    const handleBrDeleteWidget = (widgetId: string) => {
      handleBrLayoutChange(brLayout.filter(w => w.id !== widgetId));
    };

    // Widget mapping
    const widgets = useMemo(() => {
      if (!data) return {};
      return {
        'rr-operational-pulse': data.operationalPulse
          ? <RrOperationalPulseWidget data={data.operationalPulse} />
          : null,
        'rr-quality-metrics': data.qualityMetrics
          ? <RrQualityMetricsWidget data={data.qualityMetrics} />
          : null,
        'rr-pcm-health': data.pcmHealth
          ? <RrPcmHealthWidget data={data.pcmHealth} />
          : null,
        'rr-sends-trend': <RrSendsTrendWidget data={data.dailyTrend} />,
        'rr-status-breakdown': <RrStatusBreakdownWidget data={data.statusBreakdown} />,
        'rr-alerts-feed': <RrAlertsFeedWidget data={data.alerts} />,
        'rr-campaign-table': <RrCampaignTableWidget data={data.campaigns} />,
        'rr-cost-overview': <RrCostOverviewWidget data={data.costTrend} />,
      };
    }, [data]);

    // Business Results widget mapping
    const brWidgets = useMemo(() => {
      if (!brData) return {};
      return {
        'dm-alerts-feed': <DmAlertsFeedWidget data={brData.alerts} />,
        'dm-funnel-overview': brData.funnelOverview
          ? <DmFunnelOverviewWidget data={brData.funnelOverview} />
          : null,
        'dm-client-performance': <DmClientPerformanceWidget data={brData.clientPerformance} onDomainClick={setSelectedDomain} />,
        'dm-template-leaderboard': <DmTemplateLeaderboardWidget data={brData.templateLeaderboard} />,
        'dm-conversion-trend': <DmConversionTrendWidget data={brData.conversionTrend} />,
        'dm-roas-trend': <DmRoasTrendWidget data={brData.roasTrend} />,
        'dm-geo-breakdown': <DmGeoBreakdownWidget data={brData.geoBreakdown} />,
        'dm-data-quality': brData.dataQuality
          ? <DmDataQualityWidget data={brData.dataQuality} />
          : null,
      };
    }, [brData, setSelectedDomain]);

    // Header extras — alert count tag shown in the alerts widget header
    const headerExtras = useMemo(() => {
      if (!data) return {};
      const alertCount = data.alerts.length;
      return {
        'rr-alerts-feed': alertCount > 0
          ? <AxisTag color="error" size="sm" dot>{alertCount} active</AxisTag>
          : <AxisTag color="success" size="sm" dot>All clear</AxisTag>,
      };
    }, [data]);

    const brHeaderExtras = useMemo(() => {
      if (!brData) return {};
      const alertCount = brData.alerts.length;
      return {
        'dm-alerts-feed': alertCount > 0
          ? <AxisTag color="error" size="sm" dot>{alertCount} active</AxisTag>
          : <AxisTag color="success" size="sm" dot>All clear</AxisTag>,
      };
    }, [brData]);

    // Loading state
    if (loading) {
      return (
        <div className="space-y-4">
          <AxisSkeleton variant="widget" height="80px" fullWidth />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AxisSkeleton variant="chart" height="180px" />
            <AxisSkeleton variant="chart" height="180px" />
            <AxisSkeleton variant="chart" height="180px" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AxisSkeleton variant="chart" height="300px" />
            <AxisSkeleton variant="chart" height="300px" />
          </div>
          <AxisSkeleton variant="widget" height="280px" fullWidth />
        </div>
      );
    }

    // Error state (full failure)
    if (error && !data?.systemStatus) {
      return (
        <div className="max-w-md mx-auto mt-8">
          <AxisCallout type="error" title="Failed to load Rapid Response data">
            <p className="mb-4">{error}</p>
            <AxisButton onClick={fetchData} variant="filled">Retry</AxisButton>
          </AxisCallout>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Edit Mode Callout */}
        {editMode && (
          <div className="mb-4">
            <AxisCallout type="info" title="Edit mode active">
              <p>Drag widgets to rearrange, resize from corners, or use the widget menu to configure.</p>
            </AxisCallout>
          </div>
        )}

        {/* Domain filter — shared across both sub-tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          <AxisDomainSearch
            domains={availableDomains}
            selectedDomain={selectedDomain}
            onDomainChange={setSelectedDomain}
            loading={domainsLoading}
          />
          {selectedDomain && !loading && (
            <AxisTag color="info" size="sm">
              Filtered: {selectedDomain.replace(/_8020rei_com$/i, '').replace(/_/g, ' ')}
            </AxisTag>
          )}
        </div>

        {/* Operational Health sub-tab (current view) */}
        {activeSubTab === 'operational-health' && (
          <>
            {/* Domain with no data — clean empty state */}
            {selectedDomain && !loading && data && data.campaigns.length === 0 && data.dailyTrend.length === 0 && data.alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <h3 className="text-h4 font-semibold text-content-primary mb-2">No DM campaign data</h3>
                <p className="text-body-regular text-content-secondary max-w-md">
                  The domain <strong>{selectedDomain.replace(/_8020rei_com$/i, '').replace(/_/g, ' ')}</strong> has no active, disabled, or historical DM campaigns. Data will appear here once a campaign is created for this client.
                </p>
              </div>
            ) : (
            <>
            {/* Awaiting data disclaimer — only when no domain is selected and no campaigns globally */}
            {!selectedDomain && data?.systemStatus && data.systemStatus.level === 'awaiting-data' && (
              <AxisCallout type="info" title="Awaiting production data">
                <p>No campaign data found yet. Real metrics will appear once the hourly sync populates data from active campaigns.</p>
              </AxisCallout>
            )}

            {/* Partial error banner — only show for real errors, not domain filter edge cases */}
            {error && !selectedDomain && data?.systemStatus && (
              <AxisCallout type="alert" title="Partial data">
                <p>{error}</p>
              </AxisCallout>
            )}

            {/* Grid Workspace */}
            <GridWorkspace
              layout={layout}
              onLayoutChange={handleLayoutChange}
              editMode={editMode}
              widgets={widgets}
              headerExtras={headerExtras}
              onWidgetSettings={handleOpenWidgetSettings}
              onWidgetExport={handleWidgetExport}
            />

            {/* Widget Catalog Modal */}
            <WidgetCatalog
              isOpen={showWidgetCatalog}
              onClose={() => setShowWidgetCatalog(false)}
              onAddWidget={handleAddWidget}
              existingWidgets={layout}
              catalog={RAPID_RESPONSE_WIDGET_CATALOG}
            />

            {/* Widget Settings Modal */}
            <WidgetSettings
              widget={selectedWidgetForSettings}
              isOpen={selectedWidgetForSettings !== null}
              onClose={() => setSelectedWidgetForSettings(null)}
              onSave={handleUpdateWidget}
              onDelete={handleDeleteWidget}
            />
            </>
            )}
          </>
        )}

        {/* Business Results sub-tab */}
        {activeSubTab === 'business-results' && (
          <>
            {brLoading ? (
              <div className="space-y-4">
                <AxisSkeleton variant="widget" height="80px" fullWidth />
                <AxisSkeleton variant="chart" height="240px" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AxisSkeleton variant="chart" height="280px" />
                  <AxisSkeleton variant="chart" height="280px" />
                </div>
              </div>
            ) : brError && !brData ? (
              <div className="max-w-md mx-auto mt-8">
                <AxisCallout type="error" title="Failed to load business results data">
                  <p className="mb-4">{brError}</p>
                  <AxisButton onClick={() => fetchBusinessResults()} variant="filled">Retry</AxisButton>
                </AxisCallout>
              </div>
            ) : (
              <>
                {brUsingMock && (
                  <AxisCallout type="info" title="Preview mode — sample data">
                    <p>Showing sample data so you can review the board structure. Real data will replace this once Carolina deploys the extraction job and the daily sync runs.</p>
                  </AxisCallout>
                )}

                {brError && !brUsingMock && (
                  <AxisCallout type="alert" title="Partial data">
                    <p>{brError}</p>
                  </AxisCallout>
                )}

                <GridWorkspace
                  layout={brLayout}
                  onLayoutChange={handleBrLayoutChange}
                  editMode={editMode}
                  widgets={brWidgets}
                  headerExtras={brHeaderExtras}
                  onWidgetSettings={handleOpenWidgetSettings}
                  onWidgetExport={handleWidgetExport}
                />

                <WidgetCatalog
                  isOpen={showWidgetCatalog}
                  onClose={() => setShowWidgetCatalog(false)}
                  onAddWidget={handleBrAddWidget}
                  existingWidgets={brLayout}
                  catalog={DM_BUSINESS_RESULTS_WIDGET_CATALOG}
                />

                <WidgetSettings
                  widget={selectedWidgetForSettings}
                  isOpen={selectedWidgetForSettings !== null}
                  onClose={() => setSelectedWidgetForSettings(null)}
                  onSave={handleBrUpdateWidget}
                  onDelete={handleBrDeleteWidget}
                />

                <DmPropertyTimelineModal
                  isOpen={timelinePropertyId !== null}
                  onClose={() => setTimelinePropertyId(null)}
                  propertyId={timelinePropertyId}
                  domain={selectedDomain || undefined}
                />
              </>
            )}
          </>
        )}
      </div>
    );
  }
);
