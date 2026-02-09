<script setup lang="ts">
/**
 * AxisCardGroup Component
 *
 * Container for managing groups of selectable AxisCards.
 * Provides radio-group or checkbox-group behavior with proper ARIA semantics.
 *
 * USAGE (Radio group - single selection):
 * <AxisCardGroup v-model="selectedOption" name="plan">
 *   <AxisCard
 *     variant="selectable"
 *     v-for="plan in plans"
 *     :key="plan.id"
 *     :selection-value="plan.id"
 *     :label="plan.name"
 *   >
 *     {{ plan.description }}
 *   </AxisCard>
 * </AxisCardGroup>
 *
 * USAGE (Checkbox group - multiple selection):
 * <AxisCardGroup v-model="selectedFeatures" multiple name="features">
 *   <AxisCard
 *     variant="selectable"
 *     selection-type="checkbox"
 *     v-for="feature in features"
 *     :key="feature.id"
 *     :selection-value="feature.id"
 *     :label="feature.name"
 *   />
 * </AxisCardGroup>
 *
 * ACCESSIBILITY:
 * - Uses role="radiogroup" or role="group" based on selection mode
 * - Provides aria-labelledby for group label
 * - Manages focus within the group
 */

import { provide, type InjectionKey } from "vue";

// ============================================
// Types (internal use only)
// ============================================

interface CardGroupContext {
  name: string;
  multiple: boolean;
  modelValue: unknown;
  isSelected: (value: unknown) => boolean;
  select: (value: unknown) => void;
}

const CardGroupKey: InjectionKey<CardGroupContext> = Symbol("CardGroup");

// ============================================
// Props
// ============================================

interface Props {
  /** Selected value(s) */
  modelValue?: unknown;
  /** Group name for form submission */
  name?: string;
  /** Allow multiple selections (checkbox mode) */
  multiple?: boolean;
  /** Group label for accessibility */
  label?: string;
  /** Layout direction */
  direction?: "horizontal" | "vertical";
  /** Gap between cards */
  gap?: "sm" | "md" | "lg";
  /** Disable all cards in group */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  name: undefined,
  multiple: false,
  label: undefined,
  direction: "vertical",
  gap: "md",
  disabled: false,
});

// ============================================
// Emits
// ============================================

const emit = defineEmits<{
  (e: "update:modelValue", value: unknown): void;
}>();

// ============================================
// Computed
// ============================================

const groupClasses = computed(() => {
  const gaps = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  };

  return [
    props.direction === "horizontal" ? "flex flex-wrap" : "flex flex-col",
    gaps[props.gap],
  ];
});

const ariaRole = computed(() => {
  return props.multiple ? "group" : "radiogroup";
});

// ============================================
// Methods
// ============================================

const isSelected = (value: unknown): boolean => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(value);
  }
  return props.modelValue === value;
};

const select = (value: unknown) => {
  if (props.disabled) return;

  if (props.multiple) {
    const currentValue = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentValue.indexOf(value);

    if (index === -1) {
      currentValue.push(value);
    } else {
      currentValue.splice(index, 1);
    }

    emit("update:modelValue", currentValue);
  } else {
    emit("update:modelValue", value);
  }
};

// ============================================
// Provide Context
// ============================================

const context: CardGroupContext = {
  name: props.name ?? "",
  multiple: props.multiple,
  get modelValue() {
    return props.modelValue;
  },
  isSelected,
  select,
};

provide(CardGroupKey, context);

// Generate unique ID for aria-labelledby - use useId() for SSR-safe stable IDs
const generatedId = useId();
const groupId = `card-group-${generatedId}`;
</script>

<template>
  <div
    :role="ariaRole"
    :aria-labelledby="label ? groupId : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :class="groupClasses"
  >
    <!-- Optional visible label -->
    <div
      v-if="label"
      :id="groupId"
      class="text-body-regular font-medium text-content-primary mb-2"
    >
      {{ label }}
    </div>

    <slot />
  </div>
</template>
