'use client';

import { useMemo } from 'react';
import { BaseHorizontalBarChart } from '@/components/charts';

interface PeakHourEntry {
  hour: number;
  events: number;
  unique_users: number;
}

interface PaPeakHoursWidgetProps {
  data: PeakHourEntry[];
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export function PaPeakHoursWidget({ data }: PaPeakHoursWidgetProps) {
  const chartData = useMemo(() => {
    // Fill all 24 hours
    const hourMap = new Map<number, number>();
    for (const entry of data) {
      hourMap.set(entry.hour, entry.events);
    }
    return Array.from({ length: 24 }, (_, i) => ({
      label: formatHour(i),
      value: hourMap.get(i) || 0,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-content-tertiary text-sm">
        No activity data yet.
      </div>
    );
  }

  return (
    <BaseHorizontalBarChart
      data={chartData}
      color="var(--color-info-500)"
      tooltipFormatter={(value) => [`${value} events`, '']}
    />
  );
}
