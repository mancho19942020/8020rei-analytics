/**
 * FeaturesTab Component
 *
 * Chapter 3 of the 8020REI Metrics Dashboard.
 * Uses the GridWorkspace system for drag-and-drop widget arrangement.
 *
 * Displays feature adoption and usage metrics:
 * - Views per feature (horizontal bar chart)
 * - Feature distribution (donut chart)
 * - Feature adoption rate (table with progress bars)
 * - Feature trend over time (multi-line chart)
 * - Top 20 pages (table)
 *
 * Exposes resetLayout and openWidgetCatalog methods via ref for parent control.
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  FeatureUsageWidget,
  FeatureDistributionWidget,
  FeatureAdoptionWidget,
  FeatureTrendWidget,
  TopPagesWidget,
} from '@/components/workspace/widgets';
import { DEFAULT_FEATURES_LAYOUT, FEATURES_LAYOUT_STORAGE_KEY, FEATURES_WIDGET_CATALOG } from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import {
  exportToCSV,
  formatFeatureViewsForExport,
  formatFeatureDistributionForExport,
  formatFeatureAdoptionForExport,
  formatFeatureTrendForExport,
  formatTopPagesForExport,
} from '@/lib/export';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface FeatureViewData {
  feature: string;
  views: number;
  unique_users: number;
  trend?: TrendData;
}

interface FeatureAdoptionData {
  feature: string;
  clients_using: number;
  adoption_pct: number;
}

interface FeatureTrendData {
  event_date: string;
  feature: string;
  views: number;
}

interface TopPageData {
  page_url: string;
  client: string;
  path: string;
  views: number;
  unique_users: number;
}

interface FeaturesData {
  featureViews: FeatureViewData[];
  featureAdoption: FeatureAdoptionData[];
  featureTrend: FeatureTrendData[];
  topPages: TopPageData[];
  totalViews: number;
  totalFeatures: number;
}

interface FeaturesTabProps {
  days: number;
  userType: 'all' | 'internal' | 'external';
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const FeaturesTab = forwardRef<TabHandle, FeaturesTabProps>(function FeaturesTab(
  { days, userType, editMode },
  ref
) {
  const [data, setData] = useState<FeaturesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

  // Load layout from localStorage or use default
  const [layout, setLayout] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FEATURES_LAYOUT_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved features layout:', e);
        }
      }
    }
    return DEFAULT_FEATURES_LAYOUT;
  });

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    resetLayout: handleResetLayout,
    openWidgetCatalog: () => setShowWidgetCatalog(true),
  }));

  useEffect(() => {
    fetchData();
  }, [days, userType]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/metrics/features?days=${days}&userType=${userType}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Error fetching features data');
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
      localStorage.setItem(FEATURES_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Reset layout to default
  const handleResetLayout = () => {
    setLayout(DEFAULT_FEATURES_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FEATURES_LAYOUT_STORAGE_KEY);
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
      localStorage.setItem(FEATURES_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Update widget settings
  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newLayout = layout.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(FEATURES_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Delete widget
  const handleDeleteWidget = (widgetId: string) => {
    const newLayout = layout.filter((w) => w.id !== widgetId);
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(FEATURES_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
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
      case 'feature-usage':
        exportToCSV(
          formatFeatureViewsForExport(data.featureViews),
          `feature-usage-${timestamp}`
        );
        break;
      case 'feature-distribution':
        exportToCSV(
          formatFeatureDistributionForExport(data.featureViews),
          `feature-distribution-${timestamp}`
        );
        break;
      case 'feature-adoption':
        exportToCSV(
          formatFeatureAdoptionForExport(data.featureAdoption),
          `feature-adoption-${timestamp}`
        );
        break;
      case 'feature-trend':
        exportToCSV(
          formatFeatureTrendForExport(data.featureTrend),
          `feature-trend-${timestamp}`
        );
        break;
      case 'top-pages':
        exportToCSV(
          formatTopPagesForExport(data.topPages),
          `top-pages-${timestamp}`
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
      'feature-usage': <FeatureUsageWidget data={data.featureViews} />,
      'feature-distribution': <FeatureDistributionWidget data={data.featureViews} />,
      'feature-adoption': <FeatureAdoptionWidget data={data.featureAdoption} />,
      'feature-trend': <FeatureTrendWidget data={data.featureTrend} />,
      'top-pages': <TopPagesWidget data={data.topPages} />,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Feature Usage Widget Skeleton - horizontal bar chart */}
        <AxisSkeleton variant="chart" height="280px" />

        {/* Distribution + Adoption row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AxisSkeleton variant="chart" height="280px" />
          <AxisSkeleton variant="widget" height="280px" fullWidth />
        </div>

        {/* Feature Trend Chart Skeleton */}
        <AxisSkeleton variant="chart" height="280px" />

        {/* Top Pages Table Skeleton */}
        <AxisSkeleton variant="widget" height="320px" fullWidth />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <AxisCallout type="error" title="Failed to Load Features Data">
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
        catalog={FEATURES_WIDGET_CATALOG}
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
