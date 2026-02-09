<script setup lang="ts">
/**
 * AxisSelect Component
 *
 * A versatile select/dropdown component following Axis design system specifications.
 * Based on Kairo design system with Carbon Design System best practices.
 *
 * USAGE:
 * <AxisSelect v-model="value" :options="options" label="Country" />
 * <AxisSelect v-model="values" :options="options" multiple label="Tags" />
 * <AxisSelect v-model="value" :options="options" searchable placeholder="Search..." />
 *
 * VARIANTS:
 * - default: Standard bordered select
 * - ghost: Borderless/minimal variant for inline contexts
 *
 * SIZES:
 * - sm: 28px height - compact spaces
 * - md (default): 36px height - standard use
 * - lg: 44px height - prominent selects
 *
 * STATES:
 * - default, selected, hover, focus, disabled, readonly, error
 *
 * ACCESSIBILITY:
 * - Uses semantic button + listbox pattern
 * - Keyboard navigation (Arrow keys, Enter, Escape, Home, End)
 * - Error messages linked via aria-describedby
 * - Required fields indicated via aria-required
 * - Focus management for dropdown items
 */

import type { Component } from "vue";
import {
  ChevronDownIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/vue/24/outline";
import { useSelectCoordinator } from "~/composables/useSelectCoordinator";

export interface SelectOption {
  /** Unique value for the option */
  value: string | number;
  /** Display label for the option */
  label: string;
  /** Optional icon component */
  icon?: Component | null;
  /** Whether the option is disabled */
  disabled?: boolean;
}

interface Props {
  /** Selected value(s) - single value or array for multiple */
  modelValue?: string | number | (string | number)[] | null;
  /** Available options */
  options: SelectOption[];
  /** Select variant */
  variant?: "default" | "ghost";
  /** Select size */
  size?: "sm" | "md" | "lg";
  /** Label text */
  label?: string;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Hint/helper text shown below select */
  hint?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Allow multiple selection */
  multiple?: boolean;
  /** Enable search/filter within options */
  searchable?: boolean;
  /** Disable the select */
  disabled?: boolean;
  /** Make select read-only (shows value but can't change) */
  readonly?: boolean;
  /** Mark as required */
  required?: boolean;
  /** Icon component to display on the left */
  iconLeft?: Component | null;
  /** Full width select */
  fullWidth?: boolean;
  /** HTML name attribute */
  name?: string;
  /** HTML id attribute */
  id?: string;
  /** Maximum visible options before scrolling */
  maxVisibleOptions?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  variant: "default",
  size: "md",
  label: "",
  placeholder: "Select an option",
  hint: "",
  error: "",
  multiple: false,
  searchable: false,
  disabled: false,
  readonly: false,
  required: false,
  iconLeft: null,
  fullWidth: true,
  name: "",
  id: "",
  maxVisibleOptions: 6,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number | (string | number)[] | null): void;
  (e: "focus"): void;
  (e: "blur"): void;
  (e: "open"): void;
  (e: "close"): void;
}>();

// Internal state
const isOpen = ref(false);
const isFocused = ref(false);
const searchQuery = ref("");
const highlightedIndex = ref(-1);
const triggerRef = ref<HTMLButtonElement | null>(null);
const dropdownRef = ref<HTMLDivElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const optionRefs = ref<(HTMLButtonElement | null)[]>([]);

// Generate unique ID if not provided - use useId() for SSR-safe stable IDs
const generatedId = useId();
const instanceId = `axis-select-${generatedId}`;
const selectId = computed(() => props.id || instanceId);

// Initialize select coordinator for global dropdown management
const coordinator = useSelectCoordinator(instanceId);
const errorId = computed(() => `${selectId.value}-error`);
const hintId = computed(() => `${selectId.value}-hint`);
const listboxId = computed(() => `${selectId.value}-listbox`);

// Compute if select has error
const hasError = computed(() => !!props.error);

// Compute describedby for accessibility
const ariaDescribedby = computed(() => {
  const ids: string[] = [];
  if (hasError.value) ids.push(errorId.value);
  if (props.hint && !hasError.value) ids.push(hintId.value);
  return ids.length > 0 ? ids.join(" ") : undefined;
});

// Filter options based on search
const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.options;
  }
  const query = searchQuery.value.toLowerCase();
  return props.options.filter((option) =>
    option.label.toLowerCase().includes(query)
  );
});

// Get selected option(s)
const selectedOptions = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return [];
  }
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.options.filter((opt) =>
      (props.modelValue as (string | number)[]).includes(opt.value)
    );
  }
  return props.options.filter((opt) => opt.value === props.modelValue);
});

// Display text for the trigger button
const displayText = computed(() => {
  if (selectedOptions.value.length === 0) {
    return "";
  }
  if (props.multiple) {
    if (selectedOptions.value.length === 1) {
      return selectedOptions.value[0].label;
    }
    return `${selectedOptions.value.length} selected`;
  }
  return selectedOptions.value[0]?.label || "";
});

// Check if an option is selected
const isSelected = (option: SelectOption) => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return false;
  }
  if (props.multiple && Array.isArray(props.modelValue)) {
    return (props.modelValue as (string | number)[]).includes(option.value);
  }
  return props.modelValue === option.value;
};

// Size-based classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      trigger: "h-7 px-3 text-button-small",
      icon: "w-4 h-4",
      label: "text-label mb-1",
      hint: "text-suggestion mt-1",
      dropdown: "py-1",
      option: "px-2 py-1.5 text-label",
      optionIcon: "w-4 h-4",
    },
    md: {
      trigger: "h-9 px-3 text-body-regular",
      icon: "w-5 h-5",
      label: "text-label-bold mb-1",
      hint: "text-label mt-1",
      dropdown: "py-1.5",
      option: "px-3 py-2 text-body-regular",
      optionIcon: "w-5 h-5",
    },
    lg: {
      trigger: "h-11 px-4 text-body-large",
      icon: "w-5 h-5",
      label: "text-body-regular font-medium mb-1.5",
      hint: "text-label mt-1.5",
      dropdown: "py-2",
      option: "px-4 py-2.5 text-body-large",
      optionIcon: "w-5 h-5",
    },
  };
  return sizes[props.size];
});

// Trigger button classes based on state
// Updated for dark mode support using semantic tokens
const triggerClasses = computed(() => {
  const base = [
    "w-full",
    "flex items-center gap-2",
    "rounded-sm",
    "transition-colors duration-150",
    "focus:outline-none",
    sizeClasses.value.trigger,
  ];

  // Variant-specific base styles
  // Use explicit dark variant for SSR hydration safety
  if (props.variant === "ghost") {
    base.push("bg-transparent");
  } else {
    base.push("bg-white dark:bg-neutral-900", "border");
  }

  // Icon padding
  if (props.iconLeft) {
    base.push(props.size === "sm" ? "pl-8" : props.size === "lg" ? "pl-11" : "pl-10");
  }

  // State classes - using semantic tokens for theme support
  if (props.disabled) {
    if (props.variant === "ghost") {
      base.push("text-content-disabled", "cursor-not-allowed");
    } else {
      base.push(
        "bg-surface-raised",
        "border-stroke-strong",
        "text-content-disabled",
        "cursor-not-allowed"
      );
    }
  } else if (props.readonly) {
    if (props.variant === "ghost") {
      base.push("text-content-secondary", "cursor-default");
    } else {
      base.push(
        "bg-surface-raised",
        "border-stroke-strong",
        "text-content-secondary",
        "cursor-default"
      );
    }
  } else if (hasError.value) {
    if (props.variant === "ghost") {
      base.push(
        "text-content-primary",
        "hover:bg-error-50 dark:hover:bg-error-950",
        "focus:ring-2 focus:ring-error-500/20"
      );
    } else {
      base.push(
        "border-error-500",
        "text-content-primary",
        "focus:border-error-700",
        "focus:ring-2 focus:ring-error-500/20"
      );
    }
  } else if (isOpen.value || isFocused.value) {
    if (props.variant === "ghost") {
      base.push(
        "bg-main-50 dark:bg-main-950",
        "text-content-primary",
        "ring-2 ring-main-500/20"
      );
    } else {
      base.push(
        "border-main-500",
        "text-content-primary",
        "ring-2 ring-main-500/20"
      );
    }
  } else {
    if (props.variant === "ghost") {
      base.push(
        "text-content-primary",
        "hover:bg-surface-overlay",
        "focus:ring-2 focus:ring-main-500/20"
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
  }

  return base;
});

// Open dropdown
const openDropdown = () => {
  if (props.disabled || props.readonly) return;

  // Calculate dropdown position before opening
  updateDropdownPosition();

  // Notify coordinator - this will close any other open select
  coordinator.notifyOpen();

  isOpen.value = true;
  highlightedIndex.value = selectedOptions.value.length > 0
    ? filteredOptions.value.findIndex((opt) => isSelected(opt))
    : 0;
  emit("open");
  nextTick(() => {
    if (props.searchable && searchInputRef.value) {
      searchInputRef.value.focus();
    }
  });
};

// Close dropdown
const closeDropdown = () => {
  if (!isOpen.value) return; // Prevent redundant close calls

  isOpen.value = false;
  searchQuery.value = "";
  highlightedIndex.value = -1;

  // Notify coordinator that this select is closed
  coordinator.notifyClose();

  emit("close");
  // Only focus trigger if this close was intentional (not from coordinator)
  // to avoid stealing focus when switching between selects
};

// Toggle dropdown
const toggleDropdown = () => {
  if (isOpen.value) {
    closeDropdown();
  } else {
    openDropdown();
  }
};

// Select an option
const selectOption = (option: SelectOption) => {
  if (option.disabled) return;

  if (props.multiple) {
    const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentValues.indexOf(option.value);
    if (index === -1) {
      currentValues.push(option.value);
    } else {
      currentValues.splice(index, 1);
    }
    emit("update:modelValue", currentValues);
  } else {
    emit("update:modelValue", option.value);
    closeDropdown();
  }
};

// Clear selection
const clearSelection = (event: Event) => {
  event.stopPropagation();
  if (props.multiple) {
    emit("update:modelValue", []);
  } else {
    emit("update:modelValue", null);
  }
};

// Handle focus
const handleFocus = () => {
  isFocused.value = true;
  emit("focus");
};

// Handle blur
const handleBlur = (event: FocusEvent) => {
  // Don't blur if focus is moving within the component
  const relatedTarget = event.relatedTarget as HTMLElement;
  if (dropdownRef.value?.contains(relatedTarget)) {
    return;
  }
  isFocused.value = false;
  // Note: closeDropdown is handled by coordinator for click-outside
  // Only close on blur if focus is leaving the component entirely (e.g., Tab key)
  if (isOpen.value && relatedTarget && !triggerRef.value?.contains(relatedTarget)) {
    closeDropdown();
  }
  emit("blur");
};

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled || props.readonly) return;

  switch (event.key) {
    case "Enter":
    case " ":
      if (!isOpen.value) {
        event.preventDefault();
        openDropdown();
      } else if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
        event.preventDefault();
        selectOption(filteredOptions.value[highlightedIndex.value]);
      }
      break;
    case "Escape":
      if (isOpen.value) {
        event.preventDefault();
        closeDropdown();
      }
      break;
    case "ArrowDown":
      event.preventDefault();
      if (!isOpen.value) {
        openDropdown();
      } else {
        highlightedIndex.value = Math.min(
          highlightedIndex.value + 1,
          filteredOptions.value.length - 1
        );
        scrollToHighlighted();
      }
      break;
    case "ArrowUp":
      event.preventDefault();
      if (!isOpen.value) {
        openDropdown();
      } else {
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
        scrollToHighlighted();
      }
      break;
    case "Home":
      if (isOpen.value) {
        event.preventDefault();
        highlightedIndex.value = 0;
        scrollToHighlighted();
      }
      break;
    case "End":
      if (isOpen.value) {
        event.preventDefault();
        highlightedIndex.value = filteredOptions.value.length - 1;
        scrollToHighlighted();
      }
      break;
    case "Tab":
      if (isOpen.value) {
        closeDropdown();
      }
      break;
  }
};

// Scroll highlighted option into view
const scrollToHighlighted = () => {
  nextTick(() => {
    const highlightedEl = optionRefs.value[highlightedIndex.value];
    if (highlightedEl) {
      highlightedEl.scrollIntoView({ block: "nearest" });
    }
  });
};

// Handle search input
const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  searchQuery.value = target.value;
  highlightedIndex.value = 0;
};

// Setup coordinator registration
onMounted(() => {
  coordinator.register(closeDropdown);
});

onUnmounted(() => {
  coordinator.unregister();
});

// Compute max height for dropdown based on max visible options
const dropdownMaxHeight = computed(() => {
  const optionHeight = props.size === "sm" ? 32 : props.size === "lg" ? 44 : 40;
  const searchHeight = props.searchable ? (props.size === "sm" ? 36 : props.size === "lg" ? 48 : 44) : 0;
  const padding = props.size === "sm" ? 8 : props.size === "lg" ? 16 : 12;
  return searchHeight + (optionHeight * props.maxVisibleOptions) + padding;
});

// Track whether dropdown should open upward
const openUpward = ref(false);

// Calculate if dropdown should open upward based on available space
const updateDropdownPosition = () => {
  if (!triggerRef.value || typeof window === 'undefined') return;

  const triggerRect = triggerRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const dropdownHeight = dropdownMaxHeight.value;

  // Space available below and above the trigger
  const spaceBelow = viewportHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;

  // Open upward if there's not enough space below but there is above
  // Add 20px buffer for padding/margins
  openUpward.value = spaceBelow < dropdownHeight + 20 && spaceAbove > spaceBelow;
};
</script>

<template>
  <div :class="['flex flex-col', fullWidth ? 'w-full' : '']" :data-select-id="instanceId">
    <!-- Label -->
    <label
      v-if="label"
      :for="selectId"
      :class="[
        sizeClasses.label,
        disabled ? 'text-content-disabled' : 'text-content-secondary'
      ]"
    >
      {{ label }}
      <span v-if="required" class="text-error-500 ml-0.5">*</span>
    </label>

    <!-- Select wrapper -->
    <div class="relative">
      <!-- Left icon -->
      <div
        v-if="iconLeft"
        :class="[
          'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10',
          disabled ? 'text-content-disabled' : hasError ? 'text-error-500' : 'text-content-tertiary'
        ]"
      >
        <component
          :is="iconLeft"
          :class="sizeClasses.icon"
          aria-hidden="true"
        />
      </div>

      <!-- Trigger button -->
      <button
        :id="selectId"
        ref="triggerRef"
        type="button"
        :name="name"
        :disabled="disabled"
        :class="triggerClasses"
        :aria-expanded="isOpen"
        :aria-haspopup="'listbox'"
        :aria-controls="listboxId"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-describedby="ariaDescribedby"
        :aria-required="required ? 'true' : undefined"
        @click="toggleDropdown"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      >
        <!-- Selected value or placeholder -->
        <span
          :class="[
            'flex-1 text-left truncate',
            !displayText ? 'text-content-tertiary' : ''
          ]"
        >
          {{ displayText || placeholder }}
        </span>

        <!-- Clear button (when has selection and not disabled/readonly) -->
        <button
          v-if="selectedOptions.length > 0 && !disabled && !readonly"
          type="button"
          class="p-0.5 rounded hover:bg-surface-overlay transition-colors"
          aria-label="Clear selection"
          @click="clearSelection"
        >
          <XMarkIcon :class="[sizeClasses.icon, 'text-content-tertiary']" />
        </button>

        <!-- Error icon -->
        <ExclamationCircleIcon
          v-if="hasError"
          :class="[sizeClasses.icon, 'text-error-500 shrink-0']"
          aria-hidden="true"
        />

        <!-- Dropdown chevron -->
        <ChevronDownIcon
          v-else
          :class="[
            sizeClasses.icon,
            'shrink-0 transition-transform duration-150',
            isOpen ? 'rotate-180' : '',
            disabled ? 'text-content-disabled' : 'text-content-tertiary'
          ]"
          aria-hidden="true"
        />
      </button>

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
          v-if="isOpen"
          :id="listboxId"
          ref="dropdownRef"
          role="listbox"
          :aria-multiselectable="multiple ? 'true' : undefined"
          :class="[
            'absolute z-50 w-full bg-neutral-100 dark:bg-neutral-800 border border-stroke rounded-sm shadow-md overflow-hidden',
            openUpward ? 'bottom-full mb-1' : 'mt-1',
            sizeClasses.dropdown
          ]"
          :style="{ maxHeight: `${dropdownMaxHeight}px` }"
        >
          <!-- Search input -->
          <div v-if="searchable" class="px-2 pb-2 border-b border-stroke-subtle">
            <div class="relative">
              <MagnifyingGlassIcon
                :class="[
                  'absolute left-2.5 top-1/2 -translate-y-1/2 text-content-tertiary',
                  size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
                ]"
                aria-hidden="true"
              />
              <input
                ref="searchInputRef"
                type="text"
                :value="searchQuery"
                :class="[
                  'w-full border border-stroke rounded-sm bg-white dark:bg-neutral-900 text-content-primary placeholder:text-content-tertiary transition-colors focus:outline-none focus:border-main-500 focus:ring-1 focus:ring-main-500/20',
                  size === 'sm' ? 'h-7 pl-7 pr-2 text-label' : size === 'lg' ? 'h-10 pl-9 pr-3 text-body-regular' : 'h-8 pl-8 pr-2.5 text-body-regular'
                ]"
                :placeholder="'Search...'"
                @input="handleSearchInput"
                @keydown="handleKeydown"
              >
            </div>
          </div>

          <!-- Options list -->
          <div
            :class="[
              'overflow-y-auto',
              searchable ? 'pt-1' : ''
            ]"
            :style="{ maxHeight: `${dropdownMaxHeight - (searchable ? 52 : 0)}px` }"
          >
            <!-- Empty state -->
            <div
              v-if="filteredOptions.length === 0"
              :class="[
                'text-center text-content-tertiary',
                sizeClasses.option
              ]"
            >
              {{ searchQuery ? 'No matching options' : 'No options available' }}
            </div>

            <!-- Options -->
            <button
              v-for="(option, index) in filteredOptions"
              :key="option.value"
              :ref="el => optionRefs[index] = el as HTMLButtonElement | null"
              type="button"
              role="option"
              :aria-selected="isSelected(option)"
              :aria-disabled="option.disabled"
              :disabled="option.disabled"
              :class="[
                'w-full flex items-center gap-2 text-left transition-colors',
                sizeClasses.option,
                option.disabled
                  ? 'text-content-disabled cursor-not-allowed'
                  : isSelected(option)
                    ? 'bg-main-50 dark:bg-main-950 text-main-900 dark:text-main-100'
                    : highlightedIndex === index
                      ? 'bg-neutral-200 dark:bg-neutral-700 text-content-primary'
                      : 'text-content-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700'
              ]"
              @click="selectOption(option)"
              @mouseenter="highlightedIndex = index"
            >
              <!-- Checkbox for multiple selection -->
              <div
                v-if="multiple"
                :class="[
                  'flex items-center justify-center shrink-0 border rounded-sm transition-colors',
                  size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4',
                  option.disabled
                    ? 'border-stroke-strong bg-neutral-100 dark:bg-neutral-800'
                    : isSelected(option)
                      ? 'border-main-500 bg-main-500'
                      : 'border-stroke-strong bg-white dark:bg-neutral-900'
                ]"
              >
                <CheckIcon
                  v-if="isSelected(option)"
                  :class="[
                    'text-white',
                    size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'
                  ]"
                />
              </div>

              <!-- Option icon -->
              <component
                :is="option.icon"
                v-if="option.icon"
                :class="[sizeClasses.optionIcon, 'shrink-0']"
                aria-hidden="true"
              />

              <!-- Option label -->
              <span class="flex-1 truncate">{{ option.label }}</span>

              <!-- Check mark for single selection -->
              <CheckIcon
                v-if="!multiple && isSelected(option)"
                :class="[sizeClasses.optionIcon, 'text-main-500 shrink-0']"
                aria-hidden="true"
              />
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
