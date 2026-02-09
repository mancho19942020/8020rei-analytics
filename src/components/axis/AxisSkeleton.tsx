/**
 * AxisSkeleton Component (React/Next.js version)
 *
 * A versatile skeleton loader component for displaying loading placeholders
 * following Axis design system specifications. Skeleton loaders improve perceived
 * performance by showing a visual representation of content that's loading.
 *
 * USAGE:
 * <AxisSkeleton />
 * <AxisSkeleton variant="text" lines={3} />
 * <AxisSkeleton variant="avatar" size="lg" />
 * <AxisSkeleton variant="card" />
 * <AxisSkeleton variant="table-row" columns={5} />
 * <AxisSkeleton variant="custom" width="200px" height="100px" />
 *
 * VARIANTS:
 * - text (default): Text line skeleton with optional multiple lines
 * - avatar: Circular skeleton for profile pictures
 * - button: Button-shaped skeleton
 * - image: Rectangular image placeholder
 * - card: Card skeleton with image, title, and description
 * - table-row: Table row skeleton with configurable columns
 * - input: Form input skeleton
 * - custom: Custom dimensions
 *
 * ANIMATION:
 * - pulse (default): Gentle opacity animation
 * - wave: Left-to-right shimmer effect
 * - none: No animation (static)
 *
 * ACCESSIBILITY:
 * - Uses aria-hidden for decorative loading elements
 * - Proper aria-label for screen readers
 * - role="status" for loading state announcement
 */

'use client';

import React, { useMemo } from 'react';

type SkeletonVariant = 'text' | 'avatar' | 'button' | 'image' | 'card' | 'table-row' | 'input' | 'custom';
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

  // Animation classes
  const animationClasses = useMemo(() => {
    const animations: Record<SkeletonAnimation, string> = {
      pulse: 'animate-pulse',
      wave: 'animate-skeleton-wave',
      none: '',
    };

    return animations[animation];
  }, [animation]);

  // Base skeleton classes
  const baseClasses = [
    'bg-neutral-200 dark:bg-neutral-700',
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

      {/* Input Variant */}
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

      {/* Image Variant */}
      {variant === 'image' && (
        <div
          className={`${baseClasses} flex items-center justify-center`}
          style={{ width: width || '100%', height: height || '200px' }}
          aria-hidden="true"
        >
          {/* Image icon placeholder */}
          <svg
            className="w-10 h-10 text-neutral-300 dark:text-neutral-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </div>
      )}

      {/* Card Variant */}
      {variant === 'card' && (
        <div
          className={`border border-stroke rounded-lg overflow-hidden ${fullWidth ? 'w-full' : 'w-72'}`}
          aria-hidden="true"
        >
          {/* Card image area */}
          <div className={`${baseClasses} h-40 flex items-center justify-center rounded-none`}>
            <svg
              className="w-10 h-10 text-neutral-300 dark:text-neutral-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          {/* Card content */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className={`${baseClasses} h-5 w-3/4`} />
            {/* Description lines */}
            <div className="space-y-2">
              <div className={`${baseClasses} h-3 w-full`} />
              <div className={`${baseClasses} h-3 w-5/6`} />
            </div>
            {/* Action area */}
            <div className="flex gap-2 pt-2">
              <div className={`${baseClasses} h-8 w-20`} />
              <div className={`${baseClasses} h-8 w-16`} />
            </div>
          </div>
        </div>
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

      {/* Wave animation styles */}
      <style jsx>{`
        @keyframes skeleton-wave {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        :global(.animate-skeleton-wave) {
          background: linear-gradient(
            90deg,
            rgb(229 231 235) 25%,
            rgb(209 213 219) 50%,
            rgb(229 231 235) 75%
          );
          background-size: 200% 100%;
          animation: skeleton-wave 1.5s ease-in-out infinite;
        }

        :global(.dark .animate-skeleton-wave) {
          background: linear-gradient(
            90deg,
            rgb(55 65 81) 25%,
            rgb(75 85 99) 50%,
            rgb(55 65 81) 75%
          );
          background-size: 200% 100%;
        }
      `}</style>
    </div>
  );
}
