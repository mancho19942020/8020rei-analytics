'use client';

import { useMemo } from 'react';
import { BaseHorizontalBarChart } from '@/components/charts';

interface PopularSectionEntry {
  section: string;
  subsection: string;
  detail_tab: string;
  views: number;
  unique_users: number;
}

interface PaPopularSectionsWidgetProps {
  data: PopularSectionEntry[];
}

function buildLabel(entry: PopularSectionEntry): string {
  const parts = [entry.section];
  if (entry.subsection) parts.push(entry.subsection);
  if (entry.detail_tab) parts.push(entry.detail_tab);
  return parts
    .join(' > ')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/ > /g, ' > ');
}

export function PaPopularSectionsWidget({ data }: PaPopularSectionsWidgetProps) {
  const chartData = useMemo(() => {
    // Aggregate by section only for a cleaner chart
    const sectionMap = new Map<string, number>();
    for (const entry of data) {
      const label = entry.section
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      sectionMap.set(label, (sectionMap.get(label) || 0) + entry.views);
    }
    return Array.from(sectionMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-content-tertiary text-sm">
        No section data yet.
      </div>
    );
  }

  return (
    <BaseHorizontalBarChart
      data={chartData}
      color="var(--color-main-500)"
      tooltipFormatter={(value) => [`${value} views`, '']}
    />
  );
}
