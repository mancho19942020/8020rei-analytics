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
import { DataReliabilityHint } from '@/components/workspace/DataReliabilityHint';
import { DmAlertsModal, getAlertCount } from '@/components/dashboard/DmAlertsModal';
import {
  RrOperationalPulseWidget,
  RrQualityMetricsWidget,
  RrPcmHealthWidget,
  RrPostalPerformanceWidget,
  RrSendsTrendWidget,
  RrStatusBreakdownWidget,
  RrAlertsFeedWidget,
  RrCampaignTableWidget,
  RrQ2GoalWidget,
  RrQ2TopContributorsWidget,
  RrSystemCoverageWidget,
  RrDataIntegrityWidget,
  DmAlertsFeedWidget,
  DmFunnelOverviewWidget,
  DmClientPerformanceWidget,
  DmTemplateLeaderboardWidget,
  DmConversionTrendWidget,
  DmRevenueCostWidget,
  DmGeoBreakdownWidget,
  DmPropertyTimelineModal,
  PcmReconciliationOverviewWidget,
  PcmVolumeComparisonWidget,
  PcmCostAnalysisWidget,
  PcmStatusComparisonWidget,
  PcmMismatchTableWidget,
  PcmMarginSummaryWidget,
  PcmMailClassComparisonWidget,
  PcmClientMarginsWidget,
  PcmMarginTrendWidget,
  PcmPriceAlertWidget,
  PcmPriceChangeDetectionWidget,
  PcmPricingOverviewWidget,
  PcmPricingHistoryWidget,
  PcmDataMatchWidget,
  PcmMarginPeriodWidget,
  PcmClientsProfitableWidget,
  PcmClientsBreakevenWidget,
  PcmClientsLosingWidget,
  PcmDomainTableWidget,
  PcmTemplateTableWidget,
  DmOnHoldBreakdownWidget,
  type OnHoldBreakdownData,
} from '@/components/workspace/widgets';
import {
  DEFAULT_RAPID_RESPONSE_LAYOUT,
  RAPID_RESPONSE_LAYOUT_STORAGE_KEY,
  RAPID_RESPONSE_WIDGET_CATALOG,
  DEFAULT_DM_BUSINESS_RESULTS_LAYOUT,
  DM_BUSINESS_RESULTS_LAYOUT_STORAGE_KEY,
  DM_BUSINESS_RESULTS_WIDGET_CATALOG,
  DEFAULT_PCM_VALIDATION_LAYOUT,
  PCM_VALIDATION_LAYOUT_STORAGE_KEY,
  PCM_VALIDATION_WIDGET_CATALOG,
  loadLayout,
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
  RrQ2Goal,
} from '@/types/rapid-response';
import type {
  DmFunnelOverview,
  DmClientPerformanceRow,
  DmTemplatePerformance,
  DmGeoRow,
  DmDataQuality,
  DmAlert,
} from '@/types/dm-conversions';
import type {
  ProfitabilitySummary,
  PriceAlertData,
  PriceDetectionData,
  PriceImpactData,
  CurrentRatesData,
  PricingHistoryData,
  RateHistoryData,
} from '@/types/pcm-validation';
import { authFetch } from '@/lib/auth-fetch';

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
  q2Goal: RrQ2Goal | null;
  dataQuality: DmDataQuality | null;
  onHoldBreakdown: OnHoldBreakdownData | null;
}

interface BusinessResultsData {
  funnelOverview: DmFunnelOverview | null;
  clientPerformance: DmClientPerformanceRow[];
  templateLeaderboard: DmTemplatePerformance[];
  geoBreakdown: DmGeoRow[];
  alerts: DmAlert[];
  conversionTrend: { date: string; leads: number; appointments: number; contracts: number; deals: number }[];
  revenueCost: { date: string; totalCost: number; totalRevenue: number }[];
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
    const [brLoading, setBrLoading] = useState(true);
    const [brError, setBrError] = useState<string | null>(null);
    const [timelinePropertyId, setTimelinePropertyId] = useState<number | null>(null);

    // PCM Validation state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pcmData, setPcmData] = useState<any>(null);
    const [pcmLoading, setPcmLoading] = useState(true);
    const [pcmError, setPcmError] = useState<string | null>(null);

    // Alerts modal state
    const [alertsModalOpen, setAlertsModalOpen] = useState(false);

    // Load layout from localStorage or use default
    const [layout, setLayout] = useState<Widget[]>(() =>
      loadLayout(RAPID_RESPONSE_LAYOUT_STORAGE_KEY, DEFAULT_RAPID_RESPONSE_LAYOUT)
    );

    // Business Results layout
    const [brLayout, setBrLayout] = useState<Widget[]>(() =>
      loadLayout(DM_BUSINESS_RESULTS_LAYOUT_STORAGE_KEY, DEFAULT_DM_BUSINESS_RESULTS_LAYOUT)
    );

    // PCM Validation layout
    const [pcmLayout, setPcmLayout] = useState<Widget[]>(() =>
      loadLayout(PCM_VALIDATION_LAYOUT_STORAGE_KEY, DEFAULT_PCM_VALIDATION_LAYOUT)
    );

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      resetLayout: activeSubTab === 'pcm-validation' ? handleResetPcmLayout : activeSubTab === 'business-results' ? handleResetBrLayout : handleResetLayout,
      openWidgetCatalog: () => setShowWidgetCatalog(true),
    }));

    // Fetch domain list on mount
    useEffect(() => {
      authFetch('/api/rapid-response?type=domain-list')
        .then(r => r.json())
        .then(res => {
          if (res.success) setAvailableDomains(res.data);
        })
        .catch(() => {})
        .finally(() => setDomainsLoading(false));
    }, []);

    async function fetchBusinessResults() {
      setBrLoading(true);
      setBrError(null);

      try {
        const dp = buildDateQueryString(days, startDate, endDate);
        const domainParam = selectedDomain ? `&domain=${encodeURIComponent(selectedDomain)}` : '';
        const [funnelRes, clientRes, templateRes, geoRes, alertsRes, convTrendRes, revenueCostRes] =
          await Promise.all([
            authFetch(`/api/dm-conversions?type=funnel-overview&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/dm-conversions?type=client-performance&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/dm-templates?type=template-leaderboard&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/dm-conversions?type=geo-breakdown&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/dm-conversions?type=alerts&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/dm-conversions?type=conversion-trend&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/dm-conversions?type=roas-trend&${dp}${domainParam}`).then(r => r.json()),
          ]);

        const result: BusinessResultsData = {
          funnelOverview: funnelRes.success ? funnelRes.data : null,
          clientPerformance: clientRes.success ? clientRes.data : [],
          templateLeaderboard: templateRes.success ? templateRes.data : [],
          geoBreakdown: geoRes.success ? geoRes.data : [],
          alerts: alertsRes.success ? alertsRes.data.alerts : [],
          conversionTrend: convTrendRes.success ? convTrendRes.data : [],
          revenueCost: revenueCostRes.success ? revenueCostRes.data : [],
        };

        setBrData(result);

        const allSuccess = [funnelRes, clientRes, templateRes, geoRes, alertsRes, convTrendRes, revenueCostRes].every(r => r.success);
        if (!allSuccess) {
          const firstError = [funnelRes, clientRes, templateRes, geoRes, alertsRes, convTrendRes, revenueCostRes].find(r => !r.success);
          console.error('[BR] Partial load — first failing endpoint:', firstError?.error);
          setBrError('partial');
        }
      } catch (err) {
        console.error('[BR] fetch failed:', err);
        setBrError('partial');
      }

      setBrLoading(false);
    }

    async function fetchPcmValidation() {
      setPcmLoading(true);
      setPcmError(null);

      try {
        const domainParam = selectedDomain ? `&domain=${encodeURIComponent(selectedDomain)}` : '';
        const dp = buildDateQueryString(days, startDate, endDate);
        const [summaryRes, domainsRes, designsRes, statusRes, profSummaryRes, mailClassRes, clientMarginsRes, marginTrendRes, priceDetectionRes, priceImpactRes, currentRatesRes, pricingHistoryRes, profitPeriodRes] = await Promise.all([
          authFetch(`/api/pcm-validation?type=summary&${dp}${domainParam}`).then(r => r.json()),
          authFetch(`/api/pcm-validation?type=domain-breakdown&${dp}${domainParam}`).then(r => r.json()),
          authFetch(`/api/pcm-validation?type=designs`).then(r => r.json()),
          authFetch(`/api/pcm-validation?type=status-comparison&${dp}${domainParam}`).then(r => r.json()),
          authFetch(`/api/pcm-validation?type=profitability-summary&${dp}${domainParam}`).then(r => r.json()).catch(() => ({ dataAvailable: false })),
          authFetch(`/api/pcm-validation?type=margin-by-mail-class&${dp}${domainParam}`).then(r => r.json()).catch(() => ({ mailClasses: [], dataAvailable: false })),
          authFetch(`/api/pcm-validation?type=client-margins&${dp}${domainParam}`).then(r => r.json()).catch(() => ({ clients: [], dataAvailable: false })),
          // Margin trend: always fetch ALL data (all-time chart, not filtered by date selector)
          authFetch(`/api/pcm-validation?type=margin-trend${domainParam}`).then(r => r.json()).catch(() => ({ trend: [], dataAvailable: false })),
          authFetch(`/api/pcm-validation?type=price-detection&${dp}${domainParam}`).then(r => r.json()).catch(() => ({ currentRates: { standard: null, firstClass: null }, changes: [], rolloutStatus: { standard: null, firstClass: null }, dataAvailable: false })),
          authFetch(`/api/pcm-validation?type=price-impact&${dp}${domainParam}`).then(r => r.json()).catch(() => ({ impacts: [], dataAvailable: false })),
          authFetch(`/api/pcm-validation?type=current-rates&${dp}${domainParam}`).then(r => r.json()).catch(() => ({ standard: null, firstClass: null, blended: null, dataAvailable: false })),
          authFetch(`/api/pcm-validation?type=pricing-history&${dp}${domainParam}`).then(r => r.json()).catch(() => ({ trend: [], dataAvailable: false })),
          // Period profitability: filtered by date selector
          authFetch(`/api/pcm-validation?type=profitability-period&${dp}${domainParam}`).then(r => r.json()).catch(() => ({ dataAvailable: false })),
        ]);

        // Compute price alert from profitability data
        const profSummary = profSummaryRes as ProfitabilitySummary;
        const mailClasses = mailClassRes?.mailClasses || [];
        const stdClass = mailClasses.find((m: { mailClass: string }) => m.mailClass === 'standard');
        const fcClass = mailClasses.find((m: { mailClass: string }) => m.mailClass === 'first_class');

        let priceAlert: PriceAlertData | null = null;
        if (profSummary?.dataAvailable) {
          const alerts: string[] = [];
          let alertLevel: 'ok' | 'warning' | 'critical' = 'ok';

          if (profSummary.marginPercent < 0) {
            alertLevel = 'critical';
            alerts.push(`Overall margin is negative (${profSummary.marginPercent.toFixed(1)}%) — losing money on every piece sent`);
          } else if (profSummary.marginPercent < 5) {
            alertLevel = 'warning';
            alerts.push(`Overall margin is ${profSummary.marginPercent.toFixed(1)}% — below the 5% minimum threshold`);
          }

          if (stdClass && stdClass.marginPercent < 5) {
            if (stdClass.marginPercent < 0) {
              alertLevel = 'critical';
              alerts.push(`Standard mail is losing money (${stdClass.marginPercent.toFixed(1)}% margin)`);
            } else {
              if (alertLevel === 'ok') alertLevel = 'warning';
              alerts.push(`Standard mail margin is only ${stdClass.marginPercent.toFixed(1)}%`);
            }
          }

          if (fcClass && fcClass.marginPercent < 0) {
            alertLevel = 'critical';
            alerts.push(`First Class mail is losing money (${fcClass.marginPercent.toFixed(1)}% margin, -$${Math.abs(fcClass.margin / (fcClass.sends || 1)).toFixed(3)}/piece)`);
          } else if (fcClass && fcClass.marginPercent < 5) {
            if (alertLevel === 'ok') alertLevel = 'warning';
            alerts.push(`First Class mail margin is only ${fcClass.marginPercent.toFixed(1)}%`);
          }

          if (alerts.length === 0) {
            alerts.push('All mail classes have healthy margins above 5%');
          }

          priceAlert = {
            overallMarginPct: profSummary.marginPercent,
            standardMarginPct: stdClass?.marginPercent ?? null,
            firstClassMarginPct: fcClass?.marginPercent ?? null,
            alertLevel,
            alerts,
          };
        }

        setPcmData({
          summary: summaryRes,
          domains: domainsRes,
          designs: designsRes,
          statusComparison: statusRes,
          profitSummary: profSummary?.dataAvailable ? profSummary : null,
          mailClassMargins: mailClassRes,
          clientMargins: clientMarginsRes,
          marginTrend: marginTrendRes,
          priceAlert,
          priceDetection: priceDetectionRes as PriceDetectionData,
          priceImpact: priceImpactRes as PriceImpactData,
          currentRates: currentRatesRes as CurrentRatesData,
          pricingHistory: pricingHistoryRes as PricingHistoryData,
          profitPeriod: profitPeriodRes,
        });
      } catch (err) {
        console.error('[PCM] fetch failed:', err);
        setPcmError('partial');
      }

      setPcmLoading(false);
    }

    // Re-fetch when date range, domain, or sub-tab changes — same pattern as fetchData
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
      if (activeSubTab === 'operational-health') fetchData();
      if (activeSubTab === 'business-results') fetchBusinessResults();
      if (activeSubTab === 'pcm-validation') fetchPcmValidation();
    }, [days, startDate, endDate, selectedDomain, activeSubTab]);

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const dp = buildDateQueryString(days, startDate, endDate);
        const domainParam = selectedDomain ? `&domain=${encodeURIComponent(selectedDomain)}` : '';
        const [overviewRes, trendRes, campaignRes, alertsRes, statusRes, q2GoalRes, dataQualityRes, onHoldBreakdownRes] =
          await Promise.all([
            authFetch(`/api/rapid-response?type=overview&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/rapid-response?type=daily-trend&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/rapid-response?type=campaign-list&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/rapid-response?type=alerts&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/rapid-response?type=status-breakdown&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/rapid-response?type=q2-goal${domainParam}`).then(r => r.json()),
            authFetch(`/api/dm-conversions?type=data-quality&${dp}${domainParam}`).then(r => r.json()),
            authFetch(`/api/rapid-response?type=on-hold-breakdown${domainParam}`).then(r => r.json()).catch(() => ({ dataAvailable: false })),
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
          q2Goal: q2GoalRes.success ? q2GoalRes.data : null,
          dataQuality: dataQualityRes.success ? dataQualityRes.data : null,
          onHoldBreakdown: (onHoldBreakdownRes && typeof onHoldBreakdownRes === 'object' && 'dataAvailable' in onHoldBreakdownRes)
            ? (onHoldBreakdownRes as OnHoldBreakdownData)
            : null,
        });

        const allSuccess = [overviewRes, trendRes, campaignRes, alertsRes, statusRes, q2GoalRes, dataQualityRes].every(r => r.success);
        if (!allSuccess) {
          const firstError = [overviewRes, trendRes, campaignRes, alertsRes, statusRes, q2GoalRes, dataQualityRes].find(r => !r.success);
          // Raw error (SQL, stack, etc.) stays in the devtools console — the UI
          // banner only shows a generic, user-safe message.
          console.error('[OH] Partial load — first failing endpoint:', firstError?.error);
          setError('partial');
        }
      } catch (err) {
        console.error('[OH] fetch failed:', err);
        setError('partial');
      }

      setLoading(false);
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

    // PCM Validation layout handlers
    const handlePcmLayoutChange = (newLayout: Widget[]) => {
      setPcmLayout(newLayout);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PCM_VALIDATION_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
      }
    };

    const handleResetPcmLayout = () => {
      setPcmLayout(DEFAULT_PCM_VALIDATION_LAYOUT);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PCM_VALIDATION_LAYOUT_STORAGE_KEY);
      }
    };

    const handlePcmAddWidget = (type: string, title: string, size: { w: number; h: number }) => {
      const maxY = pcmLayout.reduce((max, w) => Math.max(max, w.y + w.h), 0);
      const newWidget: Widget = {
        id: `${type}-${Date.now()}`,
        type: type as Widget['type'],
        title,
        x: 0,
        y: maxY,
        w: size.w,
        h: size.h,
      };
      handlePcmLayoutChange([...pcmLayout, newWidget]);
    };

    const handlePcmUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
      handlePcmLayoutChange(pcmLayout.map(w => (w.id === widgetId ? { ...w, ...updates } : w)));
    };

    const handlePcmDeleteWidget = (widgetId: string) => {
      handlePcmLayoutChange(pcmLayout.filter(w => w.id !== widgetId));
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
        'rr-postal-performance': data.pcmHealth
          ? <RrPostalPerformanceWidget data={data.pcmHealth} />
          : null,
        'rr-sends-trend': <RrSendsTrendWidget data={data.dailyTrend} />,
        'rr-status-breakdown': <RrStatusBreakdownWidget data={data.statusBreakdown} />,
        'rr-alerts-feed': <RrAlertsFeedWidget data={data.alerts} />,
        'rr-on-hold-breakdown': <DmOnHoldBreakdownWidget data={data.onHoldBreakdown} />,
        'rr-campaign-table': <RrCampaignTableWidget data={data.campaigns} onDomainClick={setSelectedDomain} />,
        'rr-q2-goal': data.q2Goal
          ? <RrQ2GoalWidget data={data.q2Goal} />
          : null,
        'rr-q2-top-contributors': data.q2Goal
          ? <RrQ2TopContributorsWidget data={data.q2Goal.clientBreakdown} target={data.q2Goal.target} onDomainClick={setSelectedDomain} />
          : null,
        'rr-system-coverage': <RrSystemCoverageWidget data={data.dataQuality ? {
          totalClients: data.dataQuality.totalClients ?? 0,
          totalTemplates: data.dataQuality.totalTemplates ?? 0,
          totalProperties: data.dataQuality.totalProperties,
          attributionRate: data.dataQuality.attributionRate,
          attributedCount: data.dataQuality.attributedCount,
          propertyDataAvailable: data.dataQuality.propertyDataAvailable ?? data.dataQuality.totalProperties > 0,
        } : null} />,
        'rr-data-integrity': <RrDataIntegrityWidget data={data.dataQuality ? {
          backfilledRate: data.dataQuality.backfilledRate,
          backfilledCount: data.dataQuality.backfilledCount,
          totalProperties: data.dataQuality.totalProperties,
          unattributedCount: data.dataQuality.unattributedCount,
          zeroRevenueDealCount: data.dataQuality.zeroRevenueDealCount,
          preSendConversions: data.dataQuality.preSendConversions,
          deliveryIssues: data.dataQuality.deliveryIssues ?? 0,
          revenueMismatch: data.dataQuality.revenueMismatch ?? 0,
          propertyDataAvailable: data.dataQuality.propertyDataAvailable ?? data.dataQuality.totalProperties > 0,
        } : null} />,
      };
    }, [data]);

    // Business Results widget mapping
    const brWidgets = useMemo(() => {
      if (!brData) return {};
      return {
        'dm-alerts-feed': <DmAlertsFeedWidget data={brData.alerts} />,
        'dm-funnel-overview': brData.funnelOverview
          ? <DmFunnelOverviewWidget data={brData.funnelOverview} selectedDomain={selectedDomain || undefined} />
          : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-2">
              <span className="text-label font-medium" style={{ color: 'var(--text-secondary)' }}>Funnel data didn&apos;t load</span>
              <span className="text-label" style={{ color: 'var(--text-tertiary)' }}>Hit Retry at the top of the tab, or try a different date range.</span>
            </div>
          ),
        'dm-client-performance': <DmClientPerformanceWidget data={brData.clientPerformance} onDomainClick={setSelectedDomain} />,
        'dm-template-leaderboard': <DmTemplateLeaderboardWidget data={brData.templateLeaderboard} />,
        'dm-conversion-trend': <DmConversionTrendWidget data={brData.conversionTrend} />,
        'dm-revenue-cost': <DmRevenueCostWidget data={brData.revenueCost} />,
        'dm-geo-breakdown': <DmGeoBreakdownWidget data={brData.geoBreakdown} />,
      };
    }, [brData, setSelectedDomain]);

    // Header extras (alerts moved to modal — these are now empty but kept for extensibility)
    const headerExtras = useMemo(() => ({}), []);
    const brHeaderExtras = useMemo(() => ({}), []);

    // Profitability widget mapping (story: Verdict → Trends → Pricing → Data Integrity → Details)
    const pcmWidgets = useMemo(() => {
      if (!pcmData) return {};
      return {
        // Active widgets
        'pcm-margin-summary': <PcmMarginSummaryWidget data={pcmData.profitSummary} />,
        'pcm-margin-period': <PcmMarginPeriodWidget data={pcmData.profitPeriod} />,
        'pcm-margin-trend': <PcmMarginTrendWidget data={pcmData.marginTrend} detection={pcmData.priceDetection} />,
        'pcm-pricing-overview': <PcmPricingOverviewWidget currentRates={pcmData.currentRates} detection={pcmData.priceDetection} mailClassData={pcmData.mailClassMargins} />,
        'pcm-data-match': <PcmDataMatchWidget summary={pcmData.summary} statusComparison={pcmData.statusComparison} />,
        'pcm-clients-profitable': <PcmClientsProfitableWidget data={pcmData.clientMargins} />,
        'pcm-clients-breakeven': <PcmClientsBreakevenWidget data={pcmData.clientMargins} />,
        'pcm-clients-losing': <PcmClientsLosingWidget data={pcmData.clientMargins} />,
        'pcm-domain-table': <PcmDomainTableWidget data={pcmData.domains} />,
        'pcm-template-table': <PcmTemplateTableWidget designs={pcmData.designs} />,
        // Legacy mappings (for users with saved layouts from old version)
        'pcm-client-margins': <PcmClientMarginsWidget data={pcmData.clientMargins} />,
        'pcm-mismatch-table': <PcmMismatchTableWidget data={pcmData.domains} designs={pcmData.designs} />,
        'pcm-reconciliation-overview': <PcmReconciliationOverviewWidget data={pcmData.summary} />,
        'pcm-volume-comparison': <PcmVolumeComparisonWidget data={pcmData.summary} domains={pcmData.domains} />,
        'pcm-cost-analysis': <PcmCostAnalysisWidget data={pcmData.summary} domains={pcmData.domains} currentRates={pcmData.currentRates} />,
        'pcm-status-comparison': <PcmStatusComparisonWidget data={pcmData.statusComparison} />,
        'pcm-mail-class-comparison': <PcmMailClassComparisonWidget data={pcmData.mailClassMargins} />,
        'pcm-price-alert': <PcmPriceAlertWidget data={pcmData.priceAlert} />,
        'pcm-price-change-detection': <PcmPriceChangeDetectionWidget detection={pcmData.priceDetection} impact={pcmData.priceImpact} />,
        'pcm-pricing-history': <PcmPricingHistoryWidget data={pcmData.pricingHistory} />,
      };
    }, [pcmData]);

    // Loading state — only block render for operational health
    // Business results has its own loading state handled inline
    if (loading && activeSubTab === 'operational-health') {
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

    // Error state (full failure) — only for operational health
    if (error && !data?.systemStatus && activeSubTab === 'operational-health') {
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
            <AxisCallout type="info" title="Edit layout mode active">
              <p>Drag widgets to rearrange, resize from corners, or use the widget menu to configure.</p>
            </AxisCallout>
          </div>
        )}

        {/* Domain filter + alerts button — shared across all sub-tabs */}
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
          <div className="ml-auto flex items-center gap-2">
            {pcmData?.summary && (
              <AxisTag
                color={pcmData.summary.pcmConnected ? 'success' : 'error'}
                size="sm"
              >
                PCM API {pcmData.summary.pcmConnected ? 'connected' : 'disconnected'}
              </AxisTag>
            )}
            {(() => {
              const count = getAlertCount(activeSubTab, data?.alerts, brData?.alerts, pcmData?.priceAlert);
              return (
                <AxisButton
                  variant={count > 0 ? 'outlined' : 'ghost'}
                  size="sm"
                  onClick={() => setAlertsModalOpen(true)}
                  iconLeft={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  }
                >
                  Alerts{count > 0 && (
                    <span
                      className="inline-flex items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        marginLeft: 6,
                        minWidth: 20,
                        height: 20,
                        padding: '0 6px',
                        backgroundColor: 'var(--color-error-500, #ef4444)',
                        color: '#fff',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </AxisButton>
              );
            })()}
          </div>
        </div>

        {/* Alerts Modal */}
        <DmAlertsModal
          open={alertsModalOpen}
          onClose={() => setAlertsModalOpen(false)}
          tab={activeSubTab as 'operational-health' | 'business-results' | 'pcm-validation'}
          rrAlerts={data?.alerts}
          dmAlerts={brData?.alerts}
          priceAlert={pcmData?.priceAlert}
        />

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

            {/* Partial error banner — sanitized; raw backend error stays in the
                browser console for devs so stakeholders never see SQL traces. */}
            {error && !selectedDomain && data?.systemStatus && (
              <AxisCallout type="alert" title="Some numbers didn't load">
                <p>Refreshing the page usually resolves this. If it persists, reach out on #metrics-hub.</p>
                <AxisButton onClick={fetchData} variant="outlined" size="sm">Retry</AxisButton>
              </AxisCallout>
            )}

            {/* Reliability hint — answers "how trustworthy is each number?" in one hover. */}
            <div className="flex justify-end mb-1">
              <DataReliabilityHint tab="operational-health" />
            </div>

            {/* Grid Workspace */}
            <GridWorkspace
              layout={layout}
              onLayoutChange={handleLayoutChange}
              editMode={editMode}
              widgets={widgets}
              headerExtras={headerExtras}
              /* Export + Settings removed from DM Campaign widgets per 2026-04-17 design call */
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
            {(brLoading || !brData) ? (
              <div className="space-y-4">
                <AxisSkeleton variant="widget" height="80px" fullWidth />
                <AxisSkeleton variant="chart" height="240px" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AxisSkeleton variant="chart" height="280px" />
                  <AxisSkeleton variant="chart" height="280px" />
                </div>
              </div>
            ) : (
              <>
                {brError && (
                  <AxisCallout type="alert" title="Some numbers didn't load">
                    <p>Refreshing the page usually resolves this. If it persists, reach out on #metrics-hub.</p>
                    <AxisButton onClick={fetchBusinessResults} variant="outlined" size="sm">Retry</AxisButton>
                  </AxisCallout>
                )}

                <div className="flex justify-end mb-1">
                  <DataReliabilityHint tab="business-results" />
                </div>
                <GridWorkspace
                  layout={brLayout}
                  onLayoutChange={handleBrLayoutChange}
                  editMode={editMode}
                  widgets={brWidgets}
                  headerExtras={brHeaderExtras}
                  /* Export + Settings removed from DM Campaign widgets per 2026-04-17 design call */
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

        {/* PCM Validation sub-tab */}
        {activeSubTab === 'pcm-validation' && (
          <>
            {(pcmLoading || !pcmData) ? (
              <div className="space-y-4">
                <AxisSkeleton variant="widget" height="80px" fullWidth />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AxisSkeleton variant="chart" height="240px" />
                  <AxisSkeleton variant="chart" height="240px" />
                </div>
                <AxisSkeleton variant="chart" height="240px" />
              </div>
            ) : (
              <>
                {pcmError && (
                  <AxisCallout type="alert" title="Some numbers didn't load">
                    <p>Refreshing the page usually resolves this. If it persists, reach out on #metrics-hub.</p>
                    <AxisButton onClick={fetchPcmValidation} variant="outlined" size="sm">Retry</AxisButton>
                  </AxisCallout>
                )}

                <div className="flex justify-end mb-1">
                  <DataReliabilityHint tab="profitability" />
                </div>
                <GridWorkspace
                  layout={pcmLayout}
                  onLayoutChange={handlePcmLayoutChange}
                  editMode={editMode}
                  widgets={pcmWidgets}
                  /* Export + Settings removed from DM Campaign widgets per 2026-04-17 design call */
                />

                <WidgetCatalog
                  isOpen={showWidgetCatalog}
                  onClose={() => setShowWidgetCatalog(false)}
                  onAddWidget={handlePcmAddWidget}
                  existingWidgets={pcmLayout}
                  catalog={PCM_VALIDATION_WIDGET_CATALOG}
                />

                <WidgetSettings
                  widget={selectedWidgetForSettings}
                  isOpen={selectedWidgetForSettings !== null}
                  onClose={() => setSelectedWidgetForSettings(null)}
                  onSave={handlePcmUpdateWidget}
                  onDelete={handlePcmDeleteWidget}
                />
              </>
            )}
          </>
        )}
      </div>
    );
  }
);
