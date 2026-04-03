/**
 * Sessions Per User Widget
 *
 * Displays sessions per user trend over time
 * as a line chart.
 */

'use client';

import { BaseLineChart } from '@/components/charts';

interface SessionsPerUserData {
  event_date: string;
  sessions_per_user: number;
  total_sessions: number;
  unique_users: number;
}

interface SessionsPerUserWidgetProps {
  data: SessionsPerUserData[];
}

// Format date from YYYYMMDD to MM/DD
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return `${month}/${day}`;
}

export function SessionsPerUserWidget({ data }: SessionsPerUserWidgetProps) {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    label: formatDate(item.event_date),
    value: item.sessions_per_user,
    total_sessions: item.total_sessions,
    unique_users: item.unique_users,
  }));

  return (
    <div className="w-full h-full">
      <BaseLineChart
        data={chartData}
        color="rgb(34, 197, 94)"
        showDots={chartData.length <= 30}
        tooltipFormatter={(value, name) => {
          const spu = value ?? 0;
          const item = chartData.find((d) => d.value === spu);
          const sessions = item?.total_sessions ?? 0;
          const users = item?.unique_users ?? 0;
          return [
            `${spu.toFixed(2)} (${sessions.toLocaleString()} sessions, ${users.toLocaleString()} users)`,
            'Sessions/user',
          ];
        }}
      />
    </div>
  );
}
