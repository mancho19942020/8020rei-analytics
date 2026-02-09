<script setup lang="ts">
/**
 * AxisButton Component
 *
 * A versatile button component following Axis design system specifications.
 * Based on Kairo design system with Material Design best practices.
 *
 * USAGE:
 * <AxisButton>Click me</AxisButton>
 * <AxisButton variant="outlined" size="lg">Large Outlined</AxisButton>
 * <AxisButton variant="ghost" :icon-left="PlusIcon">Add Item</AxisButton>
 * <AxisButton destructive>Delete</AxisButton>
 * <AxisButton :loading="true">Processing...</AxisButton>
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

import type { Component } from "vue";

interface Props {
  /** Button visual style */
  variant?: "filled" | "outlined" | "ghost";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Destructive action styling (red colors) */
  destructive?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Icon component to display on the left */
  iconLeft?: Component | null;
  /** Icon component to display on the right */
  iconRight?: Component | null;
  /** Icon-only button (no text) */
  iconOnly?: boolean;
  /** HTML button type attribute */
  type?: "button" | "submit" | "reset";
  /** Full width button */
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "filled",
  size: "md",
  destructive: false,
  disabled: false,
  loading: false,
  iconLeft: null,
  iconRight: null,
  iconOnly: false,
  type: "button",
  fullWidth: false,
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

// Compute if button should be interactive
const isDisabled = computed(() => props.disabled || props.loading);

// Size-based classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      button: props.iconOnly ? "h-7 w-7" : "h-7 px-3",
      text: "text-button-small",
      icon: "w-4 h-4",
      gap: "gap-1.5",
    },
    md: {
      button: props.iconOnly ? "h-9 w-9" : "h-9 px-4",
      text: "text-button-regular",
      icon: "w-5 h-5",
      gap: "gap-2",
    },
    lg: {
      button: props.iconOnly ? "h-11 w-11" : "h-11 px-5",
      text: "text-button-large",
      icon: "w-5 h-5",
      gap: "gap-2",
    },
  };
  return sizes[props.size];
});

// Variant + destructive state classes
// Updated for dark mode support using semantic tokens and dark: variants
const variantClasses = computed(() => {
  if (props.destructive) {
    // Destructive variants (red) - with dark mode support
    const destructiveVariants = {
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
    };
    return destructiveVariants[props.variant];
  }

  // Standard variants (main color) - with dark mode support
  const standardVariants = {
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
  };
  return standardVariants[props.variant];
});

// Combined button classes
const buttonClasses = computed(() => {
  return [
    // Base styles
    "inline-flex items-center justify-center",
    "rounded-sm",
    "font-medium",
    "transition-colors duration-150",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-2",
    // Size
    sizeClasses.value.button,
    sizeClasses.value.text,
    sizeClasses.value.gap,
    // Variant
    variantClasses.value,
    // Full width
    props.fullWidth ? "w-full" : "",
    // Disabled cursor
    isDisabled.value ? "cursor-not-allowed" : "cursor-pointer",
  ];
});

// Handle click
const handleClick = (event: MouseEvent) => {
  if (!isDisabled.value) {
    emit("click", event);
  }
};
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :aria-disabled="loading ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :class="buttonClasses"
    @click="handleClick"
  >
    <!-- Loading spinner -->
    <svg
      v-if="loading"
      class="animate-spin"
      :class="sizeClasses.icon"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>

    <!-- Left icon -->
    <component
      :is="iconLeft"
      v-else-if="iconLeft"
      :class="sizeClasses.icon"
      aria-hidden="true"
    />

    <!-- Button text -->
    <span v-if="!iconOnly && $slots.default">
      <slot />
    </span>

    <!-- Right icon -->
    <component
      :is="iconRight"
      v-if="iconRight && !loading"
      :class="sizeClasses.icon"
      aria-hidden="true"
    />
  </button>
</template>
