/**
 * Widget Component
 *
 * Base wrapper component for all workspace widgets.
 * Provides consistent Axis styling, drag handles, and controls.
 */

'use client';

import { ReactNode } from 'react';
import { AxisTooltip, AxisTag } from '@/components/axis';
import { WidgetAlignmentTag } from './WidgetAlignmentTag';

/**
 * Custom "All time" pill. AxisTag's `neutral` variant disappears on the dark
 * header surface (neutral-800 filled on a near-neutral-800 bg). We use
 * accent-2 (indigo) instead — same pill shape as AxisTag, but a distinctive
 * color that's (a) not a status color, and (b) visibly different from the
 * info-blue used for "Date range". Mirrors AxisTag's info light/dark pattern
 * so contrast holds in both modes.
 */
function AllTimeTag() {
  return (
    <span className="inline-flex items-center h-6 px-2.5 rounded-full text-label font-medium whitespace-nowrap bg-accent-2-100 text-accent-2-700 border border-accent-2-300 dark:bg-accent-2-900/40 dark:text-accent-2-300 dark:border-accent-2-700">
      All time
    </span>
  );
}

/**
 * Time-scope of a widget. Must be set on every widget in defaultLayouts.ts so
 * users know at a glance whether the date picker at the top of the page
 * affects the numbers. Use 'none' to suppress the tag entirely (rare — only
 * for widgets where the distinction doesn't apply, like embedded toggles).
 */
export type WidgetTimeScope = 'all-time' | 'date-range' | 'last-30-days' | 'none';

export interface WidgetComponentProps {
  /** Widget title */
  title: string;

  /** Tooltip description shown on hover next to the title */
  tooltip?: string;

  /** Widget content */
  children: ReactNode;

  /** Whether workspace is in edit mode */
  editMode?: boolean;

  /** Callback when widget is removed */
  onRemove?: () => void;

  /** Callback when settings are opened */
  onSettings?: () => void;

  /** Callback when export is clicked */
  onExport?: () => void;

  /** Extra content rendered in the header bar, between the title and the action buttons */
  headerExtra?: ReactNode;

  /** Remove body padding so children (e.g. metric cards) go edge-to-edge */
  flushBody?: boolean;

  /**
   * Time-scope indicator rendered next to the title.
   *   - 'all-time'   → neutral gray "All time" tag (lifetime, not affected by date filter)
   *   - 'date-range' → blue "Date range" tag (filtered by the header's date picker)
   *   - 'none'       → no tag (rare; prefer one of the above)
   */
  timeScope?: WidgetTimeScope;

  /** @deprecated Use timeScope='all-time'. Kept for backward compatibility. */
  allTime?: boolean;

  /**
   * PCM alignment widget_key. When set, the Widget renders a "Reconciled Xm
   * ago" tag in the header action group (alongside the time-scope pill),
   * reading from /api/pcm-alignment/latest. The tag color reflects severity
   * (neutral / alert / error); hovering shows the per-sub-metric drift
   * breakdown. Match the `type` field from defaultLayouts.ts
   * (e.g. 'dm-overview-headline').
   */
  widgetKey?: string;

  /** Additional CSS classes */
  className?: string;
}

export function Widget({
  title,
  tooltip,
  children,
  editMode = false,
  onRemove,
  onSettings,
  onExport,
  headerExtra,
  flushBody = false,
  timeScope,
  allTime = false,
  widgetKey,
  className = '',
}: WidgetComponentProps) {
  // Resolve final scope: explicit `timeScope` wins; legacy `allTime` boolean
  // maps to 'all-time' for back-compat. Default to 'none' (no tag) so widgets
  // without an explicit classification don't accidentally claim the wrong one.
  const resolvedScope: WidgetTimeScope = timeScope ?? (allTime ? 'all-time' : 'none');
  return (
    <div
      className={[
        'h-full flex flex-col',
        'bg-surface-base border border-stroke rounded-lg',
        'shadow-xs transition-all duration-200',
        editMode
          ? 'hover:shadow-md hover:border-main-500 cursor-grab'
          : 'hover:shadow-sm',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Widget Header */}
      <div className={`flex items-center justify-between px-4 border-b border-stroke bg-surface-raised rounded-t-lg ${flushBody ? 'py-2' : 'py-3'}`}>
        {/* Left side: Drag handle + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Drag Handle (only visible in edit mode) */}
          {editMode && (
            <button
              type="button"
              className="widget-drag-handle cursor-move p-1 hover:bg-surface-base rounded transition-colors duration-150 flex-shrink-0"
              aria-label="Drag to reposition widget"
            >
              <svg
                className="w-4 h-4 text-content-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 8h16M4 16h16"
                />
              </svg>
            </button>
          )}

          {/* Title + info tooltip only — the time-scope tag moved to the right-side action group (2026-04-17) so the title reads cleanly on its own. */}
          <h3 className="text-h4 font-semibold text-content-primary truncate flex items-center gap-1.5">
            {title}
            {tooltip && (
              <AxisTooltip content={tooltip} placement="bottom" maxWidth={280}>
                <span className="inline-flex p-0.5 rounded-full text-content-tertiary hover:text-content-secondary cursor-help flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
                  </svg>
                </span>
              </AxisTooltip>
            )}
          </h3>
        </div>

        {/* Right side: Header extra + Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {headerExtra}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Time-scope tag — leads the action group so users always see scope before acting */}
          {resolvedScope === 'all-time' && (
            <AxisTooltip
              content="This widget shows lifetime data since tracking began. The date filter at the top of the page does not affect these numbers."
              placement="bottom"
              maxWidth={280}
            >
              <span className="flex-shrink-0 cursor-help">
                <AllTimeTag />
              </span>
            </AxisTooltip>
          )}
          {resolvedScope === 'date-range' && (
            <AxisTooltip
              content="This widget reflects the date range selected at the top of the page. Change the date filter to update these numbers."
              placement="bottom"
              maxWidth={280}
            >
              <span className="flex-shrink-0 cursor-help">
                <AxisTag color="info" size="sm">Date range</AxisTag>
              </span>
            </AxisTooltip>
          )}
          {resolvedScope === 'last-30-days' && (
            <AxisTooltip
              content="Anchored to the last 30 days from today. Slides forward daily as 'today' advances. Not affected by the header date filter — the backing table's coverage is currently limited, so this window is fixed for trust."
              placement="bottom"
              maxWidth={320}
            >
              <span className="flex-shrink-0 cursor-help">
                <AxisTag color="info" size="sm">Last 30 days</AxisTag>
              </span>
            </AxisTooltip>
          )}
          {/* PCM alignment tag — shows "Reconciled Xm ago" with color-coded
              severity. Sits next to the time-scope pill so users see freshness
              + data-health together. Hover for the drift breakdown. */}
          {widgetKey && <WidgetAlignmentTag widgetKey={widgetKey} />}
          {/* Export Button */}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="p-1.5 hover:bg-surface-base rounded transition-colors duration-150 text-content-secondary hover:text-content-primary"
              aria-label="Export data"
              title="Export to CSV"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          )}

          {/* Settings Button (optional) */}
          {onSettings && (
            <button
              type="button"
              onClick={onSettings}
              className="p-1.5 hover:bg-surface-base rounded transition-colors duration-150 text-content-secondary hover:text-content-primary"
              aria-label="Widget settings"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          )}

          {/* Remove Button (only visible in edit mode) */}
          {editMode && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 hover:bg-error-50 dark:hover:bg-error-950 rounded transition-colors duration-150 text-content-secondary hover:text-error-700 dark:hover:text-error-300"
              aria-label="Remove widget"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Widget Body */}
      <div className={`flex-1 min-h-0 overflow-hidden ${flushBody ? '' : 'px-3 py-2'}`}>
        <div className="w-full h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
