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

import { MetricCard, TrendData } from '@/components/workspace/MetricCard';

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

export function EventMetricsWidget({ data }: EventMetricsWidgetProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full h-full">
      <MetricCard
        label="Events/Session"
        value={data.events_per_session.toFixed(1)}
        subtitle={`${data.total_sessions.toLocaleString()} sessions`}
        trend={data.trends?.events_per_session}
        icon={<EventsPerSessionIcon />}
        iconBgClass={colorMap['blue'].bg}
        sparklineColor={colorMap['blue'].stroke}
      />
      <MetricCard
        label="Form Conversion"
        value={`${data.form_conversion_rate.toFixed(1)}%`}
        subtitle={`${data.form_submits.toLocaleString()} / ${data.form_starts.toLocaleString()}`}
        trend={data.trends?.form_conversion_rate}
        icon={<FormConversionIcon />}
        iconBgClass={colorMap['green'].bg}
        sparklineColor={colorMap['green'].stroke}
      />
      <MetricCard
        label="Total Events"
        value={data.total_events}
        subtitle={`${data.clicks.toLocaleString()} clicks`}
        trend={data.trends?.total_events}
        icon={<TotalEventsIcon />}
        iconBgClass={colorMap['purple'].bg}
        sparklineColor={colorMap['purple'].stroke}
      />
      <MetricCard
        label="Form Starts"
        value={data.form_starts}
        subtitle={`${data.scrolls.toLocaleString()} scrolls`}
        icon={<FormStartsIcon />}
        iconBgClass={colorMap['orange'].bg}
        sparklineColor={colorMap['orange'].stroke}
      />
    </div>
  );
}
