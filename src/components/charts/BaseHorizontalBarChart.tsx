/**
 * Base Horizontal Bar Chart Component
 *
 * Reusable horizontal bar chart with consistent styling and centered layout.
 * Used for category comparison data (e.g., feature usage).
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface HorizontalBarDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface BaseHorizontalBarChartProps {
  /** Chart data */
  data: HorizontalBarDataPoint[];
  /** Data key for category labels */
  categoryKey?: string;
  /** Data key for bar values */
  valueKey?: string;
  /** Bar color */
  color?: string;
  /** Custom tooltip formatter - value may be undefined */
  tooltipFormatter?: (value: number | undefined, name: string | undefined) => [string, string];
  /** Y-axis width for label space */
  yAxisWidth?: number;
}

// Consistent tooltip styling
const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export function BaseHorizontalBarChart({
  data,
  categoryKey = 'label',
  valueKey = 'value',
  color = 'rgb(59, 130, 246)',
  tooltipFormatter,
  yAxisWidth = 120,
}: BaseHorizontalBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{
          top: 20,
          right: 40,
          left: 10,
          bottom: 20,
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
          dy={8}
        />
        <YAxis
          dataKey={categoryKey}
          type="category"
          width={yAxisWidth}
          tick={{ fontSize: 11, className: 'fill-content-secondary' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={tooltipFormatter}
          cursor={{ fill: 'var(--surface-base)', opacity: 0.5 }}
        />
        <Bar
          dataKey={valueKey}
          fill={color}
          radius={[0, 4, 4, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
