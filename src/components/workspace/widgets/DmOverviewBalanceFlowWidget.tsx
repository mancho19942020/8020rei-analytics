/**
 * DM Overview — Balance reconciliation
 *
 * Daily cost-vs-sends flow. Camilo's ask: catch days where $200 was topped up
 * and $2K was spent. Dual-axis: pieces (left) + PCM cost (right) + the
 * current PCM account balance called out above the chart.
 */

'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { DmOverviewBalanceFlow } from '@/types/dm-overview';

interface Props {
  data: DmOverviewBalanceFlow | null;
}

const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

const shortDate = (d: string) => {
  const [, m, day] = d.split('-');
  return `${parseInt(m, 10)}/${parseInt(day, 10)}`;
};

export function DmOverviewBalanceFlowWidget({ data }: Props) {
  const chartData = useMemo(() => data?.series ?? [], [data]);
  const recent = useMemo(() => chartData.slice(-60), [chartData]); // last ~60 days

  if (!data || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        No PCM cost data available
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Balance + lifetime cost summary */}
      <div className="flex items-center gap-6 px-3 pt-2 text-xs text-content-secondary">
        <div>
          PCM balance:{' '}
          <span className={`font-semibold ${data.balance <= 0 ? 'text-alert-700 dark:text-alert-300' : 'text-content-primary'}`}>
            ${data.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          Lifetime PCM cost:{' '}
          <span className="text-content-primary font-semibold">
            ${data.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="text-content-tertiary">Last ~60 days shown</div>
      </div>

      <div className="flex-1 min-h-0 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={recent} margin={{ top: 10, right: 24, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-subtle" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, className: 'fill-content-secondary' }}
              tickLine={false}
              axisLine={{ className: 'stroke-stroke' }}
              dy={8}
              tickFormatter={shortDate}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis
              yAxisId="pieces"
              width={45}
              tick={{ fontSize: 11, className: 'fill-content-secondary' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <YAxis
              yAxisId="cost"
              orientation="right"
              width={55}
              tick={{ fontSize: 11, className: 'fill-content-secondary' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`)}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(label) => new Date(String(label) + 'T00:00:00').toLocaleDateString()}
              formatter={(v, name) => {
                const val = Number(v ?? 0);
                const label = String(name);
                return label === 'Cost'
                  ? [`$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label]
                  : [val.toLocaleString(), label];
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="pieces" dataKey="pieces" name="Pieces" fill="var(--color-main-300)" />
            <Line
              yAxisId="cost"
              type="monotone"
              dataKey="cost"
              name="Cost"
              stroke="var(--color-error-700)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
