'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Scorecard } from '@/components/dashboard/Scorecard';
import { TimeSeriesChart } from '@/components/dashboard/TimeSeriesChart';
import { FeatureBarChart } from '@/components/dashboard/FeatureBarChart';
import { ClientsTable } from '@/components/dashboard/ClientsTable';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AxisSelect, AxisSelectOption, AxisSkeleton, AxisCallout, AxisButton, AxisNavigationTab, AxisNavigationTabItem } from '@/components/axis';

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
    disabled: true,
  },
  {
    id: 'features',
    name: 'Features',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    disabled: true,
  },
  {
    id: 'clients',
    name: 'Clients',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    disabled: true,
  },
  {
    id: 'traffic',
    name: 'Traffic',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    disabled: true,
  },
  {
    id: 'technology',
    name: 'Technology',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    disabled: true,
  },
  {
    id: 'geography',
    name: 'Geography',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    disabled: true,
  },
  {
    id: 'events',
    name: 'Events',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    disabled: true,
  },
];

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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
  }, [days, user]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/metrics?days=${days}`);
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
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="px-6 pt-6 pb-4 border-b border-stroke">
            <AxisSkeleton variant="text" lines={2} />
          </div>

          {/* Navigation Skeleton */}
          <div className="px-6 py-3 border-b border-stroke">
            <div className="flex gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <AxisSkeleton key={i} variant="button" size="md" />
              ))}
            </div>
          </div>

          {/* Toolbar Skeleton */}
          <div className="px-6 py-4 border-b border-stroke bg-surface-raised">
            <div className="flex justify-between items-center">
              <AxisSkeleton variant="text" width="200px" />
              <AxisSkeleton variant="button" />
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 py-6">
            {/* Scorecards Skeleton */}
            <div className="mb-6 pb-6 border-b border-stroke">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <AxisSkeleton key={i} variant="card" fullWidth />
                ))}
              </div>
            </div>

            {/* Charts Skeleton */}
            <div className="mb-6 pb-6 border-b border-stroke">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AxisSkeleton variant="custom" width="100%" height="350px" />
                <AxisSkeleton variant="custom" width="100%" height="350px" />
              </div>
            </div>

            {/* Table Skeleton */}
            <div className="border border-stroke rounded-lg overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <AxisSkeleton key={i} variant="table-row" columns={4} fullWidth />
              ))}
            </div>
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="px-6 pt-6 pb-4 border-b border-stroke">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-h1 text-content-primary font-semibold mb-2">8020REI Analytics</h1>
              <p className="text-body-regular text-content-secondary">Usage Metrics Dashboard</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 px-4 py-2 bg-surface-raised rounded-lg border border-stroke">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="text-sm">
                    <p className="font-medium text-content-primary text-body-regular">{user.displayName || 'User'}</p>
                    <p className="text-label text-content-tertiary">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Sign Out Button */}
              <button
                onClick={signOut}
                className="px-4 py-2 bg-surface-raised border border-stroke text-content-secondary hover:bg-surface-base hover:text-content-primary hover:border-stroke-strong rounded-lg transition-colors duration-200 text-body-regular font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="px-6 border-b border-stroke">
          <AxisNavigationTab
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={NAVIGATION_TABS}
            variant="line"
            size="md"
          />
        </nav>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-stroke bg-surface-raised">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-label text-content-tertiary">
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
            </div>

            {/* Time Filter */}
            <AxisSelect
              value={days}
              onChange={(val) => setDays(Number(val))}
              options={TIME_RANGE_OPTIONS}
              size="md"
              fullWidth={false}
              className="w-40"
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="px-6 py-6">
          {/* Scorecards */}
          <section className="mb-6 pb-6 border-b border-stroke">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Scorecard label="Total Users" value={data.metrics.total_users} icon="👥" color="success" />
              <Scorecard label="Total Events" value={data.metrics.total_events} icon="📊" color="main" />
              <Scorecard label="Page Views" value={data.metrics.page_views} icon="👁️" color="accent-2" />
              <Scorecard label="Active Clients" value={data.metrics.active_clients} icon="🏢" color="accent-3" />
            </div>
          </section>

          {/* Charts */}
          <section className="mb-6 pb-6 border-b border-stroke">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TimeSeriesChart data={data.usersByDay} />
              <FeatureBarChart data={data.featureUsage} />
            </div>
          </section>

          {/* Clients Table */}
          <section>
            <ClientsTable data={data.topClients} />
          </section>
        </main>
      </div>
    </div>
  );
}
