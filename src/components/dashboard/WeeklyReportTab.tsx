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

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-4 max-w-3xl mx-auto">
        <AxisSkeleton variant="custom" width="260px" height="24px" />
        <AxisSkeleton variant="custom" width="100%" height="100px" />
        <AxisSkeleton variant="custom" width="100%" height="180px" />
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
      <div>
        <h1 className="text-base font-semibold text-content-primary">
          Weekly delivery &amp; quality report
        </h1>
        <p className="text-xs text-content-tertiary mt-0.5">{week_start} – {week_end}</p>
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
