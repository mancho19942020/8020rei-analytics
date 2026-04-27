/**
 * Q2 Volume Goal Widget
 *
 * One question: "where do we stand vs the 400K Q2 target?"
 * Goal definition (locked 2026-04-27): 400K letters DISPATCHED in Q2.
 * Hero counts pieces PCM has accepted as orders — same all-status concept
 * as the underlying goal. Delivery is tracked as a quality sub-metric.
 *
 * Hero: progress bar with "X of 400K" dispatched.
 * 4 pills: Weekly pace, Days remaining, Delivered (Q2), In transit.
 * (Q2 spend pill removed — cost lives on the Profitability tab; no need
 * to duplicate here.)
 *
 * Data source: PCM /order via shared in-memory cache (populated by the
 * 30-min /refresh cron). Falls back to rr_daily_metrics if the cache is
 * cold. Delivered count comes from rr_daily_metrics.delivered_count
 * summed over Q2 — independent of the dispatched source.
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
        <AxisTooltip content="Pieces dispatched in Q2 2026 (April 1 – June 30) across all clients. Goal: 400K dispatched by June 30. Source: PCM /order (orders PCM accepted) via shared cache, with rr_daily_metrics fallback. Counts dispatch volume — pieces handed off to PCM regardless of whether USPS has confirmed delivery yet. The Delivered (Q2) pill below shows how many of these have landed so far.">
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
          label="Delivered (Q2)"
          value={formatNumber(data.deliveredCount)}
          type={data.deliveredCount > 0 ? 'good' : 'default'}
          tooltip={`Pieces from Q2 that USPS confirmed in a recipient's mailbox. ${
            data.currentSends > 0
              ? `That's ${((data.deliveredCount / data.currentSends) * 100).toFixed(1)}% of the ${formatNumber(data.currentSends)} dispatched so far.`
              : 'Updates as deliveries get scanned.'
          } Source: rr_daily_metrics.delivered_count summed across Q2. This is what the Top contributors widget breaks down per client.`}
        />
        <AxisPill
          label="In transit"
          value={formatNumber(Math.max(0, data.currentSends - data.deliveredCount))}
          tooltip="Q2 pieces dispatched but not yet confirmed delivered. Includes pieces still in carrier transit, returned (retryable), undeliverable (bad address), or blocked (compliance). Expected to shrink as USPS scans land — large persistent gaps suggest list-quality issues."
        />
      </div>
    </div>
  );
}
