/**
 * Q2 Volume Goal Widget
 *
 * One question: "where do we stand vs the 400K Q2 target?"
 * Hero: a big progress bar with the current count and %.
 * 3 supporting pills: pace-vs-required, days remaining, Q2 spend.
 *
 * Data source (2026-04-17): PCM /order via shared in-memory cache (populated
 * by the 30-min /refresh cron). Falls back to rr_daily_metrics if the cache
 * is cold. Either way, numbers match Overview → Send volume trend for April.
 */

'use client';

import { AxisPill, AxisTooltip } from '@/components/axis';
import type { RrQ2Goal } from '@/types/rapid-response';

interface RrQ2GoalWidgetProps {
  data: RrQ2Goal;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function RrQ2GoalWidget({ data }: RrQ2GoalWidgetProps) {
  const barPercent = Math.min(data.progressPercent, 100);
  const barColor = data.onTrack
    ? 'var(--color-success-500)'
    : data.progressPercent > 0
      ? 'var(--color-alert-500)'
      : 'var(--color-main-300)';

  return (
    <div className="flex flex-col gap-3 h-full p-3">
      {/* Hero: progress bar with big "X of 400K" number above */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {formatNumber(data.currentSends)}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              of {formatNumber(data.target)} Q2 target
            </span>
          </div>
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: barColor }}
          >
            {data.progressPercent}%
          </span>
        </div>
        <AxisTooltip content="Total mail pieces sent across all clients in Q2 2026 (April 1 – June 30). Primary source: PCM /order — the same pagination the DM Campaign → Overview tab uses, filtered to the Q2 window. Aurora fallback (rr_daily_metrics, ~15 days) applies if the PCM cache is cold.">
          <div
            className="w-full rounded-full overflow-hidden cursor-help"
            style={{ height: 10, background: 'var(--surface-sunken)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${barPercent}%`, background: barColor }}
            />
          </div>
        </AxisTooltip>
      </div>

      {/* 3 supporting pills — the what-to-do-about-it numbers */}
      <div className="flex flex-col gap-2 flex-1">
        <AxisPill
          label="Weekly pace"
          value={`${formatNumber(data.weeklyPace)} / ${formatNumber(data.requiredWeeklyPace)}`}
          type={data.onTrack ? 'good' : 'bad'}
          tooltip={`Current pace ${formatNumber(data.weeklyPace)}/wk vs ${formatNumber(data.requiredWeeklyPace)}/wk required to hit the 400K target by June 30. ${data.onTrack ? 'On track.' : 'Behind.'}`}
        />
        <AxisPill
          label="Days remaining"
          value={`${data.daysRemaining} of ${data.daysElapsed + data.daysRemaining}`}
          type={data.daysRemaining < 14 && data.progressPercent < 80 ? 'bad' : 'default'}
          tooltip="Days left in Q2 2026 (ends June 30) vs days in the full quarter."
        />
        <AxisPill
          label="Q2 spend"
          value={`$${formatNumber(data.totalCost)}`}
          tooltip="PCM cost for Q2 pieces sent so far (per-piece era rates × count)."
        />
      </div>
    </div>
  );
}
