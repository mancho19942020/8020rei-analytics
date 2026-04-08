/**
 * Asana Task Aging Widget
 *
 * Vertical bar chart showing open task age distribution.
 * Board health indicator — older tasks suggest stalled work.
 */

'use client';

import type { AsanaTaskAgingEntry } from '@/types/asana-tasks';

const BUCKET_COLORS: Record<string, string> = {
  '0-7 days': '#22c55e',
  '8-14 days': '#3b82f6',
  '15-30 days': '#eab308',
  '31-60 days': '#f97316',
  '60+ days': '#ef4444',
};

interface AsanaTaskAgingWidgetProps {
  data: AsanaTaskAgingEntry[];
}

export function AsanaTaskAgingWidget({ data }: AsanaTaskAgingWidgetProps) {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-content-tertiary text-sm">
        No aging data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="h-full flex flex-col px-3">
      <div className="text-xs text-content-tertiary mb-3 flex-shrink-0">
        {total} open tasks by age
      </div>

      <div className="flex-1 flex items-end gap-3 pb-1">
        {data.map((entry) => {
          const heightPct = (entry.count / maxCount) * 100;
          const color = BUCKET_COLORS[entry.bucket] || '#94a3b8';

          return (
            <div key={entry.bucket} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-content-primary tabular-nums">
                {entry.count}
              </span>
              <div className="w-full relative" style={{ height: '120px' }}>
                <div
                  className="absolute bottom-0 w-full rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span className="text-[10px] text-content-tertiary text-center leading-tight">
                {entry.bucket}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
