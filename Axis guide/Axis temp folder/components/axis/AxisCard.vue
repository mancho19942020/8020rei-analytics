<script setup lang="ts">
/**
 * AxisCard Component
 *
 * A unified card component following Axis design system specifications.
 * Consolidates Detail Card, Radio Card, Onboarding Card, and Action Card patterns
 * from Kairo into a single, flexible component with variants.
 *
 * USAGE:
 * <AxisCard>Basic content</AxisCard>
 * <AxisCard variant="stat" label="Total Revenue" value="$123,456" />
 * <AxisCard variant="action" title="Add Property" description="Search and add new properties" />
 * <AxisCard variant="selectable" v-model:selected="isSelected">Option A</AxisCard>
 * <AxisCard variant="onboarding" :step="1" title="Connect Data Source" state="active" />
 *
 * VARIANTS:
 * - base (default): General content container with slots
 * - stat: KPI/metric display with optional progress bar or donut chart
 * - action: Clickable action cards with hover states
 * - selectable: Radio/checkbox style selection cards
 * - onboarding: Step-by-step guidance cards
 *
 * ACCESSIBILITY:
 * - Interactive cards are focusable with keyboard navigation
 * - Selectable cards use appropriate ARIA roles
 * - Focus ring visible for keyboard users
 * - All interactive states announced to screen readers
 */

import type { Component } from "vue";

// ============================================
// Types
// ============================================

export type CardVariant = "base" | "stat" | "action" | "selectable" | "onboarding" | "user";
export type UserStatus = "active" | "inactive" | "pending";
export type CardElevation = "flat" | "raised" | "elevated";
export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardRounded = "none" | "sm" | "md" | "lg";
export type StatDisplay = "simple" | "bar" | "donut";
export type SelectionType = "radio" | "checkbox";
export type OnboardingState = "default" | "non-completed" | "active" | "completed";
export type OnboardingVisual = "image" | "table";
export type OnboardingIdentifier = "number" | "tag";
export type CardColor = "neutral" | "main" | "success" | "error" | "accent";

// ============================================
// Props Interface
// ============================================

interface Props {
  // --- Base Props ---
  /** Card variant */
  variant?: CardVariant;
  /** Shadow elevation level */
  elevation?: CardElevation;
  /** Internal padding */
  padding?: CardPadding;
  /** Border radius */
  rounded?: CardRounded;
  /** Show border */
  bordered?: boolean;
  /** Enable interactive hover/focus states */
  interactive?: boolean;
  /** Enable clickable hover/focus states (for cards that navigate somewhere) */
  clickable?: boolean;
  /** Disable the card */
  disabled?: boolean;

  // --- Stat Variant Props ---
  /** Display type for stat variant */
  display?: StatDisplay;
  /** Metric label */
  label?: string;
  /** Primary value */
  value?: string | number;
  /** Secondary value (percentage, trend) */
  secondaryValue?: string;
  /** Progress percentage (0-100) for bar/donut */
  progress?: number;
  /** Accent color */
  color?: CardColor;
  /** Leading icon component */
  icon?: Component | null;
  /** Show empty state (dash) */
  empty?: boolean;

  // --- Action Variant Props ---
  /** Card title */
  title?: string;
  /** Supporting description */
  description?: string;
  /** CTA button text */
  actionLabel?: string;
  /** CTA icon */
  actionIcon?: Component | null;
  /** Navigation URL (makes card a link) */
  href?: string;

  // --- Selectable Variant Props ---
  /** Selection state */
  selected?: boolean;
  /** Selection behavior type */
  selectionType?: SelectionType;
  /** Group name for radio behavior */
  name?: string;
  /** Value when selected */
  selectionValue?: unknown;

  // --- Onboarding Variant Props ---
  /** Step number (shows circle with number) */
  step?: number;
  /** Tag text (alternative to step number) */
  tag?: string;
  /** Icon for tag */
  tagIcon?: Component | null;
  /** Step description */
  supportText?: string;
  /** Image URL for media section */
  mediaSrc?: string;
  /** Media alt text */
  mediaAlt?: string;
  /** Step state */
  state?: OnboardingState;
  /** Visual support type (image or table) */
  visualSupport?: OnboardingVisual;
  /** Identifier type (number or tag) */
  identifierType?: OnboardingIdentifier;

  // --- User Variant Props ---
  /** User's avatar image URL */
  avatarSrc?: string;
  /** User's display name */
  userName?: string;
  /** User's email address */
  userEmail?: string;
  /** User's role (displayed as a badge) */
  userRole?: string;
  /** User's status */
  userStatus?: UserStatus;
}

// ============================================
// Props with Defaults
// ============================================

const props = withDefaults(defineProps<Props>(), {
  variant: "base",
  elevation: "flat",
  padding: "md",
  rounded: "lg",
  bordered: true,
  interactive: false,
  clickable: false,
  disabled: false,
  display: "simple",
  label: undefined,
  value: undefined,
  secondaryValue: undefined,
  progress: undefined,
  color: "neutral",
  icon: null,
  empty: false,
  title: undefined,
  description: undefined,
  actionLabel: undefined,
  actionIcon: null,
  href: undefined,
  selected: false,
  selectionType: "radio",
  name: undefined,
  selectionValue: undefined,
  step: undefined,
  tag: undefined,
  tagIcon: null,
  supportText: undefined,
  mediaSrc: undefined,
  mediaAlt: "",
  state: "default",
  visualSupport: "image",
  identifierType: "number",
  avatarSrc: undefined,
  userName: undefined,
  userEmail: undefined,
  userRole: undefined,
  userStatus: "active",
});

// ============================================
// Emits
// ============================================

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
  (e: "select", value: unknown): void;
  (e: "update:selected", value: boolean): void;
  (e: "action"): void;
}>();

// ============================================
// Computed: Is Interactive
// ============================================

const isInteractive = computed(() => {
  if (props.disabled) return false;
  if (props.variant === "action") return true;
  if (props.variant === "selectable") return true;
  if (props.interactive) return true;
  if (props.clickable) return true;
  if (props.href) return true;
  return false;
});

// ============================================
// Computed: Container Classes
// ============================================

const paddingClasses = computed(() => {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };
  return paddings[props.padding];
});

const roundedClasses = computed(() => {
  const radii = {
    none: "",
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
  };
  return radii[props.rounded];
});

const elevationClasses = computed(() => {
  const elevations = {
    flat: "",
    raised: "shadow-sm",
    elevated: "shadow-md",
  };
  return elevations[props.elevation];
});

// Base container classes
const baseContainerClasses = computed(() => {
  return [
    // Flex column layout for proper content distribution
    "flex flex-col",
    // Full height for onboarding variant (allows button to anchor at bottom in grids)
    props.variant === "onboarding" ? "h-full" : "",
    // Background
    "bg-surface-base",
    // Border
    props.bordered ? "border border-stroke" : "",
    // Elevation
    elevationClasses.value,
    // Rounded
    roundedClasses.value,
    // Transition
    "transition-all duration-200",
  ];
});

// Interactive state classes
// Note: axis-hover-border class defined in main.css uses !important to override
// the dark mode border-stroke fallbacks that also use !important
const interactiveClasses = computed(() => {
  if (!isInteractive.value) return [];

  return [
    "cursor-pointer",
    "axis-hover-border",
    "hover:shadow-sm dark:hover:shadow-md dark:hover:shadow-main-900/20",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-2",
  ];
});

// Selectable state classes
const selectableClasses = computed(() => {
  if (props.variant !== "selectable") return [];

  if (props.selected) {
    return [
      "axis-selected-border",
      "bg-main-50 dark:bg-main-950",
    ];
  }
  return [];
});

// Onboarding state classes
const onboardingStateClasses = computed(() => {
  if (props.variant !== "onboarding") return [];

  const states: Record<OnboardingState, string[]> = {
    default: [],
    "non-completed": [],
    active: [
      "axis-selected-border",
      "ring-1 ring-main-500/20",
    ],
    completed: [],
  };

  return states[props.state];
});

// Onboarding text color classes based on state
const onboardingTextClasses = computed(() => {
  if (props.state === "non-completed") {
    return {
      title: "text-neutral-300 dark:text-neutral-600",
      description: "text-neutral-300 dark:text-neutral-600",
      supportText: "text-neutral-300 dark:text-neutral-600",
    };
  }
  return {
    title: "text-content-primary",
    description: "text-content-primary",
    supportText: "text-content-primary",
  };
});

// Disabled classes
const disabledClasses = computed(() => {
  if (!props.disabled) return [];
  return ["opacity-50", "pointer-events-none", "cursor-not-allowed"];
});

// User status classes and labels
const userStatusConfig = computed(() => {
  const configs: Record<UserStatus, { dot: string; text: string; label: string }> = {
    active: {
      dot: "bg-success-500",
      text: "text-success-700 dark:text-success-400",
      label: "Active",
    },
    inactive: {
      dot: "bg-neutral-400 dark:bg-neutral-500",
      text: "text-neutral-600 dark:text-neutral-400",
      label: "Inactive",
    },
    pending: {
      dot: "bg-alert-500",
      text: "text-alert-700 dark:text-alert-400",
      label: "Pending",
    },
  };
  return configs[props.userStatus];
});

// Combined container classes
const containerClasses = computed(() => {
  return [
    ...baseContainerClasses.value,
    ...interactiveClasses.value,
    ...selectableClasses.value,
    ...onboardingStateClasses.value,
    ...disabledClasses.value,
    // Padding for action variant always, base variant only when no media
    props.variant === "action" ? paddingClasses.value : "",
  ];
});

// ============================================
// Computed: Color Classes
// ============================================

const colorClasses = computed(() => {
  const colors = {
    neutral: {
      bar: "bg-neutral-500 dark:bg-neutral-400",
      donut: "text-neutral-500 dark:text-neutral-400",
      icon: "text-neutral-500 dark:text-neutral-400",
    },
    main: {
      bar: "bg-main-500 dark:bg-main-400",
      donut: "text-main-500 dark:text-main-400",
      icon: "text-main-500 dark:text-main-400",
    },
    success: {
      bar: "bg-success-500 dark:bg-success-400",
      donut: "text-success-500 dark:text-success-400",
      icon: "text-success-500 dark:text-success-400",
    },
    error: {
      bar: "bg-error-500 dark:bg-error-400",
      donut: "text-error-500 dark:text-error-400",
      icon: "text-error-500 dark:text-error-400",
    },
    accent: {
      bar: "bg-accent-1-500 dark:bg-accent-1-400",
      donut: "text-accent-1-500 dark:text-accent-1-400",
      icon: "text-accent-1-500 dark:text-accent-1-400",
    },
  };
  return colors[props.color];
});

// ============================================
// Computed: ARIA Attributes
// ============================================

const ariaRole = computed(() => {
  if (props.variant === "selectable") {
    return props.selectionType === "radio" ? "radio" : "checkbox";
  }
  if (isInteractive.value) {
    return "button";
  }
  return undefined;
});

const ariaChecked = computed(() => {
  if (props.variant === "selectable") {
    return props.selected;
  }
  return undefined;
});

// ============================================
// Handlers
// ============================================

const handleClick = (event: MouseEvent) => {
  if (props.disabled) return;

  emit("click", event);

  if (props.variant === "selectable") {
    const newSelected = !props.selected;
    emit("update:selected", newSelected);
    emit("select", props.selectionValue);
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return;
  if (!isInteractive.value) return;

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleClick(event as unknown as MouseEvent);
  }
};

const handleAction = () => {
  if (props.disabled) return;
  emit("action");
};

// ============================================
// Computed: Display Value (for stat variant)
// ============================================

const displayValue = computed(() => {
  if (props.empty) return "—";
  return props.value;
});

// ============================================
// Computed: Progress for donut (SVG calculations)
// ============================================

const donutProgress = computed(() => {
  const progress = props.progress ?? 0;
  const circumference = 2 * Math.PI * 13; // radius = 13 (for 32x32 viewBox)
  const offset = circumference - (progress / 100) * circumference;
  return {
    circumference,
    offset,
  };
});
</script>

<template>
  <!-- ============================================ -->
  <!-- COMPONENT: NuxtLink wrapper for href -->
  <!-- ============================================ -->
  <component
    :is="href ? resolveComponent('NuxtLink') : 'div'"
    :to="href"
    :class="containerClasses"
    :role="ariaRole"
    :aria-checked="ariaChecked"
    :aria-disabled="disabled ? 'true' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- ============================================ -->
    <!-- VARIANT: Base (default) -->
    <!-- ============================================ -->
    <template v-if="variant === 'base'">
      <!-- Media slot (positioned at top, no padding) -->
      <div v-if="$slots.media" class="overflow-hidden rounded-t-xl">
        <slot name="media" />
      </div>

      <!-- Content area with padding - uses flex-col to push footer to bottom -->
      <div v-if="$slots.header || $slots.default || $slots.footer" :class="[paddingClasses, 'flex flex-col flex-1']">
        <!-- Header slot -->
        <div v-if="$slots.header" :class="[$slots.default || $slots.footer ? 'mb-3' : '']">
          <slot name="header" />
        </div>

        <!-- Default slot (body) -->
        <div v-if="$slots.default">
          <slot />
        </div>

        <!-- Footer slot - mt-auto pushes to bottom when card has extra height -->
        <div v-if="$slots.footer" :class="[($slots.default || $slots.header) ? 'mt-auto pt-3 border-t border-stroke-subtle' : 'mt-auto']">
          <slot name="footer" />
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- VARIANT: Stat -->
    <!-- Based on Kairo design system references -->
    <!-- ============================================ -->
    <template v-else-if="variant === 'stat'">
      <div class="p-4">
        <!-- Simple display -->
        <template v-if="display === 'simple'">
          <div class="flex items-start gap-2">
            <!-- Icon (20x20px per Kairo spec) -->
            <component
              :is="icon"
              v-if="icon"
              :class="['w-5 h-5 shrink-0', colorClasses.icon]"
              aria-hidden="true"
            />

            <div class="flex-1 min-w-0 flex flex-col gap-1">
              <!-- Label (12px/H6, neutral-500) -->
              <p class="text-label text-content-secondary leading-[1.36]">{{ label }}</p>

              <!-- Value (14px/H5, semi-bold, neutral-700) -->
              <p class="text-body-regular font-semibold text-content-primary leading-[1.36]">{{ displayValue }}</p>

              <!-- Custom slot content -->
              <div v-if="$slots.default" class="mt-1">
                <slot />
              </div>
            </div>
          </div>
        </template>

        <!-- Bar display -->
        <template v-else-if="display === 'bar'">
          <div class="flex items-start gap-2">
            <!-- Icon (20x20px per Kairo spec) -->
            <component
              :is="icon"
              v-if="icon"
              :class="['w-5 h-5 shrink-0', colorClasses.icon]"
              aria-hidden="true"
            />

            <div class="flex-1 min-w-0 flex flex-col gap-1">
              <!-- Label (12px/H6, neutral-500) -->
              <p class="text-label text-content-secondary leading-[1.36]">{{ label }}</p>

              <!-- Value row with percentage (14px/H5) -->
              <div class="flex flex-col gap-0.5">
                <div class="flex items-center justify-between leading-[1.36]">
                  <!-- Value (semi-bold) -->
                  <p class="text-body-regular font-semibold text-content-primary">{{ displayValue }}</p>
                  <!-- Percentage (regular weight) -->
                  <p v-if="progress !== undefined" class="text-body-regular text-content-primary">
                    {{ progress }}%
                  </p>
                </div>

                <!-- Progress bar (6px height, rounded-lg per Kairo spec) -->
                <div class="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                  <div
                    class="h-full rounded-r-lg transition-all duration-300"
                    :class="colorClasses.bar"
                    :style="{ width: `${progress ?? 0}%` }"
                    role="progressbar"
                    :aria-valuenow="progress ?? 0"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Donut display -->
        <template v-else-if="display === 'donut'">
          <div class="flex items-center gap-2">
            <!-- Donut chart (32x32px per Kairo spec) -->
            <div class="relative w-8 h-8 shrink-0">
              <svg class="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <!-- Background circle -->
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  class="text-neutral-100 dark:text-neutral-800"
                />
                <!-- Progress circle -->
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  :stroke-dasharray="donutProgress.circumference"
                  :stroke-dashoffset="donutProgress.offset"
                  :class="colorClasses.donut"
                  class="transition-all duration-500"
                />
              </svg>
            </div>

            <div class="flex-1 min-w-0 flex flex-col">
              <!-- Label (12px/H6, neutral-500) -->
              <p class="text-label text-content-secondary leading-[1.36]">{{ label }}</p>
              <!-- Value (16px/H4, semi-bold, neutral-700) -->
              <p class="text-body-large font-semibold text-content-primary leading-[1.36]">{{ displayValue }}</p>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- VARIANT: Action -->
    <!-- ============================================ -->
    <template v-else-if="variant === 'action'">
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <component
          :is="icon"
          v-if="icon"
          class="w-6 h-6 shrink-0 text-main-500 dark:text-main-400"
          aria-hidden="true"
        />

        <div class="flex-1 min-w-0">
          <!-- Title -->
          <p class="text-body-regular font-semibold text-content-primary">{{ title }}</p>
          <!-- Description -->
          <p v-if="description" class="text-body-regular text-content-secondary mt-0.5">
            {{ description }}
          </p>

          <!-- Custom slot content -->
          <div v-if="$slots.default" class="mt-2">
            <slot />
          </div>
        </div>

        <!-- Action button -->
        <AxisButton
          v-if="actionLabel"
          variant="ghost"
          size="sm"
          :icon-right="actionIcon"
          class="shrink-0"
          @click.stop="handleAction"
        >
          {{ actionLabel }}
        </AxisButton>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- VARIANT: Selectable -->
    <!-- ============================================ -->
    <template v-else-if="variant === 'selectable'">
      <div class="p-4">
        <div class="flex items-start gap-3">
          <!-- Selection indicator -->
          <div class="shrink-0 mt-0.5">
            <!-- Radio indicator -->
            <div
              v-if="selectionType === 'radio'"
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
              :class="selected
                ? 'border-main-500 dark:border-main-400'
                : 'border-neutral-400 dark:border-neutral-500'
              "
            >
              <div
                v-if="selected"
                class="w-2.5 h-2.5 rounded-full bg-main-500 dark:bg-main-400"
              />
            </div>

            <!-- Checkbox indicator -->
            <div
              v-else
              class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
              :class="selected
                ? 'border-main-500 dark:border-main-400 bg-main-500 dark:bg-main-400'
                : 'border-neutral-400 dark:border-neutral-500'
              "
            >
              <svg
                v-if="selected"
                class="w-3 h-3 text-white"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 6L5 9L10 3"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <!-- Label -->
            <p v-if="label" class="text-body-regular font-medium text-content-primary">
              {{ label }}
            </p>

            <!-- Slot content -->
            <div :class="label ? 'mt-1' : ''">
              <slot />
            </div>
          </div>

          <!-- Selected checkmark (optional visual) -->
          <div v-if="selected && $slots.selectedIcon" class="shrink-0">
            <slot name="selectedIcon" />
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- VARIANT: Onboarding -->
    <!-- Based on Kairo design system - Image and Table variants -->
    <!-- ============================================ -->
    <template v-else-if="variant === 'onboarding'">
      <div class="p-6 h-full flex flex-col">
        <!-- IMAGE VARIANT -->
        <template v-if="visualSupport === 'image'">
          <!-- Top row: Identifier (left) + Completed check (right) -->
          <div class="flex items-center mb-6" :class="state === 'completed' ? 'justify-between' : ''">
            <!-- Number identifier (22x22px circle per Kairo spec) -->
            <div
              v-if="identifierType === 'number' && step !== undefined"
              class="w-[22px] h-[22px] rounded-full flex items-center justify-center text-label font-medium text-white leading-[1.36]"
              :class="state === 'non-completed'
                ? 'bg-neutral-300 dark:bg-neutral-600'
                : 'bg-main-500 dark:bg-main-400'
              "
            >
              {{ step }}
            </div>

            <!-- Tag identifier (pill with icon) -->
            <div
              v-else-if="identifierType === 'tag' && tag"
              class="flex items-center gap-2 h-7 px-2 py-1 rounded-md"
              :class="state === 'non-completed'
                ? 'bg-neutral-50 dark:bg-neutral-800'
                : 'bg-main-50 dark:bg-main-950'
              "
            >
              <component
                :is="tagIcon"
                v-if="tagIcon"
                class="w-4 h-4"
                :class="state === 'non-completed'
                  ? 'text-neutral-300 dark:text-neutral-600'
                  : 'text-main-500 dark:text-main-400'
                "
                aria-hidden="true"
              />
              <span
                class="text-body-regular font-semibold leading-[1.36]"
                :class="state === 'non-completed'
                  ? 'text-neutral-100 dark:text-neutral-700'
                  : 'text-main-900 dark:text-main-100'
                "
              >
                {{ tag }}
              </span>
            </div>

            <!-- Completed checkmark (green circle icon) -->
            <svg
              v-if="state === 'completed'"
              class="w-6 h-6 text-success-600 dark:text-success-400"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.15" />
              <path
                d="M7 12L10.5 15.5L17 8.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <!-- Image section (rounded-xl per Kairo spec) -->
          <div v-if="mediaSrc || $slots.media" class="w-full rounded-xl overflow-hidden mb-6">
            <slot name="media">
              <img
                v-if="mediaSrc"
                :src="mediaSrc"
                :alt="mediaAlt"
                class="w-full h-auto object-cover"
              >
            </slot>
          </div>

          <!-- Content section - grows to push button to bottom -->
          <div class="flex-1 flex flex-col gap-4">
            <!-- Title (16px/H4, semibold) -->
            <h3
              v-if="title"
              class="text-h4 font-semibold leading-[1.36]"
              :class="onboardingTextClasses.title"
            >
              {{ title }}
            </h3>

            <!-- Description (14px/H5, regular) -->
            <p
              v-if="description"
              class="text-body-regular leading-[1.36]"
              :class="onboardingTextClasses.description"
            >
              {{ description }}
            </p>

            <!-- Support text (12px/H6, medium) -->
            <p
              v-if="supportText"
              class="text-label font-medium leading-[1.36]"
              :class="onboardingTextClasses.supportText"
            >
              {{ supportText }}
            </p>

            <!-- Custom slot content -->
            <div v-if="$slots.default">
              <slot />
            </div>
          </div>
        </template>

        <!-- TABLE VARIANT -->
        <template v-else-if="visualSupport === 'table'">
          <!-- Top row: Identifier + Completed check -->
          <div class="flex items-center w-full mb-6" :class="state === 'completed' ? 'justify-between' : ''">
            <!-- Number identifier -->
            <div
              v-if="identifierType === 'number' && step !== undefined"
              class="w-[22px] h-[22px] rounded-full flex items-center justify-center text-label font-medium text-white leading-[1.36]"
              :class="state === 'non-completed'
                ? 'bg-neutral-300 dark:bg-neutral-600'
                : 'bg-main-500 dark:bg-main-400'
              "
            >
              {{ step }}
            </div>

            <!-- Tag identifier -->
            <div
              v-else-if="identifierType === 'tag' && tag"
              class="flex items-center gap-2 h-7 px-2 py-1 rounded-md"
              :class="state === 'non-completed'
                ? 'bg-neutral-50 dark:bg-neutral-800'
                : 'bg-main-50 dark:bg-main-950'
              "
            >
              <component
                :is="tagIcon"
                v-if="tagIcon"
                class="w-4 h-4"
                :class="state === 'non-completed'
                  ? 'text-neutral-300 dark:text-neutral-600'
                  : 'text-main-500 dark:text-main-400'
                "
                aria-hidden="true"
              />
              <span
                class="text-body-regular font-semibold leading-[1.36]"
                :class="state === 'non-completed'
                  ? 'text-neutral-100 dark:text-neutral-700'
                  : 'text-main-900 dark:text-main-100'
                "
              >
                {{ tag }}
              </span>
            </div>

            <!-- Completed checkmark -->
            <svg
              v-if="state === 'completed'"
              class="w-6 h-6 text-success-600 dark:text-success-400"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.15" />
              <path
                d="M7 12L10.5 15.5L17 8.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <!-- Content wrapper - grows to push button to bottom -->
          <div class="flex-1 flex flex-col gap-6">
            <!-- Content section -->
            <div class="flex flex-col gap-4">
              <!-- Title (16px/H4, semibold) -->
              <h3
                v-if="title"
                class="text-h4 font-semibold leading-[1.36]"
                :class="onboardingTextClasses.title"
              >
                {{ title }}
              </h3>

              <!-- Description (14px/H5, regular) -->
              <p
                v-if="description"
                class="text-body-regular leading-[1.36]"
                :class="onboardingTextClasses.description"
              >
                {{ description }}
              </p>

              <!-- Support text (12px/H6, medium) -->
              <p
                v-if="supportText"
                class="text-label font-medium leading-[1.36]"
                :class="onboardingTextClasses.supportText"
              >
                {{ supportText }}
              </p>
            </div>

            <!-- Table slot (for table variant) -->
            <div v-if="$slots.table" class="w-full">
              <slot name="table" />
            </div>

            <!-- Custom slot content -->
            <div v-if="$slots.default">
              <slot />
            </div>
          </div>
        </template>

        <!-- Action button (both variants) - always at bottom -->
        <div v-if="actionLabel || $slots.footer" class="flex justify-end mt-6">
          <slot name="footer">
            <AxisButton
              v-if="actionLabel"
              variant="filled"
              size="md"
              :icon-right="actionIcon"
              :disabled="state === 'non-completed'"
              @click.stop="handleAction"
            >
              {{ actionLabel }}
            </AxisButton>
          </slot>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- VARIANT: User -->
    <!-- Displays user profile information with avatar, name, email, role badge, and status -->
    <!-- ============================================ -->
    <template v-else-if="variant === 'user'">
      <div class="p-4">
        <!-- Top row: Avatar and user info -->
        <div class="flex items-start gap-3">
          <!-- Avatar -->
          <div class="shrink-0">
            <div
              v-if="avatarSrc"
              class="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800"
            >
              <img
                :src="avatarSrc"
                :alt="userName || 'User avatar'"
                class="w-full h-full object-cover"
              >
            </div>
            <!-- Fallback avatar with initials -->
            <div
              v-else
              class="w-12 h-12 rounded-full bg-main-100 dark:bg-main-900 flex items-center justify-center"
            >
              <span class="text-body-large font-semibold text-main-600 dark:text-main-400">
                {{ userName ? userName.charAt(0).toUpperCase() : '?' }}
              </span>
            </div>
          </div>

          <!-- User info -->
          <div class="flex-1 min-w-0">
            <!-- Name -->
            <p class="text-body-regular font-semibold text-content-primary truncate">
              {{ userName || 'Unknown User' }}
            </p>
            <!-- Email -->
            <p v-if="userEmail" class="text-label text-content-secondary truncate">
              {{ userEmail }}
            </p>
          </div>
        </div>

        <!-- Bottom row: Role badge and status -->
        <div class="flex items-center gap-3 mt-3">
          <!-- Role badge -->
          <div
            v-if="userRole"
            class="inline-flex items-center px-2 py-0.5 rounded text-label font-medium bg-surface-raised dark:bg-neutral-800 text-content-secondary border border-stroke"
          >
            {{ userRole }}
          </div>

          <!-- Status indicator -->
          <div class="flex items-center gap-1.5">
            <div
              class="w-2 h-2 rounded-full"
              :class="userStatusConfig.dot"
            />
            <span
              class="text-label font-medium"
              :class="userStatusConfig.text"
            >
              {{ userStatusConfig.label }}
            </span>
          </div>
        </div>

        <!-- Custom slot content - mt-2 for tighter spacing, keeps card balanced -->
        <div v-if="$slots.default" class="mt-2">
          <slot />
        </div>
      </div>
    </template>
  </component>
</template>
