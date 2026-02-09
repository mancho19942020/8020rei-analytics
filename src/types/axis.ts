/**
 * Axis Design System - TypeScript Type Definitions
 *
 * Shared types and interfaces for all Axis components.
 * Following Axis design system specifications.
 */

import { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// ============================================
// COMMON TYPES
// ============================================

/** Common size variants used across components */
export type Size = 'sm' | 'md' | 'lg';

/** Common variant types for styled components */
export type ButtonVariant = 'filled' | 'outlined' | 'ghost';
export type CalloutVariant = 'info' | 'success' | 'alert' | 'error';
export type CardVariant = 'default' | 'outlined' | 'elevated';

/** Theme preferences */
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

// ============================================
// BUTTON TYPES
// ============================================

export interface AxisButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: Size;
  destructive?: boolean;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  iconOnly?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  children?: ReactNode;
}

// ============================================
// INPUT TYPES
// ============================================

export interface AxisInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: Size;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

// ============================================
// SELECT TYPES
// ============================================

export interface AxisSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface AxisSelectProps {
  options: AxisSelectOption[];
  value?: string | number | string[] | number[];
  onChange?: (value: string | number | string[] | number[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  size?: Size;
  fullWidth?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

// ============================================
// CARD TYPES
// ============================================

export interface AxisCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: boolean;
  hoverable?: boolean;
  children: ReactNode;
}

export interface AxisCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export interface AxisCardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface AxisCardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// ============================================
// CHECKBOX & RADIO TYPES
// ============================================

export interface AxisCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  name?: string;
  value?: string;
  className?: string;
}

export interface AxisRadioProps {
  checked?: boolean;
  onChange?: (value: string) => void;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  name?: string;
  value: string;
  className?: string;
}

export interface AxisRadioGroupProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

// ============================================
// TOGGLE TYPES
// ============================================

export interface AxisToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: Exclude<Size, 'lg'>;
  className?: string;
}

// ============================================
// CALLOUT TYPES
// ============================================

export interface AxisCalloutProps extends HTMLAttributes<HTMLDivElement> {
  type?: CalloutVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
  children: ReactNode;
}

// ============================================
// TABLE TYPES
// ============================================

export interface AxisTableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface AxisTableProps<T = any> {
  columns: AxisTableColumn<T>[];
  data: T[];
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

// ============================================
// ACCORDION TYPES
// ============================================

export interface AxisAccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
}

export interface AxisAccordionProps {
  children: ReactNode;
  allowMultiple?: boolean;
  className?: string;
}

// ============================================
// TAG & PILL TYPES
// ============================================

export interface AxisTagProps {
  label: string;
  color?: 'main' | 'accent-1' | 'accent-2' | 'accent-3' | 'accent-4' | 'accent-5' | 'neutral';
  removable?: boolean;
  onRemove?: () => void;
  size?: Exclude<Size, 'lg'>;
  className?: string;
}

export interface AxisPillProps {
  label: string;
  variant?: 'info' | 'success' | 'alert' | 'error' | 'neutral';
  size?: Exclude<Size, 'lg'>;
  className?: string;
}

// ============================================
// BREADCRUMB TYPES
// ============================================

export interface AxisBreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

export interface AxisBreadcrumbProps {
  items: AxisBreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

// ============================================
// SLIDER TYPES
// ============================================

export interface AxisSliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
}

// ============================================
// STEPPER TYPES
// ============================================

export interface AxisStepperStep {
  label: string;
  description?: string;
  icon?: ReactNode;
}

export interface AxisStepperProps {
  steps: AxisStepperStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

// ============================================
// TOAST TYPES
// ============================================

export interface AxisToast {
  id: string;
  type?: CalloutVariant;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

export interface AxisToastProps extends AxisToast {
  onDismiss: (id: string) => void;
}
