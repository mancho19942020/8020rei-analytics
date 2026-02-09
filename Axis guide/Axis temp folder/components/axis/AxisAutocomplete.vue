<script setup lang="ts">
/**
 * AxisAutocomplete Component
 *
 * A text input with autocomplete suggestions following Axis design system.
 * Unlike AxisSelect, this allows free-text entry - users can type anything
 * and optionally select from suggestions.
 *
 * USAGE:
 * <AxisAutocomplete v-model="city" :options="cityOptions" label="City" />
 * <AxisAutocomplete v-model="value" :options="options" placeholder="Type or select..." />
 *
 * SIZES:
 * - sm: 28px height - compact spaces
 * - md (default): 36px height - standard use
 * - lg: 44px height - prominent inputs
 *
 * STATES:
 * - default, focused, disabled, readonly, error
 *
 * ACCESSIBILITY:
 * - Uses combobox pattern with listbox
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Error messages linked via aria-describedby
 */

import type { Component } from "vue"
import {
  ChevronDownIcon,
  XMarkIcon,
  ExclamationCircleIcon,
} from "@heroicons/vue/24/outline"

export interface AutocompleteOption {
  /** Unique value for the option */
  value: string
  /** Display label for the option */
  label: string
  /** Optional icon component */
  icon?: Component | null
}

interface Props {
  /** The current value (v-model) */
  modelValue?: string
  /** Available options for suggestions */
  options?: AutocompleteOption[]
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
  /** Icon component to display on the left */
  iconLeft?: Component | null
  /** Show clear button when has value */
  clearable?: boolean
  /** Full width input */
  fullWidth?: boolean
  /** HTML name attribute */
  name?: string
  /** HTML id attribute */
  id?: string
  /** Maximum visible options before scrolling */
  maxVisibleOptions?: number
  /** Minimum characters before showing suggestions */
  minCharsForSuggestions?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  options: () => [],
  size: "md",
  label: "",
  placeholder: "",
  hint: "",
  error: "",
  disabled: false,
  readonly: false,
  required: false,
  iconLeft: null,
  clearable: true,
  fullWidth: true,
  name: "",
  id: "",
  maxVisibleOptions: 6,
  minCharsForSuggestions: 0,
})

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "focus", event: FocusEvent): void
  (e: "blur", event: FocusEvent): void
  (e: "input", event: Event): void
  (e: "select", option: AutocompleteOption): void
}>()

// Internal state
const isOpen = ref(false)
const isFocused = ref(false)
const highlightedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)
const optionRefs = ref<(HTMLButtonElement | null)[]>([])

// Generate unique ID if not provided - use useId() for SSR-safe stable IDs
const generatedId = useId()
const instanceId = `axis-autocomplete-${generatedId}`
const inputId = computed(() => props.id || instanceId)
const errorId = computed(() => `${inputId.value}-error`)
const hintId = computed(() => `${inputId.value}-hint`)
const listboxId = computed(() => `${inputId.value}-listbox`)

// Compute if input has error
const hasError = computed(() => !!props.error)

// Compute describedby for accessibility
const ariaDescribedby = computed(() => {
  const ids: string[] = []
  if (hasError.value) ids.push(errorId.value)
  if (props.hint && !hasError.value) ids.push(hintId.value)
  return ids.length > 0 ? ids.join(" ") : undefined
})

// Filter options based on current input value
const filteredOptions = computed(() => {
  const value = props.modelValue?.toLowerCase() || ""

  // Don't show suggestions if below minimum characters
  if (value.length < props.minCharsForSuggestions) {
    return []
  }

  // If empty, show all options
  if (!value) {
    return props.options
  }

  // Filter options that match the input
  return props.options.filter((option) =>
    option.label.toLowerCase().includes(value)
  )
})

// Check if current value exactly matches an option
const hasExactMatch = computed(() => {
  const value = props.modelValue?.toLowerCase() || ""
  return props.options.some((opt) => opt.label.toLowerCase() === value)
})

// Should show dropdown
const shouldShowDropdown = computed(() => {
  return isOpen.value && filteredOptions.value.length > 0
})

// Size-based classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      input: "h-7 px-3 text-button-small",
      icon: "w-4 h-4",
      label: "text-label mb-1",
      hint: "text-suggestion mt-1",
      dropdown: "py-1",
      option: "px-2 py-1.5 text-label",
      optionIcon: "w-4 h-4",
    },
    md: {
      input: "h-9 px-3 text-body-regular",
      icon: "w-5 h-5",
      label: "text-label-bold mb-1",
      hint: "text-label mt-1",
      dropdown: "py-1.5",
      option: "px-3 py-2 text-body-regular",
      optionIcon: "w-5 h-5",
    },
    lg: {
      input: "h-11 px-4 text-body-large",
      icon: "w-5 h-5",
      label: "text-body-regular font-medium mb-1.5",
      hint: "text-label mt-1.5",
      dropdown: "py-2",
      option: "px-4 py-2.5 text-body-large",
      optionIcon: "w-5 h-5",
    },
  }
  return sizes[props.size]
})

// Input classes based on state
const inputClasses = computed(() => {
  const base = [
    "w-full",
    "rounded-sm",
    "border",
    "bg-white dark:bg-neutral-900",
    "transition-colors duration-150",
    "focus:outline-none",
    sizeClasses.value.input,
  ]

  // Icon padding
  if (props.iconLeft) {
    base.push(props.size === "sm" ? "pl-8" : props.size === "lg" ? "pl-11" : "pl-10")
  }

  // Right padding for clear/dropdown buttons
  const hasClearButton = props.clearable && props.modelValue && !props.disabled && !props.readonly
  if (hasClearButton || hasError.value) {
    base.push(props.size === "sm" ? "pr-14" : props.size === "lg" ? "pr-18" : "pr-16")
  } else {
    base.push(props.size === "sm" ? "pr-8" : props.size === "lg" ? "pr-11" : "pr-10")
  }

  // State classes
  if (props.disabled) {
    base.push(
      "bg-surface-raised",
      "border-stroke-strong",
      "text-content-disabled",
      "cursor-not-allowed",
      "placeholder:text-content-disabled"
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
      "placeholder:text-content-tertiary",
      "focus:border-error-700",
      "focus:ring-2 focus:ring-error-500/20"
    )
  } else if (isFocused.value) {
    base.push(
      "border-main-500",
      "text-content-primary",
      "placeholder:text-content-tertiary",
      "ring-2 ring-main-500/20"
    )
  } else {
    base.push(
      "border-stroke-strong",
      "text-content-primary",
      "placeholder:text-content-tertiary",
      "hover:border-neutral-400 dark:hover:border-neutral-500",
      "focus:border-main-500",
      "focus:ring-2 focus:ring-main-500/20"
    )
  }

  return base
})

// Open dropdown
const openDropdown = () => {
  if (props.disabled || props.readonly) return
  isOpen.value = true
  highlightedIndex.value = -1
}

// Close dropdown
const closeDropdown = () => {
  isOpen.value = false
  highlightedIndex.value = -1
}

// Handle input
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit("update:modelValue", target.value)
  emit("input", event)

  // Open dropdown when typing
  if (!isOpen.value && target.value.length >= props.minCharsForSuggestions) {
    openDropdown()
  }

  // Reset highlight when typing
  highlightedIndex.value = -1
}

// Handle focus
const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  openDropdown()
  emit("focus", event)
}

// Handle blur
const handleBlur = (event: FocusEvent) => {
  // Don't blur if clicking within dropdown
  const relatedTarget = event.relatedTarget as HTMLElement
  if (dropdownRef.value?.contains(relatedTarget)) {
    return
  }

  isFocused.value = false
  closeDropdown()
  emit("blur", event)
}

// Select an option
const selectOption = (option: AutocompleteOption) => {
  emit("update:modelValue", option.label)
  emit("select", option)
  closeDropdown()

  // Refocus input after selection
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Clear value
const clearValue = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  emit("update:modelValue", "")
  inputRef.value?.focus()
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled || props.readonly) return

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault()
      if (!isOpen.value) {
        openDropdown()
      } else if (filteredOptions.value.length > 0) {
        highlightedIndex.value = Math.min(
          highlightedIndex.value + 1,
          filteredOptions.value.length - 1
        )
        scrollToHighlighted()
      }
      break

    case "ArrowUp":
      event.preventDefault()
      if (isOpen.value && filteredOptions.value.length > 0) {
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
        scrollToHighlighted()
      }
      break

    case "Enter":
      if (isOpen.value && highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
        event.preventDefault()
        selectOption(filteredOptions.value[highlightedIndex.value])
      }
      break

    case "Escape":
      if (isOpen.value) {
        event.preventDefault()
        closeDropdown()
      }
      break

    case "Tab":
      closeDropdown()
      break
  }
}

// Scroll highlighted option into view
const scrollToHighlighted = () => {
  nextTick(() => {
    const highlightedEl = optionRefs.value[highlightedIndex.value]
    if (highlightedEl) {
      highlightedEl.scrollIntoView({ block: "nearest" })
    }
  })
}

// Click outside to close
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (
    isOpen.value &&
    !inputRef.value?.contains(target) &&
    !dropdownRef.value?.contains(target)
  ) {
    closeDropdown()
  }
}

// Compute max height for dropdown
const dropdownMaxHeight = computed(() => {
  const optionHeight = props.size === "sm" ? 32 : props.size === "lg" ? 44 : 40
  const padding = props.size === "sm" ? 8 : props.size === "lg" ? 16 : 12
  return (optionHeight * props.maxVisibleOptions) + padding
})

// Track whether dropdown should open upward
const openUpward = ref(false)

// Calculate if dropdown should open upward
const updateDropdownPosition = () => {
  if (!inputRef.value || typeof window === "undefined") return

  const inputRect = inputRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = dropdownMaxHeight.value

  const spaceBelow = viewportHeight - inputRect.bottom
  const spaceAbove = inputRect.top

  openUpward.value = spaceBelow < dropdownHeight + 20 && spaceAbove > spaceBelow
}

// Watch for focus to update position
watch(isOpen, (open) => {
  if (open) {
    updateDropdownPosition()
  }
})

// Setup and cleanup
onMounted(() => {
  document.addEventListener("click", handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
})
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
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <!-- Left icon -->
      <div
        v-if="iconLeft"
        :class="[
          'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10',
          disabled ? 'text-content-disabled' : hasError ? 'text-error-500' : 'text-content-tertiary',
        ]"
      >
        <component
          :is="iconLeft"
          :class="sizeClasses.icon"
          aria-hidden="true"
        />
      </div>

      <!-- Input -->
      <input
        :id="inputId"
        ref="inputRef"
        type="text"
        :name="name"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-describedby="ariaDescribedby"
        :aria-autocomplete="'list'"
        :aria-expanded="shouldShowDropdown"
        :aria-controls="listboxId"
        :class="inputClasses"
        autocomplete="off"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      >

      <!-- Right icons container -->
      <div
        :class="[
          'absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1',
        ]"
      >
        <!-- Clear button -->
        <button
          v-if="clearable && modelValue && !disabled && !readonly"
          type="button"
          class="p-0.5 rounded hover:bg-surface-overlay transition-colors"
          aria-label="Clear value"
          tabindex="-1"
          @mousedown="clearValue"
        >
          <XMarkIcon :class="[sizeClasses.icon, 'text-content-tertiary']" />
        </button>

        <!-- Error icon -->
        <ExclamationCircleIcon
          v-if="hasError"
          :class="[sizeClasses.icon, 'text-error-500']"
          aria-hidden="true"
        />

        <!-- Dropdown chevron -->
        <ChevronDownIcon
          v-else
          :class="[
            sizeClasses.icon,
            'transition-transform duration-150',
            isOpen ? 'rotate-180' : '',
            disabled ? 'text-content-disabled' : 'text-content-tertiary',
          ]"
          aria-hidden="true"
        />
      </div>

      <!-- Dropdown panel -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="shouldShowDropdown"
          :id="listboxId"
          ref="dropdownRef"
          role="listbox"
          :class="[
            'absolute z-50 w-full bg-neutral-100 dark:bg-neutral-800 border border-stroke rounded-sm shadow-md overflow-hidden',
            openUpward ? 'bottom-full mb-1' : 'mt-1',
            sizeClasses.dropdown,
          ]"
          :style="{ maxHeight: `${dropdownMaxHeight}px` }"
        >
          <!-- Options list -->
          <div class="overflow-y-auto" :style="{ maxHeight: `${dropdownMaxHeight}px` }">
            <button
              v-for="(option, index) in filteredOptions"
              :key="option.value"
              :ref="(el) => (optionRefs[index] = el as HTMLButtonElement | null)"
              type="button"
              role="option"
              :aria-selected="option.label.toLowerCase() === modelValue?.toLowerCase()"
              :class="[
                'w-full flex items-center gap-2 text-left transition-colors',
                sizeClasses.option,
                option.label.toLowerCase() === modelValue?.toLowerCase()
                  ? 'bg-main-50 dark:bg-main-950 text-main-900 dark:text-main-100'
                  : highlightedIndex === index
                    ? 'bg-neutral-200 dark:bg-neutral-700 text-content-primary'
                    : 'text-content-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700',
              ]"
              @click="selectOption(option)"
              @mouseenter="highlightedIndex = index"
            >
              <!-- Option icon -->
              <component
                :is="option.icon"
                v-if="option.icon"
                :class="[sizeClasses.optionIcon, 'shrink-0']"
                aria-hidden="true"
              />

              <!-- Option label -->
              <span class="flex-1 truncate">{{ option.label }}</span>
            </button>
          </div>
        </div>
      </Transition>
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
