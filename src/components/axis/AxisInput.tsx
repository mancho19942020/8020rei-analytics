/**
 * AxisInput Component (React/Next.js version)
 *
 * A versatile text input component following Axis design system specifications.
 * Based on Kairo design system with Carbon Design System best practices.
 *
 * USAGE:
 * <AxisInput value={value} onChange={(e) => setValue(e.target.value)} label="Email" />
 * <AxisInput type="password" label="Password" error={errorMsg} />
 * <AxisInput type="search" placeholder="Search..." />
 *
 * TYPES:
 * - text (default): Standard text input
 * - email: Email input
 * - password: Password with toggle visibility
 * - tel: Phone number input
 * - url: URL/website input
 * - number: Numeric input
 * - search: Search input with clear button
 *
 * SIZES:
 * - sm: 28px height - compact spaces
 * - md (default): 36px height - standard use
 * - lg: 44px height - prominent inputs
 *
 * STATES:
 * - default, filled, focus, hover, disabled, readonly, error
 *
 * ACCESSIBILITY:
 * - Uses semantic <input> element with proper labeling
 * - Error messages linked via aria-describedby
 * - Required fields indicated via aria-required
 * - Icons are aria-hidden
 */

'use client';

import React, { InputHTMLAttributes, ReactNode, useState, useId } from 'react';

type InputSize = 'sm' | 'md' | 'lg';
type InputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search';

export interface AxisInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input size */
  size?: InputSize;
  /** Label text */
  label?: string;
  /** Hint/helper text shown below input */
  helperText?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Icon component to display on the left */
  iconLeft?: ReactNode;
  /** Icon component to display on the right */
  iconRight?: ReactNode;
  /** Full width input */
  fullWidth?: boolean;
}

export function AxisInput({
  size = 'md',
  type = 'text',
  label,
  helperText,
  error,
  iconLeft,
  iconRight,
  fullWidth = true,
  disabled = false,
  readOnly = false,
  required = false,
  className = '',
  id,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}: AxisInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Generate unique ID for accessibility
  const generatedId = useId();
  const inputId = id || `axis-input-${generatedId}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const hasError = !!error;
  const actualType = type === 'password' && showPassword ? 'text' : type;

  // Compute aria-describedby
  const ariaDescribedby = hasError ? errorId : helperText ? hintId : undefined;

  // Size classes
  const sizeClasses = {
    sm: {
      input: 'h-7 px-3 text-button-small',
      icon: 'w-4 h-4',
      label: 'text-label mb-1',
      hint: 'text-suggestion mt-1',
    },
    md: {
      input: 'h-9 px-4 text-body-regular',
      icon: 'w-5 h-5',
      label: 'text-label mb-1.5',
      hint: 'text-label mt-1.5',
    },
    lg: {
      input: 'h-11 px-5 text-body-large',
      icon: 'w-5 h-5',
      label: 'text-body-regular mb-2',
      hint: 'text-body-regular mt-2',
    },
  }[size];

  // Input state classes
  const baseInputClasses = [
    'w-full',
    sizeClasses.input,
    'bg-surface-base',
    'border',
    'rounded-sm',
    'font-sans',
    'transition-colors duration-150',
    'focus:outline-none',
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
    : ['text-content-primary'];

  const paddingClasses = [];
  if (iconLeft) paddingClasses.push('pl-10');
  if (iconRight || type === 'password' || type === 'search') paddingClasses.push('pr-10');

  const inputClasses = [
    ...baseInputClasses,
    ...stateClasses,
    ...disabledClasses,
    ...paddingClasses,
    className,
  ].filter(Boolean).join(' ');

  // Handlers
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleClear = () => {
    if (onChange) {
      const syntheticEvent = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className={`block ${sizeClasses.label} text-content-primary font-medium`}>
          {label}
          {required && <span className="text-error-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {iconLeft && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${sizeClasses.icon} text-content-tertiary pointer-events-none`} aria-hidden="true">
            {iconLeft}
          </div>
        )}

        {/* Input */}
        <input
          id={inputId}
          type={actualType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedby}
          aria-required={required}
          className={inputClasses}
          {...props}
        />

        {/* Right Icon or Actions */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Error Icon */}
          {hasError && (
            <svg
              className={`${sizeClasses.icon} text-error-500`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          )}

          {/* Password Toggle */}
          {!hasError && type === 'password' && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={`${sizeClasses.icon} text-content-tertiary hover:text-content-primary transition-colors`}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          )}

          {/* Search Clear Button */}
          {!hasError && type === 'search' && value && (
            <button
              type="button"
              onClick={handleClear}
              className={`${sizeClasses.icon} text-content-tertiary hover:text-content-primary transition-colors`}
              aria-label="Clear search"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Custom Right Icon */}
          {!hasError && iconRight && type !== 'password' && type !== 'search' && (
            <div className={`${sizeClasses.icon} text-content-tertiary`} aria-hidden="true">
              {iconRight}
            </div>
          )}
        </div>
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
