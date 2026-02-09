<template>
  <div ref="menuRef" class="relative">
    <!-- Menu trigger button -->
    <button
      :class="[
        'p-1 rounded transition-colors duration-200',
        isOpen
          ? 'bg-surface-raised text-content-primary'
          : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-raised'
      ]"
      :aria-label="`Options for ${column.header}`"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      @click.stop="toggleMenu"
    >
      <EllipsisVerticalIcon class="w-4 h-4" />
    </button>

    <!-- Dropdown menu - styled to match AxisSelect -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="fixed z-[60] min-w-[180px] py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-stroke rounded-sm shadow-md"
        :style="dropdownStyle"
        role="menu"
        @click.stop
      >
        <!-- Sort section -->
        <div class="px-1">
          <button
            class="w-full flex items-center gap-2 px-3 py-2 text-body-regular text-content-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-sm transition-colors"
            role="menuitem"
            @click="handleSort('asc')"
          >
            <ArrowUpIcon class="w-4 h-4" />
            <span class="flex-1 text-left">Sort ascending</span>
            <CheckIcon v-if="currentSort === 'asc'" class="w-4 h-4 text-main-500" />
          </button>
          <button
            class="w-full flex items-center gap-2 px-3 py-2 text-body-regular text-content-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-sm transition-colors"
            role="menuitem"
            @click="handleSort('desc')"
          >
            <ArrowDownIcon class="w-4 h-4" />
            <span class="flex-1 text-left">Sort descending</span>
            <CheckIcon v-if="currentSort === 'desc'" class="w-4 h-4 text-main-500" />
          </button>
          <button
            v-if="currentSort"
            class="w-full flex items-center gap-2 px-3 py-2 text-body-regular text-content-tertiary hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-sm transition-colors"
            role="menuitem"
            @click="handleClearSort"
          >
            <XMarkIcon class="w-4 h-4" />
            <span class="flex-1 text-left">Clear sort</span>
          </button>
        </div>

        <!-- Divider -->
        <div class="my-1 border-t border-stroke-subtle" />

        <!-- Pin section -->
        <div class="px-1">
          <button
            v-if="column.pinned !== 'left'"
            class="w-full flex items-center gap-2 px-3 py-2 text-body-regular text-content-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-sm transition-colors"
            role="menuitem"
            @click="handlePin('left')"
          >
            <ArrowLeftOnRectangleIcon class="w-4 h-4" />
            <span class="flex-1 text-left">Pin left</span>
          </button>
          <button
            v-if="column.pinned !== 'right'"
            class="w-full flex items-center gap-2 px-3 py-2 text-body-regular text-content-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-sm transition-colors"
            role="menuitem"
            @click="handlePin('right')"
          >
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
            <span class="flex-1 text-left">Pin right</span>
          </button>
          <button
            v-if="column.pinned"
            class="w-full flex items-center gap-2 px-3 py-2 text-body-regular text-content-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-sm transition-colors"
            role="menuitem"
            @click="handlePin(null)"
          >
            <XMarkIcon class="w-4 h-4" />
            <span class="flex-1 text-left">Unpin</span>
          </button>
        </div>

        <!-- Divider -->
        <div class="my-1 border-t border-stroke-subtle" />

        <!-- Hide section -->
        <div class="px-1">
          <button
            class="w-full flex items-center gap-2 px-3 py-2 text-body-regular text-content-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-sm transition-colors"
            role="menuitem"
            @click="handleHide"
          >
            <EyeSlashIcon class="w-4 h-4" />
            <span class="flex-1 text-left">Hide column</span>
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Backdrop - z-40 to catch clicks everywhere except sidebar -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40"
        @click.capture="closeMenu"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import {
  EllipsisVerticalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  EyeSlashIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/vue/20/solid'
import type { Column, ColumnPinSide, SortOrder } from './types'

interface Props {
  column: Column
  currentSort?: SortOrder
}

interface Emits {
  (e: 'sort', order: 'asc' | 'desc'): void
  (e: 'clear-sort'): void
  (e: 'pin', side: ColumnPinSide): void
  (e: 'hide'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const dropdownStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

function toggleMenu() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      positionDropdown()
    })
  }
}

function closeMenu() {
  isOpen.value = false
}

function positionDropdown() {
  if (!menuRef.value || !dropdownRef.value) return

  const triggerRect = menuRef.value.getBoundingClientRect()
  const dropdownRect = dropdownRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  let top = triggerRect.bottom + 4
  let left = triggerRect.right - dropdownRect.width

  // Adjust if dropdown would go off-screen vertically
  if (top + dropdownRect.height > viewportHeight - 16) {
    top = triggerRect.top - dropdownRect.height - 4
  }

  // Adjust if dropdown would go off-screen horizontally
  if (left < 16) {
    left = triggerRect.left
  }
  if (left + dropdownRect.width > viewportWidth - 16) {
    left = viewportWidth - dropdownRect.width - 16
  }

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  }
}

function handleSort(order: 'asc' | 'desc') {
  emit('sort', order)
  closeMenu()
}

function handleClearSort() {
  emit('clear-sort')
  closeMenu()
}

function handlePin(side: ColumnPinSide) {
  emit('pin', side)
  closeMenu()
}

function handleHide() {
  emit('hide')
  closeMenu()
}

// Close on escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Expose closeMenu for parent components to call
defineExpose({ closeMenu, isOpen })
</script>
