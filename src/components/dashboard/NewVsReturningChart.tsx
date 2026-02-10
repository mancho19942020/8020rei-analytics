/**
 * NewVsReturningChart Component
 *
 * Stacked bar chart showing new vs returning users per day.
 * Uses Recharts with the Axis design system colors.
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AxisCard } from '@/components/axis';

interface DataPoint {
  event_date: string;
  new_users: number;
  returning_users: number;
}

interface NewVsReturningChartProps {
  data: DataPoint[];
}

export function NewVsReturningChart({ data }: NewVsReturningChartProps) {
  // Format data for display
  const formattedData = data.map((item) => ({
    ...item,
    date: `${item.event_date.slice(4, 6)}/${item.event_date.slice(6, 8)}`,
  }));

  return (
    <AxisCard>
      <AxisCard.Header>
        <h3 className="text-h4 text-content-primary font-semibold">
          New vs Returning Users
        </h3>
        <p className="text-body-regular text-content-tertiary mt-1">
          Daily breakdown of new and returning users
        </p>
      </AxisCard.Header>
      <AxisCard.Body>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData} stackOffset="none">
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-stroke-subtle"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, className: 'fill-content-secondary' }}
              className="stroke-stroke"
            />
            <YAxis
              tick={{ fontSize: 12, className: 'fill-content-secondary' }}
              className="stroke-stroke"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--text-primary)',
              }}
              formatter={(value: number | undefined, name: string | undefined) => {
                const displayValue = value !== undefined ? value.toLocaleString() : '0';
                const displayName = name === 'new_users' ? 'New Users' : 'Returning Users';
                return [displayValue, displayName];
              }}
            />
            <Legend
              formatter={(value: string) =>
                value === 'new_users' ? 'New Users' : 'Returning Users'
              }
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Bar
              dataKey="new_users"
              stackId="users"
              fill="#22c55e"
              name="new_users"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="returning_users"
              stackId="users"
              fill="#3b82f6"
              name="returning_users"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </AxisCard.Body>
    </AxisCard>
  );
}
