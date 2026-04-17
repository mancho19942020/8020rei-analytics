/**
 * Rapid Response Sends Trend Widget
 *
 * PERIOD-SCOPED send trend. Sources from rr_daily_metrics (Aurora), which today
 * has ~15 days of history (pipeline backfill pending). This widget intentionally
 * shows only the selected date range — the lifetime / multi-month send trend
 * lives on the DM Campaign Overview tab and is sourced directly from PCM
 * /order (14-month coverage). Having two widgets with different time windows is
 * intentional and documented; see audit doc Blocker B (2026-04-17).
 *
 * Multi-line chart showing sends, deliveries, and errors over time.
 * Uses Recharts directly (BaseLineChart only supports single-line)
 * but follows the same styling conventions (tooltip, axis, grid classes).
 */

'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AxisTooltip } from '@/components/axis';
import type { RrDailyMetric } from '@/types/rapid-response';

interface RrSendsTrendWidgetProps {
  data: RrDailyMetric[];
}

// Consistent tooltip styling from BaseLineChart pattern
const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export function RrSendsTrendWidget({ data }: RrSendsTrendWidgetProps) {
  const chartData = useMemo(() => {
    const byDate = new Map<string, { date: string; sends: number; delivered: number; errors: number }>();
    for (const row of data) {
      const existing = byDate.get(row.date) || { date: row.date, sends: 0, delivered: 0, errors: 0 };
      existing.sends += row.sendsTotal;
      existing.delivered += row.deliveredCount;
      existing.errors += row.sendsError;
      byDate.set(row.date, existing);
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center px-4" style={{ color: 'var(--text-secondary)' }}>
        <div className="flex flex-col items-center gap-1">
          <span>No send data in the selected period</span>
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            This widget reads rr_daily_metrics (~15 days of coverage). For lifetime send volume, see DM Campaign → Overview → Send volume trend.
          </span>
        </div>
      </div>
    );
  }

  const dateMin = chartData[0]?.date;
  const dateMax = chartData[chartData.length - 1]?.date;

  return (
    <div className="h-full w-full p-2 flex flex-col gap-1">
      {/* Scope label so users know this is the selected date range, not lifetime.
          Cross-reference to Overview keeps the two widgets' different numbers
          from reading as a contradiction — they're serving different windows. */}
      <div className="flex items-center justify-between text-[11px] px-1" style={{ color: 'var(--text-tertiary)' }}>
        <span>
          Period trend · {dateMin} → {dateMax} ({chartData.length}d)
        </span>
        <AxisTooltip content="Daily sends/deliveries/errors from rr_daily_metrics for the date range selected in the header. rr_daily_metrics currently has about 15 days of history (pipeline backfill pending). For lifetime monthly send volume across all 14+ months, open DM Campaign → Overview → Send volume trend (which reads directly from PCM and is authoritative).">
          <span style={{ color: 'var(--text-secondary)', textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'help' }}>
            Why only {chartData.length} days?
          </span>
        </AxisTooltip>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-stroke-subtle"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={{ className: 'stroke-stroke' }}
            dy={8}
            tickFormatter={(v) => {
              const d = new Date(v + 'T00:00:00');
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
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
            cursor={{ stroke: 'var(--border-default)', strokeDasharray: '3 3' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Line
            type="monotone"
            dataKey="sends"
            name="Sends"
            stroke="var(--color-main-500)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="delivered"
            name="Delivered"
            stroke="var(--color-success-500)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="errors"
            name="Errors"
            stroke="var(--color-error-500)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
