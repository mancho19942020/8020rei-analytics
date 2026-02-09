/**
 * AxisSelect Component (React/Next.js version)
 *
 * A select/dropdown component following Axis design system specifications.
 * Based on Kairo design system with Carbon Design System best practices.
 *
 * USAGE:
 * <AxisSelect
 *   value={value}
 *   onChange={(val) => setValue(val)}
 *   options={options}
 *   label="Country"
 * />
 *
 * SIZES:
 * - sm: 28px height - compact spaces
 * - md (default): 36px height - standard use
 * - lg: 44px height - prominent selects
 *
 * ACCESSIBILITY:
 * - Uses semantic <select> element for simplicity
 * - Keyboard navigation works natively
 * - Error messages linked via aria-describedby
 * - Required fields indicated
 */

'use client';

import React, { SelectHTMLAttributes, ReactNode } from 'react';

type SelectSize = 'sm' | 'md' | 'lg';

export interface AxisSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface AxisSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> {
  /** Available options */
  options: AxisSelectOption[];
  /** Selected value */
  value?: string | number;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Select size */
  size?: SelectSize;
  /** Label text */
  label?: string;
  /** Hint/helper text shown below select */
  helperText?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Icon component to display on the left */
  iconLeft?: ReactNode;
  /** Full width select */
  fullWidth?: boolean;
  /** Placeholder option */
  placeholder?: string;
}

export function AxisSelect({
  options,
  value,
  onChange,
  size = 'md',
  label,
  helperText,
  error,
  iconLeft,
  fullWidth = true,
  disabled = false,
  required = false,
  placeholder,
  className = '',
  id,
  ...props
}: AxisSelectProps) {
  // Generate unique ID
  const selectId = id || `axis-select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  const hasError = !!error;
  const ariaDescribedby = hasError ? errorId : helperText ? hintId : undefined;

  // Size classes
  const sizeClasses = {
    sm: {
      select: 'h-7 px-3 text-button-small',
      label: 'text-label mb-1',
      hint: 'text-suggestion mt-1',
    },
    md: {
      select: 'h-9 px-4 text-body-regular',
      label: 'text-label mb-1.5',
      hint: 'text-label mt-1.5',
    },
    lg: {
      select: 'h-11 px-5 text-body-large',
      label: 'text-body-regular mb-2',
      hint: 'text-body-regular mt-2',
    },
  }[size];

  // Select state classes
  const baseSelectClasses = [
    'w-full',
    sizeClasses.select,
    'bg-surface-base',
    'border',
    'rounded-sm',
    'font-sans',
    'transition-colors duration-150',
    'focus:outline-none',
    'appearance-none',
    'bg-no-repeat',
    'pr-10', // Space for chevron icon
  ];

  const stateClasses = hasError
    ? [
        'border-error-500',
        'focus:border-error-700 focus:ring-2 focus:ring-error-200 dark:focus:ring-error-900',
      ]
    : [
        'border-stroke',
        'hover:border-stroke-strong',
        'focus:border-main-500 focus:ring-2 focus:ring-main-200 dark:focus:ring-main-900',
      ];

  const disabledClasses = disabled
    ? ['bg-neutral-50 dark:bg-neutral-900', 'text-content-disabled', 'cursor-not-allowed']
    : ['text-content-primary', 'cursor-pointer'];

  const paddingClasses = [];
  if (iconLeft) paddingClasses.push('pl-10');

  const selectClasses = [
    ...baseSelectClasses,
    ...stateClasses,
    ...disabledClasses,
    ...paddingClasses,
    className,
  ].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  // Chevron icon background style
  const chevronStyle = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1.5em 1.5em',
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && (
        <label htmlFor={selectId} className={`block ${sizeClasses.label} text-content-primary font-medium`}>
          {label}
          {required && <span className="text-error-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        {/* Left Icon */}
        {iconLeft && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-tertiary pointer-events-none"
            aria-hidden="true"
          >
            {iconLeft}
          </div>
        )}

        {/* Select */}
        <select
          id={selectId}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedby}
          aria-required={required}
          className={selectClasses}
          style={chevronStyle}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Error Icon */}
        {hasError && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-error-500 pointer-events-none">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <div className={sizeClasses.hint}>
          {error ? (
            <p id={errorId} className="text-error-700 dark:text-error-400" role="alert">
              {error}
            </p>
          ) : helperText ? (
            <p id={hintId} className="text-content-secondary">
              {helperText}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
