'use client';

import { useState, useEffect, useCallback } from 'react';
import { AxisSkeleton, AxisCallout, AxisInput } from '@/components/axis';
import { AxisTable } from '@/components/axis';
import { AxisNavigationTab } from '@/components/axis/AxisNavigationTab';
import { BaseStackedBarChart } from '@/components/charts';
import type { StackedBarDataPoint, StackedBarSeries } from '@/components/charts';
import { authFetch } from '@/lib/auth-fetch';
import type { Column } from '@/types/table';

// ─── Pricing constants (display only) ────────────────────────────────────────
const PRICE_PER_HIT   = 0.08;
const COST_DS         = 0.03;
const COMMITMENT_TOTAL = 500_000;

// ─── Inner tabs ───────────────────────────────────────────────────────────────
const SKIPTRACE_TABS = [
  { id: 'overview', name: 'Overview' },
  { id: 'batch',    name: 'Batch' },
  { id: 'clients',  name: 'Clients' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function fmtN(n: number): string {
  return n.toLocaleString('en-US');
}
function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accent,
}: {
  label: string; value: string | number; sub?: string;
  accent?: 'success' | 'error' | 'alert' | 'neutral';
}) {
  const colors: Record<string, string> = {
    success: 'text-success-700 dark:text-success-300',
    error:   'text-error-700 dark:text-error-300',
    alert:   'text-alert-700 dark:text-alert-300',
    neutral: 'text-content-primary',
  };
  return (
    <div className="bg-surface-raised rounded-lg px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-content-tertiary">{label}</span>
      <span className={`text-2xl font-semibold leading-none ${accent ? colors[accent] : 'text-content-primary'}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-content-secondary mt-0.5">{sub}</span>}
    </div>
  );
}

function SectionCard({
  title, accent, children,
}: {
  title: string; accent: 'main' | 'success' | 'info' | 'alert' | 'error'; children: React.ReactNode;
}) {
  return (
    <section className="bg-surface-base shadow-xs rounded-lg p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide mb-4 text-content-secondary">
        {title}
      </h2>
      {children}
    </section>
  );
}

function CommitmentBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min((used / total) * 100, 100);
  const color = pct >= 80 ? 'bg-success-500' : pct >= 40 ? 'bg-main-500' : 'bg-alert-500';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-content-primary">{fmtN(used)} hits used</span>
        <span className="text-content-secondary">{fmtN(total)} commitment</span>
      </div>
      <div className="h-3 w-full bg-surface-raised rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-content-tertiary">
        <span>{fmtPct(pct)} complete</span>
        <span>{fmtN(total - used)} remaining</span>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReconRow {
  month: string; label: string;
  inv_requests: number | null;
  inv_amount: number | null;
  db_hits: number;
  delta: number | null;
  match_pct: number | null;
}

interface MonthRow {
  month: string; label: string;
  directskip_hits: number; batchleads_hits: number; cache_hits: number;
  total_properties: number; active_clients: number;
  revenue: number; cost: number; margin: number;
}
interface ClientRow {
  domain: string;
  directskip_hits: number; batchleads_hits: number; cache_hits: number;
  total_properties: number;
  revenue: number; cost: number; margin: number;
  last_active: string; months_active: number;
}
interface SkiptraceData {
  commitment: {
    used_hits: number; total: number; pct: number;
    monthly_target: number; projected_total: number;
    days_elapsed: number; days_remaining: number; on_track: boolean;
  };
  financials: {
    total_revenue: number; cost_directskip: number; gross_margin: number; margin_pct: number;
    directskip_hits: number; batchleads_hits: number; cache_hits: number; total_properties: number;
  };
  by_month: MonthRow[];
  by_client: ClientRow[];
  active_clients_this_month: number;
  reconciliation: ReconRow[];
  recon_summary: {
    total_inv_requests: number; total_inv_cost: number;
    total_db_hits: number; overall_match_pct: number | null;
  };
  as_of: string;
}

// ─── Table columns ────────────────────────────────────────────────────────────

const CLIENT_COLUMNS: Column[] = [
  { field: 'domain',           header: 'Client',        type: 'text',     width: 200, sortable: true },
  { field: 'directskip_hits',  header: 'DS hits',       type: 'number',   width: 90,  sortable: true },
  { field: 'batchleads_hits',  header: 'BL hits',       type: 'number',   width: 90,  sortable: true },
  { field: 'cache_hits',       header: 'Cache hits',    type: 'number',   width: 90,  sortable: true },
  { field: 'total_properties', header: 'Properties',    type: 'number',   width: 100, sortable: true },
  { field: 'revenue',          header: 'Revenue',       type: 'currency', width: 100, sortable: true },
  { field: 'cost',             header: 'Cost (DS)',     type: 'currency', width: 100, sortable: true },
  { field: 'margin',           header: 'Margin',        type: 'currency', width: 100, sortable: true },
  { field: 'last_active',      header: 'Last active',   type: 'date',     width: 110, sortable: true },
  { field: 'months_active',    header: 'Months active', type: 'number',   width: 110, sortable: true },
];

const RECON_COLUMNS: Column[] = [
  { field: 'label',        header: 'Month',              type: 'text',     width: 90,  sortable: true },
  { field: 'inv_requests', header: 'Invoice requests',   type: 'number',   width: 150, sortable: true },
  { field: 'db_hits',      header: 'DB hits (BatchLeads)', type: 'number', width: 150, sortable: true },
  { field: 'delta',        header: 'Delta (DB − inv)',   type: 'number',   width: 140, sortable: true },
  { field: 'match_pct',    header: 'Match %',            type: 'number',   width: 90,  sortable: true },
  { field: 'inv_amount',   header: 'Invoice cost',       type: 'currency', width: 120, sortable: true },
];

const HITS_SERIES: StackedBarSeries[] = [
  { dataKey: 'directskip_hits', name: 'DirectSkip',  color: '#3b82f6' },
  { dataKey: 'batchleads_hits', name: 'BatchLeads',  color: '#8b5cf6' },
];

const FINANCIAL_SERIES: StackedBarSeries[] = [
  { dataKey: 'revenue', name: 'Revenue', color: '#22c55e' },
  { dataKey: 'cost',    name: 'Cost',    color: '#f59e0b' },
];

const ADOPTION_SERIES: StackedBarSeries[] = [
  { dataKey: 'active_clients', name: 'Active clients', color: '#06b6d4' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function SkiptraceTab() {
  const [data, setData]             = useState<SkiptraceData | null>(null);
  const [totalDomains, setTotalDomains] = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [skipRes, domainsRes] = await Promise.all([
        authFetch('/api/metrics/skiptrace'),
        authFetch('/api/metrics/product-domains?days=365'),
      ]);
      const skipJson    = await skipRes.json();
      const domainsJson = await domainsRes.json();
      if (!skipJson.success) throw new Error(skipJson.error || 'Failed to load skiptrace data');
      setData(skipJson.data);
      if (domainsJson.success) {
        setTotalDomains(domainsJson.data.overview.total_active_domains ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="flex-shrink-0 px-6 border-b border-stroke chrome-bg h-9" />
        <div className="p-6 flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-base shadow-xs rounded-lg p-5">
              <div className="mb-4"><AxisSkeleton width="40%" height="16px" /></div>
              <div className="grid grid-cols-4 gap-3">
                {[1,2,3,4].map((j) => <AxisSkeleton key={j} height="72px" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <AxisCallout type="error" title="Failed to load skiptrace data">
          {error ?? 'Unknown error'}
        </AxisCallout>
      </div>
    );
  }

  const { commitment, financials, by_month, by_client, active_clients_this_month, reconciliation, recon_summary } = data;

  const hitsChartData: StackedBarDataPoint[] = by_month.map((m) => ({
    label: m.label,
    directskip_hits: m.directskip_hits,
    batchleads_hits: m.batchleads_hits,
  }));

  const financialChartData: StackedBarDataPoint[] = by_month.map((m) => ({
    label: m.label,
    revenue: Math.round(m.revenue),
    cost:    Math.round(m.cost),
  }));

  const adoptionChartData: StackedBarDataPoint[] = by_month.map((m) => ({
    label: m.label,
    active_clients: m.active_clients,
  }));

  const filteredClients = search.trim()
    ? by_client.filter((c) => c.domain.toLowerCase().includes(search.toLowerCase()))
    : by_client;

  const cache_rate = financials.total_properties > 0
    ? (financials.cache_hits / financials.total_properties) * 100
    : 0;

  const skiptraceClientCount = by_client.length;
  const adoptionRate = totalDomains && totalDomains > 0
    ? (skiptraceClientCount / totalDomains) * 100
    : null;
  const nonAdopters = totalDomains ? Math.max(0, totalDomains - skiptraceClientCount) : null;

  return (
    <div className="flex flex-col">

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <nav className="flex-shrink-0 px-6 border-b border-stroke chrome-bg">
        <AxisNavigationTab
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={SKIPTRACE_TABS}
          variant="line"
          size="sm"
        />
      </nav>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6 p-6">

          {/* Commitment */}
          <SectionCard title="DirectSkip commitment — February – July 2026" accent="main">
            <div className="flex flex-col gap-6">
              <CommitmentBar used={commitment.used_hits} total={COMMITMENT_TOTAL} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard
                  label="Hits used"
                  value={fmtN(commitment.used_hits)}
                  sub={`of ${fmtN(COMMITMENT_TOTAL)}`}
                />
                <KpiCard
                  label="Avg monthly hits"
                  value={fmtN(Math.round(commitment.used_hits / Math.max(1, Math.ceil(commitment.days_elapsed / 30))))}
                  sub={`target: ${fmtN(commitment.monthly_target)}`}
                  accent={commitment.on_track ? 'success' : 'alert'}
                />
                <KpiCard
                  label="Projected total"
                  value={fmtN(commitment.projected_total)}
                  sub={commitment.on_track ? 'On track' : 'Below pace'}
                  accent={commitment.projected_total >= COMMITMENT_TOTAL ? 'success' : 'error'}
                />
                <KpiCard
                  label="Days remaining"
                  value={commitment.days_remaining}
                  sub="in commitment period"
                  accent="neutral"
                />
              </div>
              <div>
                <p className="text-xs text-content-tertiary mb-3">DirectSkip hits by month</p>
                <div className="h-[200px]">
                  <BaseStackedBarChart data={hitsChartData} series={HITS_SERIES} showLegend />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Revenue & margin */}
          <SectionCard title="Revenue & margin" accent="success">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                <KpiCard
                  label="Total revenue"
                  value={fmt$(financials.total_revenue)}
                  sub={`${fmtN(financials.directskip_hits + financials.batchleads_hits)} hits × $${PRICE_PER_HIT}`}
                  accent="success"
                />
                <KpiCard
                  label="DirectSkip cost"
                  value={fmt$(financials.cost_directskip)}
                  sub={`${fmtN(financials.directskip_hits)} DS hits × $${COST_DS}`}
                  accent="neutral"
                />
                <KpiCard
                  label="Total batch consumption"
                  value={fmtN(financials.batchleads_hits)}
                  sub="BatchLeads hits (all time)"
                  accent="neutral"
                />
                <KpiCard
                  label="Gross margin"
                  value={fmt$(financials.gross_margin)}
                  accent={financials.gross_margin >= 0 ? 'success' : 'error'}
                />
                <KpiCard
                  label="Margin %"
                  value={fmtPct(financials.margin_pct)}
                  accent={financials.margin_pct >= 50 ? 'success' : 'alert'}
                />
              </div>
              <div>
                <p className="text-xs text-content-tertiary mb-3">Revenue vs cost by month</p>
                <div className="h-[200px]">
                  <BaseStackedBarChart data={financialChartData} series={FINANCIAL_SERIES} showLegend />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Client adoption */}
          <SectionCard title="Client adoption" accent="info">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard
                  label="Clients using skiptrace"
                  value={skiptraceClientCount}
                  sub="since February 1, 2026"
                  accent="neutral"
                />
                <KpiCard
                  label="Total active clients"
                  value={totalDomains ?? '—'}
                  sub="domains with activity (last 12 mo)"
                  accent="neutral"
                />
                <KpiCard
                  label="Adoption rate"
                  value={adoptionRate !== null ? fmtPct(adoptionRate) : '—'}
                  sub="of active clients using skiptrace"
                  accent={adoptionRate !== null ? (adoptionRate >= 50 ? 'success' : adoptionRate >= 25 ? 'alert' : 'error') : 'neutral'}
                />
                <KpiCard
                  label="Active clients this month"
                  value={active_clients_this_month}
                  sub="≥ 1 request in current month"
                  accent="neutral"
                />
              </div>
              {adoptionRate !== null && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-content-tertiary">
                    <span>{skiptraceClientCount} using skiptrace</span>
                    <span>{nonAdopters} not adopted</span>
                  </div>
                  <div className="h-2 w-full bg-surface-raised rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-info-500"
                      style={{ width: `${Math.min(adoptionRate, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-content-tertiary mb-3">Active clients by month</p>
                <div className="h-[180px]">
                  <BaseStackedBarChart data={adoptionChartData} series={ADOPTION_SERIES} showLegend={false} />
                </div>
              </div>
            </div>
          </SectionCard>

        </div>
      )}

      {/* ── Batch ─────────────────────────────────────────────────────────── */}
      {activeTab === 'batch' && (
        <div className="flex flex-col gap-6 p-6">
          <SectionCard title="BatchLeads reconciliation — invoice vs DB" accent="alert">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard
                  label="Total invoiced (all time)"
                  value={fmtN(recon_summary.total_inv_requests)}
                  sub="Skip Tracing requests billed"
                  accent="neutral"
                />
                <KpiCard
                  label="Total DB hits (all time)"
                  value={fmtN(recon_summary.total_db_hits)}
                  sub="BatchLeads hits in DynamoDB"
                  accent="neutral"
                />
                <KpiCard
                  label="Overall match"
                  value={recon_summary.overall_match_pct !== null ? fmtPct(recon_summary.overall_match_pct) : '—'}
                  sub="DB hits / invoice requests"
                  accent={
                    recon_summary.overall_match_pct === null ? 'neutral'
                    : recon_summary.overall_match_pct >= 90 ? 'success'
                    : recon_summary.overall_match_pct >= 70 ? 'alert'
                    : 'error'
                  }
                />
                <KpiCard
                  label="Total invoice cost"
                  value={fmt$(recon_summary.total_inv_cost)}
                  sub="sum of all BatchData bills"
                  accent="neutral"
                />
              </div>
              <div>
                <p className="text-xs text-content-tertiary mb-1 px-1">
                  Delta = DB hits minus invoice requests. Negative means we paid for more than we logged.
                </p>
                <div className="h-[380px]">
                  <AxisTable
                    columns={RECON_COLUMNS}
                    data={reconciliation.map((r) => ({
                      ...r,
                      inv_requests: r.inv_requests ?? 0,
                      inv_amount:   r.inv_amount ?? 0,
                      delta:        r.delta ?? 0,
                      match_pct:    r.match_pct ?? 0,
                    })) as unknown as Record<string, unknown>[]}
                    rowKey="month"
                    sortable
                    paginated
                    defaultPageSize={15}
                    rowLabel="months"
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Clients ───────────────────────────────────────────────────────── */}
      {activeTab === 'clients' && (
        <div className="flex flex-col gap-6 p-6">
          <SectionCard title="Usage by client" accent="main">
            <div className="flex flex-col gap-3">
              <AxisInput
                type="search"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="sm"
                fullWidth
              />
              {search.trim() && (
                <p className="text-xs text-content-tertiary px-1">
                  {filteredClients.length} of {by_client.length} clients
                </p>
              )}
              <div className="h-[420px]">
                <AxisTable
                  columns={CLIENT_COLUMNS}
                  data={filteredClients as unknown as Record<string, unknown>[]}
                  rowKey="domain"
                  sortable
                  paginated
                  defaultPageSize={10}
                  rowLabel="clients"
                />
              </div>
            </div>
          </SectionCard>
        </div>
      )}

    </div>
  );
}
