/**
 * PCM Rate History Widget (Revenue & Margin Trend)
 *
 * Per-piece rate comparison chart: our rates vs PCM rates over time.
 * Data from dm_property_conversions (Feb 2025+) + known PCM era rates.
 *
 * 5 lines:
 * - Our First Class rate (solid blue)
 * - PCM First Class rate (dashed blue)
 * - Our Standard rate (solid orange)
 * - PCM Standard rate (dashed orange)
 * - Blended margin per piece (green)
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
  ReferenceLine,
} from 'recharts';
import type { RateHistoryData, PriceDetectionData } from '@/types/pcm-validation';

interface PcmMarginTrendWidgetProps {
  data: RateHistoryData | null;
  /** Optional. When provided, detected rate changes render as vertical
   *  ReferenceLines on the chart so mid-month transitions aren't hidden by
   *  monthly aggregation. Example: Apr '26 blends pre- and post-2026-04-19
   *  rates into a $0.6402 point — the reference line at 2026-04-19 labels
   *  the transition as "Std +$0.03" so readers see it. */
  detection?: PriceDetectionData | null;
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--text-primary)',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonth(v: string): string {
  const parts = String(v).split('-');
  const monthIdx = parseInt(parts[1] || '1', 10) - 1;
  const year = parts[0]?.slice(2);
  return `${MONTH_NAMES[monthIdx]} '${year}`;
}

export function PcmMarginTrendWidget({ data, detection }: PcmMarginTrendWidgetProps) {
  const chartData = useMemo(() => {
    if (!data?.trend?.length) return [];
    return data.trend
      .filter(p => p.ourFcRate > 0 || p.ourStdRate > 0)
      .map(p => ({
        month: p.month,
        'Our FC': p.ourFcRate || null,
        'PCM FC': p.pcmFcRate,
        'Our Std': p.ourStdRate || null,
        'PCM Std': p.pcmStdRate,
        'Margin': p.blendedMargin,
        fcSends: p.fcSends,
        stdSends: p.stdSends,
      }));
  }, [data]);

  // Extract rate-change events to render as vertical reference lines on the chart.
  // Each event is keyed by its month (YYYY-MM) so the line lands in the right
  // bucket on the monthly x-axis. Covers the common case where an intra-month
  // rate change blends into the month's weighted average (Apr '26 = $0.6402
  // instead of showing the $0.63 → $0.66 step).
  const rateEvents = useMemo(() => {
    if (!detection?.changes?.length) return [];
    const byMonth = new Map<string, { month: string; label: string; mailClass: 'standard' | 'first_class'; delta: number }>();
    for (const c of detection.changes) {
      const month = c.changeDate.slice(0, 7);
      const delta = c.newRate - c.oldRate;
      const label = `${c.mailClass === 'first_class' ? 'FC' : 'Std'} ${delta > 0 ? '+' : ''}$${delta.toFixed(2)} (${c.changeDate})`;
      const existing = byMonth.get(`${month}-${c.mailClass}`);
      if (!existing || c.changeDate > existing.label) {
        byMonth.set(`${month}-${c.mailClass}`, { month, label, mailClass: c.mailClass, delta });
      }
    }
    return Array.from(byMonth.values());
  }, [detection]);

  if (!data || !data.dataAvailable || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Rate history pending — data populates from dm_property_conversions
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2 flex flex-col">
      <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-subtle" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={{ className: 'stroke-stroke' }}
            dy={8}
            tickFormatter={formatMonth}
          />
          <YAxis
            width={50}
            tick={{ fontSize: 10, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={false}
            dx={-5}
            tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(label) => formatMonth(String(label))}
            formatter={(value, name) => {
              const num = Number(value || 0);
              if (num === 0 && name !== 'Margin') return ['—', String(name)];
              return [`$${num.toFixed(4)}`, String(name)];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '2px' }} />

          {/* Break-even reference for margin */}
          <ReferenceLine
            y={0}
            stroke="var(--border-default)"
            strokeDasharray="4 4"
          />

          {/* Rate-change reference lines — mid-month transitions detected from
              dm_volume_summary via getPriceDetection. Without these, a monthly
              aggregate can hide a rate change: e.g. Apr '26 blending $0.63 and
              $0.66 Standard into a single $0.6402 point. */}
          {rateEvents.map((e, idx) => (
            <ReferenceLine
              key={`${e.month}-${e.mailClass}-${idx}`}
              x={e.month}
              stroke={e.mailClass === 'first_class'
                ? 'var(--color-main-500, #3b82f6)'
                : 'var(--color-main-300, #93c5fd)'}
              strokeDasharray="2 4"
              strokeWidth={1.25}
              label={{
                value: e.label,
                position: 'insideTopRight',
                fill: e.mailClass === 'first_class'
                  ? 'var(--color-main-700, #1d4ed8)'
                  : 'var(--color-main-500, #3b82f6)',
                fontSize: 9,
              }}
            />
          ))}

          {/* Our rates — blue (what we charge clients) */}
          <Line
            type="stepAfter"
            dataKey="Our FC"
            name="Our FC"
            stroke="var(--color-main-500, #3b82f6)"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 1.5 }}
            connectNulls
          />
          <Line
            type="stepAfter"
            dataKey="Our Std"
            name="Our Std"
            stroke="var(--color-main-300, #93c5fd)"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 1.5 }}
            connectNulls
          />

          {/* PCM rates — red (what we pay PostcardMania) */}
          <Line
            type="stepAfter"
            dataKey="PCM FC"
            name="PCM FC"
            stroke="var(--color-error-500, #ef4444)"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 2, strokeWidth: 1 }}
            connectNulls
          />
          <Line
            type="stepAfter"
            dataKey="PCM Std"
            name="PCM Std"
            stroke="var(--color-error-300, #fca5a5)"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 2, strokeWidth: 1 }}
            connectNulls
          />

          {/* Blended margin — green (the profit per piece) */}
          <Line
            type="stepAfter"
            dataKey="Margin"
            name="Margin"
            stroke="var(--color-success-500, #22c55e)"
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 1.5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
      <div className="px-2 pt-1 text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {rateEvents.length > 0 ? (
          <>Monthly aggregates. Mid-month rate changes appear as dashed vertical lines.
          {data?.currentMonth && (data.currentMonth.standardLatestDate || data.currentMonth.firstClassLatestDate) && (
            <>
              {' '}Current month ({data.currentMonth.month}) point shows the latest observed daily rate
              {data.currentMonth.standardLatestDate && ` (Std through ${data.currentMonth.standardLatestDate}`}
              {data.currentMonth.firstClassLatestDate && `${data.currentMonth.standardLatestDate ? ', ' : ' ('}FC through ${data.currentMonth.firstClassLatestDate}`}
              {(data.currentMonth.standardLatestDate || data.currentMonth.firstClassLatestDate) && ')'}, not the month-blended average — so the chart always ends at current pricing.
            </>
          )}
          </>
        ) : (
          <>Monthly aggregates. Current-month point shows the latest observed daily rate so the chart always ends at current pricing; prior months are month-blended averages.</>
        )}
      </div>
    </div>
  );
}
