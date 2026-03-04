/**
 * API Calls Trend Widget
 *
 * Line chart showing API call volume over time with an errors overlay.
 * Uses the project's BaseLineChart pattern with multi-line Recharts directly
 * (same approach as ClientActivityTrendWidget for multi-series).
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TimeSeriesPoint {
  date: string;
  calls: number;
  uniqueClients: number;
  avgResponseMs: number;
  errors: number;
  successes: number;
}

interface ApiCallsTrendWidgetProps {
  data: TimeSeriesPoint[];
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--text-primary)',
};

function formatDate(dateStr: string): string {
  if (dateStr.includes(' ')) {
    const [date, time] = dateStr.split(' ');
    const d = new Date(date);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`;
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ApiCallsTrendWidget({ data }: ApiCallsTrendWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No usage data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-subtle" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, className: 'fill-content-secondary' }}
          tickLine={false}
          axisLine={{ className: 'stroke-stroke' }}
          tickFormatter={formatDate}
          dy={8}
        />
        <YAxis
          width={45}
          tick={{ fontSize: 11, className: 'fill-content-secondary' }}
          tickLine={false}
          axisLine={false}
          dx={-5}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="calls"
          name="Calls"
          stroke="var(--color-main-500)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="errors"
          name="Errors"
          stroke="var(--color-error-500)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
