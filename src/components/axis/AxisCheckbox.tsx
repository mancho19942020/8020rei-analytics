/**
 * AxisCheckbox Component (React/Next.js version)
 *
 * A checkbox input component following Axis design system specifications.
 *
 * USAGE:
 * <AxisCheckbox checked={agreed} onChange={setAgreed} label="I agree to the terms" />
 * <AxisCheckbox checked={selected} onChange={setSelected} label="Option" hint="Additional context" />
 * <AxisCheckbox checked={value} onChange={setValue} label="Required" error={errorMessage} />
 * <AxisCheckbox checked={all} onChange={setAll} label="Select all" indeterminate={someSelected} />
 *
 * STATES:
 * - default: Unchecked, ready for interaction
 * - checked: Selected state with checkmark
 * - indeterminate: Partially selected (for parent checkboxes)
 * - hover: Visual feedback on mouse hover
 * - focus: Keyboard focus indicator
 * - disabled: Non-interactive state
 * - error: Validation error state
 *
 * ACCESSIBILITY:
 * - Uses semantic <input type="checkbox"> element
 * - Label properly associated via id
 * - Error messages linked via aria-describedby
 * - Supports keyboard navigation (Space to toggle)
 * - Focus visible ring for keyboard users
 * - Indeterminate state announced via aria-checked="mixed"
 */

'use client';

import React, { useRef, useEffect, useId, InputHTMLAttributes } from 'react';

export interface AxisCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /** Checkbox checked state */
  checked?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Hint/helper text shown below label */
  hint?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Disable the checkbox */
  disabled?: boolean;
  /** Indeterminate state (for parent checkboxes) */
  indeterminate?: boolean;
  /** Mark as required */
  required?: boolean;
}

export function AxisCheckbox({
  checked = false,
  onChange,
  label,
  hint,
  error,
  disabled = false,
  indeterminate = false,
  required = false,
  id,
  name,
  value,
  className = '',
  ...props
}: AxisCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id || `axis-checkbox-${generatedId}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const hasError = !!error;

  // Compute describedby for accessibility
  const ariaDescribedby = (() => {
    const ids: string[] = [];
    if (hasError) ids.push(errorId);
    if (hint && !hasError) ids.push(hintId);
    return ids.length > 0 ? ids.join(' ') : undefined;
  })();

  // Set indeterminate state on input element
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  // Handle change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (onChange) {
      onChange(event.target.checked);
    }
  };

  // Checkbox visual container classes
  const checkboxClasses = [
    'relative shrink-0 w-5 h-5 rounded border-2 transition-colors duration-200',
    'flex items-center justify-center',
    disabled
      ? 'bg-neutral-100 dark:bg-neutral-800 border-stroke-strong cursor-not-allowed'
      : hasError
      ? checked || indeterminate
        ? 'bg-error-700 border-error-700 group-hover:bg-error-500 group-hover:border-error-500'
        : 'bg-white dark:bg-neutral-900 border-error-700 group-hover:border-error-500'
      : checked || indeterminate
      ? 'bg-main-700 border-main-900 group-hover:bg-main-700 group-hover:border-main-700'
      : 'bg-white dark:bg-neutral-900 border-stroke-strong group-hover:bg-main-50 dark:group-hover:bg-main-950 group-hover:border-main-700',
  ].filter(Boolean).join(' ');

  // Label text classes
  const labelClasses = [
    'text-body-regular select-none',
    disabled
      ? 'text-content-disabled cursor-not-allowed'
      : hasError
      ? 'text-error-700 dark:text-error-400 cursor-pointer group-hover:text-error-500 dark:group-hover:text-error-300'
      : checked
      ? 'text-main-900 dark:text-main-100 cursor-pointer group-hover:text-main-700 dark:group-hover:text-main-300'
      : 'text-content-secondary cursor-pointer group-hover:text-main-700 dark:group-hover:text-main-300',
  ].filter(Boolean).join(' ');

  // Hint text classes
  const hintClasses = [
    'text-suggestion',
    disabled
      ? 'text-content-disabled'
      : hasError
      ? 'text-error-700 dark:text-error-400'
      : 'text-content-tertiary',
  ].filter(Boolean).join(' ');

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Checkbox with label */}
      <label
        htmlFor={inputId}
        className={`group inline-flex gap-3 items-start ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {/* Custom checkbox visual */}
        <span className={checkboxClasses}>
          {/* Hidden native input */}
          <input
            ref={inputRef}
            id={inputId}
            type="checkbox"
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            required={required}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={ariaDescribedby}
            aria-required={required ? 'true' : undefined}
            aria-checked={indeterminate ? 'mixed' : checked ? 'true' : 'false'}
            className="sr-only"
            onChange={handleChange}
            {...props}
          />

          {/* Checkmark icon (shown when checked) */}
          {checked && !indeterminate && (
            <svg
              className={`w-4 h-4 ${disabled ? 'text-neutral-400' : 'text-white'}`}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M13.3334 4L6.00008 11.3333L2.66675 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* Indeterminate icon (dash) */}
          {indeterminate && (
            <svg
              className={`w-4 h-4 ${disabled ? 'text-neutral-400' : 'text-white'}`}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 8H13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}

          {/* Focus ring */}
          <span
            className="absolute inset-0 rounded ring-2 ring-main-500 ring-offset-2 opacity-0 group-focus-within:opacity-100 transition-opacity"
            aria-hidden="true"
          />
        </span>

        {/* Label and hint text */}
        {(label || hint) && (
          <span className="flex flex-col pt-0.5">
            {label && (
              <span className={labelClasses}>
                {label}
                {required && <span className="text-error-500 ml-0.5">*</span>}
              </span>
            )}
            {hint && !error && (
              <span id={hintId} className={hintClasses}>
                {hint}
              </span>
            )}
          </span>
        )}
      </label>

      {/* Error message (below the checkbox row) */}
      {error && (
        <p
          id={errorId}
          className="text-suggestion text-error-700 dark:text-error-400 mt-1 ml-8"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
