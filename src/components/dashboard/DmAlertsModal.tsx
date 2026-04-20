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
import { AxisCallout } from '@/components/axis/AxisCallout';
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
// PCM price alert card — uses AxisCallout for consistent styling + dark mode
// ---------------------------------------------------------------------------

const alertLevelToCalloutType: Record<string, 'success' | 'alert' | 'error'> = {
  ok: 'success',
  warning: 'alert',
  critical: 'error',
};

function PriceAlertCard({ data }: { data: PriceAlertData }) {
  const calloutType = alertLevelToCalloutType[data.alertLevel] || 'success';
  const title = data.alertLevel === 'critical'
    ? 'Critical: negative margins detected'
    : data.alertLevel === 'warning'
      ? 'Warning: margins below 5% threshold'
      : 'Margins healthy';

  return (
    <AxisCallout type={calloutType} title={title}>
      <p className="mb-1.5">
        Overall margin: {data.overallMarginPct.toFixed(1)}%
        {data.standardMarginPct !== null && ` · Standard: ${data.standardMarginPct.toFixed(1)}%`}
        {data.firstClassMarginPct !== null && ` · First Class: ${data.firstClassMarginPct.toFixed(1)}%`}
      </p>
      {data.alerts.length > 0 && (
        <ul className="space-y-1">
          {data.alerts.map((alert, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-0.5">•</span>
              <span>{alert}</span>
            </li>
          ))}
        </ul>
      )}
    </AxisCallout>
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
