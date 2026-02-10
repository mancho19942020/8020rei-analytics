/**
 * AxisSkeleton Component (React/Next.js version)
 *
 * A minimalistic skeleton loader component for displaying loading placeholders
 * following Axis design system specifications. Designed to be simple blocks
 * that reflect the general shape of content without detailed inner elements.
 *
 * USAGE:
 * <AxisSkeleton />
 * <AxisSkeleton variant="text" lines={3} />
 * <AxisSkeleton variant="card" />
 * <AxisSkeleton variant="widget" />
 * <AxisSkeleton variant="custom" width="200px" height="100px" />
 *
 * VARIANTS:
 * - text (default): Text line skeleton with optional multiple lines
 * - avatar: Circular skeleton for profile pictures
 * - button: Button-shaped skeleton
 * - card: Simple card-shaped block (minimalistic - no inner elements)
 * - widget: Dashboard widget placeholder (minimalistic)
 * - table-row: Table row skeleton with configurable columns
 * - input: Form input skeleton
 * - chart: Chart placeholder (simple block)
 * - custom: Custom dimensions
 *
 * ANIMATION:
 * - pulse (default): Gentle opacity animation using CSS class
 * - wave: Left-to-right shimmer effect using CSS class
 * - none: No animation (static)
 *
 * THEME CONSISTENCY:
 * - Uses CSS classes from globals.css (skeleton-bg, skeleton-animate, skeleton-wave)
 * - Automatically adapts to light/dark mode via CSS
 * - No flash on initial load - colors are determined by CSS, not JS
 *
 * ACCESSIBILITY:
 * - Uses aria-hidden for decorative loading elements
 * - Proper aria-label for screen readers
 * - role="status" for loading state announcement
 */

'use client';

import React, { useMemo } from 'react';

type SkeletonVariant = 'text' | 'avatar' | 'button' | 'card' | 'widget' | 'table-row' | 'input' | 'chart' | 'custom';
type SkeletonAnimation = 'pulse' | 'wave' | 'none';
type SkeletonSize = 'sm' | 'md' | 'lg' | 'xl';
type SkeletonRounded = 'none' | 'sm' | 'md' | 'lg' | 'full';

export interface AxisSkeletonProps {
  /** Skeleton variant type */
  variant?: SkeletonVariant;
  /** Animation style */
  animation?: SkeletonAnimation;
  /** Size preset (for avatar, button) */
  size?: SkeletonSize;
  /** Number of lines (for text variant) */
  lines?: number;
  /** Number of columns (for table-row variant) */
  columns?: number;
  /** Custom width (for custom variant or override) */
  width?: string;
  /** Custom height (for custom variant or override) */
  height?: string;
  /** Border radius override */
  rounded?: SkeletonRounded;
  /** Show as full-width block */
  fullWidth?: boolean;
  /** Accessible label for screen readers */
  label?: string;
}

export function AxisSkeleton({
  variant = 'text',
  animation = 'pulse',
  size = 'md',
  lines = 1,
  columns = 4,
  width = '',
  height = '',
  rounded = 'md',
  fullWidth = false,
  label = 'Loading...',
}: AxisSkeletonProps) {
  // Size mappings for different variants
  const sizeClasses = useMemo(() => {
    const sizes = {
      avatar: {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
      },
      button: {
        sm: 'w-16 h-7',
        md: 'w-20 h-9',
        lg: 'w-24 h-11',
        xl: 'w-32 h-12',
      },
      input: {
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-12',
        xl: 'h-14',
      },
    };

    if (variant === 'avatar') return sizes.avatar[size];
    if (variant === 'button') return sizes.button[size];
    if (variant === 'input') return sizes.input[size];

    return '';
  }, [variant, size]);

  // Border radius classes
  const radiusClasses = useMemo(() => {
    // Avatar is always circular
    if (variant === 'avatar') return 'rounded-full';

    const radiusMap: Record<SkeletonRounded, string> = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded',
      lg: 'rounded-lg',
      full: 'rounded-full',
    };

    return radiusMap[rounded];
  }, [variant, rounded]);

  // Animation classes - using CSS classes from globals.css
  const animationClasses = useMemo(() => {
    const animations: Record<SkeletonAnimation, string> = {
      pulse: 'skeleton-animate',
      wave: 'skeleton-wave',
      none: '',
    };

    return animations[animation];
  }, [animation]);

  // Base skeleton classes using CSS class for background
  const baseClasses = [
    'skeleton-bg',
    animationClasses,
    radiusClasses,
  ].filter(Boolean).join(' ');

  // Width/height style for custom dimensions
  const customStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;
    return style;
  }, [width, height]);

  // Text line widths for natural variation
  const lineWidths = useMemo(() => {
    const widths = ['100%', '90%', '95%', '85%', '70%'];
    return Array.from({ length: lines }, (_, i) => {
      // Last line is typically shorter
      if (i === lines - 1 && lines > 1) {
        return '60%';
      }
      return widths[i % widths.length];
    });
  }, [lines]);

  // Table column widths for natural variation
  const columnWidths = useMemo(() => {
    const widths = ['60%', '80%', '70%', '90%', '50%'];
    return Array.from({ length: columns }, (_, i) => widths[i % widths.length]);
  }, [columns]);

  return (
    <div
      role="status"
      aria-label={label}
      className={fullWidth ? 'w-full' : ''}
    >
      {/* Text Variant */}
      {variant === 'text' && (
        <div className={`space-y-2 ${fullWidth ? 'w-full' : ''}`}>
          {lineWidths.map((lineWidth, index) => (
            <div
              key={index}
              className={`${baseClasses} h-4`}
              style={{ width: lineWidth }}
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Avatar Variant */}
      {variant === 'avatar' && (
        <div
          className={`${baseClasses} ${sizeClasses}`}
          style={customStyle}
          aria-hidden="true"
        />
      )}

      {/* Button Variant */}
      {variant === 'button' && (
        <div
          className={`${baseClasses} ${sizeClasses} ${fullWidth ? 'w-full' : ''}`}
          style={customStyle}
          aria-hidden="true"
        />
      )}

      {/* Input Variant - simplified */}
      {variant === 'input' && (
        <div className={`space-y-2 ${fullWidth ? 'w-full' : 'w-64'}`}>
          {/* Label skeleton */}
          <div
            className={`${baseClasses} h-3 w-20`}
            aria-hidden="true"
          />
          {/* Input field skeleton */}
          <div
            className={`${baseClasses} ${sizeClasses} w-full`}
            style={customStyle}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Card Variant - MINIMALISTIC: just a simple rounded block */}
      {variant === 'card' && (
        <div
          className={`${baseClasses} rounded-lg ${fullWidth ? 'w-full' : 'w-72'}`}
          style={{ height: height || '140px' }}
          aria-hidden="true"
        />
      )}

      {/* Widget Variant - MINIMALISTIC: dashboard widget placeholder */}
      {variant === 'widget' && (
        <div
          className={`${baseClasses} rounded-lg ${fullWidth ? 'w-full' : ''}`}
          style={{
            width: width || '100%',
            height: height || '200px'
          }}
          aria-hidden="true"
        />
      )}

      {/* Chart Variant - MINIMALISTIC: simple chart placeholder */}
      {variant === 'chart' && (
        <div
          className={`${baseClasses} rounded-lg`}
          style={{
            width: width || '100%',
            height: height || '300px'
          }}
          aria-hidden="true"
        />
      )}

      {/* Table Row Variant */}
      {variant === 'table-row' && (
        <div
          className={`flex items-center gap-4 py-3 px-4 border-b border-stroke-subtle ${fullWidth ? 'w-full' : ''}`}
          aria-hidden="true"
        >
          {columnWidths.map((colWidth, index) => (
            <div
              key={index}
              className={`${baseClasses} h-4 flex-1`}
              style={{ maxWidth: colWidth }}
            />
          ))}
        </div>
      )}

      {/* Custom Variant */}
      {variant === 'custom' && (
        <div
          className={baseClasses}
          style={{
            width: width || '100%',
            height: height || '20px',
          }}
          aria-hidden="true"
        />
      )}

      {/* Screen reader text */}
      <span className="sr-only">{label}</span>
    </div>
  );
}
