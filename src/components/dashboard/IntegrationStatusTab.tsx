/**
 * IntegrationStatusTab — Features Adoption / Critical Bugs & Delays
 *
 * Executive summary: Integration Status Update.
 * Sections:
 *  - Salesforce: deal & lead sync health (BigQuery)
 *  - Sticker Price: Iceberg query usage (static)
 *  - Rapid Response: active clients + letters sent last week (Aurora)
 *
 * Data sources:
 *  - bigquery-467404.domain.feedback_clients_unique
 *  - Aurora: rr_campaign_snapshots, rr_daily_metrics
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { authFetch } from '@/lib/auth-fetch';
import type { IntegrationStatusData } from '@/types/integration-status';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: 'error' | 'alert' | 'success' | 'neutral';
}) {
  const valueColors: Record<string, string> = {
    error:   'text-error-700 dark:text-error-300',
    alert:   'text-alert-700 dark:text-alert-300',
    success: 'text-success-700 dark:text-success-300',
    neutral: 'text-content-primary',
  };
  return (
    <div className="bg-surface-raised rounded-lg px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-content-tertiary">{label}</span>
      <span className={`text-2xl font-semibold leading-none ${accent ? valueColors[accent] : 'text-content-primary'}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-content-secondary mt-0.5">{sub}</span>}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  accent,
  children,
}: {
  title: string;
  accent: 'main' | 'error' | 'alert' | 'info' | 'success';
  children: React.ReactNode;
}) {
  const borderColors: Record<string, string> = {
    main:    'border-l-main-500',
    error:   'border-l-error-500',
    alert:   'border-l-alert-500',
    info:    'border-l-info-500',
    success: 'border-l-success-500',
  };
  const titleColors: Record<string, string> = {
    main:    'text-main-700 dark:text-main-300',
    error:   'text-error-700 dark:text-error-300',
    alert:   'text-alert-700 dark:text-alert-300',
    info:    'text-info-700 dark:text-info-300',
    success: 'text-success-700 dark:text-success-300',
  };

  return (
    <section className={`bg-surface-base shadow-xs rounded-lg border-l-4 ${borderColors[accent]} p-5`}>
      <h2 className={`text-xs font-semibold uppercase tracking-wide mb-4 ${titleColors[accent]}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Usage Bar ────────────────────────────────────────────────────────────────

function UsageBar({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const barColor = pct >= 90 ? 'bg-error-500' : pct >= 70 ? 'bg-alert-500' : 'bg-main-500';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-content-tertiary">{label}</span>
        <span className="text-xs font-medium text-content-secondary">{pct.toFixed(1)}% used</span>
      </div>
      <div className="h-2 w-full bg-surface-raised rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-content-tertiary">
        <span>{used.toLocaleString()} used</span>
        <span>{total.toLocaleString()} capacity</span>
      </div>
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ buildText }: { buildText: () => string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(buildText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy as text for Asana"
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-content-secondary bg-surface-raised hover:bg-surface-raised/80 border border-stroke transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          Copy for Asana
        </>
      )}
    </button>
  );
}

// ─── Rapid Response summary type ──────────────────────────────────────────────

interface RrSummary {
  active_clients: number;
  letters_last_week: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ICEBERG_USED  = 197383;
const ICEBERG_TOTAL = 977845;

export function IntegrationStatusTab() {
  const [data, setData] = useState<IntegrationStatusData | null>(null);
  const [rrData, setRrData] = useState<RrSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sfRes, rrRes] = await Promise.all([
        authFetch('/api/metrics/integration-status'),
        authFetch('/api/rapid-response?type=integration-summary'),
      ]);
      const sfJson = await sfRes.json();
      const rrJson = await rrRes.json();

      if (!sfJson.success) throw new Error(sfJson.error || 'Failed to load Salesforce data');
      setData(sfJson.data);

      if (rrJson.success) setRrData(rrJson.data);
      else setRrData({ active_clients: 0, letters_last_week: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function buildAsanaText(): string {
    if (!data) return '';
    const { salesforce, as_of } = data;
    const icebergPct = ((ICEBERG_USED / ICEBERG_TOTAL) * 100).toFixed(1);

    const lines: string[] = [
      `Integration Status Update — ${as_of}`,
      '',
      '📊 Salesforce',
      `• Clients integrated: ${salesforce.total_integrated}`,
      `• Deal issues: ${salesforce.deal_issues} (no deals synced in 30 days)`,
      `• Lead issues: ${salesforce.lead_issues} (no leads synced in 30 days)`,
      '',
      '📦 Sticker Price',
      `• Iceberg usage: ${ICEBERG_USED.toLocaleString()} / ${ICEBERG_TOTAL.toLocaleString()} (${icebergPct}%)`,
      '',
      '✉️ Rapid Response',
      `• Active clients: ${rrData?.active_clients ?? '—'}`,
      `• Letters sent (last 7 days): ${rrData?.letters_last_week?.toLocaleString() ?? '—'}`,
    ];
    return lines.join('\n');
  }

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-4 max-w-3xl mx-auto">
        <AxisSkeleton variant="custom" width="280px" height="24px" />
        <AxisSkeleton variant="custom" width="100%" height="120px" />
        <AxisSkeleton variant="custom" width="100%" height="120px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg">
        <AxisCallout type="error" title="Failed to load report">
          <p className="mb-3">{error}</p>
          <AxisButton onClick={fetchData} variant="filled" size="sm">Retry</AxisButton>
        </AxisCallout>
      </div>
    );
  }

  if (!data) return null;

  const { salesforce, as_of } = data;

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-content-primary">
            Integration status update
          </h1>
          <p className="text-xs text-content-tertiary mt-0.5">As of {as_of}</p>
        </div>
        <CopyButton buildText={buildAsanaText} />
      </div>

      {/* Salesforce integration health */}
      <SectionCard title="Salesforce" accent="main">
        <div className="grid grid-cols-3 gap-3">
          <KpiCard
            label="Clients integrated"
            value={salesforce.total_integrated}
            accent="neutral"
          />
          <KpiCard
            label="Deal issues"
            value={salesforce.deal_issues}
            sub="No deals synced in 30 days"
            accent={salesforce.deal_issues > 0 ? 'error' : 'success'}
          />
          <KpiCard
            label="Lead issues"
            value={salesforce.lead_issues}
            sub="No leads synced in 30 days"
            accent={salesforce.lead_issues > 0 ? 'alert' : 'success'}
          />
        </div>
      </SectionCard>

      {/* Sticker Price — Iceberg usage (static until Iceberg API is connected) */}
      <SectionCard title="Sticker Price" accent="success">
        <UsageBar
          used={ICEBERG_USED}
          total={ICEBERG_TOTAL}
          label="Iceberg queries"
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <KpiCard label="Queries used" value={ICEBERG_USED.toLocaleString()} accent="neutral" />
          <KpiCard label="Total capacity" value={ICEBERG_TOTAL.toLocaleString()} accent="neutral" />
        </div>
      </SectionCard>

      {/* Rapid Response */}
      <SectionCard title="Rapid Response" accent="info">
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="Active clients"
            value={rrData?.active_clients ?? '—'}
            accent="neutral"
          />
          <KpiCard
            label="Letters sent"
            value={rrData?.letters_last_week?.toLocaleString() ?? '—'}
            sub="Last 7 days"
            accent="neutral"
          />
        </div>
      </SectionCard>

    </div>
  );
}
