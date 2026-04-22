/**
 * DM Overview — Send volume trend (MTD same-day-cutoff, 2026-04-22 rework)
 *
 * Stacked bar chart: one bar per month, capped at today's day-of-month. On
 * Apr 22, every bar covers days 1–22 of its month (Apr 1–22, Mar 1–22, …),
 * answering Germán's "how many did we send by this same date each month"
 * boss question.
 *
 * Defensive fallbacks (2026-04-22 fix): if the cached payload pre-dates the
 * Phase 5 rewrite and is missing `todayDay` / `cutoffDay`, compute them
 * locally from today's date so the chart still renders meaningful labels
 * during the ~30 min window before the /refresh cron rebuilds the cache.
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

const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function lastDayOfMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

interface ChartRow {
  month: string;          // YYYY-MM
  year: number;
  monthIndex: number;     // 1..12
  firstClass: number;
  standard: number;
  total: number;
  cutoffDay: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartRow }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const monthName = MONTH_FULL[row.monthIndex - 1];
  const header = row.cutoffDay === 1
    ? `${monthName} 1, ${row.year}`
    : `${monthName} 1–${row.cutoffDay}, ${row.year}`;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{header}</div>
      <div style={{ marginBottom: 2 }}>{row.total.toLocaleString()} pieces</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        First class {row.firstClass.toLocaleString()} · Standard {row.standard.toLocaleString()}
      </div>
    </div>
  );
}

export function DmOverviewSendTrendWidget({ data }: Props) {
  // Local "today" used only as a fallback when the cached payload is stale.
  // Real value always comes from `data.todayDay` once the cache refreshes.
  const fallbackTodayDay = new Date().getDate();

  const alignDay = data?.todayDay ?? fallbackTodayDay;

  const chartData = useMemo<ChartRow[]>(() => {
    if (!data?.series) return [];
    return data.series.map((s) => {
      // Back-fill cutoffDay/cutoffDate if the cache was written before the
      // Phase 5 rewrite. After a single /api/dm-overview/refresh run these
      // will always be present on the server side.
      const [y, m] = s.month.split('-').map(Number);
      const monthLastDay = lastDayOfMonth(s.month);
      const cutoffDay = s.cutoffDay ?? Math.min(alignDay, monthLastDay);
      return {
        month: s.month,
        year: y,
        monthIndex: m,
        firstClass: s.firstClass ?? 0,
        standard: s.standard ?? 0,
        total: s.total ?? 0,
        cutoffDay,
      };
    });
  }, [data, alignDay]);

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
        title={`Today is day ${alignDay} of the month. Each bar shows pieces sent day 1 through day ${alignDay} of that month, so every month is compared over the same number of days. The chart advances automatically each day.`}
      >
        Each bar covers day 1 → day {alignDay} of its month — same-period comparison across the last {chartData.length} months.
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
              // "Apr 2026" — full year so there's no "Apr 26 → April 26th" confusion.
              tickFormatter={(ym: string) => {
                const [y, m] = ym.split('-');
                return `${MONTH_SHORT[parseInt(m, 10) - 1]} ${y}`;
              }}
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
