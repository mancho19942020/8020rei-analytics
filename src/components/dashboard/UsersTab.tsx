/**
 * UsersTab Component
 *
 * Chapter 2 of the 8020REI Metrics Dashboard.
 * Uses the GridWorkspace system for drag-and-drop widget arrangement.
 *
 * Displays user behavior and retention metrics:
 * - DAU/WAU/MAU scorecards
 * - New vs Returning users stacked bar chart
 * - Sessions per user, Bounce rate, Engaged rate
 * - Session summary
 *
 * Exposes resetLayout and openWidgetCatalog methods via ref for parent control.
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  UserActivityWidget,
  NewVsReturningWidget,
  EngagementMetricsWidget,
  SessionSummaryWidget,
} from '@/components/workspace/widgets';
import { DEFAULT_USERS_LAYOUT, USERS_LAYOUT_STORAGE_KEY, USERS_WIDGET_CATALOG } from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import {
  exportToCSV,
  formatUserActivityForExport,
  formatNewVsReturningForExport,
  formatEngagementMetricsForExport,
  formatSessionSummaryForExport,
} from '@/lib/export';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface UserActivityMetrics {
  dau: number;
  wau: number;
  mau: number;
  trends?: {
    dau: TrendData;
    wau: TrendData;
    mau: TrendData;
  };
}

interface NewVsReturningData {
  event_date: string;
  new_users: number;
  returning_users: number;
}

interface EngagementMetrics {
  total_sessions: number;
  engaged_sessions: number;
  avg_engagement_time_sec: number;
  unique_users: number;
  sessions_per_user: number;
  engaged_rate: number;
  bounce_rate: number;
  trends?: {
    total_sessions: TrendData;
    engaged_sessions: TrendData;
    avg_engagement_time_sec: TrendData;
    unique_users: TrendData;
    sessions_per_user: TrendData;
    engaged_rate: TrendData;
    bounce_rate: TrendData;
  };
}

interface UsersData {
  activityMetrics: UserActivityMetrics;
  newVsReturning: NewVsReturningData[];
  engagementMetrics: EngagementMetrics;
}

interface UsersTabProps {
  days: number;
  userType: 'all' | 'internal' | 'external';
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const UsersTab = forwardRef<TabHandle, UsersTabProps>(function UsersTab(
  { days, userType, editMode },
  ref
) {
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

  // Load layout from localStorage or use default
  const [layout, setLayout] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(USERS_LAYOUT_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved users layout:', e);
        }
      }
    }
    return DEFAULT_USERS_LAYOUT;
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
      const res = await fetch(`/api/metrics/users?days=${days}&userType=${userType}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Error fetching users data');
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
      localStorage.setItem(USERS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Reset layout to default
  const handleResetLayout = () => {
    setLayout(DEFAULT_USERS_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USERS_LAYOUT_STORAGE_KEY);
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
      localStorage.setItem(USERS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Update widget settings
  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newLayout = layout.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Delete widget
  const handleDeleteWidget = (widgetId: string) => {
    const newLayout = layout.filter((w) => w.id !== widgetId);
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
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
      case 'user-activity':
        exportToCSV(
          formatUserActivityForExport(data.activityMetrics),
          `user-activity-${timestamp}`
        );
        break;
      case 'new-vs-returning':
        exportToCSV(
          formatNewVsReturningForExport(data.newVsReturning),
          `new-vs-returning-users-${timestamp}`
        );
        break;
      case 'engagement-metrics':
        exportToCSV(
          formatEngagementMetricsForExport(data.engagementMetrics),
          `engagement-metrics-${timestamp}`
        );
        break;
      case 'session-summary':
        exportToCSV(
          formatSessionSummaryForExport({
            total_sessions: data.engagementMetrics.total_sessions,
            unique_users: data.engagementMetrics.unique_users,
            trends: data.engagementMetrics.trends ? {
              total_sessions: data.engagementMetrics.trends.total_sessions,
              unique_users: data.engagementMetrics.trends.unique_users,
            } : undefined,
          }),
          `session-summary-${timestamp}`
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
      'user-activity': <UserActivityWidget data={data.activityMetrics} />,
      'new-vs-returning': <NewVsReturningWidget data={data.newVsReturning} />,
      'engagement-metrics': <EngagementMetricsWidget data={data.engagementMetrics} />,
      'session-summary': (
        <SessionSummaryWidget
          data={{
            total_sessions: data.engagementMetrics.total_sessions,
            unique_users: data.engagementMetrics.unique_users,
            trends: data.engagementMetrics.trends ? {
              total_sessions: data.engagementMetrics.trends.total_sessions,
              unique_users: data.engagementMetrics.trends.unique_users,
            } : undefined,
          }}
        />
      ),
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* User Activity Widget Skeleton - minimalistic block */}
        <AxisSkeleton variant="widget" height="140px" fullWidth />

        {/* New vs Returning Chart Skeleton - simple chart block */}
        <AxisSkeleton variant="chart" height="320px" />

        {/* Engagement Metrics Widget Skeleton */}
        <AxisSkeleton variant="widget" height="140px" fullWidth />

        {/* Session Summary Widget Skeleton */}
        <AxisSkeleton variant="widget" height="100px" fullWidth />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <AxisCallout type="error" title="Failed to Load Users Data">
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
        catalog={USERS_WIDGET_CATALOG}
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
