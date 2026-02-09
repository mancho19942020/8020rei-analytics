<script setup lang="ts">
/**
 * AxisCardMedia Component
 *
 * Media section for AxisCard supporting images, videos, or custom content.
 * Use within AxisCard's media slot for consistent styling.
 *
 * USAGE:
 * <AxisCard>
 *   <template #media>
 *     <AxisCardMedia src="/path/to/image.jpg" alt="Description" />
 *   </template>
 *   <!-- Card body content -->
 * </AxisCard>
 *
 * Custom content:
 * <AxisCardMedia>
 *   <div class="h-48 bg-gradient-to-r from-main-500 to-accent-1-500" />
 * </AxisCardMedia>
 */

type AspectRatio = "auto" | "square" | "video" | "wide";

interface Props {
  /** Image source URL */
  src?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Aspect ratio preset */
  aspectRatio?: AspectRatio;
  /** Object fit for image */
  fit?: "cover" | "contain" | "fill";
}

const props = withDefaults(defineProps<Props>(), {
  src: undefined,
  alt: "",
  aspectRatio: "auto",
  fit: "cover",
});

const aspectClasses = computed(() => {
  const aspects = {
    auto: "",
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[2/1]",
  };
  return aspects[props.aspectRatio];
});

const fitClasses = computed(() => {
  const fits = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
  };
  return fits[props.fit];
});
</script>

<template>
  <div :class="['overflow-hidden', aspectClasses]">
    <!-- Image -->
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      :class="['w-full h-full', fitClasses]"
    >
    <!-- Custom content slot -->
    <slot v-else />
  </div>
</template>
