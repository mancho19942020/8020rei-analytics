<template>
  <div class="flex items-center justify-between px-4 py-3 border-b border-stroke bg-surface-base">
    <!-- Left side: Title and selection info -->
    <div class="flex items-center gap-4">
      <h2 v-if="title" class="text-h4 text-content-primary">
        {{ title }}
      </h2>

      <!-- Selection count -->
      <div v-if="selectedCount > 0" class="flex items-center gap-2">
        <span class="text-body-regular text-content-secondary">
          {{ selectedCount }} selected
        </span>
        <AxisButton
          variant="ghost"
          size="sm"
          @click="emit('clear-selection')"
        >
          Clear
        </AxisButton>
      </div>
    </div>

    <!-- Right side: Actions -->
    <div class="flex items-center gap-2">
      <!-- Custom toolbar slot -->
      <slot name="toolbar-actions" />

      <!-- Refresh button -->
      <AxisButton
        v-if="showRefresh"
        variant="ghost"
        size="sm"
        :icon-left="ArrowPathIcon"
        icon-only
        aria-label="Refresh data"
        @click="emit('refresh')"
      />

      <!-- Column visibility toggle (future feature) -->
      <!-- Export button (future feature) -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/20/solid'
import AxisButton from '../AxisButton.vue'

interface Props {
  title?: string
  selectedCount?: number
  showRefresh?: boolean
}

interface Emits {
  (e: 'refresh'): void
  (e: 'clear-selection'): void
}

withDefaults(defineProps<Props>(), {
  selectedCount: 0,
  showRefresh: true,
})

const emit = defineEmits<Emits>()
</script>
