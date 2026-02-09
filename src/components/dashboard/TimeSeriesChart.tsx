'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AxisCard } from '@/components/axis';

interface DataPoint {
  event_date: string;
  users: number;
}

interface TimeSeriesChartProps {
  data: DataPoint[];
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    date: `${item.event_date.slice(4, 6)}/${item.event_date.slice(6, 8)}`
  }));

  return (
    <AxisCard>
      <AxisCard.Header>
        <h3 className="text-h4 text-content-primary font-semibold">Users Over Time</h3>
      </AxisCard.Header>
      <AxisCard.Body>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-subtle" />
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
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="rgb(29, 78, 216)"
              strokeWidth={2}
              dot={{ fill: 'rgb(29, 78, 216)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </AxisCard.Body>
    </AxisCard>
  );
}
