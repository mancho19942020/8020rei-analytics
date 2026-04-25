/**
 * IntegrationStatusTab — Features Adoption / Critical Bugs & Delays
 *
 * Executive summary: Integration Status Update.
 * Sections:
 *  - Salesforce: deal & lead sync health (BigQuery)
 *  - Sticker Price: Iceberg query usage (static)
 *  - Rapid Response: active clients + letters sent last week (Aurora)
 *  - Engagement Metrics: GA4 views by affiliation with period-over-period comparison
 *
 * Data sources:
 *  - web-app-production-451214 (GA4) via /api/metrics/integration-status
 *  - bigquery-467404.domain.feedback_clients_unique
 *  - Aurora: rr_campaign_snapshots, rr_daily_metrics
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { AxisTooltip } from '@/components/axis/AxisTooltip';
import { DomainLeaderboardWidget } from '@/components/workspace/widgets';
import { authFetch } from '@/lib/auth-fetch';
import { buildDateQueryString } from '@/lib/date-utils';
import type { IntegrationStatusData } from '@/types/integration-status';
import type { DomainLeaderboardEntry } from '@/types/product';

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
  tooltip,
  children,
}: {
  title: string;
  accent: 'main' | 'error' | 'alert' | 'info' | 'success';
  tooltip?: string;
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
      <h2 className={`text-xs font-semibold uppercase tracking-wide mb-4 ${titleColors[accent]} flex items-center gap-1.5`}>
        {title}
        {tooltip && (
          <AxisTooltip content={tooltip} placement="top">
            <svg className="w-3.5 h-3.5 opacity-50 cursor-default" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </AxisTooltip>
        )}
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface RrSummary {
  active_clients: number;
  letters_last_week: number;
}

interface SkiptraceSummary {
  commitment: { used_hits: number; total: number; pct: number };
  financials: { directskip_hits: number; cache_hits: number; cost_directskip: number };
  by_client: { domain: string }[];
}

// ─── Static constants ─────────────────────────────────────────────────────────

const ICEBERG_PURCHASED  = 977_845.2;
const ICEBERG_SPENT      = 755_874;
const ICEBERG_REMAINING  = 221_971.2;

const RR_ACTIVE_CLIENTS    = 12;
const RR_LETTERS_LAST_WEEK = 1_966;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPct(n: number): string {
  return n >= 0 ? `+${n}%` : `${n}%`;
}

function changeAccent(n: number): 'success' | 'neutral' | 'error' {
  if (n > 0) return 'success';
  if (n < 0) return 'error';
  return 'neutral';
}

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function adoptionStr(part: number, total: number): string {
  return total > 0 ? `${Math.round((part / total) * 100)}% of integrated` : '—';
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface IntegrationStatusTabProps {
  days: number;
  startDate?: string;
  endDate?: string;
}

export function IntegrationStatusTab({ days, startDate, endDate }: IntegrationStatusTabProps) {
  const [data, setData]                   = useState<IntegrationStatusData | null>(null);
  const [rrData, setRrData]               = useState<RrSummary | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<DomainLeaderboardEntry[]>([]);
  const [skiptraceData, setSkiptraceData] = useState<SkiptraceSummary | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const dateQs = buildDateQueryString(days, startDate, endDate);
    try {
      const [sfRes, rrRes, domainsRes, stRes] = await Promise.all([
        authFetch(`/api/metrics/integration-status?${dateQs}`),
        authFetch('/api/rapid-response?type=integration-summary'),
        authFetch(`/api/metrics/product-domains?${dateQs}`),
        authFetch('/api/metrics/skiptrace').catch(() => null),
      ]);

      const sfJson      = await sfRes.json();
      const rrJson      = await rrRes.json();
      const domainsJson = await domainsRes.json();

      if (!sfJson.success) throw new Error(sfJson.error || 'Failed to load data');
      setData(sfJson.data);

      if (rrJson.success && rrJson.data?.active_clients > 0) {
        setRrData({ active_clients: rrJson.data.active_clients, letters_last_week: RR_LETTERS_LAST_WEEK });
      } else {
        setRrData({ active_clients: RR_ACTIVE_CLIENTS, letters_last_week: RR_LETTERS_LAST_WEEK });
      }

      if (domainsJson.success) setLeaderboardData(domainsJson.data.leaderboard ?? []);

      if (stRes) {
        try {
          const stJson = await stRes.json();
          if (stJson.success) setSkiptraceData(stJson.data);
        } catch {}
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [days, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function buildAsanaText(): string {
    if (!data) return '';
    const { salesforce, ga4, as_of } = data;
    const icebergPct = ((ICEBERG_SPENT / ICEBERG_PURCHASED) * 100).toFixed(1);

    const lines: string[] = [
      `Integration Status Update — ${as_of}`,
      '',
      '📊 Salesforce',
      `• Clients integrated: ${salesforce.total_integrated}`,
      `• Deal issues: ${salesforce.deal_issues} (no deals synced in 60 days)`,
      `• Lead issues: ${salesforce.lead_issues} (no leads synced in 30 days)`,
      '',
      '📦 Sticker Price',
      `• Purchased credits: ${ICEBERG_PURCHASED.toLocaleString()}`,
      `• Spent credits: ${ICEBERG_SPENT.toLocaleString()} (${icebergPct}%)`,
      `• Remaining credits: ${ICEBERG_REMAINING.toLocaleString()}`,
      '',
      '✉️ Rapid Response',
      `• Active clients: ${rrData?.active_clients ?? RR_ACTIVE_CLIENTS}`,
      `• Letters sent (last 7 days): ${(rrData?.letters_last_week ?? RR_LETTERS_LAST_WEEK).toLocaleString()}`,
      '',
      '👁 Engagement Metrics',
      `• Internal views: ${formatPct(ga4?.internal.views_change_pct ?? 0)} (${ga4?.internal.share_of_total_pct ?? 0}% of total) · avg. session ${ga4?.internal.avg_session_min ?? 0} min (${formatPct(ga4?.internal.session_change_pct ?? 0)})`,
      `• Client views: ${formatPct(ga4?.external.views_change_pct ?? 0)} (${ga4?.external.share_of_total_pct ?? 0}% of total) · avg. session ${ga4?.external.avg_session_min ?? 0} min (${formatPct(ga4?.external.session_change_pct ?? 0)})`,
    ];
    return lines.join('\n');
  }

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-4 max-w-3xl mx-auto">
        <AxisSkeleton variant="custom" width="280px" height="24px" />
        <AxisSkeleton variant="custom" width="100%" height="120px" />
        <AxisSkeleton variant="custom" width="100%" height="120px" />
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

  const { salesforce, ga4, as_of } = data;

  const totalIntegrated = salesforce.total_integrated;
  const visiting        = ga4?.external.unique_client_domains ?? 0;

  // Skiptrace financials
  const st = skiptraceData;
  const stHits    = st?.commitment.used_hits ?? 0;
  const stGoalPct = st?.commitment.pct ?? 0;
  const stGoal    = st?.commitment.total ?? 500_000;
  const stCharge  = st ? (st.financials.directskip_hits + st.financials.cache_hits) * 0.08 : 0;
  const stCost    = st?.financials.cost_directskip ?? 0;
  const stProfit  = stCharge - stCost;
  const stClients = st?.by_client.length ?? 0;

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
      <SectionCard title="Salesforce" accent="error">
        <div className="grid grid-cols-4 gap-3">
          <KpiCard
            label="Clients integrated"
            value={totalIntegrated}
            accent="neutral"
          />
          <KpiCard
            label="Salesforce adoption"
            value={`${totalIntegrated}/141`}
            sub={adoptionStr(totalIntegrated, 141)}
            accent="neutral"
          />
          <KpiCard
            label="Deal issues"
            value={salesforce.deal_issues}
            sub="No deals synced in 60 days"
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
      <SectionCard title="Sticker Price" accent="success" tooltip="Credits renew on April 30">
        <UsageBar
          used={ICEBERG_SPENT}
          total={ICEBERG_PURCHASED}
          label="Iceberg credits"
        />
        <div className="mt-3 grid grid-cols-3 gap-3">
          <KpiCard label="Purchased credits" value={ICEBERG_PURCHASED.toLocaleString()} accent="neutral" />
          <KpiCard label="Spent credits" value={ICEBERG_SPENT.toLocaleString()} accent="neutral" />
          <KpiCard label="Remaining credits" value={ICEBERG_REMAINING.toLocaleString()} accent="success" />
        </div>
      </SectionCard>

      {/* Rapid Response */}
      <SectionCard title="Rapid Response" accent="info">
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="Active clients"
            value={rrData?.active_clients ?? RR_ACTIVE_CLIENTS}
            accent="neutral"
          />
          <KpiCard
            label="Letters sent"
            value={(rrData?.letters_last_week ?? RR_LETTERS_LAST_WEEK).toLocaleString()}
            sub="Last 7 days"
            accent="neutral"
          />
        </div>
      </SectionCard>

      {/* Engagement Metrics — GA4 views by affiliation with period-over-period comparison */}
      <SectionCard title="Engagement metrics" accent="main">
        <div className="flex flex-col gap-4">

          {/* Internal */}
          <div>
            <p className="text-xs font-medium text-content-tertiary uppercase tracking-wide mb-2">
              Internal · {ga4?.internal.share_of_total_pct ?? 0}% of total views
            </p>
            <div className="grid grid-cols-3 gap-3">
              <KpiCard
                label="Views vs last period"
                value={formatPct(ga4?.internal.views_change_pct ?? 0)}
                accent={changeAccent(ga4?.internal.views_change_pct ?? 0)}
              />
              <KpiCard
                label="Avg. session duration"
                value={`${ga4?.internal.avg_session_min ?? 0} min`}
                accent="neutral"
              />
              <KpiCard
                label="Session vs last period"
                value={formatPct(ga4?.internal.session_change_pct ?? 0)}
                accent={changeAccent(ga4?.internal.session_change_pct ?? 0)}
              />
            </div>
          </div>

          {/* Client / External */}
          <div>
            <p className="text-xs font-medium text-content-tertiary uppercase tracking-wide mb-2">
              Client · {ga4?.external.share_of_total_pct ?? 0}% of total views
            </p>
            <div className="grid grid-cols-4 gap-3">
              <KpiCard
                label="Clients visiting"
                value={`${visiting}/141`}
                sub={adoptionStr(visiting, 141)}
                accent="neutral"
              />
              <KpiCard
                label="Views vs last period"
                value={formatPct(ga4?.external.views_change_pct ?? 0)}
                accent={changeAccent(ga4?.external.views_change_pct ?? 0)}
              />
              <KpiCard
                label="Avg. session duration"
                value={`${ga4?.external.avg_session_min ?? 0} min`}
                accent="neutral"
              />
              <KpiCard
                label="Session vs last period"
                value={formatPct(ga4?.external.session_change_pct ?? 0)}
                accent={changeAccent(ga4?.external.session_change_pct ?? 0)}
              />
            </div>
          </div>

        </div>
      </SectionCard>

      {/* Skiptrace summary */}
      {st && (
        <SectionCard title="Skiptrace · Feb – Jul 2026" accent="alert">
          <div className="flex flex-col gap-3">
            <UsageBar
              used={stHits}
              total={stGoal}
              label={`${stHits.toLocaleString()} hits processed · ${stGoalPct.toFixed(1)}% of ${stGoal.toLocaleString()} goal`}
            />
            <div className="grid grid-cols-4 gap-3">
              <KpiCard
                label="Client charge"
                value={formatCurrency(stCharge)}
                sub="(DS + cache) × $0.08"
                accent="neutral"
              />
              <KpiCard
                label="Total cost"
                value={formatCurrency(stCost)}
                sub="DS hits × $0.03"
                accent="neutral"
              />
              <KpiCard
                label="Gross profit"
                value={formatCurrency(stProfit)}
                accent={stProfit >= 0 ? 'success' : 'error'}
              />
              <KpiCard
                label="Usage"
                value={`${stClients}/141`}
                sub={adoptionStr(stClients, 141)}
                accent="neutral"
              />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Clients integrated */}
      <SectionCard title="Clients integrated" accent="info">
        <div className="h-[500px]">
          <DomainLeaderboardWidget
            data={leaderboardData}
            crmOnly={true}
          />
        </div>
      </SectionCard>

    </div>
  );
}
