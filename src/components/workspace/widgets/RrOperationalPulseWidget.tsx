/**
 * Rapid Response Operational Pulse Widget
 *
 * "Is it running?" — Uses AxisPill for each metric.
 * Title is in the widget card header; no duplicate label inside.
 */

'use client';

import { AxisPill } from '@/components/axis';
import type { RrOperationalPulse } from '@/types/rapid-response';

interface RrOperationalPulseWidgetProps {
  data: RrOperationalPulse;
}

function formatTime(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / 3600000);
    if (diffHours < 1) return 'Recently';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return 'Unknown';
  }
}

export function RrOperationalPulseWidget({ data }: RrOperationalPulseWidgetProps) {
  return (
    <div className="flex flex-col gap-2 h-full p-3">
      <AxisPill
        label="Active campaigns"
        value={`${data.activeCampaigns} / ${data.totalCampaigns}`}
        type={data.activeCampaigns === 0 && data.totalCampaigns > 0 ? 'bad' : 'default'}
      />
      <AxisPill
        label="Sends today"
        value={data.sendsToday}
        type={data.activeCampaigns > 0 && data.sendsToday === 0 ? 'bad' : 'default'}
      />
      <AxisPill
        label="Last send"
        value={formatTime(data.lastSendTime)}
      />
      <AxisPill
        label="On hold"
        value={data.totalOnHold}
        type={data.totalOnHold > 0 ? 'bad' : 'default'}
      />
      <AxisPill
        label="Follow-up pending"
        value={data.totalFollowUpPending}
      />
    </div>
  );
}
