/**
 * Rapid Response Status Breakdown Widget
 *
 * Mail-piece status distribution for the selected period. Sourced from
 * rr_daily_metrics (currently ~15 days of coverage — see audit Blocker B).
 * This is PIECE status (what happened to each mail piece in the window), NOT
 * campaign status (which lives in "Is it running?"). The audit's row #8 called
 * out the ambiguity; labels below make the scope and source explicit.
 *
 * Donut chart using BaseDonutChart from the design system.
 */

'use client';

import { BaseDonutChart } from '@/components/charts/BaseDonutChart';
import { AxisTooltip } from '@/components/axis';
import type { RrStatusBreakdown } from '@/types/rapid-response';

interface RrStatusBreakdownWidgetProps {
  data: RrStatusBreakdown[];
}

// Colors use the design system's categorical palette
const STATUS_COLORS = [
  'var(--color-success-500)',    // Delivered — green
  'var(--color-main-500)',       // Sent (In Transit) — blue
  'var(--color-alert-500)',      // On Hold — amber
  'var(--color-accent-2-500)',   // Protected — purple
  'var(--color-error-500)',      // Undeliverable — red
  'var(--color-error-700)',      // Error — dark red
];

export function RrStatusBreakdownWidget({ data }: RrStatusBreakdownWidgetProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center px-4" style={{ color: 'var(--text-secondary)' }}>
        <div className="flex flex-col items-center gap-1">
          <span>No status data in the selected period</span>
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            Source: rr_daily_metrics (~15 days of history).
          </span>
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    label: d.status,
    value: d.count,
  }));

  return (
    <div className="h-full w-full p-2 flex flex-col">
      <div className="flex items-center justify-between text-[11px] px-1" style={{ color: 'var(--text-tertiary)' }}>
        <span>Mail-piece status · selected period</span>
        <AxisTooltip content="Per-piece outcomes (delivered, in transit, on hold, etc.) aggregated over the selected date range from rr_daily_metrics. NOT the same as campaign status (active/paused/disabled) shown in 'Is it running?' — campaigns are an 8020REI abstraction, mail pieces are the PCM-tracked unit. rr_daily_metrics has about 15 days of history today.">
          <span style={{ color: 'var(--text-secondary)', textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'help' }}>
            Piece status vs campaign status?
          </span>
        </AxisTooltip>
      </div>
      <div className="flex-1 min-h-0">
        <BaseDonutChart
          data={chartData}
          colors={STATUS_COLORS}
          legendPosition="bottom"
          showLabels={true}
          labelThreshold={0.03}
        />
      </div>
    </div>
  );
}
