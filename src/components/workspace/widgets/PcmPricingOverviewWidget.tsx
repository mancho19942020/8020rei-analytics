/**
 * PCM Pricing Overview Widget
 *
 * Shows what we charge vs what PCM charges us per mail class,
 * margin per piece, and detected price changes inline.
 *
 * Data source: current-rates + price-detection + margin-by-mail-class
 */

'use client';

import { AxisTooltip } from '@/components/axis';
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
  /** 7-day blended customer rate (what we currently show). */
  ourRate: number | null;
  /** PCM vendor rate from the era schedule. */
  pcmRate: number | null;
  /** @deprecated marginData was used to derive margin% from monolith-stored PCM cost;
   *  we now compute both margin$ and margin% directly from the two rates to stay
   *  consistent with Pricing history. */
  marginData?: MailClassMargin;
}) {
  // Margin is calculated from the 7-day-blended rate. Previously this card
  // also rendered a "New rate (eff. YYYY-MM-DD)" line pulled from recent
  // rate changes, but the extra row broke the card's visual rhythm and
  // duplicated info already present in the Recent rate alert chip. Removed
  // per user feedback 2026-04-20.
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
            <AxisTooltip
              title="Customer rate — last 7 days blended"
              content={`The weighted average of what 8020REI charged clients over the last 7 days. Computed live from dm_volume_summary as SUM(daily_cost) / SUM(daily_sends). When a rate change is mid-rollout (e.g. new rate applied on some days but not others), this is the average; the new rate itself appears below as "New rate effective…" when a change is detected.`}
              placement="top"
              maxWidth={320}
            >
              <span className="text-xs cursor-help" style={{ color: 'var(--text-tertiary)' }}>Customer rate <span className="opacity-60">(7d avg)</span></span>
            </AxisTooltip>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {ourRate != null ? `$${ourRate.toFixed(4)}` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <AxisTooltip
              title="PCM vendor rate (they charge us)"
              content="What PostcardMania invoices 8020REI per piece. Invoice-verified era schedule from pcm-pricing-eras.ts. Changes only on PCM contract renegotiation; a separate monitor alerts when PCM's actual invoice rate drifts from this expected value."
              placement="top"
              maxWidth={320}
            >
              <span className="text-xs cursor-help" style={{ color: 'var(--text-tertiary)' }}>PCM vendor rate</span>
            </AxisTooltip>
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

  // latestChangeByClass + rollout progress locals removed 2026-04-20 alongside
  // the "New rate effective" card line and the rollout progress bar. The
  // recent rate changes still surface via the Recent rate alert chip tooltip
  // (see `recentChangesContent` above). Rollout is mothballed.

  // Build the full callout content once — reused for the top-right Recent rate alert chip.
  // The inline block version of this callout was removed 2026-04-20 because it occupied
  // the widget body and hid the Margin/piece rows of the mail-class cards. Now it only
  // renders as a hover popover from a compact alert chip in the header row.
  const recentChangesContent = recentChanges.length > 0 ? (
    <div style={{ maxWidth: 380, textAlign: 'left' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Customer rate change detected</div>
      <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 6, lineHeight: 1.4 }}>
        Changes to what 8020REI charges clients, detected live from dm_volume_summary.
        PCM vendor rates follow a separate contract schedule — that gap is our margin.
      </div>
      {recentChanges.slice(0, 3).map((c, i) => {
        const pcmRateForClass = c.mailClass === 'first_class' ? pcmFirstClass : pcmStandard;
        const marginBoostPerPiece = pcmRateForClass != null ? (c.newRate - c.oldRate) : null;
        const marginBoostPct = pcmRateForClass != null && c.oldRate > 0
          ? (((c.newRate - pcmRateForClass) - (c.oldRate - pcmRateForClass)) / c.oldRate) * 100
          : null;
        return (
          <div key={i} style={{ fontSize: 12, marginBottom: i === recentChanges.length - 1 ? 0 : 6, lineHeight: 1.5 }}>
            <div>
              <span style={{ fontWeight: 600 }}>Customer {c.mailClass === 'standard' ? 'Standard' : 'First Class'}:</span>
              {' '}${c.oldRate.toFixed(4)} → <strong>${c.newRate.toFixed(4)}</strong> ({c.rateDelta > 0 ? '+' : ''}{c.rateDelta.toFixed(4)}) effective {c.changeDate}
            </div>
            {marginBoostPerPiece != null && marginBoostPct != null && pcmRateForClass != null && (
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                +${marginBoostPerPiece.toFixed(4)}/piece margin{marginBoostPct > 0 ? ` (+${marginBoostPct.toFixed(2)}%)` : ''} at PCM vendor rate ${pcmRateForClass.toFixed(4)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-2 h-full px-3 py-2 overflow-y-auto">
      {/* Header row — left-aligned caveat, right-aligned "Recent rate alert" chip.
          The chip was introduced 2026-04-20 PM after the inline callout kept hiding
          the mail-class cards' Margin/piece rows. Hover opens the full alert via
          AxisTooltip (portal-rendered, viewport-clamped). */}
      <div className="flex items-center justify-between gap-2 text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        <AxisTooltip
          title="Aggregate across clients"
          content="The customer rate shown below is a 7-day blended average across every 8020REI client sending mail. Individual clients may be charged a different rate (the monolith stores each client's rate in parameters.unitary_cost per company_id, which does not currently sync to Aurora). Hover the rate on the Pricing history chart at today's date for the latest aggregate rate."
          placement="bottom"
          maxWidth={360}
        >
          <span className="cursor-help">ⓘ Aggregate across clients</span>
        </AxisTooltip>
        {recentChangesContent && (
          <AxisTooltip content={recentChangesContent} placement="bottom" maxWidth={400}>
            <span
              className="inline-flex items-center gap-1 cursor-help px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: 'var(--color-alert-50, #fffbeb)',
                color: 'var(--color-alert-700, #b45309)',
                border: '1px solid var(--color-alert-300, #fcd34d)',
              }}
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Recent rate alert
            </span>
          </AxisTooltip>
        )}
      </div>

      {/* Mail class pricing cards — fill available height. */}
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

      {/* Standard/First-Class rollout progress removed 2026-04-20 per user:
          "I would like to know something about the standard rollout. You are
           saying two out of three domains. What does that mean, and what is
           the value of that information?" — the bar was computed from a tiny
           sample (only domains that sent Standard recently), so 2/3 is noisy
           and doesn't answer an actionable question. The per-client rate
           picture requires the monolith's parameters.unitary_cost sync to
           Aurora (open escalation); until then, a rollout visualization based
           on aggregate blended data misleads more than it informs. */}

    </div>
  );
}
