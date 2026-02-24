/**
 * Domain Activity Overview Widget
 *
 * Displays KPI cards for domain activity: active domains, properties,
 * leads, appointments, deals, and revenue with trend indicators.
 */

'use client';

import { MetricCard } from '@/components/workspace/MetricCard';
import type { DomainActivityOverview, TrendData } from '@/types/product';

const colorMap = {
  main: { bg: 'bg-main-600 dark:bg-main-700', stroke: 'rgb(29, 78, 216)' },
  'accent-1': { bg: 'bg-accent-1-600 dark:bg-accent-1-700', stroke: 'rgb(59, 130, 246)' },
  'accent-2': { bg: 'bg-accent-2-600 dark:bg-accent-2-700', stroke: 'rgb(99, 102, 241)' },
  'accent-3': { bg: 'bg-accent-3-600 dark:bg-accent-3-700', stroke: 'rgb(168, 85, 247)' },
};

const GlobeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const LayersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const UserPlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DollarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface DomainActivityOverviewWidgetProps {
  data: DomainActivityOverview;
}

export function DomainActivityOverviewWidget({ data }: DomainActivityOverviewWidgetProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full h-full">
      <MetricCard label="Active Domains" value={data.total_active_domains} icon={<GlobeIcon />} subtitle="vs. previous period" iconBgClass={colorMap['main'].bg} sparklineColor={colorMap['main'].stroke} trend={data.trends?.total_active_domains} />
      <MetricCard label="Total Properties" value={data.total_properties} icon={<LayersIcon />} subtitle="vs. previous period" iconBgClass={colorMap['accent-1'].bg} sparklineColor={colorMap['accent-1'].stroke} trend={data.trends?.total_properties} />
      <MetricCard label="Leads" value={data.leads_count} icon={<UserPlusIcon />} subtitle="vs. previous period" iconBgClass={colorMap['accent-2'].bg} sparklineColor={colorMap['accent-2'].stroke} trend={data.trends?.leads_count} />
      <MetricCard label="Appointments" value={data.appointments_count} icon={<CalendarIcon />} subtitle="current period" iconBgClass={colorMap['accent-3'].bg} sparklineColor={colorMap['accent-3'].stroke} />
      <MetricCard label="Deals" value={data.deals_count} icon={<CheckCircleIcon />} subtitle="current period" iconBgClass={colorMap['main'].bg} sparklineColor={colorMap['main'].stroke} />
      <MetricCard label="Revenue" value={data.total_revenue} icon={<DollarIcon />} subtitle="vs. previous period" iconBgClass={colorMap['accent-1'].bg} sparklineColor={colorMap['accent-1'].stroke} trend={data.trends?.total_revenue} format="currency" />
    </div>
  );
}
