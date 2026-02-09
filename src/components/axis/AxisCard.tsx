/**
 * AxisCard Component (React/Next.js version)
 *
 * A unified card component following Axis design system specifications.
 * Supports multiple variants for different use cases.
 *
 * USAGE:
 * <AxisCard>Basic content</AxisCard>
 * <AxisCard variant="stat" label="Total Revenue" value="$123,456" icon={<ChartIcon />} />
 * <AxisCard variant="elevated" padding="lg">Content</AxisCard>
 *
 * VARIANTS:
 * - default: General content container with slots (header, body, footer, media)
 * - outlined: Card with border
 * - elevated: Card with shadow elevation
 *
 * SUB-COMPONENTS:
 * - AxisCard.Header
 * - AxisCard.Body
 * - AxisCard.Footer
 * - AxisCard.Media
 *
 * ACCESSIBILITY:
 * - Interactive cards are focusable with keyboard navigation
 * - Focus ring visible for keyboard users
 */

'use client';

import React, { HTMLAttributes, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

type CardVariant = 'default' | 'outlined' | 'elevated';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardRounded = 'none' | 'sm' | 'md' | 'lg';
type CardColor = 'neutral' | 'main' | 'success' | 'error' | 'accent-1' | 'accent-2' | 'accent-3';

export interface AxisCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: CardVariant;
  /** Internal padding */
  padding?: CardPadding;
  /** Border radius */
  rounded?: CardRounded;
  /** Enable interactive hover/focus states */
  interactive?: boolean;
  /** Enable clickable hover states */
  clickable?: boolean;
  /** Disable the card */
  disabled?: boolean;
  /** Card content */
  children: ReactNode;
}

// Stat Card Props (special variant)
export interface AxisCardStatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Metric label */
  label: string;
  /** Primary value */
  value: string | number;
  /** Leading icon component */
  icon?: ReactNode;
  /** Accent color */
  color?: CardColor;
  /** Show empty state (dash) */
  empty?: boolean;
  /** Additional content below value */
  children?: ReactNode;
}

// ============================================
// MAIN CARD COMPONENT
// ============================================

export function AxisCard({
  variant = 'default',
  padding = 'md',
  rounded = 'lg',
  interactive = false,
  clickable = false,
  disabled = false,
  children,
  className = '',
  onClick,
  ...props
}: AxisCardProps) {
  const isInteractive = interactive || clickable || !!onClick;

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[padding];

  // Rounded classes
  const roundedClasses = {
    none: '',
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
  }[rounded];

  // Variant classes
  const variantClasses = {
    default: 'border border-stroke',
    outlined: 'border-2 border-stroke',
    elevated: 'shadow-md',
  }[variant];

  // Base container classes
  const baseClasses = [
    'bg-surface-base',
    variantClasses,
    roundedClasses,
    'transition-all duration-200',
  ];

  // Interactive state classes
  const interactiveClasses = isInteractive && !disabled
    ? [
        'cursor-pointer',
        'hover:border-main-500 dark:hover:border-main-400',
        'hover:shadow-sm dark:hover:shadow-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-2',
      ]
    : [];

  // Disabled classes
  const disabledClasses = disabled ? ['opacity-50', 'pointer-events-none', 'cursor-not-allowed'] : [];

  const allClasses = [
    ...baseClasses,
    ...interactiveClasses,
    ...disabledClasses,
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled && onClick) {
      onClick(event);
    }
  };

  return (
    <div
      className={allClasses}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================
// STAT VARIANT (Separate component for simplicity)
// ============================================

export function AxisCardStat({
  label,
  value,
  icon,
  color = 'neutral',
  empty = false,
  children,
  className = '',
  ...props
}: AxisCardStatProps) {
  // Color classes for icon
  const colorClasses = {
    neutral: 'text-neutral-500 dark:text-neutral-400',
    main: 'text-main-500 dark:text-main-400',
    success: 'text-success-500 dark:text-success-400',
    error: 'text-error-500 dark:text-error-400',
    'accent-1': 'text-accent-1-500 dark:text-accent-1-400',
    'accent-2': 'text-accent-2-500 dark:text-accent-2-400',
    'accent-3': 'text-accent-3-500 dark:text-accent-3-400',
  }[color];

  const displayValue = empty ? '—' : value;

  return (
    <div
      className={`bg-surface-base border border-stroke rounded-xl p-4 transition-all duration-200 ${className}`}
      {...props}
    >
      <div className="flex items-start gap-2">
        {/* Icon */}
        {icon && (
          <div className={`w-5 h-5 shrink-0 ${colorClasses}`} aria-hidden="true">
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Label */}
          <p className="text-label text-content-secondary">{label}</p>

          {/* Value */}
          <p className="text-body-regular font-semibold text-content-primary">{displayValue}</p>

          {/* Additional content */}
          {children && <div className="mt-1">{children}</div>}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface AxisCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}

function AxisCardHeader({ title, subtitle, action, children, className = '', ...props }: AxisCardHeaderProps) {
  return (
    <div className={`px-4 pt-4 ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {title && <h3 className="text-h4 font-semibold text-content-primary">{title}</h3>}
            {subtitle && <p className="text-body-regular text-content-secondary mt-1">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

interface AxisCardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function AxisCardBody({ children, className = '', ...props }: AxisCardBodyProps) {
  return (
    <div className={`px-4 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface AxisCardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function AxisCardFooter({ children, className = '', ...props }: AxisCardFooterProps) {
  return (
    <div className={`px-4 pb-4 pt-3 border-t border-stroke-subtle ${className}`} {...props}>
      {children}
    </div>
  );
}

interface AxisCardMediaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function AxisCardMedia({ children, className = '', ...props }: AxisCardMediaProps) {
  return (
    <div className={`overflow-hidden rounded-t-xl ${className}`} {...props}>
      {children}
    </div>
  );
}

// Attach sub-components to main component
AxisCard.Header = AxisCardHeader;
AxisCard.Body = AxisCardBody;
AxisCard.Footer = AxisCardFooter;
AxisCard.Media = AxisCardMedia;
AxisCard.Stat = AxisCardStat;
