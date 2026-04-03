/**
 * Rapid Response Quality Metrics Widget
 *
 * "Is it working?" — Uses AxisPill for each metric with threshold coloring.
 * Title is in the widget card header; no duplicate label inside.
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
  return (
    <div className="flex flex-col gap-2 h-full p-3 overflow-y-auto">
      <AxisPill
        label="Delivery rate (30d)"
        value={`${data.deliveryRate30d}%`}
        type={pillType(data.deliveryRate30d, 80, 70)}
        tooltip="The percentage of mailings that were physically delivered to a mailbox in the last 30 days. A healthy rate is above 80%. Below 70% means many pieces are getting lost or returned."
      />
      <AxisPill
        label="PCM submission rate"
        value={`${data.pcmSubmissionRate}%`}
        type={pillType(data.pcmSubmissionRate, 95, 90)}
        tooltip="The percentage of mailings successfully submitted to PCM (the print vendor). If this drops below 95%, the API connection to PCM may be having issues."
      />
      <AxisPill
        label="Error rate"
        value={`${data.errorRate}%`}
        type={pillType(data.errorRate, 2, 5, true)}
        tooltip="The percentage of mailings that failed during submission — for example, invalid addresses, API timeouts, or rejected orders. A healthy system stays below 2%."
      />
      <AxisPill
        label="Sends (period)"
        value={data.sendsTotal7d.toLocaleString()}
        tooltip="Total number of mailings sent during the selected date range."
      />
      <AxisPill
        label="Delivered (period)"
        value={data.deliveredTotal7d.toLocaleString()}
        tooltip="Total number of mailings confirmed as delivered during the selected date range."
      />
    </div>
  );
}
