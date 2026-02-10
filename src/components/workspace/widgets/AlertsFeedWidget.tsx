/**
 * Alerts Feed Widget
 *
 * Displays a scrollable list of active alerts with:
 * - Severity indicator (color-coded)
 * - Alert name and description
 * - Affected entity (if applicable)
 * - Metrics with baseline/current/change
 * - Recommended action
 */

'use client';

import { useState } from 'react';

interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'platform' | 'client' | 'feature' | 'engagement' | 'growth';
  description: string;
  entity?: string;
  metrics?: {
    baseline?: number;
    current?: number;
    change_pct?: number;
  };
  detected_at: string;
  action: string;
  link?: string;
}

interface AlertsFeedWidgetProps {
  data: Alert[];
}

// Severity badge component
function SeverityBadge({ severity }: { severity: Alert['severity'] }) {
  const config = {
    critical: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      dot: 'bg-red-500',
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    info: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
  };

  const classes = config[severity];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${classes.bg} ${classes.text} border ${classes.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${classes.dot}`} />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

// Category badge component
function CategoryBadge({ category }: { category: Alert['category'] }) {
  const categoryConfig = {
    platform: { icon: '🖥️', label: 'Platform' },
    client: { icon: '🏢', label: 'Client' },
    feature: { icon: '⚙️', label: 'Feature' },
    engagement: { icon: '📊', label: 'Engagement' },
    growth: { icon: '📈', label: 'Growth' },
  };

  const config = categoryConfig[category];

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-surface-base text-content-secondary border border-stroke">
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

// Metrics display component
function MetricsDisplay({ metrics }: { metrics: Alert['metrics'] }) {
  if (!metrics) return null;

  const hasChange = metrics.change_pct !== undefined && metrics.change_pct !== null;
  const isPositive = hasChange && metrics.change_pct! > 0;

  return (
    <div className="flex items-center gap-4 text-xs mt-2">
      {metrics.baseline !== undefined && (
        <div className="flex flex-col">
          <span className="text-content-tertiary">Baseline</span>
          <span className="font-medium text-content-primary tabular-nums">
            {metrics.baseline.toLocaleString()}
          </span>
        </div>
      )}
      {metrics.current !== undefined && (
        <div className="flex flex-col">
          <span className="text-content-tertiary">Current</span>
          <span className="font-medium text-content-primary tabular-nums">
            {metrics.current.toLocaleString()}
          </span>
        </div>
      )}
      {hasChange && (
        <div className="flex flex-col">
          <span className="text-content-tertiary">Change</span>
          <span className={`font-medium tabular-nums ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? '+' : ''}{metrics.change_pct!.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Single alert card component
function AlertCard({ alert, expanded, onToggle }: { alert: Alert; expanded: boolean; onToggle: () => void }) {
  const severityBorder = {
    critical: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-blue-500',
  };

  const formattedTime = new Date(alert.detected_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`
        bg-surface-raised rounded-lg border border-stroke border-l-4 ${severityBorder[alert.severity]}
        hover:border-stroke-strong hover:shadow-sm transition-all duration-200
      `}
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-main-500/50 rounded-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm text-content-primary">{alert.name}</span>
              {alert.entity && (
                <span className="text-xs text-content-secondary bg-surface-base px-2 py-0.5 rounded border border-stroke">
                  {alert.entity}
                </span>
              )}
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={alert.severity} />
              <CategoryBadge category={alert.category} />
              <span className="text-xs text-content-tertiary">{formattedTime}</span>
            </div>
          </div>

          {/* Expand/collapse icon */}
          <svg
            className={`w-5 h-5 text-content-tertiary transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-stroke pt-3 space-y-3">
          {/* Description */}
          <div>
            <p className="text-sm text-content-secondary">{alert.description}</p>
          </div>

          {/* Metrics */}
          {alert.metrics && <MetricsDisplay metrics={alert.metrics} />}

          {/* Recommended action */}
          <div className="bg-surface-base rounded-lg p-3 border border-stroke">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-main-600 dark:text-main-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-content-secondary mb-0.5">Recommended Action</p>
                <p className="text-sm text-content-primary">{alert.action}</p>
              </div>
            </div>
          </div>

          {/* Link to related tab */}
          {alert.link && (
            <div className="text-right">
              <span className="text-xs text-main-600 dark:text-main-400 hover:underline cursor-pointer">
                View in {alert.link.replace('/', '').charAt(0).toUpperCase() + alert.link.slice(2)} tab →
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AlertsFeedWidget({ data }: AlertsFeedWidgetProps) {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const toggleAlert = (alertId: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      return next;
    });
  };

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-content-primary mb-1">All Clear!</h3>
          <p className="text-sm text-content-secondary max-w-xs">
            No active alerts detected. Your metrics are within normal ranges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="space-y-3 p-1">
        {data.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            expanded={expandedAlerts.has(alert.id)}
            onToggle={() => toggleAlert(alert.id)}
          />
        ))}
      </div>
    </div>
  );
}
