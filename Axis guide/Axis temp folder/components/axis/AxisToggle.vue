<script setup lang="ts">
/**
 * AxisToggle Component
 *
 * A toggle/switch component for binary on/off settings following Axis design system specifications.
 * Based on Kairo design system with Carbon Design System best practices.
 *
 * USAGE:
 * <AxisToggle v-model="enabled" />
 * <AxisToggle v-model="setting" label="Enable notifications" />
 * <AxisToggle v-model="value" label="Dark mode" hint="Use dark theme" />
 * <AxisToggle v-model="value" inside-text />
 *
 * VARIANTS:
 * - Single: Toggle only (standalone control)
 * - With label: Toggle with descriptive label text
 * - With label and hint: Toggle with label and supporting hint text
 * - Inside text: Shows "ON"/"OFF" text inside the toggle switch
 *
 * STATES:
 * - default: Ready for interaction
 * - hover: Visual feedback on mouse hover
 * - focus: Keyboard focus indicator
 * - active (on/off): The toggled state
 * - disabled: Non-interactive state
 *
 * ACCESSIBILITY:
 * - Uses semantic <button role="switch"> for proper ARIA support
 * - Label properly associated via aria-labelledby
 * - Hint text linked via aria-describedby
 * - Current state announced via aria-checked
 * - Supports keyboard navigation (Space/Enter to toggle)
 * - Focus visible ring for keyboard users
 */

interface Props {
  /** Toggle value (v-model) */
  modelValue?: boolean;
  /** Label text */
  label?: string;
  /** Hint/helper text shown below label */
  hint?: string;
  /** Disable the toggle */
  disabled?: boolean;
  /** Show ON/OFF text inside the toggle */
  insideText?: boolean;
  /** HTML input name attribute (for forms) */
  name?: string;
  /** HTML id attribute */
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  label: "",
  hint: "",
  disabled: false,
  insideText: false,
  name: "",
  id: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "change", value: boolean): void;
}>();

// Generate unique ID if not provided - use useId() for SSR-safe stable IDs
const generatedId = useId();
const toggleId = computed(() => props.id || `axis-toggle-${generatedId}`);
const labelId = computed(() => `${toggleId.value}-label`);
const hintId = computed(() => `${toggleId.value}-hint`);

// Compute aria-describedby for accessibility
const ariaDescribedby = computed(() => {
  return props.hint ? hintId.value : undefined;
});

// Handle toggle
const handleToggle = () => {
  if (props.disabled) return;
  const newValue = !props.modelValue;
  emit("update:modelValue", newValue);
  emit("change", newValue);
};

// Handle keyboard events
const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return;
  // Space or Enter toggles the switch
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    handleToggle();
  }
};

// Track container classes - with dark mode support
const containerClasses = computed(() => {
  const base = [
    "relative rounded-full transition-all duration-200 ease-out",
    "flex items-center shrink-0",
  ];

  // Size based on insideText variant
  if (props.insideText) {
    base.push("w-12 h-6 p-0.5");
  } else {
    base.push("w-12 h-6");
  }

  // Background color based on state
  if (props.disabled) {
    base.push("bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed");
  } else if (props.modelValue) {
    // On state - use main-900 (dark navy) like in Figma
    base.push(
      "bg-main-900 dark:bg-main-700",
      "hover:bg-main-700 dark:hover:bg-main-500"
    );
  } else {
    // Off state - neutral gray
    base.push(
      "bg-neutral-300 dark:bg-neutral-600",
      "hover:bg-neutral-400 dark:hover:bg-neutral-500"
    );
  }

  return base;
});

// Knob classes - the circle that slides
const knobClasses = computed(() => {
  const base = [
    "absolute rounded-full transition-all duration-200 ease-out",
    "w-5 h-5",
    "flex items-center justify-center",
  ];

  // Position based on state and variant
  if (props.insideText) {
    // With inside text, knob moves further
    if (props.modelValue) {
      base.push("translate-x-6"); // Right position (48px - 20px - 4px padding)
    } else {
      base.push("translate-x-0.5"); // Left position (2px padding)
    }
  } else {
    // Without inside text, knob is centered in track
    if (props.modelValue) {
      base.push("left-6"); // Right position
    } else {
      base.push("left-0.5"); // Left position
    }
  }

  // Color based on state
  if (props.disabled) {
    base.push("bg-neutral-300 dark:bg-neutral-600");
  } else {
    base.push("bg-white dark:bg-white shadow-sm");
  }

  return base;
});

// Label text classes - with dark mode support
const labelClasses = computed(() => {
  const base = ["text-body-regular select-none"];

  if (props.disabled) {
    base.push("text-content-disabled cursor-not-allowed");
  } else {
    base.push("text-content-secondary cursor-pointer");
  }

  return base;
});

// Hint text classes - with dark mode support
const hintClasses = computed(() => {
  const base = ["text-label"];

  if (props.disabled) {
    base.push("text-content-disabled");
  } else {
    base.push("text-content-tertiary");
  }

  return base;
});
</script>

<template>
  <div class="flex items-start gap-3">
    <!-- Toggle switch button -->
    <button
      :id="toggleId"
      type="button"
      role="switch"
      :aria-checked="modelValue ? 'true' : 'false'"
      :aria-labelledby="label ? labelId : undefined"
      :aria-describedby="ariaDescribedby"
      :disabled="disabled"
      :class="[
        containerClasses,
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-2',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      ]"
      @click="handleToggle"
      @keydown="handleKeydown"
    >
      <!-- Inside text (ON/OFF) -->
      <span
        v-if="insideText"
        :class="[
          'text-suggestion-bold uppercase select-none transition-opacity duration-200',
          disabled ? 'text-neutral-400 dark:text-neutral-500' : 'text-white',
          modelValue ? 'opacity-100 ml-1' : 'opacity-0'
        ]"
      >
        ON
      </span>

      <span
        v-if="insideText"
        :class="[
          'text-suggestion-bold uppercase select-none transition-opacity duration-200',
          disabled ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-100 dark:text-neutral-200',
          !modelValue ? 'opacity-100 ml-auto mr-1' : 'opacity-0'
        ]"
      >
        OFF
      </span>

      <!-- Toggle knob (circle) -->
      <span :class="knobClasses" aria-hidden="true" />
    </button>

    <!-- Label and hint text -->
    <div v-if="label || hint" class="flex flex-col pt-0.5">
      <label
        v-if="label"
        :id="labelId"
        :for="toggleId"
        :class="labelClasses"
      >
        {{ label }}
      </label>
      <span v-if="hint" :id="hintId" :class="hintClasses">
        {{ hint }}
      </span>
    </div>
  </div>
</template>
