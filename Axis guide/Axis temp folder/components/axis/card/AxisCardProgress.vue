<script setup lang="ts">
/**
 * AxisCardProgress Component
 *
 * A simple progress bar component for use within stat cards or standalone.
 * Supports multiple colors and sizes.
 *
 * USAGE:
 * <AxisCardProgress :value="75" color="success" />
 * <AxisCardProgress :value="30" color="error" size="lg" show-label />
 */

type ProgressColor = "neutral" | "main" | "success" | "error" | "accent";
type ProgressSize = "sm" | "md" | "lg";

interface Props {
  /** Progress value (0-100) */
  value?: number;
  /** Bar color */
  color?: ProgressColor;
  /** Bar height size */
  size?: ProgressSize;
  /** Show percentage label */
  showLabel?: boolean;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  color: "main",
  size: "md",
  showLabel: false,
  ariaLabel: "Progress",
});

const clampedValue = computed(() => {
  return Math.max(0, Math.min(100, props.value));
});

const sizeClasses = computed(() => {
  const sizes = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  };
  return sizes[props.size];
});

const colorClasses = computed(() => {
  const colors = {
    neutral: "bg-neutral-500 dark:bg-neutral-400",
    main: "bg-main-500 dark:bg-main-400",
    success: "bg-success-500 dark:bg-success-400",
    error: "bg-error-500 dark:bg-error-400",
    accent: "bg-accent-1-500 dark:bg-accent-1-400",
  };
  return colors[props.color];
});
</script>

<template>
  <div>
    <!-- Progress bar -->
    <div
      :class="[
        'w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden',
        sizeClasses,
      ]"
      role="progressbar"
      :aria-valuenow="clampedValue"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="ariaLabel"
    >
      <div
        :class="[
          'h-full rounded-full transition-all duration-300 ease-out',
          colorClasses,
        ]"
        :style="{ width: `${clampedValue}%` }"
      />
    </div>

    <!-- Optional label -->
    <p
      v-if="showLabel"
      class="text-suggestion text-content-tertiary mt-1"
    >
      {{ clampedValue }}%
    </p>
  </div>
</template>
