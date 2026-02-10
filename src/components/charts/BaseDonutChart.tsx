/**
 * Base Donut Chart Component
 *
 * Reusable donut/pie chart with consistent styling.
 * Used for categorical distribution visualization.
 */

'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export interface DonutChartDataPoint {
  /** Display name for the segment */
  label: string;
  /** Numeric value for the segment */
  value: number;
  /** Optional color override for this segment */
  color?: string;
}

export interface BaseDonutChartProps {
  /** Chart data */
  data: DonutChartDataPoint[];
  /** Color palette for segments - cycles if more data than colors */
  colors?: string[];
  /** Inner radius as percentage (e.g., "50%") - 0 for pie chart */
  innerRadius?: string | number;
  /** Outer radius as percentage (e.g., "80%") */
  outerRadius?: string | number;
  /** Padding angle between segments in degrees */
  paddingAngle?: number;
  /** Show legend */
  showLegend?: boolean;
  /** Legend position */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Show percentage labels inside segments */
  showLabels?: boolean;
  /** Minimum percentage to show label (0-1 scale, e.g., 0.05 = 5%) */
  labelThreshold?: number;
  /** Custom tooltip formatter - receives value and name */
  tooltipFormatter?: (value: number, name: string, percentage: string) => [string, string];
  /** Custom legend formatter */
  legendFormatter?: (value: string, percentage: string) => React.ReactNode;
}

// Default color palette - matches design system categorical colors
const DEFAULT_COLORS = [
  'rgb(59, 130, 246)',   // blue
  'rgb(34, 197, 94)',    // green
  'rgb(249, 115, 22)',   // orange
  'rgb(168, 85, 247)',   // purple
  'rgb(239, 68, 68)',    // red
  'rgb(20, 184, 166)',   // teal
  'rgb(245, 158, 11)',   // amber
  'rgb(99, 102, 241)',   // indigo
  'rgb(236, 72, 153)',   // pink
  'rgb(132, 204, 22)',   // lime
];

// Consistent tooltip styling matching other base charts
const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export function BaseDonutChart({
  data,
  colors = DEFAULT_COLORS,
  innerRadius = '50%',
  outerRadius = '80%',
  paddingAngle = 2,
  showLegend = true,
  legendPosition = 'bottom',
  showLabels = true,
  labelThreshold = 0.05,
  tooltipFormatter,
  legendFormatter,
}: BaseDonutChartProps) {
  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Transform data with colors and percentages
  const chartData = data.map((item, index) => ({
    name: item.label,
    value: item.value,
    color: item.color || colors[index % colors.length],
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0',
  }));

  // Custom label renderer for inside-segment percentage labels
  const renderCustomLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
    name?: string;
  }) => {
    const {
      cx = 0,
      cy = 0,
      midAngle = 0,
      innerRadius: ir = 0,
      outerRadius: or = 0,
      percent = 0
    } = props;

    // Only show label if above threshold
    if (percent < labelThreshold) return null;

    const RADIAN = Math.PI / 180;
    const radius = ir + (or - ir) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Default tooltip formatter
  const defaultTooltipFormatter = (value: number, name: string): [string, string] => {
    const item = chartData.find(d => d.name === name);
    const percentage = item?.percentage || '0';
    return [`${value.toLocaleString()} (${percentage}%)`, name];
  };

  // Default legend formatter
  const defaultLegendFormatter = (value: string): React.ReactNode => {
    const item = chartData.find(d => d.name === value);
    const percentage = item?.percentage || '0';
    if (legendFormatter) {
      return legendFormatter(value, percentage);
    }
    return (
      <span className="text-xs text-content-secondary">
        {value} ({percentage}%)
      </span>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={paddingAngle}
          dataKey="value"
          nameKey="name"
          labelLine={false}
          label={showLabels ? renderCustomLabel : false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, name) => {
            const numValue = typeof value === 'number' ? value : 0;
            const strName = typeof name === 'string' ? name : '';
            const item = chartData.find(d => d.name === strName);
            const percentage = item?.percentage || '0';

            if (tooltipFormatter) {
              return tooltipFormatter(numValue, strName, percentage);
            }
            return defaultTooltipFormatter(numValue, strName);
          }}
        />
        {showLegend && (
          <Legend
            verticalAlign={legendPosition === 'top' || legendPosition === 'bottom' ? legendPosition : 'middle'}
            align={legendPosition === 'left' || legendPosition === 'right' ? legendPosition : 'center'}
            height={legendPosition === 'bottom' || legendPosition === 'top' ? 36 : undefined}
            formatter={defaultLegendFormatter}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
