/**
 * Auto Export Overview Widget
 *
 * Four KPI cards for the Auto Export tab. Mirrors ApiOverviewWidget layout
 * (edge-to-edge MetricCards via flushBody). Values come from the overview
 * endpoint at /api/auto-export?type=overview.
 */

'use client';

import { MetricCard } from '@/components/workspace/MetricCard';
import type { AutoExportOverview } from '@/types/auto-export';

interface AutoExportOverviewWidgetProps {
  data: AutoExportOverview;
}

const colorMap = {
  main: 'bg-main-700',
  'accent-1': 'bg-accent-1-700',
  'accent-2': 'bg-accent-2-700',
  'accent-3': 'bg-accent-3-700',
};

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export function AutoExportOverviewWidget({ data }: AutoExportOverviewWidgetProps) {
  return (
    <div className="flex w-full h-full flush-cards">
      <MetricCard
        label="Active clients"
        value={data.activeClients}
        icon={<UsersIcon />}
        subtitle="vs. same day 30d ago"
        iconBgClass={colorMap.main}
        trend={data.trends?.activeClients}
      />
      <MetricCard
        label="Total runs"
        value={data.totalRuns}
        icon={<SendIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['accent-1']}
        trend={data.trends?.totalRuns}
      />
      <MetricCard
        label="Success rate"
        value={`${(data.successRate * 100).toFixed(1)}%`}
        icon={<CheckIcon />}
        subtitle="Sent / total runs"
        iconBgClass={colorMap['accent-2']}
        trend={data.trends?.successRate}
      />
      <MetricCard
        label="Properties exported"
        value={data.propertiesExported}
        icon={<DocIcon />}
        subtitle="vs. previous period"
        iconBgClass={colorMap['accent-3']}
        trend={data.trends?.propertiesExported}
      />
    </div>
  );
}
