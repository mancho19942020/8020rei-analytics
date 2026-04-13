/**
 * PCM Margin Trend Widget
 *
 * Line chart showing daily margin over time with revenue and PCM cost context.
 * Data source: dm_volume_summary (daily_cost, daily_pcm_cost, daily_margin) WHERE mail_class = 'all'
 */

'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { MarginTrendPoint } from '@/types/pcm-validation';

interface PcmMarginTrendWidgetProps {
  data: { trend: MarginTrendPoint[]; dataAvailable: boolean } | null;
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '13px',
  color: 'var(--text-primary)',
};

export function PcmMarginTrendWidget({ data }: PcmMarginTrendWidgetProps) {
  const chartData = useMemo(() => {
    if (!data?.trend?.length) return [];
    return [...data.trend].sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  if (!data || !data.dataAvailable || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Margin trend pending — data will populate after sync
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
            width={50}
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={false}
            dx={-5}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(label) => {
              const d = new Date(label + 'T00:00:00');
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }}
            formatter={(value) => {
              const num = Number(value || 0);
              return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />

          {/* Break-even reference line */}
          <ReferenceLine
            y={0}
            stroke="var(--border-default)"
            strokeDasharray="4 4"
            label={{ value: 'Break-even', position: 'right', fontSize: 10, className: 'fill-content-tertiary' }}
          />

          {/* Revenue and PCM cost as subtle areas */}
          <Area
            type="monotone"
            dataKey="dailyRevenue"
            name="Daily revenue"
            fill="var(--color-main-100)"
            stroke="var(--color-main-300)"
            strokeWidth={1}
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="dailyPcmCost"
            name="Daily PCM cost"
            fill="var(--color-accent-1-100)"
            stroke="var(--color-accent-1-300)"
            strokeWidth={1}
            fillOpacity={0.3}
          />

          {/* Margin as the prominent line */}
          <Line
            type="monotone"
            dataKey="dailyMargin"
            name="Daily margin"
            stroke="var(--color-success-500)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
