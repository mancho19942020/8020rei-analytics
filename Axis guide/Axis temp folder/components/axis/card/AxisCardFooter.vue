<script setup lang="ts">
/**
 * AxisCardFooter Component
 *
 * Footer section for AxisCard with optional divider and alignment options.
 * Typically used for actions, metadata, or secondary information.
 *
 * USAGE:
 * <AxisCard>
 *   <!-- Card content -->
 *   <template #footer>
 *     <AxisCardFooter align="end">
 *       <AxisButton variant="ghost" size="sm">Cancel</AxisButton>
 *       <AxisButton size="sm">Save</AxisButton>
 *     </AxisCardFooter>
 *   </template>
 * </AxisCard>
 */

type Alignment = "start" | "center" | "end" | "between" | "around";

interface Props {
  /** Content alignment */
  align?: Alignment;
  /** Show top border divider */
  divider?: boolean;
  /** Padding size */
  padding?: "none" | "sm" | "md";
}

const props = withDefaults(defineProps<Props>(), {
  align: "end",
  divider: true,
  padding: "md",
});

const alignClasses = computed(() => {
  const alignments = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  };
  return alignments[props.align];
});

const paddingClasses = computed(() => {
  const paddings = {
    none: "",
    sm: "px-3 py-2",
    md: "px-4 py-3",
  };
  return paddings[props.padding];
});
</script>

<template>
  <div
    :class="[
      'flex items-center gap-2',
      alignClasses,
      paddingClasses,
      divider ? 'border-t border-stroke-subtle' : '',
    ]"
  >
    <slot />
  </div>
</template>
