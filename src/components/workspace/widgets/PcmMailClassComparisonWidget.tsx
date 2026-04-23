/**
 * PCM Mail Class Comparison Widget
 *
 * Grouped bar chart comparing Standard vs First Class margins.
 * Data source: dm_volume_summary WHERE mail_class != 'all'
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
import type { MailClassMargin } from '@/types/pcm-validation';

interface PcmMailClassComparisonWidgetProps {
  data: { mailClasses: MailClassMargin[]; dataAvailable: boolean } | null;
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '13px',
  color: 'var(--text-primary)',
};

const MAIL_CLASS_LABELS: Record<string, string> = {
  standard: 'Standard',
  first_class: 'First Class',
};

export function PcmMailClassComparisonWidget({ data }: PcmMailClassComparisonWidgetProps) {
  const chartData = useMemo(() => {
    if (!data?.mailClasses?.length) return [];
    return data.mailClasses.map(mc => ({
      name: MAIL_CLASS_LABELS[mc.mailClass] || mc.mailClass,
      revenue: Number(mc.revenue.toFixed(2)),
      pcmCost: Number(mc.pcmCost.toFixed(2)),
      margin: Number(mc.margin.toFixed(2)),
      marginPct: mc.marginPercent,
    }));
  }, [data]);

  if (!data || !data.dataAvailable || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Mail class breakdown pending — awaiting profitability data
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Margin % summary pills */}
      <div className="flex gap-2 px-3 pt-2 pb-1">
        {chartData.map(mc => {
          const isNeg = mc.marginPct < 0;
          const isLow = mc.marginPct >= 0 && mc.marginPct < 5;
          return (
            <div
              key={mc.name}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: isNeg ? 'var(--color-error-50, #fef2f2)' : isLow ? 'var(--color-alert-50, #fffbeb)' : 'var(--color-success-50, #f0fdf4)',
                color: isNeg ? 'var(--color-error-700, #b91c1c)' : isLow ? 'var(--color-alert-700, #b45309)' : 'var(--color-success-700, #15803d)',
              }}
            >
              <span className="font-medium">{mc.name}:</span>
              <span>{mc.marginPct.toFixed(1)}% margin</span>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-subtle" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, className: 'fill-content-secondary' }}
              tickLine={false}
              axisLine={{ className: 'stroke-stroke' }}
            />
            <YAxis
              width={55}
              tick={{ fontSize: 11, className: 'fill-content-secondary' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => {
                const num = Number(value || 0);
                return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="revenue" name="Revenue (what clients pay)" fill="var(--color-main-500)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pcmCost" name="PCM cost (what PCM charges)" fill="var(--color-accent-1-500)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="margin" name="Margin" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.margin < 0 ? 'var(--color-error-500)' : 'var(--color-success-500)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
