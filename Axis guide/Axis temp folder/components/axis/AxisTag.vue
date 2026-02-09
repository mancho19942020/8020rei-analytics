<script setup lang="ts">
/**
 * AxisTag Component
 *
 * A small label used to categorize or highlight content. Useful for filtering,
 * sorting, or adding context. Based on Kairo design system Tag component.
 *
 * USAGE:
 * <AxisTag>Label</AxisTag>
 * <AxisTag color="success">Active</AxisTag>
 * <AxisTag color="error" dot>Failed</AxisTag>
 * <AxisTag :icon-left="UserIcon" dismissible @dismiss="handleDismiss">User</AxisTag>
 *
 * VARIANTS (Type):
 * - only (default): Text only
 * - dot: Status dot indicator on left
 * - icon-left: Custom icon on left
 * - dismissible: X button on right to remove
 * - icon-and-dismiss: Both left icon and dismiss button
 *
 * COLORS:
 * - neutral (default): Gray - general labels, categories
 * - main: Green (brand) - primary categorization
 * - success: Green - positive status, completed, active
 * - alert: Yellow/amber - warnings, pending, caution
 * - error: Red - errors, failed, critical
 * - info: Blue - informational, links, references
 * - accent: Indigo/purple - special highlights
 * - cyan: Cyan/teal - alternative accent
 *
 * SIZES:
 * - sm: 24px height - compact spaces, tables
 * - md (default): 28px height - standard use
 *
 * STYLES:
 * - filled (default): Solid background with matching text
 * - outlined: Border only, transparent background
 *
 * ACCESSIBILITY:
 * - Dismiss button has aria-label
 * - Icons are aria-hidden
 * - Uses appropriate semantic markup
 */

import type { Component } from "vue";
import { XMarkIcon } from "@heroicons/vue/20/solid";

interface Props {
  /** Tag color scheme */
  color?: "neutral" | "main" | "success" | "alert" | "error" | "info" | "accent" | "cyan";
  /** Tag size */
  size?: "sm" | "md";
  /** Tag style - filled or outlined */
  variant?: "filled" | "outlined";
  /** Show status dot on left */
  dot?: boolean;
  /** Icon component to display on the left */
  iconLeft?: Component | null;
  /** Show dismiss (X) button */
  dismissible?: boolean;
  /** Alias for dismissible - show remove (X) button */
  removable?: boolean;
  /** Disable the tag (visual only, non-interactive) */
  disabled?: boolean;
  /** Make the tag draggable for reordering */
  draggable?: boolean;
  /** Tag label text (alternative to slot) */
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  color: "neutral",
  size: "md",
  variant: "filled",
  dot: false,
  iconLeft: null,
  dismissible: false,
  removable: false,
  disabled: false,
  draggable: false,
  label: undefined,
});

const emit = defineEmits<{
  (e: "dismiss"): void;
  (e: "remove"): void;
  (e: "dragstart", event: DragEvent): void;
  (e: "dragover", event: DragEvent): void;
  (e: "drop", event: DragEvent): void;
}>();

// Check if tag should be dismissible (either prop)
const isDismissible = computed(() => props.dismissible || props.removable);

// Size-based classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      tag: "h-6 px-2 text-label gap-1.5",
      icon: "w-3.5 h-3.5",
      dot: "w-1.5 h-1.5",
      dismiss: "w-3.5 h-3.5 -mr-0.5",
    },
    md: {
      tag: "h-7 px-2.5 text-label gap-2",
      icon: "w-4 h-4",
      dot: "w-2 h-2",
      dismiss: "w-4 h-4 -mr-0.5",
    },
  };
  return sizes[props.size];
});

// Color-based classes with dark mode support
const colorClasses = computed(() => {
  if (props.disabled) {
    return props.variant === "filled"
      ? {
          container: "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500",
          dot: "bg-neutral-400 dark:bg-neutral-500",
          dismiss: "text-neutral-400 dark:text-neutral-500 hover:text-neutral-500 dark:hover:text-neutral-400",
        }
      : {
          container: "bg-transparent border border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500",
          dot: "bg-neutral-400 dark:bg-neutral-500",
          dismiss: "text-neutral-400 dark:text-neutral-500 hover:text-neutral-500 dark:hover:text-neutral-400",
        };
  }

  const colors = {
    neutral: {
      filled: {
        container: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200",
        dot: "bg-neutral-500 dark:bg-neutral-400",
        dismiss: "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
      },
      outlined: {
        container: "bg-transparent border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200",
        dot: "bg-neutral-500 dark:bg-neutral-400",
        dismiss: "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
      },
    },
    main: {
      filled: {
        container: "bg-main-100 dark:bg-main-900/40 text-main-800 dark:text-main-200",
        dot: "bg-main-500",
        dismiss: "text-main-600 dark:text-main-400 hover:text-main-800 dark:hover:text-main-200",
      },
      outlined: {
        container: "bg-transparent border border-main-300 dark:border-main-700 text-main-800 dark:text-main-200",
        dot: "bg-main-500",
        dismiss: "text-main-600 dark:text-main-400 hover:text-main-800 dark:hover:text-main-200",
      },
    },
    success: {
      filled: {
        container: "bg-success-100 dark:bg-success-900/40 text-success-800 dark:text-success-200",
        dot: "bg-success-500",
        dismiss: "text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-200",
      },
      outlined: {
        container: "bg-transparent border border-success-300 dark:border-success-700 text-success-800 dark:text-success-200",
        dot: "bg-success-500",
        dismiss: "text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-200",
      },
    },
    alert: {
      filled: {
        container: "bg-alert-100 dark:bg-alert-900/40 text-alert-800 dark:text-alert-200",
        dot: "bg-alert-500",
        dismiss: "text-alert-600 dark:text-alert-400 hover:text-alert-800 dark:hover:text-alert-200",
      },
      outlined: {
        container: "bg-transparent border border-alert-300 dark:border-alert-700 text-alert-800 dark:text-alert-200",
        dot: "bg-alert-500",
        dismiss: "text-alert-600 dark:text-alert-400 hover:text-alert-800 dark:hover:text-alert-200",
      },
    },
    error: {
      filled: {
        container: "bg-error-100 dark:bg-error-900/40 text-error-800 dark:text-error-200",
        dot: "bg-error-500",
        dismiss: "text-error-600 dark:text-error-400 hover:text-error-800 dark:hover:text-error-200",
      },
      outlined: {
        container: "bg-transparent border border-error-300 dark:border-error-700 text-error-800 dark:text-error-200",
        dot: "bg-error-500",
        dismiss: "text-error-600 dark:text-error-400 hover:text-error-800 dark:hover:text-error-200",
      },
    },
    info: {
      filled: {
        container: "bg-info-100 dark:bg-info-900/40 text-info-800 dark:text-info-200",
        dot: "bg-info-500",
        dismiss: "text-info-600 dark:text-info-400 hover:text-info-800 dark:hover:text-info-200",
      },
      outlined: {
        container: "bg-transparent border border-info-300 dark:border-info-700 text-info-800 dark:text-info-200",
        dot: "bg-info-500",
        dismiss: "text-info-600 dark:text-info-400 hover:text-info-800 dark:hover:text-info-200",
      },
    },
    accent: {
      filled: {
        container: "bg-accent-1-100 dark:bg-accent-1-900/40 text-accent-1-800 dark:text-accent-1-200",
        dot: "bg-accent-1-500",
        dismiss: "text-accent-1-600 dark:text-accent-1-400 hover:text-accent-1-800 dark:hover:text-accent-1-200",
      },
      outlined: {
        container: "bg-transparent border border-accent-1-300 dark:border-accent-1-700 text-accent-1-800 dark:text-accent-1-200",
        dot: "bg-accent-1-500",
        dismiss: "text-accent-1-600 dark:text-accent-1-400 hover:text-accent-1-800 dark:hover:text-accent-1-200",
      },
    },
    cyan: {
      filled: {
        container: "bg-accent-2-100 dark:bg-accent-2-900/40 text-accent-2-800 dark:text-accent-2-200",
        dot: "bg-accent-2-500",
        dismiss: "text-accent-2-600 dark:text-accent-2-400 hover:text-accent-2-800 dark:hover:text-accent-2-200",
      },
      outlined: {
        container: "bg-transparent border border-accent-2-300 dark:border-accent-2-700 text-accent-2-800 dark:text-accent-2-200",
        dot: "bg-accent-2-500",
        dismiss: "text-accent-2-600 dark:text-accent-2-400 hover:text-accent-2-800 dark:hover:text-accent-2-200",
      },
    },
  };

  return colors[props.color][props.variant];
});

// Combined tag classes
const tagClasses = computed(() => [
  // Base styles
  "inline-flex items-center font-medium rounded whitespace-nowrap",
  // Transition
  "transition-colors duration-150",
  // Size
  sizeClasses.value.tag,
  // Color/variant
  colorClasses.value.container,
  // Disabled state
  props.disabled ? "cursor-not-allowed opacity-75" : "",
  // Draggable state
  props.draggable && !props.disabled ? "cursor-move" : "",
]);

// Handle dismiss/remove click
const handleDismiss = (event: MouseEvent) => {
  event.stopPropagation();
  if (!props.disabled) {
    emit("dismiss");
    emit("remove");
  }
};

// Handle drag events
const handleDragStart = (event: DragEvent) => {
  if (!props.disabled && props.draggable) {
    emit("dragstart", event);
  }
};

const handleDragOver = (event: DragEvent) => {
  if (!props.disabled && props.draggable) {
    emit("dragover", event);
  }
};

const handleDrop = (event: DragEvent) => {
  if (!props.disabled && props.draggable) {
    emit("drop", event);
  }
};
</script>

<template>
  <span
    :class="tagClasses"
    :draggable="draggable && !disabled"
    @dragstart="handleDragStart"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <!-- Status dot -->
    <span
      v-if="dot && !iconLeft"
      :class="['rounded-full shrink-0', sizeClasses.dot, colorClasses.dot]"
      aria-hidden="true"
    />

    <!-- Left icon -->
    <component
      :is="iconLeft"
      v-if="iconLeft"
      :class="['shrink-0', sizeClasses.icon]"
      aria-hidden="true"
    />

    <!-- Tag text -->
    <span class="truncate">
      <slot>{{ label }}</slot>
    </span>

    <!-- Dismiss button -->
    <button
      v-if="isDismissible"
      type="button"
      :class="[
        'shrink-0 rounded transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-current',
        sizeClasses.dismiss,
        colorClasses.dismiss,
        disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/10',
      ]"
      :disabled="disabled"
      aria-label="Remove tag"
      @click="handleDismiss"
    >
      <XMarkIcon class="w-full h-full" aria-hidden="true" />
    </button>
  </span>
</template>
