/**
 * Auto Export Volume Trend Widget
 *
 * Daily bar chart of total_properties_exported across all non-test domains
 * over the last 60 days. Uses Recharts BarChart directly because the shared
 * charts/ primitives are line/donut/stacked/horizontal-bar only.
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
import type { AutoExportVolumePoint } from '@/types/auto-export';

interface AutoExportVolumeTrendWidgetProps {
  data: AutoExportVolumePoint[];
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

export function AutoExportVolumeTrendWidget({ data }: AutoExportVolumeTrendWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No export volume recorded for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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
          width={55}
          tick={{ fontSize: 11, className: 'fill-content-secondary' }}
          tickLine={false}
          axisLine={false}
          dx={-5}
          tickFormatter={(v) => Number(v).toLocaleString()}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(label) => formatDate(String(label))}
          formatter={(v: number | undefined) => [Number(v ?? 0).toLocaleString(), 'Properties']}
          cursor={{ fill: 'var(--surface-base)', opacity: 0.5 }}
        />
        <Bar dataKey="propertiesExported" fill="var(--color-main-500)" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
