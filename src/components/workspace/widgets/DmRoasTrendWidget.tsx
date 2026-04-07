/**
 * DM ROAS Trend Widget
 *
 * Dual-axis chart: revenue vs cost (bars) with ROAS line.
 * - Break-even reference line at ROAS = 1.0
 * - Null ROAS days (no deals) shown as gaps, not zeros
 */

'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface RoasPoint {
  date: string;
  totalCost: number;
  totalRevenue: number;
  roas: number | null;
  deals?: number;
}

interface DmRoasTrendWidgetProps {
  data: RoasPoint[];
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export function DmRoasTrendWidget({ data }: DmRoasTrendWidgetProps) {
  const chartData = useMemo(() =>
    [...data]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        // Convert null to undefined so Recharts renders a gap in the line
        roas: d.roas ?? undefined,
      })),
  [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
        No ROAS data available yet
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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
            yAxisId="money"
            width={55}
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={false}
            dx={-5}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
          />
          <YAxis
            yAxisId="roas"
            orientation="right"
            width={40}
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}x`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: 'var(--border-default)', strokeDasharray: '3 3' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, name: any) => {
              if (value === undefined || value === null) return ['No deals', name];
              const v = Number(value ?? 0);
              if (name === 'ROAS') return [`${v.toFixed(2)}x`, name];
              return [`$${v.toLocaleString()}`, name];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }) as any}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          {/* Break-even reference line */}
          <ReferenceLine
            yAxisId="roas"
            y={1}
            stroke="var(--color-alert-500)"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: 'Break-even',
              position: 'right',
              style: { fontSize: '10px', fill: 'var(--text-tertiary)' },
            }}
          />
          <Bar
            yAxisId="money"
            dataKey="totalCost"
            name="Cost"
            fill="var(--color-error-300)"
            opacity={0.5}
            radius={[2, 2, 0, 0]}
          />
          <Bar
            yAxisId="money"
            dataKey="totalRevenue"
            name="Revenue"
            fill="var(--color-success-300)"
            opacity={0.6}
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="roas"
            type="monotone"
            dataKey="roas"
            name="ROAS"
            stroke="var(--color-main-500)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
