/**
 * DM Overview — Send volume trend
 *
 * Monthly line chart sourced from PCM /order (full ~14-month history).
 * Shows first class and standard mail classes as separate lines, plus total.
 */

'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { DmOverviewSendTrend } from '@/types/dm-overview';

interface Props {
  data: DmOverviewSendTrend | null;
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`;
};

export function DmOverviewSendTrendWidget({ data }: Props) {
  const chartData = useMemo(() => data?.series ?? [], [data]);

  if (!data || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Loading PCM send history…
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 24, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-subtle" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={{ className: 'stroke-stroke' }}
            dy={8}
            tickFormatter={monthLabel}
          />
          <YAxis
            width={50}
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(label) => monthLabel(String(label))}
            formatter={(v, name) => [Number(v ?? 0).toLocaleString(), String(name)]}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="total"
            name="Total pieces"
            stroke="var(--color-chart-1)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="firstClass"
            name="First class"
            stroke="var(--color-chart-3)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="standard"
            name="Standard"
            stroke="var(--color-chart-6)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
