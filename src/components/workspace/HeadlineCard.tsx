/**
 * HeadlineCard — shared visual for widget rows of "hero metric" cards.
 *
 * Originally defined inline inside DmOverviewHeadlineWidget.tsx (Card). Extracted
 * 2026-04-22 so the same visual vocabulary can be reused on Operational Health
 * (RrOpsStatusStripWidget) per Germán's direction: "use the same component as
 * the Headline Metrics — the pills look too small / low hierarchy."
 *
 * Layout: icon badge + label + (optional inconsistency triangle) on top,
 * hero value in the middle, footer sub-line at bottom. Fills card height.
 *
 * Tooltip strategy:
 *   - Hover the label → `sourceNote` (where the number comes from).
 *   - Hover the triangle (if `inconsistency`) → data-quality warning.
 *   - Hover anywhere else → nothing.
 */

'use client';

import type { ReactNode } from 'react';
import { AxisTooltip } from '@/components/axis';

export interface HeadlineCardProps {
  /** Short metric name shown next to the icon. */
  label: string;
  /** Large value rendered in hero style (e.g. "13 / 21", "27.5K", "$1.9K"). */
  hero: string;
  /** Footer line — context, breakdown, or delta. Kept to one line when possible. */
  sub: string;
  /** Small SVG icon rendered inside the badge. Size w-4 h-4 works well. */
  icon: ReactNode;
  /** Tailwind background class for the icon badge, e.g. "bg-main-700" / "bg-error-700". */
  iconBg: string;
  /** Colour the footer line: neutral (default tertiary), warning (alert yellow), info (secondary). */
  secondaryTone?: 'neutral' | 'warning' | 'info';
  /** Explanation of the data source — shown when hovering the label. */
  sourceNote: string;
  /** Optional inconsistency warning — renders a yellow triangle icon with tooltip. */
  inconsistency?: string;
}

const InconsistencyIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

export function HeadlineCard({
  label,
  hero,
  sub,
  icon,
  iconBg,
  secondaryTone = 'neutral',
  sourceNote,
  inconsistency,
}: HeadlineCardProps) {
  const toneClass =
    secondaryTone === 'warning'
      ? 'text-alert-700 dark:text-alert-300'
      : secondaryTone === 'info'
        ? 'text-content-secondary'
        : 'text-content-tertiary';

  return (
    <div className="flex flex-col justify-between gap-1 p-3 bg-surface-raised border-r border-stroke last:border-r-0 min-w-0 flex-1 h-full relative group/card">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-6 h-6 rounded flex items-center justify-center text-white flex-shrink-0 ${iconBg}`}>{icon}</div>
        <AxisTooltip content={sourceNote} placement="top" maxWidth={360}>
          <span className="text-sm font-medium text-content-secondary truncate cursor-help">{label}</span>
        </AxisTooltip>
        {inconsistency && (
          <AxisTooltip title="Data quality warning" content={inconsistency} placement="top" maxWidth={360}>
            <span
              className="flex-shrink-0 text-alert-700 dark:text-alert-300 cursor-help"
              role="img"
              aria-label="Data inconsistency"
            >
              <InconsistencyIcon />
            </span>
          </AxisTooltip>
        )}
      </div>
      <div className="text-[2rem] font-bold text-content-primary tabular-nums leading-[36px] tracking-tight">{hero}</div>
      <div className={`text-xs ${toneClass} break-words leading-snug`}>{sub}</div>
    </div>
  );
}
