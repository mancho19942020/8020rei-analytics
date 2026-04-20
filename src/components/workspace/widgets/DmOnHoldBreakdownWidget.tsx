/**
 * DM On-Hold Age Breakdown Widget
 *
 * Exposes WHY the on-hold count is moving. Two buckets:
 *   • Stale ≥ 7 days — pieces the monolith's auto-delivery timer should have
 *     flipped to "undelivered" already but hasn't. Indicates the timer is
 *     not running (scheduled cron missing in monolith's Kernel.php).
 *   • Fresh < 7 days — pieces within the expected on-hold window; normal.
 *
 * Data source: /api/rapid-response?type=on-hold-breakdown
 * Backed by rr_campaign_snapshots (hourly campaign-level snapshots). Age is
 * inferred from when a campaign first showed on_hold_count > 0 — row-level
 * piece age lives in the monolith's MySQL and does not sync to Aurora.
 *
 * Rule 18: never hide inconsistencies. The stale count is rendered prominently
 * (red/alert) so the monolith gap is visible at a glance.
 */

'use client';

import { AxisTooltip } from '@/components/axis';

export interface OnHoldBreakdownCampaign {
  domain: string;
  campaignName: string;
  currentHold: number;
  firstOnHoldSeen: string | null;
  daysSinceFirstHold: number;
  ageBucket: 'stale' | 'fresh';
}

export interface OnHoldBreakdownData {
  totalOnHold: number;
  staleOnHold: number;
  freshOnHold: number;
  oldestAgeDays: number;
  campaignsWithHold: number;
  staleCampaigns: number;
  campaigns: OnHoldBreakdownCampaign[];
  thresholdDays: number;
  dataAvailable: boolean;
}

interface Props {
  data: OnHoldBreakdownData | null;
}

function formatNum(n: number): string {
  return n.toLocaleString('en-US');
}

export function DmOnHoldBreakdownWidget({ data }: Props) {
  if (!data || !data.dataAvailable) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        On-hold breakdown loading…
      </div>
    );
  }

  if (data.totalOnHold === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm px-6 text-center" style={{ color: 'var(--text-secondary)' }}>
        <div className="text-2xl mb-1" style={{ color: 'var(--color-success-600, #16a34a)' }}>✓</div>
        <div>No mailings on hold. All clients have sufficient balance.</div>
      </div>
    );
  }

  const staleCampaigns = data.campaigns.filter(c => c.ageBucket === 'stale');
  const freshCampaigns = data.campaigns.filter(c => c.ageBucket === 'fresh');

  const timerTooltip = (
    <>
      The monolith&apos;s auto-delivery timer is supposed to convert pieces on hold
      for 7+ days to &quot;undelivered&quot; so they stop counting as active on-hold.
      Pieces in the stale bucket are overdue for that conversion — the timer
      is either not scheduled or not running. Root cause is in the monolith
      ({' '}<code>app/Console/Kernel.php</code>{' '} needs a schedule entry for{' '}
      <code>handleOnHoldRapidResponses</code>{' '}).
    </>
  );

  return (
    <div className="flex flex-col h-full w-full p-3 gap-3 overflow-y-auto">
      {/* Zone 1: headline split — stale vs fresh */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-3" style={{
          backgroundColor: data.staleOnHold > 0 ? 'var(--color-error-50, #fef2f2)' : 'var(--surface-raised)',
          border: data.staleOnHold > 0 ? '1px solid var(--color-error-300, #fca5a5)' : '1px solid transparent',
        }}>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] uppercase tracking-wide font-medium" style={{
              color: data.staleOnHold > 0 ? 'var(--color-error-700, #b91c1c)' : 'var(--text-tertiary)',
            }}>
              Stale ≥ {data.thresholdDays}d (timer leak)
            </span>
            <AxisTooltip title="Should have been auto-delivered" content={timerTooltip} placement="top" maxWidth={340}>
              <span className="text-[11px] cursor-help" style={{ color: 'var(--text-tertiary)' }}>ⓘ</span>
            </AxisTooltip>
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{
            color: data.staleOnHold > 0 ? 'var(--color-error-700, #b91c1c)' : 'var(--text-primary)',
          }}>
            {formatNum(data.staleOnHold)}
          </div>
          <div className="text-[10px] mt-1" style={{
            color: data.staleOnHold > 0 ? 'var(--color-error-700, #b91c1c)' : 'var(--text-tertiary)',
          }}>
            {staleCampaigns.length} campaign{staleCampaigns.length === 1 ? '' : 's'}
            {data.oldestAgeDays > 0 ? ` · oldest ${data.oldestAgeDays}d` : ''}
          </div>
        </div>

        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-raised)' }}>
          <div className="text-[10px] uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Fresh &lt; {data.thresholdDays}d (within window)
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {formatNum(data.freshOnHold)}
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {freshCampaigns.length} campaign{freshCampaigns.length === 1 ? '' : 's'} · normal on-hold
          </div>
        </div>
      </div>

      {/* Zone 2: stale campaigns list — these are the actionable ones */}
      {staleCampaigns.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-error-700, #b91c1c)' }}>
            Stale campaigns — oldest first
          </div>
          <div className="space-y-1">
            {staleCampaigns.slice(0, 8).map(c => (
              <div key={`${c.domain}-${c.campaignName}`} className="flex items-center justify-between text-xs py-1.5 px-2 rounded" style={{
                backgroundColor: 'var(--surface-raised)',
              }}>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.campaignName}</span>
                  <span className="text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>{c.domain}</span>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 ml-2">
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--color-error-700, #b91c1c)' }}>
                    {formatNum(c.currentHold)}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-error-700, #b91c1c)' }}>
                    {c.daysSinceFirstHold}d held
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone 3: owner context — why does this matter */}
      {data.staleOnHold > 0 && (
        <div className="rounded-lg p-2.5 text-[11px]" style={{
          backgroundColor: 'var(--color-alert-50, #fffbeb)',
          border: '1px solid var(--color-alert-300, #fcd34d)',
          color: 'var(--color-alert-700, #b45309)',
        }}>
          <div className="font-semibold mb-1">Timer not converting stale on-holds</div>
          <div>
            Monolith&apos;s <code>RapidResponseService::handleOnHoldRapidResponses</code> is
            implemented but only invoked on client payment. <code>Kernel.php</code> has
            no schedule entry — stale pieces accumulate until a client recharges.
            Escalate to Christian/Johan for the monolith schedule fix.
          </div>
        </div>
      )}
    </div>
  );
}
