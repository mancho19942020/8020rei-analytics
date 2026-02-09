<script setup lang="ts">
/**
 * AxisCallout Component
 *
 * A contextual feedback component for displaying important messages, tips,
 * warnings, or errors. Features an accent bar on the left for visual emphasis.
 * Based on Kairo design system patterns adapted for Axis.
 *
 * USAGE:
 * <AxisCallout>Default info message</AxisCallout>
 * <AxisCallout type="success" title="Success!">Operation completed.</AxisCallout>
 * <AxisCallout type="warning" dismissible @dismiss="handleDismiss">Warning message</AxisCallout>
 * <AxisCallout type="error" title="Error">
 *   Something went wrong.
 *   <template #actions>
 *     <AxisButton variant="ghost" size="sm">Retry</AxisButton>
 *   </template>
 * </AxisCallout>
 *
 * TYPES:
 * - info (default): Blue accent - general information, tips, guidance
 * - success: Green accent - confirmations, completed actions
 * - warning: Yellow/amber accent - cautions, important notices
 * - error: Red accent - errors, critical issues, destructive warnings
 *
 * FEATURES:
 * - Accent bar on left (8px width) for visual type identification
 * - Optional title for emphasis
 * - Dismissible with X button (disabled by default)
 * - Actions slot for buttons/links (Learn more, Retry, etc.)
 * - Custom icon support (default icons per type)
 *
 * ACCESSIBILITY:
 * - Uses role="alert" for error type, role="status" for others
 * - Dismiss button has aria-label
 * - Icons are aria-hidden
 */

import type { Component } from "vue";
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import AxisInfoIcon from "./icons/AxisInfoIcon.vue";

interface Props {
  /** Callout type determines color scheme and default icon */
  type?: "info" | "success" | "warning" | "error";
  /** Optional title displayed above the body text */
  title?: string;
  /** Show dismiss (X) button - default false */
  dismissible?: boolean;
  /** Custom icon component (overrides default type icon) */
  icon?: Component | null;
  /** Hide the icon entirely */
  hideIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: "info",
  title: undefined,
  dismissible: false,
  icon: undefined,
  hideIcon: false,
});

const emit = defineEmits<{
  (e: "dismiss"): void;
}>();

// Track visibility for dismissible callouts
const isVisible = ref(true);

// Default icons per type
const defaultIcons: Record<string, Component> = {
  info: AxisInfoIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
};

// Get the icon to display
const displayIcon = computed(() => {
  if (props.hideIcon) return null;
  if (props.icon !== undefined) return props.icon;
  return defaultIcons[props.type];
});

// Type-based color classes - with dark mode support
const typeClasses = computed(() => {
  const types = {
    info: {
      container: "bg-accent-1-50 dark:bg-accent-1-950 border-accent-1-200 dark:border-accent-1-800",
      bar: "bg-accent-1-500",
      icon: "text-accent-1-700 dark:text-accent-1-400",
      title: "text-accent-1-900 dark:text-accent-1-100",
      body: "text-accent-1-800 dark:text-accent-1-200",
    },
    success: {
      container: "bg-success-50 dark:bg-success-950 border-success-300 dark:border-success-700",
      bar: "bg-success-500",
      icon: "text-success-700 dark:text-success-400",
      title: "text-success-900 dark:text-success-100",
      body: "text-success-800 dark:text-success-200",
    },
    warning: {
      container: "bg-alert-50 dark:bg-alert-950 border-alert-300 dark:border-alert-700",
      bar: "bg-alert-500",
      icon: "text-alert-700 dark:text-alert-400",
      title: "text-alert-900 dark:text-alert-100",
      body: "text-alert-800 dark:text-alert-200",
    },
    error: {
      container: "bg-error-50 dark:bg-error-950 border-error-300 dark:border-error-700",
      bar: "bg-error-500",
      icon: "text-error-700 dark:text-error-400",
      title: "text-error-900 dark:text-error-100",
      body: "text-error-800 dark:text-error-200",
    },
  };
  return types[props.type];
});

// ARIA role based on type
const ariaRole = computed(() => {
  return props.type === "error" ? "alert" : "status";
});

// Handle dismiss
const handleDismiss = () => {
  isVisible.value = false;
  emit("dismiss");
};
</script>

<template>
  <div
    v-if="isVisible"
    :role="ariaRole"
    :class="[
      'relative flex overflow-hidden rounded-md border',
      typeClasses.container,
    ]"
  >
    <!-- Accent bar -->
    <div
      :class="[
        'absolute left-0 top-0 bottom-0 w-2 shrink-0',
        typeClasses.bar,
      ]"
      aria-hidden="true"
    />

    <!-- Content area -->
    <div class="flex flex-1 items-start gap-3 py-3 pl-5 pr-3">
      <!-- Icon - aligned to baseline of first text line -->
      <component
        :is="displayIcon"
        v-if="displayIcon"
        :class="['w-5 h-5 shrink-0', typeClasses.icon]"
        :style="{ marginTop: '1px' }"
        aria-hidden="true"
      />

      <!-- Text content -->
      <div class="flex-1 min-w-0">
        <!-- Title -->
        <p
          v-if="title"
          :class="['text-body-regular font-semibold', typeClasses.title]"
        >
          {{ title }}
        </p>

        <!-- Body text -->
        <div
          :class="[
            'text-body-regular',
            typeClasses.body,
            title ? 'mt-1' : '',
          ]"
        >
          <slot />
        </div>

        <!-- Actions slot -->
        <div v-if="$slots.actions" class="mt-3 flex items-center gap-2">
          <slot name="actions" />
        </div>
      </div>

      <!-- Dismiss button -->
      <button
        v-if="dismissible"
        type="button"
        :class="[
          'shrink-0 p-1 rounded transition-colors',
          'hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          typeClasses.icon,
        ]"
        aria-label="Dismiss"
        @click="handleDismiss"
      >
        <XMarkIcon class="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
