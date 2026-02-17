/**
 * Revenue By Domain Widget
 *
 * Displays a horizontal bar chart of revenue broken down by domain.
 * Uses Recharts BarChart with layout="vertical" for horizontal bars.
 * Revenue values are formatted as dollar amounts in tooltips.
 *
 * Follows the same chart styling conventions as other widget charts,
 * including tooltip styling, grid config, and axis tick formatting.
 */

'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RevenueByDomainEntry } from '@/types/product';

interface RevenueByDomainWidgetProps {
  data: RevenueByDomainEntry[];
}

/** Consistent tooltip styling using CSS custom properties. */
const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

/** Format a number as a dollar currency string. */
function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return '$' + (value / 1_000_000).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 1_000) {
    return '$' + (value / 1_000).toFixed(1) + 'K';
  }
  return '$' + value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function RevenueByDomainWidget({ data }: RevenueByDomainWidgetProps) {
  /** Sort data by revenue descending for display. */
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [...data]
      .sort((a, b) => b.revenue - a.revenue)
      .map((entry) => ({
        domain_name: entry.domain_name,
        revenue: entry.revenue,
      }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-secondary">
        No revenue data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 10,
            right: 30,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-stroke-subtle"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={{ className: 'stroke-stroke' }}
            tickFormatter={(value: number) => formatCurrency(value)}
          />
          <YAxis
            type="category"
            dataKey="domain_name"
            width={120}
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | undefined) => [
              formatCurrency(value ?? 0),
              'Revenue',
            ]}
            cursor={{ fill: 'var(--surface-base)', opacity: 0.5 }}
          />
          <Bar
            dataKey="revenue"
            fill="rgb(59, 130, 246)"
            radius={[0, 4, 4, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
