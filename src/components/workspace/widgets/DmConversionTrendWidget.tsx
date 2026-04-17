/**
 * DM Conversion Activity Widget
 *
 * Bar chart showing daily new leads, appointments, and deals.
 * Computes day-over-day deltas from cumulative snapshot data.
 * Spikes indicate effective mail drops; flat periods show stagnation.
 */

'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
  const chartData = useMemo(() => {
    // The API now returns true daily activity counts (each conversion bucketed by
    // the day it happened — became_lead_at / became_appointment_at / became_deal_at),
    // not cumulative snapshots. No client-side diffing needed.
    return [...data].sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-2">
        <span className="text-label font-medium" style={{ color: 'var(--text-secondary)' }}>No conversions in this cohort yet</span>
        <span className="text-label" style={{ color: 'var(--text-tertiary)' }}>Properties first mailed in the selected window haven&apos;t produced leads, appointments, or deals yet. Try a wider date range.</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
            width={35}
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={false}
            dx={-5}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: 'var(--surface-overlay)', opacity: 0.3 }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar
            dataKey="leads"
            name="New leads"
            fill="var(--color-accent-1-500)"
            opacity={0.8}
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="appointments"
            name="New appointments"
            fill="var(--color-accent-2-500)"
            opacity={0.8}
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="deals"
            name="New deals"
            fill="var(--color-success-500)"
            opacity={0.8}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
