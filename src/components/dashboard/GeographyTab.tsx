/**
 * GeographyTab Component
 *
 * Chapter 7 of the 8020REI Metrics Dashboard.
 * Uses the GridWorkspace system for drag-and-drop widget arrangement.
 *
 * Displays geographic location metrics:
 * - Users by Country (bar chart)
 * - Activity by Continent (donut chart)
 * - Users by State/Region (table - US focused)
 * - Users by City (table - US focused)
 */

'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { GridWorkspace, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import {
  CountryWidget,
  ContinentWidget,
  RegionWidget,
  CityWidget,
} from '@/components/workspace/widgets';
import { DEFAULT_GEOGRAPHY_LAYOUT, GEOGRAPHY_LAYOUT_STORAGE_KEY, GEOGRAPHY_WIDGET_CATALOG } from '@/lib/workspace/defaultLayouts';
import { Widget, TabHandle } from '@/types/widget';
import {
  exportToCSV,
  formatCountryForExport,
  formatContinentForExport,
  formatRegionForExport,
  formatCityForExport,
} from '@/lib/export';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface CountryData {
  country: string;
  users: number;
  events: number;
  percentage?: number;
  trend?: TrendData;
}

interface RegionData {
  region: string;
  users: number;
  events: number;
}

interface CityData {
  city: string;
  region: string;
  users: number;
  events: number;
}

interface ContinentData {
  continent: string;
  users: number;
  events: number;
}

interface GeographyData {
  byCountry: CountryData[];
  byRegion: RegionData[];
  byCity: CityData[];
  byContinent: ContinentData[];
}

interface GeographyTabProps {
  days: number;
  userType: 'all' | 'internal' | 'external';
  editMode: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const GeographyTab = forwardRef<TabHandle, GeographyTabProps>(function GeographyTab(
  { days, userType, editMode },
  ref
) {
  const [data, setData] = useState<GeographyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);

  // Load layout from localStorage or use default
  const [layout, setLayout] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GEOGRAPHY_LAYOUT_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved geography layout:', e);
        }
      }
    }
    return DEFAULT_GEOGRAPHY_LAYOUT;
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
      const res = await fetch(`/api/metrics/geography?days=${days}&userType=${userType}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Error fetching geography data');
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
      localStorage.setItem(GEOGRAPHY_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Reset layout to default
  const handleResetLayout = () => {
    setLayout(DEFAULT_GEOGRAPHY_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GEOGRAPHY_LAYOUT_STORAGE_KEY);
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
      localStorage.setItem(GEOGRAPHY_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Update widget settings
  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newLayout = layout.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GEOGRAPHY_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Delete widget
  const handleDeleteWidget = (widgetId: string) => {
    const newLayout = layout.filter((w) => w.id !== widgetId);
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GEOGRAPHY_LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
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
      case 'country':
        exportToCSV(
          formatCountryForExport(data.byCountry),
          `users-by-country-${timestamp}`
        );
        break;
      case 'continent':
        exportToCSV(
          formatContinentForExport(data.byContinent),
          `activity-by-continent-${timestamp}`
        );
        break;
      case 'region':
        exportToCSV(
          formatRegionForExport(data.byRegion),
          `users-by-state-${timestamp}`
        );
        break;
      case 'city':
        exportToCSV(
          formatCityForExport(data.byCity),
          `users-by-city-${timestamp}`
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
      'country': <CountryWidget data={data.byCountry} />,
      'continent': <ContinentWidget data={data.byContinent} />,
      'region': <RegionWidget data={data.byRegion} />,
      'city': <CityWidget data={data.byCity} />,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Country / Continent Skeleton - 2 cards in a row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AxisSkeleton variant="chart" height="280px" />
          <AxisSkeleton variant="chart" height="280px" />
        </div>

        {/* Region / City Tables Skeleton - 2 cards in a row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AxisSkeleton variant="widget" height="280px" />
          <AxisSkeleton variant="widget" height="280px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <AxisCallout type="error" title="Failed to Load Geography Data">
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
        catalog={GEOGRAPHY_WIDGET_CATALOG}
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
