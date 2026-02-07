'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FeatureData {
  feature: string;
  views: number;
}

interface FeatureBarChartProps {
  data: FeatureData[];
}

export function FeatureBarChart({ data }: FeatureBarChartProps) {
  return (
    <div className="bg-surface-raised rounded-lg border border-stroke p-4 shadow-sm">
      <h3 className="text-h4 text-content-primary font-semibold mb-4">Feature Usage</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#d1d5db"
          />
          <YAxis
            dataKey="feature"
            type="category"
            width={120}
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
          <Bar dataKey="views" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
