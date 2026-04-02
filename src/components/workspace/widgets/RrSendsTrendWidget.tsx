/**
 * Rapid Response Sends Trend Widget
 *
 * Multi-line chart showing sends, deliveries, and errors over time.
 * Uses Recharts directly (BaseLineChart only supports single-line)
 * but follows the same styling conventions (tooltip, axis, grid classes).
 */

'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { RrDailyMetric } from '@/types/rapid-response';

interface RrSendsTrendWidgetProps {
  data: RrDailyMetric[];
}

// Consistent tooltip styling from BaseLineChart pattern
const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export function RrSendsTrendWidget({ data }: RrSendsTrendWidgetProps) {
  const chartData = useMemo(() => {
    const byDate = new Map<string, { date: string; sends: number; delivered: number; errors: number }>();
    for (const row of data) {
      const existing = byDate.get(row.date) || { date: row.date, sends: 0, delivered: 0, errors: 0 };
      existing.sends += row.sendsTotal;
      existing.delivered += row.deliveredCount;
      existing.errors += row.sendsError;
      byDate.set(row.date, existing);
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
        No send data available yet
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
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
            tickFormatter={(v) => {
              const d = new Date(v + 'T00:00:00');
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
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
            cursor={{ stroke: 'var(--border-default)', strokeDasharray: '3 3' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Line
            type="monotone"
            dataKey="sends"
            name="Sends"
            stroke="var(--color-main-500)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="delivered"
            name="Delivered"
            stroke="var(--color-success-500)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="errors"
            name="Errors"
            stroke="var(--color-error-500)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
