/**
 * Asana Section Breakdown Widget
 *
 * Donut-style visualization showing task distribution across board sections.
 */

'use client';

import type { AsanaSectionBreakdownEntry } from '@/types/asana-tasks';

const SECTION_COLORS: Record<string, string> = {
  'Done': '#22c55e',
  'In progress': '#3b82f6',
  'To do': '#eab308',
  'Open': '#eab308',
  'Backlog': '#94a3b8',
  'Projects': '#a855f7',
};

function getColor(section: string, index: number): string {
  return SECTION_COLORS[section] || ['#06b6d4', '#f97316', '#ec4899', '#8b5cf6'][index % 4];
}

interface AsanaSectionBreakdownWidgetProps {
  data: AsanaSectionBreakdownEntry[];
}

export function AsanaSectionBreakdownWidget({ data }: AsanaSectionBreakdownWidgetProps) {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-content-tertiary text-sm">
        No section data available
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Build SVG donut segments
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = data.map((entry, i) => {
    const pct = entry.count / total;
    const dashLength = pct * circumference;
    const seg = {
      color: getColor(entry.section, i),
      dasharray: `${dashLength} ${circumference - dashLength}`,
      dashoffset: -offset,
      section: entry.section,
      count: entry.count,
      pct,
    };
    offset += dashLength;
    return seg;
  });

  return (
    <div className="h-full flex items-center justify-center gap-6 px-4">
      {/* Donut */}
      <div className="relative flex-shrink-0">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.dashoffset}
              transform="rotate(-90 80 80)"
              className="transition-all duration-300"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-content-primary tabular-nums">{total}</div>
            <div className="text-xs text-content-tertiary">tasks</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-sm text-content-primary">{seg.section}</span>
            <span className="text-xs text-content-tertiary tabular-nums ml-auto pl-2">
              {seg.count} ({(seg.pct * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
