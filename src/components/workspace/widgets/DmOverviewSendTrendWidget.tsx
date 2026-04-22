/**
 * DM Overview — Send volume trend (monthly volume chart, 2026-04-22 rework v2)
 *
 * Stacked bar chart, one bar per month:
 * - Past months show full-month totals (end-of-month).
 * - The current month shows pieces sent so far (day 1 → today).
 *
 * Updates automatically via the /api/dm-overview/refresh cron — no manual
 * step. When the month ends, the current-month bar freezes at its full total
 * and a new bar for the next month appears on the 1st.
 *
 * Defensive fallbacks (2026-04-22 fix): if the cached payload pre-dates the
 * rewrite and is missing todayDay / cutoffDay / isCurrentMonth, compute them
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
  Cell,
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
  isCurrentMonth: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartRow }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const monthName = MONTH_FULL[row.monthIndex - 1];
  let header: string;
  if (row.isCurrentMonth) {
    header = row.cutoffDay === 1
      ? `${monthName} 1, ${row.year} (month-to-date)`
      : `${monthName} 1–${row.cutoffDay}, ${row.year} (month-to-date)`;
  } else {
    header = `${monthName} ${row.year} (full month)`;
  }
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
  const now = new Date();
  const fallbackTodayDay = now.getDate();
  const fallbackTodayMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const alignDay = data?.todayDay ?? fallbackTodayDay;

  const chartData = useMemo<ChartRow[]>(() => {
    if (!data?.series) return [];
    return data.series.map((s) => {
      // Back-fill missing fields if the cache was written before the current
      // rewrite. After one /api/dm-overview/refresh run these will always be
      // present on the server side.
      const [y, m] = s.month.split('-').map(Number);
      const monthLastDay = lastDayOfMonth(s.month);
      const isCurrentMonth = s.isCurrentMonth ?? (s.month === fallbackTodayMonth);
      const cutoffDay = s.cutoffDay ?? (isCurrentMonth ? alignDay : monthLastDay);
      return {
        month: s.month,
        year: y,
        monthIndex: m,
        firstClass: s.firstClass ?? 0,
        standard: s.standard ?? 0,
        total: s.total ?? 0,
        cutoffDay,
        isCurrentMonth,
      };
    });
  }, [data, alignDay, fallbackTodayMonth]);

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
        title="Past months show their full totals. The current-month bar grows each day; when the month ends it freezes at full total and the next month starts. Updates automatically every 30 minutes via the overview-refresh cron — no manual step."
      >
        Past months = full totals. Current month = pieces sent so far (day 1 → {alignDay}). Updates daily.
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
            >
              {chartData.map((row) => (
                <Cell
                  key={`std-${row.month}`}
                  fill={row.isCurrentMonth ? 'var(--color-chart-6)' : 'var(--color-chart-6)'}
                  fillOpacity={row.isCurrentMonth ? 0.55 : 1}
                />
              ))}
            </Bar>
            <Bar
              dataKey="firstClass"
              stackId="pieces"
              name="First class"
              fill="var(--color-chart-3)"
              radius={[3, 3, 0, 0]}
            >
              {chartData.map((row) => (
                <Cell
                  key={`fc-${row.month}`}
                  fill={row.isCurrentMonth ? 'var(--color-chart-3)' : 'var(--color-chart-3)'}
                  fillOpacity={row.isCurrentMonth ? 0.55 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
