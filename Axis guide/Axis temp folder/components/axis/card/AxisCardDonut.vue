<script setup lang="ts">
/**
 * AxisCardDonut Component
 *
 * A simple donut/ring chart component for use within stat cards or standalone.
 * SVG-based with smooth animations.
 *
 * USAGE:
 * <AxisCardDonut :value="75" color="success" />
 * <AxisCardDonut :value="30" color="error" size="lg" show-value />
 */

type DonutColor = "neutral" | "main" | "success" | "error" | "accent";
type DonutSize = "sm" | "md" | "lg";

interface Props {
  /** Progress value (0-100) */
  value?: number;
  /** Ring color */
  color?: DonutColor;
  /** Chart size */
  size?: DonutSize;
  /** Show value in center */
  showValue?: boolean;
  /** Custom center content (overrides showValue) */
  centerLabel?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  color: "main",
  size: "md",
  showValue: true,
  centerLabel: undefined,
  strokeWidth: 3,
  ariaLabel: "Progress",
});

const clampedValue = computed(() => {
  return Math.max(0, Math.min(100, props.value));
});

// SVG calculations
const radius = 16;
const circumference = 2 * Math.PI * radius;
const offset = computed(() => {
  return circumference - (clampedValue.value / 100) * circumference;
});

const sizeClasses = computed(() => {
  const sizes = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };
  return sizes[props.size];
});

const textSizeClasses = computed(() => {
  const sizes = {
    sm: "text-suggestion",
    md: "text-label-bold",
    lg: "text-body-regular font-bold",
  };
  return sizes[props.size];
});

const colorClasses = computed(() => {
  const colors = {
    neutral: "text-neutral-500 dark:text-neutral-400",
    main: "text-main-500 dark:text-main-400",
    success: "text-success-500 dark:text-success-400",
    error: "text-error-500 dark:text-error-400",
    accent: "text-accent-1-500 dark:text-accent-1-400",
  };
  return colors[props.color];
});

const displayValue = computed(() => {
  if (props.centerLabel) return props.centerLabel;
  return `${clampedValue.value}%`;
});
</script>

<template>
  <div
    :class="['relative', sizeClasses]"
    role="progressbar"
    :aria-valuenow="clampedValue"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="ariaLabel"
  >
    <!-- SVG Donut -->
    <svg
      class="w-full h-full -rotate-90"
      viewBox="0 0 36 36"
    >
      <!-- Background circle -->
      <circle
        cx="18"
        cy="18"
        :r="radius"
        fill="none"
        stroke="currentColor"
        :stroke-width="strokeWidth"
        class="text-neutral-200 dark:text-neutral-700"
      />
      <!-- Progress circle -->
      <circle
        cx="18"
        cy="18"
        :r="radius"
        fill="none"
        stroke="currentColor"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        :class="colorClasses"
        class="transition-all duration-500 ease-out"
      />
    </svg>

    <!-- Center content -->
    <div
      v-if="showValue || centerLabel || $slots.default"
      class="absolute inset-0 flex items-center justify-center"
    >
      <slot>
        <span :class="[textSizeClasses, 'text-content-primary']">
          {{ displayValue }}
        </span>
      </slot>
    </div>
  </div>
</template>
