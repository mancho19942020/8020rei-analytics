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
    <div className="flex flex-col gap-2 h-full p-3">
      <AxisPill
        label="Delivery rate (30d)"
        value={`${data.deliveryRate30d}%`}
        type={pillType(data.deliveryRate30d, 80, 70)}
      />
      <AxisPill
        label="PCM submission rate"
        value={`${data.pcmSubmissionRate}%`}
        type={pillType(data.pcmSubmissionRate, 95, 90)}
      />
      <AxisPill
        label="Error rate"
        value={`${data.errorRate}%`}
        type={pillType(data.errorRate, 2, 5, true)}
      />
      <AxisPill
        label="Sends (period)"
        value={data.sendsTotal7d.toLocaleString()}
      />
      <AxisPill
        label="Delivered (period)"
        value={data.deliveredTotal7d.toLocaleString()}
      />
    </div>
  );
}
