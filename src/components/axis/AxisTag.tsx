/**
 * AxisTag Component (React/Next.js version)
 *
 * A small label used to categorize or highlight content. Useful for filtering,
 * sorting, or adding context.
 *
 * USAGE:
 * <AxisTag>Label</AxisTag>
 * <AxisTag color="success">Active</AxisTag>
 * <AxisTag color="error" dot>Failed</AxisTag>
 * <AxisTag iconLeft={<Icon />} dismissible onDismiss={handleDismiss}>User</AxisTag>
 *
 * COLORS:
 * - neutral (default): Gray - general labels, categories
 * - success: Green - positive status, completed, active
 * - alert: Yellow/amber - warnings, pending, caution
 * - error: Red - errors, failed, critical
 * - info: Blue - informational, links, references
 *
 * SIZES:
 * - sm: 24px height - compact spaces, tables
 * - md (default): 28px height - standard use
 *
 * VARIANTS:
 * - filled (default): Solid background with matching text
 * - outlined: Border only, transparent background
 */

'use client';

import React, { ReactNode } from 'react';

type TagColor = 'neutral' | 'success' | 'alert' | 'error' | 'info';
type TagSize = 'sm' | 'md';
type TagVariant = 'filled' | 'outlined';

export interface AxisTagProps {
  /** Tag color scheme */
  color?: TagColor;
  /** Tag size */
  size?: TagSize;
  /** Tag style - filled or outlined */
  variant?: TagVariant;
  /** Show status dot on left */
  dot?: boolean;
  /** Icon to display on the left */
  iconLeft?: ReactNode;
  /** Show dismiss (X) button */
  dismissible?: boolean;
  /** Disable the tag (visual only, non-interactive) */
  disabled?: boolean;
  /** Tag content */
  children?: ReactNode;
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function AxisTag({
  color = 'neutral',
  size = 'md',
  variant = 'filled',
  dot = false,
  iconLeft,
  dismissible = false,
  disabled = false,
  children,
  onDismiss,
  className = '',
}: AxisTagProps) {
  // Size classes
  const sizeClasses = {
    sm: {
      tag: 'h-6 px-2 text-label gap-1.5',
      icon: 'w-3.5 h-3.5',
      dot: 'w-1.5 h-1.5',
      dismiss: 'w-3.5 h-3.5 -mr-0.5',
    },
    md: {
      tag: 'h-7 px-2.5 text-label gap-2',
      icon: 'w-4 h-4',
      dot: 'w-2 h-2',
      dismiss: 'w-4 h-4 -mr-0.5',
    },
  }[size];

  // Color classes
  const getColorClasses = () => {
    if (disabled) {
      return variant === 'filled'
        ? {
            container: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500',
            dot: 'bg-neutral-400 dark:bg-neutral-500',
            dismiss: 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-500 dark:hover:text-neutral-400',
          }
        : {
            container: 'bg-transparent border border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500',
            dot: 'bg-neutral-400 dark:bg-neutral-500',
            dismiss: 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-500 dark:hover:text-neutral-400',
          };
    }

    const colors = {
      neutral: {
        filled: {
          container: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200',
          dot: 'bg-neutral-500 dark:bg-neutral-400',
          dismiss: 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200',
        },
        outlined: {
          container: 'bg-transparent border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200',
          dot: 'bg-neutral-500 dark:bg-neutral-400',
          dismiss: 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200',
        },
      },
      success: {
        filled: {
          container: 'bg-success-100 dark:bg-success-900/40 text-success-800 dark:text-success-200',
          dot: 'bg-success-500',
          dismiss: 'text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-200',
        },
        outlined: {
          container: 'bg-transparent border border-success-300 dark:border-success-700 text-success-800 dark:text-success-200',
          dot: 'bg-success-500',
          dismiss: 'text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-200',
        },
      },
      alert: {
        filled: {
          container: 'bg-alert-100 dark:bg-alert-900/40 text-alert-800 dark:text-alert-200',
          dot: 'bg-alert-500',
          dismiss: 'text-alert-600 dark:text-alert-400 hover:text-alert-800 dark:hover:text-alert-200',
        },
        outlined: {
          container: 'bg-transparent border border-alert-300 dark:border-alert-700 text-alert-800 dark:text-alert-200',
          dot: 'bg-alert-500',
          dismiss: 'text-alert-600 dark:text-alert-400 hover:text-alert-800 dark:hover:text-alert-200',
        },
      },
      error: {
        filled: {
          container: 'bg-error-100 dark:bg-error-900/40 text-error-800 dark:text-error-200',
          dot: 'bg-error-500',
          dismiss: 'text-error-600 dark:text-error-400 hover:text-error-800 dark:hover:text-error-200',
        },
        outlined: {
          container: 'bg-transparent border border-error-300 dark:border-error-700 text-error-800 dark:text-error-200',
          dot: 'bg-error-500',
          dismiss: 'text-error-600 dark:text-error-400 hover:text-error-800 dark:hover:text-error-200',
        },
      },
      info: {
        filled: {
          container: 'bg-info-100 dark:bg-info-900/40 text-info-800 dark:text-info-200',
          dot: 'bg-info-500',
          dismiss: 'text-info-600 dark:text-info-400 hover:text-info-800 dark:hover:text-info-200',
        },
        outlined: {
          container: 'bg-transparent border border-info-300 dark:border-info-700 text-info-800 dark:text-info-200',
          dot: 'bg-info-500',
          dismiss: 'text-info-600 dark:text-info-400 hover:text-info-800 dark:hover:text-info-200',
        },
      },
    };

    return colors[color][variant];
  };

  const colorClasses = getColorClasses();

  // Combined tag classes
  const tagClasses = [
    // Base styles
    'inline-flex items-center font-medium rounded whitespace-nowrap',
    // Transition
    'transition-colors duration-150',
    // Size
    sizeClasses.tag,
    // Color/variant
    colorClasses.container,
    // Disabled state
    disabled ? 'cursor-not-allowed opacity-75' : '',
    className,
  ].filter(Boolean).join(' ');

  // Handle dismiss click
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onDismiss) {
      onDismiss();
    }
  };

  return (
    <span className={tagClasses}>
      {/* Status dot */}
      {dot && !iconLeft && (
        <span
          className={`rounded-full shrink-0 ${sizeClasses.dot} ${colorClasses.dot}`}
          aria-hidden="true"
        />
      )}

      {/* Left icon */}
      {iconLeft && (
        <span className={`shrink-0 ${sizeClasses.icon}`} aria-hidden="true">
          {iconLeft}
        </span>
      )}

      {/* Tag text */}
      <span className="truncate">{children}</span>

      {/* Dismiss button */}
      {dismissible && (
        <button
          type="button"
          className={[
            'shrink-0 rounded transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-current',
            sizeClasses.dismiss,
            colorClasses.dismiss,
            disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/10',
          ].filter(Boolean).join(' ')}
          disabled={disabled}
          aria-label="Remove tag"
          onClick={handleDismiss}
        >
          <svg className="w-full h-full" fill="none" viewBox="0 0 20 20" aria-hidden="true">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 6l8 8m0-8l-8 8"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
