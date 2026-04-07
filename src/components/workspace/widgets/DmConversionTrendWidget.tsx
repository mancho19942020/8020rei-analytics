/**
 * DM Conversion Trend Widget
 *
 * Multi-line chart showing leads, appointments, contracts, deals over time.
 * Uses Recharts directly following the same pattern as RrSendsTrendWidget.
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

interface ConversionPoint {
  date: string;
  leads: number;
  appointments: number;
  contracts: number;
  deals: number;
}

interface DmConversionTrendWidgetProps {
  data: ConversionPoint[];
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export function DmConversionTrendWidget({ data }: DmConversionTrendWidgetProps) {
  const chartData = useMemo(() =>
    [...data].sort((a, b) => a.date.localeCompare(b.date)),
  [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-2">
        <span className="text-label font-medium" style={{ color: 'var(--text-secondary)' }}>No trend data yet</span>
        <span className="text-label" style={{ color: 'var(--text-tertiary)' }}>Data accumulates daily as the sync cron runs</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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
            dataKey="leads"
            name="Leads"
            stroke="var(--color-accent-1-500)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="appointments"
            name="Appointments"
            stroke="var(--color-accent-2-500)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="deals"
            name="Deals"
            stroke="var(--color-success-500)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
