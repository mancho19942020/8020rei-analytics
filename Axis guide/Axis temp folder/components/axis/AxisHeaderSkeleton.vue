<script setup lang="ts">
/**
 * AxisHeaderSkeleton Component
 *
 * A skeleton loader that matches the AppHeader structure.
 * Used during initial page load/hydration to prevent flash of empty content.
 *
 * USAGE:
 * <AxisHeaderSkeleton />
 */

interface Props {
  /** Animation style */
  animation?: "pulse" | "wave" | "none";
}

withDefaults(defineProps<Props>(), {
  animation: "pulse",
});
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 h-12 bg-surface-base border-b border-stroke-subtle"
    aria-hidden="true"
  >
    <div class="h-full px-4 flex items-center justify-between">
      <!-- Left: Logo skeleton -->
      <div class="flex items-center gap-4">
        <AxisSkeleton
          variant="custom"
          width="120px"
          height="20px"
          rounded="sm"
          :animation="animation"
        />
      </div>

      <!-- Center: Search skeleton (hidden on mobile) -->
      <div class="flex-1 max-w-md mx-4 hidden md:block">
        <AxisSkeleton
          variant="custom"
          width="100%"
          height="32px"
          rounded="md"
          :animation="animation"
        />
      </div>

      <!-- Right: User actions skeleton -->
      <div class="flex items-center gap-2">
        <!-- Theme toggle skeleton -->
        <AxisSkeleton
          variant="custom"
          width="32px"
          height="32px"
          rounded="md"
          :animation="animation"
        />

        <!-- Notifications skeleton -->
        <AxisSkeleton
          variant="custom"
          width="32px"
          height="32px"
          rounded="md"
          :animation="animation"
        />

        <!-- User avatar skeleton -->
        <AxisSkeleton
          variant="avatar"
          size="sm"
          :animation="animation"
        />
      </div>
    </div>
  </header>
</template>
