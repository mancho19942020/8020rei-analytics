/**
 * AutoExportTab Component
 *
 * Features > 8020REI > Auto Export tab.
 * Displays 10 widgets derived from three Aurora tables:
 *   - auto_export_config_snapshot
 *   - auto_export_run_log
 *   - auto_export_daily_metrics
 *
 * Mirrors the PropertiesApiTab structure (forwardRef with resetLayout /
 * openWidgetCatalog exposed via TabHandle). Empty-state rendering is the
 * expected behavior until the monolith sync job PR merges and Backoffice
 * flips the cron — that's why this tab is shipped behind `disabled: true`
 * in navigation.ts.
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { buildDateQueryString } from '@/lib/date-utils';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  AutoExportOverviewWidget,
  AutoExportAdoptionTrendWidget,
  AutoExportFrequencyBreakdownWidget,
  AutoExportReliabilityWidget,
  AutoExportFailureReasonsWidget,
  AutoExportRuntimeTrendWidget,
  AutoExportVolumeTrendWidget,
  AutoExportTopClientsWidget,
  AutoExportConfigHealthWidget,
  AutoExportRunLogWidget,
} from '@/components/workspace/widgets';
import {
  DEFAULT_AUTO_EXPORT_LAYOUT,
  AUTO_EXPORT_LAYOUT_STORAGE_KEY,
  AUTO_EXPORT_WIDGET_CATALOG,
  loadLayout,
} from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import {
  exportToCSV,
  formatAutoExportOverviewForExport,
  formatAutoExportAdoptionForExport,
  formatAutoExportReliabilityForExport,
  formatAutoExportFailureReasonsForExport,
  formatAutoExportRuntimeForExport,
  formatAutoExportVolumeForExport,
  formatAutoExportFrequencyForExport,
  formatAutoExportTopClientsForExport,
  formatAutoExportConfigHealthForExport,
  formatAutoExportRunLogForExport,
} from '@/lib/export';
import { authFetch } from '@/lib/auth-fetch';
import type {
  AutoExportData,
  AutoExportRunLogPagination,
} from '@/types/auto-export';

interface AutoExportTabProps {
  days: number;
  startDate?: string;
  endDate?: string;
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

const EMPTY_DATA: AutoExportData = {
  overview: null,
  adoption: null,
  reliability: null,
  volume: null,
  configHealth: null,
  topClients: [],
  runLog: [],
};

const INITIAL_PAGINATION: AutoExportRunLogPagination = {
  page: 1,
  pageSize: 15,
  total: 0,
  totalPages: 0,
};

export const AutoExportTab = forwardRef<TabHandle, AutoExportTabProps>(
  function AutoExportTab({ days, startDate, endDate, editMode }, ref) {
    const [data, setData] = useState<AutoExportData>(EMPTY_DATA);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
    const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);
    const [runLogPagination, setRunLogPagination] = useState<AutoExportRunLogPagination>(INITIAL_PAGINATION);

    const [layout, setLayout] = useState<Widget[]>(() =>
      loadLayout(AUTO_EXPORT_LAYOUT_STORAGE_KEY, DEFAULT_AUTO_EXPORT_LAYOUT)
    );

    useImperativeHandle(ref, () => ({
      resetLayout: handleResetLayout,
      openWidgetCatalog: () => setShowWidgetCatalog(true),
    }));

    useEffect(() => {
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [days, startDate, endDate]);

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const dp = buildDateQueryString(days, startDate, endDate);
        const [
          overviewRes,
          adoptionRes,
          reliabilityRes,
          volumeRes,
          configHealthRes,
          topClientsRes,
          runLogRes,
        ] = await Promise.all([
          authFetch(`/api/auto-export?type=overview&${dp}`).then((r) => r.json()),
          authFetch(`/api/auto-export?type=adoption`).then((r) => r.json()),
          authFetch(`/api/auto-export?type=reliability&${dp}`).then((r) => r.json()),
          authFetch(`/api/auto-export?type=volume`).then((r) => r.json()),
          authFetch(`/api/auto-export?type=config-health`).then((r) => r.json()),
          authFetch(`/api/auto-export?type=top-clients&${dp}`).then((r) => r.json()),
          authFetch(`/api/auto-export?type=run-log&${dp}&page=1&pageSize=15`).then((r) => r.json()),
        ]);

        setData({
          overview: overviewRes.success ? overviewRes.data : null,
          adoption: adoptionRes.success ? adoptionRes.data : null,
          reliability: reliabilityRes.success ? reliabilityRes.data : null,
          volume: volumeRes.success ? volumeRes.data : null,
          configHealth: configHealthRes.success ? configHealthRes.data : null,
          topClients: topClientsRes.success ? topClientsRes.data : [],
          runLog: runLogRes.success ? runLogRes.data : [],
        });

        if (runLogRes.success && runLogRes.pagination) {
          setRunLogPagination(runLogRes.pagination);
        } else {
          setRunLogPagination(INITIAL_PAGINATION);
        }

        const allResponses = [
          overviewRes, adoptionRes, reliabilityRes, volumeRes,
          configHealthRes, topClientsRes, runLogRes,
        ];
        if (!allResponses.every((r) => r.success)) {
          const firstError = allResponses.find((r) => !r.success);
          setError(firstError?.error || 'Some data failed to load');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to API');
      }

      setLoading(false);
    }

    const fetchRunLogPage = useCallback(
      async (page: number) => {
        try {
          const dp = buildDateQueryString(days, startDate, endDate);
          const res = await authFetch(
            `/api/auto-export?type=run-log&${dp}&page=${page}&pageSize=15`
          );
          const json = await res.json();
          if (json.success) {
            setData((prev) => ({ ...prev, runLog: json.data }));
            setRunLogPagination(json.pagination);
          }
        } catch {
          // Silent — pagination failure shouldn't blow up the tab
        }
      },
      [days, startDate, endDate]
    );

    const handleLayoutChange = (newLayout: Widget[]) => {
      setLayout(newLayout);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTO_EXPORT_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
      }
    };

    const handleResetLayout = () => {
      setLayout(DEFAULT_AUTO_EXPORT_LAYOUT);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTO_EXPORT_LAYOUT_STORAGE_KEY);
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
      handleLayoutChange(layout.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)));
    };

    const handleDeleteWidget = (widgetId: string) => {
      handleLayoutChange(layout.filter((w) => w.id !== widgetId));
    };

    const handleOpenWidgetSettings = (widgetId: string) => {
      const widget = layout.find((w) => w.id === widgetId);
      if (widget) setSelectedWidgetForSettings(widget);
    };

    const handleWidgetExport = (widgetId: string) => {
      switch (widgetId) {
        case 'auto-export-overview':
          if (data.overview) exportToCSV(formatAutoExportOverviewForExport(data.overview), 'auto-export-overview');
          break;
        case 'auto-export-adoption-trend':
          if (data.adoption) exportToCSV(formatAutoExportAdoptionForExport(data.adoption), 'auto-export-adoption');
          break;
        case 'auto-export-frequency-breakdown':
          if (data.volume) exportToCSV(formatAutoExportFrequencyForExport(data.volume.frequency), 'auto-export-frequency');
          break;
        case 'auto-export-reliability':
          if (data.reliability) exportToCSV(formatAutoExportReliabilityForExport(data.reliability.stacks), 'auto-export-reliability');
          break;
        case 'auto-export-failure-reasons':
          if (data.reliability) exportToCSV(formatAutoExportFailureReasonsForExport(data.reliability.failureReasons), 'auto-export-failure-reasons');
          break;
        case 'auto-export-runtime-trend':
          if (data.reliability) exportToCSV(formatAutoExportRuntimeForExport(data.reliability.runtime), 'auto-export-runtime');
          break;
        case 'auto-export-volume-trend':
          if (data.volume) exportToCSV(formatAutoExportVolumeForExport(data.volume.series), 'auto-export-volume');
          break;
        case 'auto-export-top-clients':
          exportToCSV(formatAutoExportTopClientsForExport(data.topClients), 'auto-export-top-clients');
          break;
        case 'auto-export-config-health':
          if (data.configHealth) exportToCSV(formatAutoExportConfigHealthForExport(data.configHealth), 'auto-export-config-health');
          break;
        case 'auto-export-run-log':
          exportToCSV(formatAutoExportRunLogForExport(data.runLog), 'auto-export-run-log');
          break;
      }
    };

    const widgets = useMemo(() => {
      return {
        'auto-export-overview': data.overview ? <AutoExportOverviewWidget data={data.overview} /> : null,
        'auto-export-adoption-trend': data.adoption ? <AutoExportAdoptionTrendWidget data={data.adoption} /> : null,
        'auto-export-frequency-breakdown': data.volume ? <AutoExportFrequencyBreakdownWidget data={data.volume.frequency} /> : null,
        'auto-export-reliability': data.reliability ? <AutoExportReliabilityWidget data={data.reliability.stacks} /> : null,
        'auto-export-failure-reasons': data.reliability ? <AutoExportFailureReasonsWidget data={data.reliability.failureReasons} /> : null,
        'auto-export-runtime-trend': data.reliability ? <AutoExportRuntimeTrendWidget data={data.reliability.runtime} /> : null,
        'auto-export-volume-trend': data.volume ? <AutoExportVolumeTrendWidget data={data.volume.series} /> : null,
        'auto-export-top-clients': <AutoExportTopClientsWidget data={data.topClients} />,
        'auto-export-config-health': data.configHealth ? <AutoExportConfigHealthWidget data={data.configHealth} /> : null,
        'auto-export-run-log': (
          <AutoExportRunLogWidget
            data={data.runLog}
            pagination={runLogPagination}
            onPageChange={fetchRunLogPage}
          />
        ),
      };
    }, [data, runLogPagination, fetchRunLogPage]);

    if (loading) {
      return (
        <div className="space-y-4">
          <AxisSkeleton variant="widget" height="140px" fullWidth />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AxisSkeleton variant="chart" height="240px" />
            <AxisSkeleton variant="chart" height="240px" />
          </div>
          <AxisSkeleton variant="chart" height="300px" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AxisSkeleton variant="chart" height="240px" />
            <AxisSkeleton variant="chart" height="240px" />
          </div>
          <AxisSkeleton variant="chart" height="240px" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AxisSkeleton variant="widget" height="240px" />
            <AxisSkeleton variant="widget" height="240px" />
          </div>
          <AxisSkeleton variant="widget" height="360px" fullWidth />
        </div>
      );
    }

    if (error && !data.overview) {
      return (
        <div className="max-w-md mx-auto mt-8">
          <AxisCallout type="error" title="Failed to load Auto Export data">
            <p className="mb-4">{error}</p>
            <AxisButton onClick={fetchData} variant="filled">Retry</AxisButton>
          </AxisCallout>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {editMode && (
          <div className="mb-4">
            <AxisCallout type="info" title="Edit layout mode active">
              <p>Drag widgets to rearrange, resize from corners, or use the widget menu to configure.</p>
            </AxisCallout>
          </div>
        )}

        {error && data.overview && (
          <AxisCallout type="alert" title="Some numbers didn't load">
            <p>Refreshing usually resolves this. If it persists, reach out on #metrics-hub.</p>
          </AxisCallout>
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
          catalog={AUTO_EXPORT_WIDGET_CATALOG}
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
