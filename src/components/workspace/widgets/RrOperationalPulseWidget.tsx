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
        tooltip="Campaigns with status 'active' in the latest snapshot / total campaigns ever created. One client domain can have multiple campaigns. Source: rr_campaign_snapshots. Note: 'campaign' is an 8020REI abstraction — PCM tracks individual orders (mail pieces), not campaigns. Cross-tab equality is at the piece level (see 'Is it working?' → Lifetime pieces, which matches PCM). Same active/total appears in DM Campaign → Overview → Active campaigns card."
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
        value={
          data.totalOnHold === 0
            ? '0'
            : data.staleOnHold > 0
              ? `${data.totalOnHold.toLocaleString('en-US')} (${data.staleOnHold.toLocaleString('en-US')} stale)`
              : `${data.totalOnHold.toLocaleString('en-US')} (all fresh)`
        }
        type={data.staleOnHold > 0 ? 'bad' : data.totalOnHold > 0 ? 'default' : 'default'}
        tooltip={
          data.staleOnHold > 0
            ? `${data.totalOnHold.toLocaleString('en-US')} mailings on hold. ${data.staleOnHold.toLocaleString('en-US')} have been on-hold ≥ 7 days (stale) — the monolith's auto-delivery timer should have converted them to 'undelivered' but hasn't. ${data.freshOnHold.toLocaleString('en-US')} are < 7 days old (fresh, within normal window). Oldest piece: ${data.oldestOnHoldDays} days. Stale count = 0 means the timer is keeping up; any stale count means pieces are overdue for conversion. See Campaigns table below for the offending campaigns.`
            : data.totalOnHold > 0
              ? `${data.totalOnHold.toLocaleString('en-US')} mailings on hold — all within the normal 7-day window (fresh). No pieces overdue for the monolith's auto-delivery timer.`
              : 'No mailings on hold. All clients have sufficient balance.'
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
