/**
 * Widget Component
 *
 * Base wrapper component for all workspace widgets.
 * Provides consistent Axis styling, drag handles, and controls.
 */

'use client';

import { ReactNode } from 'react';
import { AxisTooltip } from '@/components/axis';

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

  /** Shows "All time" tag when widget always displays lifetime data regardless of date filter */
  allTime?: boolean;

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
  allTime = false,
  className = '',
}: WidgetComponentProps) {
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

          {/* Title + Tooltip */}
          <h3 className="text-h4 font-semibold text-content-primary truncate flex items-center gap-1.5">
            {title}
            {allTime && (
              <span
                className="inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ backgroundColor: 'var(--surface-base)', color: 'var(--text-tertiary)', fontSize: '10px' }}
                title="This widget shows lifetime cumulative data and is not affected by the date filter"
              >
                All time
              </span>
            )}
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
        <div className="flex items-center gap-1 flex-shrink-0">
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
