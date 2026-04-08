/**
 * Asana Task Aging Widget
 *
 * Bar chart showing open task age distribution.
 * Uses Recharts BarChart following the ApiCallsTrendWidget pattern.
 */

'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { AsanaTaskAgingEntry } from '@/types/asana-tasks';

const BUCKET_COLORS: Record<string, string> = {
  '0-7 days': 'var(--color-success-500)',
  '8-14 days': 'var(--color-main-500)',
  '15-30 days': 'var(--color-accent-3-500)',
  '31-60 days': 'var(--color-accent-2-500)',
  '60+ days': 'var(--color-error-500)',
};

interface AsanaTaskAgingWidgetProps {
  data: AsanaTaskAgingEntry[];
}

export function AsanaTaskAgingWidget({ data }: AsanaTaskAgingWidgetProps) {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-content-tertiary text-sm">
        No aging data available
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="text-xs text-content-tertiary mb-1 px-2 flex-shrink-0">
        {total} open tasks by age
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 10 }}
              className="fill-content-secondary"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              width={35}
              tick={{ fontSize: 11 }}
              className="fill-content-secondary"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
            />
            <Bar dataKey="count" name="Tasks" maxBarSize={40} radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.bucket}
                  fill={BUCKET_COLORS[entry.bucket] || 'var(--color-main-300)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
