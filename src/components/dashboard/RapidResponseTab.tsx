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
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  RrSystemStatusWidget,
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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RapidResponseTab = forwardRef<TabHandle, RapidResponseTabProps>(
  function RapidResponseTab({ days, startDate, endDate, editMode }, ref) {
    const [data, setData] = useState<RapidResponseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
    const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

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

    useEffect(() => {
      fetchData();
    }, [days, startDate, endDate]);

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const dp = buildDateQueryString(days, startDate, endDate);
        const [overviewRes, trendRes, campaignRes, alertsRes, statusRes, costRes] =
          await Promise.all([
            fetch(`/api/rapid-response?type=overview&${dp}`).then(r => r.json()),
            fetch(`/api/rapid-response?type=daily-trend&${dp}`).then(r => r.json()),
            fetch(`/api/rapid-response?type=campaign-list`).then(r => r.json()),
            fetch(`/api/rapid-response?type=alerts&${dp}`).then(r => r.json()),
            fetch(`/api/rapid-response?type=status-breakdown&${dp}`).then(r => r.json()),
            fetch(`/api/rapid-response?type=cost-trend&${dp}`).then(r => r.json()),
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

        {/* Disclaimer — sample data notice */}
        <AxisCallout type="info" title="Under construction">
          <p>This tab is being built. The data displayed is sample data used for layout validation. Real metrics will populate automatically from Aurora once the backoffice hourly sync is activated.</p>
        </AxisCallout>

        {/* System Status — standalone callout, not inside a widget */}
        {data?.systemStatus && (
          <RrSystemStatusWidget data={data.systemStatus} />
        )}

        {/* Partial error banner */}
        {error && data?.systemStatus && (
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
      </div>
    );
  }
);
