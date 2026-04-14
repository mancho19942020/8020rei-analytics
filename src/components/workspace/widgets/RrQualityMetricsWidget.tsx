/**
 * Rapid Response Quality Metrics Widget
 *
 * "Is it working?" — Uses AxisPill for each metric with threshold coloring.
 * Title is in the widget card header; no duplicate label inside.
 *
 * Delivery rate uses dm_client_funnel (same source as PCM & profitability tab)
 * to ensure cross-tab data consistency.
 */

'use client';

import { AxisPill } from '@/components/axis';
import type { RrQualityMetrics } from '@/types/rapid-response';

interface RrQualityMetricsWidgetProps {
  data: RrQualityMetrics;
}

function pillType(value: number, goodThreshold: number, badThreshold: number, invert = false): 'good' | 'bad' | 'default' {
  if (invert) {
    if (value <= goodThreshold) return 'good';
    if (value >= badThreshold) return 'bad';
    return 'default';
  }
  if (value >= goodThreshold) return 'good';
  if (value <= badThreshold) return 'bad';
  return 'default';
}

export function RrQualityMetricsWidget({ data }: RrQualityMetricsWidgetProps) {
  const deliveryColor = data.deliveryRate30d >= 80
    ? 'var(--color-success-500)'
    : data.deliveryRate30d >= 70
      ? 'var(--color-alert-500)'
      : 'var(--color-error-500)';

  return (
    <div className="flex flex-col gap-1 h-full p-3 overflow-hidden">
      {/* Headline number — delivery rate from dm_client_funnel */}
      <div className="flex items-baseline gap-2 pb-1 mb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: deliveryColor }}
        >
          {data.deliveryRate30d}%
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
          delivery rate
        </span>
      </div>
      <AxisPill
        label="Delivery rate (lifetime)"
        value={`${data.deliveryRate30d}%`}
        type={pillType(data.deliveryRate30d, 80, 70)}
        tooltip="Lifetime delivered ÷ lifetime sent from dm_client_funnel. Same source as PCM & profitability tab (Aurora total delivered / total sends). Cross-check: go to PCM & profitability → the Aurora card shows the same sends and delivered totals. A healthy rate is above 80%."
      />
      <AxisPill
        label="Lifetime sent"
        value={`${(data.lifetimeSent ?? 0).toLocaleString()} mail pieces`}
        tooltip="Total mail pieces ever sent across all campaigns, from dm_client_funnel. Same number as '8020REI (Aurora) total sends' in the PCM & profitability tab. Counts individual mail pieces, not unique properties."
      />
      <AxisPill
        label="Lifetime delivered"
        value={`${(data.lifetimeDelivered ?? 0).toLocaleString()} mail pieces`}
        tooltip="Total mail pieces confirmed delivered across all campaigns, from dm_client_funnel. Same as the 'delivered' count shown in PCM & profitability tab."
      />
      <AxisPill
        label="Error rate (period)"
        value={`${data.errorRate}%`}
        type={pillType(data.errorRate, 2, 5, true)}
        tooltip="Percentage of mail pieces that failed during submission in the selected period. Source: rr_daily_metrics (sends_error / sends_total). A healthy system stays below 2%."
      />
      <AxisPill
        label="Mail pieces sent (period)"
        value={data.sendsTotal7d.toLocaleString()}
        tooltip="Mail pieces dispatched during the selected date range. This is a period count from rr_daily_metrics, not lifetime. For lifetime totals, see 'Lifetime sent' above."
      />
      <AxisPill
        label="Delivered (period)"
        value={data.deliveredTotal7d.toLocaleString()}
        tooltip="Mail pieces confirmed delivered during the selected period from rr_daily_metrics. Note: this period count can include deliveries of mail sent in prior periods."
      />
    </div>
  );
}
