/**
 * DM Business Results Alerts Feed Widget
 *
 * Inline alert feed for Layer 2 business result alerts.
 * Reuses the same pattern as RrAlertsFeedWidget.
 */

'use client';

import { useState } from 'react';
import { AxisTag } from '@/components/axis';
import type { DmAlert } from '@/types/dm-conversions';

interface DmAlertsFeedWidgetProps {
  data: DmAlert[];
}

const severityToColor: Record<string, 'error' | 'alert' | 'info'> = {
  critical: 'error',
  warning: 'alert',
  info: 'info',
};

function AlertCard({ alert }: { alert: DmAlert }) {
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

export function DmAlertsFeedWidget({ data }: DmAlertsFeedWidgetProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AxisTag color="success" size="sm" dot>All clear</AxisTag>
        <p className="text-label mt-2" style={{ color: 'var(--text-secondary)' }}>
          No active business result alerts
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-3 overflow-y-auto space-y-2">
      {data.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
