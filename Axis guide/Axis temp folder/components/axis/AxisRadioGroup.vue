<script setup lang="ts">
/**
 * AxisRadioGroup Component
 *
 * A wrapper component for grouping radio buttons with proper accessibility.
 * Uses semantic <fieldset> and <legend> elements for screen reader support.
 *
 * USAGE:
 * <AxisRadioGroup v-model="selection" label="Choose an option" name="options">
 *   <AxisRadio value="a" label="Option A" />
 *   <AxisRadio value="b" label="Option B" />
 *   <AxisRadio value="c" label="Option C" />
 * </AxisRadioGroup>
 *
 * BEST PRACTICES (from Carbon Design System):
 * - Use 2-5 options (use select for more)
 * - Order options logically (alphabetically, numerically, or by frequency)
 * - Include a default selection when appropriate
 * - Keep labels short and descriptive
 * - Group related radios with a descriptive legend
 *
 * ACCESSIBILITY:
 * - Uses semantic <fieldset> wrapper
 * - <legend> provides group label for screen readers
 * - Keyboard navigation: Arrow keys move between options
 * - Tab moves to the group, Space selects current option
 * - Error messages announced via aria-describedby
 */

interface Props {
  /** Selected value (v-model) */
  modelValue?: string | number | boolean;
  /** Group label (displayed as legend) */
  label?: string;
  /** Group name (passed to child radios) */
  name: string;
  /** Hint text below label */
  hint?: string;
  /** Error message (applies to entire group) */
  error?: string;
  /** Disable all radios in group */
  disabled?: boolean;
  /** Mark group as required */
  required?: boolean;
  /** Orientation of radio buttons */
  orientation?: "vertical" | "horizontal";
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  label: "",
  hint: "",
  error: "",
  disabled: false,
  required: false,
  orientation: "vertical",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number | boolean): void;
}>();

// Generate unique ID for ARIA - use useId() for SSR-safe stable IDs
const generatedId = useId();
const groupId = computed(() => `axis-radio-group-${generatedId}`);
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

// Provide group context to child AxisRadio components
provide("radioGroup", {
  name: props.name,
  modelValue: computed(() => props.modelValue),
  disabled: computed(() => props.disabled),
  error: computed(() => props.error),
  updateValue: (value: string | number | boolean) => {
    emit("update:modelValue", value);
  },
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

    <!-- Radio options slot -->
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
