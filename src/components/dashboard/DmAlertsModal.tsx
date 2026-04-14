/**
 * DmAlertsModal Component
 *
 * Unified modal for displaying alerts across all three DM Campaign sub-tabs.
 * Replaces inline alert widgets to reduce visual noise and free up space for metrics.
 */

'use client';

import { useState } from 'react';
import { AxisModal } from '@/components/axis/AxisModal';
import { AxisTag } from '@/components/axis';
import type { RrAlert } from '@/types/rapid-response';
import type { DmAlert } from '@/types/dm-conversions';
import type { PriceAlertData } from '@/types/pcm-validation';

// ---------------------------------------------------------------------------
// Shared alert card for RrAlert / DmAlert (same structure)
// ---------------------------------------------------------------------------

const severityToColor: Record<string, 'error' | 'alert' | 'info'> = {
  critical: 'error',
  warning: 'alert',
  info: 'info',
};

function FeedAlertCard({ alert }: { alert: RrAlert | DmAlert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg p-3 cursor-pointer transition-shadow"
      style={{
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--surface-raised)',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AxisTag color={severityToColor[alert.severity]} size="sm" dot>
              {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
            </AxisTag>
            <span
              className="text-sm font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {alert.name}
            </span>
          </div>
          <p className="text-label line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {alert.description}
          </p>
        </div>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-secondary)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div
          className="mt-3 pt-3 space-y-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {alert.metrics && (
            <div className="flex gap-4 text-label">
              {alert.metrics.current !== undefined && (
                <span style={{ color: 'var(--text-secondary)' }}>
                  Current: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{alert.metrics.current}</span>
                </span>
              )}
              {alert.metrics.baseline !== undefined && (
                <span style={{ color: 'var(--text-secondary)' }}>
                  Threshold: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{alert.metrics.baseline}</span>
                </span>
              )}
            </div>
          )}
          <div className="text-label">
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Recommended action: </span>
            <span style={{ color: 'var(--text-primary)' }}>{alert.action}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PCM price alert card (different data shape)
// ---------------------------------------------------------------------------

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

function PriceAlertCard({ data }: { data: PriceAlertData }) {
  const style = levelStyles[data.alertLevel] || levelStyles.ok;
  const title = data.alertLevel === 'critical'
    ? 'Critical: negative margins detected'
    : data.alertLevel === 'warning'
      ? 'Warning: margins below 5% threshold'
      : 'Margins healthy';

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div style={{ color: style.icon }}>
          {data.alertLevel === 'ok' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          )}
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
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DmAlertsModalProps {
  open: boolean;
  onClose: () => void;
  tab: 'operational-health' | 'business-results' | 'pcm-validation';
  /** Operational health alerts */
  rrAlerts?: RrAlert[];
  /** Business results alerts */
  dmAlerts?: DmAlert[];
  /** PCM pricing alert */
  priceAlert?: PriceAlertData | null;
}

const TAB_TITLES: Record<string, string> = {
  'operational-health': 'Operational health alerts',
  'business-results': 'Business result alerts',
  'pcm-validation': 'Pricing alerts',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DmAlertsModal({ open, onClose, tab, rrAlerts, dmAlerts, priceAlert }: DmAlertsModalProps) {
  const title = TAB_TITLES[tab] || 'Alerts';

  const renderContent = () => {
    if (tab === 'operational-health') {
      if (!rrAlerts || rrAlerts.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AxisTag color="success" size="sm" dot>All clear</AxisTag>
            <p className="text-label mt-2" style={{ color: 'var(--text-secondary)' }}>
              No active alerts for operational health
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-2">
          {rrAlerts.map((alert) => (
            <FeedAlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      );
    }

    if (tab === 'business-results') {
      if (!dmAlerts || dmAlerts.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AxisTag color="success" size="sm" dot>All clear</AxisTag>
            <p className="text-label mt-2" style={{ color: 'var(--text-secondary)' }}>
              No active business result alerts
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-2">
          {dmAlerts.map((alert) => (
            <FeedAlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      );
    }

    if (tab === 'pcm-validation') {
      if (!priceAlert) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-label" style={{ color: 'var(--text-secondary)' }}>
              Profitability data pending — alerts will activate once data is available
            </p>
          </div>
        );
      }
      if (priceAlert.alertLevel === 'ok' && priceAlert.alerts.length === 0) {
        return (
          <div className="space-y-4">
            <PriceAlertCard data={priceAlert} />
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AxisTag color="success" size="sm" dot>All clear</AxisTag>
              <p className="text-label mt-2" style={{ color: 'var(--text-secondary)' }}>
                No pricing issues detected
              </p>
            </div>
          </div>
        );
      }
      return <PriceAlertCard data={priceAlert} />;
    }

    return null;
  };

  return (
    <AxisModal open={open} onClose={onClose} title={title} size="lg">
      {renderContent()}
    </AxisModal>
  );
}

// ---------------------------------------------------------------------------
// Helper: compute total alert count for the button badge
// ---------------------------------------------------------------------------

export function getAlertCount(
  tab: string,
  rrAlerts?: RrAlert[],
  dmAlerts?: DmAlert[],
  priceAlert?: PriceAlertData | null,
): number {
  if (tab === 'operational-health') return rrAlerts?.length ?? 0;
  if (tab === 'business-results') return dmAlerts?.length ?? 0;
  if (tab === 'pcm-validation') {
    if (!priceAlert) return 0;
    // Count alerts only when there's an actual issue
    return priceAlert.alertLevel !== 'ok' ? priceAlert.alerts.length : 0;
  }
  return 0;
}
