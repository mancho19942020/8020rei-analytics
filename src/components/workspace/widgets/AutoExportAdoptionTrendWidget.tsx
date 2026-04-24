/**
 * Auto Export Adoption Trend Widget
 *
 * Line chart: active clients per day over the last 90 days, with a horizontal
 * goal reference line at AUTO_EXPORT_ACTIVE_CLIENTS_GOAL (50).
 *
 * Uses Recharts primitives directly so we can overlay the ReferenceLine —
 * BaseLineChart doesn't expose a goal-line slot.
 */

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { AutoExportAdoption } from '@/types/auto-export';

interface AutoExportAdoptionTrendWidgetProps {
  data: AutoExportAdoption;
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

export function AutoExportAdoptionTrendWidget({ data }: AutoExportAdoptionTrendWidgetProps) {
  if (!data?.series || data.series.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm text-center px-4">
        No adoption snapshots yet — populated daily after the Aurora sync runs.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.series} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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
          allowDecimals={false}
        />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => formatDate(String(label))} />
        <ReferenceLine
          y={data.goal}
          stroke="var(--color-success-500)"
          strokeDasharray="4 4"
          label={{
            value: `Goal: ${data.goal}`,
            position: 'insideTopRight',
            fill: 'var(--text-secondary)',
            fontSize: 11,
          }}
        />
        <Line
          type="monotone"
          dataKey="activeClients"
          name="Active clients"
          stroke="var(--color-main-500)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
