'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  PaActiveUsersWidget,
  PaVisitorLogWidget,
  PaUsageTrendsWidget,
  PaPopularSectionsWidget,
  PaPeakHoursWidget,
  PaUserEngagementWidget,
} from '@/components/workspace/widgets';
import {
  DEFAULT_PLATFORM_ANALYTICS_LAYOUT,
  PLATFORM_ANALYTICS_LAYOUT_STORAGE_KEY,
  PLATFORM_ANALYTICS_WIDGET_CATALOG,
  loadLayout,
} from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import { exportToCSV } from '@/lib/export';
import { buildDateQueryString } from '@/lib/date-utils';
import { authFetch } from '@/lib/auth-fetch';

interface ActiveUsersData {
  users_today: number;
  users_7d: number;
  users_30d: number;
  total_sessions: number;
  unique_users: number;
}

interface VisitorLogEntry {
  session_id: string;
  user_email: string;
  user_name: string;
  session_start: { value: string } | string;
  session_end: { value: string } | string;
  duration_seconds: number;
  event_count: number;
  most_used_section: string;
}

interface PlatformAnalyticsData {
  visitorLog: VisitorLogEntry[];
  activeUsers: ActiveUsersData;
  usageTrends: { event_date: { value: string } | string; unique_users: number; sessions: number }[];
  popularSections: { section: string; subsection: string; detail_tab: string; views: number; unique_users: number }[];
  peakHours: { hour: number; events: number; unique_users: number }[];
  userEngagement: { section: string; total_seconds: number; unique_users: number }[];
}

interface PlatformAnalyticsTabProps {
  days: number;
  startDate?: string;
  endDate?: string;
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const PlatformAnalyticsTab = forwardRef<TabHandle, PlatformAnalyticsTabProps>(
  function PlatformAnalyticsTab({ days, startDate, endDate, editMode }, ref) {
    const [data, setData] = useState<PlatformAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
    const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

    const [layout, setLayout] = useState<Widget[]>(() =>
      loadLayout(PLATFORM_ANALYTICS_LAYOUT_STORAGE_KEY, DEFAULT_PLATFORM_ANALYTICS_LAYOUT)
    );

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
        const res = await authFetch(`/api/metrics/platform-analytics?${buildDateQueryString(days, startDate, endDate)}`);
        const json = await res.json();

        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Error fetching platform analytics data');
        }
      } catch {
        setError('Failed to connect to API');
      }

      setLoading(false);
    }

    const handleLayoutChange = (newLayout: Widget[]) => {
      setLayout(newLayout);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PLATFORM_ANALYTICS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
      }
    };

    const handleResetLayout = () => {
      setLayout(DEFAULT_PLATFORM_ANALYTICS_LAYOUT);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PLATFORM_ANALYTICS_LAYOUT_STORAGE_KEY);
      }
    };

    const handleAddWidget = (type: Widget['type'], title: string, size: { w: number; h: number }) => {
      const maxY = layout.reduce((max, w) => Math.max(max, w.y + w.h), 0);
      const newWidget: Widget = {
        id: `${type}-${Date.now()}`,
        type, title, x: 0, y: maxY,
        w: size.w, h: size.h, minW: 4, minH: 3,
      };
      const newLayout = [...layout, newWidget];
      setLayout(newLayout);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PLATFORM_ANALYTICS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
      }
    };

    const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
      const newLayout = layout.map(w => w.id === widgetId ? { ...w, ...updates } : w);
      setLayout(newLayout);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PLATFORM_ANALYTICS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
      }
    };

    const handleDeleteWidget = (widgetId: string) => {
      const newLayout = layout.filter(w => w.id !== widgetId);
      setLayout(newLayout);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PLATFORM_ANALYTICS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
      }
    };

    const handleOpenWidgetSettings = (widgetId: string) => {
      const widget = layout.find(w => w.id === widgetId);
      if (widget) setSelectedWidgetForSettings(widget);
    };

    const handleWidgetExport = useCallback((widgetId: string) => {
      if (!data) return;
      const timestamp = new Date().toISOString().split('T')[0];

      switch (widgetId) {
        case 'pa-visitor-log':
          exportToCSV(
            data.visitorLog.map(v => ({
              User: v.user_name,
              Email: v.user_email,
              'Login Time': typeof v.session_start === 'object' ? v.session_start.value : v.session_start,
              'Duration (s)': v.duration_seconds,
              Actions: v.event_count,
              'Most Used Section': v.most_used_section,
            })),
            `visitor-log-${timestamp}`
          );
          break;
        case 'pa-popular-sections':
          exportToCSV(
            data.popularSections.map(s => ({
              Section: s.section,
              Subsection: s.subsection,
              Tab: s.detail_tab,
              Views: s.views,
              'Unique Users': s.unique_users,
            })),
            `popular-sections-${timestamp}`
          );
          break;
        default:
          console.warn(`No export handler for widget: ${widgetId}`);
      }
    }, [data]);

    const widgets = useMemo(() => {
      if (!data) return {};
      return {
        'pa-active-users': <PaActiveUsersWidget data={data.activeUsers} />,
        'pa-visitor-log': <PaVisitorLogWidget data={data.visitorLog} />,
        'pa-usage-trends': <PaUsageTrendsWidget data={data.usageTrends} />,
        'pa-popular-sections': <PaPopularSectionsWidget data={data.popularSections} />,
        'pa-peak-hours': <PaPeakHoursWidget data={data.peakHours} />,
        'pa-user-engagement': <PaUserEngagementWidget data={data.userEngagement} />,
      };
    }, [data]);

    if (loading) {
      return (
        <div className="space-y-4">
          <AxisSkeleton variant="widget" height="140px" fullWidth />
          <AxisSkeleton variant="widget" height="420px" fullWidth />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AxisSkeleton variant="chart" height="300px" />
            <AxisSkeleton variant="chart" height="300px" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AxisSkeleton variant="chart" height="300px" />
            <AxisSkeleton variant="chart" height="300px" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="max-w-md mx-auto mt-8">
          <AxisCallout type="error" title="Failed to load platform analytics">
            <p className="mb-4">{error}</p>
            <AxisButton onClick={fetchData} variant="filled">Retry</AxisButton>
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
          catalog={PLATFORM_ANALYTICS_WIDGET_CATALOG}
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
  }
);
