/**
 * InsightsTab Component
 *
 * Chapter 9 of the 8020REI Metrics Dashboard.
 * Uses the GridWorkspace system for drag-and-drop widget arrangement.
 *
 * Displays insights and alerts:
 * - Alert Summary (scorecards: Critical, Warning, Info)
 * - Alerts by Category (donut chart)
 * - Active Alerts Feed (scrollable list)
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  InsightsSummaryWidget,
  AlertsByCategoryWidget,
  AlertsFeedWidget,
} from '@/components/workspace/widgets';
import { DEFAULT_INSIGHTS_LAYOUT, INSIGHTS_LAYOUT_STORAGE_KEY, INSIGHTS_WIDGET_CATALOG } from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import {
  exportToCSV,
  formatInsightsSummaryForExport,
  formatAlertsFeedForExport,
  formatAlertsByCategoryForExport,
} from '@/lib/export';

interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'platform' | 'client' | 'feature' | 'engagement' | 'growth';
  description: string;
  entity?: string;
  metrics?: {
    baseline?: number;
    current?: number;
    change_pct?: number;
  };
  detected_at: string;
  action: string;
  link?: string;
}

interface InsightsData {
  alerts: Alert[];
  summary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  alertsByCategory: { category: string; count: number }[];
  last_checked: string;
}

interface InsightsTabProps {
  days: number;
  userType: 'all' | 'internal' | 'external';
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const InsightsTab = forwardRef<TabHandle, InsightsTabProps>(function InsightsTab(
  { days, userType, editMode },
  ref
) {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

  // Load layout from localStorage or use default
  const [layout, setLayout] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(INSIGHTS_LAYOUT_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved insights layout:', e);
        }
      }
    }
    return DEFAULT_INSIGHTS_LAYOUT;
  });

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    resetLayout: handleResetLayout,
    openWidgetCatalog: () => setShowWidgetCatalog(true),
  }));

  useEffect(() => {
    fetchData();
  }, [userType]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/metrics/insights?userType=${userType}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Error fetching insights data');
      }
    } catch (err) {
      setError('Failed to connect to API');
    }

    setLoading(false);
  }

  // Handle layout changes
  const handleLayoutChange = (newLayout: Widget[]) => {
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(INSIGHTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Reset layout to default
  const handleResetLayout = () => {
    setLayout(DEFAULT_INSIGHTS_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(INSIGHTS_LAYOUT_STORAGE_KEY);
    }
  };

  // Add a new widget
  const handleAddWidget = (type: Widget['type'], title: string, size: { w: number; h: number }) => {
    const maxY = layout.reduce((max, w) => Math.max(max, w.y + w.h), 0);

    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      title,
      x: 0,
      y: maxY,
      w: size.w,
      h: size.h,
      minW: 4,
      minH: 3,
    };

    const newLayout = [...layout, newWidget];
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(INSIGHTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Update widget settings
  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newLayout = layout.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(INSIGHTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Delete widget
  const handleDeleteWidget = (widgetId: string) => {
    const newLayout = layout.filter((w) => w.id !== widgetId);
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(INSIGHTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Open widget settings
  const handleOpenWidgetSettings = (widgetId: string) => {
    const widget = layout.find((w) => w.id === widgetId);
    if (widget) {
      setSelectedWidgetForSettings(widget);
    }
  };

  // Handle widget export
  const handleWidgetExport = useCallback((widgetId: string) => {
    if (!data) return;

    const timestamp = new Date().toISOString().split('T')[0];

    switch (widgetId) {
      case 'insights-summary':
        exportToCSV(
          formatInsightsSummaryForExport({
            ...data.summary,
            last_checked: data.last_checked,
          }),
          `insights-summary-${timestamp}`
        );
        break;
      case 'alerts-feed':
        exportToCSV(
          formatAlertsFeedForExport(data.alerts),
          `alerts-feed-${timestamp}`
        );
        break;
      case 'alerts-by-category':
        exportToCSV(
          formatAlertsByCategoryForExport(data.alertsByCategory),
          `alerts-by-category-${timestamp}`
        );
        break;
      default:
        console.warn(`No export handler for widget: ${widgetId}`);
    }
  }, [data]);

  // Create widgets mapping
  const widgets = useMemo(() => {
    if (!data) return {};

    return {
      'insights-summary': (
        <InsightsSummaryWidget
          data={{
            ...data.summary,
            last_checked: data.last_checked,
          }}
        />
      ),
      'alerts-by-category': <AlertsByCategoryWidget data={data.alertsByCategory} />,
      'alerts-feed': <AlertsFeedWidget data={data.alerts} />,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Summary Skeleton - 3 cards in a row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AxisSkeleton variant="widget" height="140px" />
          <AxisSkeleton variant="widget" height="140px" />
          <AxisSkeleton variant="widget" height="140px" />
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Category chart skeleton */}
          <AxisSkeleton variant="chart" height="300px" />
          {/* Alerts feed skeleton */}
          <div className="lg:col-span-2">
            <AxisSkeleton variant="widget" height="400px" fullWidth />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <AxisCallout type="error" title="Failed to Load Insights Data">
          <p className="mb-4">{error}</p>
          <AxisButton onClick={fetchData} variant="filled">
            Retry
          </AxisButton>
        </AxisCallout>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Edit Mode Info */}
      {editMode && (
        <div className="mb-4">
          <AxisCallout type="info" title="Edit Mode Active">
            <p className="text-body-regular">
              Drag widgets by their handle icon to reposition them. Resize widgets by dragging their edges.
              Your layout will be saved automatically.
            </p>
          </AxisCallout>
        </div>
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
        catalog={INSIGHTS_WIDGET_CATALOG}
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
});
