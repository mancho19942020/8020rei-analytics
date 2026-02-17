/**
 * Domain Activity Trend Widget
 *
 * Displays domain activity over time using a Recharts LineChart.
 * Supports two metric views toggled via buttons:
 * - properties_uploaded: number of properties uploaded per day
 * - domain_count: number of active domains per day
 *
 * Follows the same chart styling conventions as ClientActivityTrendWidget,
 * including tooltip styling, grid config, axis tick formatting, and
 * toggle button design.
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
import type { DomainActivityTrendEntry } from '@/types/product';

interface DomainActivityTrendWidgetProps {
  data: DomainActivityTrendEntry[];
}

/** Consistent tooltip styling using CSS custom properties. */
const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

/** Line colors for each metric. */
const LINE_COLORS = {
  properties_uploaded: 'rgb(59, 130, 246)',
  domain_count: 'rgb(168, 85, 247)',
};

export function DomainActivityTrendWidget({ data }: DomainActivityTrendWidgetProps) {
  const [metric, setMetric] = useState<'properties_uploaded' | 'domain_count'>('properties_uploaded');

  /** Format date string (YYYYMMDD or ISO) to MM/DD for display. */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return dateStr;

    // Handle YYYYMMDD format
    if (dateStr.length === 8 && !dateStr.includes('-')) {
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      return `${month}/${day}`;
    }

    // Handle ISO / standard date formats
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}`;
      }
    } catch {
      // Fall through
    }

    return dateStr;
  };

  /** Process data for chart consumption. */
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((entry) => ({
      date: formatDate(entry.date),
      properties_uploaded: entry.properties_uploaded,
      domain_count: entry.domain_count,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-secondary">
        No activity trend data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm text-content-secondary">
          Domain Activity Over Time
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMetric('properties_uploaded')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              metric === 'properties_uploaded'
                ? 'bg-main-600 text-white'
                : 'bg-surface-raised border border-stroke text-content-secondary hover:bg-surface-base'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setMetric('domain_count')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              metric === 'domain_count'
                ? 'bg-main-600 text-white'
                : 'bg-surface-raised border border-stroke text-content-secondary hover:bg-surface-base'
            }`}
          >
            Domains
          </button>
        </div>
      </div>

      {/* Line Chart */}
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
              formatter={(value: number | undefined) => [
                (value ?? 0).toLocaleString(),
                metric === 'properties_uploaded' ? 'Properties Uploaded' : 'Domain Count',
              ]}
              cursor={{ stroke: 'var(--border-default)', strokeDasharray: '3 3' }}
            />
            <Legend
              formatter={() => (
                <span className="text-xs text-content-secondary">
                  {metric === 'properties_uploaded' ? 'Properties Uploaded' : 'Domain Count'}
                </span>
              )}
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={LINE_COLORS[metric]}
              strokeWidth={2}
              dot={{ fill: LINE_COLORS[metric], strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: LINE_COLORS[metric] }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
