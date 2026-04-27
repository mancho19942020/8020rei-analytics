/**
 * WeeklyReportTab — Critical Bugs & Delays
 *
 * Executive summary: Weekly Delivery & Quality Report.
 * Data sources:
 * - AI Task Board (bigquery-467404.asana.ai_task_board)
 * - Bugs & DI Board (bigquery-467404.asana.bugs_di_board)
 * - Suggestions Board (bigquery-467404.asana.tasks)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { authFetch } from '@/lib/auth-fetch';
import type { WeeklyReportData } from '@/types/weekly-report';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-surface-raised rounded-lg px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-content-tertiary">{label}</span>
      <span className="text-2xl font-semibold text-content-primary leading-none">{value}</span>
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

function Divider() {
  return <div className="border-t border-stroke my-4" />;
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-content-tertiary uppercase tracking-wide mb-2">
      {children}
    </p>
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

// ─── Main Component ───────────────────────────────────────────────────────────

interface WeeklyReportTabProps {
  days: number;
  startDate?: string;
  endDate?: string;
}

export function WeeklyReportTab({ days, startDate, endDate }: WeeklyReportTabProps) {
  const [data, setData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = startDate && endDate
        ? `startDate=${startDate}&endDate=${endDate}`
        : `days=${days}`;
      const res = await authFetch(`/api/metrics/weekly-report?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Unknown error');
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [days, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function buildAsanaText(): string {
    if (!data) return '';
    const { deliverables, bugs, critical_bugs, data_inquiries, suggestions, week_start, week_end } = data;
    const fromPastWeeks = bugs.closed_this_week > bugs.reported_this_week
      ? bugs.closed_this_week - bugs.reported_this_week
      : 0;

    const lines: string[] = [
      `Weekly Delivery & Quality Report — ${week_start} to ${week_end}`,
      '',
      '✅ Deliverables complete',
      `• Completed this period: ${deliverables.length}`,
      '',
      '🐛 Bug status',
      'Critical bugs (high + highest priority)',
      `• Reported: ${critical_bugs.reported_this_week}`,
      `• Closed: ${critical_bugs.closed_this_week}`,
      `• Open: ${critical_bugs.open}`,
      '',
      'All bugs',
      `• Reported: ${bugs.reported_this_week}`,
      `• Closed: ${bugs.closed_this_week}${fromPastWeeks > 0 ? ` (${fromPastWeeks} from past weeks)` : ''}`,
      `• Open: ${bugs.open}`,
      `• Internal: ${bugs.internal_product} · Customer: ${bugs.customer_reported}`,
      '',
      '📋 Requests — data inquiries',
      `• Reported: ${data_inquiries.reported_this_week}`,
      `• Open: ${data_inquiries.open}`,
      '',
      '💡 Suggestions',
      `• New this period: ${suggestions.new_this_week}`,
      `• Under review: ${suggestions.under_review}`,
      `• In execution: ${suggestions.in_execution}`,
      `• In backlog: ${suggestions.in_backlog}`,
      `• Implemented: ${suggestions.delivered}`,
    ];
    return lines.join('\n');
  }

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-4 max-w-3xl mx-auto">
        <AxisSkeleton variant="custom" width="260px" height="24px" />
        <AxisSkeleton variant="custom" width="100%" height="100px" />
        <AxisSkeleton variant="custom" width="100%" height="240px" />
        <AxisSkeleton variant="custom" width="100%" height="100px" />
        <AxisSkeleton variant="custom" width="100%" height="100px" />
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

  const { deliverables, bugs, critical_bugs, data_inquiries, suggestions, week_start, week_end } = data;

  const fromPastWeeks = bugs.closed_this_week > bugs.reported_this_week
    ? bugs.closed_this_week - bugs.reported_this_week
    : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-content-primary">
            Weekly delivery &amp; quality report
          </h1>
          <p className="text-xs text-content-tertiary mt-0.5">{week_start} – {week_end}</p>
        </div>
        <CopyButton buildText={buildAsanaText} />
      </div>

      {/* Deliverables */}
      <SectionCard title="Deliverables complete" accent="main">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Completed this period" value={deliverables.length} />
        </div>
      </SectionCard>

      {/* Bug status */}
      <SectionCard title="Bug status" accent="error">
        <SubLabel>Critical bugs — high + highest priority</SubLabel>
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Reported" value={critical_bugs.reported_this_week} />
          <KpiCard label="Closed" value={critical_bugs.closed_this_week} />
          <KpiCard label="Open" value={critical_bugs.open} />
        </div>

        <Divider />

        <SubLabel>All bugs</SubLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Reported" value={bugs.reported_this_week} />
          <KpiCard
            label="Closed"
            value={bugs.closed_this_week}
            sub={fromPastWeeks > 0 ? `${fromPastWeeks} from past weeks` : undefined}
          />
          <KpiCard label="Open" value={bugs.open} />
          <KpiCard
            label="Total received"
            value={bugs.reported_this_week}
            sub={`${bugs.internal_product} internal · ${bugs.customer_reported} customer`}
          />
        </div>
      </SectionCard>

      {/* Data inquiries */}
      <SectionCard title="Requests — data inquiries" accent="alert">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Reported" value={data_inquiries.reported_this_week} />
          <KpiCard label="Open" value={data_inquiries.open} />
        </div>
      </SectionCard>

      {/* Suggestions */}
      <SectionCard title="Suggestions" accent="info">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <KpiCard label="New this period" value={suggestions.new_this_week} />
          <KpiCard label="Under review" value={suggestions.under_review} />
          <KpiCard label="In execution" value={suggestions.in_execution} />
          <KpiCard label="In backlog" value={suggestions.in_backlog} />
          <KpiCard label="✅ Implemented" value={suggestions.delivered} />
        </div>
      </SectionCard>

    </div>
  );
}
