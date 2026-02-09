<script setup lang="ts">
/**
 * AxisCheckboxGroup Component
 *
 * A wrapper component for grouping checkboxes with proper accessibility.
 * Uses semantic <fieldset> and <legend> elements for screen reader support.
 *
 * USAGE:
 * <AxisCheckboxGroup label="Select features" name="features">
 *   <AxisCheckbox v-model="features.a" value="a" label="Feature A" />
 *   <AxisCheckbox v-model="features.b" value="b" label="Feature B" />
 *   <AxisCheckbox v-model="features.c" value="c" label="Feature C" />
 * </AxisCheckboxGroup>
 *
 * WITH SELECT ALL:
 * <AxisCheckboxGroup label="Select items" name="items">
 *   <AxisCheckbox
 *     v-model="allSelected"
 *     :indeterminate="someSelected"
 *     label="Select all"
 *   />
 *   <AxisCheckbox v-model="items.a" value="a" label="Item A" />
 *   <AxisCheckbox v-model="items.b" value="b" label="Item B" />
 * </AxisCheckboxGroup>
 *
 * BEST PRACTICES (from Carbon Design System):
 * - Use for multiple selections from a list
 * - Include "Select all" option for long lists
 * - Order options logically
 * - Keep labels concise
 * - Use indeterminate state when some but not all children are selected
 *
 * ACCESSIBILITY:
 * - Uses semantic <fieldset> wrapper
 * - <legend> provides group label for screen readers
 * - Each checkbox independently focusable
 * - Tab moves between checkboxes
 * - Space toggles current checkbox
 * - Error messages announced via aria-describedby
 */

interface Props {
  /** Group label (displayed as legend) */
  label?: string;
  /** Group name attribute */
  name?: string;
  /** Hint text below label */
  hint?: string;
  /** Error message (applies to entire group) */
  error?: string;
  /** Disable all checkboxes in group */
  disabled?: boolean;
  /** Mark group as required */
  required?: boolean;
  /** Orientation of checkboxes */
  orientation?: "vertical" | "horizontal";
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  name: "",
  hint: "",
  error: "",
  disabled: false,
  required: false,
  orientation: "vertical",
});

// Generate unique ID for ARIA - use useId() for SSR-safe stable IDs
const generatedId = useId();
const groupId = computed(() => `axis-checkbox-group-${generatedId}`);
const errorId = computed(() => `${groupId.value}-error`);
const hintId = computed(() => `${groupId.value}-hint`);

// Compute if group has error
const hasError = computed(() => !!props.error);

// Compute describedby for accessibility
const ariaDescribedby = computed(() => {
  const ids: string[] = [];
  if (hasError.value) ids.push(errorId.value);
  if (props.hint && !hasError.value) ids.push(hintId.value);
  return ids.length > 0 ? ids.join(" ") : undefined;
});

// Provide group context to child AxisCheckbox components
provide("checkboxGroup", {
  name: props.name,
  disabled: computed(() => props.disabled),
  error: computed(() => props.error),
});

// Orientation classes
const orientationClasses = computed(() => {
  return props.orientation === "horizontal"
    ? "flex flex-row flex-wrap gap-6"
    : "flex flex-col gap-2";
});

// Legend classes - with dark mode support
const legendClasses = computed(() => {
  const base = ["text-label-bold mb-2"];

  if (props.disabled) {
    base.push("text-content-disabled");
  } else {
    base.push("text-content-secondary");
  }

  return base;
});
</script>

<template>
  <fieldset
    :aria-describedby="ariaDescribedby"
    :aria-invalid="hasError ? 'true' : undefined"
    :aria-required="required ? 'true' : undefined"
    class="border-0 m-0 p-0"
  >
    <!-- Legend (group label) -->
    <legend v-if="label" :class="legendClasses">
      {{ label }}
      <span v-if="required" class="text-error-500 ml-0.5">*</span>
    </legend>

    <!-- Hint text -->
    <p
      v-if="hint && !error"
      :id="hintId"
      class="text-label text-content-tertiary mb-2"
    >
      {{ hint }}
    </p>

    <!-- Checkbox options slot -->
    <div :class="orientationClasses">
      <slot />
    </div>

    <!-- Error message -->
    <p
      v-if="error"
      :id="errorId"
      class="text-label text-error-600 dark:text-error-400 mt-2"
      role="alert"
    >
      {{ error }}
    </p>
  </fieldset>
</template>
