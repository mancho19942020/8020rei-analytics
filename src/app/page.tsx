'use client';

import { useState, useEffect } from 'react';
import { Scorecard } from '@/components/Scorecard';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { FeatureBarChart } from '@/components/FeatureBarChart';
import { ClientsTable } from '@/components/ClientsTable';

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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [days]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/metrics?days=${days}`);
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Error fetching data');
      }
    } catch (err) {
      setError('Failed to connect to API');
    }
    
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main-700 mx-auto mb-4"></div>
          <div className="text-lg text-content-tertiary">Cargando datos de BigQuery...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-lg text-error-700 mb-2">Error: {error}</div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-main-700 text-white rounded-sm hover:bg-main-900 active:bg-main-950 transition-colors duration-200 font-medium focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-h1 text-content-primary font-semibold">8020REI Analytics</h1>
            <p className="text-body-regular text-content-secondary mt-1">Dashboard de métricas de uso</p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-stroke rounded-lg px-3 py-2 bg-surface-base text-content-primary focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-main-500 transition-colors duration-200"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
        </div>

        {/* Scorecards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Scorecard label="Total Users" value={data.metrics.total_users} icon="👥" color="bg-success-500" />
          <Scorecard label="Total Events" value={data.metrics.total_events} icon="📊" color="bg-main-500" />
          <Scorecard label="Page Views" value={data.metrics.page_views} icon="👁️" color="bg-accent-2-500" />
          <Scorecard label="Active Clients" value={data.metrics.active_clients} icon="🏢" color="bg-accent-3-500" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <TimeSeriesChart data={data.usersByDay} />
          <FeatureBarChart data={data.featureUsage} />
        </div>

        {/* Clients Table */}
        <ClientsTable data={data.topClients} />
      </div>
    </div>
  );
}
