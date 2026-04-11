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
// Follows widget card pattern: bg-surface-base + shadow-xs

function KpiCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-surface-base shadow-xs rounded-lg px-4 py-4 flex flex-col gap-1">
      <span className="text-xs text-content-tertiary">{label}</span>
      <span className="text-2xl font-semibold text-content-primary leading-none">{value}</span>
      {sub && <span className="text-xs text-content-secondary mt-0.5">{sub}</span>}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-base shadow-xs rounded-lg p-5">
      <h2 className="text-sm font-semibold text-content-primary mb-4">{title}</h2>
      {children}
    </section>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-content-tertiary uppercase tracking-wide mb-2">
      {children}
    </p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WeeklyReportTab() {
  const [data, setData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/metrics/weekly-report?days=${days}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Unknown error');
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-4 max-w-4xl mx-auto">
        <AxisSkeleton variant="custom" width="280px" height="28px" />
        <AxisSkeleton variant="custom" width="100%" height="96px" />
        <AxisSkeleton variant="custom" width="100%" height="180px" />
        <AxisSkeleton variant="custom" width="100%" height="96px" />
        <AxisSkeleton variant="custom" width="100%" height="96px" />
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
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-content-primary">
            Weekly delivery &amp; quality report
          </h1>
          <p className="text-xs text-content-tertiary mt-0.5">{week_start} – {week_end}</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={[
                'text-xs px-3 py-1.5 rounded border transition-colors duration-150',
                days === d
                  ? 'bg-main-700 text-white border-main-700'
                  : 'bg-surface-base border-stroke text-content-secondary hover:border-stroke-strong',
              ].join(' ')}
            >
              {d === 7 ? 'Last 7 days' : 'Last 14 days'}
            </button>
          ))}
          <button
            onClick={fetchData}
            className="text-xs px-3 py-1.5 rounded border border-stroke bg-surface-base text-content-secondary hover:border-stroke-strong transition-colors duration-150"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Deliverables */}
      <SectionCard title="Deliverables complete">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Completed this period" value={deliverables.length} />
        </div>
      </SectionCard>

      {/* Bug status */}
      <SectionCard title="Bug status">
        <div className="flex flex-col gap-5">

          <div>
            <SubLabel>Critical bugs (high + highest priority)</SubLabel>
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Reported" value={critical_bugs.reported_this_week} />
              <KpiCard label="Closed" value={critical_bugs.closed_this_week} />
              <KpiCard label="Open" value={critical_bugs.open} />
            </div>
          </div>

          <div className="border-t border-stroke" />

          <div>
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
          </div>
        </div>
      </SectionCard>

      {/* Data inquiries */}
      <SectionCard title="Requests — data inquiries">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Reported" value={data_inquiries.reported_this_week} />
          <KpiCard label="Open" value={data_inquiries.open} />
        </div>
      </SectionCard>

      {/* Suggestions */}
      <SectionCard title="Suggestions">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <KpiCard label="New this period" value={suggestions.new_this_week} />
          <KpiCard label="Under review" value={suggestions.under_review} />
          <KpiCard label="In execution" value={suggestions.in_execution} />
          <KpiCard label="In backlog" value={suggestions.in_backlog} />
          <KpiCard label="Delivered" value={suggestions.delivered} />
        </div>
      </SectionCard>

    </div>
  );
}
