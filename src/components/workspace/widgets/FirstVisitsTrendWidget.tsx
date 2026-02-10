/**
 * First Visits Trend Widget
 *
 * Displays first visits (new user acquisition) over time
 * as a line chart.
 */

'use client';

import { BaseLineChart } from '@/components/charts';

interface FirstVisitsTrendData {
  event_date: string;
  first_visits: number;
}

interface FirstVisitsTrendWidgetProps {
  data: FirstVisitsTrendData[];
}

// Format date from YYYYMMDD to MM/DD
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return `${month}/${day}`;
}

export function FirstVisitsTrendWidget({ data }: FirstVisitsTrendWidgetProps) {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    label: formatDate(item.event_date),
    value: item.first_visits,
  }));

  return (
    <div className="w-full h-full">
      <BaseLineChart
        data={chartData}
        color="rgb(34, 197, 94)"
        showDots={chartData.length <= 30}
        tooltipFormatter={(value) => [(value ?? 0).toLocaleString(), 'First Visits']}
      />
    </div>
  );
}
