/**
 * TrafficTab Component
 *
 * Chapter 5 of the 8020REI Metrics Dashboard.
 * Uses the GridWorkspace system for drag-and-drop widget arrangement.
 *
 * Displays traffic and user environment metrics:
 * - Traffic by Source
 * - Traffic by Medium
 * - Top Referrers
 * - Sessions by Day of Week
 * - First Visits Trend (new user acquisition)
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  TrafficBySourceWidget,
  TrafficByMediumWidget,
  TopReferrersWidget,
  SessionsByDayWidget,
  FirstVisitsTrendWidget,
} from '@/components/workspace/widgets';
import { DEFAULT_TRAFFIC_LAYOUT, TRAFFIC_LAYOUT_STORAGE_KEY, TRAFFIC_WIDGET_CATALOG } from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import {
  exportToCSV,
  formatTrafficBySourceForExport,
  formatTrafficByMediumForExport,
  formatTopReferrersForExport,
  formatSessionsByDayForExport,
  formatFirstVisitsTrendForExport,
} from '@/lib/export';

interface TrafficBySourceData {
  source: string;
  users: number;
  events: number;
}

interface TrafficByMediumData {
  medium: string;
  users: number;
  events: number;
}

interface TopReferrerData {
  referrer_domain: string;
  users: number;
  events: number;
}

interface SessionsByDayData {
  day_of_week: number;
  sessions: number;
}

interface FirstVisitsTrendData {
  event_date: string;
  first_visits: number;
}

interface TrafficData {
  trafficBySource: TrafficBySourceData[];
  trafficByMedium: TrafficByMediumData[];
  topReferrers: TopReferrerData[];
  sessionsByDayOfWeek: SessionsByDayData[];
  firstVisitsTrend: FirstVisitsTrendData[];
}

interface TrafficTabProps {
  days: number;
  userType: 'all' | 'internal' | 'external';
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const TrafficTab = forwardRef<TabHandle, TrafficTabProps>(function TrafficTab(
  { days, userType, editMode },
  ref
) {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

  // Load layout from localStorage or use default
  const [layout, setLayout] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TRAFFIC_LAYOUT_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved traffic layout:', e);
        }
      }
    }
    return DEFAULT_TRAFFIC_LAYOUT;
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
      const res = await fetch(`/api/metrics/traffic?days=${days}&userType=${userType}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Error fetching traffic data');
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
      localStorage.setItem(TRAFFIC_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Reset layout to default
  const handleResetLayout = () => {
    setLayout(DEFAULT_TRAFFIC_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TRAFFIC_LAYOUT_STORAGE_KEY);
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
      localStorage.setItem(TRAFFIC_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Update widget settings
  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newLayout = layout.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRAFFIC_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Delete widget
  const handleDeleteWidget = (widgetId: string) => {
    const newLayout = layout.filter((w) => w.id !== widgetId);
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRAFFIC_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
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
      case 'traffic-by-source':
        exportToCSV(
          formatTrafficBySourceForExport(data.trafficBySource),
          `traffic-by-source-${timestamp}`
        );
        break;
      case 'traffic-by-medium':
        exportToCSV(
          formatTrafficByMediumForExport(data.trafficByMedium),
          `traffic-by-medium-${timestamp}`
        );
        break;
      case 'top-referrers':
        exportToCSV(
          formatTopReferrersForExport(data.topReferrers),
          `top-referrers-${timestamp}`
        );
        break;
      case 'sessions-by-day':
        exportToCSV(
          formatSessionsByDayForExport(data.sessionsByDayOfWeek),
          `sessions-by-day-${timestamp}`
        );
        break;
      case 'first-visits-trend':
        exportToCSV(
          formatFirstVisitsTrendForExport(data.firstVisitsTrend),
          `first-visits-trend-${timestamp}`
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
      'traffic-by-source': <TrafficBySourceWidget data={data.trafficBySource} />,
      'traffic-by-medium': <TrafficByMediumWidget data={data.trafficByMedium} />,
      'top-referrers': <TopReferrersWidget data={data.topReferrers} />,
      'sessions-by-day': <SessionsByDayWidget data={data.sessionsByDayOfWeek} />,
      'first-visits-trend': <FirstVisitsTrendWidget data={data.firstVisitsTrend} />,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Traffic Source / Medium Skeleton - side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AxisSkeleton variant="chart" height="300px" />
          <AxisSkeleton variant="chart" height="300px" />
        </div>

        {/* Top Referrers Table Skeleton */}
        <AxisSkeleton variant="widget" height="280px" fullWidth />

        {/* Sessions by Day / First Visits Skeleton - side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AxisSkeleton variant="chart" height="300px" />
          <AxisSkeleton variant="chart" height="300px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <AxisCallout type="error" title="Failed to Load Traffic Data">
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
        catalog={TRAFFIC_WIDGET_CATALOG}
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
