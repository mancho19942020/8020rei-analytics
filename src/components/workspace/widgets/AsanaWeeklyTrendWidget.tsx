/**
 * Asana Weekly Trend Widget
 *
 * Dual-line chart showing tasks created vs completed per week.
 * Uses Recharts following the ApiCallsTrendWidget pattern.
 */

'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { AsanaWeeklyTrendEntry } from '@/types/asana-tasks';

interface AsanaWeeklyTrendWidgetProps {
  data: AsanaWeeklyTrendEntry[];
}

function formatWeek(week: string): string {
  // week is "YYYY-MM-DD" — show "MM/DD"
  if (!week) return '';
  const parts = week.split('-');
  return `${parts[1]}/${parts[2]}`;
}

export function AsanaWeeklyTrendWidget({ data }: AsanaWeeklyTrendWidgetProps) {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-content-tertiary text-sm">
        No trend data available
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis
            dataKey="week"
            tickFormatter={formatWeek}
            tick={{ fontSize: 11 }}
            className="fill-content-secondary"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={45}
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
            labelFormatter={(label) => formatWeek(String(label))}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="created"
            name="Created"
            stroke="var(--color-main-500)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="var(--color-success-500)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
