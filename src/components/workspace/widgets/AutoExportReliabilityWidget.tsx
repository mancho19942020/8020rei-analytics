/**
 * Auto Export Reliability Widget
 *
 * Stacked daily bars: sent (green), failed (red), no_results (amber),
 * pending (grey). Pending is typically zero once a daily sync has landed —
 * we still surface it so mid-run anomalies don't hide.
 */

'use client';

import { useMemo } from 'react';
import { BaseStackedBarChart } from '@/components/charts';
import type { AutoExportReliabilityPoint } from '@/types/auto-export';

interface AutoExportReliabilityWidgetProps {
  data: AutoExportReliabilityPoint[];
}

const SERIES = [
  { dataKey: 'sent', name: 'Sent', color: 'var(--color-success-500)' },
  { dataKey: 'failed', name: 'Failed', color: 'var(--color-error-500)' },
  { dataKey: 'noResults', name: 'No results', color: 'var(--color-alert-500)' },
  { dataKey: 'pending', name: 'Pending', color: 'var(--color-content-tertiary)' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AutoExportReliabilityWidget({ data }: AutoExportReliabilityWidgetProps) {
  const chartData = useMemo(
    () =>
      data.map((p) => ({
        label: formatDate(p.date),
        sent: p.sent,
        failed: p.failed,
        noResults: p.noResults,
        pending: p.pending,
      })),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
        No daily reliability data for this period
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <BaseStackedBarChart data={chartData} series={SERIES} />
    </div>
  );
}
