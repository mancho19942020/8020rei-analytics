/**
 * IntegrationStatusTab — Features Adoption / Critical Bugs & Delays
 *
 * Executive summary: Integration Status Update.
 * Sections:
 *  - Salesforce: deal & lead sync health (BigQuery)
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

// ─── Rapid Response summary type ──────────────────────────────────────────────

interface RrSummary {
  active_clients: number;
  letters_last_week: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

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

      // RR may not be configured — show zeros rather than failing
      if (rrJson.success) setRrData(rrJson.data);
      else setRrData({ active_clients: 0, letters_last_week: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      <div>
        <h1 className="text-base font-semibold text-content-primary">
          Integration status update
        </h1>
        <p className="text-xs text-content-tertiary mt-0.5">As of {as_of}</p>
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
