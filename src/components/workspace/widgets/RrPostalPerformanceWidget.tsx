/**
 * "Postal performance" — how the postal service is behaving.
 *
 * Split off from "Is it aligned?" (2026-04-17) because delivery lag and
 * undeliverable rate are about the post office's behavior, not about record
 * alignment between us and PCM. Different question, different widget.
 *
 * Shows:
 *   • Delivery lag (median) — days between PCM submission and delivery confirmation
 *   • Undeliverable rate (7d) — percent of mailings marked undeliverable by USPS
 */

'use client';

import { AxisPill } from '@/components/axis';
import type { RrPcmHealth } from '@/types/rapid-response';

interface RrPostalPerformanceWidgetProps {
  data: RrPcmHealth;
}

export function RrPostalPerformanceWidget({ data }: RrPostalPerformanceWidgetProps) {
  const lag = data.deliveryLagMedianDays ?? 0;
  const undeliverable = data.undeliverableRate7d ?? 0;

  const lagColor = lag > 10
    ? 'var(--color-error-500)'
    : lag > 7
      ? 'var(--color-alert-500)'
      : 'var(--color-success-500)';

  return (
    <div className="flex flex-col gap-1 h-full p-3 overflow-hidden">
      {/* Headline: delivery lag is the primary "is the post office fast?" signal */}
      <div className="pb-1 mb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight" style={{ color: lagColor }}>
            {lag.toFixed(1)}d
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            median delivery lag
          </span>
        </div>
        <div
          className="text-[11px] mt-0.5 italic"
          style={{ color: 'var(--text-secondary)', opacity: 0.85 }}
        >
          Under 7 days is healthy. 7–10 is a warning. Over 10 suggests postal delays.
        </div>
      </div>
      <AxisPill
        label="Delivery lag (median)"
        value={`${lag.toFixed(1)} days`}
        type={lag > 10 ? 'bad' : lag > 7 ? 'default' : 'good'}
        tooltip="Median days from PCM submission to USPS delivery confirmation. Under 7 days is normal; over 10 may indicate postal slowdowns."
      />
      <AxisPill
        label="Undeliverable (7d)"
        value={`${undeliverable.toFixed(1)}%`}
        type={undeliverable > 10 ? 'bad' : undeliverable > 5 ? 'default' : 'good'}
        tooltip="Percentage of mailings marked undeliverable in the last 7 days. Under 5% is normal; over 10% warrants an address list review."
      />
    </div>
  );
}
