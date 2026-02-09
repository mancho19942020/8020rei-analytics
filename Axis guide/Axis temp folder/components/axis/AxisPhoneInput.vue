<script setup lang="ts">
/**
 * AxisPhoneInput Component
 *
 * A specialized input for US phone numbers with auto-formatting.
 * Based on Axis design system specifications.
 *
 * USAGE:
 * <AxisPhoneInput v-model="phone" label="Phone Number" />
 * <AxisPhoneInput v-model="phone" :error="errorMessage" />
 *
 * FEATURES:
 * - US flag indicator (US-only phone numbers)
 * - Auto-formats as (XXX) XXX-XXXX
 * - Only accepts digits
 * - Validates 10-digit US phone numbers
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
 */

import {
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/vue/24/outline"

interface Props {
  /** Phone value (v-model) - stores raw digits only */
  modelValue?: string
  /** Input size */
  size?: "sm" | "md" | "lg"
  /** Label text */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Hint/helper text shown below input */
  hint?: string
  /** Error message (also sets error state) */
  error?: string
  /** Disable the input */
  disabled?: boolean
  /** Make input read-only */
  readonly?: boolean
  /** Mark as required */
  required?: boolean
  /** Show help icon with tooltip */
  showHelp?: boolean
  /** HTML input name attribute */
  name?: string
  /** HTML input id attribute */
  id?: string
  /** Full width input */
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  size: "md",
  label: "",
  placeholder: "(201) 555-0123",
  hint: "",
  error: "",
  disabled: false,
  readonly: false,
  required: false,
  showHelp: false,
  name: "",
  id: "",
  fullWidth: true,
})

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "focus", event: FocusEvent): void
  (e: "blur", event: FocusEvent): void
  (e: "input", event: Event): void
}>()

// Internal state
const isFocused = ref(false)

// Generate unique ID if not provided - use useId() for SSR-safe stable IDs
const generatedId = useId()
const inputId = computed(
  () => props.id || `axis-phone-input-${generatedId}`
)
const errorId = computed(() => `${inputId.value}-error`)
const hintId = computed(() => `${inputId.value}-hint`)

// Compute if input has error
const hasError = computed(() => !!props.error)

// Format phone number for display: (XXX) XXX-XXXX
const formattedValue = computed(() => {
  const digits = (props.modelValue || "").replace(/\D/g, "")
  if (digits.length === 0) return ""
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
})

// Compute describedby for accessibility
const ariaDescribedby = computed(() => {
  const ids: string[] = []
  if (hasError.value) ids.push(errorId.value)
  if (props.hint && !hasError.value) ids.push(hintId.value)
  return ids.length > 0 ? ids.join(" ") : undefined
})

// Size-based classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      input: "h-7 text-button-small",
      icon: "w-4 h-4",
      label: "text-label mb-1",
      hint: "text-suggestion mt-1",
      flag: "w-4 h-3",
    },
    md: {
      input: "h-9 text-body-regular",
      icon: "w-5 h-5",
      label: "text-label-bold mb-1",
      hint: "text-label mt-1",
      flag: "w-5 h-4",
    },
    lg: {
      input: "h-11 text-body-large",
      icon: "w-5 h-5",
      label: "text-body-regular font-medium mb-1.5",
      hint: "text-label mt-1.5",
      flag: "w-6 h-4",
    },
  }
  return sizes[props.size]
})

// Input wrapper classes based on state
const inputClasses = computed(() => {
  const base = [
    "w-full",
    "rounded-sm",
    "border",
    "bg-white dark:bg-neutral-900",
    "transition-colors duration-150",
    "focus:outline-none",
    "placeholder:text-content-tertiary",
    sizeClasses.value.input,
    // Padding: left for flag, right for error icon
    props.size === "sm" ? "pl-12 pr-8" : props.size === "lg" ? "pl-16 pr-11" : "pl-14 pr-10",
  ]

  // State classes
  if (props.disabled) {
    base.push(
      "bg-surface-raised",
      "border-stroke-strong",
      "text-content-disabled",
      "cursor-not-allowed"
    )
  } else if (props.readonly) {
    base.push(
      "bg-surface-raised",
      "border-stroke-strong",
      "text-content-secondary",
      "cursor-default"
    )
  } else if (hasError.value) {
    base.push(
      "border-error-500",
      "text-content-primary",
      "focus:border-error-700",
      "focus:ring-2 focus:ring-error-500/20"
    )
  } else if (isFocused.value) {
    base.push(
      "border-main-500",
      "text-content-primary",
      "ring-2 ring-main-500/20"
    )
  } else {
    base.push(
      "border-stroke-strong",
      "text-content-primary",
      "hover:border-neutral-400 dark:hover:border-neutral-500",
      "focus:border-main-500",
      "focus:ring-2 focus:ring-main-500/20"
    )
  }

  return base
})

// Handle input - extract digits only and limit to 10
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  // Extract only digits
  const digits = target.value.replace(/\D/g, "").slice(0, 10)
  emit("update:modelValue", digits)
  emit("input", event)
}

// Handle focus
const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit("focus", event)
}

// Handle blur
const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit("blur", event)
}

// Handle keydown - only allow digits, navigation, and control keys
const handleKeyDown = (event: KeyboardEvent) => {
  const allowedKeys = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Home",
    "End",
  ]

  // Allow control/command shortcuts (copy, paste, select all)
  if (event.ctrlKey || event.metaKey) {
    return
  }

  // Allow navigation and control keys
  if (allowedKeys.includes(event.key)) {
    return
  }

  // Only allow digits
  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}
</script>

<template>
  <div :class="['flex flex-col', fullWidth ? 'w-full' : '']">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      :class="[
        sizeClasses.label,
        disabled ? 'text-content-disabled' : 'text-content-secondary',
      ]"
    >
      {{ label }}
      <span v-if="required" class="text-error-500 ml-0.5">*</span>
      <component
        :is="QuestionMarkCircleIcon"
        v-if="showHelp"
        :class="[
          'inline-block ml-1 text-neutral-400 cursor-help',
          size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
        ]"
        aria-hidden="true"
      />
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <!-- US Flag indicator -->
      <div
        :class="[
          'absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none',
          disabled ? 'opacity-50' : '',
        ]"
      >
        <!-- US Flag SVG -->
        <svg
          :class="sizeClasses.flag"
          viewBox="0 0 640 480"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- Red and white stripes -->
          <g fill-rule="evenodd">
            <g stroke-width="1pt">
              <path fill="#bd3d44" d="M0 0h640v480H0z" />
              <path
                d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"
                stroke="#fff"
                stroke-width="37"
              />
            </g>
            <!-- Blue canton -->
            <path fill="#192f5d" d="M0 0h364.8v258.5H0z" />
            <!-- Stars (simplified) -->
            <g fill="#fff">
              <g id="s18">
                <g id="s9">
                  <g id="s5">
                    <g id="s4">
                      <path
                        id="s"
                        d="M32 11.7l4 12.3h13l-10.5 7.6 4 12.3-10.5-7.6-10.5 7.6 4-12.3L15.5 24h13z"
                      />
                      <use href="#s" x="60" />
                    </g>
                    <use href="#s4" x="120" />
                  </g>
                  <use href="#s5" x="60" y="42" />
                </g>
                <use href="#s9" y="84" />
              </g>
              <use href="#s18" y="168" />
            </g>
          </g>
        </svg>
        <!-- Dropdown indicator -->
        <svg
          class="w-2.5 h-2.5 text-content-tertiary"
          viewBox="0 0 10 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <!-- Input element -->
      <input
        :id="inputId"
        type="tel"
        :value="formattedValue"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        autocomplete="tel"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-describedby="ariaDescribedby"
        :aria-required="required ? 'true' : undefined"
        :class="inputClasses"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeyDown"
      >

      <!-- Error icon -->
      <div
        v-if="hasError"
        class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center"
      >
        <ExclamationCircleIcon
          :class="[sizeClasses.icon, 'text-error-500']"
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
      :class="[
        sizeClasses.hint,
        disabled ? 'text-content-disabled' : 'text-content-tertiary',
      ]"
    >
      {{ hint }}
    </p>
  </div>
</template>
