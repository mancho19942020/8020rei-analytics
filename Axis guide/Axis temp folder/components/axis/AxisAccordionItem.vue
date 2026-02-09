<script setup lang="ts">
/**
 * AxisAccordionItem Component
 *
 * Individual accordion item with collapsible content.
 * Used as a child of AxisAccordion component.
 *
 * USAGE:
 * <AxisAccordionItem title="Section 1">
 *   Content goes here
 * </AxisAccordionItem>
 *
 * LEVELS:
 * - 1: Top level (12px left padding)
 * - 2: Second level (24px left padding)
 * - 3: Third level (36px left padding)
 *
 * STATES:
 * - closed, open, disabled
 */

import { ChevronDownIcon } from "@heroicons/vue/24/outline";

interface Props {
  /** Item title/label */
  title: string;
  /** Optional subtitle for two-row variant */
  subtitle?: string;
  /** Nesting level (1-3) */
  level?: 1 | 2 | 3;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Unique identifier for the item */
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: "",
  level: 1,
  disabled: false,
  id: "",
});

// Generate unique ID if not provided - use useId() for SSR-safe stable IDs
const generatedId = useId();
const itemId = computed(() => props.id || `accordion-item-${generatedId}`);
const contentId = computed(() => `${itemId.value}-content`);
const triggerId = computed(() => `${itemId.value}-trigger`);

// Get accordion context
const accordion = inject<{
  isItemOpen: (id: string) => boolean;
  toggleItem: (id: string) => void;
  multiple: boolean;
} | null>("accordion", null);

// Compute open state from context
const isOpen = computed(() => {
  return accordion?.isItemOpen(itemId.value) || false;
});

// Level-based padding
const paddingClasses = computed(() => {
  const paddings = {
    1: "pl-3",
    2: "pl-6",
    3: "pl-9",
  };
  return paddings[props.level];
});

// Handle toggle
const handleToggle = () => {
  if (!props.disabled && accordion) {
    accordion.toggleItem(itemId.value);
  }
};

// Handle keyboard interaction
const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return;

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleToggle();
  }
};
</script>

<template>
  <div class="border-t border-b border-stroke first:border-t-0">
    <!-- Trigger button -->
    <button
      :id="triggerId"
      type="button"
      :disabled="disabled"
      :aria-expanded="isOpen"
      :aria-controls="contentId"
      :aria-disabled="disabled ? 'true' : undefined"
      :class="[
        'w-full flex items-center gap-1 py-2 pr-3 transition-colors',
        paddingClasses,
        disabled
          ? 'cursor-not-allowed bg-white dark:bg-neutral-900'
          : isOpen
            ? 'bg-neutral-50 dark:bg-neutral-800'
            : 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-main-500/50'
      ]"
      @click="handleToggle"
      @keydown="handleKeydown"
    >
      <!-- Title and subtitle -->
      <div class="flex-1 min-w-0 text-left">
        <p
          :class="[
            'text-h5 font-semibold leading-[1.36] truncate',
            disabled ? 'text-content-disabled' : 'text-content-primary'
          ]"
        >
          {{ title }}
        </p>
        <p
          v-if="subtitle"
          :class="[
            'text-label leading-[1.5] truncate mt-0.5',
            disabled ? 'text-content-disabled' : 'text-content-secondary'
          ]"
        >
          {{ subtitle }}
        </p>
      </div>

      <!-- Chevron icon -->
      <ChevronDownIcon
        :class="[
          'w-6 h-6 shrink-0 transition-transform duration-200',
          isOpen ? 'rotate-180' : '',
          disabled ? 'text-content-disabled' : 'text-content-primary'
        ]"
        aria-hidden="true"
      />
    </button>

    <!-- Collapsible content -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out overflow-hidden"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-screen opacity-100"
      leave-active-class="transition-all duration-200 ease-in overflow-hidden"
      leave-from-class="max-h-screen opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div
        v-show="isOpen"
        :id="contentId"
        :aria-labelledby="triggerId"
        role="region"
        :class="[
          'bg-white dark:bg-neutral-900',
          paddingClasses,
          'pr-3 pt-3 pb-3'
        ]"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>
