<script setup lang="ts">
/**
 * AxisCheckbox Component
 *
 * A checkbox input component following Axis design system specifications.
 * Based on Kairo design system with Carbon Design System best practices.
 *
 * USAGE:
 * <AxisCheckbox v-model="agreed" label="I agree to the terms" />
 * <AxisCheckbox v-model="selected" label="Option" hint="Additional context" />
 * <AxisCheckbox v-model="value" label="Required" :error="errorMessage" />
 * <AxisCheckbox v-model="all" label="Select all" :indeterminate="someSelected" />
 *
 * VARIANTS:
 * - Single: Checkbox only (standalone selection)
 * - With text: Checkbox with label text
 * - With text and hint: Checkbox with label and supporting hint text
 *
 * STATES:
 * - default: Unchecked, ready for interaction
 * - checked: Selected state with checkmark
 * - indeterminate: Partially selected (for parent checkboxes)
 * - hover: Visual feedback on mouse hover
 * - focus: Keyboard focus indicator
 * - disabled: Non-interactive state
 * - error: Validation error state
 *
 * ACCESSIBILITY:
 * - Uses semantic <input type="checkbox"> element
 * - Label properly associated via id
 * - Error messages linked via aria-describedby
 * - Supports keyboard navigation (Space to toggle)
 * - Focus visible ring for keyboard users
 * - Indeterminate state announced via aria-checked="mixed"
 */

interface Props {
  /** Checkbox value (v-model) */
  modelValue?: boolean;
  /** Label text */
  label?: string;
  /** Hint/helper text shown below label */
  hint?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Disable the checkbox */
  disabled?: boolean;
  /** Indeterminate state (for parent checkboxes) */
  indeterminate?: boolean;
  /** Mark as required */
  required?: boolean;
  /** HTML input name attribute */
  name?: string;
  /** HTML input id attribute */
  id?: string;
  /** Value attribute for form submission */
  value?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  label: "",
  hint: "",
  error: "",
  disabled: false,
  indeterminate: false,
  required: false,
  name: "",
  id: "",
  value: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "change", event: Event): void;
}>();

// Reference to the input element for indeterminate state
const inputRef = ref<HTMLInputElement | null>(null);

// Generate unique ID if not provided - use useId() for SSR-safe stable IDs
const generatedId = useId();
const inputId = computed(() => props.id || `axis-checkbox-${generatedId}`);
const errorId = computed(() => `${inputId.value}-error`);
const hintId = computed(() => `${inputId.value}-hint`);

// Compute if checkbox has error
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
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
  emit("change", event);
};

// Set indeterminate state on input element
watch(
  () => props.indeterminate,
  (value) => {
    if (inputRef.value) {
      inputRef.value.indeterminate = value;
    }
  }
);

// Set indeterminate on mount if needed
onMounted(() => {
  if (inputRef.value && props.indeterminate) {
    inputRef.value.indeterminate = true;
  }
});

// Checkbox visual container classes - with dark mode support
const checkboxClasses = computed(() => {
  const base = [
    "relative shrink-0 w-5 h-5 rounded border-2 transition-colors duration-200",
    "flex items-center justify-center",
  ];

  // Use explicit dark variants for SSR hydration safety
  if (props.disabled) {
    base.push(
      "bg-neutral-100 dark:bg-neutral-800 border-stroke-strong cursor-not-allowed"
    );
  } else if (hasError.value) {
    if (props.modelValue || props.indeterminate) {
      base.push("bg-error-700 border-error-700 group-hover:bg-error-500 group-hover:border-error-500");
    } else {
      base.push("bg-white dark:bg-neutral-900 border-error-700 group-hover:border-error-500");
    }
  } else if (props.modelValue || props.indeterminate) {
    base.push(
      "bg-main-700 border-main-900",
      "group-hover:bg-main-700 group-hover:border-main-700"
    );
  } else {
    base.push(
      "bg-white dark:bg-neutral-900 border-stroke-strong",
      "group-hover:bg-main-50 dark:group-hover:bg-main-950 group-hover:border-main-700"
    );
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
  } else if (props.modelValue) {
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
    <!-- Checkbox with label -->
    <label
      :for="inputId"
      :class="[
        'group inline-flex gap-3 items-start',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      ]"
    >
      <!-- Custom checkbox visual -->
      <span :class="checkboxClasses">
        <!-- Hidden native input -->
        <input
          :id="inputId"
          ref="inputRef"
          type="checkbox"
          :name="name"
          :value="value"
          :checked="modelValue"
          :disabled="disabled"
          :required="required"
          :aria-invalid="hasError ? 'true' : undefined"
          :aria-describedby="ariaDescribedby"
          :aria-required="required ? 'true' : undefined"
          :aria-checked="indeterminate ? 'mixed' : modelValue ? 'true' : 'false'"
          class="sr-only"
          @change="handleChange"
        >

        <!-- Checkmark icon (shown when checked) -->
        <svg
          v-if="modelValue && !indeterminate"
          class="w-4 h-4"
          :class="disabled ? 'text-neutral-400' : 'text-white'"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M13.3334 4L6.00008 11.3333L2.66675 8"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <!-- Indeterminate icon (dash) -->
        <svg
          v-else-if="indeterminate"
          class="w-4 h-4"
          :class="disabled ? 'text-neutral-400' : 'text-white'"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M3 8H13"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>

        <!-- Focus ring -->
        <span
          class="absolute inset-0 rounded ring-2 ring-main-500 ring-offset-2 opacity-0 group-focus-within:opacity-100 transition-opacity"
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

    <!-- Error message (below the checkbox row) -->
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
