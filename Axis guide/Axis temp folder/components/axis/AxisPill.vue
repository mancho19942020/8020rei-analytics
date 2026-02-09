<script setup lang="ts">
/**
 * AxisPill Component
 *
 * A compact, non-clickable label used to display key metrics or values,
 * emphasizing clarity without interaction. Used in insights bars and dashboards.
 *
 * USAGE:
 * <AxisPill label="Properties" value="45K" />
 * <AxisPill label="Revenue" value="$99.9K" type="good" />
 * <AxisPill label="Churn" value="12%" type="bad" />
 *
 * TYPES:
 * - default: Neutral styling - general metrics
 * - good: Green value - positive metrics (growth, profit, success)
 * - bad: Red value - negative metrics (loss, churn, errors)
 *
 * FEATURES:
 * - Raised background for visual distinction
 * - Label + value layout with semantic coloring
 * - Non-interactive by design (display-only)
 * - Designed for insights bars and metric displays
 *
 * ACCESSIBILITY:
 * - Uses semantic markup
 * - Clear visual hierarchy between label and value
 */

interface Props {
  /** The metric label/description */
  label: string;
  /** The metric value to display */
  value: string | number;
  /** Type determines value color - default, good (green), bad (red) */
  type?: "default" | "good" | "bad";
}

const props = withDefaults(defineProps<Props>(), {
  type: "default",
});

// Type-based value color classes with dark mode support
const valueColorClass = computed(() => {
  const typeColors = {
    default: "text-content-primary",
    good: "text-success-700 dark:text-success-400",
    bad: "text-error-700 dark:text-error-400",
  };
  return typeColors[props.type];
});
</script>

<template>
  <div
    class="flex-1 flex items-center justify-between px-3 py-1.5 bg-surface-raised rounded-lg"
  >
    <!-- Label -->
    <span class="text-label text-content-tertiary whitespace-nowrap">
      {{ label }}:
    </span>

    <!-- Value -->
    <span :class="['text-h5 whitespace-nowrap tabular-nums', valueColorClass]">
      {{ value }}
    </span>
  </div>
</template>
