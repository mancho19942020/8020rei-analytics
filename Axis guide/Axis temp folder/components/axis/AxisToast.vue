<script setup lang="ts">
/**
 * AxisToast Component
 *
 * Transient notification component for brief, non-blocking feedback messages.
 * Auto-dismisses after a configurable duration. Based on Kairo design system
 * patterns adapted for Axis.
 *
 * USAGE:
 * This component is NOT used directly in templates. Use the useToast() composable:
 *
 * const { showToast } = useToast()
 * showToast('Changes saved', 'success')
 * showToast({ title: 'Error', message: 'Failed to save', type: 'error', duration: 5000 })
 *
 * TYPES:
 * - info (default): Blue - general notifications, confirmations
 * - success: Green - successful actions, completions
 * - warning: Yellow/amber - cautions, warnings
 * - error: Red - errors, failures
 *
 * FEATURES:
 * - Auto-dismiss after configurable duration (default 4000ms)
 * - Manual dismiss with X button
 * - Optional action button or link
 * - Slide-in/fade-out animations
 * - Stacks multiple toasts vertically
 * - Respects prefers-reduced-motion
 *
 * ACCESSIBILITY:
 * - Uses role="status" for info/success, role="alert" for warning/error
 * - aria-live="polite" for info/success, "assertive" for warning/error
 * - Dismiss button has aria-label
 * - Icons are aria-hidden
 * - Auto-dismiss provides sufficient time for screen reader announcement
 */

import type { Component } from "vue";
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import AxisInfoIcon from "./icons/AxisInfoIcon.vue";

export interface ToastProps {
  /** Unique ID for this toast (used for dismissal tracking) */
  id: string;
  /** Toast type determines color scheme and default icon */
  type?: "info" | "success" | "warning" | "error";
  /** Optional title displayed in bold */
  title?: string;
  /** Message body text */
  message: string;
  /** Auto-dismiss duration in milliseconds (0 = no auto-dismiss) */
  duration?: number;
  /** Optional action button */
  action?: {
    label: string;
    handler: () => void;
  };
  /** Optional link text (mutually exclusive with action) */
  link?: {
    label: string;
    handler: () => void;
  };
  /**
   * Custom icon component (overrides default type icon)
   * Uses `any` to support all Vue component formats (DefineComponent, FunctionalComponent, etc.)
   */
  icon?: any;
  /** Hide the icon entirely */
  hideIcon?: boolean;
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: "info",
  title: undefined,
  duration: 4000,
  action: undefined,
  link: undefined,
  icon: undefined,
  hideIcon: false,
});

const emit = defineEmits<{
  (e: "dismiss", id: string): void;
}>();

// Track visibility for animation
const isVisible = ref(true);
const isExiting = ref(false);

// Default icons per type
const defaultIcons: Record<string, any> = {
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
      container: "bg-accent-1-50 dark:bg-accent-1-950 border-accent-1-300 dark:border-accent-1-700",
      icon: "text-accent-1-700 dark:text-accent-1-400",
      title: "text-accent-1-900 dark:text-accent-1-100",
      message: "text-accent-1-800 dark:text-accent-1-200",
      closeHover: "hover:bg-accent-1-200/50 dark:hover:bg-accent-1-800/50",
    },
    success: {
      container: "bg-success-50 dark:bg-success-950 border-success-300 dark:border-success-700",
      icon: "text-success-700 dark:text-success-400",
      title: "text-success-900 dark:text-success-100",
      message: "text-success-800 dark:text-success-200",
      closeHover: "hover:bg-success-200/50 dark:hover:bg-success-800/50",
    },
    warning: {
      container: "bg-alert-50 dark:bg-alert-950 border-alert-300 dark:border-alert-700",
      icon: "text-alert-700 dark:text-alert-400",
      title: "text-alert-900 dark:text-alert-100",
      message: "text-alert-800 dark:text-alert-200",
      closeHover: "hover:bg-alert-200/50 dark:hover:bg-alert-800/50",
    },
    error: {
      container: "bg-error-50 dark:bg-error-950 border-error-300 dark:border-error-700",
      icon: "text-error-700 dark:text-error-400",
      title: "text-error-900 dark:text-error-100",
      message: "text-error-800 dark:text-error-200",
      closeHover: "hover:bg-error-200/50 dark:hover:bg-error-800/50",
    },
  };
  return types[props.type];
});

// ARIA attributes based on type
const ariaRole = computed(() => {
  return props.type === "warning" || props.type === "error" ? "alert" : "status";
});

const ariaLive = computed(() => {
  return props.type === "warning" || props.type === "error" ? "assertive" : "polite";
});

// Auto-dismiss timer
let dismissTimer: NodeJS.Timeout | null = null;

onMounted(() => {
  if (props.duration > 0) {
    dismissTimer = setTimeout(() => {
      handleDismiss();
    }, props.duration);
  }
});

onUnmounted(() => {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
  }
});

// Handle dismiss with animation
const handleDismiss = () => {
  isExiting.value = true;
  // Wait for exit animation to complete
  setTimeout(() => {
    isVisible.value = false;
    emit("dismiss", props.id);
  }, 200); // Match animation duration
};

// Handle action click
const handleAction = () => {
  if (props.action) {
    props.action.handler();
    handleDismiss();
  }
};

// Handle link click
const handleLink = () => {
  if (props.link) {
    props.link.handler();
    handleDismiss();
  }
};
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="transform translate-x-full opacity-0"
    enter-to-class="transform translate-x-0 opacity-100"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="transform translate-x-0 opacity-100"
    leave-to-class="transform translate-x-full opacity-0"
  >
    <div
      v-if="isVisible"
      :role="ariaRole"
      :aria-live="ariaLive"
      :class="[
        'flex items-start gap-3 rounded-lg border shadow-lg p-4 min-w-[320px] max-w-[480px]',
        typeClasses.container,
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
      ]"
    >
      <!-- Icon -->
      <component
        :is="displayIcon"
        v-if="displayIcon"
        :class="['w-5 h-5 shrink-0 mt-0.5', typeClasses.icon]"
        aria-hidden="true"
      />

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Title (optional) -->
        <p
          v-if="title"
          :class="['text-body-regular font-semibold', typeClasses.title]"
        >
          {{ title }}
        </p>

        <!-- Message -->
        <p
          :class="[
            'text-body-regular',
            typeClasses.message,
            title ? 'mt-0.5' : '',
          ]"
        >
          {{ message }}
        </p>

        <!-- Action or Link (mutually exclusive) -->
        <div v-if="action || link" class="mt-2">
          <!-- Action Button -->
          <button
            v-if="action"
            type="button"
            :class="[
              'text-label-bold transition-colors rounded px-2 py-1 -ml-2',
              typeClasses.title,
              typeClasses.closeHover,
            ]"
            @click="handleAction"
          >
            {{ action.label }}
          </button>

          <!-- Link -->
          <button
            v-if="link"
            type="button"
            :class="[
              'text-label-bold underline transition-colors',
              typeClasses.title,
            ]"
            @click="handleLink"
          >
            {{ link.label }}
          </button>
        </div>
      </div>

      <!-- Close button -->
      <button
        type="button"
        :class="[
          'shrink-0 p-1 rounded transition-colors',
          typeClasses.icon,
          typeClasses.closeHover,
        ]"
        aria-label="Dismiss notification"
        @click="handleDismiss"
      >
        <XMarkIcon class="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </Transition>
</template>
