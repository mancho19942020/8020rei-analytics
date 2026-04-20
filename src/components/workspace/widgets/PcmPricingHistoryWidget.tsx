/**
 * PCM Pricing History Widget
 *
 * Line chart showing our rates vs PCM rates over time per mail class.
 * 4 lines: Our Std (solid blue), PCM Std (dashed blue), Our FC (solid orange), PCM FC (dashed orange).
 * The gap between each solid/dashed pair = margin per piece.
 *
 * Data source: dm_volume_summary per-mail-class daily aggregates
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
import type { PricingHistoryData } from '@/types/pcm-validation';

interface PcmPricingHistoryWidgetProps {
  data: PricingHistoryData | null;
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--text-primary)',
};

export function PcmPricingHistoryWidget({ data }: PcmPricingHistoryWidgetProps) {
  const chartData = useMemo(() => {
    if (!data?.trend?.length) return [];
    return data.trend.map(p => ({
      date: p.date.slice(5), // MM-DD format
      fullDate: p.date,
      'Our Std': p.ourStandardRate,
      'PCM Std': p.pcmStandardRate,
      'Our FC': p.ourFirstClassRate,
      'PCM FC': p.pcmFirstClassRate,
    }));
  }, [data]);

  if (!data || !data.dataAvailable || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm px-4 text-center" style={{ color: 'var(--text-secondary)' }}>
        Collecting pricing data — chart will populate as daily syncs run
      </div>
    );
  }

  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-sm px-4 text-center" style={{ color: 'var(--text-secondary)' }}>
        {chartData.length} day of data collected. Chart needs at least 2 days to render a trend.
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const daysBehind = (iso: string) => {
    const ms = new Date(today).getTime() - new Date(iso).getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
  };
  const stdCov = data.coverage?.standard;
  const fcCov = data.coverage?.firstClass;
  const stdLag = stdCov ? daysBehind(stdCov.lastSyncedDate) : null;
  const fcLag = fcCov ? daysBehind(fcCov.lastSyncedDate) : null;
  const showFooter = !!(stdCov || fcCov);
  const anyStale = (stdLag != null && stdLag >= 2) || (fcLag != null && fcLag >= 2);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 min-h-0 px-2 pb-2 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-subtle" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, className: 'fill-content-secondary' }}
              tickLine={false}
              axisLine={{ className: 'stroke-stroke' }}
            />
            <YAxis
              width={50}
              tick={{ fontSize: 10, className: 'fill-content-secondary' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(label, payload) => {
                const fullDate = payload?.[0]?.payload?.fullDate;
                return fullDate || label;
              }}
              formatter={(value) => {
                const num = Number(value || 0);
                return `$${num.toFixed(4)}`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />

            {/* Standard pair — blue */}
            <Line
              type="monotone"
              dataKey="Our Std"
              name="Our Standard"
              stroke="var(--color-main-500, #3b82f6)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="PCM Std"
              name="PCM Standard"
              stroke="var(--color-main-500, #3b82f6)"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              connectNulls
            />

            {/* First Class pair — orange */}
            <Line
              type="monotone"
              dataKey="Our FC"
              name="Our First Class"
              stroke="var(--color-accent-1-500, #f59e0b)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="PCM FC"
              name="PCM First Class"
              stroke="var(--color-accent-1-500, #f59e0b)"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {showFooter && (
        <div className="px-3 pb-2 pt-1 text-[10px] border-t" style={{
          color: anyStale ? 'var(--color-alert-700, #b45309)' : 'var(--text-tertiary)',
          borderColor: 'var(--border-default)',
          backgroundColor: anyStale ? 'var(--color-alert-50, #fffbeb)' : undefined,
        }}>
          <span className="font-medium">Aurora sync:</span>{' '}
          {stdCov && <>Customer Standard through {stdCov.lastSyncedDate}{stdLag ? ` (${stdLag}d behind)` : ''}</>}
          {stdCov && fcCov && <span>{' · '}</span>}
          {fcCov && <>Customer First Class through {fcCov.lastSyncedDate}{fcLag ? ` (${fcLag}d behind)` : ''}</>}
          {anyStale && <span className="ml-1 italic">— line may not reflect recent rate changes</span>}
          <span className="ml-1">· PCM vendor rates from pcm-pricing-eras.ts</span>
        </div>
      )}
    </div>
  );
}
