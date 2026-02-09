<script setup lang="ts">
/**
 * AxisStepper Component
 *
 * Step-based navigation for multi-step processes, wizards, and flows.
 * Allows users to track progress and navigate across stages.
 *
 * USAGE:
 * <AxisStepper v-model="currentStep" :steps="steps" />
 * <AxisStepper v-model="currentStep" :steps="steps" variant="dash" />
 * <AxisStepper v-model="currentStep" :steps="steps" orientation="vertical" />
 *
 * PRIMARY USE:
 * - Multi-step forms and wizards
 * - Onboarding flows
 * - Configuration processes
 * - Checkout flows
 *
 * VARIANTS:
 * - default: Full stepper with labels in scrollable container
 * - dash: Compact dash/progress bar style
 * - numbered: Steps shown as numbers (legacy, same as default)
 *
 * FEATURES:
 * - Linear and non-linear navigation
 * - Step states: pending, active, completed, error
 * - Optional step support
 * - Horizontal scroll with navigation arrows
 * - Keyboard navigation
 *
 * ACCESSIBILITY:
 * - Uses proper aria-current for active step
 * - Step status communicated via aria-label
 * - Keyboard navigation support
 */

import type { Component } from 'vue'
import { ref, computed, nextTick, watch } from 'vue'

interface Step {
  /** Unique identifier for the step */
  id: string
  /** Display label for the step */
  label: string
  /** Optional description */
  description?: string
  /** Icon component (optional) */
  icon?: Component
  /** Whether this step is optional */
  optional?: boolean
  /** Error state for this step */
  error?: boolean
  /** Disable navigation to this step */
  disabled?: boolean
}

interface Props {
  /** Current active step index (0-based) */
  modelValue: number
  /** Array of steps */
  steps: Step[]
  /** Visual variant */
  variant?: 'default' | 'dash' | 'numbered'
  /** Orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Allow clicking on any step (non-linear) */
  nonLinear?: boolean
  /** Size variant */
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  orientation: 'horizontal',
  nonLinear: false,
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

// Scroll container ref
const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const hasOverflow = ref(false)

// Check scroll position
const checkScroll = () => {
  if (!scrollContainer.value) return

  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value
  hasOverflow.value = scrollWidth > clientWidth
  canScrollLeft.value = scrollLeft > 0
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1
}

// Scroll handlers
const scrollLeft = () => {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollBy({ left: -200, behavior: 'smooth' })
  setTimeout(checkScroll, 300)
}

const scrollRight = () => {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollBy({ left: 200, behavior: 'smooth' })
  setTimeout(checkScroll, 300)
}

// Initialize scroll check
const initScroll = async () => {
  await nextTick()
  checkScroll()
}

// Scroll to make active step visible
const scrollToActiveStep = () => {
  if (!scrollContainer.value) return

  // Find the active step button element
  const stepButtons = scrollContainer.value.querySelectorAll('button')
  const activeButton = stepButtons[props.modelValue]

  if (!activeButton) return

  // Scroll the active step into view with smooth behavior
  activeButton.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center', // Center horizontally in the container
  })

  // Update scroll button visibility after animation
  setTimeout(checkScroll, 300)
}

// Get step state
const getStepState = (index: number): 'pending' | 'active' | 'completed' | 'error' => {
  if (props.steps[index]?.error) return 'error'
  if (index === props.modelValue) return 'active'
  if (index < props.modelValue) return 'completed'
  return 'pending'
}

// Check if step is clickable
const isStepClickable = (index: number): boolean => {
  if (props.steps[index]?.disabled) return false
  if (props.nonLinear) return true
  // In linear mode, can only go to completed steps or current step
  return index <= props.modelValue
}

// Handle step click
const handleStepClick = (index: number) => {
  if (!isStepClickable(index)) return
  emit('update:modelValue', index)
}

// Navigate to next step
const nextStep = () => {
  if (props.modelValue < props.steps.length - 1) {
    emit('update:modelValue', props.modelValue + 1)
  }
}

// Navigate to previous step
const prevStep = () => {
  if (props.modelValue > 0) {
    emit('update:modelValue', props.modelValue - 1)
  }
}

// Expose navigation methods
defineExpose({ nextStep, prevStep })

// Size-based classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      indicator: 'w-4 h-4',
      label: 'text-label',
      checkIcon: 'w-2.5 h-2.5',
      dash: 'h-1 w-10',
    },
    md: {
      indicator: 'w-4 h-4',
      label: 'text-body-regular',
      checkIcon: 'w-2.5 h-2.5',
      dash: 'h-1 w-10',
    },
  }
  return sizes[props.size]
})

// Get indicator classes based on state (per one-pager spec)
const getIndicatorClasses = (state: 'pending' | 'active' | 'completed' | 'error') => {
  const base = [
    'flex items-center justify-center rounded-full shrink-0',
    'transition-colors duration-200',
    sizeClasses.value.indicator,
  ]

  switch (state) {
    case 'completed':
      // Spec: main-700 fill, white checkmark
      base.push('bg-main-700 dark:bg-main-600 border border-main-800 dark:border-main-700')
      break
    case 'active':
      // Spec: main-50 fill, main-700 border
      base.push('bg-main-50 dark:bg-main-900 border border-main-700 dark:border-main-500')
      break
    case 'error':
      base.push('bg-error-50 dark:bg-error-950 border-2 border-error-500 text-error-500')
      break
    default: // pending or disabled
      // Spec: Empty circle, neutral-300 stroke
      base.push('bg-transparent border border-neutral-300 dark:border-neutral-700')
  }

  return base
}

// Get dash segment classes based on state
const getDashClasses = (state: 'pending' | 'active' | 'completed' | 'error') => {
  const base = [
    'rounded-full transition-colors duration-200',
    sizeClasses.value.dash,
  ]

  switch (state) {
    case 'completed':
    case 'active':
      base.push('bg-main-700 dark:bg-main-600')
      break
    case 'error':
      base.push('bg-error-500')
      break
    default: // pending
      base.push('bg-neutral-200 dark:bg-neutral-700')
  }

  return base
}

// Get label classes based on state (per one-pager spec)
const getLabelClasses = (state: 'pending' | 'active' | 'completed' | 'error', clickable: boolean, disabled: boolean) => {
  const base = [sizeClasses.value.label, 'transition-colors duration-200 whitespace-nowrap']

  if (disabled) {
    // Spec: Disabled label is neutral-400
    base.push('text-neutral-400 dark:text-neutral-600 font-normal')
  } else {
    switch (state) {
      case 'active':
        // Spec: Active label is neutral-700, semi-bold 14px
        base.push('text-neutral-700 dark:text-neutral-300 font-semibold')
        break
      case 'completed':
        base.push('text-main-900 dark:text-main-300 font-semibold')
        break
      case 'error':
        base.push('text-error-500 font-normal')
        break
      default: // pending
        base.push('text-content-secondary font-normal')
    }
  }

  if (clickable && !disabled) {
    base.push('cursor-pointer hover:text-main-700 dark:hover:text-main-400')
  } else if (!clickable) {
    base.push('cursor-default')
  }

  return base
}

// Mount and watch for resize
onMounted(() => {
  initScroll()
  window.addEventListener('resize', checkScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScroll)
})

// Watch steps changes
watch(() => props.steps.length, () => {
  nextTick(checkScroll)
})

// Watch for step changes and auto-scroll to active step
watch(() => props.modelValue, () => {
  nextTick(scrollToActiveStep)
})
</script>

<template>
  <!-- Dash Variant -->
  <div
    v-if="variant === 'dash'"
    class="flex items-center gap-1"
    role="group"
    :aria-label="`Step ${modelValue + 1} of ${steps.length}`"
  >
    <div
      v-for="(step, index) in steps"
      :key="step.id"
      :class="getDashClasses(getStepState(index))"
      :aria-current="index === modelValue ? 'step' : undefined"
      :aria-label="`Step ${index + 1}: ${step.label}`"
    />
  </div>

  <!-- Horizontal Variant (Default/Numbered) -->
  <!-- Spec: Container height 36px (h-9), border-radius 8px -->
  <div
    v-else-if="orientation === 'horizontal'"
    class="flex items-center gap-2 h-9 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2"
    role="group"
    aria-label="Progress steps"
    @scroll="checkScroll"
  >
    <!-- Left scroll button -->
    <button
      v-if="canScrollLeft"
      type="button"
      class="shrink-0 w-6 h-6 flex items-center justify-center rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
      aria-label="Scroll left"
      @click="scrollLeft"
    >
      <svg class="w-4 h-4 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <!-- Scrollable steps container -->
    <div
      ref="scrollContainer"
      :class="[
        'flex-1 flex items-center gap-6 overflow-x-auto scrollbar-hide px-2',
        !hasOverflow ? 'justify-center' : ''
      ]"
      @scroll="checkScroll"
    >
      <template v-for="(step, index) in steps" :key="step.id">
        <!-- Step Item -->
        <button
          type="button"
          class="flex items-center gap-2 shrink-0"
          :class="isStepClickable(index) ? 'cursor-pointer' : 'cursor-default'"
          :aria-current="index === modelValue ? 'step' : undefined"
          :aria-label="`Step ${index + 1}: ${step.label}${step.optional ? ' (optional)' : ''}${getStepState(index) === 'completed' ? ', completed' : getStepState(index) === 'error' ? ', has error' : ''}`"
          :disabled="!isStepClickable(index)"
          @click="handleStepClick(index)"
        >
          <!-- Step Indicator -->
          <div :class="getIndicatorClasses(getStepState(index))">
            <!-- Completed checkmark -->
            <svg
              v-if="getStepState(index) === 'completed'"
              :class="sizeClasses.checkIcon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="3"
              class="text-white"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>

            <!-- Error icon -->
            <svg
              v-else-if="getStepState(index) === 'error'"
              class="w-2.5 h-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01" />
            </svg>
          </div>

          <!-- Label -->
          <span
            :class="getLabelClasses(getStepState(index), isStepClickable(index), step.disabled || false)"
          >
            {{ step.label }}
            <span v-if="step.optional" class="ml-1 text-label text-content-tertiary font-normal">
              (Optional)
            </span>
          </span>
        </button>

        <!-- Chevron separator (not after last step) -->
        <svg
          v-if="index < steps.length - 1"
          class="w-3 h-3 text-neutral-300 dark:text-neutral-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </template>
    </div>

    <!-- Right scroll button -->
    <button
      v-if="canScrollRight"
      type="button"
      class="shrink-0 w-6 h-6 flex items-center justify-center rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
      aria-label="Scroll right"
      @click="scrollRight"
    >
      <svg class="w-4 h-4 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>

  <!-- Vertical Variant -->
  <div
    v-else
    class="flex flex-col"
    role="group"
    aria-label="Progress steps"
  >
    <template v-for="(step, index) in steps" :key="step.id">
      <div class="flex">
        <!-- Indicator Column -->
        <div class="flex flex-col items-center mr-4">
          <!-- Step Indicator -->
          <button
            type="button"
            :class="[
              'w-8 h-8 flex items-center justify-center rounded-full shrink-0 transition-colors duration-200',
              getStepState(index) === 'completed' ? 'bg-main-700 dark:bg-main-600 text-white' :
              getStepState(index) === 'active' ? 'bg-main-50 dark:bg-main-950 border-2 border-main-700 dark:border-main-500 text-main-700 dark:text-main-400' :
              getStepState(index) === 'error' ? 'bg-error-50 dark:bg-error-950 border-2 border-error-500 text-error-500' :
              'bg-neutral-100 dark:bg-neutral-800 text-content-tertiary border border-stroke',
              isStepClickable(index) ? 'cursor-pointer' : 'cursor-default',
            ]"
            :aria-current="index === modelValue ? 'step' : undefined"
            :aria-label="`Step ${index + 1}: ${step.label}${step.optional ? ' (optional)' : ''}${getStepState(index) === 'completed' ? ', completed' : getStepState(index) === 'error' ? ', has error' : ''}`"
            :disabled="!isStepClickable(index)"
            @click="handleStepClick(index)"
          >
            <!-- Completed checkmark -->
            <svg
              v-if="getStepState(index) === 'completed'"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="3"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>

            <!-- Error icon -->
            <svg
              v-else-if="getStepState(index) === 'error'"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>

            <!-- Custom icon -->
            <component
              :is="step.icon"
              v-else-if="step.icon && variant === 'default'"
              class="w-4 h-4"
              aria-hidden="true"
            />

            <!-- Step number -->
            <span v-else class="text-body-regular">{{ index + 1 }}</span>
          </button>

          <!-- Vertical connector (not for last) -->
          <div
            v-if="index < steps.length - 1"
            :class="[
              'w-0.5 flex-1 min-h-[24px] my-1',
              index < modelValue ? 'bg-main-700 dark:bg-main-600' : 'bg-neutral-200 dark:bg-neutral-700',
            ]"
          />
        </div>

        <!-- Content Column -->
        <div :class="['pb-6', index < steps.length - 1 ? '' : 'pb-0']">
          <button
            type="button"
            :class="[
              'text-left text-body-large font-medium transition-colors duration-200',
              getStepState(index) === 'active' ? 'text-main-700 dark:text-main-400' :
              getStepState(index) === 'completed' ? 'text-content-primary' :
              getStepState(index) === 'error' ? 'text-error-500' :
              'text-content-tertiary',
              isStepClickable(index) ? 'cursor-pointer hover:text-main-700 dark:hover:text-main-400' : 'cursor-default',
            ]"
            :disabled="!isStepClickable(index)"
            @click="handleStepClick(index)"
          >
            {{ step.label }}
            <span v-if="step.optional" class="ml-1 text-label text-content-tertiary font-normal">
              (Optional)
            </span>
          </button>
          <p
            v-if="step.description"
            class="text-body-regular text-content-secondary mt-1"
          >
            {{ step.description }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
