<script setup lang="ts">
/**
 * AxisButtonGroup Component
 *
 * A group of buttons for selecting between related options within the same view.
 * Based on Kairo design system with Material Design best practices.
 *
 * USAGE:
 * <AxisButtonGroup v-model="selected" :options="options" />
 * <AxisButtonGroup v-model="selected" :options="options" size="lg" />
 * <AxisButtonGroup v-model="selected" :options="options" multiple />
 *
 * PRIMARY USE:
 * - Choosing between related actions or states within the same component
 * - Filters, modes, or adjustments that modify the same view
 * - Toggle-type actions (e.g., enabling/disabling states)
 * - When buttons perform similar functions but do not navigate to different content
 *
 * VARIANTS:
 * - outlined (default): Border-based buttons
 * - filled: Solid background for selected state
 *
 * SIZES:
 * - sm: 28px height - compact spaces
 * - md (default): 36px height - standard use
 * - lg: 44px height - prominent controls
 *
 * ACCESSIBILITY:
 * - Uses proper role="group" with aria-label
 * - Each button is focusable with keyboard navigation
 * - Selected state communicated via aria-pressed
 */

import type { Component } from 'vue'

interface ButtonOption {
  /** Unique value for the option */
  value: string | number
  /** Display label (text shown in button) */
  label?: string
  /** Icon component (optional, can be used with or without label) */
  icon?: Component
  /** Disable this specific option */
  disabled?: boolean
}

interface Props {
  /** Selected value(s) - single value or array for multiple selection */
  modelValue: string | number | (string | number)[]
  /** Available options */
  options: ButtonOption[]
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Allow multiple selection */
  multiple?: boolean
  /** Disable the entire group */
  disabled?: boolean
  /** Accessible label for the button group */
  ariaLabel?: string
  /** Full width - buttons fill container */
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  multiple: false,
  disabled: false,
  ariaLabel: 'Button group',
  fullWidth: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | (string | number)[]): void
}>()

// Check if an option is selected
const isSelected = (value: string | number): boolean => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(value)
  }
  return props.modelValue === value
}

// Handle button click
const handleClick = (value: string | number, optionDisabled?: boolean) => {
  if (props.disabled || optionDisabled) return

  if (props.multiple) {
    const currentValue = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const index = currentValue.indexOf(value)

    if (index === -1) {
      currentValue.push(value)
    } else {
      currentValue.splice(index, 1)
    }

    emit('update:modelValue', currentValue)
  } else {
    emit('update:modelValue', value)
  }
}

// Size-based classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      button: 'h-7 px-3 text-label',
      icon: 'w-4 h-4',
      gap: 'gap-1.5',
    },
    md: {
      button: 'h-9 px-4 text-body-regular',
      icon: 'w-5 h-5',
      gap: 'gap-2',
    },
    lg: {
      button: 'h-11 px-5 text-body-large',
      icon: 'w-5 h-5',
      gap: 'gap-2',
    },
  }
  return sizes[props.size]
})

// Get position-based border radius classes
const getPositionClasses = (index: number, total: number) => {
  if (total === 1) return 'rounded'
  if (index === 0) return 'rounded-l border-r-0'
  if (index === total - 1) return 'rounded-r'
  return 'rounded-none border-r-0'
}

// Get button classes based on state
const getButtonClasses = (option: ButtonOption, index: number) => {
  const selected = isSelected(option.value)
  const isDisabled = props.disabled || option.disabled

  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium',
    'border border-stroke',
    'transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-2 focus-visible:z-10',
    sizeClasses.value.button,
    sizeClasses.value.gap,
    getPositionClasses(index, props.options.length),
  ]

  if (isDisabled) {
    baseClasses.push(
      'cursor-not-allowed',
      'bg-neutral-50 dark:bg-neutral-800',
      'text-neutral-300 dark:text-neutral-600',
      'border-neutral-200 dark:border-neutral-700',
    )
  } else if (selected) {
    baseClasses.push(
      'cursor-pointer',
      'bg-main-700 dark:bg-main-600',
      'text-white',
      'border-main-700 dark:border-main-600',
      'hover:bg-main-800 dark:hover:bg-main-500',
    )
  } else {
    baseClasses.push(
      'cursor-pointer',
      'bg-surface-base',
      'text-content-secondary',
      'hover:bg-neutral-50 dark:hover:bg-neutral-800',
      'hover:text-content-primary',
    )
  }

  return baseClasses
}
</script>

<template>
  <div
    role="group"
    :aria-label="ariaLabel"
    :class="[
      'inline-flex',
      fullWidth ? 'w-full' : '',
    ]"
  >
    <button
      v-for="(option, index) in options"
      :key="option.value"
      type="button"
      :aria-pressed="isSelected(option.value)"
      :disabled="disabled || option.disabled"
      :class="[
        ...getButtonClasses(option, index),
        fullWidth ? 'flex-1' : '',
      ]"
      @click="handleClick(option.value, option.disabled)"
    >
      <!-- Icon (optional) -->
      <component
        :is="option.icon"
        v-if="option.icon"
        :class="sizeClasses.icon"
        aria-hidden="true"
      />

      <!-- Label (optional) -->
      <span v-if="option.label">{{ option.label }}</span>
    </button>
  </div>
</template>
