'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AxisCard } from '@/components/axis';

interface FeatureData {
  feature: string;
  views: number;
}

interface FeatureBarChartProps {
  data: FeatureData[];
}

export function FeatureBarChart({ data }: FeatureBarChartProps) {
  return (
    <AxisCard>
      <AxisCard.Header>
        <h3 className="text-h4 text-content-primary font-semibold">Feature Usage</h3>
      </AxisCard.Header>
      <AxisCard.Body>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-subtle" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, className: 'fill-content-secondary' }}
              className="stroke-stroke"
            />
            <YAxis
              dataKey="feature"
              type="category"
              width={120}
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
            <Bar dataKey="views" fill="rgb(29, 78, 216)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </AxisCard.Body>
    </AxisCard>
  );
}
