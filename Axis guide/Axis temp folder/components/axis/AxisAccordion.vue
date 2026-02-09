<script setup lang="ts">
/**
 * AxisAccordion Component
 *
 * A collapsible accordion component following Axis design system specifications.
 * Based on Kairo design system with Carbon Design System accessibility best practices.
 *
 * USAGE:
 * <AxisAccordion>
 *   <AxisAccordionItem title="Section 1">Content 1</AxisAccordionItem>
 *   <AxisAccordionItem title="Section 2">Content 2</AxisAccordionItem>
 * </AxisAccordion>
 *
 * <AxisAccordion multiple>
 *   <AxisAccordionItem title="Section 1" subtitle="Description">...</AxisAccordionItem>
 *   <AxisAccordionItem title="Section 2" :level="2">...</AxisAccordionItem>
 * </AxisAccordion>
 *
 * VARIANTS:
 * - single (default): Only one item can be open at a time
 * - multiple: Multiple items can be open simultaneously
 *
 * LEVELS:
 * - Items support 3 nesting levels (1-3) with progressive left padding
 *
 * TWO-ROW VARIANT:
 * - Add `subtitle` prop to AxisAccordionItem for additional description line
 *
 * STATES:
 * - default, open, disabled per item
 *
 * ACCESSIBILITY:
 * - Uses semantic button + region pattern
 * - Keyboard navigation (Enter, Space, Arrow keys)
 * - ARIA attributes for screen readers
 * - Focus visible indicators
 */

interface Props {
  /** Allow multiple items to be open simultaneously */
  multiple?: boolean;
  /** Initially open item ID(s) */
  modelValue?: string | string[] | null;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  modelValue: null,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | string[] | null): void;
}>();

// Track open items
const openItems = ref<Set<string>>(new Set());

// Initialize open items from modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue === null || newValue === undefined) {
      openItems.value = new Set();
    } else if (Array.isArray(newValue)) {
      openItems.value = new Set(newValue);
    } else {
      openItems.value = new Set([newValue]);
    }
  },
  { immediate: true }
);

// Check if an item is open
const isItemOpen = (id: string) => {
  return openItems.value.has(id);
};

// Toggle item open/closed state
const toggleItem = (id: string) => {
  const newOpenItems = new Set(openItems.value);

  if (props.multiple) {
    // Multiple mode: toggle the clicked item
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
  } else {
    // Single mode: close others, toggle clicked item
    if (newOpenItems.has(id)) {
      newOpenItems.clear();
    } else {
      newOpenItems.clear();
      newOpenItems.add(id);
    }
  }

  openItems.value = newOpenItems;

  // Emit update
  if (props.multiple) {
    emit("update:modelValue", Array.from(newOpenItems));
  } else {
    emit("update:modelValue", newOpenItems.size > 0 ? Array.from(newOpenItems)[0] : null);
  }
};

// Provide context to child items
provide("accordion", {
  isItemOpen,
  toggleItem,
  multiple: props.multiple,
});
</script>

<template>
  <div
    role="region"
    :aria-label="multiple ? 'Multi-select accordion' : 'Single-select accordion'"
    class="w-full bg-white dark:bg-neutral-900 border border-stroke rounded-sm overflow-hidden"
  >
    <slot />
  </div>
</template>
