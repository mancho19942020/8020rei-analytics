<script setup lang="ts">
/**
 * AxisSlider - Range slider component for the Axis design system
 *
 * A single-value range slider with customizable appearance and behavior.
 * Supports both controlled (v-model) and uncontrolled usage.
 *
 * USAGE:
 * <AxisSlider v-model="value" :min="0" :max="100" />
 * <AxisSlider v-model="value" :min="0" :max="100" show-value suffix="%" />
 */

// -----------------------------
// Props & Emits
// -----------------------------

interface Props {
  /** Current value (v-model) */
  modelValue: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Whether to show value indicator */
  showValue?: boolean;
  /** Prefix for displayed value (e.g., "$") */
  prefix?: string;
  /** Suffix for displayed value (e.g., "%") */
  suffix?: string;
  /** Accessible label */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Error state */
  error?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  showValue: false,
  prefix: '',
  suffix: '',
  label: 'Slider',
  size: 'md',
  error: false,
});

const emit = defineEmits<Emits>();

// -----------------------------
// Computed
// -----------------------------

/**
 * Calculate the fill percentage for the track.
 */
const fillPercent = computed(() => {
  const range = props.max - props.min;
  if (range === 0) return 0;
  return ((props.modelValue - props.min) / range) * 100;
});

/**
 * Track height based on size variant.
 */
const trackHeightClass = computed(() => {
  const sizes = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };
  return sizes[props.size];
});

/**
 * Thumb size based on size variant.
 * Note: Currently unused but kept for future enhancement of dynamic thumb sizing.
 */
const _thumbSizeClass = computed(() => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  return sizes[props.size];
});

// -----------------------------
// Methods
// -----------------------------

/**
 * Handle input change.
 */
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = Number(target.value);
  emit('update:modelValue', value);
};
</script>

<template>
  <div
    class="axis-slider flex items-center gap-3"
    :class="{
      'opacity-50 cursor-not-allowed': disabled,
    }"
  >
    <!-- Slider container -->
    <div class="relative flex-1 flex items-center">
      <!-- Track background -->
      <div
        class="absolute inset-0 rounded-full bg-neutral-200/60 dark:bg-neutral-600/40"
        :class="[trackHeightClass, { 'bg-error-200 dark:bg-error-800/50': error }]"
      />

      <!-- Filled track -->
      <div
        class="absolute left-0 rounded-full"
        :class="[
          trackHeightClass,
          error
            ? 'bg-error-500 dark:bg-error-400'
            : 'bg-main-500 dark:bg-main-400',
        ]"
        :style="{ width: `${fillPercent}%` }"
      />

      <!-- Native range input (styled with CSS) -->
      <input
        type="range"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :aria-label="label"
        class="axis-slider-input relative w-full cursor-pointer appearance-none bg-transparent z-10"
        :class="[trackHeightClass, { 'cursor-not-allowed': disabled, 'error-state': error }]"
        @input="handleInput"
      >
    </div>

    <!-- Value display (optional) -->
    <span
      v-if="showValue"
      class="text-label font-medium tabular-nums text-content-primary min-w-[3ch] text-right"
      :class="{ 'text-error-600 dark:text-error-400': error }"
    >
      {{ prefix }}{{ modelValue }}{{ suffix }}
    </span>
  </div>
</template>

<style scoped>
/* Custom styling for the range input thumb */
.axis-slider-input::-webkit-slider-thumb {
  appearance: none;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background-color: white;
  border: 2px solid #22c55e; /* main-500 */
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  cursor: pointer;
  transition: border-color 150ms, box-shadow 150ms, transform 150ms;
}

.axis-slider-input::-webkit-slider-thumb:hover {
  border-color: #16a34a; /* main-600 */
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transform: scale(1.1);
}

.axis-slider-input::-webkit-slider-thumb:active {
  border-color: #15803d; /* main-700 */
  transform: scale(1.05);
}

.axis-slider-input:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
  border-color: #a3a3a3; /* neutral-400 */
}

/* Firefox */
.axis-slider-input::-moz-range-thumb {
  appearance: none;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background-color: white;
  border: 2px solid #22c55e; /* main-500 */
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  cursor: pointer;
  transition: border-color 150ms, box-shadow 150ms, transform 150ms;
}

.axis-slider-input::-moz-range-thumb:hover {
  border-color: #16a34a; /* main-600 */
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.axis-slider-input::-moz-range-track {
  background: transparent;
}

/* Error state thumb styling */
.axis-slider-input.error-state::-webkit-slider-thumb {
  border-color: #ef4444; /* error-500 */
}

.axis-slider-input.error-state::-moz-range-thumb {
  border-color: #ef4444; /* error-500 */
}
</style>
