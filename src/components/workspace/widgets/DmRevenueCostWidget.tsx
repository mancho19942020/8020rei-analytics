/**
 * DM Revenue vs. Cost Widget
 *
 * Simplified grouped bar chart: cost (coral) and revenue (green) on the same Y-axis.
 * Replaces the dual-axis ROAS trend chart for clarity.
 * A newcomer sees: green > red = making money, red > green = losing money.
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

interface RevenueCostPoint {
  date: string;
  totalCost: number;
  totalRevenue: number;
}

interface DmRevenueCostWidgetProps {
  data: RevenueCostPoint[];
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export function DmRevenueCostWidget({ data }: DmRevenueCostWidgetProps) {
  const chartData = useMemo(() =>
    [...data].sort((a, b) => a.date.localeCompare(b.date)),
  [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-2">
        <span className="text-label font-medium" style={{ color: 'var(--text-secondary)' }}>No revenue data yet</span>
        <span className="text-label" style={{ color: 'var(--text-tertiary)' }}>Data accumulates daily as deals close</span>
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
            width={55}
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={false}
            dx={-5}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: 'var(--surface-overlay)', opacity: 0.3 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, name: any) => {
              const v = Number(value ?? 0);
              return [`$${v.toLocaleString()}`, name];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }) as any}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar
            dataKey="totalCost"
            name="Cost"
            fill="var(--color-error-300)"
            opacity={0.7}
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="totalRevenue"
            name="Revenue"
            fill="var(--color-success-300)"
            opacity={0.8}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
