'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    <div className="bg-surface-raised rounded-lg border border-stroke p-4 shadow-sm">
      <h3 className="text-h4 text-content-primary font-semibold mb-4">Users Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#d1d5db"
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#d1d5db"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#1d4ed8"
            strokeWidth={2}
            dot={{ fill: '#1d4ed8', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
