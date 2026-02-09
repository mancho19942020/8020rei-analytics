<script setup lang="ts">
/**
 * AxisCardBody Component
 *
 * Body section wrapper for AxisCard with optional padding control.
 * Provides consistent spacing for card content.
 *
 * USAGE:
 * <AxisCard padding="none">
 *   <AxisCardBody>
 *     <p>Card content with default padding</p>
 *   </AxisCardBody>
 * </AxisCard>
 */

type Padding = "none" | "sm" | "md" | "lg";

interface Props {
  /** Internal padding */
  padding?: Padding;
}

const props = withDefaults(defineProps<Props>(), {
  padding: "md",
});

const paddingClasses = computed(() => {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };
  return paddings[props.padding];
});
</script>

<template>
  <div :class="paddingClasses">
    <slot />
  </div>
</template>
