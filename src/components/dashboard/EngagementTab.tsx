/**
 * EngagementTab Component
 *
 * Displays user engagement patterns — how and when users interact with the platform.
 * Replaces the former Traffic tab with metrics that are meaningful for a non-organic SaaS product.
 *
 * Widgets:
 * - Sessions by Day of Week
 * - First Visits Trend (new user acquisition)
 * - Peak Hours Heatmap
 * - Average Session Duration Trend
 * - Sessions per User Trend
 * - Active Days per User Distribution
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  SessionsByDayWidget,
  FirstVisitsTrendWidget,
  PeakHoursWidget,
  AvgSessionDurationWidget,
  SessionsPerUserWidget,
  ActiveDaysWidget,
} from '@/components/workspace/widgets';
import {
  DEFAULT_ENGAGEMENT_LAYOUT,
  ENGAGEMENT_LAYOUT_STORAGE_KEY,
  ENGAGEMENT_WIDGET_CATALOG,
  loadLayout,
} from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import {
  exportToCSV,
  formatSessionsByDayForExport,
  formatFirstVisitsTrendForExport,
} from '@/lib/export';
import { buildDateQueryString } from '@/lib/date-utils';
import { authFetch } from '@/lib/auth-fetch';

interface SessionsByDayData {
  day_of_week: number;
  sessions: number;
}

interface FirstVisitsTrendData {
  event_date: string;
  first_visits: number;
}

interface PeakHoursData {
  day_of_week: number;
  hour: number;
  sessions: number;
}

interface AvgSessionDurationData {
  event_date: string;
  avg_duration_sec: number;
  total_sessions: number;
}

interface SessionsPerUserData {
  event_date: string;
  sessions_per_user: number;
  total_sessions: number;
  unique_users: number;
}

interface ActiveDaysData {
  active_days: number;
  user_count: number;
}

interface EngagementData {
  sessionsByDayOfWeek: SessionsByDayData[];
  firstVisitsTrend: FirstVisitsTrendData[];
  peakHours: PeakHoursData[];
  avgSessionDuration: AvgSessionDurationData[];
  sessionsPerUser: SessionsPerUserData[];
  activeDays: ActiveDaysData[];
}

interface EngagementTabProps {
  days: number;
  userType: 'all' | 'internal' | 'external' | 'unclassified';
  startDate?: string;
  endDate?: string;
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const EngagementTab = forwardRef<TabHandle, EngagementTabProps>(function EngagementTab(
  { days, userType, startDate, endDate, editMode },
  ref
) {
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

  const [layout, setLayout] = useState<Widget[]>(() =>
    loadLayout(ENGAGEMENT_LAYOUT_STORAGE_KEY, DEFAULT_ENGAGEMENT_LAYOUT)
  );

  useImperativeHandle(ref, () => ({
    resetLayout: handleResetLayout,
    openWidgetCatalog: () => setShowWidgetCatalog(true),
  }));

  useEffect(() => {
    fetchData();
  }, [days, userType, startDate, endDate]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`/api/metrics/engagement?${buildDateQueryString(days, startDate, endDate)}&userType=${userType}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Error fetching engagement data');
      }
    } catch {
      setError('Failed to connect to API');
    }

    setLoading(false);
  }

  const handleLayoutChange = (newLayout: Widget[]) => {
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ENGAGEMENT_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleResetLayout = () => {
    setLayout(DEFAULT_ENGAGEMENT_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ENGAGEMENT_LAYOUT_STORAGE_KEY);
    }
  };

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
      localStorage.setItem(ENGAGEMENT_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newLayout = layout.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ENGAGEMENT_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleDeleteWidget = (widgetId: string) => {
    const newLayout = layout.filter((w) => w.id !== widgetId);
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ENGAGEMENT_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleOpenWidgetSettings = (widgetId: string) => {
    const widget = layout.find((w) => w.id === widgetId);
    if (widget) {
      setSelectedWidgetForSettings(widget);
    }
  };

  const handleWidgetExport = useCallback((widgetId: string) => {
    if (!data) return;

    const timestamp = new Date().toISOString().split('T')[0];

    switch (widgetId) {
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

  const widgets = useMemo(() => {
    if (!data) return {};

    return {
      'sessions-by-day': <SessionsByDayWidget data={data.sessionsByDayOfWeek} />,
      'first-visits-trend': <FirstVisitsTrendWidget data={data.firstVisitsTrend} />,
      'peak-hours': <PeakHoursWidget data={data.peakHours} />,
      'avg-session-duration': <AvgSessionDurationWidget data={data.avgSessionDuration} />,
      'sessions-per-user': <SessionsPerUserWidget data={data.sessionsPerUser} />,
      'active-days': <ActiveDaysWidget data={data.activeDays} />,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AxisSkeleton variant="chart" height="300px" />
          <AxisSkeleton variant="chart" height="300px" />
        </div>
        <AxisSkeleton variant="widget" height="280px" fullWidth />
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
        <AxisCallout type="error" title="Failed to load engagement data">
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
      {editMode && (
        <div className="mb-4">
          <AxisCallout type="info" title="Edit layout mode active">
            <p className="text-body-regular">
              Drag widgets by their handle icon to reposition them. Resize widgets by dragging their edges.
              Your layout will be saved automatically.
            </p>
          </AxisCallout>
        </div>
      )}

      <GridWorkspace
        layout={layout}
        onLayoutChange={handleLayoutChange}
        editMode={editMode}
        widgets={widgets}
        onWidgetSettings={handleOpenWidgetSettings}
        onWidgetExport={handleWidgetExport}
      />

      <WidgetCatalog
        isOpen={showWidgetCatalog}
        onClose={() => setShowWidgetCatalog(false)}
        onAddWidget={handleAddWidget}
        existingWidgets={layout}
        catalog={ENGAGEMENT_WIDGET_CATALOG}
      />

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
