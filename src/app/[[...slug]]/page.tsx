'use client';

import { useState, useEffect, useMemo, useCallback, Suspense, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/firebase/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DesignKitButton } from '@/components/DesignKitButton';
import { Logo } from '@/components/Logo';
import { AxisSelect, AxisSelectOption, AxisSkeleton, AxisCallout, AxisButton, AxisNavigationTab, AxisToggle, AxisDateRangePicker, DateRangeValue } from '@/components/axis';
import { GridWorkspace, MetricsOverviewWidget, TimeSeriesWidget, BarChartWidget, DataTableWidget, WidgetCatalog, WidgetSettings } from '@/components/workspace';
import { DEFAULT_LAYOUT, LAYOUT_STORAGE_KEY, OVERVIEW_WIDGET_CATALOG } from '@/lib/workspace/defaultLayouts';
import {
  MAIN_SECTION_TABS,
  SUBSECTION_TABS_MAP,
  GA4_DETAIL_TABS,
  FEATURES_REI_DETAIL_TABS,
  FEATURES_ROOFING_DETAIL_TABS,
  PIPELINES_REI_DETAIL_TABS,
  PIPELINES_ROOFING_DETAIL_TABS,
  getDetailTabsForSubsection,
  getDefaultDetailTab,
  buildNavUrl,
  parseNavFromSlug,
} from '@/lib/navigation';
import { useTabRefs } from '@/hooks/useTabRefs';
import {
  exportToCSV,
  formatMetricsForExport,
  formatTimeSeriesForExport,
  formatFeatureUsageForExport,
  formatClientsForExport,
} from '@/lib/export';
import { Widget } from '@/types/widget';

// Lazy-load tab components — only loaded when the user navigates to them
const TabSkeleton = () => <div className="flex-1 flex items-center justify-center p-8"><AxisSkeleton variant="custom" width="100%" height="256px" /></div>;

const UsersTab = dynamic(() => import('@/components/dashboard/UsersTab').then(m => m.UsersTab), { loading: TabSkeleton, ssr: false });
const FeaturesTab = dynamic(() => import('@/components/dashboard/FeaturesTab').then(m => m.FeaturesTab), { loading: TabSkeleton, ssr: false });
const ClientsTab = dynamic(() => import('@/components/dashboard/ClientsTab').then(m => m.ClientsTab), { loading: TabSkeleton, ssr: false });
const TrafficTab = dynamic(() => import('@/components/dashboard/TrafficTab').then(m => m.TrafficTab), { loading: TabSkeleton, ssr: false });
const TechnologyTab = dynamic(() => import('@/components/dashboard/TechnologyTab').then(m => m.TechnologyTab), { loading: TabSkeleton, ssr: false });
const GeographyTab = dynamic(() => import('@/components/dashboard/GeographyTab').then(m => m.GeographyTab), { loading: TabSkeleton, ssr: false });
const EventsTab = dynamic(() => import('@/components/dashboard/EventsTab').then(m => m.EventsTab), { loading: TabSkeleton, ssr: false });
const InsightsTab = dynamic(() => import('@/components/dashboard/InsightsTab').then(m => m.InsightsTab), { loading: TabSkeleton, ssr: false });
const EngagementCallsTab = dynamic(() => import('@/components/dashboard/EngagementCallsTab').then(m => m.EngagementCallsTab), { loading: TabSkeleton, ssr: false });
const GrafanaTab = dynamic(() => import('@/components/dashboard/GrafanaTab').then(m => m.GrafanaTab), { loading: TabSkeleton, ssr: false });
const PropertiesApiTab = dynamic(() => import('@/components/dashboard/PropertiesApiTab').then(m => m.PropertiesApiTab), { loading: TabSkeleton, ssr: false });
const ClientDomainsTab = dynamic(() => import('@/components/dashboard/ClientDomainsTab').then(m => m.ClientDomainsTab), { loading: TabSkeleton, ssr: false });

interface MetricValues {
  total_users: number;
  total_events: number;
  page_views: number;
  active_clients: number;
}

interface DashboardData {
  metrics: MetricValues;
  previousMetrics: MetricValues | null;
  usersByDay: { event_date: string; users: number; events: number }[];
  featureUsage: { feature: string; views: number }[];
  topClients: { client: string; events: number; users: number; page_views: number }[];
}


const USER_TYPE_OPTIONS: AxisSelectOption[] = [
  { value: 'all', label: 'All Users' },
  { value: 'internal', label: 'Internal Users' },
  { value: 'external', label: 'External Users' },
  { value: 'unclassified', label: 'Unclassified' },
];

function Dashboard({ slug }: { slug: string[] }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeValue>({ type: 'preset', days: 30 });
  const days = dateRange.type === 'preset' ? dateRange.days : 30;
  const startDate = dateRange.type === 'custom' ? dateRange.startDate : undefined;
  const endDate = dateRange.type === 'custom' ? dateRange.endDate : undefined;
  const [userType, setUserType] = useState<'all' | 'internal' | 'external' | 'unclassified'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Parse navigation state from URL path segments
  const initialNav = useMemo(() => parseNavFromSlug(slug), []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Navigation state (3 levels) — initialized from URL path
  const [activeMainSection, setActiveMainSection] = useState(initialNav.section);
  const [activeSubsection, setActiveSubsection] = useState(initialNav.sub);
  const [activeDetailTab, setActiveDetailTab] = useState(initialNav.tab);
  const [editMode, setEditMode] = useState(false);
  const [showEditCallout, setShowEditCallout] = useState(false);
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

  // Sync navigation state → clean URL path (replaceState to avoid history spam)
  useEffect(() => {
    const sub = SUBSECTION_TABS_MAP[activeMainSection] ? activeSubsection : '';
    const tab = getDetailTabsForSubsection(activeMainSection, activeSubsection) ? activeDetailTab : '';
    const newUrl = buildNavUrl(activeMainSection, sub, tab);
    window.history.replaceState(null, '', newUrl);
  }, [activeMainSection, activeSubsection, activeDetailTab]);

  // Tab refs for imperative actions (resetLayout, openWidgetCatalog)
  const tabRefs = useTabRefs();

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
  }, [dateRange, userType, user]);

  useEffect(() => {
    if (editMode) setShowEditCallout(true);
  }, [editMode]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    const dateParams = dateRange.type === 'custom'
      ? `startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      : `days=${dateRange.days}`;

    try {
      const res = await fetch(`/api/metrics?${dateParams}&userType=${userType}`);
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
    // Overview tab has its own layout state (not in a ref)
    if (activeDetailTab === 'overview' && activeMainSection === 'analytics') {
      setLayout(DEFAULT_LAYOUT);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
      }
      return;
    }
    tabRefs.resetLayout(activeMainSection, activeSubsection, activeDetailTab);
  };

  // Open widget catalog (unified for all tabs)
  const handleOpenWidgetCatalog = () => {
    // Overview tab has its own catalog state (not in a ref)
    if (activeDetailTab === 'overview' && activeMainSection === 'analytics') {
      setShowWidgetCatalog(true);
      return;
    }
    tabRefs.openWidgetCatalog(activeMainSection, activeSubsection, activeDetailTab);
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
      'metrics': <MetricsOverviewWidget data={data.metrics} previousData={data.previousMetrics ?? undefined} />,
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
          <div className="mx-auto mb-4 w-fit"><AxisSkeleton variant="custom" width="48px" height="48px" rounded="full" /></div>
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
      <div className="h-screen flex flex-col bg-surface-base">
        <div className="w-full flex flex-col flex-1 min-h-0">
          {/* Header Skeleton - minimal bar */}
          <div className="flex-shrink-0 px-6 py-3 border-b border-stroke chrome-bg">
            <div className="flex justify-between items-center">
              <AxisSkeleton variant="custom" width="120px" height="24px" rounded="md" />
              <div className="flex gap-2">
                <AxisSkeleton variant="button" size="sm" />
                <AxisSkeleton variant="button" size="sm" />
              </div>
            </div>
          </div>

          {/* Navigation Skeleton - simple horizontal bar */}
          <div className="flex-shrink-0 px-6 py-3 border-b border-stroke chrome-bg">
            <AxisSkeleton variant="custom" width="100%" height="32px" rounded="md" />
          </div>

          {/* Second Navigation Skeleton */}
          <div className="flex-shrink-0 px-6 py-3 border-b border-stroke chrome-bg">
            <AxisSkeleton variant="custom" width="60%" height="32px" rounded="md" />
          </div>

          {/* Toolbar Skeleton - simple bar */}
          <div className="flex-shrink-0 px-6 py-2 border-b border-stroke chrome-bg">
            <div className="flex justify-between items-center">
              <AxisSkeleton variant="custom" width="180px" height="24px" rounded="md" />
              <div className="flex gap-2">
                <AxisSkeleton variant="custom" width="120px" height="32px" rounded="md" />
                <AxisSkeleton variant="custom" width="120px" height="32px" rounded="md" />
              </div>
            </div>
          </div>

          {/* Main Content - Minimalistic widget blocks */}
          <div className="flex-1 overflow-y-auto px-6 py-4 light-gray-bg">
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
    <div className="h-screen flex flex-col bg-surface-base">
      <div className="w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <header className="flex-shrink-0 px-6 py-3 border-b border-stroke chrome-bg">
          <div className="flex justify-between items-center gap-4">
            {/* Logo */}
            <Logo className="h-4 w-auto" />

            {/* Right side actions - consistent height */}
            <div className="flex items-center gap-2">

              {/* Global Tools */}
              <div className="flex items-center gap-2">
                {/* Updated timestamp */}
                {lastUpdated && (
                  <span className="text-xs text-content-tertiary whitespace-nowrap">
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

                {/* Edit Layout Toggle */}
                <AxisToggle
                  checked={editMode}
                  onChange={setEditMode}
                  label="Edit Layout"
                />

                {/* User Type Filter */}
                {activeMainSection !== 'customer-success' && !(activeMainSection === 'feedback-loop' && activeSubsection === 'import') && (
                  <AxisSelect
                  value={userType}
                  onChange={(val) => setUserType(val as 'all' | 'internal' | 'external' | 'unclassified')}
                    options={USER_TYPE_OPTIONS}
                    size="sm"
                    fullWidth={false}
                    className="w-36"
                  />
                )}

                {/* Time Filter */}
                <AxisDateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  size="sm"
                />
              </div>

              {/* Divider */}
              <div className="h-5 w-px bg-stroke mx-1" />

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

        {/* First-Level Navigation - Main Sections */}
        <nav className="flex-shrink-0 px-6 border-b border-stroke chrome-bg">
          <AxisNavigationTab
            activeTab={activeMainSection}
            onTabChange={(section) => {
              setActiveMainSection(section);
              // Reset subsection to first available when changing main section
              const subsections = SUBSECTION_TABS_MAP[section];
              if (subsections && subsections.length > 0) {
                const firstEnabled = subsections.find(s => !s.disabled);
                if (firstEnabled) {
                  setActiveSubsection(firstEnabled.id);
                  const defaultTab = getDefaultDetailTab(firstEnabled.id);
                  if (defaultTab) setActiveDetailTab(defaultTab);
                }
              }
            }}
            tabs={MAIN_SECTION_TABS}
            variant="line"
            size="sm"
          />
        </nav>

        {/* Second-Level Navigation - Sub-sections (show for all main sections) */}
        {SUBSECTION_TABS_MAP[activeMainSection] && (
          <nav className="flex-shrink-0 px-6 border-b border-stroke chrome-bg">
            <AxisNavigationTab
              activeTab={activeSubsection}
              onTabChange={(sub) => {
                setActiveSubsection(sub);
                const defaultTab = getDefaultDetailTab(sub);
                if (defaultTab) setActiveDetailTab(defaultTab);
              }}
              tabs={SUBSECTION_TABS_MAP[activeMainSection]}
              variant="line"
              size="sm"
            />
          </nav>
        )}

        {/* Third-Level Navigation - Detail Tabs (for GA4 analytics sections) */}
        {activeMainSection === 'analytics' && (activeSubsection === '8020rei-ga4' || activeSubsection === '8020roofing-ga4') && (
          <nav className="flex-shrink-0 px-6 border-b border-stroke chrome-bg">
            <AxisNavigationTab
              activeTab={activeDetailTab}
              onTabChange={setActiveDetailTab}
              tabs={GA4_DETAIL_TABS}
              variant="line"
              size="sm"
            />
          </nav>
        )}

        {/* Third-Level Navigation - Detail Tabs for Features > 8020 REI */}
        {activeMainSection === 'features' && activeSubsection === 'features-rei' && (
          <nav className="flex-shrink-0 px-6 border-b border-stroke chrome-bg">
            <AxisNavigationTab
              activeTab={activeDetailTab}
              onTabChange={setActiveDetailTab}
              tabs={FEATURES_REI_DETAIL_TABS}
              variant="line"
              size="sm"
            />
          </nav>
        )}

        {/* Third-Level Navigation - Detail Tabs for Features > 8020 Roofing */}
        {activeMainSection === 'features' && activeSubsection === 'features-roofing' && (
          <nav className="flex-shrink-0 px-6 border-b border-stroke chrome-bg">
            <AxisNavigationTab
              activeTab={activeDetailTab}
              onTabChange={setActiveDetailTab}
              tabs={FEATURES_ROOFING_DETAIL_TABS}
              variant="line"
              size="sm"
            />
          </nav>
        )}

        {/* Third-Level Navigation - Detail Tabs for Pipelines > 8020 REI */}
        {activeMainSection === 'pipelines' && activeSubsection === 'pipelines-rei' && (
          <nav className="flex-shrink-0 px-6 border-b border-stroke chrome-bg">
            <AxisNavigationTab
              activeTab={activeDetailTab}
              onTabChange={setActiveDetailTab}
              tabs={PIPELINES_REI_DETAIL_TABS}
              variant="line"
              size="sm"
            />
          </nav>
        )}

        {/* Third-Level Navigation - Detail Tabs for Pipelines > 8020 Roofing */}
        {activeMainSection === 'pipelines' && activeSubsection === 'pipelines-roofing' && (
          <nav className="flex-shrink-0 px-6 border-b border-stroke chrome-bg">
            <AxisNavigationTab
              activeTab={activeDetailTab}
              onTabChange={setActiveDetailTab}
              tabs={PIPELINES_ROOFING_DETAIL_TABS}
              variant="line"
              size="sm"
            />
          </nav>
        )}

        {/* Edit Mode Action Bar */}
        {editMode && (
          <div className="flex-shrink-0 px-6 py-2 border-b border-stroke bg-main-50 dark:bg-main-950/20">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleOpenWidgetCatalog}
                className="px-3 py-1.5 text-xs bg-main-700 hover:bg-main-900 dark:bg-main-500 dark:hover:bg-main-700 text-white rounded-md transition-colors duration-200 font-medium flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Widget
              </button>
              <button
                onClick={handleResetLayout}
                className="px-3 py-1.5 text-xs bg-surface-base border border-stroke text-content-secondary hover:bg-surface-raised hover:text-content-primary hover:border-stroke-strong rounded-md transition-colors duration-200 font-medium"
              >
                Reset Layout
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-6 py-4 light-gray-bg">
          {/* Overview Tab - Grid Workspace */}
          {activeMainSection === 'analytics' && activeSubsection === '8020rei-ga4' && activeDetailTab === 'overview' && (
            <>
              {/* Edit Mode Info */}
              {editMode && showEditCallout && (
                <div className="mb-4 relative">
                  <AxisCallout type="info" title="Edit Mode Active">
                    <p className="text-body-regular">
                      Drag widgets by their handle icon to reposition them. Resize widgets by dragging their edges.
                      Your layout will be saved automatically.
                    </p>
                  </AxisCallout>
                  <button
                    onClick={() => setShowEditCallout(false)}
                    className="absolute top-2 right-2 p-1 text-content-tertiary hover:text-content-primary transition-colors duration-200"
                    aria-label="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
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
          {activeMainSection === 'analytics' && activeSubsection === '8020rei-ga4' && activeDetailTab === 'users' && (
            <UsersTab
              ref={tabRefs.refs['users']}
              days={days}
              userType={userType}
              startDate={startDate}
              endDate={endDate}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Features Tab */}
          {activeMainSection === 'analytics' && activeSubsection === '8020rei-ga4' && activeDetailTab === 'features' && (
            <FeaturesTab
              ref={tabRefs.refs['features']}
              days={days}
              userType={userType}
              startDate={startDate}
              endDate={endDate}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Clients Tab */}
          {activeMainSection === 'analytics' && activeSubsection === '8020rei-ga4' && activeDetailTab === 'clients' && (
            <ClientsTab
              ref={tabRefs.refs['clients']}
              days={days}
              userType={userType}
              startDate={startDate}
              endDate={endDate}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Traffic Tab */}
          {activeMainSection === 'analytics' && activeSubsection === '8020rei-ga4' && activeDetailTab === 'traffic' && (
            <TrafficTab
              ref={tabRefs.refs['traffic']}
              days={days}
              userType={userType}
              startDate={startDate}
              endDate={endDate}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Technology Tab */}
          {activeMainSection === 'analytics' && activeSubsection === '8020rei-ga4' && activeDetailTab === 'technology' && (
            <TechnologyTab
              ref={tabRefs.refs['technology']}
              days={days}
              userType={userType}
              startDate={startDate}
              endDate={endDate}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Geography Tab */}
          {activeMainSection === 'analytics' && activeSubsection === '8020rei-ga4' && activeDetailTab === 'geography' && (
            <GeographyTab
              ref={tabRefs.refs['geography']}
              days={days}
              userType={userType}
              startDate={startDate}
              endDate={endDate}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Events Tab */}
          {activeMainSection === 'analytics' && activeSubsection === '8020rei-ga4' && activeDetailTab === 'events' && (
            <EventsTab
              ref={tabRefs.refs['events']}
              days={days}
              userType={userType}
              startDate={startDate}
              endDate={endDate}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Insights Tab */}
          {activeMainSection === 'analytics' && activeSubsection === '8020rei-ga4' && activeDetailTab === 'insights' && (
            <InsightsTab
              ref={tabRefs.refs['insights']}
              days={days}
              userType={userType}
              startDate={startDate}
              endDate={endDate}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Engagement Calls Tab */}
          {activeMainSection === 'engagement-calls' && (
            <EngagementCallsTab />
          )}

          {/* Grafana Tab */}
          {activeMainSection === 'grafana' && (
            <GrafanaTab />
          )}

          {/* Feedback Loop > Import Tab */}
          {activeMainSection === 'feedback-loop' && activeSubsection === 'import' && (
            <ClientDomainsTab
              ref={tabRefs.refs['import']}
              days={days}
              startDate={startDate}
              endDate={endDate}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}


          {/* Properties API Tab (Features > 8020REI > Properties API) */}
          {activeMainSection === 'features' && activeSubsection === 'features-rei' && activeDetailTab === 'properties-api' && (
            <PropertiesApiTab
              ref={tabRefs.refs['properties-api']}
              days={days}
              startDate={startDate}
              endDate={endDate}
              editMode={editMode}
              onEditModeChange={setEditMode}
            />
          )}

          {/* Under Construction placeholder for sections without real content */}
          {activeMainSection !== 'engagement-calls' && activeMainSection !== 'grafana' &&
           !(activeMainSection === 'analytics' && activeSubsection === '8020rei-ga4') &&
           !(activeMainSection === 'features' && activeSubsection === 'features-rei' && activeDetailTab === 'properties-api') &&
           !(activeMainSection === 'feedback-loop' && activeSubsection === 'import') && (
            <div className="flex items-center justify-center min-h-full">
              <div className="text-center">
                {/* Construction Icon */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-surface-raised border-2 border-dashed border-stroke mb-6">
                  <svg className="w-12 h-12 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                </div>

                {/* Title with Section & Subsection */}
                <h2 className="text-2xl font-semibold text-content-primary mb-2">
                  Under Construction
                </h2>

                {/* Breadcrumb showing current location */}
                <p className="text-body-large text-content-secondary mb-6">
                  {MAIN_SECTION_TABS.find(s => s.id === activeMainSection)?.name}
                  {' / '}
                  {SUBSECTION_TABS_MAP[activeMainSection]?.find(s => s.id === activeSubsection)?.name || activeSubsection}
                </p>

                {/* Info box */}
                <div className="inline-block bg-surface-raised border border-stroke rounded-lg px-6 py-4 max-w-md">
                  <p className="text-sm text-content-secondary">
                    This section is currently under development. Data integration and dashboard widgets for this area will be available soon.
                  </p>
                </div>
              </div>
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

export default function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = use(params);
  return (
    <Suspense>
      <Dashboard slug={slug || []} />
    </Suspense>
  );
}
