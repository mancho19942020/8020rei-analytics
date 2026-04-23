'use client';

import { useMemo } from 'react';
import { BaseLineChart } from '@/components/charts';

interface UsageTrendEntry {
  event_date: { value: string } | string;
  unique_users: number;
  sessions: number;
}

interface PaUsageTrendsWidgetProps {
  data: UsageTrendEntry[];
}

export function PaUsageTrendsWidget({ data }: PaUsageTrendsWidgetProps) {
  const chartData = useMemo(() => {
    return data.map(d => {
      const raw = typeof d.event_date === 'object' && 'value' in d.event_date
        ? d.event_date.value : d.event_date;
      const date = new Date(raw);
      return {
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: d.sessions,
      };
    });
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-content-tertiary text-sm">
        No usage data yet. Data will appear as users visit the platform.
      </div>
    );
  }

  return (
    <BaseLineChart
      data={chartData}
      color="var(--color-main-500)"
      tooltipFormatter={(value) => [`${value} sessions`, '']}
    />
  );
}
