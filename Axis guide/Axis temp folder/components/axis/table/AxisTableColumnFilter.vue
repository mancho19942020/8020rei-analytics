<template>
  <div
    ref="filterRef"
    class="absolute left-0 top-full mt-1 z-50 min-w-[280px] p-3 bg-surface-base border border-stroke rounded-lg shadow-lg"
    @click.stop
  >
    <!-- Filter header -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-label font-semibold text-content-primary">Filter: {{ column.header }}</span>
      <AxisButton
        variant="ghost"
        size="sm"
        icon-only
        :icon-left="XMarkIcon"
        aria-label="Close filter"
        @click="emit('close')"
      />
    </div>

    <!-- Filter conditions -->
    <div class="space-y-2">
      <div
        v-for="(condition, index) in conditions"
        :key="index"
        class="space-y-2"
      >
        <!-- Condition join operator (for conditions after the first) -->
        <div v-if="index > 0" class="flex justify-center">
          <AxisSelect
            v-model="condition.operator"
            :options="joinOperatorOptions"
            size="sm"
            variant="ghost"
          />
        </div>

        <!-- Condition row -->
        <div class="flex items-center gap-2">
          <!-- Operator select -->
          <AxisSelect
            v-model="condition.type"
            :options="filterOperatorOptions"
            size="sm"
            class="flex-1"
          />

          <!-- Remove condition button (for conditions after the first) -->
          <AxisButton
            v-if="index > 0"
            variant="ghost"
            size="sm"
            icon-only
            destructive
            :icon-left="XMarkIcon"
            aria-label="Remove condition"
            @click="removeCondition(index)"
          />
        </div>

        <!-- Value input (not shown for isEmpty/isNotEmpty) -->
        <div v-if="!isEmptyOperator(condition.type)" class="flex items-center gap-2">
          <AxisInput
            v-model="condition.value"
            :type="isNumericColumn ? 'number' : 'text'"
            placeholder="Enter value"
            size="sm"
            class="flex-1"
          />
        </div>
      </div>
    </div>

    <!-- Add condition button -->
    <AxisButton
      variant="ghost"
      size="sm"
      :icon-left="PlusIcon"
      class="mt-3"
      @click="addCondition"
    >
      Add condition
    </AxisButton>

    <!-- Divider -->
    <div class="my-3 border-t border-stroke-subtle" />

    <!-- Actions -->
    <div class="flex items-center justify-end gap-2">
      <AxisButton
        variant="ghost"
        size="sm"
        :disabled="!hasActiveFilter"
        @click="handleClear"
      >
        Clear
      </AxisButton>
      <AxisButton
        size="sm"
        @click="handleApply"
      >
        Apply
      </AxisButton>
    </div>
  </div>

  <!-- Backdrop - z-30 so it's below sidebar (z-40) but catches clicks in main content -->
  <Teleport to="body">
    <div
      class="fixed inset-0 z-30"
      @click="emit('close')"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { XMarkIcon, PlusIcon } from '@heroicons/vue/20/solid'
import AxisButton from '../AxisButton.vue'
import AxisInput from '../AxisInput.vue'
import AxisSelect, { type SelectOption } from '../AxisSelect.vue'
import type { Column, FilterCondition, FilterOperator } from './types'

interface Props {
  column: Column
  currentFilter?: FilterCondition | FilterCondition[]
}

interface Emits {
  (e: 'apply', filter: FilterCondition | FilterCondition[]): void
  (e: 'clear'): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const filterRef = ref<HTMLElement | null>(null)

// Initialize conditions from current filter or with default
const conditions = ref<Array<FilterCondition & { operator?: 'AND' | 'OR' }>>([])

// Initialize conditions when component mounts
watch(
  () => props.currentFilter,
  (newFilter) => {
    if (newFilter) {
      if (Array.isArray(newFilter)) {
        conditions.value = newFilter.map((f, i) => ({
          ...f,
          operator: i > 0 ? f.operator || 'AND' : undefined,
        }))
      } else {
        conditions.value = [{ ...newFilter }]
      }
    } else {
      conditions.value = [getDefaultCondition()]
    }
  },
  { immediate: true }
)

// Computed helpers
const isTextColumn = computed(() => {
  const type = props.column.type || 'text'
  return type === 'text'
})

const isNumericColumn = computed(() => {
  const type = props.column.type || 'text'
  return type === 'number' || type === 'currency' || type === 'percentage'
})

const hasActiveFilter = computed(() => {
  return conditions.value.some((c) => {
    if (isEmptyOperator(c.type)) return true
    return c.value !== '' && c.value !== null && c.value !== undefined
  })
})

// Select options
const joinOperatorOptions: SelectOption[] = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' },
]

const filterOperatorOptions = computed<SelectOption[]>(() => {
  const options: SelectOption[] = []

  if (isTextColumn.value) {
    options.push(
      { value: 'contains', label: 'Contains' },
      { value: 'notContains', label: 'Does not contain' },
      { value: 'equals', label: 'Equals' },
      { value: 'notEquals', label: 'Does not equal' },
      { value: 'startsWith', label: 'Starts with' },
      { value: 'endsWith', label: 'Ends with' },
    )
  }

  if (isNumericColumn.value) {
    options.push(
      { value: 'equals', label: 'Equals' },
      { value: 'notEquals', label: 'Does not equal' },
      { value: 'greaterThan', label: 'Greater than' },
      { value: 'lessThan', label: 'Less than' },
      { value: 'greaterThanOrEqual', label: 'Greater or equal' },
      { value: 'lessThanOrEqual', label: 'Less or equal' },
    )
  }

  // Always add empty operators
  options.push(
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  )

  return options
})

// Methods
function getDefaultCondition(): FilterCondition {
  return {
    type: isTextColumn.value ? 'contains' : 'equals',
    value: '',
  }
}

function isEmptyOperator(operator: FilterOperator): boolean {
  return operator === 'isEmpty' || operator === 'isNotEmpty'
}

function addCondition() {
  conditions.value.push({
    ...getDefaultCondition(),
    operator: 'AND',
  })
}

function removeCondition(index: number) {
  conditions.value.splice(index, 1)
}

function handleApply() {
  // Filter out empty conditions (except isEmpty/isNotEmpty)
  const validConditions = conditions.value.filter((c) => {
    if (isEmptyOperator(c.type)) return true
    return c.value !== '' && c.value !== null && c.value !== undefined
  })

  if (validConditions.length === 0) {
    emit('clear')
    return
  }

  if (validConditions.length === 1) {
    emit('apply', validConditions[0])
  } else {
    emit('apply', validConditions)
  }
}

function handleClear() {
  emit('clear')
}

// Close on escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
