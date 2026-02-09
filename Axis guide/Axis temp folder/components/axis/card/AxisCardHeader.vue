<script setup lang="ts">
/**
 * AxisCardHeader Component
 *
 * Optional header section for AxisCard with title, subtitle, and actions support.
 * Use within AxisCard's header slot for consistent styling.
 *
 * USAGE:
 * <AxisCard>
 *   <template #header>
 *     <AxisCardHeader title="Card Title" subtitle="Optional subtitle">
 *       <template #actions>
 *         <AxisButton variant="ghost" size="sm">Edit</AxisButton>
 *       </template>
 *     </AxisCardHeader>
 *   </template>
 *   <!-- Card body content -->
 * </AxisCard>
 */

import type { Component } from "vue";

interface Props {
  /** Header title */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Leading icon component */
  icon?: Component | null;
}

withDefaults(defineProps<Props>(), {
  title: undefined,
  subtitle: undefined,
  icon: null,
});
</script>

<template>
  <div class="flex items-start justify-between gap-4">
    <div class="flex items-start gap-3 min-w-0">
      <!-- Icon -->
      <component
        :is="icon"
        v-if="icon"
        class="w-5 h-5 shrink-0 text-content-secondary mt-0.5"
        aria-hidden="true"
      />

      <div class="min-w-0">
        <!-- Title -->
        <h3 v-if="title" class="text-body-regular font-semibold text-content-primary truncate">
          {{ title }}
        </h3>
        <!-- Subtitle -->
        <p v-if="subtitle" class="text-label text-content-tertiary mt-0.5 truncate">
          {{ subtitle }}
        </p>
        <!-- Default slot for custom content -->
        <slot v-if="!title && !subtitle" />
      </div>
    </div>

    <!-- Actions slot -->
    <div v-if="$slots.actions" class="shrink-0 flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
