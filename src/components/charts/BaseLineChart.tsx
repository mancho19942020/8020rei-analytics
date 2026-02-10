/**
 * Base Line Chart Component
 *
 * Reusable line chart with consistent styling and centered layout.
 * Used for time series data visualization.
 */

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

export interface LineChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface BaseLineChartProps {
  /** Chart data */
  data: LineChartDataPoint[];
  /** Data key for X-axis labels */
  xAxisKey?: string;
  /** Data key for line values */
  valueKey?: string;
  /** Line color */
  color?: string;
  /** Show dots on line */
  showDots?: boolean;
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

export function BaseLineChart({
  data,
  xAxisKey = 'label',
  valueKey = 'value',
  color = 'rgb(59, 130, 246)',
  showDots = true,
  tooltipFormatter,
  yAxisWidth = 45,
}: BaseLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 10,
          bottom: 20,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-stroke-subtle"
          vertical={false}
        />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 11, className: 'fill-content-secondary' }}
          tickLine={false}
          axisLine={{ className: 'stroke-stroke' }}
          dy={8}
        />
        <YAxis
          width={yAxisWidth}
          tick={{ fontSize: 11, className: 'fill-content-secondary' }}
          tickLine={false}
          axisLine={false}
          dx={-5}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={tooltipFormatter}
          cursor={{ stroke: 'var(--border-default)', strokeDasharray: '3 3' }}
        />
        <Line
          type="monotone"
          dataKey={valueKey}
          stroke={color}
          strokeWidth={2}
          dot={showDots ? { fill: color, strokeWidth: 2, r: 3 } : false}
          activeDot={{ r: 5, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
