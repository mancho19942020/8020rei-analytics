/**
 * Bug Tracking Widget
 *
 * Displays bug tracking KPIs and weekly trend data.
 * Top section shows 4 KPI boxes: total unique bugs, customer bugs,
 * critical bugs, and critical open bugs. Bottom section shows a
 * Recharts line chart for the weekly bug trend.
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
} from 'recharts';
import type { BugTrackingData } from '@/types/product';

interface BugTrackingWidgetProps {
  data: BugTrackingData;
}

// Consistent tooltip styling matching codebase conventions
const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

/** Single KPI box sub-component */
function KpiBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-surface-raised border border-stroke rounded-xl p-3 flex flex-col gap-1">
      <span className="text-xs text-content-secondary">{label}</span>
      <span
        className={`text-xl font-bold tabular-nums ${
          highlight && value > 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-content-primary'
        }`}
      >
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export function BugTrackingWidget({ data }: BugTrackingWidgetProps) {
  // Format weekly trend data for chart
  const chartData = useMemo(() => {
    if (!data.weekly_trend || data.weekly_trend.length === 0) return [];
    return data.weekly_trend.map((entry) => ({
      week: entry.week,
      count: entry.count,
    }));
  }, [data.weekly_trend]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top section: 4 KPI boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
        <KpiBox label="Total Unique Bugs" value={data.total_unique_bugs} />
        <KpiBox label="Customer Bugs" value={data.customer_bugs} />
        <KpiBox label="Critical Bugs" value={data.critical_bugs} />
        <KpiBox
          label="Critical Open"
          value={data.critical_open_bugs}
          highlight
        />
      </div>

      {/* Bottom section: Weekly trend line chart */}
      <div className="flex-1 min-h-0">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
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
                dataKey="week"
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
                formatter={(value: number | undefined) => [
                  (value ?? 0).toLocaleString(),
                  'Bugs',
                ]}
                cursor={{
                  stroke: 'var(--border-default)',
                  strokeDasharray: '3 3',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="rgb(239, 68, 68)"
                strokeWidth={2}
                dot={{
                  fill: 'rgb(239, 68, 68)',
                  strokeWidth: 2,
                  r: 3,
                }}
                activeDot={{
                  r: 5,
                  fill: 'rgb(239, 68, 68)',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-content-secondary">
            No weekly trend data available
          </div>
        )}
      </div>
    </div>
  );
}
