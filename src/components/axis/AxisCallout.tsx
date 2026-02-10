/**
 * AxisCallout Component (React/Next.js version)
 *
 * A contextual feedback component for displaying important messages, tips,
 * warnings, or errors. Features an accent bar on the left for visual emphasis.
 * Following Axis design system specifications.
 *
 * USAGE:
 * <AxisCallout type="info">This is an informational message</AxisCallout>
 * <AxisCallout type="success" title="Success!" dismissible onDismiss={() => {}}>
 *   Your changes have been saved.
 * </AxisCallout>
 * <AxisCallout type="error" title="Error">Something went wrong</AxisCallout>
 *
 * TYPES:
 * - info (default): Informational messages (blue accent)
 * - success: Success confirmations (green accent)
 * - alert: Warnings and cautions (yellow accent)
 * - error: Errors and critical issues (red accent)
 *
 * FEATURES:
 * - Accent bar on left (8px width) for visual type identification
 * - Optional title for emphasis
 * - Dismissible with X button (disabled by default)
 * - Custom icon support (default icons per type)
 *
 * ACCESSIBILITY:
 * - Uses appropriate ARIA roles
 * - Dismissible callouts are focusable
 * - Icons are aria-hidden
 */

'use client';

import React, { HTMLAttributes, ReactNode } from 'react';

type CalloutType = 'info' | 'success' | 'alert' | 'error';

export interface AxisCalloutProps extends HTMLAttributes<HTMLDivElement> {
  /** Callout type/severity */
  type?: CalloutType;
  /** Optional title */
  title?: string;
  /** Custom icon (overrides default type icon) */
  icon?: ReactNode;
  /** Hide the icon entirely */
  hideIcon?: boolean;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Content */
  children: ReactNode;
}

export function AxisCallout({
  type = 'info',
  title,
  icon: customIcon,
  hideIcon = false,
  dismissible = false,
  onDismiss,
  children,
  className = '',
  ...props
}: AxisCalloutProps) {
  // Type-specific configurations using defined color tokens
  // Colors available: 50, 100, 300, 500, 700, 900, 950
  const typeConfig = {
    info: {
      container: 'bg-accent-1-50 dark:bg-accent-1-950 border-accent-1-300 dark:border-accent-1-700',
      bar: 'bg-accent-1-500',
      icon: 'text-accent-1-700 dark:text-accent-1-300',
      title: 'text-accent-1-900 dark:text-accent-1-100',
      text: 'text-accent-1-700 dark:text-accent-1-300',
      button: 'text-accent-1-700 dark:text-accent-1-300 hover:text-accent-1-900 dark:hover:text-accent-1-100',
    },
    success: {
      container: 'bg-success-50 dark:bg-success-950 border-success-300 dark:border-success-700',
      bar: 'bg-success-500',
      icon: 'text-success-700 dark:text-success-300',
      title: 'text-success-900 dark:text-success-100',
      text: 'text-success-700 dark:text-success-300',
      button: 'text-success-700 dark:text-success-300 hover:text-success-900 dark:hover:text-success-100',
    },
    alert: {
      container: 'bg-alert-50 dark:bg-alert-950 border-alert-300 dark:border-alert-700',
      bar: 'bg-alert-500',
      icon: 'text-alert-700 dark:text-alert-300',
      title: 'text-alert-900 dark:text-alert-100',
      text: 'text-alert-700 dark:text-alert-300',
      button: 'text-alert-700 dark:text-alert-300 hover:text-alert-900 dark:hover:text-alert-100',
    },
    error: {
      container: 'bg-error-50 dark:bg-error-950 border-error-300 dark:border-error-700',
      bar: 'bg-error-500',
      icon: 'text-error-700 dark:text-error-300',
      title: 'text-error-900 dark:text-error-100',
      text: 'text-error-700 dark:text-error-300',
      button: 'text-error-700 dark:text-error-300 hover:text-error-900 dark:hover:text-error-100',
    },
  }[type];

  // Default icons for each type
  const defaultIcon = {
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    alert: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  }[type];

  const icon = customIcon || defaultIcon;

  const containerClasses = [
    'relative flex overflow-hidden rounded-md border',
    typeConfig.container,
    className,
  ].filter(Boolean).join(' ');

  const showIcon = !hideIcon && icon;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={containerClasses}
      {...props}
    >
      {/* Accent bar on left */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 shrink-0 ${typeConfig.bar}`}
        aria-hidden="true"
      />

      {/* Content area */}
      <div className="flex flex-1 items-start gap-3 py-3 pl-5 pr-3">
        {/* Icon */}
        {showIcon && (
          <div className={`shrink-0 mt-0.5 ${typeConfig.icon}`} aria-hidden="true">
            {icon}
          </div>
        )}

        {/* Text content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className={`text-body-regular font-semibold ${typeConfig.title}`}>
              {title}
            </p>
          )}
          <div className={`text-body-regular ${typeConfig.text} ${title ? 'mt-1' : ''}`}>
            {children}
          </div>
        </div>

        {/* Dismiss Button */}
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`shrink-0 p-1 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${typeConfig.icon}`}
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
