/**
 * Rapid Response System Status Widget
 *
 * Standalone AxisCallout rendered above the widget grid (not inside a widget card).
 * Shows system health: healthy, warning, critical, or awaiting-data.
 */

'use client';

import { AxisCallout } from '@/components/axis';
import type { RrSystemStatus } from '@/types/rapid-response';

interface RrSystemStatusWidgetProps {
  data: RrSystemStatus;
}

const statusMap = {
  healthy: 'success' as const,
  warning: 'alert' as const,
  critical: 'error' as const,
  'awaiting-data': 'info' as const,
};

function formatSyncTime(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return 'Unknown';
  }
}

export function RrSystemStatusWidget({ data }: RrSystemStatusWidgetProps) {
  return (
    <AxisCallout type={statusMap[data.level]} title={data.headline}>
      <div className="flex items-center gap-3 flex-wrap">
        <span>{data.detail}</span>
        <span className="text-label" style={{ color: 'inherit', opacity: 0.8 }}>
          Last sync: {formatSyncTime(data.lastSyncAt)}
        </span>
      </div>
    </AxisCallout>
  );
}
