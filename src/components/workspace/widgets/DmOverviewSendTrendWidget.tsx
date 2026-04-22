/**
 * DM Overview — Send volume trend (MTD same-day-cutoff, 2026-04-22 rework)
 *
 * Stacked bar chart: one bar per month, capped at today's day-of-month. On
 * Apr 22, every bar covers days 1–22 of its month (Apr 1–22, Mar 1–22, …),
 * answering Germán's "how many did we send by this same date each month"
 * boss question. Replaces the old forward-running line chart that pushed
 * each month's April label to Apr 26 when today was Apr 22.
 */

'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { DmOverviewSendTrend } from '@/types/dm-overview';

interface Props {
  data: DmOverviewSendTrend | null;
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  padding: '10px 12px',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(ym: string) {
  const [y, m] = ym.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

function rangeLabel(ym: string, cutoffDay: number) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} 1–${cutoffDay}, ${y}`;
}

interface ChartRow {
  month: string;
  firstClass: number;
  standard: number;
  total: number;
  cutoffDay: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartRow }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{rangeLabel(row.month, row.cutoffDay)}</div>
      <div style={{ marginBottom: 2 }}>{row.total.toLocaleString()} pieces</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        First class {row.firstClass.toLocaleString()} · Standard {row.standard.toLocaleString()}
      </div>
    </div>
  );
}

export function DmOverviewSendTrendWidget({ data }: Props) {
  const chartData = useMemo<ChartRow[]>(
    () =>
      (data?.series ?? []).map((s) => ({
        month: s.month,
        firstClass: s.firstClass,
        standard: s.standard,
        total: s.total,
        cutoffDay: s.cutoffDay,
      })),
    [data]
  );

  if (!data || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Loading PCM send history…
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2 flex flex-col">
      <div
        className="text-xs px-2 pb-1"
        style={{ color: 'var(--text-tertiary)' }}
        title="Each month's bar covers days 1 through today's day-of-month. Advances automatically every day. Lets you compare MTD volume against the same window in prior months."
      >
        All months aligned through day {data.todayDay} — same-period comparison across the last {chartData.length} months.
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-subtle" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, className: 'fill-content-secondary' }}
              tickLine={false}
              axisLine={{ className: 'stroke-stroke' }}
              dy={8}
              tickFormatter={monthLabel}
            />
            <YAxis
              width={50}
              tick={{ fontSize: 11, className: 'fill-content-secondary' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-hover)', opacity: 0.5 }} />
            <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="standard"
              stackId="pieces"
              name="Standard"
              fill="var(--color-chart-6)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="firstClass"
              stackId="pieces"
              name="First class"
              fill="var(--color-chart-3)"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
