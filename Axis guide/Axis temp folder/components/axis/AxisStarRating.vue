<script setup lang="ts">
/**
 * AxisStarRating Component
 *
 * An interactive 5-star rating component following Axis design system specifications.
 * Used in the buybox configurator for rating property types, zip codes, and other criteria.
 *
 * USAGE:
 * <AxisStarRating v-model="rating" />
 * <AxisStarRating v-model="rating" readonly />
 * <AxisStarRating v-model="rating" size="sm" />
 *
 * SIZES:
 * - sm: 16px stars (compact tables)
 * - md: 20px stars (default, standard tables)
 * - lg: 24px stars (emphasis, detail views)
 *
 * STATES:
 * - default: Ready for interaction
 * - hover: Shows preview rating on hover
 * - focus: Keyboard focus indicator
 * - readonly: Display only, not interactive
 *
 * ACCESSIBILITY:
 * - Uses semantic button with role="slider" for ARIA support
 * - Arrow keys to adjust rating (left/down = decrease, right/up = increase)
 * - Home/End keys for min/max rating
 * - Focus visible ring for keyboard users
 * - Screen reader announces current and max rating
 */

import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/vue/24/outline';
import type { Rating } from '~/types/buybox-configurator';

interface Props {
  /** Rating value (0-5), v-model binding */
  modelValue: Rating;
  /** Disable interaction, display only */
  readonly?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label for screen readers */
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  size: 'md',
  label: 'Rating',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Rating): void;
}>();

// Hover state for preview
const hoverRating = ref<number | null>(null);

// Computed display rating (hover preview or actual value)
const displayRating = computed(() => {
  if (props.readonly) return props.modelValue;
  return hoverRating.value ?? props.modelValue;
});

// Size classes based on size prop
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return {
        star: 'w-4 h-4',
        gap: 'gap-0.5',
      };
    case 'lg':
      return {
        star: 'w-6 h-6',
        gap: 'gap-1',
      };
    default: // md
      return {
        star: 'w-5 h-5',
        gap: 'gap-0.5',
      };
  }
});

// Handle click on a star
const handleClick = (starIndex: number) => {
  if (props.readonly) return;
  // If clicking the same rating, toggle to 0 (deselect)
  const newRating = (props.modelValue === starIndex ? 0 : starIndex) as Rating;
  emit('update:modelValue', newRating);
};

// Handle hover on a star
const handleMouseEnter = (starIndex: number) => {
  if (props.readonly) return;
  hoverRating.value = starIndex;
};

// Handle mouse leave from container
const handleMouseLeave = () => {
  hoverRating.value = null;
};

// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (props.readonly) return;

  let newRating: Rating | null = null;

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      event.preventDefault();
      newRating = Math.min(5, props.modelValue + 1) as Rating;
      break;
    case 'ArrowLeft':
    case 'ArrowDown':
      event.preventDefault();
      newRating = Math.max(0, props.modelValue - 1) as Rating;
      break;
    case 'Home':
      event.preventDefault();
      newRating = 0;
      break;
    case 'End':
      event.preventDefault();
      newRating = 5;
      break;
  }

  if (newRating !== null) {
    emit('update:modelValue', newRating);
  }
};

// Check if a star should be filled
const isStarFilled = (starIndex: number) => {
  return starIndex <= displayRating.value;
};

// Generate unique ID for accessibility - use useId() for SSR-safe stable IDs
const generatedId = useId();
const ratingId = `axis-star-rating-${generatedId}`;
</script>

<template>
  <div
    :id="ratingId"
    :class="[
      'inline-flex items-center',
      sizeClasses.gap,
      !readonly && 'cursor-pointer',
    ]"
    role="slider"
    :aria-label="label"
    :aria-valuenow="modelValue"
    :aria-valuemin="0"
    :aria-valuemax="5"
    :aria-valuetext="`${modelValue} out of 5 stars`"
    :tabindex="readonly ? -1 : 0"
    @mouseleave="handleMouseLeave"
    @keydown="handleKeydown"
  >
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      :class="[
        'shrink-0 transition-colors duration-150',
        !readonly && 'hover:scale-110 focus:outline-none',
        readonly && 'cursor-default',
        isStarFilled(star)
          ? 'text-alert-400'
          : 'text-neutral-300 dark:text-neutral-600',
        !readonly && !isStarFilled(star) && 'hover:text-alert-300',
      ]"
      :disabled="readonly"
      :aria-label="`Set rating to ${star} star${star > 1 ? 's' : ''}`"
      :tabindex="-1"
      @click="handleClick(star)"
      @mouseenter="handleMouseEnter(star)"
    >
      <component
        :is="isStarFilled(star) ? StarIconSolid : StarIconOutline"
        :class="sizeClasses.star"
      />
    </button>
  </div>
</template>
