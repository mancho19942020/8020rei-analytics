/**
 * Insights Summary Widget
 *
 * Displays 3 severity level counts (Critical, Warning, Info) in a horizontal layout.
 * Each card has a "Learn more" button that opens an informational modal.
 * Following the Axis Design System patterns.
 */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// ============================================
// Severity Information Data
// ============================================

interface AlertExample {
  id: string;
  name: string;
  description: string;
}

interface SeverityInfo {
  title: string;
  description: string;
  responseTime: string;
  color: 'critical' | 'warning' | 'info';
  alerts: AlertExample[];
  actions: string[];
}

const SEVERITY_INFO: Record<string, SeverityInfo> = {
  critical: {
    title: 'Critical Alerts',
    description: 'Critical alerts indicate severe issues that require immediate attention. These alerts signal potential data loss, significant drops in user activity, or clients at high risk of churning.',
    responseTime: 'Immediate (within hours)',
    color: 'critical',
    alerts: [
      {
        id: 'P2',
        name: 'DAU Drop',
        description: 'Daily active users fell more than 2 standard deviations below the 14-day average.',
      },
      {
        id: 'P5',
        name: 'Active Clients Drop',
        description: 'The number of active client subdomains dropped more than 20% week-over-week.',
      },
      {
        id: 'C1',
        name: 'Client Going Dormant',
        description: 'A client that was highly active (>50 events/week average) now has almost no activity (<5 events in 7 days).',
      },
    ],
    actions: [
      'Check platform uptime and error logs immediately',
      'Verify GA4 tracking is still collecting data',
      'Contact affected clients for urgent outreach',
      'Cross-reference with CRM for churn risk assessment',
    ],
  },
  warning: {
    title: 'Warning Alerts',
    description: 'Warning alerts highlight anomalies and trends that should be reviewed soon. These may indicate emerging issues or opportunities that need investigation.',
    responseTime: 'Within 24-48 hours',
    color: 'warning',
    alerts: [
      {
        id: 'P1',
        name: 'DAU Spike',
        description: 'Daily active users exceeded 2 standard deviations above the 14-day average.',
      },
      {
        id: 'P3',
        name: 'Event Volume Anomaly',
        description: 'Total daily events deviated more than 2 standard deviations from the 14-day average.',
      },
      {
        id: 'F2',
        name: 'Feature Abandonment',
        description: 'A feature\'s usage dropped more than 50% week-over-week.',
      },
    ],
    actions: [
      'Investigate the source of the anomaly',
      'Check if changes are from real users or bot activity',
      'Review recent deployments that may have affected tracking',
      'Test affected features manually',
    ],
  },
  info: {
    title: 'Informational Alerts',
    description: 'Informational alerts provide insights about positive trends, new activity, and opportunities. These don\'t require urgent action but are valuable for weekly reviews.',
    responseTime: 'Weekly review recommended',
    color: 'info',
    alerts: [
      {
        id: 'C4',
        name: 'New Client Detected',
        description: 'A new subdomain appeared in the last 7 days that wasn\'t seen in the previous 30 days.',
      },
      {
        id: 'F1',
        name: 'Feature Usage Spike',
        description: 'A feature\'s views increased more than 100% week-over-week.',
      },
      {
        id: 'G1',
        name: 'First Visits Spike',
        description: 'First-time visits exceeded 2 standard deviations above the 14-day average.',
      },
    ],
    actions: [
      'Welcome new clients and track their onboarding journey',
      'Identify what drove positive spikes (marketing, word-of-mouth)',
      'Document successful patterns for future reference',
      'Consider highlighting popular features in communications',
    ],
  },
};

// ============================================
// Severity Info Modal Component
// ============================================

interface SeverityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  severity: 'critical' | 'warning' | 'info';
}

function SeverityInfoModal({ isOpen, onClose, severity }: SeverityInfoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const info = SEVERITY_INFO[severity];

  const colorClasses = {
    critical: {
      headerBg: 'bg-red-500 dark:bg-red-600',
      badgeBg: 'bg-red-100 dark:bg-red-900/30',
      badgeText: 'text-red-700 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
    },
    warning: {
      headerBg: 'bg-amber-500 dark:bg-amber-600',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
      badgeText: 'text-amber-700 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    info: {
      headerBg: 'bg-blue-500 dark:bg-blue-600',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
      badgeText: 'text-blue-700 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    },
  };

  const classes = colorClasses[severity];

  // Prevent rendering until mounted on client (for portal)
  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-base border border-stroke rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 ${classes.headerBg} text-white`}>
          <div className="flex items-center gap-3">
            {severity === 'critical' && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {severity === 'warning' && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {severity === 'info' && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <h2 className="text-lg font-semibold">{info.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-150"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <p className="text-sm text-content-secondary leading-relaxed">{info.description}</p>
            <div className="mt-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-content-secondary">
                <strong>Response time:</strong> {info.responseTime}
              </span>
            </div>
          </div>

          {/* Alert Types */}
          <div>
            <h3 className="text-sm font-semibold text-content-primary mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Alert Types in This Category
            </h3>
            <div className="space-y-3">
              {info.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-surface-raised rounded-lg border border-stroke"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${classes.badgeBg} ${classes.badgeText}`}>
                      {alert.id}
                    </span>
                    <span className="font-medium text-sm text-content-primary">{alert.name}</span>
                  </div>
                  <p className="text-xs text-content-secondary">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div>
            <h3 className="text-sm font-semibold text-content-primary mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Recommended Actions
            </h3>
            <ul className="space-y-2">
              {info.actions.map((action, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-content-secondary">
                  <svg className="w-4 h-4 text-content-tertiary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stroke bg-surface-raised">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-main-600 hover:bg-main-700 text-white rounded-lg font-medium text-sm transition-colors duration-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );

  // Render modal using portal to body to escape widget overflow constraints
  return createPortal(modalContent, document.body);
}

// ============================================
// Severity Card Component
// ============================================

interface SeverityCardProps {
  label: string;
  count: number;
  icon: ReactNode;
  color: 'critical' | 'warning' | 'info';
  description: string;
  onLearnMore: () => void;
}

function SeverityCard({ label, count, icon, color, description, onLearnMore }: SeverityCardProps) {
  const colorClasses = {
    critical: {
      bg: 'bg-red-500 dark:bg-red-600',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700',
      learnMoreBg: 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50',
      learnMoreText: 'text-red-700 dark:text-red-400',
    },
    warning: {
      bg: 'bg-amber-500 dark:bg-amber-600',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700',
      learnMoreBg: 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50',
      learnMoreText: 'text-amber-700 dark:text-amber-400',
    },
    info: {
      bg: 'bg-blue-500 dark:bg-blue-600',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
      learnMoreBg: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50',
      learnMoreText: 'text-blue-700 dark:text-blue-400',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={`flex flex-col p-3 bg-surface-raised rounded-xl border ${classes.border} hover:shadow-sm transition-all duration-200`}>
      {/* Header: Icon + Label + Learn More */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`flex-shrink-0 w-7 h-7 rounded-lg ${classes.bg} flex items-center justify-center text-white`}>
            {icon}
          </div>
          <span className="text-sm font-medium text-content-secondary">{label}</span>
        </div>
        {/* Learn More Button */}
        <button
          onClick={onLearnMore}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors duration-200 ${classes.learnMoreBg} ${classes.learnMoreText}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Learn more
        </button>
      </div>

      {/* Main Value + Description row */}
      <div className="flex items-baseline justify-between">
        <div className={`text-3xl font-bold ${classes.text} tabular-nums`}>
          {count}
        </div>
        <div className="text-xs text-content-tertiary">
          {description}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Widget Component
// ============================================

interface InsightsSummaryWidgetProps {
  data: {
    critical: number;
    warning: number;
    info: number;
    total: number;
    last_checked: string;
  };
}

export function InsightsSummaryWidget({ data }: InsightsSummaryWidgetProps) {
  const [modalSeverity, setModalSeverity] = useState<'critical' | 'warning' | 'info' | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {/* Critical Alerts */}
        <SeverityCard
          label="Critical"
          count={data.critical}
          color="critical"
          description="Requires immediate attention"
          onLearnMore={() => setModalSeverity('critical')}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />

        {/* Warning Alerts */}
        <SeverityCard
          label="Warning"
          count={data.warning}
          color="warning"
          description="Review within 24-48 hours"
          onLearnMore={() => setModalSeverity('warning')}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Info Alerts */}
        <SeverityCard
          label="Info"
          count={data.info}
          color="info"
          description="Weekly review recommended"
          onLearnMore={() => setModalSeverity('info')}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Severity Info Modal */}
      {modalSeverity && (
        <SeverityInfoModal
          isOpen={true}
          onClose={() => setModalSeverity(null)}
          severity={modalSeverity}
        />
      )}
    </>
  );
}
