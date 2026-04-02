/**
 * Rapid Response Cost Overview Widget
 *
 * Dual-axis chart showing daily spend (bars) and cost per piece (line).
 * Uses Recharts directly (no BaseComposedChart exists yet) but follows
 * design system styling conventions.
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
} from 'recharts';
import type { RrCostPoint } from '@/types/rapid-response';

interface RrCostOverviewWidgetProps {
  data: RrCostPoint[];
}

// Consistent tooltip styling from BaseLineChart pattern
const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export function RrCostOverviewWidget({ data }: RrCostOverviewWidgetProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      costPerPiece: d.sendsTotal > 0 ? Number((d.costTotal / d.sendsTotal).toFixed(2)) : 0,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
        No cost data available yet
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
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
            yAxisId="cost"
            width={45}
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={false}
            dx={-5}
            tickFormatter={(v) => `$${v}`}
          />
          <YAxis
            yAxisId="perPiece"
            orientation="right"
            width={45}
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: 'var(--border-default)', strokeDasharray: '3 3' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar
            yAxisId="cost"
            dataKey="costTotal"
            name="Daily Spend"
            fill="var(--color-main-500)"
            opacity={0.6}
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="perPiece"
            type="monotone"
            dataKey="costPerPiece"
            name="Cost/Piece"
            stroke="var(--color-accent-3-500)"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
