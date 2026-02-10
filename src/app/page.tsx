'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DesignKitButton } from '@/components/DesignKitButton';
import { Logo } from '@/components/Logo';
import { AxisSelect, AxisSelectOption, AxisSkeleton, AxisCallout, AxisButton, AxisNavigationTab, AxisNavigationTabItem, AxisToggle } from '@/components/axis';
import { GridWorkspace, MetricsOverviewWidget, TimeSeriesWidget, BarChartWidget, DataTableWidget, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import { UsersTab } from '@/components/dashboard/UsersTab';
import { FeaturesTab } from '@/components/dashboard/FeaturesTab';
import { ClientsTab } from '@/components/dashboard/ClientsTab';
import { TrafficTab } from '@/components/dashboard/TrafficTab';
import { TechnologyTab } from '@/components/dashboard/TechnologyTab';
import { GeographyTab } from '@/components/dashboard/GeographyTab';
import { EventsTab } from '@/components/dashboard/EventsTab';
import { InsightsTab } from '@/components/dashboard/InsightsTab';
import { DEFAULT_LAYOUT, LAYOUT_STORAGE_KEY, OVERVIEW_WIDGET_CATALOG } from '@/lib/workspace/defaultLayouts';
import {
  exportToCSV,
  formatMetricsForExport,
  formatTimeSeriesForExport,
  formatFeatureUsageForExport,
  formatClientsForExport,
} from '@/lib/export';
import { Widget, TabHandle } from '@/types/widget';

interface DashboardData {
  metrics: {
    total_users: number;
    total_events: number;
    page_views: number;
    active_clients: number;
  };
  usersByDay: { event_date: string; users: number; events: number }[];
  featureUsage: { feature: string; views: number }[];
  topClients: { client: string; events: number; users: number; page_views: number }[];
}

const TIME_RANGE_OPTIONS: AxisSelectOption[] = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const USER_TYPE_OPTIONS: AxisSelectOption[] = [
  { value: 'all', label: 'All Users' },
  { value: 'internal', label: 'Internal Users' },
  { value: 'external', label: 'External Users' },
];

// First-level navigation - Data Sources
const DATA_SOURCE_TABS: AxisNavigationTabItem[] = [
  {
    id: '8020rei-ga4',
    name: '8020REI GA4',
  },
  {
    id: '8020roofing-ga4',
    name: '8020ROOFING GA4',
    disabled: true,
  },
  {
    id: 'operational',
    name: 'Operational',
    disabled: true,
  },
  {
    id: 'zillow',
    name: 'Zillow',
    disabled: true,
  },
  {
    id: 'skiptrace',
    name: 'Skiptrace',
    disabled: true,
  },
];

// Second-level navigation - Section tabs (for 8020REI GA4)
const NAVIGATION_TABS: AxisNavigationTabItem[] = [
  {
    id: 'overview',
    name: 'Overview',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'users',
    name: 'Users',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'features',
    name: 'Features',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  {
    id: 'clients',
    name: 'Clients',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'traffic',
    name: 'Traffic',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    id: 'technology',
    name: 'Technology',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'geography',
    name: 'Geography',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'events',
    name: 'Events',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'insights',
    name: 'Insights',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState(30);
  const [userType, setUserType] = useState<'all' | 'internal' | 'external'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [activeDataSource, setActiveDataSource] = useState('8020rei-ga4');
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<Widget | null>(null);
  const [layout, setLayout] = useState<Widget[]>(() => {
    // Load saved layout from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved layout:', e);
        }
      }
    }
    return DEFAULT_LAYOUT;
  });

  // Refs for tab components to enable toolbar actions
  const usersTabRef = useRef<TabHandle>(null);
  const featuresTabRef = useRef<TabHandle>(null);
  const clientsTabRef = useRef<TabHandle>(null);
  const trafficTabRef = useRef<TabHandle>(null);
  const technologyTabRef = useRef<TabHandle>(null);
  const geographyTabRef = useRef<TabHandle>(null);
  const eventsTabRef = useRef<TabHandle>(null);
  const insightsTabRef = useRef<TabHandle>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [days, userType, user]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/metrics?days=${days}&userType=${userType}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setLastUpdated(json.timestamp || new Date().toISOString());
        setIsCached(json.cached || false);
      } else {
        setError(json.error || 'Error fetching data');
      }
    } catch (err) {
      setError('Failed to connect to API');
    }

    setLoading(false);
  }

  // Handle layout changes
  const handleLayoutChange = (newLayout: Widget[]) => {
    setLayout(newLayout);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Reset layout to default (unified for all tabs)
  const handleResetLayout = () => {
    switch (activeTab) {
      case 'overview':
        setLayout(DEFAULT_LAYOUT);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(LAYOUT_STORAGE_KEY);
        }
        break;
      case 'users':
        usersTabRef.current?.resetLayout();
        break;
      case 'features':
        featuresTabRef.current?.resetLayout();
        break;
      case 'clients':
        clientsTabRef.current?.resetLayout();
        break;
      case 'traffic':
        trafficTabRef.current?.resetLayout();
        break;
      case 'technology':
        technologyTabRef.current?.resetLayout();
        break;
      case 'geography':
        geographyTabRef.current?.resetLayout();
        break;
      case 'events':
        eventsTabRef.current?.resetLayout();
        break;
      case 'insights':
        insightsTabRef.current?.resetLayout();
        break;
    }
  };

  // Open widget catalog (unified for all tabs)
  const handleOpenWidgetCatalog = () => {
    switch (activeTab) {
      case 'overview':
        setShowWidgetCatalog(true);
        break;
      case 'users':
        usersTabRef.current?.openWidgetCatalog();
        break;
      case 'features':
        featuresTabRef.current?.openWidgetCatalog();
        break;
      case 'clients':
        clientsTabRef.current?.openWidgetCatalog();
        break;
      case 'traffic':
        trafficTabRef.current?.openWidgetCatalog();
        break;
      case 'technology':
        technologyTabRef.current?.openWidgetCatalog();
        break;
      case 'geography':
        geographyTabRef.current?.openWidgetCatalog();
        break;
      case 'events':
        eventsTabRef.current?.openWidgetCatalog();
        break;
      case 'insights':
        insightsTabRef.current?.openWidgetCatalog();
        break;
    }
  };

  // Add a new widget
  const handleAddWidget = (type: Widget['type'], title: string, size: { w: number; h: number }) => {
    // Find the lowest y position to place new widget at the bottom
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
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Update widget settings
  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newLayout = layout.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Delete widget
  const handleDeleteWidget = (widgetId: string) => {
    const newLayout = layout.filter((w) => w.id !== widgetId);
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  // Open widget settings
  const handleOpenWidgetSettings = (widgetId: string) => {
    const widget = layout.find((w) => w.id === widgetId);
    if (widget) {
      setSelectedWidgetForSettings(widget);
    }
  };

  // Export widget data
  const handleExportWidget = (widgetId: string) => {
    if (!data) return;

    const widget = layout.find((w) => w.id === widgetId);
    if (!widget) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${widget.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;

    switch (widget.type) {
      case 'metrics':
        exportToCSV(formatMetricsForExport(data.metrics), filename);
        break;
      case 'timeseries':
        exportToCSV(formatTimeSeriesForExport(data.usersByDay), filename);
        break;
      case 'barchart':
        exportToCSV(formatFeatureUsageForExport(data.featureUsage), filename);
        break;
      case 'table':
        exportToCSV(formatClientsForExport(data.topClients), filename);
        break;
    }
  };

  // Create widgets mapping
  const widgets = useMemo(() => {
    if (!data) return {};

    // Keys must match widget TYPE (not id) since GridWorkspace looks up by type
    return {
      'metrics': <MetricsOverviewWidget data={data.metrics} />,
      'timeseries': <TimeSeriesWidget data={data.usersByDay} />,
      'barchart': <BarChartWidget data={data.featureUsage} />,
      'table': <DataTableWidget data={data.topClients} />,
    };
  }, [data]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main-700 mx-auto mb-4"></div>
          <p className="text-body-large text-content-secondary">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base">
        <div className="w-full">
          {/* Header Skeleton - minimal bar */}
          <div className="px-6 py-3 border-b border-stroke">
            <div className="flex justify-between items-center">
              <AxisSkeleton variant="custom" width="120px" height="24px" rounded="md" />
              <div className="flex gap-2">
                <AxisSkeleton variant="button" size="sm" />
                <AxisSkeleton variant="button" size="sm" />
              </div>
            </div>
          </div>

          {/* Navigation Skeleton - simple horizontal bar */}
          <div className="px-6 py-3 border-b border-stroke light-gray-bg">
            <AxisSkeleton variant="custom" width="100%" height="32px" rounded="md" />
          </div>

          {/* Second Navigation Skeleton */}
          <div className="px-6 py-3 border-b border-stroke light-gray-bg">
            <AxisSkeleton variant="custom" width="60%" height="32px" rounded="md" />
          </div>

          {/* Toolbar Skeleton - simple bar */}
          <div className="px-6 py-2 border-b border-stroke light-gray-bg">
            <div className="flex justify-between items-center">
              <AxisSkeleton variant="custom" width="180px" height="24px" rounded="md" />
              <div className="flex gap-2">
                <AxisSkeleton variant="custom" width="120px" height="32px" rounded="md" />
                <AxisSkeleton variant="custom" width="120px" height="32px" rounded="md" />
              </div>
            </div>
          </div>

          {/* Main Content - Minimalistic widget blocks */}
          <div className="px-6 py-4 min-h-[calc(100vh-180px)] light-gray-bg">
            {/* Top row - metrics widgets */}
            <div className="mb-4">
              <AxisSkeleton variant="widget" height="120px" fullWidth />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <AxisSkeleton variant="chart" height="300px" />
              <AxisSkeleton variant="chart" height="300px" />
            </div>

            {/* Table widget */}
            <AxisSkeleton variant="widget" height="280px" fullWidth />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <AxisCallout type="error" title="Failed to Load Data">
            <p className="mb-4">{error}</p>
            <AxisButton onClick={fetchData} variant="filled">
              Retry
            </AxisButton>
          </AxisCallout>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="w-full">
        {/* Header */}
        <header className="px-6 py-3 border-b border-stroke">
          <div className="flex justify-between items-center gap-4">
            {/* Logo */}
            <Logo className="h-4 w-auto" />

            {/* Right side actions - consistent height */}
            <div className="flex items-center gap-2">
              {/* Design Kit */}
              <div className="h-9 flex items-center">
                <DesignKitButton />
              </div>

              {/* Theme Toggle */}
              <div className="h-9 flex items-center">
                <ThemeToggle />
              </div>

              {/* User Info */}
              {user && (
                <div className="h-9 flex items-center gap-2 px-3 bg-surface-raised rounded-lg border border-stroke">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-content-primary max-w-[120px] truncate">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                </div>
              )}

              {/* Sign Out Button */}
              <button
                onClick={signOut}
                className="h-9 px-3 bg-surface-raised border border-stroke text-content-secondary hover:bg-surface-base hover:text-content-primary hover:border-stroke-strong rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* First-Level Navigation - Data Sources */}
        <nav className="px-6 border-b border-stroke light-gray-bg">
          <AxisNavigationTab
            activeTab={activeDataSource}
            onTabChange={setActiveDataSource}
            tabs={DATA_SOURCE_TABS}
            variant="line"
            size="sm"
          />
        </nav>

        {/* Second-Level Navigation - Section Tabs (only show for active data source) */}
        {activeDataSource === '8020rei-ga4' && (
          <nav className="px-6 border-b border-stroke light-gray-bg">
            <AxisNavigationTab
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={NAVIGATION_TABS}
              variant="line"
              size="sm"
            />
          </nav>
        )}

        {/* Toolbar */}
        <div className="px-6 py-2 border-b border-stroke light-gray-bg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-content-tertiary">
                  Updated: {new Date(lastUpdated).toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                  {isCached && ' (cached)'}
                </span>
              )}

              {/* Edit Mode Toggle */}
              <div className="flex items-center gap-2">
                <AxisToggle
                  checked={editMode}
                  onChange={setEditMode}
                  label="Edit Layout"
                />

                {/* Edit Mode Actions - Available for all tabs */}
                {editMode && (
                  <>
                    <button
                      onClick={handleOpenWidgetCatalog}
                      className="px-2 py-1 text-xs bg-main-600 hover:bg-main-700 text-white rounded-md transition-colors duration-200 font-medium flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Widget
                    </button>
                    <button
                      onClick={handleResetLayout}
                      className="px-2 py-1 text-xs bg-surface-base border border-stroke text-content-secondary hover:bg-surface-raised hover:text-content-primary hover:border-stroke-strong rounded-md transition-colors duration-200 font-medium"
                    >
                      Reset Layout
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              {/* User Type Filter */}
              <AxisSelect
                value={userType}
                onChange={(val) => setUserType(val as 'all' | 'internal' | 'external')}
                options={USER_TYPE_OPTIONS}
                size="sm"
                fullWidth={false}
                className="w-36"
              />

              {/* Time Filter */}
              <AxisSelect
                value={days}
                onChange={(val) => setDays(Number(val))}
                options={TIME_RANGE_OPTIONS}
                size="sm"
                fullWidth={false}
                className="w-36"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-6 py-4 min-h-[calc(100vh-180px)] light-gray-bg">
          {/* Overview Tab - Grid Workspace */}
          {activeTab === 'overview' && (
            <>
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

              <GridWorkspace
                layout={layout}
                onLayoutChange={handleLayoutChange}
                editMode={editMode}
                widgets={widgets}
                onWidgetSettings={handleOpenWidgetSettings}
                onWidgetExport={handleExportWidget}
              />
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <UsersTab
              ref={usersTabRef}
              days={days}
              userType={userType}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <FeaturesTab
              ref={featuresTabRef}
              days={days}
              userType={userType}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <ClientsTab
              ref={clientsTabRef}
              days={days}
              userType={userType}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Traffic Tab */}
          {activeTab === 'traffic' && (
            <TrafficTab
              ref={trafficTabRef}
              days={days}
              userType={userType}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Technology Tab */}
          {activeTab === 'technology' && (
            <TechnologyTab
              ref={technologyTabRef}
              days={days}
              userType={userType}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Geography Tab */}
          {activeTab === 'geography' && (
            <GeographyTab
              ref={geographyTabRef}
              days={days}
              userType={userType}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <EventsTab
              ref={eventsTabRef}
              days={days}
              userType={userType}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <InsightsTab
              ref={insightsTabRef}
              days={days}
              userType={userType}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Placeholder for other tabs */}
          {!['overview', 'users', 'features', 'clients', 'traffic', 'technology', 'geography', 'events', 'insights'].includes(activeTab) && (
            <div className="flex items-center justify-center h-64">
              <AxisCallout type="info" title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} - Coming Soon`}>
                <p className="text-body-regular">
                  This tab is currently under development. Check back soon!
                </p>
              </AxisCallout>
            </div>
          )}
        </main>
      </div>

      {/* Widget Catalog Modal */}
      <WidgetCatalog
        isOpen={showWidgetCatalog}
        onClose={() => setShowWidgetCatalog(false)}
        onAddWidget={handleAddWidget}
        existingWidgets={layout}
        catalog={OVERVIEW_WIDGET_CATALOG}
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
