/**
 * Auto Export Runtime Trend Widget
 *
 * Two-series line chart: daily avg_runtime_seconds (solid) and
 * p95_runtime_seconds (dashed). Helps spot jobs that start taking longer
 * before they tip over into `failed`.
 */

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { AutoExportRuntimePoint } from '@/types/auto-export';

interface AutoExportRuntimeTrendWidgetProps {
  data: AutoExportRuntimePoint[];
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--text-primary)',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AutoExportRuntimeTrendWidget({ data }: AutoExportRuntimeTrendWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No runtime data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-subtle" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, className: 'fill-content-secondary' }}
          tickLine={false}
          axisLine={{ className: 'stroke-stroke' }}
          tickFormatter={formatDate}
          dy={8}
        />
        <YAxis
          width={45}
          tick={{ fontSize: 11, className: 'fill-content-secondary' }}
          tickLine={false}
          axisLine={false}
          dx={-5}
          tickFormatter={(v) => `${v}s`}
        />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => formatDate(String(label))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="avgRuntimeSeconds"
          name="Avg (s)"
          stroke="var(--color-main-500)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="p95RuntimeSeconds"
          name="P95 (s)"
          stroke="var(--color-accent-3-500)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
