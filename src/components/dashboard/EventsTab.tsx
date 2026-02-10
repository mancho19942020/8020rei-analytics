/**
 * EventsTab Component
 *
 * Chapter 8 of the 8020REI Metrics Dashboard.
 * Uses the GridWorkspace system for drag-and-drop widget arrangement.
 *
 * Displays events metrics:
 * - Event Breakdown (horizontal bar chart)
 * - Event Volume Trend (stacked bar chart)
 * - Event Metrics (scorecards: events/session, form conversion, etc.)
 * - Scroll Depth by Page (table)
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  EventBreakdownWidget,
  EventVolumeTrendWidget,
  EventMetricsWidget,
  ScrollDepthWidget,
} from '@/components/workspace/widgets';
import { DEFAULT_EVENTS_LAYOUT, EVENTS_LAYOUT_STORAGE_KEY, EVENTS_WIDGET_CATALOG } from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import {
  exportToCSV,
  formatEventBreakdownForExport,
  formatEventVolumeTrendForExport,
  formatEventMetricsForExport,
  formatScrollDepthForExport,
} from '@/lib/export';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface EventBreakdownData {
  event_name: string;
  count: number;
  unique_users: number;
  trend?: TrendData;
  percentage?: number;
}

interface EventVolumeTrendData {
  event_date: string;
  event_name: string;
  count: number;
}

interface EventMetricsData {
  total_events: number;
  total_sessions: number;
  events_per_session: number;
  form_starts: number;
  form_submits: number;
  form_conversion_rate: number;
  clicks: number;
  scrolls: number;
  trends?: {
    events_per_session: TrendData;
    form_conversion_rate: TrendData;
    total_events: TrendData;
  };
}

interface ScrollDepthData {
  page: string;
  scroll_events: number;
  unique_users: number;
}

interface EventsData {
  eventBreakdown: EventBreakdownData[];
  eventVolumeTrend: EventVolumeTrendData[];
  eventMetrics: EventMetricsData;
  scrollDepthByPage: ScrollDepthData[];
}

interface EventsTabProps {
  days: number;
  userType: 'all' | 'internal' | 'external';
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const EventsTab = forwardRef<TabHandle, EventsTabProps>(function EventsTab(
  { days, userType, editMode },
  ref
) {
  const [data, setData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

  // Load layout from localStorage or use default
  const [layout, setLayout] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(EVENTS_LAYOUT_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved events layout:', e);
        }
      }
    }
    return DEFAULT_EVENTS_LAYOUT;
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
      const res = await fetch(`/api/metrics/events?days=${days}&userType=${userType}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Error fetching events data');
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
      localStorage.setItem(EVENTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Reset layout to default
  const handleResetLayout = () => {
    setLayout(DEFAULT_EVENTS_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(EVENTS_LAYOUT_STORAGE_KEY);
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
      localStorage.setItem(EVENTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Update widget settings
  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newLayout = layout.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(EVENTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Delete widget
  const handleDeleteWidget = (widgetId: string) => {
    const newLayout = layout.filter((w) => w.id !== widgetId);
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(EVENTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
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
      case 'event-breakdown':
        exportToCSV(
          formatEventBreakdownForExport(data.eventBreakdown),
          `event-breakdown-${timestamp}`
        );
        break;
      case 'event-volume-trend':
        exportToCSV(
          formatEventVolumeTrendForExport(data.eventVolumeTrend),
          `event-volume-trend-${timestamp}`
        );
        break;
      case 'event-metrics':
        exportToCSV(
          formatEventMetricsForExport(data.eventMetrics),
          `event-metrics-${timestamp}`
        );
        break;
      case 'scroll-depth':
        exportToCSV(
          formatScrollDepthForExport(data.scrollDepthByPage),
          `scroll-depth-${timestamp}`
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
      'event-breakdown': <EventBreakdownWidget data={data.eventBreakdown} />,
      'event-volume-trend': <EventVolumeTrendWidget data={data.eventVolumeTrend} />,
      'event-metrics': <EventMetricsWidget data={data.eventMetrics} />,
      'scroll-depth': <ScrollDepthWidget data={data.scrollDepthByPage} />,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Event Breakdown Skeleton */}
        <AxisSkeleton variant="chart" height="320px" />

        {/* Event Volume Trend Skeleton */}
        <AxisSkeleton variant="chart" height="320px" />

        {/* Event Metrics Skeleton - 4 cards in a row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AxisSkeleton variant="widget" height="140px" />
          <AxisSkeleton variant="widget" height="140px" />
          <AxisSkeleton variant="widget" height="140px" />
          <AxisSkeleton variant="widget" height="140px" />
        </div>

        {/* Scroll Depth Table Skeleton */}
        <AxisSkeleton variant="widget" height="280px" fullWidth />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <AxisCallout type="error" title="Failed to Load Events Data">
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
        catalog={EVENTS_WIDGET_CATALOG}
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
