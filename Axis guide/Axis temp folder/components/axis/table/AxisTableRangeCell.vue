<script setup lang="ts">
/**
 * AxisTableRangeCell - Range Input Cell Component
 *
 * Renders an editable from/to numeric range within a table cell.
 * Used by AxisTable for columns with type='range'.
 *
 * DESIGN:
 * - Compact inline layout: "$ 0.00 to $ 0.00"
 * - "Unknown" rows show text label instead of inputs
 * - Supports various unit types (dollars, years, sqft, acres)
 *
 * USAGE:
 * Automatically rendered by AxisTable when column.type === 'range'
 */

import type { RangeColumnFormat, RowData } from './types'

interface Props {
  /** Row data containing min/max values */
  row: RowData
  /** Range format configuration */
  rangeFormat: RangeColumnFormat
  /** Whether the cell is in error state (e.g., overlap) */
  hasError?: boolean
  /** Whether the inputs are disabled */
  disabled?: boolean
}

interface Emits {
  (e: 'update:min', value: number | null): void
  (e: 'update:max', value: number | null): void
}

const props = withDefaults(defineProps<Props>(), {
  hasError: false,
  disabled: false,
})

const emit = defineEmits<Emits>()

// Get values from row data
const minValue = computed(() => {
  return props.row[props.rangeFormat.minField] as number | null
})

const maxValue = computed(() => {
  return props.row[props.rangeFormat.maxField] as number | null
})

const isUnknown = computed(() => {
  if (!props.rangeFormat.isUnknownField) return false
  return props.row[props.rangeFormat.isUnknownField] === true
})

// Format value for display
const formatValue = (value: number | null): string => {
  if (value === null) return ''

  const unitType = props.rangeFormat.unitType

  if (unitType === 'dollars') {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  if (unitType === 'acres') {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Get prefix based on unit type
const prefix = computed(() => {
  return props.rangeFormat.unitType === 'dollars' ? '$' : ''
})

// Get placeholder based on unit type
const placeholder = computed(() => {
  return props.rangeFormat.unitType === 'acres' ? '0.00' : '0'
})

// Handle min value change
const handleMinChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const cleanValue = input.value.replace(/[$,]/g, '')
  const numValue = cleanValue === '' ? null : Number.parseFloat(cleanValue)
  emit('update:min', numValue)
}

// Handle max value change
const handleMaxChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const cleanValue = input.value.replace(/[$,]/g, '')
  const numValue = cleanValue === '' ? null : Number.parseFloat(cleanValue)
  emit('update:max', numValue)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Unknown row: show text label -->
    <template v-if="isUnknown">
      <span class="text-body-regular text-content-primary font-medium px-1">Unknown</span>
    </template>

    <!-- Regular row: from/to inputs -->
    <template v-else>
      <!-- From input -->
      <div class="flex items-center min-w-0">
        <span v-if="prefix" class="text-body-regular text-content-secondary shrink-0 mr-0.5">{{ prefix }}</span>
        <input
          type="text"
          :value="formatValue(minValue)"
          inputmode="decimal"
          :placeholder="placeholder"
          :disabled="disabled"
          class="w-24 h-8 px-2 text-body-regular text-right rounded border bg-white dark:bg-neutral-800 border-stroke text-content-primary focus:outline-none focus:border-main-500 focus:ring-1 focus:ring-main-500/20 transition-colors tabular-nums disabled:bg-neutral-100 disabled:dark:bg-neutral-700 disabled:cursor-not-allowed"
          :class="{ 'border-error-500': hasError }"
          @change="handleMinChange"
        >
      </div>

      <span class="text-body-regular text-content-tertiary shrink-0 mx-1">to</span>

      <!-- To input -->
      <div class="flex items-center min-w-0">
        <span v-if="prefix" class="text-body-regular text-content-secondary shrink-0 mr-0.5">{{ prefix }}</span>
        <input
          type="text"
          :value="formatValue(maxValue)"
          inputmode="decimal"
          :placeholder="placeholder"
          :disabled="disabled"
          class="w-24 h-8 px-2 text-body-regular text-right rounded border bg-white dark:bg-neutral-800 border-stroke text-content-primary focus:outline-none focus:border-main-500 focus:ring-1 focus:ring-main-500/20 transition-colors tabular-nums disabled:bg-neutral-100 disabled:dark:bg-neutral-700 disabled:cursor-not-allowed"
          :class="{ 'border-error-500': hasError }"
          @change="handleMaxChange"
        >
      </div>
    </template>
  </div>
</template>
