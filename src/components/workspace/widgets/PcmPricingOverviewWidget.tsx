/**
 * PCM Pricing Overview Widget
 *
 * Shows what we charge vs what PCM charges us per mail class,
 * margin per piece, and detected price changes inline.
 *
 * Data source: current-rates + price-detection + margin-by-mail-class
 */

'use client';

import type { CurrentRatesData, PriceDetectionData, MailClassMargin } from '@/types/pcm-validation';

interface PcmPricingOverviewWidgetProps {
  currentRates: CurrentRatesData | null;
  detection: PriceDetectionData | null;
  mailClassData: { mailClasses: MailClassMargin[]; dataAvailable: boolean } | null;
}

function MarginIndicator({ percent }: { percent: number }) {
  const isNeg = percent < 0;
  const isLow = percent >= 0 && percent < 5;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
      style={{
        backgroundColor: isNeg ? 'var(--color-error-50, #fef2f2)' : isLow ? 'var(--color-alert-50, #fffbeb)' : 'var(--color-success-50, #f0fdf4)',
        color: isNeg ? 'var(--color-error-700, #b91c1c)' : isLow ? 'var(--color-alert-700, #b45309)' : 'var(--color-success-700, #15803d)',
      }}>
      {percent.toFixed(1)}%
    </span>
  );
}

function MailClassCard({ label, ourRate, pcmRate }: {
  label: string;
  ourRate: number | null;
  pcmRate: number | null;
  /** @deprecated marginData was used to derive margin% from monolith-stored PCM cost;
   *  we now compute both margin$ and margin% directly from the two rates to stay
   *  consistent with Pricing history. */
  marginData?: MailClassMargin;
}) {
  // Both derived from the same two rates — guaranteed internal consistency.
  const marginPerPiece = ourRate != null && pcmRate != null
    ? Math.round((ourRate - pcmRate) * 10000) / 10000
    : null;
  const marginPct = ourRate != null && pcmRate != null && ourRate > 0
    ? ((ourRate - pcmRate) / ourRate) * 100
    : null;

  return (
    <div className="flex-1 rounded-lg p-3 flex flex-col justify-between" style={{ backgroundColor: 'var(--surface-raised)' }}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </span>
          {marginPct != null && <MarginIndicator percent={marginPct} />}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>We charge</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {ourRate != null ? `$${ourRate.toFixed(4)}` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>PCM charges us</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {pcmRate != null ? `$${pcmRate.toFixed(4)}` : '—'}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="h-px my-2" style={{ backgroundColor: 'var(--border-default)' }} />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Margin/piece</span>
          <span className="text-xl font-bold" style={{
            color: marginPerPiece != null
              ? marginPerPiece < 0 ? 'var(--color-error-600, #dc2626)' : marginPerPiece === 0 ? 'var(--color-alert-600, #d97706)' : 'var(--color-success-600, #16a34a)'
              : 'var(--text-tertiary)',
          }}>
            {marginPerPiece != null ? `${marginPerPiece >= 0 ? '+' : ''}$${marginPerPiece.toFixed(4)}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PcmPricingOverviewWidget({ currentRates, detection, mailClassData }: PcmPricingOverviewWidgetProps) {
  if (!currentRates?.dataAvailable && !detection?.dataAvailable) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Pricing data pending — requires dm_volume_summary per-mail-class data
      </div>
    );
  }

  // PCM rates come from the invoice-verified era schedule (shared with Pricing
  // history). Previously this widget derived them from dm_volume_summary's
  // cumulative_pcm_cost / cumulative_sends, which picks up the monolith's
  // parameters.pcm_cost bug ($0.625/$0.875 instead of $0.63/$0.87) and made
  // this widget contradict Pricing history right below it. Now the two agree
  // by construction — both read the same era rates.
  const stdMargin = mailClassData?.mailClasses?.find(m => m.mailClass === 'standard');
  const fcMargin = mailClassData?.mailClasses?.find(m => m.mailClass === 'first_class');

  const pcmStandard = currentRates?.pcmStandard ?? null;
  const pcmFirstClass = currentRates?.pcmFirstClass ?? null;

  // Recent price changes (last 7 days)
  const recentChanges = detection?.changes?.filter(c => {
    const changeDate = new Date(c.changeDate);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return changeDate >= sevenDaysAgo;
  }) ?? [];

  // Rollout progress
  const stdRollout = detection?.rolloutStatus?.standard;
  const fcRollout = detection?.rolloutStatus?.firstClass;
  const hasRolloutInProgress = (stdRollout && stdRollout.pendingDomains > 0) || (fcRollout && fcRollout.pendingDomains > 0);

  return (
    <div className="flex flex-col gap-2 h-full px-3 py-2">
      {/* Mail class pricing cards — fill available height */}
      <div className="flex gap-2 flex-1 min-h-0">
        <MailClassCard
          label="Standard"
          ourRate={currentRates?.standard ?? null}
          pcmRate={pcmStandard}
          marginData={stdMargin}
        />
        <MailClassCard
          label="First Class"
          ourRate={currentRates?.firstClass ?? null}
          pcmRate={pcmFirstClass}
          marginData={fcMargin}
        />
      </div>

      {/* Recent price change callout */}
      {recentChanges.length > 0 && (
        <div className="rounded-lg p-2.5" style={{
          backgroundColor: 'var(--color-alert-50, #fffbeb)',
          border: '1px solid var(--color-alert-300, #fcd34d)',
        }}>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-alert-500, #f59e0b)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-alert-700, #b45309)' }}>
              Price change detected
            </span>
          </div>
          <div className="space-y-1">
            {recentChanges.slice(0, 3).map((c, i) => (
              <div key={i} className="text-xs" style={{ color: 'var(--color-alert-700, #b45309)' }}>
                {c.mailClass === 'standard' ? 'Standard' : 'First Class'}: ${c.oldRate.toFixed(4)} → ${c.newRate.toFixed(4)} ({c.rateDelta > 0 ? '+' : ''}{c.rateDelta.toFixed(4)}) on {c.changeDate}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rollout progress */}
      {hasRolloutInProgress && (
        <div className="space-y-1.5">
          {stdRollout && stdRollout.pendingDomains > 0 && (
            <div className="text-xs">
              <div className="flex items-center justify-between mb-0.5">
                <span style={{ color: 'var(--text-secondary)' }}>Standard rollout</span>
                <span className="font-medium" style={{ color: 'var(--color-alert-600, #d97706)' }}>
                  {stdRollout.migratedDomains}/{stdRollout.totalDomains} domains
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-raised)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${(stdRollout.migratedDomains / stdRollout.totalDomains) * 100}%`,
                  backgroundColor: 'var(--color-alert-500, #f59e0b)',
                }} />
              </div>
            </div>
          )}
          {fcRollout && fcRollout.pendingDomains > 0 && (
            <div className="text-xs">
              <div className="flex items-center justify-between mb-0.5">
                <span style={{ color: 'var(--text-secondary)' }}>First Class rollout</span>
                <span className="font-medium" style={{ color: 'var(--color-alert-600, #d97706)' }}>
                  {fcRollout.migratedDomains}/{fcRollout.totalDomains} domains
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-raised)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${(fcRollout.migratedDomains / fcRollout.totalDomains) * 100}%`,
                  backgroundColor: 'var(--color-alert-500, #f59e0b)',
                }} />
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
