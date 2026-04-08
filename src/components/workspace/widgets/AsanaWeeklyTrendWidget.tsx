/**
 * Asana Weekly Trend Widget
 *
 * Dual-line chart showing tasks created vs completed per week.
 */

'use client';

import type { AsanaWeeklyTrendEntry } from '@/types/asana-tasks';

interface AsanaWeeklyTrendWidgetProps {
  data: AsanaWeeklyTrendEntry[];
}

export function AsanaWeeklyTrendWidget({ data }: AsanaWeeklyTrendWidgetProps) {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-content-tertiary text-sm">
        No trend data available
      </div>
    );
  }

  const maxVal = Math.max(...data.flatMap(d => [d.created, d.completed]), 1);
  const chartHeight = 180;
  const chartWidth = Math.max(data.length * 60, 300);
  const padding = { top: 10, right: 20, bottom: 30, left: 40 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;

  function toPath(values: number[]): string {
    return values.map((v, i) => {
      const x = padding.left + (data.length > 1 ? i * xStep : innerW / 2);
      const y = padding.top + innerH - (v / maxVal) * innerH;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  }

  const createdPath = toPath(data.map(d => d.created));
  const completedPath = toPath(data.map(d => d.completed));

  // Y-axis ticks
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <div className="h-full flex flex-col px-2">
      <div className="flex items-center gap-4 mb-2 text-xs text-content-secondary flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-500 rounded" />
          <span>Created</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-green-500 rounded" />
          <span>Completed</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          {/* Y grid lines */}
          {yTicks.map(tick => {
            const y = padding.top + innerH - (tick / maxVal) * innerH;
            return (
              <g key={tick}>
                <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="var(--stroke)" strokeWidth={0.5} strokeDasharray="4 4" />
                <text x={padding.left - 6} y={y + 4} textAnchor="end" className="fill-content-tertiary" fontSize={10}>{tick}</text>
              </g>
            );
          })}

          {/* Lines */}
          <path d={createdPath} fill="none" stroke="#3b82f6" strokeWidth={2} />
          <path d={completedPath} fill="none" stroke="#22c55e" strokeWidth={2} />

          {/* Dots */}
          {data.map((d, i) => {
            const x = padding.left + (data.length > 1 ? i * xStep : innerW / 2);
            return (
              <g key={i}>
                <circle cx={x} cy={padding.top + innerH - (d.created / maxVal) * innerH} r={3} fill="#3b82f6" />
                <circle cx={x} cy={padding.top + innerH - (d.completed / maxVal) * innerH} r={3} fill="#22c55e" />
                {/* X label */}
                <text x={x} y={chartHeight - 5} textAnchor="middle" className="fill-content-tertiary" fontSize={9}>
                  {d.week.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
