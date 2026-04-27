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
  const isHealthy = data.activeCampaigns > 0 && data.sendsToday > 0;
  return (
    <div className="flex flex-col gap-1 h-full p-3 overflow-hidden">
      {/* Headline number */}
      <div className="flex items-baseline gap-2 pb-1 mb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: isHealthy ? 'var(--color-success-500)' : 'var(--color-error-500)' }}
        >
          {data.activeCampaigns}
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
          active of {data.totalCampaigns}
        </span>
      </div>
      <AxisPill
        label="Active campaigns"
        value={`${data.activeCampaigns} / ${data.totalCampaigns}`}
        type={data.activeCampaigns === 0 && data.totalCampaigns > 0 ? 'bad' : 'default'}
        tooltip="Campaigns with status 'active' in the latest snapshot / total campaigns ever created. One client domain can have multiple campaigns. Source: rr_campaign_snapshots. Note: 'campaign' is an 8020REI abstraction — PCM tracks individual orders (mail pieces), not campaigns. Same active/total appears in DM Campaign → Overview → Active campaigns card. For piece-level reconciliation against PCM, see DM Campaign → Overview → Total delivered."
      />
      <AxisPill
        label="Sends today"
        value={data.sendsToday}
        type={data.activeCampaigns > 0 && data.sendsToday === 0 ? 'bad' : 'default'}
        tooltip="How many mailings were dispatched today. If campaigns are active but this is 0, the dispatch system may not be running."
      />
      <AxisPill
        label="Last send"
        value={formatTime(data.lastSendTime)}
        tooltip="When the most recent mailing was sent across all campaigns. If this is more than 1-2 days ago for active campaigns, something may be wrong."
      />
      <AxisPill
        label="On hold"
        value={data.totalOnHold === 0 ? '0' : data.totalOnHold.toLocaleString('en-US')}
        type={data.totalOnHold > 0 ? 'default' : 'default'}
        tooltip={
          data.totalOnHold > 0
            ? `${data.totalOnHold.toLocaleString('en-US')} mailings currently in 'on hold' status — queued but not yet dispatched. Usually means insufficient client balance or a compliance block. For per-campaign "last sent" context to identify campaigns that have stopped dispatching, see the Campaigns table below. Per-piece on-hold age (truthful "oldest piece N days") will surface here once monolith PR #2015 ships oldest_on_hold_at — until then we don't show an age claim because the only available metric (snapshot-history continuity) over-states it once the platform's auto-delivery timer is rotating the queue.`
            : 'No mailings on hold. All clients have sufficient balance and no compliance blocks.'
        }
      />
      <AxisPill
        label="Follow-up pending"
        value={data.totalFollowUpPending}
        tooltip="Scheduled follow-up mailings that haven't been sent yet. A growing number may indicate the follow-up system is backing up."
      />
    </div>
  );
}
