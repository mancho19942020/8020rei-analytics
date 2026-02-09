<template>
  <div :class="cellClasses">
    <!-- Slot takes priority over automatic formatting -->
    <slot v-if="hasSlot" />

    <!-- Auto-formatted value based on column type -->
    <template v-else>
      <!-- Range type (editable from/to inputs) -->
      <AxisTableRangeCell
        v-if="column.type === 'range' && column.rangeFormat"
        :row="row"
        :range-format="column.rangeFormat"
      />

      <!-- Composite type (number + secondary value) -->
      <span v-else-if="column.type === 'composite'" class="block truncate" :title="compositeTitle">
        <span class="text-content-primary">{{ formatPrimaryValue }}</span>
        <span v-if="secondaryValue !== null" :class="secondaryColorClass" class="ml-1">
          {{ formatSecondaryValue }}
        </span>
      </span>

      <!-- Boolean type -->
      <AxisTag v-else-if="column.type === 'boolean'" :color="value ? 'success' : 'neutral'" size="sm">
        {{ value ? 'Yes' : 'No' }}
      </AxisTag>

      <!-- Percentage with coloring -->
      <span v-else-if="column.type === 'percentage'" :class="percentageClasses" class="block truncate" :title="String(formattedValue)">
        {{ formattedValue }}
      </span>

      <!-- Currency -->
      <span v-else-if="column.type === 'currency'" class="text-content-primary block truncate" :title="String(formattedValue)">
        {{ formattedValue }}
      </span>

      <!-- Number -->
      <span v-else-if="column.type === 'number'" class="text-content-primary block truncate" :title="String(formattedValue)">
        {{ formattedValue }}
      </span>

      <!-- Date -->
      <span v-else-if="column.type === 'date'" class="text-content-secondary block truncate" :title="String(formattedValue)">
        {{ formattedValue }}
      </span>

      <!-- Text (default) - truncate with ellipsis -->
      <span v-else class="text-content-primary truncate block" :title="String(formattedValue)">
        {{ formattedValue }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import {
  formatNumberCompact,
  formatCurrencyCompact,
  formatPercentage,
  formatDateShort,
} from '~/utils/formatting'
import type { Column, CellValue, RowData } from './types'
import AxisTableRangeCell from './AxisTableRangeCell.vue'

interface Props {
  value: CellValue
  column: Column
  row: RowData
}

/**
 * Coerce a cell value to a number for formatting functions
 * Returns null if the value cannot be converted to a valid number
 */
function toNumber(value: CellValue): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

/**
 * Coerce a cell value to a string for date formatting
 * Returns null if the value is not a string or Date-like
 */
function toDateString(value: CellValue): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  return null
}

const props = defineProps<Props>()
const slots = useSlots()

/**
 * Check if custom slot is provided
 */
const hasSlot = computed(() => !!slots.default)

/**
 * Get secondary value for composite columns
 */
const secondaryValue = computed(() => {
  if (props.column.type !== 'composite' || !props.column.format?.secondary) {
    return null
  }

  const secondaryConfig = props.column.format.secondary
  const value = props.row[secondaryConfig.field]

  if (value === null || value === undefined) {
    return null
  }

  return value
})

/**
 * Format primary value for composite columns using global formatting rules
 */
const formatPrimaryValue = computed(() => {
  if (props.column.type !== 'composite' || !props.column.format) {
    return ''
  }

  const primaryType = props.column.format.primary
  const value = props.value

  if (value === null || value === undefined) {
    return '—'
  }

  switch (primaryType) {
    case 'number':
      return formatNumberCompact(toNumber(value))

    case 'currency':
      return formatCurrencyCompact(toNumber(value))

    case 'percentage':
      return formatPercentage(toNumber(value))

    default:
      return String(value)
  }
})

/**
 * Format secondary value for composite columns using global formatting rules
 */
const formatSecondaryValue = computed(() => {
  if (secondaryValue.value === null || !props.column.format?.secondary) {
    return ''
  }

  const config = props.column.format.secondary
  const value = secondaryValue.value
  const prefix = config.prefix ?? '('
  const suffix = config.suffix ?? ')'

  // Convert to number for formatting - secondary values are always numeric
  const numValue = typeof value === 'number' ? value : Number.parseFloat(String(value))
  if (Number.isNaN(numValue)) return ''

  let formatted: string

  switch (config.type) {
    case 'percentage': {
      formatted = formatPercentage(numValue)
      break
    }

    case 'change': {
      // For change indicators, add +/- prefix
      const changePrefix = numValue >= 0 ? '+' : ''
      formatted = `${changePrefix}${formatPercentage(numValue)}`
      break
    }

    case 'multiplier': {
      const multPrefix = numValue >= 0 ? '+' : ''
      // Format multiplier as X.XX
      const formattedValue = numValue.toFixed(1)
      formatted = `${multPrefix}${formattedValue}X`
      break
    }

    default:
      formatted = String(value)
  }

  return `${prefix}${formatted}${suffix}`
})

/**
 * Composite title for tooltip
 */
const compositeTitle = computed(() => {
  if (props.column.type !== 'composite') return ''
  const primary = formatPrimaryValue.value
  const secondary = formatSecondaryValue.value
  return secondary ? `${primary} ${secondary}` : primary
})

/**
 * Secondary value color class
 */
const secondaryColorClass = computed(() => {
  if (secondaryValue.value === null || !props.column.format?.secondary) {
    return 'text-content-tertiary'
  }

  const rawValue = secondaryValue.value
  const numValue = typeof rawValue === 'number' ? rawValue : Number.parseFloat(String(rawValue))
  const config = props.column.format.secondary

  // For change and multiplier types, use semantic colors
  if (config.type === 'change' || config.type === 'multiplier') {
    if (!Number.isNaN(numValue) && numValue > 0) return 'text-success-600 dark:text-success-400'
    if (!Number.isNaN(numValue) && numValue < 0) return 'text-error-600 dark:text-error-400'
    return 'text-content-tertiary'
  }

  // For percentages, use neutral color
  return 'text-content-tertiary'
})

/**
 * Format value based on column type using global formatting rules
 */
const formattedValue = computed(() => {
  if (props.value === null || props.value === undefined) {
    return '—' // En dash for empty values
  }

  switch (props.column.type) {
    case 'currency':
      return formatCurrencyCompact(toNumber(props.value))

    case 'percentage':
      return formatPercentage(toNumber(props.value))

    case 'number':
      return formatNumberCompact(toNumber(props.value))

    case 'date':
      return formatDateShort(toDateString(props.value))

    case 'boolean':
      return props.value ? 'Yes' : 'No'

    default:
      return String(props.value)
  }
})

/**
 * Cell container classes - minimal since parent td handles alignment
 */
const cellClasses = computed(() => {
  return [
    'text-body-regular',
    'leading-tight',
    'overflow-hidden',
  ]
})

/**
 * Convert percentage to display value for color coding
 */
function getPercentageDisplayValue(value: CellValue): number {
  if (typeof value === 'number') {
    // If between -1 and 1 (exclusive), treat as decimal
    return Math.abs(value) < 1 && value !== 0 ? value * 100 : value
  }
  if (typeof value === 'string') {
    return Number.parseFloat(value) || 0
  }
  return 0
}

/**
 * Percentage-specific classes with color coding
 */
const percentageClasses = computed(() => {
  const numValue = getPercentageDisplayValue(props.value)

  return [
    'whitespace-nowrap',
    {
      'text-success-600 dark:text-success-400': numValue > 0,
      'text-error-600 dark:text-error-400': numValue < 0,
      'text-content-tertiary': numValue === 0,
    },
  ]
})

// Boolean type now uses AxisTag component - see template
</script>
