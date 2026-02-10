/**
 * Widget Component
 *
 * Base wrapper component for all workspace widgets.
 * Provides consistent Axis styling, drag handles, and controls.
 */

'use client';

import { ReactNode } from 'react';

export interface WidgetComponentProps {
  /** Widget title */
  title: string;

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

  /** Additional CSS classes */
  className?: string;
}

export function Widget({
  title,
  children,
  editMode = false,
  onRemove,
  onSettings,
  onExport,
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-stroke bg-surface-raised rounded-t-lg">
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

          {/* Title */}
          <h3 className="text-h4 font-semibold text-content-primary truncate">
            {title}
          </h3>
        </div>

        {/* Right side: Actions */}
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
              className="p-1.5 hover:bg-error-50 dark:hover:bg-error-950 rounded transition-colors duration-150 text-content-secondary hover:text-error-700 dark:hover:text-error-400"
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
      <div className="flex-1 p-4 min-h-0 overflow-hidden">
        <div className="w-full h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
