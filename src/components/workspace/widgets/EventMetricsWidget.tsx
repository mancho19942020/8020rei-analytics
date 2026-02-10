/**
 * Event Metrics Widget
 *
 * Displays key event metrics in a card layout:
 * - Events per Session
 * - Form Conversion Rate
 * - Total Events
 * - Form Starts
 */

'use client';

import { useMemo } from 'react';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface EventMetricsData {
  total_events: number;
  total_sessions: number;
  events_per_session: number;
  form_starts: number;
  form_submits: number;
  form_conversion_rate: number;
  clicks: number;
  scrolls: number;
  trends?: {
    events_per_session: TrendData;
    form_conversion_rate: TrendData;
    total_events: TrendData;
  };
}

interface EventMetricsWidgetProps {
  data: EventMetricsData;
}

// Mini Sparkline component
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
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Trend Badge component
function TrendBadge({ trend }: { trend: TrendData }) {
  const { value, isPositive } = trend;

  if (value === 0) return null;

  return (
    <div className={[
      'flex items-center gap-0.5 text-xs font-medium',
      isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    ].join(' ')}>
      {isPositive ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      <span>{value.toFixed(1)}%</span>
    </div>
  );
}

// Icons
const EventsPerSessionIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const FormConversionIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TotalEventsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FormStartsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

interface MetricCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  trend?: TrendData;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function MetricCard({ label, value, subLabel, trend, icon, color }: MetricCardProps) {
  // Generate mock sparkline data based on trend
  const chartData = useMemo(() => {
    const baseValue = typeof value === 'number' ? value : parseFloat(String(value)) || 100;
    const trendDirection = trend?.isPositive ? 1 : -1;
    return Array.from({ length: 7 }, (_, i) =>
      baseValue * 0.8 + (Math.random() * baseValue * 0.2) + (trendDirection * baseValue * 0.2 * (i / 6))
    );
  }, [value, trend]);

  const colorMap = {
    blue: {
      bg: 'bg-blue-600 dark:bg-blue-700',
      stroke: 'rgb(59, 130, 246)',
    },
    green: {
      bg: 'bg-green-600 dark:bg-green-700',
      stroke: 'rgb(34, 197, 94)',
    },
    purple: {
      bg: 'bg-purple-600 dark:bg-purple-700',
      stroke: 'rgb(139, 92, 246)',
    },
    orange: {
      bg: 'bg-orange-600 dark:bg-orange-700',
      stroke: 'rgb(249, 115, 22)',
    },
  };

  return (
    <div className="flex flex-col p-3 bg-surface-raised rounded-xl border border-stroke hover:border-stroke-strong hover:shadow-sm transition-all duration-200 h-full">
      {/* Header: Icon + Label */}
      <div className="flex items-center gap-2 mb-1">
        <div className={`flex-shrink-0 w-6 h-6 rounded-md ${colorMap[color].bg} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-content-secondary truncate">{label}</span>
      </div>

      {/* Main Value */}
      <div className="text-2xl font-bold text-content-primary tabular-nums flex-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {/* Footer: Trend + SubLabel + Sparkline */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          {trend && <TrendBadge trend={trend} />}
          {subLabel && <span className="text-xs text-content-tertiary">{subLabel}</span>}
        </div>
        <MiniSparkline data={chartData} color={colorMap[color].stroke} />
      </div>
    </div>
  );
}

export function EventMetricsWidget({ data }: EventMetricsWidgetProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full h-full">
      <MetricCard
        label="Events/Session"
        value={data.events_per_session.toFixed(1)}
        subLabel={`${data.total_sessions.toLocaleString()} sessions`}
        trend={data.trends?.events_per_session}
        icon={<EventsPerSessionIcon />}
        color="blue"
      />
      <MetricCard
        label="Form Conversion"
        value={`${data.form_conversion_rate.toFixed(1)}%`}
        subLabel={`${data.form_submits.toLocaleString()} / ${data.form_starts.toLocaleString()}`}
        trend={data.trends?.form_conversion_rate}
        icon={<FormConversionIcon />}
        color="green"
      />
      <MetricCard
        label="Total Events"
        value={data.total_events}
        subLabel={`${data.clicks.toLocaleString()} clicks`}
        trend={data.trends?.total_events}
        icon={<TotalEventsIcon />}
        color="purple"
      />
      <MetricCard
        label="Form Starts"
        value={data.form_starts}
        subLabel={`${data.scrolls.toLocaleString()} scrolls`}
        icon={<FormStartsIcon />}
        color="orange"
      />
    </div>
  );
}
