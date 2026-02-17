/**
 * Domain Activity Overview Widget
 *
 * Displays KPI cards for domain activity: active domains, properties,
 * leads, appointments, deals, and revenue with trend indicators.
 */

'use client';

import { ReactNode, useMemo } from 'react';
import type { DomainActivityOverview, TrendData } from '@/types/product';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  subtitle?: string;
  color?: 'main' | 'accent-1' | 'accent-2' | 'accent-3';
  trend?: TrendData;
  format?: 'number' | 'currency';
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 48;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function TrendBadge({ trend }: { trend: TrendData }) {
  const { value, isPositive } = trend;
  if (value === 0) return null;
  return (
    <div className={['flex items-center gap-0.5 text-xs font-medium', isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
      {isPositive ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
      )}
      <span>{value.toFixed(1)}%</span>
    </div>
  );
}

function MetricCard({ label, value, icon, subtitle, color = 'main', trend, format = 'number' }: MetricCardProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  const chartData = useMemo(() => {
    const baseValue = numValue * 0.8;
    const trendDirection = trend?.isPositive ? 1 : -1;
    return Array.from({ length: 7 }, (_, i) =>
      baseValue + (Math.random() * numValue * 0.2) + (trendDirection * numValue * 0.2 * (i / 6))
    );
  }, [numValue, trend]);

  const colorMap = {
    main: { bg: 'bg-main-600 dark:bg-main-700', stroke: 'rgb(29, 78, 216)' },
    'accent-1': { bg: 'bg-accent-1-600 dark:bg-accent-1-700', stroke: 'rgb(59, 130, 246)' },
    'accent-2': { bg: 'bg-accent-2-600 dark:bg-accent-2-700', stroke: 'rgb(99, 102, 241)' },
    'accent-3': { bg: 'bg-accent-3-600 dark:bg-accent-3-700', stroke: 'rgb(168, 85, 247)' },
  };

  const displayValue = format === 'currency'
    ? `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : numValue.toLocaleString();

  return (
    <div className="flex flex-col p-3 bg-surface-raised rounded-xl border border-stroke hover:border-stroke-strong hover:shadow-sm transition-all duration-200 h-full">
      <div className="flex items-center gap-2 mb-1">
        <div className={`flex-shrink-0 w-6 h-6 rounded-md ${colorMap[color].bg} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-content-secondary truncate">{label}</span>
      </div>
      <div className="text-2xl font-bold text-content-primary tabular-nums flex-1">
        {displayValue}
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          {trend && <TrendBadge trend={trend} />}
          {subtitle && <span className="text-xs text-content-tertiary">{subtitle}</span>}
        </div>
        <MiniSparkline data={chartData} color={colorMap[color].stroke} />
      </div>
    </div>
  );
}

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
      <MetricCard label="Active Domains" value={data.total_active_domains} icon={<GlobeIcon />} subtitle="vs. previous period" color="main" trend={data.trends?.total_active_domains} />
      <MetricCard label="Total Properties" value={data.total_properties} icon={<LayersIcon />} subtitle="vs. previous period" color="accent-1" trend={data.trends?.total_properties} />
      <MetricCard label="Leads" value={data.leads_count} icon={<UserPlusIcon />} subtitle="vs. previous period" color="accent-2" trend={data.trends?.leads_count} />
      <MetricCard label="Appointments" value={data.appointments_count} icon={<CalendarIcon />} subtitle="current period" color="accent-3" />
      <MetricCard label="Deals" value={data.deals_count} icon={<CheckCircleIcon />} subtitle="current period" color="main" />
      <MetricCard label="Revenue" value={data.total_revenue} icon={<DollarIcon />} subtitle="vs. previous period" color="accent-1" trend={data.trends?.total_revenue} format="currency" />
    </div>
  );
}
