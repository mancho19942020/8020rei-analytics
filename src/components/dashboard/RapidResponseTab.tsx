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
} from '@/components/workspace/widgets';
import {
  DEFAULT_RAPID_RESPONSE_LAYOUT,
  RAPID_RESPONSE_LAYOUT_STORAGE_KEY,
  RAPID_RESPONSE_WIDGET_CATALOG,
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

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      resetLayout: handleResetLayout,
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
      fetchData();
    }, [days, startDate, endDate, selectedDomain]);

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

        {/* Business Results sub-tab (placeholder for future build) */}
        {activeSubTab === 'business-results' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="text-h4 font-semibold text-content-primary mb-2">Business results</h3>
            <p className="text-body-regular text-content-secondary max-w-md">
              Campaign performance metrics for customer success teams — track which campaigns deliver the best results, compare letter vs. postcard performance, and identify clients that need attention.
            </p>
            <p className="text-label text-content-tertiary mt-4">Coming soon</p>
          </div>
        )}
      </div>
    );
  }
);
