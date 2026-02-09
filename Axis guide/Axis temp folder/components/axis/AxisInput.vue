<script setup lang="ts">
/**
 * AxisInput Component
 *
 * A versatile text input component following Axis design system specifications.
 * Based on Kairo design system with Carbon Design System best practices.
 *
 * USAGE:
 * <AxisInput v-model="value" label="Email" placeholder="Enter your email" />
 * <AxisInput v-model="value" type="password" label="Password" />
 * <AxisInput v-model="value" :error="errorMessage" hint="Must be 8+ characters" />
 *
 * TYPES:
 * - text (default): Standard text input
 * - email: Email input with validation
 * - password: Password with toggle visibility
 * - tel: Phone number input
 * - url: URL/website input
 * - number: Numeric input
 * - search: Search input with clear button
 *
 * SIZES:
 * - sm: 28px height - compact spaces
 * - md (default): 36px height - standard use
 * - lg: 44px height - prominent inputs
 *
 * STATES:
 * - default, filled, focus, hover, disabled, readonly, error
 *
 * ACCESSIBILITY:
 * - Uses semantic <input> element with proper labeling
 * - Error messages linked via aria-describedby
 * - Required fields indicated via aria-required
 * - Icons are aria-hidden
 */

import type { Component } from "vue";
import {
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/vue/24/outline";

interface Props {
  /** Input value (v-model) */
  modelValue?: string | number;
  /** Input type */
  type?: "text" | "email" | "password" | "tel" | "url" | "number" | "search";
  /** Input size */
  size?: "sm" | "md" | "lg";
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Hint/helper text shown below input */
  hint?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Disable the input */
  disabled?: boolean;
  /** Make input read-only */
  readonly?: boolean;
  /** Mark as required */
  required?: boolean;
  /** Icon component to display on the left */
  iconLeft?: Component | null;
  /** Icon component to display on the right (replaced by error icon if error) */
  iconRight?: Component | null;
  /** Show help icon with tooltip */
  showHelp?: boolean;
  /** HTML input name attribute */
  name?: string;
  /** HTML input id attribute */
  id?: string;
  /** Autocomplete attribute */
  autocomplete?: string;
  /** Full width input */
  fullWidth?: boolean;
  /** Maximum length */
  maxlength?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  type: "text",
  size: "md",
  label: "",
  placeholder: "",
  hint: "",
  error: "",
  disabled: false,
  readonly: false,
  required: false,
  iconLeft: null,
  iconRight: null,
  showHelp: false,
  name: "",
  id: "",
  autocomplete: "",
  fullWidth: true,
  maxlength: undefined,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
  (e: "focus", event: FocusEvent): void;
  (e: "blur", event: FocusEvent): void;
  (e: "input", event: Event): void;
}>();

// Internal state
const isFocused = ref(false);
const showPassword = ref(false);

// Generate unique ID if not provided - use useId() for SSR-safe stable IDs
const generatedId = useId();
const inputId = computed(() => props.id || `axis-input-${generatedId}`);
const errorId = computed(() => `${inputId.value}-error`);
const hintId = computed(() => `${inputId.value}-hint`);

// Compute if input has error
const hasError = computed(() => !!props.error);

// Compute actual input type (for password toggle)
const actualType = computed(() => {
  if (props.type === "password") {
    return showPassword.value ? "text" : "password";
  }
  return props.type;
});

// Compute describedby for accessibility
const ariaDescribedby = computed(() => {
  const ids: string[] = [];
  if (hasError.value) ids.push(errorId.value);
  if (props.hint && !hasError.value) ids.push(hintId.value);
  return ids.length > 0 ? ids.join(" ") : undefined;
});

// Size-based classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      input: "h-7 px-3 text-button-small",
      icon: "w-4 h-4",
      label: "text-label mb-1",
      hint: "text-suggestion mt-1",
    },
    md: {
      input: "h-9 px-3 text-body-regular",
      icon: "w-5 h-5",
      label: "text-label-bold mb-1",
      hint: "text-label mt-1",
    },
    lg: {
      input: "h-11 px-4 text-body-large",
      icon: "w-5 h-5",
      label: "text-body-regular font-medium mb-1.5",
      hint: "text-label mt-1.5",
    },
  };
  return sizes[props.size];
});

// Input wrapper classes based on state
// Updated for dark mode support using both semantic tokens AND explicit dark: variants
// The explicit dark: classes ensure proper styling even during SSR hydration
const inputClasses = computed(() => {
  const base = [
    "w-full",
    "rounded-sm",
    "border",
    // Use both semantic token AND explicit dark variant for SSR hydration safety
    "bg-white dark:bg-neutral-900",
    "transition-colors duration-150",
    "focus:outline-none",
    "placeholder:text-content-tertiary",
    sizeClasses.value.input,
  ];

  // Icon padding
  if (props.iconLeft) {
    base.push(props.size === "sm" ? "pl-8" : props.size === "lg" ? "pl-11" : "pl-10");
  }
  if (props.iconRight || props.type === "password" || props.type === "search" || hasError.value) {
    base.push(props.size === "sm" ? "pr-8" : props.size === "lg" ? "pr-11" : "pr-10");
  }

  // State classes - using semantic tokens for theme support
  if (props.disabled) {
    base.push(
      "bg-surface-raised",
      "border-stroke-strong",
      "text-content-disabled",
      "cursor-not-allowed"
    );
  } else if (props.readonly) {
    base.push(
      "bg-surface-raised",
      "border-stroke-strong",
      "text-content-secondary",
      "cursor-default"
    );
  } else if (hasError.value) {
    base.push(
      "border-error-500",
      "text-content-primary",
      "focus:border-error-700",
      "focus:ring-2 focus:ring-error-500/20"
    );
  } else if (isFocused.value) {
    base.push(
      "border-main-500",
      "text-content-primary",
      "ring-2 ring-main-500/20"
    );
  } else {
    base.push(
      "border-stroke-strong",
      "text-content-primary",
      "hover:border-neutral-400 dark:hover:border-neutral-500",
      "focus:border-main-500",
      "focus:ring-2 focus:ring-main-500/20"
    );
  }

  return base;
});

// Handle input
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
  emit("input", event);
};

// Handle focus
const handleFocus = (event: FocusEvent) => {
  isFocused.value = true;
  emit("focus", event);
};

// Handle blur
const handleBlur = (event: FocusEvent) => {
  isFocused.value = false;
  emit("blur", event);
};

// Toggle password visibility
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// Clear search input
const clearSearch = () => {
  emit("update:modelValue", "");
};
</script>

<template>
  <div :class="['flex flex-col', fullWidth ? 'w-full' : '']">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      :class="[
        sizeClasses.label,
        disabled ? 'text-content-disabled' : 'text-content-secondary'
      ]"
    >
      {{ label }}
      <span v-if="required" class="text-error-500 ml-0.5">*</span>
      <component
        :is="QuestionMarkCircleIcon"
        v-if="showHelp"
        :class="['inline-block ml-1 text-neutral-400 cursor-help', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4']"
        aria-hidden="true"
      />
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <!-- Left icon -->
      <div
        v-if="iconLeft"
        :class="[
          'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
          disabled ? 'text-content-disabled' : hasError ? 'text-error-500' : 'text-content-tertiary'
        ]"
      >
        <component
          :is="iconLeft"
          :class="sizeClasses.icon"
          aria-hidden="true"
        />
      </div>

      <!-- Input element -->
      <input
        :id="inputId"
        :type="actualType"
        :value="modelValue"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-describedby="ariaDescribedby"
        :aria-required="required ? 'true' : undefined"
        :class="inputClasses"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      >

      <!-- Right side icons -->
      <div
        v-if="iconRight || type === 'password' || type === 'search' || hasError"
        :class="[
          'absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1'
        ]"
      >
        <!-- Error icon -->
        <ExclamationCircleIcon
          v-if="hasError"
          :class="[sizeClasses.icon, 'text-error-500']"
          aria-hidden="true"
        />

        <!-- Password toggle -->
        <button
          v-else-if="type === 'password'"
          type="button"
          :disabled="disabled"
          :class="[
            sizeClasses.icon,
            disabled ? 'text-content-disabled cursor-not-allowed' : 'text-content-tertiary hover:text-content-secondary cursor-pointer'
          ]"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          @click="togglePassword"
        >
          <EyeSlashIcon v-if="showPassword" class="w-full h-full" />
          <EyeIcon v-else class="w-full h-full" />
        </button>

        <!-- Search clear button -->
        <button
          v-else-if="type === 'search' && modelValue"
          type="button"
          :disabled="disabled"
          :class="[
            sizeClasses.icon,
            disabled ? 'text-content-disabled cursor-not-allowed' : 'text-content-tertiary hover:text-content-secondary cursor-pointer'
          ]"
          aria-label="Clear search"
          @click="clearSearch"
        >
          <XMarkIcon class="w-full h-full" />
        </button>

        <!-- Custom right icon -->
        <component
          :is="iconRight"
          v-else-if="iconRight"
          :class="[sizeClasses.icon, disabled ? 'text-content-disabled' : 'text-content-tertiary']"
          aria-hidden="true"
        />
      </div>
    </div>

    <!-- Hint or Error message -->
    <p
      v-if="error"
      :id="errorId"
      :class="[sizeClasses.hint, 'text-error-600 dark:text-error-400']"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="hintId"
      :class="[sizeClasses.hint, disabled ? 'text-content-disabled' : 'text-content-tertiary']"
    >
      {{ hint }}
    </p>
  </div>
</template>
