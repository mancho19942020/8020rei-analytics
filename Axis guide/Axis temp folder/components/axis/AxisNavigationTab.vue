<script setup lang="ts">
/**
 * AxisNavigationTab Component
 *
 * Tab navigation for switching between different sections or views within the same screen.
 * Based on Kairo design system with Carbon Design System best practices.
 *
 * USAGE:
 * <AxisNavigationTab v-model="activeTab" :tabs="tabs" />
 * <AxisNavigationTab v-model="activeTab" :tabs="tabs" variant="contained" />
 *
 * PRIMARY USE:
 * - Navigating between different sections or views within the same screen
 * - When content completely changes between tabs
 * - When each tab represents a distinct view (pages or sub-sections)
 * - In interfaces where users explore or compare information
 *
 * VARIANTS:
 * - line (default): Underline indicator for selected tab
 * - contained: Pill/badge style background for selected tab
 *
 * ACCESSIBILITY:
 * - Uses proper role="tablist" with aria-label
 * - Each tab has role="tab" with aria-selected
 * - Keyboard navigation with arrow keys
 * - Focus management for accessibility
 */

import type { Component } from 'vue'

interface Tab {
  /** Unique identifier for the tab */
  id: string
  /** Display name shown in the tab */
  name: string
  /** Icon component (optional) */
  icon?: Component
  /** Disable this tab */
  disabled?: boolean
  /** Show options menu indicator */
  hasOptions?: boolean
  /** Badge count (optional) */
  badge?: number | string
  /** Show pinned indicator (pushpin icon) - useful for pinned/favorited tabs */
  pinned?: boolean
  /** Show unsaved changes indicator (small dot) - useful for indicating pending changes */
  hasUnsavedChanges?: boolean
}

interface Props {
  /** Currently selected tab ID */
  modelValue: string
  /** Available tabs */
  tabs: Tab[]
  /** Visual variant */
  variant?: 'line' | 'contained'
  /** Size of the tabs */
  size?: 'sm' | 'md'
  /** Accessible label for the tab list */
  ariaLabel?: string
  /** Full width - tabs fill container equally */
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'line',
  size: 'md',
  ariaLabel: 'Navigation tabs',
  fullWidth: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'tab-options', tabId: string, position: { x: number; y: number }): void
}>()

// Track the focused tab for keyboard navigation
const focusedIndex = ref<number | null>(null)
const tabRefs = ref<HTMLButtonElement[]>([])

// Set tab ref
const setTabRef = (el: HTMLButtonElement | null, index: number) => {
  if (el) {
    tabRefs.value[index] = el
  }
}

// Handle tab selection
const selectTab = (tab: Tab) => {
  if (tab.disabled) return
  emit('update:modelValue', tab.id)
}

// Handle options click
const handleOptions = (event: MouseEvent, tabId: string) => {
  event.stopPropagation()
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  emit('tab-options', tabId, {
    x: rect.left,
    y: rect.bottom + 4
  })
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent, currentIndex: number) => {
  const enabledTabs = props.tabs.filter(t => !t.disabled)
  const currentEnabledIndex = enabledTabs.findIndex(t => t.id === props.tabs[currentIndex].id)

  let newIndex = currentEnabledIndex

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      newIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledTabs.length - 1
      break
    case 'ArrowRight':
      event.preventDefault()
      newIndex = currentEnabledIndex < enabledTabs.length - 1 ? currentEnabledIndex + 1 : 0
      break
    case 'Home':
      event.preventDefault()
      newIndex = 0
      break
    case 'End':
      event.preventDefault()
      newIndex = enabledTabs.length - 1
      break
    default:
      return
  }

  const newTab = enabledTabs[newIndex]
  const newActualIndex = props.tabs.findIndex(t => t.id === newTab.id)

  focusedIndex.value = newActualIndex
  tabRefs.value[newActualIndex]?.focus()
  selectTab(newTab)
}

// Size-based classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      tab: 'h-9 px-3 text-body-regular',
      icon: 'w-4 h-4',
      gap: 'gap-1.5',
    },
    md: {
      tab: 'h-[52px] px-4 text-body-large',
      icon: 'w-5 h-5',
      gap: 'gap-2',
    },
  }
  return sizes[props.size]
})

// Get tab classes based on state and variant
const getTabClasses = (tab: Tab) => {
  const selected = props.modelValue === tab.id
  const isDisabled = tab.disabled

  const baseClasses = [
    'inline-flex items-center justify-center',
    'whitespace-nowrap',
    'transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-inset',
    sizeClasses.value.tab,
    sizeClasses.value.gap,
  ]

  if (props.variant === 'line') {
    baseClasses.push('border-b-2')

    if (isDisabled) {
      baseClasses.push(
        'cursor-not-allowed',
        'border-transparent',
        'text-content-disabled',
      )
    } else if (selected) {
      baseClasses.push(
        'cursor-pointer',
        'border-main-700 dark:border-main-400',
        'text-main-700 dark:text-main-400',
        'font-semibold',
      )
    } else {
      baseClasses.push(
        'cursor-pointer',
        'border-transparent',
        'text-content-secondary',
        'hover:text-content-primary',
        'hover:border-neutral-300 dark:hover:border-neutral-600',
      )
    }
  } else {
    // contained variant
    if (isDisabled) {
      baseClasses.push(
        'cursor-not-allowed',
        'text-content-disabled',
        'rounded-lg',
      )
    } else if (selected) {
      baseClasses.push(
        'cursor-pointer',
        'bg-main-50 dark:bg-main-950',
        'text-main-700 dark:text-main-400',
        'font-semibold',
        'rounded-lg',
      )
    } else {
      baseClasses.push(
        'cursor-pointer',
        'text-content-secondary',
        'hover:text-content-primary',
        'hover:bg-neutral-50 dark:hover:bg-neutral-800',
        'rounded-lg',
      )
    }
  }

  return baseClasses
}
</script>

<template>
  <div
    role="tablist"
    :aria-label="ariaLabel"
    :class="[
      'flex items-center',
      variant === 'line' ? 'border-b border-stroke-subtle' : 'gap-1 p-1 bg-surface-raised rounded-lg',
      fullWidth ? 'w-full' : '',
    ]"
  >
    <button
      v-for="(tab, index) in tabs"
      :key="tab.id"
      :ref="(el) => setTabRef(el as HTMLButtonElement | null, index)"
      role="tab"
      type="button"
      :aria-selected="modelValue === tab.id"
      :aria-disabled="tab.disabled"
      :tabindex="modelValue === tab.id ? 0 : -1"
      :class="[
        ...getTabClasses(tab),
        fullWidth ? 'flex-1' : '',
      ]"
      @click="selectTab(tab)"
      @keydown="handleKeydown($event, index)"
    >
      <!-- Icon (optional) -->
      <component
        :is="tab.icon"
        v-if="tab.icon"
        :class="sizeClasses.icon"
        aria-hidden="true"
      />

      <!-- Tab name -->
      <span>{{ tab.name }}</span>

      <!-- Badge (optional) -->
      <span
        v-if="tab.badge !== undefined"
        :class="[
          'inline-flex items-center justify-center',
          'min-w-[20px] h-5 px-1.5',
          'text-label font-medium rounded-full',
          modelValue === tab.id
            ? 'bg-main-100 dark:bg-main-900 text-main-700 dark:text-main-300'
            : 'bg-neutral-100 dark:bg-neutral-800 text-content-secondary',
        ]"
      >
        {{ tab.badge }}
      </span>

      <!-- Unsaved changes indicator (small dot) -->
      <span
        v-if="tab.hasUnsavedChanges"
        class="w-2 h-2 rounded-full bg-alert-500 ml-1 flex-shrink-0"
        :title="`${tab.name} has unsaved changes`"
        aria-label="Unsaved changes"
      />

      <!-- Pinned indicator (pushpin icon) -->
      <span
        v-if="tab.pinned"
        class="ml-1 text-content-tertiary"
        :title="`${tab.name} is pinned`"
      >
        <svg
          class="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <!-- Pushpin icon - platform standard for all pinned indicators -->
          <path d="M19 12.87c0-.47-.18-.92-.51-1.25l-3.12-3.12V4c.55 0 1-.45 1-1s-.45-1-1-1H8.5c-.55 0-1 .45-1 1s.45 1 1 1v4.5L5.38 11.62c-.33.33-.51.78-.51 1.25 0 .97.78 1.75 1.75 1.75H11v6.62c0 .55.45 1 1 1s1-.45 1-1v-6.62h4.38c.97 0 1.75-.78 1.62-1.75Z" />
        </svg>
      </span>

      <!-- Options menu indicator -->
      <button
        v-if="tab.hasOptions"
        type="button"
        class="ml-1 p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        :aria-label="`Options for ${tab.name}`"
        @click="handleOptions($event, tab.id)"
      >
        <svg
          class="w-4 h-4 text-content-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
    </button>
  </div>
</template>
