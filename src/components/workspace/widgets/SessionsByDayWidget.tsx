/**
 * Sessions By Day of Week Widget
 *
 * Displays sessions distribution by day of the week
 * as a vertical bar chart.
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SessionsByDayData {
  day_of_week: number;
  sessions: number;
}

interface SessionsByDayWidgetProps {
  data: SessionsByDayData[];
}

// Map day numbers to names (1=Sunday, 2=Monday, ..., 7=Saturday)
const DAY_NAMES = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Tooltip styling
const tooltipStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
};

export function SessionsByDayWidget({ data }: SessionsByDayWidgetProps) {
  // Transform data for the chart with day names
  const chartData = data.map((item) => ({
    day: DAY_NAMES[item.day_of_week] || `Day ${item.day_of_week}`,
    fullDay: FULL_DAY_NAMES[item.day_of_week] || `Day ${item.day_of_week}`,
    sessions: item.sessions,
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 10,
            bottom: 20,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-stroke-subtle"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={{ className: 'stroke-stroke' }}
            dy={8}
          />
          <YAxis
            width={45}
            tick={{ fontSize: 11, className: 'fill-content-secondary' }}
            tickLine={false}
            axisLine={false}
            dx={-5}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), 'Sessions']}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return payload[0].payload.fullDay;
              }
              return label;
            }}
            cursor={{ fill: 'var(--surface-base)', opacity: 0.5 }}
          />
          <Bar
            dataKey="sessions"
            fill="rgb(99, 102, 241)"
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
