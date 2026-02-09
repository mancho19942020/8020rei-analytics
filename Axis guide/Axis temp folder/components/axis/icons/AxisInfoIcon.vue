<script setup lang="ts">
/**
 * AxisInfoIcon - Clean Information Icon
 *
 * A custom info icon designed with clean lines (no serif curve on the "i").
 * Matches the aesthetic of Heroicons outline style but with a simpler,
 * more modern information symbol.
 *
 * Use this instead of Heroicons' InformationCircleIcon for consistency
 * across the Axis design system.
 *
 * USAGE:
 * <AxisInfoIcon class="w-5 h-5 text-neutral-600" />
 * <AxisButton :icon-left="AxisInfoIcon">Help</AxisButton>
 */

interface Props {
  /** Additional CSS classes */
  class?: string;
}

defineProps<Props>();
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    :class="$props.class"
    aria-hidden="true"
  >
    <!-- Circle outline -->
    <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
    <!-- Dot for "i" -->
    <circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none" />
    <!-- Line for "i" -->
    <path d="M12 11v5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
