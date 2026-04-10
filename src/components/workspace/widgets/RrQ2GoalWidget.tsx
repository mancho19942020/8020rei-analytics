/**
 * Q2 Volume Goal Widget
 *
 * Tracks progress toward 400K DM pieces in Q2 2026 (April-June).
 * Shows progress bar + 5 key metrics. No scroll — everything visible at once.
 * Data source: rr_daily_metrics (per data-consistency-guardian Rule 1).
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

  return (
    <div className="flex flex-col gap-3 h-full p-3">
      {/* Progress bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>{formatNumber(data.currentSends)} of {formatNumber(data.target)} pieces</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{data.progressPercent}%</span>
        </div>
        <AxisTooltip content="Total mail pieces sent across all clients in Q2 2026 (April 1 - June 30). Source: rr_daily_metrics.">
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 10, background: 'var(--surface-sunken)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${barPercent}%`,
                background: data.onTrack
                  ? 'var(--color-success-500)'
                  : data.progressPercent > 0
                    ? 'var(--color-warning-500)'
                    : 'var(--color-main-300)',
              }}
            />
          </div>
        </AxisTooltip>
      </div>

      {/* Key metrics — 5 pills, no scroll */}
      <div className="flex flex-col gap-2 flex-1">
        <AxisPill
          label="Weekly pace"
          value={`${formatNumber(data.weeklyPace)} / wk`}
          type={data.onTrack ? 'good' : 'bad'}
          tooltip={`Current weekly send rate. Need ${formatNumber(data.requiredWeeklyPace)}/wk to hit 400K by end of Q2.`}
        />
        <AxisPill
          label="Required pace"
          value={`${formatNumber(data.requiredWeeklyPace)} / wk`}
          tooltip="Weekly send rate needed for the remaining weeks to reach the 400K target."
        />
        <AxisPill
          label="Days remaining"
          value={data.daysRemaining}
          type={data.daysRemaining < 14 && data.progressPercent < 80 ? 'bad' : 'default'}
          tooltip="Calendar days left in Q2 2026 (ends June 30)."
        />
        <AxisPill
          label="Active clients"
          value={data.activeClients}
          tooltip="Distinct client domains with at least one send in Q2."
        />
        <AxisPill
          label="Delivered"
          value={formatNumber(data.deliveredCount)}
          tooltip="Total mail pieces confirmed delivered in Q2. This counts individual pieces, not unique properties."
        />
      </div>
    </div>
  );
}
