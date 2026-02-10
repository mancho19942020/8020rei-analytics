/**
 * ClientsTab Component
 *
 * Chapter 4 of the 8020REI Metrics Dashboard.
 * Uses the GridWorkspace system for drag-and-drop widget arrangement.
 *
 * Displays client activity metrics:
 * - Client overview scorecards (total clients, events, page views, avg users/client)
 * - Top clients table with drill-down capability
 * - Client activity trend chart
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  ClientsOverviewWidget,
  ClientsTableWidget,
  ClientActivityTrendWidget,
} from '@/components/workspace/widgets';
import { DEFAULT_CLIENTS_LAYOUT, CLIENTS_LAYOUT_STORAGE_KEY, CLIENTS_WIDGET_CATALOG } from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import {
  exportToCSV,
  formatClientsOverviewForExport,
  formatTopClientsDetailedForExport,
  formatClientActivityTrendForExport,
} from '@/lib/export';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface ClientsOverview {
  total_clients: number;
  total_events: number;
  total_page_views: number;
  total_users: number;
  avg_users_per_client: number;
  trends?: {
    total_clients: TrendData;
    total_events: TrendData;
    total_page_views: TrendData;
    total_users: TrendData;
    avg_users_per_client: TrendData;
  };
}

interface ClientData {
  client: string;
  events: number;
  users: number;
  page_views: number;
  features_used: number;
}

interface ClientActivityData {
  event_date: string;
  client: string;
  users: number;
  events: number;
}

interface ClientsData {
  overview: ClientsOverview;
  topClients: ClientData[];
  activityTrend: ClientActivityData[];
}

interface ClientsTabProps {
  days: number;
  userType: 'all' | 'internal' | 'external';
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const ClientsTab = forwardRef<TabHandle, ClientsTabProps>(function ClientsTab(
  { days, userType, editMode },
  ref
) {
  const [data, setData] = useState<ClientsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Load layout from localStorage or use default
  const [layout, setLayout] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CLIENTS_LAYOUT_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved clients layout:', e);
        }
      }
    }
    return DEFAULT_CLIENTS_LAYOUT;
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
      const res = await fetch(`/api/metrics/clients?days=${days}&userType=${userType}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Error fetching clients data');
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
      localStorage.setItem(CLIENTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Reset layout to default
  const handleResetLayout = () => {
    setLayout(DEFAULT_CLIENTS_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CLIENTS_LAYOUT_STORAGE_KEY);
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
      localStorage.setItem(CLIENTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Update widget settings
  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newLayout = layout.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CLIENTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Delete widget
  const handleDeleteWidget = (widgetId: string) => {
    const newLayout = layout.filter((w) => w.id !== widgetId);
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CLIENTS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Open widget settings
  const handleOpenWidgetSettings = (widgetId: string) => {
    const widget = layout.find((w) => w.id === widgetId);
    if (widget) {
      setSelectedWidgetForSettings(widget);
    }
  };

  // Handle client selection for drill-down
  const handleClientSelect = useCallback((client: string | null) => {
    setSelectedClient(client);
  }, []);

  // Handle widget export
  const handleWidgetExport = useCallback((widgetId: string) => {
    if (!data) return;

    const timestamp = new Date().toISOString().split('T')[0];

    switch (widgetId) {
      case 'clients-overview':
        exportToCSV(
          formatClientsOverviewForExport(data.overview),
          `clients-overview-${timestamp}`
        );
        break;
      case 'clients-table':
        exportToCSV(
          formatTopClientsDetailedForExport(data.topClients),
          `top-clients-${timestamp}`
        );
        break;
      case 'client-activity-trend':
        // Filter by selected client if one is selected
        const trendData = selectedClient
          ? data.activityTrend.filter(d => d.client === selectedClient)
          : data.activityTrend;
        exportToCSV(
          formatClientActivityTrendForExport(trendData),
          `client-activity-trend-${selectedClient || 'all'}-${timestamp}`
        );
        break;
      default:
        console.warn(`No export handler for widget: ${widgetId}`);
    }
  }, [data, selectedClient]);

  // Create widgets mapping
  const widgets = useMemo(() => {
    if (!data) return {};

    return {
      'clients-overview': <ClientsOverviewWidget data={data.overview} />,
      'clients-table': (
        <ClientsTableWidget
          data={data.topClients}
          selectedClient={selectedClient}
          onClientSelect={handleClientSelect}
        />
      ),
      'client-activity-trend': (
        <ClientActivityTrendWidget
          data={data.activityTrend}
          selectedClient={selectedClient}
        />
      ),
    };
  }, [data, selectedClient, handleClientSelect]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Clients Overview Widget Skeleton - minimalistic block */}
        <AxisSkeleton variant="widget" height="140px" fullWidth />

        {/* Clients Table Skeleton - simple table block */}
        <AxisSkeleton variant="chart" height="360px" />

        {/* Client Activity Trend Chart Skeleton */}
        <AxisSkeleton variant="chart" height="300px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <AxisCallout type="error" title="Failed to Load Clients Data">
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

      {/* Selected Client Info */}
      {selectedClient && !editMode && (
        <div className="mb-4">
          <AxisCallout type="info" title="Client Drill-Down Active">
            <p className="text-body-regular">
              Viewing data for <strong>{selectedClient}</strong>. The activity trend chart is filtered to show only this client.
              Click the same client in the table or use the clear button to view all clients.
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
        catalog={CLIENTS_WIDGET_CATALOG}
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
