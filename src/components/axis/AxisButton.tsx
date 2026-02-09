/**
 * AxisButton Component (React/Next.js version)
 *
 * A versatile button component following Axis design system specifications.
 * Based on Kairo design system with Material Design best practices.
 *
 * USAGE:
 * <AxisButton>Click me</AxisButton>
 * <AxisButton variant="outlined" size="lg">Large Outlined</AxisButton>
 * <AxisButton variant="ghost" iconLeft={<PlusIcon />}>Add Item</AxisButton>
 * <AxisButton destructive>Delete</AxisButton>
 * <AxisButton loading>Processing...</AxisButton>
 *
 * VARIANTS:
 * - filled (default): Solid background, white text - primary actions
 * - outlined: Border only, transparent background - secondary actions
 * - ghost: No border or background - tertiary actions
 *
 * SIZES:
 * - sm: 28px height, 12px text - compact spaces
 * - md (default): 36px height, 14px text - standard use
 * - lg: 44px height, 16px text - prominent CTAs
 *
 * STATES:
 * - default, hover, focus, active, disabled, loading
 *
 * ACCESSIBILITY:
 * - Uses semantic <button> element
 * - Supports aria-disabled when loading
 * - Focus visible ring for keyboard navigation
 * - Icons are aria-hidden
 */

'use client';

import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export interface AxisButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Button visual style */
  variant?: 'filled' | 'outlined' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Destructive action styling (red colors) */
  destructive?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Icon component to display on the left */
  iconLeft?: ReactNode;
  /** Icon component to display on the right */
  iconRight?: ReactNode;
  /** Icon-only button (no text) */
  iconOnly?: boolean;
  /** HTML button type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Full width button */
  fullWidth?: boolean;
  /** Button content */
  children?: ReactNode;
}

export function AxisButton({
  variant = 'filled',
  size = 'md',
  destructive = false,
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  iconOnly = false,
  type = 'button',
  fullWidth = false,
  children,
  className = '',
  onClick,
  ...props
}: AxisButtonProps) {
  const isDisabled = disabled || loading;

  // Size-based classes
  const sizeClasses = {
    sm: {
      button: iconOnly ? 'h-7 w-7' : 'h-7 px-3',
      text: 'text-button-small',
      icon: 'w-4 h-4',
      gap: 'gap-1.5',
    },
    md: {
      button: iconOnly ? 'h-9 w-9' : 'h-9 px-4',
      text: 'text-button-regular',
      icon: 'w-5 h-5',
      gap: 'gap-2',
    },
    lg: {
      button: iconOnly ? 'h-11 w-11' : 'h-11 px-5',
      text: 'text-button-large',
      icon: 'w-5 h-5',
      gap: 'gap-2',
    },
  }[size];

  // Variant + destructive state classes
  // Updated for dark mode support using semantic tokens and dark: variants
  const variantClasses = destructive
    ? {
        filled: `
          bg-error-500 text-white
          hover:bg-error-700
          active:bg-error-900
          disabled:bg-neutral-200 disabled:text-neutral-400
          dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500
        `,
        outlined: `
          border border-error-500 text-error-700 bg-transparent
          hover:bg-error-50 hover:border-error-700
          active:bg-error-100
          dark:text-error-400 dark:border-error-400
          dark:hover:bg-error-950 dark:hover:border-error-300
          dark:active:bg-error-900
          disabled:border-neutral-300 disabled:text-neutral-400 disabled:bg-transparent
          dark:disabled:border-neutral-700 dark:disabled:text-neutral-500
        `,
        ghost: `
          text-error-700 bg-transparent
          hover:bg-error-50
          active:bg-error-100
          dark:text-error-400
          dark:hover:bg-error-950
          dark:active:bg-error-900
          disabled:text-neutral-400 disabled:bg-transparent
          dark:disabled:text-neutral-500
        `,
      }[variant]
    : {
        filled: `
          bg-main-700 text-white
          hover:bg-main-900
          active:bg-main-950
          disabled:bg-neutral-200 disabled:text-neutral-400
          dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500
        `,
        outlined: `
          border border-main-700 text-content-primary bg-transparent
          hover:bg-main-50 hover:border-main-900
          active:bg-main-100
          dark:border-main-500
          dark:hover:bg-main-950 dark:hover:border-main-300
          dark:active:bg-main-900
          disabled:border-neutral-300 disabled:text-content-disabled disabled:bg-transparent
          dark:disabled:border-neutral-700
        `,
        ghost: `
          text-content-primary bg-transparent
          hover:bg-main-50
          active:bg-main-100
          dark:hover:bg-main-950
          dark:active:bg-main-900
          disabled:text-content-disabled disabled:bg-transparent
        `,
      }[variant];

  // Combined button classes
  const buttonClasses = [
    // Base styles
    'inline-flex items-center justify-center',
    'rounded-sm',
    'font-medium',
    'transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-2',
    // Size
    sizeClasses.button,
    sizeClasses.text,
    sizeClasses.gap,
    // Variant
    variantClasses,
    // Full width
    fullWidth ? 'w-full' : '',
    // Disabled cursor
    isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
    // Custom className
    className,
  ].join(' ');

  // Handle click
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && onClick) {
      onClick(event);
    }
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={loading ? 'true' : undefined}
      aria-busy={loading ? 'true' : undefined}
      className={buttonClasses}
      onClick={handleClick}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <svg
          className={`animate-spin ${sizeClasses.icon}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Left icon */}
      {!loading && iconLeft && (
        <span className={sizeClasses.icon} aria-hidden="true">
          {iconLeft}
        </span>
      )}

      {/* Button text */}
      {!iconOnly && children && <span>{children}</span>}

      {/* Right icon */}
      {!loading && iconRight && (
        <span className={sizeClasses.icon} aria-hidden="true">
          {iconRight}
        </span>
      )}
    </button>
  );
}
