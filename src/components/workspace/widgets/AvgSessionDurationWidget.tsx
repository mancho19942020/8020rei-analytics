/**
 * Average Session Duration Widget
 *
 * Displays average session duration over time
 * as a line chart.
 */

'use client';

import { BaseLineChart } from '@/components/charts';

interface AvgSessionDurationData {
  event_date: string;
  avg_duration_sec: number;
  total_sessions: number;
}

interface AvgSessionDurationWidgetProps {
  data: AvgSessionDurationData[];
}

// Format date from YYYYMMDD to MM/DD
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return `${month}/${day}`;
}

// Format seconds as "Xm Ys"
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

export function AvgSessionDurationWidget({ data }: AvgSessionDurationWidgetProps) {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    label: formatDate(item.event_date),
    value: item.avg_duration_sec,
    total_sessions: item.total_sessions,
  }));

  return (
    <div className="w-full h-full">
      <BaseLineChart
        data={chartData}
        color="rgb(168, 85, 247)"
        showDots={chartData.length <= 30}
        tooltipFormatter={(value, name) => {
          const sec = value ?? 0;
          const item = chartData.find((d) => d.value === sec);
          const sessions = item?.total_sessions ?? 0;
          return [
            `${formatDuration(sec)} (${sessions.toLocaleString()} sessions)`,
            'Avg duration',
          ];
        }}
      />
    </div>
  );
}
