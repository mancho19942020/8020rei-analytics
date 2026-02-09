<script setup lang="ts">
/**
 * AxisPageSkeleton Component
 *
 * A page-level skeleton loader that renders appropriate skeletons based on
 * page type presets. Use this for full-page loading states during navigation.
 *
 * USAGE:
 * <AxisPageSkeleton preset="dashboard" />
 * <AxisPageSkeleton preset="propertyList" />
 * <AxisPageSkeleton preset="settings" />
 *
 * PRESETS:
 * - dashboard: Stats + cards grid layout
 * - propertyList: Filters + data table
 * - users: Simple user table
 * - adminTenants: Filter + card grid
 * - settings: Sidebar + form layout
 * - detail: Header + content + sidebar
 * - designSystemDoc: Documentation page
 * - cardGrid: Card gallery layout
 * - content: Text content page
 * - tableView: Full-width table
 */

import { useSkeletonPresets, type SkeletonPreset } from "~/composables/useSkeletonPresets";

interface Props {
  /** Preset name for the page skeleton */
  preset?: string;
  /** Animation style */
  animation?: "pulse" | "wave" | "none";
}

const props = withDefaults(defineProps<Props>(), {
  preset: "content",
  animation: "pulse",
});

const { getPreset, presets } = useSkeletonPresets();

const currentPreset = computed<SkeletonPreset>(() => {
  return getPreset(props.preset as keyof typeof presets) || presets.content;
});
</script>

<template>
  <div class="axis-page-skeleton w-full min-h-screen bg-surface-base">
    <!-- Page Header Skeleton -->
    <div v-if="currentPreset.slots.header" class="mb-6">
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <!-- Breadcrumb -->
          <div class="flex items-center gap-2">
            <AxisSkeleton variant="text" width="60px" :animation="animation" />
            <span class="text-content-tertiary">/</span>
            <AxisSkeleton variant="text" width="80px" :animation="animation" />
          </div>
          <!-- Page title -->
          <AxisSkeleton variant="custom" width="250px" height="32px" :animation="animation" />
          <!-- Description -->
          <AxisSkeleton variant="text" width="400px" :animation="animation" />
        </div>
        <!-- Action buttons -->
        <div class="flex gap-3">
          <AxisSkeleton variant="button" size="md" :animation="animation" />
          <AxisSkeleton variant="button" size="md" :animation="animation" />
        </div>
      </div>
    </div>

    <!-- Tabs Section (like PropertyViewsTabs) -->
    <div v-if="currentPreset.slots.tabs" class="bg-surface-base border-b border-stroke-subtle">
      <div class="flex items-center gap-1 px-4 py-2">
        <!-- Tab items -->
        <div
          v-for="i in currentPreset.slots.tabs.count"
          :key="`tab-${i}`"
          class="flex items-center gap-2 px-3 py-2"
        >
          <AxisSkeleton
            variant="custom"
            :width="`${60 + (i % 3) * 20}px`"
            height="16px"
            rounded="sm"
            :animation="animation"
          />
        </div>
        <!-- Add tab button skeleton -->
        <div class="ml-2">
          <AxisSkeleton variant="custom" width="24px" height="24px" rounded="full" :animation="animation" />
        </div>
      </div>
    </div>

    <!-- Toolbar Section (search + buttons + selects) -->
    <div v-if="currentPreset.slots.toolbar" class="bg-surface-base border-b border-stroke-subtle px-4 py-3">
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Search input -->
        <div v-if="currentPreset.slots.toolbar.hasSearch" class="min-w-[200px] max-w-md">
          <AxisSkeleton variant="input" size="md" :animation="animation" />
        </div>
        <!-- Spacer -->
        <div class="flex-1" />
        <!-- Selects and buttons group -->
        <div class="flex items-center gap-3">
          <!-- Select dropdowns -->
          <AxisSkeleton
            v-for="i in (currentPreset.slots.toolbar.selectCount || 0)"
            :key="`select-${i}`"
            variant="custom"
            :width="i === 1 ? '140px' : '120px'"
            height="36px"
            rounded="md"
            :animation="animation"
          />
          <!-- Buttons -->
          <AxisSkeleton
            v-for="i in (currentPreset.slots.toolbar.buttonCount || 0)"
            :key="`button-${i}`"
            variant="button"
            size="md"
            :animation="animation"
          />
        </div>
      </div>
    </div>

    <!-- Insights Bar Section (stat pills) -->
    <div v-if="currentPreset.slots.insightsBar" class="bg-surface-base border-b border-stroke-subtle px-4 py-2">
      <div class="flex items-center gap-2">
        <div
          v-for="i in currentPreset.slots.insightsBar.count"
          :key="`insight-${i}`"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-surface-raised border border-stroke rounded-full"
        >
          <AxisSkeleton variant="custom" :width="`${50 + (i % 3) * 15}px`" height="12px" rounded="sm" :animation="animation" />
          <AxisSkeleton variant="custom" :width="`${30 + (i % 2) * 10}px`" height="14px" rounded="sm" :animation="animation" />
        </div>
      </div>
    </div>

    <!-- Layout with optional sidebar -->
    <div :class="currentPreset.slots.sidebar ? 'flex gap-6' : ''">
      <!-- Sidebar -->
      <div v-if="currentPreset.slots.sidebar" class="w-64 shrink-0">
        <div class="space-y-4">
          <!-- Sidebar navigation items -->
          <div v-for="i in 6" :key="i" class="flex items-center gap-3 p-2">
            <AxisSkeleton variant="custom" width="20px" height="20px" rounded="sm" :animation="animation" />
            <AxisSkeleton variant="text" :width="`${60 + (i % 4) * 10}%`" :animation="animation" />
          </div>
        </div>
      </div>

      <!-- Main content area -->
      <div class="flex-1 min-w-0">
        <!-- Filters Section -->
        <div v-if="currentPreset.slots.filters" class="mb-6">
          <div class="flex flex-wrap items-center gap-4 p-4 bg-surface-raised border border-stroke rounded-lg">
            <AxisSkeleton variant="input" size="sm" :animation="animation" />
            <AxisSkeleton variant="input" size="sm" :animation="animation" />
            <AxisSkeleton variant="input" size="sm" :animation="animation" />
            <div class="flex-1" />
            <AxisSkeleton variant="button" size="sm" :animation="animation" />
          </div>
        </div>

        <!-- Stats Section -->
        <div v-if="currentPreset.slots.stats" class="mb-6">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="i in currentPreset.slots.stats.count"
              :key="i"
              class="p-4 bg-surface-raised border border-stroke rounded-lg"
            >
              <AxisSkeleton variant="text" width="100px" :animation="animation" />
              <AxisSkeleton
                variant="custom"
                width="60%"
                height="36px"
                class="mt-2"
                :animation="animation"
              />
              <AxisSkeleton variant="text" width="80px" class="mt-2" :animation="animation" />
            </div>
          </div>
        </div>

        <!-- Table Section - matches AxisTable skeleton structure -->
        <div v-if="currentPreset.slots.table" class="flex-1 flex flex-col min-h-0 border border-stroke rounded-lg overflow-hidden">
          <!-- Table header row -->
          <div class="shrink-0 flex items-center bg-surface-raised dark:bg-neutral-800 border-b border-stroke">
            <!-- Selection column skeleton -->
            <div class="w-12 px-3 py-2.5 border-r border-stroke">
              <div class="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded" :class="animation === 'pulse' ? 'animate-pulse' : ''" />
            </div>
            <!-- Column header skeletons -->
            <div
              v-for="(_, idx) in currentPreset.slots.table.columns"
              :key="`header-${idx}`"
              class="flex-1 px-3 py-2.5 border-r border-stroke last:border-r-0"
              :style="{ minWidth: '100px', maxWidth: '200px' }"
            >
              <div
                class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"
                :class="animation === 'pulse' ? 'animate-pulse' : ''"
                :style="{ width: `${60 + (idx % 3) * 15}%` }"
              />
            </div>
          </div>

          <!-- Table body rows -->
          <div class="flex-1 overflow-hidden">
            <div
              v-for="rowIdx in currentPreset.slots.table.rows"
              :key="`row-${rowIdx}`"
              class="flex items-center border-b border-stroke-subtle"
            >
              <!-- Selection cell skeleton -->
              <div class="w-12 px-3 py-2.5 border-r border-stroke-subtle bg-surface-base dark:bg-neutral-900">
                <div class="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded" :class="animation === 'pulse' ? 'animate-pulse' : ''" />
              </div>
              <!-- Data cell skeletons -->
              <div
                v-for="(_, colIdx) in currentPreset.slots.table.columns"
                :key="`cell-${rowIdx}-${colIdx}`"
                class="flex-1 px-3 py-2.5 h-11 border-r border-stroke-subtle last:border-r-0 bg-surface-base dark:bg-neutral-900"
                :style="{ minWidth: '100px', maxWidth: '200px' }"
              >
                <div
                  class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"
                  :class="animation === 'pulse' ? 'animate-pulse' : ''"
                  :style="{ width: `${40 + ((rowIdx + colIdx) % 5) * 12}%` }"
                />
              </div>
            </div>
          </div>

          <!-- Pagination skeleton -->
          <div class="shrink-0 flex items-center justify-between px-4 py-3 bg-surface-base border-t border-stroke">
            <div class="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded" :class="animation === 'pulse' ? 'animate-pulse' : ''" />
            <div class="flex items-center gap-2">
              <div class="h-8 w-8 bg-neutral-200 dark:bg-neutral-700 rounded" :class="animation === 'pulse' ? 'animate-pulse' : ''" />
              <div class="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" :class="animation === 'pulse' ? 'animate-pulse' : ''" />
              <div class="h-8 w-8 bg-neutral-200 dark:bg-neutral-700 rounded" :class="animation === 'pulse' ? 'animate-pulse' : ''" />
            </div>
          </div>
        </div>

        <!-- Cards Section -->
        <div v-if="currentPreset.slots.cards">
          <div
            :class="[
              'grid gap-4',
              currentPreset.slots.cards.columns === 2 ? 'grid-cols-1 lg:grid-cols-2' :
              currentPreset.slots.cards.columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            ]"
          >
            <AxisSkeleton
              v-for="i in currentPreset.slots.cards.count"
              :key="i"
              variant="card"
              full-width
              :animation="animation"
            />
          </div>
        </div>

        <!-- Form Section -->
        <div v-if="currentPreset.slots.form" class="space-y-6">
          <div
            v-for="i in currentPreset.slots.form.fields"
            :key="i"
            class="max-w-md"
          >
            <AxisSkeleton variant="input" full-width :animation="animation" />
          </div>
          <div class="flex gap-3 pt-4">
            <AxisSkeleton variant="button" size="md" :animation="animation" />
            <AxisSkeleton variant="button" size="md" :animation="animation" />
          </div>
        </div>

        <!-- Content Section -->
        <div v-if="currentPreset.slots.content" class="space-y-8">
          <div
            v-for="i in currentPreset.slots.content.paragraphs"
            :key="i"
            class="space-y-4"
          >
            <!-- Section title -->
            <AxisSkeleton
              variant="custom"
              :width="`${150 + (i % 3) * 50}px`"
              height="24px"
              :animation="animation"
            />
            <!-- Paragraph lines -->
            <AxisSkeleton variant="text" :lines="3 + (i % 2)" full-width :animation="animation" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
