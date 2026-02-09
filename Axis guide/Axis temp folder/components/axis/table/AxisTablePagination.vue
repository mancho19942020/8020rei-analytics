<template>
  <div class="flex items-center justify-between px-4 py-3 border-t border-stroke bg-surface-base">
    <!-- Left side: Row count info -->
    <div class="text-body-regular text-content-secondary">
      <span class="font-medium">{{ startRow }}</span>
      -
      <span class="font-medium">{{ endRow }}</span>
      of
      <span class="font-medium">{{ totalRows.toLocaleString() }}</span>
      {{ rowLabel }}
    </div>

    <!-- Right side: Page navigation -->
    <div class="flex items-center gap-2">
      <!-- Previous page button -->
      <AxisButton
        variant="ghost"
        size="sm"
        :disabled="currentPage === 1"
        :icon-left="ChevronLeftIcon"
        icon-only
        aria-label="Previous page"
        @click="goToPreviousPage"
      />

      <!-- Page numbers -->
      <div class="flex items-center gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="pageButtonClasses(page)"
          :aria-label="`Go to page ${page}`"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>

      <!-- Next page button -->
      <AxisButton
        variant="ghost"
        size="sm"
        :disabled="currentPage === totalPages"
        :icon-left="ChevronRightIcon"
        icon-only
        aria-label="Next page"
        @click="goToNextPage"
      />

      <!-- Rows per page selector -->
      <div class="flex items-center gap-2 ml-4 pl-4 border-l border-stroke">
        <span class="text-body-regular text-content-secondary whitespace-nowrap">Rows per page:</span>
        <AxisSelect
          :model-value="pageSize"
          :options="pageSizeOptions"
          size="sm"
          variant="ghost"
          class="w-20"
          aria-label="Rows per page"
          @update:model-value="changePageSize"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AxisTablePagination
 *
 * Pagination controls for AxisTable including page navigation and rows-per-page selector.
 *
 * IMPORTANT: The `pageSize` prop must match one of the available page size options:
 * 25, 50, 100, 250, or 500. If the value doesn't match, the selector will show
 * "Select an option" instead of the current value.
 *
 * Default page size in AxisTable is 50.
 */
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'
import AxisButton from '../AxisButton.vue'
import AxisSelect from '../AxisSelect.vue'

interface Props {
  /** Current page number (1-based) */
  currentPage: number
  /** Current page size (must be one of: 25, 50, 100, 250, 500) */
  pageSize: number
  /** Total number of rows in the dataset */
  totalRows: number
  /** Label for rows (e.g., "rows", "properties") */
  rowLabel?: string
}

interface Emits {
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
}

const props = withDefaults(defineProps<Props>(), {
  rowLabel: 'rows',
})

const emit = defineEmits<Emits>()

/**
 * Page size options
 */
const pageSizeOptions = [
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 250, label: '250' },
  { value: 500, label: '500' },
]

/**
 * Calculate total pages
 */
const totalPages = computed(() => Math.max(1, Math.ceil(props.totalRows / props.pageSize)))

/**
 * Calculate start row (1-based)
 */
const startRow = computed(() => {
  if (props.totalRows === 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

/**
 * Calculate end row
 */
const endRow = computed(() => {
  const end = props.currentPage * props.pageSize
  return Math.min(end, props.totalRows)
})

/**
 * Calculate visible page numbers (show max 7 pages)
 */
const visiblePages = computed(() => {
  const total = totalPages.value
  const current = props.currentPage
  const maxVisible = 7

  // If total pages <= maxVisible, show all
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // Calculate range around current page
  const halfVisible = Math.floor(maxVisible / 2)
  let start = Math.max(1, current - halfVisible)
  let end = Math.min(total, current + halfVisible)

  // Adjust if at the edges
  if (current <= halfVisible) {
    end = maxVisible
  } else if (current >= total - halfVisible) {
    start = total - maxVisible + 1
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

/**
 * Page button classes
 */
function pageButtonClasses(page: number) {
  const isActive = page === props.currentPage

  return [
    'min-w-[32px] h-8 px-2',
    'text-body-regular font-medium',
    'rounded transition-colors duration-200',
    isActive
      ? 'bg-main-700 text-white'
      : 'text-content-secondary hover:bg-surface-raised',
  ]
}

/**
 * Navigation handlers
 */
function goToPage(page: number) {
  if (page !== props.currentPage && page >= 1 && page <= totalPages.value) {
    emit('update:currentPage', page)
  }
}

function goToPreviousPage() {
  if (props.currentPage > 1) {
    emit('update:currentPage', props.currentPage - 1)
  }
}

function goToNextPage() {
  if (props.currentPage < totalPages.value) {
    emit('update:currentPage', props.currentPage + 1)
  }
}

function changePageSize(newSize: string | number | (string | number)[] | null) {
  if (typeof newSize === 'number') {
    emit('update:pageSize', newSize)
    // Reset to page 1 when changing page size
    emit('update:currentPage', 1)
  }
}
</script>
