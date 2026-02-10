/**
 * Feature Trend Widget
 *
 * Multi-line chart showing feature usage trends over time.
 * Each feature gets its own line with distinct color.
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface FeatureTrendData {
  event_date: string;
  feature: string;
  views: number;
}

interface FeatureTrendWidgetProps {
  data: FeatureTrendData[];
}

// Feature colors - consistent with distribution widget
const FEATURE_COLORS: Record<string, string> = {
  'Home': '#3b82f6',      // blue
  'Buybox': '#22c55e',    // green
  'Properties': '#f59e0b', // amber
  'Importer': '#8b5cf6',   // violet
  'Integrations': '#ec4899', // pink
};

// Consistent tooltip styling
const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export function FeatureTrendWidget({ data }: FeatureTrendWidgetProps) {
  // Transform data: group by date with each feature as a column
  const { chartData, features } = useMemo(() => {
    // Get unique features
    const uniqueFeatures = [...new Set(data.map((item) => item.feature))];

    // Group by date
    const dateMap = new Map<string, Record<string, string | number>>();

    data.forEach((item) => {
      const formattedDate = `${item.event_date.slice(4, 6)}/${item.event_date.slice(6, 8)}`;
      if (!dateMap.has(formattedDate)) {
        dateMap.set(formattedDate, { label: formattedDate });
      }
      const dateData = dateMap.get(formattedDate)!;
      dateData[item.feature] = item.views;
    });

    // Convert to array and sort by date
    const sortedData = Array.from(dateMap.values()).sort((a, b) => {
      const dateA = a.label as string;
      const dateB = b.label as string;
      return dateA.localeCompare(dateB);
    });

    return { chartData: sortedData, features: uniqueFeatures };
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 10,
          bottom: 40,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-stroke-subtle"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, className: 'fill-content-secondary' }}
          tickLine={false}
          axisLine={{ className: 'stroke-stroke' }}
          dy={8}
        />
        <YAxis
          width={45}
          tick={{ fontSize: 11, className: 'fill-content-secondary' }}
          tickLine={false}
          axisLine={false}
          dx={-5}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, name) => {
            const numValue = typeof value === 'number' ? value : 0;
            const strName = typeof name === 'string' ? name : '';
            return [numValue.toLocaleString(), strName];
          }}
          cursor={{ stroke: 'var(--border-default)', strokeDasharray: '3 3' }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-xs text-content-secondary">{value}</span>
          )}
        />
        {features.map((feature) => (
          <Line
            key={feature}
            type="monotone"
            dataKey={feature}
            name={feature}
            stroke={FEATURE_COLORS[feature] || '#64748b'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: FEATURE_COLORS[feature] || '#64748b' }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
