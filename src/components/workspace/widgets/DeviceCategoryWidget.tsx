/**
 * Device Category Widget
 *
 * Displays device category distribution (desktop, mobile, tablet)
 * using metric cards similar to User Activity widget.
 * Shows 2 cards side by side for Desktop and Mobile users.
 */

'use client';

import { MetricCard, TrendData } from '@/components/workspace/MetricCard';

const colorMap = {
  blue: {
    bg: 'bg-main-700',
    stroke: 'var(--color-main-500)',
  },
  green: {
    bg: 'bg-success-700',
    stroke: 'var(--color-success-500)',
  },
  orange: {
    bg: 'bg-alert-700',
    stroke: 'var(--color-alert-500)',
  },
};

interface DeviceCategoryData {
  device_category: string;
  users: number;
  events: number;
  percentage?: number;
  trend?: TrendData;
}

interface DeviceCategoryWidgetProps {
  data: DeviceCategoryData[];
}

// Device icons as SVG components
const DesktopIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const MobileIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const TabletIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

export function DeviceCategoryWidget({ data }: DeviceCategoryWidgetProps) {
  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.users, 0);

  // Find desktop and mobile data
  const desktop = data.find((d) => d.device_category?.toLowerCase() === 'desktop');
  const mobile = data.find((d) => d.device_category?.toLowerCase() === 'mobile');
  const tablet = data.find((d) => d.device_category?.toLowerCase() === 'tablet');

  // Calculate percentages
  const desktopPercentage = desktop && total > 0 ? (desktop.users / total) * 100 : 0;
  const mobilePercentage = mobile && total > 0 ? (mobile.users / total) * 100 : 0;
  const tabletPercentage = tablet && total > 0 ? (tablet.users / total) * 100 : 0;

  // If we have tablet, show 3 cards; otherwise show 2
  const hasTablet = tablet && tablet.users > 0;

  return (
    <div className="flex flex-col w-full h-full flush-cards-vertical">
      {/* Desktop */}
      {desktop && (
        <MetricCard
          label="Desktop Users"
          value={desktop.users}
          icon={<DesktopIcon />}
          subtitle={`${desktopPercentage.toFixed(1)}% of total`}
          iconBgClass={colorMap['blue'].bg}
          sparklineColor={colorMap['blue'].stroke}
          trend={desktop.trend}
        />
      )}

      {/* Mobile */}
      {mobile && (
        <MetricCard
          label="Mobile Users"
          value={mobile.users}
          icon={<MobileIcon />}
          subtitle={`${mobilePercentage.toFixed(1)}% of total`}
          iconBgClass={colorMap['green'].bg}
          sparklineColor={colorMap['green'].stroke}
          trend={mobile.trend}
        />
      )}

      {/* Tablet (only if exists) */}
      {hasTablet && (
        <MetricCard
          label="Tablet Users"
          value={tablet.users}
          icon={<TabletIcon />}
          subtitle={`${tabletPercentage.toFixed(1)}% of total`}
          iconBgClass={colorMap['orange'].bg}
          sparklineColor={colorMap['orange'].stroke}
          trend={tablet.trend}
        />
      )}
    </div>
  );
}
