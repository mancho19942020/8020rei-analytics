/**
 * Shared alert card — used by the Alerts tab.
 *
 * Originally extracted from DmAlertsModal.tsx. Adds:
 *   - per-card copy-to-Slack-mrkdwn button
 *   - audience pill (dev / cs) so the reader knows who acts on it
 *   - optional deep-link to the source tab (alert.link)
 */

'use client';

import { useState } from 'react';
import { AxisTag } from '@/components/axis';
import type { RrAlert } from '@/types/rapid-response';
import type { DmAlert } from '@/types/dm-conversions';

export type AnyAlert = RrAlert | DmAlert;
export type AlertAudience = 'dev' | 'cs';

const severityToColor: Record<string, 'error' | 'alert' | 'info'> = {
  critical: 'error',
  warning: 'alert',
  info: 'info',
};

const severityEmoji: Record<string, string> = {
  critical: '🔴',
  warning: '🟡',
  info: '🔵',
};

/** Build a Slack-mrkdwn snippet for a single alert card. */
export function formatAlertCardMrkdwn(alert: AnyAlert): string {
  const lines: string[] = [];
  const emoji = severityEmoji[alert.severity] || '•';
  lines.push(`${emoji} *${alert.name}*`);
  lines.push(alert.description);
  if (alert.entity) lines.push(`_Entity:_ ${alert.entity}`);
  if (alert.metrics?.current !== undefined || alert.metrics?.baseline !== undefined) {
    const parts: string[] = [];
    if (alert.metrics.current !== undefined) parts.push(`current ${alert.metrics.current}`);
    if (alert.metrics.baseline !== undefined) parts.push(`threshold ${alert.metrics.baseline}`);
    lines.push(`_Metrics:_ ${parts.join(' · ')}`);
  }
  lines.push(`_Action:_ ${alert.action}`);
  return lines.join('\n');
}

interface AlertCardProps {
  alert: AnyAlert;
  audience?: AlertAudience;
  onCopied?: () => void;
}

export function AlertCard({ alert, audience, onCopied }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = formatAlertCardMrkdwn(alert);
    navigator.clipboard.writeText(text).then(() => {
      setJustCopied(true);
      onCopied?.();
      setTimeout(() => setJustCopied(false), 1500);
    });
  };

  const link = (alert as RrAlert).link;

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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <AxisTag color={severityToColor[alert.severity]} size="sm" dot>
              {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
            </AxisTag>
            {audience && (
              <AxisTag color={audience === 'dev' ? 'info' : 'neutral'} size="sm" variant="outlined">
                {audience === 'dev' ? 'Dev' : 'CS'}
              </AxisTag>
            )}
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
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded hover:bg-surface-base transition-colors"
            title={justCopied ? 'Copied!' : 'Copy as Slack mrkdwn'}
            aria-label="Copy as Slack mrkdwn"
            style={{ color: justCopied ? 'var(--color-success-600)' : 'var(--text-secondary)' }}
          >
            {justCopied ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )}
          </button>
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div
          className="mt-3 pt-3 space-y-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {alert.entity && (
            <div className="text-label">
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Entity: </span>
              <span style={{ color: 'var(--text-primary)' }}>{alert.entity}</span>
            </div>
          )}
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
          {link && (
            <div className="text-label">
              <a
                href={link}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 underline"
                style={{ color: 'var(--color-info-600)' }}
              >
                Open source tab
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Categorize an RR alert (category='rapid-response') into operational-health
 * (the running pipeline) vs data-integrity (the dashboards may be lying).
 *
 * Data-integrity alerts fire on dashboard data mismatches, not on platform
 * pipeline issues — RR9 (revenue without deals), RR10 (leads without delivery),
 * RR11 (high unattributed), RR13 (negative revenue).
 */
export function categorizeRrAlert(alert: RrAlert): 'operational-health' | 'data-integrity' {
  const id = alert.id;
  if (
    id.startsWith('rr-revenue-no-deal-') ||
    id.startsWith('rr-delivery-tracking-') ||
    id.startsWith('rr-high-unattributed-') ||
    id.startsWith('rr-negative-revenue-')
  ) {
    return 'data-integrity';
  }
  return 'operational-health';
}
