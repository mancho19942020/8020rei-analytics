/**
 * PCM Price Alert Widget
 *
 * Persistent alert banner showing margin health status.
 * Warning when margin < 5%, critical when negative.
 * Data source: computed from profitability-summary + margin-by-mail-class
 */

'use client';

import type { PriceAlertData } from '@/types/pcm-validation';

interface PcmPriceAlertWidgetProps {
  data: PriceAlertData | null;
}

function AlertIcon({ level }: { level: 'ok' | 'warning' | 'critical' }) {
  if (level === 'ok') {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

const levelStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  ok: {
    bg: 'var(--color-success-50, #f0fdf4)',
    border: 'var(--color-success-300, #86efac)',
    text: 'var(--color-success-700, #15803d)',
    icon: 'var(--color-success-500, #22c55e)',
  },
  warning: {
    bg: 'var(--color-alert-50, #fffbeb)',
    border: 'var(--color-alert-300, #fcd34d)',
    text: 'var(--color-alert-700, #b45309)',
    icon: 'var(--color-alert-500, #f59e0b)',
  },
  critical: {
    bg: 'var(--color-error-50, #fef2f2)',
    border: 'var(--color-error-300, #fca5a5)',
    text: 'var(--color-error-700, #b91c1c)',
    icon: 'var(--color-error-500, #ef4444)',
  },
};

export function PcmPriceAlertWidget({ data }: PcmPriceAlertWidgetProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Profitability data pending — alerts will activate once data is available
      </div>
    );
  }

  const style = levelStyles[data.alertLevel] || levelStyles.ok;
  const title = data.alertLevel === 'critical'
    ? 'Critical: negative margins detected'
    : data.alertLevel === 'warning'
      ? 'Warning: margins below 5% threshold'
      : 'Margins healthy';

  return (
    <div className="h-full px-3 py-2 overflow-y-auto">
      <div
        className="rounded-lg p-3 h-full"
        style={{
          backgroundColor: style.bg,
          border: `1px solid ${style.border}`,
        }}
      >
        <div className="flex items-start gap-3">
          <div style={{ color: style.icon }}>
            <AlertIcon level={data.alertLevel} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold mb-1" style={{ color: style.text }}>
              {title}
            </h4>
            <div className="text-xs mb-2" style={{ color: style.text, opacity: 0.8 }}>
              Overall margin: {data.overallMarginPct.toFixed(1)}%
              {data.standardMarginPct !== null && ` · Standard: ${data.standardMarginPct.toFixed(1)}%`}
              {data.firstClassMarginPct !== null && ` · First Class: ${data.firstClassMarginPct.toFixed(1)}%`}
            </div>
            {data.alerts.length > 0 && (
              <ul className="space-y-1">
                {data.alerts.map((alert, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: style.text }}>
                    <span className="mt-0.5">•</span>
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
