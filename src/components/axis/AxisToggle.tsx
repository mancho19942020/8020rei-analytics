/**
 * AxisToggle Component (React/Next.js version)
 *
 * A toggle/switch component for binary on/off settings following Axis design system specifications.
 *
 * USAGE:
 * <AxisToggle checked={enabled} onChange={setEnabled} />
 * <AxisToggle checked={setting} onChange={setSetting} label="Enable notifications" />
 * <AxisToggle checked={value} onChange={setValue} label="Dark mode" hint="Use dark theme" />
 *
 * STATES:
 * - default: Ready for interaction
 * - hover: Visual feedback on mouse hover
 * - focus: Keyboard focus indicator
 * - active (on/off): The toggled state
 * - disabled: Non-interactive state
 */

'use client';

import React, { useId } from 'react';

export interface AxisToggleProps {
  /** Toggle checked state */
  checked?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Hint/helper text shown below label */
  hint?: string;
  /** Disable the toggle */
  disabled?: boolean;
  /** HTML input name attribute (for forms) */
  name?: string;
  /** HTML id attribute */
  id?: string;
  /** Additional CSS classes */
  className?: string;
}

export function AxisToggle({
  checked = false,
  onChange,
  label,
  hint,
  disabled = false,
  name,
  id,
  className = '',
}: AxisToggleProps) {
  const generatedId = useId();
  const toggleId = id || `axis-toggle-${generatedId}`;
  const labelId = `${toggleId}-label`;
  const hintId = `${toggleId}-hint`;

  const ariaDescribedby = hint ? hintId : undefined;

  const handleToggle = () => {
    if (disabled) return;
    if (onChange) {
      onChange(!checked);
    }
  };

  const handleKeydown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleToggle();
    }
  };

  // Container classes
  const containerClasses = [
    'relative rounded-full transition-all duration-200 ease-out',
    'flex items-center shrink-0',
    'w-12 h-6',
    disabled
      ? 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed'
      : checked
      ? 'bg-main-900 dark:bg-main-700 hover:bg-main-700 dark:hover:bg-main-500 cursor-pointer'
      : 'bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500 cursor-pointer',
  ].filter(Boolean).join(' ');

  // Knob classes
  const knobClasses = [
    'absolute rounded-full transition-all duration-200 ease-out',
    'w-5 h-5',
    'flex items-center justify-center',
    disabled ? 'bg-neutral-200 dark:bg-neutral-700' : 'bg-white',
    checked ? 'left-6' : 'left-0.5',
  ].filter(Boolean).join(' ');

  return (
    <div className={`flex gap-3 ${className}`}>
      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        id={toggleId}
        aria-checked={checked}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={ariaDescribedby}
        disabled={disabled}
        className={`${containerClasses} focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-2`}
        onClick={handleToggle}
        onKeyDown={handleKeydown}
      >
        <span className={knobClasses} />
      </button>

      {/* Label and hint */}
      {(label || hint) && (
        <div className="flex flex-col">
          {label && (
            <label
              id={labelId}
              htmlFor={toggleId}
              className={`text-body-regular select-none ${
                disabled ? 'text-content-disabled cursor-not-allowed' : 'text-content-primary cursor-pointer'
              }`}
            >
              {label}
            </label>
          )}
          {hint && (
            <span
              id={hintId}
              className={`text-suggestion ${disabled ? 'text-content-disabled' : 'text-content-tertiary'}`}
            >
              {hint}
            </span>
          )}
        </div>
      )}

      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={checked ? 'true' : 'false'}
        />
      )}
    </div>
  );
}
