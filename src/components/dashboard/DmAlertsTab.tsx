/**
 * DmAlertsTab
 *
 * DM Campaign → Alerts sub-tab. Triage queue across the four data tabs.
 * Replaces the previous "Alerts" button + DmAlertsModal pattern.
 *
 * Three sections:
 *   - Operational health alerts (developer-action — pipeline / delivery / sync)
 *   - Business result alerts (CS-action — campaign performance, lifecycle)
 *   - Data integrity alerts (collapsible — "the dashboards may be lying")
 *
 * Per-card and bulk Copy-to-Slack-mrkdwn using the same digest format the
 * daily Slack cron produces. No new API — reuses
 * /api/rapid-response?type=alerts and /api/dm-conversions?type=alerts.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { AxisCallout, AxisSkeleton, AxisButton, AxisTag } from '@/components/axis';
import { authFetch } from '@/lib/auth-fetch';
import { AlertCard, categorizeRrAlert, formatAlertCardMrkdwn } from './AlertCard';
import type { RrAlert } from '@/types/rapid-response';
import type { DmAlert } from '@/types/dm-conversions';

type AnyAlert = RrAlert | DmAlert;

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

function sortBySeverity<T extends { severity: string }>(alerts: T[]): T[] {
  return [...alerts].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

function countBySeverity(alerts: AnyAlert[]): { critical: number; warning: number; info: number } {
  return {
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  };
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${Math.round(diffHr / 24)} d ago`;
}

/** Build a Slack digest mirroring slack-alerts/route.ts thread format. */
function formatDigestMrkdwn(
  operationalHealth: RrAlert[],
  businessResults: DmAlert[],
  dataIntegrity: RrAlert[],
): string {
  const today = new Date().toISOString().slice(0, 10);
  const total = operationalHealth.length + businessResults.length + dataIntegrity.length;
  const summary = countBySeverity([...operationalHealth, ...businessResults, ...dataIntegrity]);

  const lines: string[] = [];
  lines.push(`*DM Campaign Alerts — ${today} · ${total} active*`);
  lines.push(`${summary.critical} critical · ${summary.warning} warning · ${summary.info} info`);
  lines.push('');

  if (operationalHealth.length > 0) {
    lines.push(`*Operational health (${operationalHealth.length})*`);
    operationalHealth.forEach(a => {
      lines.push(formatAlertCardMrkdwn(a));
      lines.push('');
    });
  }

  if (businessResults.length > 0) {
    lines.push(`*Business results (${businessResults.length})*`);
    businessResults.forEach(a => {
      lines.push(formatAlertCardMrkdwn(a));
      lines.push('');
    });
  }

  if (dataIntegrity.length > 0) {
    lines.push(`*Data integrity (${dataIntegrity.length})*`);
    dataIntegrity.forEach(a => {
      lines.push(formatAlertCardMrkdwn(a));
      lines.push('');
    });
  }

  return lines.join('\n').trim();
}

interface AlertsApiResponse<T> {
  success: boolean;
  data?: { alerts?: T[]; summary?: unknown };
  error?: string;
}

export function DmAlertsTab() {
  const [rrAlerts, setRrAlerts] = useState<RrAlert[]>([]);
  const [dmAlerts, setDmAlerts] = useState<DmAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [diExpanded, setDiExpanded] = useState(false);
  const [bulkCopied, setBulkCopied] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rrRes, dmRes] = await Promise.all([
        authFetch('/api/rapid-response?type=alerts').then(r => r.json() as Promise<AlertsApiResponse<RrAlert>>),
        authFetch('/api/dm-conversions?type=alerts').then(r => r.json() as Promise<AlertsApiResponse<DmAlert>>),
      ]);

      const nextRr = rrRes.success ? rrRes.data?.alerts ?? [] : [];
      const nextDm = dmRes.success ? dmRes.data?.alerts ?? [] : [];

      setRrAlerts(nextRr);
      setDmAlerts(nextDm);
      setSyncedAt(new Date().toISOString());

      if (!rrRes.success && !dmRes.success) {
        setError('Both alert feeds failed. Try refreshing.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-expand data integrity if any fire
  const operationalHealth = sortBySeverity(rrAlerts.filter(a => categorizeRrAlert(a) === 'operational-health'));
  const dataIntegrity = sortBySeverity(rrAlerts.filter(a => categorizeRrAlert(a) === 'data-integrity'));
  const businessResults = sortBySeverity(dmAlerts);

  useEffect(() => {
    if (dataIntegrity.length > 0) setDiExpanded(true);
  }, [dataIntegrity.length]);

  const totals = countBySeverity([...rrAlerts, ...dmAlerts]);
  const total = rrAlerts.length + dmAlerts.length;

  const handleBulkCopy = () => {
    const text = formatDigestMrkdwn(operationalHealth, businessResults, dataIntegrity);
    navigator.clipboard.writeText(text).then(() => {
      setBulkCopied(true);
      setTimeout(() => setBulkCopied(false), 2000);
    });
  };

  const handleSectionCopy = (section: 'oh' | 'br' | 'di') => {
    const text =
      section === 'oh' ? formatDigestMrkdwn(operationalHealth, [], [])
      : section === 'br' ? formatDigestMrkdwn([], businessResults, [])
      : formatDigestMrkdwn([], [], dataIntegrity);
    navigator.clipboard.writeText(text);
  };

  if (loading && total === 0 && !error) {
    return (
      <div className="space-y-4">
        <AxisSkeleton variant="widget" height="80px" fullWidth />
        <AxisSkeleton variant="chart" height="200px" fullWidth />
        <AxisSkeleton variant="chart" height="200px" fullWidth />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="max-w-[820px] mx-auto px-4 py-2">

        {/* Header */}
        <header className="mb-6 pb-4 border-b border-stroke">
          <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <AxisTag color="neutral" variant="outlined">Triage</AxisTag>
              <AxisTag color="info" variant="outlined">Live</AxisTag>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-content-tertiary">
                Synced {formatRelativeTime(syncedAt)}
              </span>
              <AxisButton onClick={fetchAlerts} variant="outlined" size="sm" disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </AxisButton>
              <AxisButton
                onClick={handleBulkCopy}
                variant={bulkCopied ? 'filled' : 'outlined'}
                size="sm"
                disabled={total === 0}
              >
                {bulkCopied ? 'Copied' : 'Copy all'}
              </AxisButton>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-content-primary mb-2 leading-tight">
            Alerts
          </h1>

          <p className="text-sm text-content-secondary leading-relaxed">
            Triage queue across all DM Campaign tabs. Fires from the same data the widgets read,
            cached for 5 min server-side. Click any alert to expand; use the copy buttons to
            paste into Slack as mrkdwn.
          </p>

          {/* Severity summary */}
          {total > 0 && (
            <div className="flex gap-3 mt-4 flex-wrap">
              <SeverityChip color="error" label="Critical" count={totals.critical} />
              <SeverityChip color="alert" label="Warning" count={totals.warning} />
              <SeverityChip color="info" label="Info" count={totals.info} />
              <span className="text-sm text-content-tertiary self-center">
                {total} active
              </span>
            </div>
          )}
        </header>

        {error && (
          <AxisCallout type="error" title="Failed to load alerts">
            <p className="mb-3">{error}</p>
            <AxisButton onClick={fetchAlerts} variant="filled" size="sm">Retry</AxisButton>
          </AxisCallout>
        )}

        {/* Section A — Operational Health */}
        <Section
          title="Operational health"
          subtitle="Pipeline / delivery / sync issues. Action: developer."
          count={operationalHealth.length}
          onCopy={() => handleSectionCopy('oh')}
          emptyMessage="No active operational health alerts"
        >
          {operationalHealth.map(alert => (
            <AlertCard key={alert.id} alert={alert} audience="dev" />
          ))}
        </Section>

        {/* Section B — Business Results */}
        <Section
          title="Business results"
          subtitle="Campaign performance + lifecycle. Action: CS to client."
          count={businessResults.length}
          onCopy={() => handleSectionCopy('br')}
          emptyMessage="No active business result alerts"
        >
          {businessResults.map(alert => (
            <AlertCard key={alert.id} alert={alert} audience="cs" />
          ))}
        </Section>

        {/* Section C — Data integrity (collapsible) */}
        <CollapsibleSection
          title="Data integrity"
          subtitle="The dashboards may be unreliable while these fire. Action: developer."
          count={dataIntegrity.length}
          expanded={diExpanded}
          onToggle={() => setDiExpanded(!diExpanded)}
          onCopy={() => handleSectionCopy('di')}
          emptyMessage="No data integrity alerts"
        >
          {dataIntegrity.map(alert => (
            <AlertCard key={alert.id} alert={alert} audience="dev" />
          ))}
        </CollapsibleSection>

        <div className="mt-8 pt-6 border-t border-stroke mb-8">
          <p className="text-xs text-content-tertiary">
            Alerts are point-in-time and do not respect the global date filter.
            For the source data, see Operational health · Business results · Profitability tabs.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Section helpers ────────────────────────────────────────────

interface SectionProps {
  title: string;
  subtitle: string;
  count: number;
  onCopy: () => void;
  emptyMessage: string;
  children: React.ReactNode;
}

function Section({ title, subtitle, count, onCopy, emptyMessage, children }: SectionProps) {
  return (
    <section className="mb-6">
      <SectionHeader title={title} subtitle={subtitle} count={count} onCopy={onCopy} />
      {count === 0 ? (
        <div className="rounded-lg border border-stroke p-6 text-center">
          <AxisTag color="success" size="sm" dot>All clear</AxisTag>
          <p className="text-label mt-2" style={{ color: 'var(--text-secondary)' }}>
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}

interface CollapsibleSectionProps extends SectionProps {
  expanded: boolean;
  onToggle: () => void;
}

function CollapsibleSection({ title, subtitle, count, expanded, onToggle, onCopy, emptyMessage, children }: CollapsibleSectionProps) {
  return (
    <section className="mb-6">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 mb-2 text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-content-primary">{title}</h2>
            {count > 0 && (
              <AxisTag color={count > 0 ? 'alert' : 'neutral'} size="sm">
                {count}
              </AxisTag>
            )}
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text-secondary)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <p className="text-xs text-content-tertiary mt-0.5">{subtitle}</p>
        </div>
        {count > 0 && expanded && (
          <span
            onClick={(e) => { e.stopPropagation(); onCopy(); }}
            role="button"
            tabIndex={0}
            className="text-xs px-2 py-1 rounded border border-stroke hover:bg-surface-raised transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Copy section
          </span>
        )}
      </button>
      {expanded && (
        count === 0 ? (
          <div className="rounded-lg border border-stroke p-6 text-center">
            <AxisTag color="success" size="sm" dot>All clear</AxisTag>
            <p className="text-label mt-2" style={{ color: 'var(--text-secondary)' }}>
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="space-y-2">{children}</div>
        )
      )}
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  count: number;
  onCopy: () => void;
}

function SectionHeader({ title, subtitle, count, onCopy }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3 mb-2 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-semibold text-content-primary">{title}</h2>
          {count > 0 && (
            <AxisTag color="alert" size="sm">
              {count}
            </AxisTag>
          )}
        </div>
        <p className="text-xs text-content-tertiary mt-0.5">{subtitle}</p>
      </div>
      {count > 0 && (
        <button
          type="button"
          onClick={onCopy}
          className="text-xs px-2 py-1 rounded border border-stroke hover:bg-surface-raised transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          Copy section
        </button>
      )}
    </div>
  );
}

interface SeverityChipProps {
  color: 'error' | 'alert' | 'info';
  label: string;
  count: number;
}

function SeverityChip({ color, label, count }: SeverityChipProps) {
  return (
    <AxisTag color={count > 0 ? color : 'neutral'} size="sm" dot variant={count > 0 ? 'filled' : 'outlined'}>
      {count} {label}
    </AxisTag>
  );
}
