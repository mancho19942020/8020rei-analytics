/**
 * Client Activity Trend Widget
 *
 * Displays client activity over time with a multi-line chart.
 * Shows top 5 clients as individual lines, or a single client when selected.
 */

'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ClientActivityData {
  event_date: string;
  client: string;
  users: number;
  events: number;
}

interface ClientActivityTrendWidgetProps {
  data: ClientActivityData[];
  selectedClient?: string | null;
}

// Color palette for top clients
const CLIENT_COLORS = [
  'rgb(59, 130, 246)',   // blue
  'rgb(99, 102, 241)',   // indigo
  'rgb(168, 85, 247)',   // purple
  'rgb(236, 72, 153)',   // pink
  'rgb(34, 197, 94)',    // green
];

// Consistent tooltip styling
const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export function ClientActivityTrendWidget({ data, selectedClient }: ClientActivityTrendWidgetProps) {
  const [metric, setMetric] = useState<'users' | 'events'>('users');

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${month}/${day}`;
  };

  // Get top 5 clients by total events
  const topClients = useMemo(() => {
    if (!data || data.length === 0) return [];

    const clientTotals: Record<string, number> = {};
    data.forEach(d => {
      if (!clientTotals[d.client]) {
        clientTotals[d.client] = 0;
      }
      clientTotals[d.client] += d.events;
    });

    return Object.entries(clientTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([client]) => client);
  }, [data]);

  // Process data for multi-line chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Get all unique dates
    const allDates = [...new Set(data.map(d => d.event_date))].sort();

    // Determine which clients to show
    const clientsToShow = selectedClient ? [selectedClient] : topClients;

    // Build chart data with each client as a separate key
    return allDates.map(date => {
      const row: Record<string, string | number> = { date: formatDate(date) };

      clientsToShow.forEach(client => {
        const clientData = data.find(d => d.event_date === date && d.client === client);
        row[client] = clientData ? (metric === 'users' ? clientData.users : clientData.events) : 0;
      });

      return row;
    });
  }, [data, selectedClient, topClients, metric]);

  // Get clients to display in the chart
  const clientsToDisplay = useMemo(() => {
    return selectedClient ? [selectedClient] : topClients;
  }, [selectedClient, topClients]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-secondary">
        No activity data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          {selectedClient ? (
            <span className="text-sm font-medium text-content-primary">
              {selectedClient}
            </span>
          ) : (
            <span className="text-sm text-content-secondary">
              Top 5 Clients
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMetric('users')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              metric === 'users'
                ? 'bg-main-600 text-white'
                : 'bg-surface-raised border border-stroke text-content-secondary hover:bg-surface-base'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setMetric('events')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              metric === 'events'
                ? 'bg-main-600 text-white'
                : 'bg-surface-raised border border-stroke text-content-secondary hover:bg-surface-base'
            }`}
          >
            Events
          </button>
        </div>
      </div>

      {/* Multi-line Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 10,
              bottom: 20,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-stroke-subtle"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, className: 'fill-content-secondary' }}
              tickLine={false}
              axisLine={{ className: 'stroke-stroke' }}
              dy={8}
            />
            <YAxis
              width={45}
              tick={{ fontSize: 11, className: 'fill-content-secondary' }}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number | undefined, name: string | undefined) => [
                (value ?? 0).toLocaleString(),
                name || ''
              ]}
              cursor={{ stroke: 'var(--border-default)', strokeDasharray: '3 3' }}
            />
            <Legend
              formatter={(value: string) => (
                <span className="text-xs text-content-secondary">{value}</span>
              )}
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            {clientsToDisplay.map((client, index) => (
              <Line
                key={client}
                type="monotone"
                dataKey={client}
                stroke={CLIENT_COLORS[index % CLIENT_COLORS.length]}
                strokeWidth={2}
                dot={{ fill: CLIENT_COLORS[index % CLIENT_COLORS.length], strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: CLIENT_COLORS[index % CLIENT_COLORS.length] }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
