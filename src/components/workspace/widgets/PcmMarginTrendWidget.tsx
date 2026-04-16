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
import type { RateHistoryData } from '@/types/pcm-validation';

interface PcmMarginTrendWidgetProps {
  data: RateHistoryData | null;
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

export function PcmMarginTrendWidget({ data }: PcmMarginTrendWidgetProps) {
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

  if (!data || !data.dataAvailable || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Rate history pending — data populates from dm_property_conversions
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
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
  );
}
