/**
 * Device Category Widget
 *
 * Displays device category distribution (desktop, mobile, tablet)
 * using metric cards similar to User Activity widget.
 * Shows 2 cards side by side for Desktop and Mobile users.
 */

'use client';

import { useMemo } from 'react';

interface TrendData {
  value: number;
  isPositive: boolean;
}

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

interface DeviceCardProps {
  label: string;
  users: number;
  percentage: number;
  trend?: TrendData;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange';
}

function DeviceCard({ label, users, percentage, trend, icon, color }: DeviceCardProps) {
  // Generate mock sparkline data based on trend
  const chartData = useMemo(() => {
    const baseValue = users * 0.8;
    const trendDirection = trend?.isPositive ? 1 : -1;
    return Array.from({ length: 7 }, (_, i) =>
      baseValue + (Math.random() * users * 0.2) + (trendDirection * users * 0.2 * (i / 6))
    );
  }, [users, trend]);

  const colorMap = {
    blue: {
      bg: 'bg-blue-600 dark:bg-blue-700',
      stroke: 'rgb(59, 130, 246)',
    },
    green: {
      bg: 'bg-green-600 dark:bg-green-700',
      stroke: 'rgb(34, 197, 94)',
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
        {users?.toLocaleString() ?? 0}
      </div>

      {/* Footer: Trend + Percentage + Sparkline */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          {trend && <TrendBadge trend={trend} />}
          <span className="text-xs text-content-tertiary">{percentage.toFixed(1)}% of total</span>
        </div>
        <MiniSparkline data={chartData} color={colorMap[color].stroke} />
      </div>
    </div>
  );
}

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
    <div className="flex flex-col gap-3 w-full h-full">
      {/* Desktop */}
      {desktop && (
        <DeviceCard
          label="Desktop Users"
          users={desktop.users}
          percentage={desktopPercentage}
          trend={desktop.trend}
          icon={<DesktopIcon />}
          color="blue"
        />
      )}

      {/* Mobile */}
      {mobile && (
        <DeviceCard
          label="Mobile Users"
          users={mobile.users}
          percentage={mobilePercentage}
          trend={mobile.trend}
          icon={<MobileIcon />}
          color="green"
        />
      )}

      {/* Tablet (only if exists) */}
      {hasTablet && (
        <DeviceCard
          label="Tablet Users"
          users={tablet.users}
          percentage={tabletPercentage}
          trend={tablet.trend}
          icon={<TabletIcon />}
          color="orange"
        />
      )}
    </div>
  );
}
