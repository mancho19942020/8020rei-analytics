<script setup lang="ts">
/**
 * AxisSidebarSkeleton Component
 *
 * A skeleton loader that matches the AppSidebar structure.
 * Used during initial page load/hydration to prevent flash of empty content.
 *
 * USAGE:
 * <AxisSidebarSkeleton :expanded="true" />
 */

interface Props {
  /** Whether the sidebar is in expanded state */
  expanded?: boolean;
  /** Animation style */
  animation?: "pulse" | "wave" | "none";
}

withDefaults(defineProps<Props>(), {
  expanded: true,
  animation: "pulse",
});
</script>

<template>
  <aside
    :class="[
      'fixed left-0 top-12 bottom-0 z-40',
      'bg-surface-base border-r border-stroke-subtle',
      'transition-all duration-200',
      expanded ? 'w-56' : 'w-14'
    ]"
    aria-hidden="true"
  >
    <div class="h-full flex flex-col p-2">
      <!-- Navigation items skeleton -->
      <nav class="flex-1 space-y-1">
        <!-- Main nav items (6 items like dashboard, properties, etc.) -->
        <div
          v-for="i in 6"
          :key="`nav-${i}`"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-lg',
            i === 1 ? 'bg-main-50 dark:bg-main-900/20' : ''
          ]"
        >
          <AxisSkeleton
            variant="custom"
            width="20px"
            height="20px"
            rounded="sm"
            :animation="animation"
          />
          <AxisSkeleton
            v-if="expanded"
            variant="text"
            :width="`${50 + Math.floor(i * 8)}%`"
            :animation="animation"
          />
        </div>

        <!-- Divider -->
        <div class="my-3 mx-3 border-t border-stroke-subtle" />

        <!-- Design System section -->
        <div v-if="expanded" class="px-3 py-2">
          <AxisSkeleton
            variant="text"
            width="80px"
            :animation="animation"
            class="mb-2"
          />
        </div>

        <!-- Design system sub-items -->
        <div
          v-for="i in 4"
          :key="`ds-${i}`"
          class="flex items-center gap-3 px-3 py-2"
        >
          <AxisSkeleton
            variant="custom"
            width="20px"
            height="20px"
            rounded="sm"
            :animation="animation"
          />
          <AxisSkeleton
            v-if="expanded"
            variant="text"
            :width="`${40 + Math.floor(i * 10)}%`"
            :animation="animation"
          />
        </div>
      </nav>

      <!-- Bottom section skeleton (settings, help) -->
      <div class="border-t border-stroke-subtle pt-2 space-y-1">
        <div
          v-for="i in 2"
          :key="`bottom-${i}`"
          class="flex items-center gap-3 px-3 py-2"
        >
          <AxisSkeleton
            variant="custom"
            width="20px"
            height="20px"
            rounded="sm"
            :animation="animation"
          />
          <AxisSkeleton
            v-if="expanded"
            variant="text"
            :width="`${50 + i * 10}%`"
            :animation="animation"
          />
        </div>
      </div>
    </div>
  </aside>
</template>
