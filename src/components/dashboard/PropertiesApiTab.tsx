/**
 * PropertiesApiTab Component
 *
 * Features > 8020REI > Properties API tab.
 * Displays usage metrics from the api_token_usage_logs Aurora table.
 *
 * Uses the GridWorkspace widget system, matching the established pattern
 * from ClientsTab / FeaturesTab / etc.
 *
 * Data source: AWS Aurora PostgreSQL via RDS Data API
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  ApiOverviewWidget,
  ApiCallsTrendWidget,
  ApiResponseTrendWidget,
  ApiEndpointBreakdownWidget,
  ApiTopClientsWidget,
  ApiErrorTrackerWidget,
  ApiRecentLogsWidget,
} from '@/components/workspace/widgets';
import {
  DEFAULT_PROPERTIES_API_LAYOUT,
  PROPERTIES_API_LAYOUT_STORAGE_KEY,
  PROPERTIES_API_WIDGET_CATALOG,
} from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import {
  exportToCSV,
  formatApiOverviewForExport,
  formatApiTimeSeriesForExport,
  formatApiEndpointBreakdownForExport,
  formatApiTopClientsForExport,
  formatApiErrorsForExport,
  formatApiRecentLogsForExport,
} from '@/lib/export';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OverviewData {
  totalCalls: number;
  uniqueClients: number;
  uniqueDomains: number;
  uniqueTokens: number;
  avgResponseMs: number;
  p95ResponseMs: number;
  totalErrors: number;
  errorRate: number;
  avgResultsReturned: number;
}

interface TimeSeriesPoint {
  date: string;
  calls: number;
  uniqueClients: number;
  avgResponseMs: number;
  errors: number;
  successes: number;
}

interface DomainBreakdown {
  domain: string;
  totalCalls: number;
  tokensUsed: number;
  avgResponseMs: number;
  maxResponseMs: number;
  errors: number;
  firstCall: string;
  lastCall: string;
}

interface EndpointBreakdown {
  endpoint: string;
  httpMethod: string;
  calls: number;
  avgResponseMs: number;
  p95Ms: number;
  avgResults: number;
  errors: number;
}

interface ErrorEntry {
  responseStatus: number;
  errorMessage: string | null;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  affectedClients: number;
  affectedDomains: number;
}

interface LogEntry {
  id: number;
  apiTokenId: number;
  clientId: number;
  domain: string;
  endpoint: string;
  httpMethod: string;
  responseStatus: number;
  resultsCount: number | null;
  responseTimeMs: number;
  ipAddress: string;
  userAgent: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface PropertiesApiData {
  overview: OverviewData | null;
  timeSeries: TimeSeriesPoint[];
  domains: DomainBreakdown[];
  endpoints: EndpointBreakdown[];
  errors: ErrorEntry[];
  recentLogs: LogEntry[];
}

interface PropertiesApiTabProps {
  days: number;
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PropertiesApiTab = forwardRef<TabHandle, PropertiesApiTabProps>(
  function PropertiesApiTab({ days, editMode }, ref) {
    const [data, setData] = useState<PropertiesApiData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
    const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);
    const [logPage, setLogPage] = useState(1);
    const [logPagination, setLogPagination] = useState({ page: 1, pageSize: 15, total: 0, totalPages: 0 });

    // Load layout from localStorage or use default
    const [layout, setLayout] = useState<Widget[]>(() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(PROPERTIES_API_LAYOUT_STORAGE_KEY);
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (e) {
            console.error('Failed to parse saved properties-api layout:', e);
          }
        }
      }
      return DEFAULT_PROPERTIES_API_LAYOUT;
    });

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      resetLayout: handleResetLayout,
      openWidgetCatalog: () => setShowWidgetCatalog(true),
    }));

    useEffect(() => {
      fetchData();
    }, [days]);

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const granularity = days <= 7 ? 'hour' : 'day';

        const [overviewRes, timeSeriesRes, clientsRes, endpointsRes, errorsRes, logsRes] =
          await Promise.all([
            fetch(`/api/properties-api?type=overview&days=${days}`).then((r) => r.json()),
            fetch(`/api/properties-api?type=usage-over-time&days=${days}&granularity=${granularity}`).then((r) => r.json()),
            fetch(`/api/properties-api?type=by-client&days=${days}&limit=20`).then((r) => r.json()),
            fetch(`/api/properties-api?type=by-endpoint&days=${days}`).then((r) => r.json()),
            fetch(`/api/properties-api?type=errors&days=${days}`).then((r) => r.json()),
            fetch(`/api/properties-api?type=recent-logs&days=${days}&page=1&pageSize=15`).then((r) => r.json()),
          ]);

        setData({
          overview: overviewRes.success ? overviewRes.data : null,
          timeSeries: timeSeriesRes.success ? timeSeriesRes.data : [],
          domains: clientsRes.success ? clientsRes.data : [],
          endpoints: endpointsRes.success ? endpointsRes.data : [],
          errors: errorsRes.success ? errorsRes.data : [],
          recentLogs: logsRes.success ? logsRes.data : [],
        });

        if (logsRes.success) {
          setLogPagination(logsRes.pagination);
          setLogPage(1);
        }

        const allSuccess = [overviewRes, timeSeriesRes, clientsRes, endpointsRes, errorsRes, logsRes].every((r) => r.success);
        if (!allSuccess) {
          const firstError = [overviewRes, timeSeriesRes, clientsRes, endpointsRes, errorsRes, logsRes].find((r) => !r.success);
          setError(firstError?.error || 'Some data failed to load');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to API');
      }

      setLoading(false);
    }

    // Load a different page of logs
    const fetchLogs = useCallback(async (page: number) => {
      try {
        const res = await fetch(`/api/properties-api?type=recent-logs&days=${days}&page=${page}&pageSize=15`);
        const json = await res.json();
        if (json.success) {
          setData((prev) => prev ? { ...prev, recentLogs: json.data } : prev);
          setLogPagination(json.pagination);
          setLogPage(page);
        }
      } catch {
        // Silently fail pagination
      }
    }, [days]);

    // Layout handlers
    const handleLayoutChange = (newLayout: Widget[]) => {
      setLayout(newLayout);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PROPERTIES_API_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
      }
    };

    const handleResetLayout = () => {
      setLayout(DEFAULT_PROPERTIES_API_LAYOUT);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PROPERTIES_API_LAYOUT_STORAGE_KEY);
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
      if (!data) return;
      switch (widgetId) {
        case 'api-overview':
          if (data.overview) exportToCSV(formatApiOverviewForExport(data.overview), 'properties-api-overview');
          break;
        case 'api-calls-trend':
        case 'api-response-trend':
          exportToCSV(formatApiTimeSeriesForExport(data.timeSeries), 'properties-api-trend');
          break;
        case 'api-endpoint-breakdown':
          exportToCSV(formatApiEndpointBreakdownForExport(data.endpoints), 'properties-api-endpoints');
          break;
        case 'api-top-clients':
          exportToCSV(formatApiTopClientsForExport(data.domains), 'properties-api-domains');
          break;
        case 'api-error-tracker':
          exportToCSV(formatApiErrorsForExport(data.errors), 'properties-api-errors');
          break;
        case 'api-recent-logs':
          exportToCSV(formatApiRecentLogsForExport(data.recentLogs), 'properties-api-logs');
          break;
      }
    };

    // Widget mapping
    const widgets = useMemo(() => {
      if (!data) return {};
      return {
        'api-overview': data.overview ? <ApiOverviewWidget data={data.overview} /> : null,
        'api-calls-trend': <ApiCallsTrendWidget data={data.timeSeries} />,
        'api-response-trend': <ApiResponseTrendWidget data={data.timeSeries} />,
        'api-endpoint-breakdown': <ApiEndpointBreakdownWidget data={data.endpoints} />,
        'api-top-clients': <ApiTopClientsWidget data={data.domains} />,
        'api-error-tracker': <ApiErrorTrackerWidget data={data.errors} />,
        'api-recent-logs': (
          <ApiRecentLogsWidget
            data={data.recentLogs}
            pagination={logPagination}
            onPageChange={fetchLogs}
          />
        ),
      };
    }, [data, logPagination, fetchLogs]);

    // Loading state
    if (loading) {
      return (
        <div className="space-y-4">
          <AxisSkeleton variant="widget" height="140px" fullWidth />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AxisSkeleton variant="chart" height="300px" />
            <AxisSkeleton variant="chart" height="300px" />
          </div>
          <AxisSkeleton variant="widget" height="280px" fullWidth />
          <AxisSkeleton variant="widget" height="280px" fullWidth />
        </div>
      );
    }

    // Error state (full failure)
    if (error && !data?.overview) {
      return (
        <div className="max-w-md mx-auto mt-8">
          <AxisCallout type="error" title="Failed to load Properties API data">
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

        {/* Partial error banner */}
        {error && data?.overview && (
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
          catalog={PROPERTIES_API_WIDGET_CATALOG}
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
