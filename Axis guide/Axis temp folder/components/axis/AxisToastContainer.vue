<script setup lang="ts">
/**
 * AxisToastContainer Component
 *
 * Global container for rendering toast notifications. This component should be
 * added to your app layout (app.vue or default.vue) to enable toast functionality.
 *
 * USAGE:
 * Add to app.vue or default.vue:
 * <template>
 *   <div>
 *     <slot />
 *     <AxisToastContainer />
 *   </div>
 * </template>
 *
 * POSITIONING:
 * - Desktop: Fixed top-right, 24px from edges, z-index 9999
 * - Mobile: Fixed bottom, full-width with padding, z-index 9999
 * - Stacks vertically with 12px gap
 *
 * BEHAVIOR:
 * - Renders all active toasts from useToast() state
 * - Handles dismissal callbacks
 * - Respects prefers-reduced-motion
 */

const { toasts, dismissToast } = useToast();

// Handle toast dismissal
const handleDismiss = (id: string) => {
  dismissToast(id);
};
</script>

<template>
  <!-- Toast Container - Fixed positioning -->
  <div
    class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none sm:max-w-[480px]"
    aria-live="polite"
    aria-atomic="false"
  >
    <!-- Render each toast -->
    <AxisToast
      v-for="toast in toasts"
      :key="toast.id"
      :id="toast.id"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="toast.duration"
      :action="toast.action"
      :link="toast.link"
      :icon="toast.icon"
      :hide-icon="toast.hideIcon"
      class="pointer-events-auto"
      @dismiss="handleDismiss"
    />
  </div>

  <!-- Mobile: Alternative positioning at bottom (optional, uncomment if preferred) -->
  <!--
  <div
    class="sm:hidden fixed bottom-6 left-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
    aria-live="polite"
    aria-atomic="false"
  >
    <AxisToast
      v-for="toast in toasts"
      :key="toast.id"
      :id="toast.id"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="toast.duration"
      :action="toast.action"
      :link="toast.link"
      :icon="toast.icon"
      :hide-icon="toast.hideIcon"
      class="pointer-events-auto"
      @dismiss="handleDismiss"
    />
  </div>
  -->
</template>
