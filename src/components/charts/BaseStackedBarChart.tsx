/**
 * Base Stacked Bar Chart Component
 *
 * Reusable stacked vertical bar chart with consistent styling and centered layout.
 * Used for comparing multiple series over categories (e.g., new vs returning users).
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface StackedBarSeries {
  /** Data key in the data objects */
  dataKey: string;
  /** Display name for legend/tooltip */
  name: string;
  /** Bar color */
  color: string;
}

export interface StackedBarDataPoint {
  label: string;
  [key: string]: string | number;
}

export interface BaseStackedBarChartProps {
  /** Chart data */
  data: StackedBarDataPoint[];
  /** Data key for X-axis labels */
  xAxisKey?: string;
  /** Series configuration for stacked bars */
  series: StackedBarSeries[];
  /** Show legend */
  showLegend?: boolean;
  /** Stack ID for grouping bars */
  stackId?: string;
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

export function BaseStackedBarChart({
  data,
  xAxisKey = 'label',
  series,
  showLegend = true,
  stackId = 'stack',
  yAxisWidth = 45,
}: BaseStackedBarChartProps) {
  // Calculate bottom margin based on legend
  const bottomMargin = showLegend ? 40 : 20;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 10,
          bottom: bottomMargin,
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
          formatter={(value: number | undefined, name: string | undefined) => {
            const seriesItem = series.find((s) => s.dataKey === name);
            return [(value ?? 0).toLocaleString(), seriesItem?.name ?? name ?? ''];
          }}
          cursor={{ fill: 'var(--surface-base)', opacity: 0.5 }}
        />
        {showLegend && (
          <Legend
            formatter={(value: string) => {
              const seriesItem = series.find((s) => s.dataKey === value);
              return seriesItem?.name ?? value;
            }}
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          />
        )}
        {series.map((s, index) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.dataKey}
            stackId={stackId}
            fill={s.color}
            radius={index === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
