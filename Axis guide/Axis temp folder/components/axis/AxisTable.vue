<template>
  <div
    :class="[
      'flex flex-col bg-surface-base overflow-hidden',
      shrinkToContent ? 'max-h-full' : 'h-full',
      borderless ? '' : 'border border-stroke rounded-lg'
    ]"
  >
    <!-- Toolbar -->
    <AxisTableToolbar
      v-if="showToolbar"
      :title="title"
      :selected-count="selectedKeys.size"
      :show-refresh="enableRefresh"
      @refresh="handleRefresh"
      @clear-selection="clearSelection"
    >
      <template #toolbar-actions>
        <slot name="toolbar-actions" />
      </template>
    </AxisTableToolbar>

    <!-- Loading state - Table skeleton matching actual layout -->
    <div v-if="loading && rows.length === 0" class="flex-1 flex flex-col min-h-0">
      <!-- Skeleton Header Row -->
      <div class="shrink-0 flex items-center bg-surface-raised dark:bg-neutral-800 border-b border-stroke">
        <!-- Selection column skeleton -->
        <div v-if="enableSelection" class="w-12 px-3 py-2.5 border-r border-stroke">
          <div class="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        </div>
        <!-- Column header skeletons -->
        <div
          v-for="(col, idx) in visibleColumns.slice(0, 8)"
          :key="`header-skeleton-${idx}`"
          class="flex-1 px-3 py-2.5 border-r border-stroke last:border-r-0"
          :style="{ minWidth: '100px', maxWidth: '200px' }"
        >
          <div
            class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"
            :style="{ width: `${60 + (idx % 3) * 15}%` }"
          />
        </div>
      </div>

      <!-- Skeleton Body Rows -->
      <div class="flex-1 overflow-hidden">
        <div
          v-for="rowIdx in 10"
          :key="`row-skeleton-${rowIdx}`"
          class="flex items-center border-b border-stroke-subtle"
        >
          <!-- Selection cell skeleton -->
          <div v-if="enableSelection" class="w-12 px-3 py-2.5 border-r border-stroke-subtle bg-surface-base dark:bg-neutral-900">
            <div class="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          </div>
          <!-- Data cell skeletons -->
          <div
            v-for="(col, colIdx) in visibleColumns.slice(0, 8)"
            :key="`cell-skeleton-${rowIdx}-${colIdx}`"
            class="flex-1 px-3 py-2.5 h-11 border-r border-stroke-subtle last:border-r-0 bg-surface-base dark:bg-neutral-900"
            :style="{ minWidth: '100px', maxWidth: '200px' }"
          >
            <div
              class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"
              :style="{ width: `${40 + ((rowIdx + colIdx) % 5) * 12}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Skeleton Pagination -->
      <div v-if="enablePagination" class="shrink-0 flex items-center justify-between px-4 py-3 bg-surface-base border-t border-stroke">
        <div class="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          <div class="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          <div class="h-8 w-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="p-8 text-center">
      <AxisCallout type="error" title="Failed to load data">
        {{ error.message }}
        <template #actions>
          <AxisButton variant="ghost" size="sm" @click="handleRefresh">
            Retry
          </AxisButton>
        </template>
      </AxisCallout>
    </div>

    <!-- Empty state -->
    <div v-else-if="rows.length === 0" class="p-8 text-center">
      <slot name="empty">
        <div class="flex flex-col items-center gap-3">
          <div class="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center">
            <svg class="w-8 h-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <div>
            <p class="text-h5 text-content-primary mb-1">No data found</p>
            <p class="text-body-regular text-content-secondary">Try adjusting your filters</p>
          </div>
        </div>
      </slot>
    </div>

    <!-- Table with data - split into fixed header, scrollable body, fixed footer -->
    <template v-else>
      <!--
        Table architecture for fixed header/footer with scrollable body:
        - Outer container handles horizontal scroll (synced between header, body, footer)
        - Inner grid layout: header (auto), body (flex-1 scrollable), footer (auto)
        - Each section has its own table with matching column widths
      -->
      <div
        ref="tableContainerRef"
        :class="[
          'min-h-0 flex flex-col',
          shrinkToContent ? '' : 'flex-1'
        ]"
        :style="containerStyle"
      >
        <!-- Fixed Header -->
        <div
          ref="headerScrollRef"
          class="shrink-0 overflow-x-auto overflow-y-hidden scrollbar-hidden"
          :style="scrollbarCompensationStyle"
          @scroll="syncHorizontalScroll('header', $event)"
        >
          <table role="grid" :style="{ ...tableStyle, borderCollapse: 'separate', borderSpacing: '0', tableLayout: 'fixed' }">
            <thead>
              <tr role="row">
                <!-- Selection column (always sticky left when present) -->
                <th
                  v-if="enableSelection"
                  class="w-12 px-3 py-2.5 text-left bg-surface-raised dark:bg-neutral-800 border-b border-r border-stroke sticky left-0 z-30"
                  role="columnheader"
                >
                  <AxisCheckbox
                    :model-value="isAllSelected"
                    :indeterminate="isSomeSelected && !isAllSelected"
                    aria-label="Select all rows"
                    @update:model-value="toggleSelectAll"
                  />
                </th>

                <!-- Data columns -->
                <th
                  v-for="(column, colIndex) in visibleColumns"
                  :key="column.field"
                  :class="[headerClasses(column, colIndex), getHeaderDragClasses(column), getPinnedHeaderClasses(column)]"
                  :style="columnStyle(column, colIndex)"
                  role="columnheader"
                  :aria-sort="getSortState(column)"
                  class="group relative"
                >
                  <!-- Draggable inner area (excludes resize handle) -->
                  <div
                    class="flex items-center gap-1 pr-2 cursor-grab active:cursor-grabbing"
                    draggable="true"
                    @dragstart="handleColumnDragStart($event, column)"
                    @dragover="handleColumnDragOver($event, column)"
                    @dragleave="handleColumnDragLeave($event, column)"
                    @dragend="handleColumnDragEnd($event)"
                    @drop="handleColumnDrop($event, column)"
                  >
                    <!-- Column header content (sortable) - with tooltip on hover -->
                    <div
                      v-if="column.sortable !== false"
                      :ref="(el) => setHeaderRef(column.field, el)"
                      class="relative group/header flex items-center gap-1 flex-1 min-w-0"
                      @mouseenter="showTooltip(column.field)"
                      @mouseleave="hideTooltip(column.field)"
                    >
                      <button
                        class="flex items-center gap-1 hover:text-content-primary transition-colors flex-1 min-w-0 text-left"
                        @click="handleSort(column)"
                      >
                        <span class="text-body-regular font-semibold text-content-primary truncate">
                          {{ column.header }}
                        </span>

                        <!-- Sort indicator -->
                        <div class="w-4 h-4 flex items-center justify-center shrink-0">
                          <ChevronUpIcon
                            v-if="getSortOrder(column) === 'asc'"
                            class="w-4 h-4 text-main-600 dark:text-main-400"
                          />
                          <ChevronDownIcon
                            v-else-if="getSortOrder(column) === 'desc'"
                            class="w-4 h-4 text-main-600 dark:text-main-400"
                          />
                        </div>
                      </button>

                      <!-- Tooltip teleported to body to escape overflow constraints -->
                      <Teleport to="body">
                        <div
                          v-if="column.tooltip && activeTooltip === column.field && tooltipPosition"
                          :style="{ left: tooltipPosition.left + 'px', top: tooltipPosition.top + 'px' }"
                          class="fixed w-full max-w-64 p-3 bg-surface-overlay border border-stroke rounded-lg shadow-lg z-30 pointer-events-none"
                        >
                          <p class="text-body-regular text-content-secondary">
                            {{ column.tooltip }}
                          </p>
                        </div>
                      </Teleport>
                    </div>

                    <!-- Non-sortable header - with tooltip on hover -->
                    <div
                      v-else
                      :ref="(el) => setHeaderRef(column.field, el)"
                      class="relative group/header flex items-center flex-1 min-w-0"
                      @mouseenter="showTooltip(column.field)"
                      @mouseleave="hideTooltip(column.field)"
                    >
                      <span class="text-body-regular font-semibold text-content-primary truncate">
                        {{ column.header }}
                      </span>

                      <!-- Tooltip teleported to body to escape overflow constraints -->
                      <Teleport to="body">
                        <div
                          v-if="column.tooltip && activeTooltip === column.field && tooltipPosition"
                          :style="{ left: tooltipPosition.left + 'px', top: tooltipPosition.top + 'px' }"
                          class="fixed w-full max-w-64 p-3 bg-surface-overlay border border-stroke rounded-lg shadow-lg z-30 pointer-events-none"
                        >
                          <p class="text-body-regular text-content-secondary">
                            {{ column.tooltip }}
                          </p>
                        </div>
                      </Teleport>
                    </div>

                    <!-- Custom header content slot (inserted between title and column options) -->
                    <slot
                      :name="`header-${column.field}`"
                      :column="column"
                      :column-index="colIndex"
                    />

                    <!-- Column options cluster (right side) - ALWAYS VISIBLE -->
                    <div class="flex items-center shrink-0">
                      <!-- Filter button with indicator -->
                      <button
                        v-if="enableFiltering"
                        class="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                        :class="hasColumnFilter(column) ? 'text-main-600 dark:text-main-400' : 'text-content-tertiary hover:text-content-secondary'"
                        :title="hasColumnFilter(column) ? 'Column is filtered' : 'Filter column'"
                        @click.stop="toggleColumnFilter(column)"
                      >
                        <FunnelIcon class="w-4 h-4" />
                      </button>

                      <!-- Column menu (three dots) -->
                      <AxisTableColumnMenu
                        :column="column"
                        :current-sort="getSortOrder(column)"
                        @sort="(order) => handleSortOrder(column, order)"
                        @clear-sort="handleClearColumnSort(column)"
                        @pin="(side) => handlePin(column, side)"
                        @hide="handleHide(column)"
                      />

                      <!-- Pin indicator (shown if pinned) - uses platform standard pushpin icon -->
                      <span
                        v-if="column.pinned"
                        class="p-0.5 text-main-600 dark:text-main-400"
                        :title="`Pinned ${column.pinned}`"
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
                    </div>
                  </div>

                  <!-- Column filter dropdown -->
                  <AxisTableColumnFilter
                    v-if="enableFiltering && openFilterColumn === column.field"
                    :column="column"
                    :current-filter="filterModel[column.field]"
                    @apply="(filter) => handleApplyFilter(column, filter)"
                    @clear="handleClearFilter(column)"
                    @close="closeColumnFilter"
                  />

                  <!-- Column resize handle - separate from draggable area -->
                  <div
                    v-if="column.resizable !== false"
                    class="absolute -right-1 top-0 bottom-0 w-3 cursor-col-resize group/resize z-20"
                    @mousedown.stop.prevent="handleResizeStart($event, column)"
                  >
                    <!-- Visual indicator - centered thin line -->
                    <div
                      class="absolute left-1/2 -translate-x-1/2 top-1 bottom-1 w-0.5 rounded-full transition-colors"
                      :class="resizingColumn === column.field ? 'bg-main-500' : 'bg-transparent group-hover/resize:bg-main-400'"
                    />
                  </div>
                </th>
              </tr>
            </thead>
          </table>
        </div>

        <!-- Scrollable Body -->
        <!-- When totals row exists, hide body scrollbar (scrollbar shows on totals row instead) -->
        <!-- When no totals row, show body scrollbar -->
        <div
          ref="bodyScrollRef"
          :class="[
            'min-h-0 overflow-auto',
            shrinkToContent ? '' : 'flex-1',
            showTotals && totalsRowData ? 'scrollbar-hidden' : ''
          ]"
          @scroll="syncHorizontalScroll('body', $event)"
        >
          <table role="grid" :style="{ ...tableStyle, borderCollapse: 'separate', borderSpacing: '0', tableLayout: 'fixed' }">
            <tbody>
              <tr
                v-for="(row, rowIndex) in rows"
                :key="getRowKey(row)"
                :class="rowClasses(row)"
                role="row"
                :aria-selected="isRowSelected(row)"
                @click="handleRowClick(row, $event)"
              >
                <!-- Selection cell (always sticky left when present) -->
                <!-- NOTE: Uses solid color matching main-950/30 over neutral-900 to prevent content showing through -->
                <td
                  v-if="enableSelection"
                  :class="[
                    'px-3 py-2.5 border-b border-r border-stroke-subtle sticky left-0 z-20',
                    isRowSelected(row)
                      ? 'bg-main-50 dark:bg-[#0d1f1d]'
                      : 'bg-surface-base dark:bg-neutral-900'
                  ]"
                  role="gridcell"
                >
                  <AxisCheckbox
                    :model-value="isRowSelected(row)"
                    :aria-label="`Select row ${rowIndex + 1}`"
                    @update:model-value="toggleRowSelection(row)"
                    @click.stop
                  />
                </td>

                <!-- Data cells -->
                <td
                  v-for="(column, colIndex) in visibleColumns"
                  :key="column.field"
                  :class="[cellContainerClasses(column, row, colIndex), getPinnedClasses(column)]"
                  :style="columnStyle(column, colIndex)"
                  role="gridcell"
                >
                  <!-- Cell with custom slot -->
                  <template v-if="$slots[`cell-${column.field}`]">
                    <slot
                      :name="`cell-${column.field}`"
                      :value="row[column.field]"
                      :row="row"
                      :column="column"
                      :row-index="rowIndex"
                      :column-index="colIndex"
                    />
                  </template>
                  <!-- Cell with auto-formatting -->
                  <AxisTableCell
                    v-else
                    :value="row[column.field]"
                    :column="column"
                    :row="row"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals row (scrolls horizontally with table) -->
        <div
          v-if="showTotals && totalsRowData"
          ref="footerScrollRef"
          class="shrink-0 overflow-x-auto overflow-y-hidden"
          :style="scrollbarCompensationStyle"
          @scroll="syncHorizontalScroll('footer', $event)"
        >
          <table role="grid" :style="{ ...tableStyle, borderCollapse: 'separate', borderSpacing: '0', tableLayout: 'fixed' }">
            <tfoot>
              <tr class="bg-surface-raised dark:bg-neutral-800">
                <td
                  v-if="enableSelection"
                  class="px-3 py-2.5 border-t-2 border-r border-stroke sticky left-0 z-30 bg-surface-raised dark:bg-neutral-800"
                />
                <td
                  v-for="(column, colIndex) in visibleColumns"
                  :key="`total-${column.field}`"
                  :class="[totalsCellClasses(column, colIndex), getPinnedHeaderClasses(column)]"
                  :style="columnStyle(column, colIndex)"
                >
                  <span
                    v-if="column.field === visibleColumns[0]?.field"
                    class="text-body-regular font-semibold text-content-primary"
                  >
                    {{ totalsLabel }}
                  </span>
                  <span
                    v-else-if="totalsRowData[column.field] !== undefined && totalsRowData[column.field] !== null"
                    class="text-body-regular font-semibold text-content-primary"
                  >
                    {{ formatTotalValue(column, totalsRowData[column.field]) }}
                  </span>
                  <span v-else />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <!-- Fixed footer slot - outside scroll container, does NOT scroll horizontally -->
    <slot name="footer" />

    <!-- Pagination - always visible at bottom -->
    <AxisTablePagination
      v-if="enablePagination && !loading && rows.length > 0"
      :current-page="currentPage"
      :page-size="pageSize"
      :total-rows="totalRows"
      :row-label="rowLabel"
      @update:current-page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ============================================================================
 * AXIS TABLE - PERSISTENCE RULES (DO NOT BREAK)
 * ============================================================================
 *
 * When `stateId` prop is provided, this table automatically persists and
 * restores the following user preferences:
 *
 * 1. COLUMN PINNING (left/right)
 *    - User pins a column → saved to localStorage (and eventually API)
 *    - User navigates away and returns → pinning is restored
 *    - Pinning supports both 'left' and 'right' sides
 *
 * 2. COLUMN ORDER (drag-and-drop reordering)
 *    - User drags column to new position → order saved
 *    - User navigates away and returns → order is restored
 *    - New columns from props are appended to saved order
 *
 * 3. COLUMN WIDTHS (resize)
 *    - User resizes a column → width saved
 *    - User returns → widths are restored
 *
 * 4. SORT CONFIGURATION
 *    - User sorts by a column → sort state saved
 *    - User returns → sort is restored
 *
 * IMPORTANT RULES:
 * - The table's internal state is the SOURCE OF TRUTH for column order/pinning
 * - Parent components should NOT override columnOrder or columnState
 * - External features (like Columns Config modal) should:
 *   a) READ current state via exposed properties (getColumnOrder, getColumnState)
 *   b) WRITE changes via exposed methods (setColumnOrder, updateColumnPin)
 *   c) NOT directly manipulate internal refs
 *
 * WHAT IS NOT PERSISTED:
 * - Hidden state (controlled by parent via columns prop)
 * - Filter state (session-specific)
 *
 * ============================================================================
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
} from '@heroicons/vue/20/solid'
import AxisCheckbox from './AxisCheckbox.vue'
import AxisButton from './AxisButton.vue'
import AxisCallout from './AxisCallout.vue'
import AxisTableToolbar from './table/AxisTableToolbar.vue'
import AxisTablePagination from './table/AxisTablePagination.vue'
import AxisTableCell from './table/AxisTableCell.vue'
import AxisTableColumnMenu from './table/AxisTableColumnMenu.vue'
import AxisTableColumnFilter from './table/AxisTableColumnFilter.vue'
import {
  formatNumberCompact,
  formatCurrencyCompact,
  formatPercentage,
} from '~/utils/formatting'
import type {
  Column,
  ColumnPinSide,
  GridParams,
  GridResponse,
  SortModel,
  FilterModel,
  FilterCondition,
  SortOrder,
  TotalsConfig,
  RowData,
  CellValue,
} from './table/types'
import type { PersistedTableState } from '~/composables/useTableState'
import { useTableState } from '~/composables/useTableState'

interface Props {
  /** Column definitions */
  columns: Column[]

  /** Data fetch function (server-side) */
  fetchData?: (params: GridParams) => Promise<GridResponse>

  /** Static data (client-side) */
  data?: RowData[]

  /** Unique row key field (default: 'id') */
  rowKey?: string

  /** Table title */
  title?: string

  /** Row label for pagination (default: 'rows') */
  rowLabel?: string

  /** Table height (default: '100%') */
  height?: string

  /** Enable selection checkboxes */
  enableSelection?: boolean

  /** Enable pagination */
  enablePagination?: boolean

  /** Enable refresh button */
  enableRefresh?: boolean

  /** Show toolbar */
  showToolbar?: boolean

  /** Initial page size */
  defaultPageSize?: number

  /** Initial sort */
  defaultSort?: SortModel[]

  /** Show totals row */
  showTotals?: boolean

  /** Totals configuration */
  totalsConfig?: TotalsConfig

  /** Compact row height */
  compact?: boolean

  /** Striped rows */
  striped?: boolean

  /** Initial state for restoring persisted configuration */
  initialState?: PersistedTableState | null

  /** Enable state persistence (emits state-change events) */
  persistState?: boolean

  /** Whether state is still loading (prevents emitting until loaded) */
  stateLoading?: boolean

  /**
   * Unique ID for automatic state persistence.
   * When provided, the table will automatically save and restore:
   * - Column pinning (left/right)
   * - Column visibility (hidden)
   * - Column order
   * - Column widths
   * - Sort configuration
   *
   * This enables component-level persistence without requiring
   * parent components to handle state events.
   */
  stateId?: string

  /**
   * Initial selection keys (array of row key values).
   * Used to pre-select rows when the table loads.
   */
  initialSelection?: (string | number)[]

  /**
   * Remove border and rounded corners.
   * Useful when embedding the table in a custom container.
   */
  borderless?: boolean

  /**
   * Shrink table to content height instead of filling container.
   * When enabled, the table will only be as tall as its content,
   * up to the max-height constraint. Useful for tables that should
   * not fill empty space when there are few rows.
   */
  shrinkToContent?: boolean

  /**
   * Enable column filtering.
   * When false, hides the filter button and filter dropdown from all columns.
   */
  enableFiltering?: boolean
}

interface Emits {
  (e: 'row-click', row: RowData): void
  (e: 'selection-change', rows: RowData[]): void
  (e: 'data-loaded', data: RowData[]): void
  (e: 'data-error', error: Error): void
  (e: 'column-pin', column: Column, side: ColumnPinSide): void
  (e: 'column-hide', column: Column): void
  (e: 'sort-change', sortModel: SortModel[]): void
  (e: 'column-reorder', columns: Column[]): void
  (e: 'state-change', state: PersistedTableState): void
  (e: 'refresh'): void
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  rowLabel: 'rows',
  height: '100%',
  enableSelection: false,
  enablePagination: true,
  enableRefresh: true,
  showToolbar: true,
  defaultPageSize: 50,
  showTotals: false,
  compact: false,
  striped: false,
  initialState: null,
  persistState: false,
  stateLoading: false,
  stateId: undefined,
  initialSelection: () => [],
  borderless: false,
  shrinkToContent: false,
  enableFiltering: true,
})

const emit = defineEmits<Emits>()

// ============================================
// Data Mode Detection
// ============================================

/**
 * Detect if table is in external data management mode.
 * When using :data prop, parent handles all data fetching (server-side).
 * When using :fetchData prop, table handles data fetching (server-side internal).
 * This prevents client-side processing when parent manages server-side data.
 */
const isExternalDataMode = computed(() => {
  const hasData = !!props.data
  const hasFetchData = !!props.fetchData
  const result = hasData && !hasFetchData
  console.log('[AxisTable] isExternalDataMode computed - props.data:', props.data?.length, 'props.fetchData:', !!props.fetchData, 'result:', result)
  return result
})

// ============================================
// State
// ============================================

const rows = ref<RowData[]>([])
const totalRows = ref(0)
const loading = ref(false)
const error = ref<Error | null>(null)

const currentPage = ref(1)
const pageSize = ref(props.defaultPageSize)
const sortModel = ref<SortModel[]>(props.defaultSort || [])
const filterModel = ref<FilterModel>({})

const selectedKeys = ref<Set<string | number>>(new Set())

// Column state (for pinning/visibility changes)
const columnState = ref<Record<string, { pinned?: ColumnPinSide; hidden?: boolean }>>({})

// Column reorder state
const columnOrder = ref<string[]>([])
const draggedColumnField = ref<string | null>(null)
const dragOverColumnField = ref<string | null>(null)
const dragDropPosition = ref<'left' | 'right' | null>(null)

// Column resize state
const columnWidths = ref<Record<string, number>>({})
const resizingColumn = ref<string | null>(null)
const resizeStartX = ref<number>(0)
const resizeStartWidth = ref<number>(0)

// Column filter state
const openFilterColumn = ref<string | null>(null)

// Table container ref for measuring available width
const tableContainerRef = ref<HTMLElement | null>(null)

// Refs for synced horizontal scrolling (fixed header/footer architecture)
const headerScrollRef = ref<HTMLElement | null>(null)
const bodyScrollRef = ref<HTMLElement | null>(null)
const footerScrollRef = ref<HTMLElement | null>(null)

// Flag to prevent infinite scroll sync loops
const isScrollSyncing = ref(false)

// Scrollbar width compensation for header/footer alignment
const scrollbarWidth = ref(0)

// Flag to track if initial auto-sizing has been done
const hasAutoSizedColumns = ref(false)

// ============================================
// Tooltip positioning state
// ============================================

// Active tooltip field and position
const activeTooltip = ref<string | null>(null)
const tooltipPosition = ref<{ left: number; top: number } | null>(null)
const headerRefs = ref<Record<string, HTMLElement | null>>({})

// Set header ref for tooltip positioning
const setHeaderRef = (field: string, el: unknown) => {
  if (el instanceof HTMLElement) {
    headerRefs.value[field] = el
  }
}

// Show tooltip and calculate position
const showTooltip = (field: string) => {
  const headerEl = headerRefs.value[field]
  if (!headerEl) return

  const rect = headerEl.getBoundingClientRect()
  activeTooltip.value = field
  tooltipPosition.value = {
    left: rect.left,
    top: rect.bottom + 8, // 8px gap below header (mt-2 equivalent)
  }
}

// Hide tooltip
const hideTooltip = (field: string) => {
  if (activeTooltip.value === field) {
    activeTooltip.value = null
    tooltipPosition.value = null
  }
}

// ============================================
// Auto-persistence with stateId
// ============================================

// Track the current stateId and manage multiple persistence instances
const currentStateId = ref(props.stateId || '')
const persistenceCache = new Map<string, ReturnType<typeof useTableState>>()

// Get or create persistence instance for current stateId
const getTableStatePersistence = (stateId: string) => {
  if (!stateId) return null

  if (!persistenceCache.has(stateId)) {
    persistenceCache.set(stateId, useTableState(stateId))
  }

  return persistenceCache.get(stateId) || null
}

// Current active persistence instance
let tableStatePersistence = getTableStatePersistence(currentStateId.value)

// Flag to prevent saving during initial load
const isInitializingFromPersistedState = ref(false)

// Watch for stateId prop changes (e.g., when switching views)
// When stateId changes, we need to switch to the new persistence instance and reload state
watch(
  () => props.stateId,
  (newStateId) => {
    if (newStateId && newStateId !== currentStateId.value) {
      console.log('[AxisTable] StateId changed:', currentStateId.value, '->', newStateId)
      currentStateId.value = newStateId

      // Switch to the new persistence instance
      tableStatePersistence = getTableStatePersistence(newStateId)

      // Reset column state to force reinitialization from new stateId
      isInitializingFromPersistedState.value = true
      columnOrder.value = []
      columnWidths.value = {}
      columnState.value = {}
      sortModel.value = []

      // Load state from the new persistence instance
      if (tableStatePersistence && tableStatePersistence.state.value) {
        const persistedState = tableStatePersistence.state.value

        // Apply column state (pinning only)
        if (persistedState.columnState) {
          const pinnedOnlyState: Record<string, { pinned?: 'left' | 'right' | null }> = {}
          for (const [field, state] of Object.entries(persistedState.columnState)) {
            if (state.pinned) {
              pinnedOnlyState[field] = { pinned: state.pinned }
            }
          }
          columnState.value = pinnedOnlyState
        }

        // Apply column widths
        if (persistedState.columnWidths && Object.keys(persistedState.columnWidths).length > 0) {
          columnWidths.value = { ...persistedState.columnWidths }
          hasAutoSizedColumns.value = true
        }

        // Apply sort model
        if (persistedState.sortModel && persistedState.sortModel.length > 0) {
          sortModel.value = [...persistedState.sortModel]
        }

        // Apply column order if persisted
        if (persistedState.columnOrder && persistedState.columnOrder.length > 0) {
          const propsFields = props.columns.map(c => c.field)
          const validPersistedOrder = persistedState.columnOrder.filter(f => propsFields.includes(f))
          const newFields = propsFields.filter(f => !validPersistedOrder.includes(f))
          columnOrder.value = [...validPersistedOrder, ...newFields]
        } else {
          // No persisted order - use props order
          columnOrder.value = props.columns.map(c => c.field)
        }
      } else {
        // No persisted state - initialize from props
        columnOrder.value = props.columns.map(c => c.field)
      }

      nextTick(() => {
        isInitializingFromPersistedState.value = false
      })
    }
  }
)

// Auto-save state changes (debounced by useTableState)
// Save pin state, widths, sort, and column order - NOT hidden state or filters
// This watcher works with the dynamic tableStatePersistence instance
watch(
  [columnState, columnWidths, sortModel, columnOrder],
  () => {
    // Don't save during initial load
    if (isInitializingFromPersistedState.value) return

    // Get current persistence instance
    const currentPersistence = getTableStatePersistence(currentStateId.value)
    if (!currentPersistence) return
    if (currentPersistence.isLoading.value) return

    // Extract only pin state (not hidden state)
    const pinnedOnlyState: Record<string, { pinned?: 'left' | 'right' | null }> = {}
    for (const [field, state] of Object.entries(columnState.value)) {
      if (state.pinned) {
        pinnedOnlyState[field] = { pinned: state.pinned }
      }
    }

    currentPersistence.updateState({
      columnState: pinnedOnlyState,
      columnWidths: columnWidths.value,
      sortModel: sortModel.value,
      columnOrder: columnOrder.value, // Persist column order
      filterModel: {}, // Don't persist filters
    })
  },
  { deep: true }
)

// ============================================
// Computed
// ============================================

/**
 * Initialize and maintain column order from props
 * Ensures columnOrder always contains all visible columns for drag-drop to work
 *
 * CRITICAL: Always initialize columnOrder immediately from props.
 * If persistence has saved order, it will override this when it finishes loading.
 * This ensures drag-drop works immediately on page load (not waiting for API).
 *
 * Previous bug: Returning early while persistence was loading caused columnOrder
 * to remain empty, breaking drag-drop until the user saved column configuration.
 */
watch(
  () => props.columns,
  (newColumns) => {
    // Get fields from new columns
    const newColumnFields = newColumns.map((col) => col.field)

    if (columnOrder.value.length === 0) {
      // Initialize immediately from props - don't wait for persistence
      // This ensures drag-drop works right away on initial page load
      columnOrder.value = newColumnFields
      console.log('[AxisTable] Initialized columnOrder from props:', newColumnFields.length, 'columns')
    } else {
      // Merge logic: maintain existing order + add any new columns not yet in order
      // This ensures drag-drop works even when columns change or view switches
      const existingFields = columnOrder.value.filter(f => newColumnFields.includes(f))
      const missingFields = newColumnFields.filter(f => !columnOrder.value.includes(f))
      columnOrder.value = [...existingFields, ...missingFields]
    }
  },
  { immediate: true }
)

// Note: State loading is now handled by the stateId change watcher above
// Auto-sizing happens automatically when columns are initialized

/**
 * Visible columns (exclude hidden columns) - respects column order
 * Merges props columns with columnState for pinning/hiding
 * Sorts columns so pinned-left come first, unpinned in middle, pinned-right last
 */
const visibleColumns = computed((): Column[] => {
  // Build map of columns by field for quick lookup
  const columnMap = new Map(props.columns.map((col) => [col.field, col]))

  // Use column order if set, otherwise fall back to props order
  const orderedFields = columnOrder.value.length > 0
    ? columnOrder.value
    : props.columns.map((col) => col.field)

  const leftPinned: Column[] = []
  const unpinned: Column[] = []
  const rightPinned: Column[] = []

  for (const field of orderedFields) {
    const col = columnMap.get(field)
    if (!col) continue

    const state = columnState.value[col.field]

    // Skip hidden columns
    if (col.hidden || state?.hidden) continue

    // Merge column with columnState to reflect pinning changes
    const mergedCol = {
      ...col,
      pinned: state?.pinned !== undefined ? state.pinned : col.pinned,
    }

    // Sort into pinned groups
    if (mergedCol.pinned === 'left') {
      leftPinned.push(mergedCol)
    } else if (mergedCol.pinned === 'right') {
      rightPinned.push(mergedCol)
    } else {
      unpinned.push(mergedCol)
    }
  }

  // Return columns in order: left-pinned, unpinned, right-pinned
  return [...leftPinned, ...unpinned, ...rightPinned]
})

/**
 * Calculate the sticky offset for a pinned column
 * Returns the sum of widths of all previous columns with the same pin side
 * Uses getColumnWidth to ensure consistent width calculation everywhere
 */
function getPinnedOffset(column: Column, colIndex: number): number {
  if (!column.pinned) return 0

  let offset = 0

  if (column.pinned === 'left') {
    // Add selection column width if enabled
    if (props.enableSelection) {
      offset += 48 // w-12 = 48px
    }
    // Sum widths of all left-pinned columns before this one
    for (let i = 0; i < colIndex; i++) {
      const col = visibleColumns.value[i]
      if (col.pinned === 'left') {
        offset += getColumnWidth(col)
      }
    }
  } else if (column.pinned === 'right') {
    // Sum widths of all right-pinned columns after this one
    for (let i = colIndex + 1; i < visibleColumns.value.length; i++) {
      const col = visibleColumns.value[i]
      if (col.pinned === 'right') {
        offset += getColumnWidth(col)
      }
    }
  }

  return offset
}

/**
 * Get CSS classes for pinned header cells
 * Uses higher z-index than body cells so headers stay on top when scrolling vertically
 */
function getPinnedHeaderClasses(column: Column) {
  if (!column.pinned) return {}

  return {
    'z-30': true, // Higher than pinned body cells (z-20) so headers stay on top
    'shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]': column.pinned === 'left',
    'shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]': column.pinned === 'right',
    'border-l border-l-stroke': column.pinned === 'right', // Left border for right-pinned columns
  }
}

/**
 * Get CSS classes for pinned body/data cells
 * Uses lower z-index than header cells
 */
function getPinnedClasses(column: Column) {
  if (!column.pinned) return {}

  return {
    'z-20': true, // Lower than pinned header cells (z-30)
    'shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]': column.pinned === 'left',
    'shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]': column.pinned === 'right',
    'border-l border-l-stroke': column.pinned === 'right', // Left border for right-pinned columns
  }
}

/**
 * Container style for height
 */
const containerStyle = computed(() => {
  if (props.height === '100%') {
    return {}
  }
  return { maxHeight: props.height }
})

/**
 * Calculate total table width based on all column widths.
 * This ensures the table doesn't use w-full which causes column redistribution on resize.
 * Respects resizable: false by using defined widths for non-resizable columns.
 * Uses getColumnWidth to ensure consistent width calculation everywhere.
 */
const tableStyle = computed(() => {
  let totalWidth = 0

  // Add selection column width if enabled (w-12 = 48px)
  if (props.enableSelection) {
    totalWidth += 48
  }

  // Add each visible column's width using the unified width calculation
  for (const column of visibleColumns.value) {
    totalWidth += getColumnWidth(column)
  }

  return {
    minWidth: `${totalWidth}px`,
    width: `${totalWidth}px`,
  }
})

/**
 * Style for header/footer sections to compensate for body scrollbar width.
 * Adds padding-right equal to the scrollbar width so columns stay aligned.
 */
const scrollbarCompensationStyle = computed(() => {
  if (scrollbarWidth.value > 0) {
    return { paddingRight: `${scrollbarWidth.value}px` }
  }
  return {}
})

/**
 * Selection state
 */
const isAllSelected = computed(() => {
  if (rows.value.length === 0) return false
  return rows.value.every((row) => selectedKeys.value.has(getRowKey(row)))
})

const isSomeSelected = computed(() => {
  if (rows.value.length === 0) return false
  return rows.value.some((row) => selectedKeys.value.has(getRowKey(row)))
})

/**
 * Totals row data
 */
const totalsRowData = computed(() => {
  // Use manual values if provided
  if (props.totalsConfig?.values) {
    return props.totalsConfig.values
  }

  // Auto-calculate based on column totals config
  const totals: Record<string, number | null> = {}
  for (const col of visibleColumns.value) {
    if (col.totals && col.totals !== 'none') {
      const values = rows.value
        .map((row) => row[col.field])
        .filter((v) => typeof v === 'number')

      if (values.length === 0) {
        totals[col.field] = null
        continue
      }

      switch (col.totals) {
        case 'sum':
          totals[col.field] = values.reduce((a, b) => a + b, 0)
          break
        case 'avg':
          totals[col.field] = values.reduce((a, b) => a + b, 0) / values.length
          break
        case 'count':
          totals[col.field] = values.length
          break
      }
    }
  }

  return Object.keys(totals).length > 0 ? totals : null
})

/**
 * Totals label
 */
const totalsLabel = computed(() => props.totalsConfig?.label || 'Total')

// ============================================
// Methods
// ============================================

/**
 * Get unique row key
 */
function getRowKey(row: RowData): string | number {
  const key = row[props.rowKey]
  return typeof key === 'string' || typeof key === 'number' ? key : String(key)
}

/**
 * Check if row is selected
 */
function isRowSelected(row: RowData): boolean {
  return selectedKeys.value.has(getRowKey(row))
}

/**
 * Toggle row selection
 */
function toggleRowSelection(row: RowData) {
  const key = getRowKey(row)
  if (selectedKeys.value.has(key)) {
    selectedKeys.value.delete(key)
  } else {
    selectedKeys.value.add(key)
  }
  emitSelectionChange()
}

/**
 * Toggle select all
 */
function toggleSelectAll(selected: boolean) {
  if (selected) {
    rows.value.forEach((row) => selectedKeys.value.add(getRowKey(row)))
  } else {
    rows.value.forEach((row) => selectedKeys.value.delete(getRowKey(row)))
  }
  emitSelectionChange()
}

/**
 * Clear selection
 */
function clearSelection() {
  selectedKeys.value.clear()
  emitSelectionChange()
}

/**
 * Set selection to specific keys (replaces current selection)
 */
function setSelection(keys: (string | number)[]) {
  selectedKeys.value = new Set(keys)
  emitSelectionChange()
}

/**
 * Emit selection change event
 */
function emitSelectionChange() {
  const selectedRows = rows.value.filter((row) =>
    selectedKeys.value.has(getRowKey(row))
  )
  emit('selection-change', selectedRows)
}

/**
 * Handle row click
 */
function handleRowClick(row: RowData, event: MouseEvent) {
  // Don't emit if clicking on interactive elements
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('input') || target.closest('a')) {
    return
  }

  emit('row-click', row)
}

/**
 * Calculate minimum width needed to display full header text
 * Uses font metrics for accurate character width calculation
 * IMPORTANT: Column width must be sufficient to show the full header title without truncation
 */
function calculateHeaderWidth(column: Column): number {
  const headerText = column.header || ''

  // Calculate text width more accurately:
  // - Average character width for 14px font-semibold is ~8.5px
  // - Use 10px per character to account for wider characters (M, W, etc.) and font-semibold weight
  // - Add 20% safety margin for cross-browser rendering differences
  const baseCharWidth = 10
  const safetyMultiplier = 1.2
  const textWidth = Math.ceil(headerText.length * baseCharWidth * safetyMultiplier)

  // px-3 padding = 24px (12px each side)
  const padding = 24

  // Column controls width:
  // - Sort icon (16px w-4)
  // - Filter button (20px - p-0.5 + w-4 icon)
  // - Menu button (20px)
  // - Pin icon when visible (16px)
  // - Gap between controls (~8px)
  // Total: ~80px for controls
  const controlsWidth = 80

  // Minimum width to ensure short titles still have enough space
  const minWidth = 120

  // Calculate total: header text width + padding + controls
  // No maximum constraint - let headers display fully
  return Math.max(textWidth + padding + controlsWidth, minWidth)
}

/**
 * Column style (width + sticky positioning for pinned columns)
 * Uses dynamic width if set, otherwise falls back to column definition
 * When no width is specified, calculates minimum width to show full header text
 * Respects resizable: false by ignoring dynamic widths for non-resizable columns
 *
 * Initial load: Column width defaults to header minimum to ensure titles are visible
 * After resize: User can resize columns to any width (including smaller than header)
 */
function columnStyle(column: Column, colIndex?: number) {
  // For non-resizable columns, always use the defined width (ignore stored widths)
  const dynamicWidth = column.resizable === false ? undefined : columnWidths.value[column.field]

  // Calculate minimum width needed to show full header text (used as default only)
  const headerMinWidth = calculateHeaderWidth(column)

  // Determine effective width:
  // 1. If user has resized (dynamicWidth exists), USE IT AS-IS (allow any width)
  // 2. Otherwise, use the larger of column.width or header minimum for good defaults
  const baseWidth = column.width ?? headerMinWidth
  const effectiveWidth = dynamicWidth ?? Math.max(baseWidth, headerMinWidth)

  const style: Record<string, string | undefined> = {
    width: `${effectiveWidth}px`,
    minWidth: column.minWidth ? `${column.minWidth}px` : '50px',
    maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined,
  }

  // Apply sticky positioning for pinned columns
  if (column.pinned && colIndex !== undefined) {
    const offset = getPinnedOffset(column, colIndex)
    style.position = 'sticky'
    if (column.pinned === 'left') {
      style.left = `${offset}px`
    } else {
      style.right = `${offset}px`
    }
  }

  return style
}

/**
 * Get the current width of a column (for resize calculations)
 * Respects resizable: false by ignoring dynamic widths for non-resizable columns
 * Returns user-set width if resized, otherwise uses default with header minimum
 */
function getColumnWidth(column: Column): number {
  const dynamicWidth = column.resizable === false ? undefined : columnWidths.value[column.field]
  const headerMinWidth = calculateHeaderWidth(column)
  const baseWidth = column.width ?? headerMinWidth
  // If user has resized, use their width; otherwise use default with header minimum
  return dynamicWidth ?? Math.max(baseWidth, headerMinWidth)
}

/**
 * Row classes
 */
function rowClasses(row: RowData) {
  return [
    'transition-colors duration-200',
    'hover:bg-surface-raised dark:hover:bg-neutral-800',
    'cursor-pointer',
    {
      'bg-main-50 dark:bg-main-950/30': isRowSelected(row),
      'bg-surface-base dark:bg-neutral-900': !isRowSelected(row),
    },
  ]
}

/**
 * Get alignment for column
 * Design System Rule: Text = left, Numbers/Currency/Percentage/Dates = center
 * Right alignment is NOT used - only left or center
 *
 * Special cases:
 * - ZIP codes: Center-aligned (numeric-like data, even though stored as text)
 * - Boolean: Center-aligned (Yes/No tags look better centered)
 */
function getColumnAlign(column: Column): 'left' | 'center' {
  // Override any 'right' alignment with 'center' per design system rules
  if (column.align === 'right') {
    console.warn(`AxisTable: Column "${column.field}" has align="right" which is not allowed. Using "center" instead.`)
    return 'center'
  }
  if (column.align === 'left' || column.align === 'center') return column.align

  // Special case: ZIP codes should be center-aligned (numeric-like data)
  if (column.field === 'zip' || column.field.includes('_zip') || column.field.endsWith('_zip')) {
    return 'center'
  }

  // Default: Numbers, currency, percentage, dates, boolean, and composite align center; text aligns left
  if (column.type === 'number' || column.type === 'currency' || column.type === 'percentage' || column.type === 'composite' || column.type === 'date' || column.type === 'boolean') {
    return 'center'
  }
  return 'left'
}

/**
 * Header classes
 */
function headerClasses(column: Column, colIndex: number) {
  const align = getColumnAlign(column)
  const isLastColumn = colIndex === visibleColumns.value.length - 1

  // Header group background colors (for buybox property types step)
  let headerBg = 'bg-surface-raised dark:bg-neutral-800'
  if (column.headerGroup === 'market') {
    headerBg = 'bg-info-50 dark:bg-info-900/30'
  } else if (column.headerGroup === 'client') {
    headerBg = 'bg-alert-50 dark:bg-alert-900/30'
  }

  return [
    'px-3 py-2.5',
    headerBg,
    'border-b border-stroke',
    // Vertical border (right side) - not on last column
    isLastColumn ? '' : 'border-r',
    {
      'text-left': align === 'left',
      'text-center': align === 'center',
    },
  ]
}

/**
 * Cell container classes
 * Note: h-11 (44px) ensures consistent row height across all cells
 *
 * IMPORTANT: For pinned columns when selected in dark mode, we use a pre-computed
 * solid color that matches the visual result of bg-main-950/30 over bg-neutral-900.
 * This prevents content from showing through while maintaining consistent highlight appearance.
 *
 * Color math: neutral-900 (#111827) + 30% main-950 (#052e16) ≈ #0d1f1d
 */
function cellContainerClasses(column: Column, row: RowData, colIndex: number) {
  const align = getColumnAlign(column)
  const isLastColumn = colIndex === visibleColumns.value.length - 1
  const selected = isRowSelected(row)
  const isPinned = column.pinned === 'left' || column.pinned === 'right'

  // Determine background class
  let bgClass: string
  if (selected) {
    // Pinned columns need a solid equivalent of the semi-transparent color
    // to prevent content from showing through when scrolling
    bgClass = isPinned
      ? 'bg-main-50 dark:bg-[#0d1f1d]' // Solid color matching main-950/30 over neutral-900
      : 'bg-main-50 dark:bg-main-950/30'
  } else {
    bgClass = 'bg-surface-base dark:bg-neutral-900'
  }

  return [
    'px-3 py-2.5',
    'h-11', // Fixed height to ensure consistent row heights (44px)
    'border-b border-stroke-subtle',
    // Overflow handling for truncation - content clips if too tall
    'overflow-hidden',
    // Vertical border (right side) - not on last column
    isLastColumn ? '' : 'border-r border-r-stroke-subtle',
    // Background
    bgClass,
    {
      'text-left': align === 'left',
      'text-center': align === 'center',
    },
  ]
}

/**
 * Totals cell classes
 */
function totalsCellClasses(column: Column, colIndex: number) {
  const align = getColumnAlign(column)
  const isLastColumn = colIndex === visibleColumns.value.length - 1

  return [
    'px-3 py-2.5',
    'border-t-2 border-stroke',
    // Vertical border (right side) - not on last column
    isLastColumn ? '' : 'border-r',
    // Background required for sticky columns to occlude scrolling content
    'bg-surface-raised dark:bg-neutral-800',
    {
      'text-left': align === 'left',
      'text-center': align === 'center',
    },
  ]
}

/**
 * Format total value based on column type using platform-wide formatting utilities.
 * Uses compact notation (K/M) to match regular cell formatting.
 */
function formatTotalValue(column: Column, value: number | string | null): string {
  if (value === null || value === undefined) return ''

  const numValue = typeof value === 'number' ? value : Number.parseFloat(value as string)
  if (Number.isNaN(numValue)) return String(value)

  // For composite columns, use the primary type for formatting
  const effectiveType = column.type === 'composite' ? column.format?.primary : column.type

  switch (effectiveType) {
    case 'currency':
      return formatCurrencyCompact(numValue)

    case 'percentage':
      return formatPercentage(numValue)

    case 'number':
    default:
      return formatNumberCompact(numValue)
  }
}

/**
 * Get sort state for ARIA
 */
function getSortState(column: Column): 'ascending' | 'descending' | 'none' {
  const sort = sortModel.value.find((s) => s.field === column.field)
  if (!sort) return 'none'
  return sort.order === 'asc' ? 'ascending' : 'descending'
}

/**
 * Get sort order for column
 */
function getSortOrder(column: Column): SortOrder {
  const sort = sortModel.value.find((s) => s.field === column.field)
  return sort?.order || null
}

/**
 * Check if column has active filter
 */
function hasColumnFilter(column: Column): boolean {
  return !!filterModel.value[column.field]
}

/**
 * Handle sort click (toggle)
 */
function handleSort(column: Column) {
  console.log('[AxisTable] handleSort called for column:', column.field, 'sortable:', column.sortable)
  if (column.sortable === false) return

  const currentSort = sortModel.value.find((s) => s.field === column.field)
  console.log('[AxisTable] Current sort:', currentSort)

  if (!currentSort) {
    // Add ascending sort
    sortModel.value = [{ field: column.field, order: 'asc' }]
  } else if (currentSort.order === 'asc') {
    // Change to descending
    currentSort.order = 'desc'
  } else {
    // Remove sort
    sortModel.value = sortModel.value.filter((s) => s.field !== column.field)
  }

  console.log('[AxisTable] New sortModel:', JSON.stringify(sortModel.value))
  console.log('[AxisTable] isExternalDataMode:', isExternalDataMode.value)
  console.log('[AxisTable] Emitting sort-change event')
  emit('sort-change', sortModel.value)

  // Only fetch data if table manages it internally (not external data mode)
  if (!isExternalDataMode.value) {
    fetchTableData()
  }
}

/**
 * Handle sort order from menu
 */
function handleSortOrder(column: Column, order: 'asc' | 'desc') {
  console.log('[AxisTable] handleSortOrder called for column:', column.field, 'order:', order)
  sortModel.value = [{ field: column.field, order }]
  console.log('[AxisTable] New sortModel from menu:', JSON.stringify(sortModel.value))
  console.log('[AxisTable] Emitting sort-change event from menu')
  emit('sort-change', sortModel.value)

  // Only fetch data if table manages it internally (not external data mode)
  if (!isExternalDataMode.value) {
    fetchTableData()
  }
}

/**
 * Handle clear column sort from menu
 */
function handleClearColumnSort(column: Column) {
  sortModel.value = sortModel.value.filter((s) => s.field !== column.field)
  emit('sort-change', sortModel.value)

  // Only fetch data if table manages it internally (not external data mode)
  if (!isExternalDataMode.value) {
    fetchTableData()
  }
}

/**
 * Handle pin column
 */
function handlePin(column: Column, side: ColumnPinSide) {
  // Use spread to ensure Vue reactivity triggers
  columnState.value = {
    ...columnState.value,
    [column.field]: {
      ...columnState.value[column.field],
      pinned: side,
    },
  }
  emit('column-pin', column, side)
}

/**
 * Handle hide column
 */
function handleHide(column: Column) {
  // Use spread to ensure Vue reactivity triggers
  columnState.value = {
    ...columnState.value,
    [column.field]: {
      ...columnState.value[column.field],
      hidden: true,
    },
  }
  emit('column-hide', column)
}

// ============================================
// Horizontal Scroll Sync (Fixed Header/Footer)
// ============================================

/**
 * Measure the scrollbar width of the body section.
 * This is needed to add padding to header/footer so they align with the body content.
 */
function measureScrollbarWidth() {
  if (!bodyScrollRef.value) {
    scrollbarWidth.value = 0
    return
  }

  // scrollbarWidth = offsetWidth (full width) - clientWidth (visible content width)
  const width = bodyScrollRef.value.offsetWidth - bodyScrollRef.value.clientWidth
  scrollbarWidth.value = width
}

/**
 * Sync horizontal scroll position between header, body, and footer.
 * This ensures all three sections stay aligned when scrolling horizontally.
 */
function syncHorizontalScroll(source: 'header' | 'body' | 'footer', event: Event) {
  if (isScrollSyncing.value) return

  const target = event.target as HTMLElement
  const scrollLeft = target.scrollLeft

  isScrollSyncing.value = true

  // Sync all other scroll containers
  if (source !== 'header' && headerScrollRef.value) {
    headerScrollRef.value.scrollLeft = scrollLeft
  }
  if (source !== 'body' && bodyScrollRef.value) {
    bodyScrollRef.value.scrollLeft = scrollLeft
  }
  if (source !== 'footer' && footerScrollRef.value) {
    footerScrollRef.value.scrollLeft = scrollLeft
  }

  // Reset sync flag after a brief delay to allow scroll events to settle
  requestAnimationFrame(() => {
    isScrollSyncing.value = false
  })
}

// ============================================
// Column Filtering
// ============================================

/**
 * Toggle column filter dropdown
 */
function toggleColumnFilter(column: Column) {
  if (openFilterColumn.value === column.field) {
    openFilterColumn.value = null
  } else {
    openFilterColumn.value = column.field
  }
}

/**
 * Close column filter dropdown
 */
function closeColumnFilter() {
  openFilterColumn.value = null
}

/**
 * Apply filter to column
 */
function handleApplyFilter(column: Column, filter: FilterCondition | FilterCondition[]) {
  filterModel.value[column.field] = filter
  openFilterColumn.value = null

  // Only fetch data if table manages it internally (not external data mode)
  if (!isExternalDataMode.value) {
    fetchTableData()
  }
}

/**
 * Clear filter from column
 */
function handleClearFilter(column: Column) {
  const { [column.field]: _removed, ...rest } = filterModel.value
  filterModel.value = rest
  openFilterColumn.value = null

  // Only fetch data if table manages it internally (not external data mode)
  if (!isExternalDataMode.value) {
    fetchTableData()
  }
}

// ============================================
// Column Drag & Drop Reorder
// ============================================

/**
 * Handle column drag start
 */
function handleColumnDragStart(event: DragEvent, column: Column) {
  draggedColumnField.value = column.field
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', column.field)
    // Set a custom drag image for smoother visual
    const dragImage = event.target as HTMLElement
    event.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2)
  }
}

/**
 * Handle column drag over
 * Determines drop position (left or right) based on cursor position
 */
function handleColumnDragOver(event: DragEvent, column: Column) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }

  if (!draggedColumnField.value || draggedColumnField.value === column.field) {
    dragOverColumnField.value = null
    dragDropPosition.value = null
    return
  }

  // Determine if cursor is on left or right half of the column header
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const halfWidth = rect.width / 2

  dragOverColumnField.value = column.field
  dragDropPosition.value = mouseX < halfWidth ? 'left' : 'right'
}

/**
 * Handle column drag leave
 */
function handleColumnDragLeave(event: DragEvent, column: Column) {
  // Only clear if we're leaving the column entirely (not entering a child element)
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement

  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }

  if (dragOverColumnField.value === column.field) {
    dragOverColumnField.value = null
    dragDropPosition.value = null
  }
}

/**
 * Handle column drag end
 */
function handleColumnDragEnd(_event: DragEvent) {
  draggedColumnField.value = null
  dragOverColumnField.value = null
  dragDropPosition.value = null
}

/**
 * Handle column drop
 */
function handleColumnDrop(event: DragEvent, targetColumn: Column) {
  event.preventDefault()

  if (!draggedColumnField.value || draggedColumnField.value === targetColumn.field) {
    draggedColumnField.value = null
    dragOverColumnField.value = null
    dragDropPosition.value = null
    return
  }

  const draggedField = draggedColumnField.value
  const targetField = targetColumn.field
  const dropOnRight = dragDropPosition.value === 'right'

  // Find indices in current order
  const currentOrder = [...columnOrder.value]
  const draggedIndex = currentOrder.indexOf(draggedField)
  let targetIndex = currentOrder.indexOf(targetField)

  if (draggedIndex === -1 || targetIndex === -1) {
    draggedColumnField.value = null
    dragOverColumnField.value = null
    dragDropPosition.value = null
    return
  }

  // Remove dragged column first
  currentOrder.splice(draggedIndex, 1)

  // Recalculate target index after removal
  targetIndex = currentOrder.indexOf(targetField)

  // Insert at the correct position based on drop side
  const insertIndex = dropOnRight ? targetIndex + 1 : targetIndex
  currentOrder.splice(insertIndex, 0, draggedField)

  columnOrder.value = currentOrder
  draggedColumnField.value = null
  dragOverColumnField.value = null
  dragDropPosition.value = null

  // Emit the new column order
  const reorderedColumns = currentOrder
    .map((field) => props.columns.find((col) => col.field === field))
    .filter((col): col is Column => !!col)

  emit('column-reorder', reorderedColumns)
}

/**
 * Get header drag classes
 * Shows drop indicator on left or right side based on cursor position
 */
function getHeaderDragClasses(column: Column) {
  const isDragging = draggedColumnField.value === column.field
  const isDropTarget = dragOverColumnField.value === column.field && !isDragging

  return {
    'opacity-50 scale-95': isDragging,
    'transition-transform duration-150': true,
    // Show drop indicator line on left or right
    'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-main-500 before:z-40':
      isDropTarget && dragDropPosition.value === 'left',
    'after:absolute after:right-0 after:top-0 after:bottom-0 after:w-0.5 after:bg-main-500 after:z-40':
      isDropTarget && dragDropPosition.value === 'right',
  }
}

// ============================================
// Column Resize
// ============================================

/**
 * Handle column resize start
 */
function handleResizeStart(event: MouseEvent, column: Column) {
  event.preventDefault()
  event.stopPropagation()

  resizingColumn.value = column.field
  resizeStartX.value = event.clientX
  resizeStartWidth.value = getColumnWidth(column)

  // Add mouse event listeners to document
  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)

  // Add cursor style to body
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

/**
 * Handle column resize move
 */
function handleResizeMove(event: MouseEvent) {
  if (!resizingColumn.value) return

  const diff = event.clientX - resizeStartX.value
  const newWidth = Math.max(50, resizeStartWidth.value + diff) // Minimum width of 50px

  columnWidths.value[resizingColumn.value] = newWidth
}

/**
 * Handle column resize end
 */
function handleResizeEnd() {
  resizingColumn.value = null
  resizeStartX.value = 0
  resizeStartWidth.value = 0

  // Remove mouse event listeners
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)

  // Remove cursor style from body
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

/**
 * Handle page change
 */
function handlePageChange(page: number) {
  currentPage.value = page

  // Only fetch data if table manages it internally (not external data mode)
  if (!isExternalDataMode.value) {
    fetchTableData()
  }
}

/**
 * Handle page size change
 */
function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1

  // Only fetch data if table manages it internally (not external data mode)
  if (!isExternalDataMode.value) {
    fetchTableData()
  }
}

/**
 * Handle refresh
 */
function handleRefresh() {
  // In external data mode, emit refresh event for parent to handle
  // In internal mode, fetch data directly
  if (isExternalDataMode.value) {
    emit('refresh')
  } else {
    fetchTableData()
  }
}

/**
 * Apply client-side sorting to data
 */
function applySorting(data: RowData[]): RowData[] {
  if (sortModel.value.length === 0) return data

  return [...data].sort((a, b) => {
    for (const sort of sortModel.value) {
      const aVal = a[sort.field]
      const bVal = b[sort.field]

      // Handle null/undefined
      if (aVal == null && bVal == null) continue
      if (aVal == null) return sort.order === 'asc' ? 1 : -1
      if (bVal == null) return sort.order === 'asc' ? -1 : 1

      // Compare values
      let comparison = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal)
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }

      if (comparison !== 0) {
        return sort.order === 'asc' ? comparison : -comparison
      }
    }
    return 0
  })
}

/**
 * Apply client-side filtering to data
 */
function applyFiltering(data: RowData[]): RowData[] {
  const filters = Object.entries(filterModel.value)
  if (filters.length === 0) return data

  return data.filter((row) => {
    return filters.every(([field, conditions]) => {
      const conditionArray = Array.isArray(conditions) ? conditions : [conditions]
      const cellValue = row[field]

      // For AND logic, all conditions must pass; for OR, at least one
      let result = true
      for (let i = 0; i < conditionArray.length; i++) {
        const condition = conditionArray[i]
        const matches = evaluateCondition(cellValue, condition)

        if (i === 0) {
          result = matches
        } else if (condition.operator === 'OR') {
          result = result || matches
        } else {
          // AND (default)
          result = result && matches
        }
      }
      return result
    })
  })
}

/**
 * Evaluate a single filter condition
 */
function evaluateCondition(cellValue: CellValue, condition: { type: string; value: CellValue }): boolean {
  const { type, value } = condition

  // Handle empty checks
  if (type === 'isEmpty') {
    return cellValue == null || cellValue === ''
  }
  if (type === 'isNotEmpty') {
    return cellValue != null && cellValue !== ''
  }

  // Convert to string/number for comparison
  const cellStr = String(cellValue ?? '').toLowerCase()
  const filterStr = String(value ?? '').toLowerCase()
  const cellNum = typeof cellValue === 'number' ? cellValue : Number.parseFloat(String(cellValue))
  const filterNum = typeof value === 'number' ? value : Number.parseFloat(String(value))

  switch (type) {
    case 'contains':
      return cellStr.includes(filterStr)
    case 'notContains':
      return !cellStr.includes(filterStr)
    case 'equals':
      if (!Number.isNaN(cellNum) && !Number.isNaN(filterNum)) {
        return cellNum === filterNum
      }
      return cellStr === filterStr
    case 'notEquals':
      if (!Number.isNaN(cellNum) && !Number.isNaN(filterNum)) {
        return cellNum !== filterNum
      }
      return cellStr !== filterStr
    case 'startsWith':
      return cellStr.startsWith(filterStr)
    case 'endsWith':
      return cellStr.endsWith(filterStr)
    case 'greaterThan':
      return !Number.isNaN(cellNum) && !Number.isNaN(filterNum) && cellNum > filterNum
    case 'lessThan':
      return !Number.isNaN(cellNum) && !Number.isNaN(filterNum) && cellNum < filterNum
    case 'greaterThanOrEqual':
      return !Number.isNaN(cellNum) && !Number.isNaN(filterNum) && cellNum >= filterNum
    case 'lessThanOrEqual':
      return !Number.isNaN(cellNum) && !Number.isNaN(filterNum) && cellNum <= filterNum
    default:
      return true
  }
}

/**
 * Fetch table data
 */
async function fetchTableData() {
  // Use static data if provided
  if (props.data) {
    // Apply client-side filtering and sorting
    let processedData = [...props.data]
    processedData = applyFiltering(processedData)
    processedData = applySorting(processedData)

    // Apply client-side pagination
    totalRows.value = processedData.length
    const startRow = (currentPage.value - 1) * pageSize.value
    const endRow = startRow + pageSize.value
    rows.value = processedData.slice(startRow, endRow)

    emit('data-loaded', rows.value)
    return
  }

  // Use fetch function for server-side data
  if (!props.fetchData) {
    console.warn('AxisTable: No fetchData function or data prop provided')
    return
  }

  loading.value = true
  error.value = null

  try {
    const startRow = (currentPage.value - 1) * pageSize.value
    const endRow = startRow + pageSize.value

    const params: GridParams = {
      startRow,
      endRow,
      sortModel: sortModel.value,
      filterModel: filterModel.value,
    }

    const response = await props.fetchData(params)
    rows.value = response.rows
    totalRows.value = response.totalCount

    emit('data-loaded', response.rows)
  } catch (err) {
    error.value = err as Error
    emit('data-error', err as Error)
  } finally {
    loading.value = false
  }
}

// ============================================
// State Persistence
// ============================================

/**
 * Apply initial state from persistence
 */
function applyInitialState(state: PersistedTableState) {
  if (state.columnOrder && state.columnOrder.length > 0) {
    columnOrder.value = state.columnOrder
  }
  if (state.columnWidths && Object.keys(state.columnWidths).length > 0) {
    columnWidths.value = state.columnWidths
  }
  if (state.columnState && Object.keys(state.columnState).length > 0) {
    columnState.value = state.columnState
  }
  if (state.sortModel && state.sortModel.length > 0) {
    sortModel.value = state.sortModel
  }
  if (state.filterModel && Object.keys(state.filterModel).length > 0) {
    filterModel.value = state.filterModel
  }
}

/**
 * Get current state for persistence
 */
function getCurrentState(): PersistedTableState {
  return {
    version: 1,
    columnOrder: columnOrder.value,
    columnWidths: columnWidths.value,
    columnState: columnState.value,
    sortModel: sortModel.value,
    filterModel: filterModel.value,
  }
}

/**
 * Track if initial state has been applied to avoid re-applying
 */
const initialStateApplied = ref(false)

/**
 * Track if we're ready to emit state changes.
 * This is true after:
 * 1. State loading is complete (!stateLoading)
 * 2. Initial state has been applied (or there was none to apply)
 */
const readyToEmitChanges = ref(false)

/**
 * Watch for initialState prop changes (e.g., after API load)
 */
watch(
  () => props.initialState,
  (newState) => {
    if (newState && !initialStateApplied.value) {
      applyInitialState(newState)
      initialStateApplied.value = true
      // Re-fetch data with applied sorting/filtering
      fetchTableData()
    }
  },
  { immediate: true }
)

/**
 * Watch for stateLoading to become false - then we're ready to emit changes
 */
watch(
  () => props.stateLoading,
  (isLoading) => {
    if (!isLoading && !readyToEmitChanges.value) {
      // State finished loading
      // If there was initial state, it should have been applied by now
      // If not, we're ready to start tracking changes
      if (!props.initialState) {
        initialStateApplied.value = true
      }
      readyToEmitChanges.value = true
    }
  },
  { immediate: true }
)

/**
 * Emit state changes when relevant state changes
 * Only emits after state has finished loading to prevent overwriting
 */
watch(
  [columnOrder, columnWidths, columnState, sortModel, filterModel],
  () => {
    if (props.persistState && readyToEmitChanges.value && initialStateApplied.value) {
      emit('state-change', getCurrentState())
    }
  },
  { deep: true }
)

// ============================================
// Lifecycle
// ============================================

/**
 * Auto-size columns to fill available container width on initial load.
 * Only runs once when:
 * - No persisted column widths exist
 * - Container width is available
 * - Columns are defined
 *
 * Distributes extra space proportionally based on each column's base width.
 * Uses getColumnWidth to ensure minimum header width is respected.
 */
function autoSizeColumnsToFill() {
  // Skip if already done or no container
  if (hasAutoSizedColumns.value || !tableContainerRef.value) return

  // Skip if there are persisted column widths (user has customized)
  if (Object.keys(columnWidths.value).length > 0) {
    hasAutoSizedColumns.value = true
    return
  }

  // Skip if no columns
  if (visibleColumns.value.length === 0) return

  const containerWidth = tableContainerRef.value.clientWidth
  if (containerWidth <= 0) return

  // Calculate current total width using consistent width calculation
  let totalColumnWidth = 0
  const columnBaseWidths: Record<string, number> = {}

  // Add selection column width if enabled (48px)
  if (props.enableSelection) {
    totalColumnWidth += 48
  }

  // Calculate base width for each column (respects header minimum width)
  for (const column of visibleColumns.value) {
    const headerMinWidth = calculateHeaderWidth(column)
    const baseWidth = Math.max(column.width ?? headerMinWidth, headerMinWidth)
    columnBaseWidths[column.field] = baseWidth
    totalColumnWidth += baseWidth
  }

  // If table is narrower than container, distribute extra space
  if (totalColumnWidth < containerWidth) {
    const extraSpace = containerWidth - totalColumnWidth - 2 // -2 for border
    const totalBaseWidth = Object.values(columnBaseWidths).reduce((a, b) => a + b, 0)

    // Distribute extra space proportionally
    for (const column of visibleColumns.value) {
      const baseWidth = columnBaseWidths[column.field]
      const proportion = baseWidth / totalBaseWidth
      const extraForColumn = Math.floor(extraSpace * proportion)
      columnWidths.value[column.field] = baseWidth + extraForColumn
    }
  }

  hasAutoSizedColumns.value = true
}

onMounted(() => {
  // If persist state is disabled or state isn't loading,
  // mark as ready to emit immediately
  if (!props.persistState || !props.stateLoading) {
    if (!props.initialState) {
      initialStateApplied.value = true
    }
    readyToEmitChanges.value = true
  }
  fetchTableData()

  // Auto-size columns after a brief delay to ensure container is rendered
  nextTick(() => {
    autoSizeColumnsToFill()
    // Measure scrollbar width after layout is complete
    measureScrollbarWidth()
  })
})

onUnmounted(() => {
  // Clean up resize event listeners if still active
  if (resizingColumn.value) {
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
})

// Watch for prop changes
watch(() => props.data, () => {
  console.log('[AxisTable] props.data watcher triggered, data length:', props.data?.length || 0)
  if (props.data) {
    // Log first item to verify data content
    if (props.data.length > 0) {
      const firstItem = props.data[0] as Record<string, unknown>
      console.log('[AxisTable] First item address:', firstItem.address)
    }
    rows.value = props.data
    totalRows.value = props.data.length
  }
}, { immediate: true })

// Watch for rows changes to re-measure scrollbar width
// (vertical scrollbar may appear/disappear based on content height)
watch(
  () => rows.value.length,
  () => {
    nextTick(() => {
      measureScrollbarWidth()
    })
  }
)

// Watch for initialSelection changes and apply them
watch(
  () => props.initialSelection,
  (newSelection) => {
    if (newSelection && newSelection.length > 0) {
      selectedKeys.value = new Set(newSelection)
    }
  },
  { immediate: true }
)

// ============================================
// Exposed API for External Components
// ============================================
// These methods allow external components (like Columns Config modal)
// to safely interact with the table's state without breaking persistence.

/**
 * Get the current column order (for reading by external components)
 */
function getColumnOrder(): string[] {
  return [...columnOrder.value]
}

/**
 * Set the column order (for external components like Columns Config modal)
 * This goes through the proper persistence flow.
 */
function setColumnOrder(order: string[]) {
  columnOrder.value = [...order]
  // The watcher will automatically persist this change
}

/**
 * Get the current column pin state (field -> pin side)
 */
function getColumnPinState(): Record<string, ColumnPinSide> {
  const result: Record<string, ColumnPinSide> = {}
  for (const [field, state] of Object.entries(columnState.value)) {
    if (state.pinned) {
      result[field] = state.pinned
    }
  }
  return result
}

/**
 * Update pin state for a column (for external components)
 */
function updateColumnPin(field: string, side: ColumnPinSide) {
  if (side) {
    columnState.value = {
      ...columnState.value,
      [field]: { ...columnState.value[field], pinned: side }
    }
  } else {
    // Unpin - remove from state
    const newState = { ...columnState.value }
    if (newState[field]) {
      // Use object rest to remove pinned property
      const { pinned: _removed, ...rest } = newState[field]
      if (Object.keys(rest).length === 0) {
        // Use object rest to remove the field entirely
        const { [field]: _removedField, ...remaining } = newState
        columnState.value = remaining
      } else {
        newState[field] = rest
        columnState.value = newState
      }
    }
  }
  // The watcher will automatically persist this change
}

/**
 * Get current column widths
 */
function getColumnWidths(): Record<string, number> {
  return { ...columnWidths.value }
}

/**
 * Refresh table data (for external components to trigger refetch)
 * Useful when external filters change and the table needs to reload
 */
function refreshData() {
  currentPage.value = 1 // Reset to first page
  fetchTableData()
}

// Expose methods and readonly state for external components
defineExpose({
  // Read-only getters
  getColumnOrder,
  getColumnPinState,
  getColumnWidths,
  getCurrentState,

  // Write methods (go through proper persistence flow)
  setColumnOrder,
  updateColumnPin,
  setSelection,
  clearSelection,

  // Data refresh method
  refreshData,

  // Computed columns (for reading current display state)
  visibleColumns,
})
</script>
