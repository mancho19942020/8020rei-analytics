/**
 * AxisCallout Component (React/Next.js version)
 *
 * A versatile callout/alert component for displaying contextual feedback messages.
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
 * - info (default): Informational messages
 * - success: Success confirmations
 * - alert: Warnings and cautions
 * - error: Errors and critical issues
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
  dismissible = false,
  onDismiss,
  children,
  className = '',
  ...props
}: AxisCalloutProps) {
  // Type-specific configurations
  const typeConfig = {
    info: {
      container: 'bg-info-50 dark:bg-info-950 border-info-200 dark:border-info-800',
      icon: 'text-info-600 dark:text-info-400',
      title: 'text-info-900 dark:text-info-100',
      text: 'text-info-800 dark:text-info-200',
      button: 'text-info-600 dark:text-info-400 hover:text-info-800 dark:hover:text-info-200',
    },
    success: {
      container: 'bg-success-50 dark:bg-success-950 border-success-200 dark:border-success-800',
      icon: 'text-success-600 dark:text-success-400',
      title: 'text-success-900 dark:text-success-100',
      text: 'text-success-800 dark:text-success-200',
      button: 'text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-200',
    },
    alert: {
      container: 'bg-alert-50 dark:bg-alert-950 border-alert-200 dark:border-alert-800',
      icon: 'text-alert-600 dark:text-alert-400',
      title: 'text-alert-900 dark:text-alert-100',
      text: 'text-alert-800 dark:text-alert-200',
      button: 'text-alert-600 dark:text-alert-400 hover:text-alert-800 dark:hover:text-alert-200',
    },
    error: {
      container: 'bg-error-50 dark:bg-error-950 border-error-200 dark:border-error-800',
      icon: 'text-error-600 dark:text-error-400',
      title: 'text-error-900 dark:text-error-100',
      text: 'text-error-800 dark:text-error-200',
      button: 'text-error-600 dark:text-error-400 hover:text-error-800 dark:hover:text-error-200',
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
    'flex gap-3 p-4 border rounded-lg',
    typeConfig.container,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      role={type === 'error' ? 'alert' : type === 'alert' ? 'alert' : 'status'}
      className={containerClasses}
      {...props}
    >
      {/* Icon */}
      <div className={`shrink-0 ${typeConfig.icon}`} aria-hidden="true">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className={`text-body-regular font-semibold ${typeConfig.title} mb-1`}>
            {title}
          </h3>
        )}
        <div className={`text-body-regular ${typeConfig.text}`}>
          {children}
        </div>
      </div>

      {/* Dismiss Button */}
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`shrink-0 ${typeConfig.button} transition-colors`}
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
