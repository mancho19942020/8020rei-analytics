/**
 * AiTaskBoardTab Component
 *
 * Product Tasks > AI Task Board tab.
 * Tracks AI task board tasks, team workload, and board health.
 *
 * Data source: BigQuery project bigquery-467404, asana.ai_task_board
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  AsanaBoardOverviewWidget,
  AsanaTasksTableWidget,
  AsanaTeamWorkloadWidget,
  AsanaSectionBreakdownWidget,
  AsanaWeeklyTrendWidget,
  AsanaTaskAgingWidget,
  AsanaAlertsFeedWidget,
} from '@/components/workspace/widgets';
import {
  DEFAULT_AI_TASK_BOARD_LAYOUT,
  AI_TASK_BOARD_LAYOUT_STORAGE_KEY,
  AI_TASK_BOARD_WIDGET_CATALOG,
  loadLayout,
} from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import type { AiTaskBoardData } from '@/types/asana-tasks';
import { buildDateQueryString } from '@/lib/date-utils';
import { authFetch } from '@/lib/auth-fetch';

interface AiTaskBoardTabProps {
  days: number;
  startDate?: string;
  endDate?: string;
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const AiTaskBoardTab = forwardRef<TabHandle, AiTaskBoardTabProps>(function AiTaskBoardTab(
  { days, startDate, endDate, editMode },
  ref
) {
  const [data, setData] = useState<AiTaskBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

  const [layout, setLayout] = useState<Widget[]>(() =>
    loadLayout(AI_TASK_BOARD_LAYOUT_STORAGE_KEY, DEFAULT_AI_TASK_BOARD_LAYOUT)
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
      const res = await authFetch(`/api/metrics/asana-ai-board?${buildDateQueryString(days, startDate, endDate)}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Error fetching AI task board data');
      }
    } catch {
      setError('Failed to connect to API');
    }

    setLoading(false);
  }

  const handleLayoutChange = (newLayout: Widget[]) => {
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_TASK_BOARD_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleResetLayout = () => {
    setLayout(DEFAULT_AI_TASK_BOARD_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AI_TASK_BOARD_LAYOUT_STORAGE_KEY);
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
      localStorage.setItem(AI_TASK_BOARD_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newLayout = layout.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_TASK_BOARD_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleDeleteWidget = (widgetId: string) => {
    const newLayout = layout.filter((w) => w.id !== widgetId);
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_TASK_BOARD_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleOpenWidgetSettings = (widgetId: string) => {
    const widget = layout.find((w) => w.id === widgetId);
    if (widget) setSelectedWidgetForSettings(widget);
  };

  const handleWidgetExport = useCallback(() => {
    // Export support will be added in Phase 4
  }, []);

  const widgets = useMemo(() => {
    if (!data) return {};

    return {
      'asana-board-overview': <AsanaBoardOverviewWidget data={data.overview} />,
      'asana-tasks-table': <AsanaTasksTableWidget data={data.tasks} variant="ai-board" />,
      'asana-team-workload': <AsanaTeamWorkloadWidget data={data.teamWorkload} />,
      'asana-section-breakdown': <AsanaSectionBreakdownWidget data={data.sectionBreakdown} />,
      'asana-weekly-trend': <AsanaWeeklyTrendWidget data={data.weeklyTrend} />,
      'asana-task-aging': <AsanaTaskAgingWidget data={data.taskAging} />,
      'asana-alerts-feed': <AsanaAlertsFeedWidget tasks={data.tasks} teamWorkload={data.teamWorkload} />,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        <AxisSkeleton variant="widget" height="140px" fullWidth />
        <AxisSkeleton variant="chart" height="360px" />
        <div className="grid grid-cols-2 gap-4">
          <AxisSkeleton variant="chart" height="300px" />
          <AxisSkeleton variant="chart" height="300px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <AxisCallout type="error" title="Failed to load AI task board">
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
        catalog={AI_TASK_BOARD_WIDGET_CATALOG}
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
