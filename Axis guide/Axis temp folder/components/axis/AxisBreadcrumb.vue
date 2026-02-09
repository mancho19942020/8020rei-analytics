<script setup lang="ts">
/**
 * AxisBreadcrumb Component
 *
 * Secondary navigation showing the user's current location within the site hierarchy.
 * Helps users navigate back efficiently through the page structure.
 *
 * USAGE:
 * <AxisBreadcrumb :items="breadcrumbItems" />
 * <AxisBreadcrumb :items="breadcrumbItems" separator="chevron" />
 * <AxisBreadcrumb :items="breadcrumbItems" :max-items="4" />
 *
 * PRIMARY USE:
 * - Showing user's location within site hierarchy
 * - Providing efficient back navigation
 * - Multi-level page structures (detail pages, nested sections)
 * - Process flows where user may need to go back
 *
 * FEATURES:
 * - Automatic overflow handling with ellipsis
 * - Multiple separator styles
 * - Home icon support
 * - Current page highlighting (non-clickable)
 *
 * ACCESSIBILITY:
 * - Uses nav element with aria-label="Breadcrumb"
 * - Ordered list structure for semantic meaning
 * - Current page marked with aria-current="page"
 */

import type { Component } from 'vue'

interface BreadcrumbItem {
  /** Display label for the breadcrumb item */
  label: string
  /** Navigation href (optional for current page) */
  href?: string
  /** Icon component (optional, typically used for home) */
  icon?: Component
}

interface Props {
  /** Breadcrumb items in order from root to current */
  items: BreadcrumbItem[]
  /** Separator style */
  separator?: 'slash' | 'chevron' | 'arrow'
  /** Maximum items to show (uses ellipsis for overflow) */
  maxItems?: number
  /** Show home icon for first item */
  showHomeIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  separator: 'slash',
  maxItems: 0, // 0 = show all
  showHomeIcon: false,
})

// Compute visible items with overflow handling
const visibleItems = computed(() => {
  if (props.maxItems <= 0 || props.items.length <= props.maxItems) {
    return props.items.map((item, index) => ({
      ...item,
      isEllipsis: false,
      isFirst: index === 0,
      isLast: index === props.items.length - 1,
    }))
  }

  // Show first item, ellipsis, and last (maxItems - 2) items
  const firstItem = { ...props.items[0], isEllipsis: false, isFirst: true, isLast: false }
  const lastItems = props.items.slice(-(props.maxItems - 1)).map((item, index, arr) => ({
    ...item,
    isEllipsis: false,
    isFirst: false,
    isLast: index === arr.length - 1,
  }))

  return [
    firstItem,
    { label: '...', isEllipsis: true, isFirst: false, isLast: false },
    ...lastItems,
  ]
})

// Separator component based on type
const separatorContent = computed(() => {
  switch (props.separator) {
    case 'chevron':
      return 'chevron'
    case 'arrow':
      return 'arrow'
    default:
      return 'slash'
  }
})
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex items-center">
    <ol class="flex items-center gap-1">
      <li
        v-for="(item, index) in visibleItems"
        :key="index"
        class="flex items-center gap-1"
      >
        <!-- Separator (not before first item) -->
        <span
          v-if="index > 0"
          class="text-content-tertiary mx-1"
          aria-hidden="true"
        >
          <!-- Slash separator -->
          <span v-if="separatorContent === 'slash'" class="text-body-regular">/</span>

          <!-- Chevron separator -->
          <svg
            v-else-if="separatorContent === 'chevron'"
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>

          <!-- Arrow separator -->
          <svg
            v-else-if="separatorContent === 'arrow'"
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>

        <!-- Ellipsis item -->
        <span
          v-if="item.isEllipsis"
          class="text-body-regular text-content-tertiary px-1"
        >
          ...
        </span>

        <!-- Current page (last item, no link) -->
        <span
          v-else-if="item.isLast"
          aria-current="page"
          class="text-body-regular text-content-primary font-medium"
        >
          <component
            :is="item.icon"
            v-if="item.icon"
            class="w-4 h-4 mr-1 inline-block"
            aria-hidden="true"
          />
          {{ item.label }}
        </span>

        <!-- Clickable breadcrumb item -->
        <NuxtLink
          v-else
          :to="item.href || '#'"
          class="text-body-regular text-content-tertiary hover:text-content-primary hover:underline transition-colors inline-flex items-center"
        >
          <!-- Home icon for first item -->
          <svg
            v-if="item.isFirst && showHomeIcon && !item.icon"
            class="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>

          <!-- Custom icon -->
          <component
            :is="item.icon"
            v-else-if="item.icon"
            class="w-4 h-4 mr-1"
            aria-hidden="true"
          />

          {{ item.label }}
        </NuxtLink>
      </li>
    </ol>
  </nav>
</template>
