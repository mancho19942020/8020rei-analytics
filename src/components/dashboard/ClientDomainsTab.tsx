/**
 * ClientDomainsTab Component
 *
 * Product > Client Domains tab.
 * Tracks domain uploads, leads, appointments, deals, revenue,
 * and flags inactive/problematic domains.
 *
 * Data source: BigQuery project bigquery-467404, table feedback_clients_unique
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  DomainActivityOverviewWidget,
  DomainLeaderboardWidget,
  DomainActivityTrendWidget,
  RevenueByDomainWidget,
  FlaggedDomainsWidget,
} from '@/components/workspace/widgets';
import {
  DEFAULT_PRODUCT_DOMAINS_LAYOUT,
  PRODUCT_DOMAINS_LAYOUT_STORAGE_KEY,
  PRODUCT_DOMAINS_WIDGET_CATALOG,
} from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import type { ClientDomainsData } from '@/types/product';
import {
  exportToCSV,
  formatDomainActivityOverviewForExport,
  formatDomainLeaderboardForExport,
  formatDomainActivityTrendForExport,
  formatRevenueByDomainForExport,
  formatFlaggedDomainsForExport,
} from '@/lib/export';

interface ClientDomainsTabProps {
  days: number;
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const ClientDomainsTab = forwardRef<TabHandle, ClientDomainsTabProps>(function ClientDomainsTab(
  { days, editMode },
  ref
) {
  const [data, setData] = useState<ClientDomainsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

  // Load layout from localStorage or use default
  const [layout, setLayout] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PRODUCT_DOMAINS_LAYOUT_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved product domains layout:', e);
        }
      }
    }
    return DEFAULT_PRODUCT_DOMAINS_LAYOUT;
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
      const res = await fetch(`/api/metrics/product-domains?days=${days}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Error fetching domain data');
      }
    } catch (err) {
      setError('Failed to connect to API');
    }

    setLoading(false);
  }

  const handleLayoutChange = (newLayout: Widget[]) => {
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PRODUCT_DOMAINS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleResetLayout = () => {
    setLayout(DEFAULT_PRODUCT_DOMAINS_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PRODUCT_DOMAINS_LAYOUT_STORAGE_KEY);
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
      localStorage.setItem(PRODUCT_DOMAINS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newLayout = layout.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PRODUCT_DOMAINS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleDeleteWidget = (widgetId: string) => {
    const newLayout = layout.filter((w) => w.id !== widgetId);
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PRODUCT_DOMAINS_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
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
      case 'domain-activity-overview':
        exportToCSV(
          formatDomainActivityOverviewForExport(data.overview),
          `domain-activity-overview-${timestamp}`
        );
        break;
      case 'domain-leaderboard':
        exportToCSV(
          formatDomainLeaderboardForExport(data.leaderboard),
          `domain-leaderboard-${timestamp}`
        );
        break;
      case 'domain-activity-trend':
        exportToCSV(
          formatDomainActivityTrendForExport(data.activityTrend),
          `domain-activity-trend-${timestamp}`
        );
        break;
      case 'revenue-by-domain':
        exportToCSV(
          formatRevenueByDomainForExport(data.revenueByDomain),
          `revenue-by-domain-${timestamp}`
        );
        break;
      case 'flagged-domains':
        exportToCSV(
          formatFlaggedDomainsForExport(data.flaggedDomains),
          `flagged-domains-${timestamp}`
        );
        break;
      default:
        console.warn(`No export handler for widget: ${widgetId}`);
    }
  }, [data]);

  const widgets = useMemo(() => {
    if (!data) return {};

    return {
      'domain-activity-overview': <DomainActivityOverviewWidget data={data.overview} />,
      'domain-leaderboard': <DomainLeaderboardWidget data={data.leaderboard} />,
      'domain-activity-trend': <DomainActivityTrendWidget data={data.activityTrend} />,
      'revenue-by-domain': <RevenueByDomainWidget data={data.revenueByDomain} />,
      'flagged-domains': <FlaggedDomainsWidget data={data.flaggedDomains} />,
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
        <AxisSkeleton variant="chart" height="300px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <AxisCallout type="error" title="Failed to Load Domain Data">
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
          <AxisCallout type="info" title="Edit Mode Active">
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
        catalog={PRODUCT_DOMAINS_WIDGET_CATALOG}
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
