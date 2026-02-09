<script setup lang="ts">
/**
 * AxisRadio Component
 *
 * A radio button input component following Axis design system specifications.
 * Based on Kairo design system with Carbon Design System best practices.
 *
 * USAGE:
 * <AxisRadio v-model="selected" value="option1" label="Option 1" name="options" />
 * <AxisRadio v-model="selected" value="option2" label="Option 2" name="options" hint="More details" />
 * <AxisRadio v-model="selected" value="option3" label="Option 3" name="options" :error="errorMessage" />
 *
 * WHEN TO USE:
 * - Use radio buttons when users can only select ONE option from a list
 * - Present 2-5 options (use select for more options)
 * - All options should be visible at once
 * - Options are mutually exclusive
 *
 * WHEN NOT TO USE:
 * - Don't use for multiple selections (use checkboxes instead)
 * - Don't use for binary on/off choices (use toggle instead)
 * - Don't use with more than 5 options (use select instead)
 *
 * VARIANTS:
 * - Single: Radio only (standalone)
 * - With text: Radio with label text
 * - With text and hint: Radio with label and supporting hint text
 *
 * STATES:
 * - default: Unselected, ready for interaction
 * - selected: Selected state with filled dot
 * - hover: Visual feedback on mouse hover
 * - focus: Keyboard focus indicator
 * - disabled: Non-interactive state
 * - error: Validation error state
 *
 * ACCESSIBILITY:
 * - Uses semantic <input type="radio"> element
 * - Label properly associated via id
 * - Error messages linked via aria-describedby
 * - Supports keyboard navigation (Arrow keys within group)
 * - Focus visible ring for keyboard users
 * - Groups should use <fieldset> with <legend> for screen readers
 */

interface Props {
  /** Selected value in the radio group (v-model) */
  modelValue?: string | number | boolean;
  /** Value of this radio option */
  value: string | number | boolean;
  /** Label text */
  label?: string;
  /** Hint/helper text shown below label */
  hint?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Disable the radio */
  disabled?: boolean;
  /** Mark as required */
  required?: boolean;
  /** HTML input name attribute (required for grouping) */
  name: string;
  /** HTML input id attribute */
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  label: "",
  hint: "",
  error: "",
  disabled: false,
  required: false,
  id: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number | boolean): void;
  (e: "change", event: Event): void;
}>();

// Generate unique ID if not provided - use useId() for SSR-safe stable IDs
const generatedId = useId();
const inputId = computed(() => props.id || `axis-radio-${generatedId}`);
const errorId = computed(() => `${inputId.value}-error`);
const hintId = computed(() => `${inputId.value}-hint`);

// Compute if this radio is selected
const isSelected = computed(() => props.modelValue === props.value);

// Compute if radio has error
const hasError = computed(() => !!props.error);

// Compute describedby for accessibility
const ariaDescribedby = computed(() => {
  const ids: string[] = [];
  if (hasError.value) ids.push(errorId.value);
  if (props.hint && !hasError.value) ids.push(hintId.value);
  return ids.length > 0 ? ids.join(" ") : undefined;
});

// Handle change
const handleChange = (event: Event) => {
  if (props.disabled) return;
  emit("update:modelValue", props.value);
  emit("change", event);
};

// Radio visual container classes - with dark mode support
const radioClasses = computed(() => {
  const base = [
    "relative shrink-0 w-5 h-5 rounded-full border-2 transition-colors duration-200",
    "flex items-center justify-center",
  ];

  // Use explicit dark variants for SSR hydration safety
  if (props.disabled) {
    base.push(
      "bg-neutral-100 dark:bg-neutral-800 border-stroke-strong cursor-not-allowed"
    );
  } else if (hasError.value) {
    if (isSelected.value) {
      base.push("bg-white dark:bg-neutral-900 border-error-700 group-hover:border-error-500");
    } else {
      base.push("bg-white dark:bg-neutral-900 border-error-700 group-hover:border-error-500");
    }
  } else if (isSelected.value) {
    base.push(
      "bg-white dark:bg-neutral-900 border-main-900 dark:border-main-500",
      "group-hover:bg-main-50 dark:group-hover:bg-main-950 group-hover:border-main-700"
    );
  } else {
    base.push(
      "bg-white dark:bg-neutral-900 border-stroke-strong",
      "group-hover:bg-main-50 dark:group-hover:bg-main-950 group-hover:border-main-700"
    );
  }

  return base;
});

// Inner dot classes (shown when selected) - with dark mode support
const dotClasses = computed(() => {
  const base = ["w-2 h-2 rounded-full transition-colors duration-200"];

  if (props.disabled) {
    base.push("bg-neutral-400 dark:bg-neutral-600");
  } else if (hasError.value) {
    base.push("bg-error-700 dark:bg-error-400 group-hover:bg-error-500");
  } else {
    base.push("bg-main-900 dark:bg-main-400 group-hover:bg-main-700 dark:group-hover:bg-main-300");
  }

  return base;
});

// Label text classes - with dark mode support
const labelClasses = computed(() => {
  const base = ["text-body-regular select-none"];

  if (props.disabled) {
    base.push("text-content-disabled cursor-not-allowed");
  } else if (hasError.value) {
    base.push("text-error-700 dark:text-error-400 cursor-pointer group-hover:text-error-500 dark:group-hover:text-error-300");
  } else if (isSelected.value) {
    base.push("text-main-900 dark:text-main-100 cursor-pointer group-hover:text-main-700 dark:group-hover:text-main-300");
  } else {
    base.push("text-content-secondary cursor-pointer group-hover:text-main-700 dark:group-hover:text-main-300");
  }

  return base;
});

// Hint text classes - with dark mode support
const hintClasses = computed(() => {
  const base = ["text-suggestion"];

  if (props.disabled) {
    base.push("text-content-disabled");
  } else if (hasError.value) {
    base.push("text-error-700 dark:text-error-400");
  } else {
    base.push("text-content-tertiary");
  }

  return base;
});
</script>

<template>
  <div class="flex flex-col">
    <!-- Radio with label -->
    <label
      :for="inputId"
      :class="[
        'group inline-flex gap-3 items-start',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      ]"
    >
      <!-- Custom radio visual -->
      <span :class="radioClasses">
        <!-- Hidden native input -->
        <input
          :id="inputId"
          type="radio"
          :name="name"
          :value="value"
          :checked="isSelected"
          :disabled="disabled"
          :required="required"
          :aria-invalid="hasError ? 'true' : undefined"
          :aria-describedby="ariaDescribedby"
          :aria-required="required ? 'true' : undefined"
          class="sr-only"
          @change="handleChange"
        >

        <!-- Inner dot (shown when selected) -->
        <span
          v-if="isSelected"
          :class="dotClasses"
          aria-hidden="true"
        />

        <!-- Focus ring -->
        <span
          class="absolute inset-0 rounded-full ring-2 ring-main-500 ring-offset-2 opacity-0 group-focus-within:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </span>

      <!-- Label and hint text -->
      <span v-if="label || hint" class="flex flex-col pt-0.5">
        <span v-if="label" :class="labelClasses">
          {{ label }}
          <span v-if="required" class="text-error-500 ml-0.5">*</span>
        </span>
        <span v-if="hint && !error" :id="hintId" :class="hintClasses">
          {{ hint }}
        </span>
      </span>
    </label>

    <!-- Error message (below the radio row) -->
    <p
      v-if="error"
      :id="errorId"
      class="text-suggestion text-error-700 dark:text-error-400 mt-1 ml-8"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>
