/**
 * AxisTable Component Types
 *
 * Type definitions for the AxisTable component system
 */

import type { Component } from 'vue'

/**
 * Column type - defines data type for formatting
 *
 * Types:
 * - text: Plain text (default)
 * - number: Formatted number with compact notation
 * - currency: Dollar amounts with $ prefix and compact notation
 * - percentage: Percentage with % suffix
 * - date: Date with localized short format
 * - boolean: Yes/No tag
 * - composite: Number + secondary value (percentage, change, multiplier)
 * - range: Editable from/to numeric range (used in buybox configurator)
 */
export type ColumnType = 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean' | 'composite' | 'range'

/**
 * Secondary value configuration for composite columns
 */
export interface SecondaryValueConfig {
  /** Field to get secondary value from */
  field: string
  /** Type of secondary display */
  type: 'percentage' | 'change' | 'multiplier'
  /** Prefix text (default: '(') */
  prefix?: string
  /** Suffix text (default: ')') */
  suffix?: string
}

/**
 * Composite column format configuration
 */
export interface CompositeColumnFormat {
  /** Primary value type */
  primary: 'number' | 'currency' | 'percentage'
  /** Secondary value configuration */
  secondary?: SecondaryValueConfig
}

/**
 * Range column format configuration
 * Used for editable from/to numeric ranges (e.g., $0.00 to $1,000.00)
 */
export interface RangeColumnFormat {
  /** Unit type for formatting (dollars, years, sqft, acres) */
  unitType: 'dollars' | 'years' | 'sqft' | 'acres'
  /** Field name for minimum value */
  minField: string
  /** Field name for maximum value */
  maxField: string
  /** Whether this row shows the "Unknown" label instead of inputs */
  isUnknownField?: string
}

/**
 * Column alignment
 */
export type ColumnAlign = 'left' | 'center' | 'right'

/**
 * Column pinning side
 */
export type ColumnPinSide = 'left' | 'right' | null

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc' | null

/**
 * Filter operator types
 */
export type FilterOperator =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty'

/**
 * Column definition interface
 */
export interface Column {
  /** Unique field key (must match data field) */
  field: string

  /** Display header text */
  header: string

  /** Tooltip text for column header (optional) */
  tooltip?: string

  /** Data type for formatting (default: 'text') */
  type?: ColumnType

  /** Format configuration for composite columns */
  format?: CompositeColumnFormat

  /** Format configuration for range columns */
  rangeFormat?: RangeColumnFormat

  /** Column width in pixels (optional, auto-size if not set) */
  width?: number

  /** Minimum width in pixels (default: 50) */
  minWidth?: number

  /** Maximum width in pixels (optional) */
  maxWidth?: number

  /** Pin column to left or right (optional) */
  pinned?: ColumnPinSide

  /** Allow sorting (default: true) */
  sortable?: boolean

  /** Allow filtering (default: true) */
  filterable?: boolean

  /** Allow resizing (default: true) */
  resizable?: boolean

  /** Initially hidden (default: false) */
  hidden?: boolean

  /** Text alignment (default: 'left', numbers default to 'right') */
  align?: ColumnAlign

  /** Custom icon component (Heroicon) */
  icon?: Component

  /** Totals aggregation mode for this column */
  totals?: 'sum' | 'avg' | 'count' | 'none'

  /** Header group for visual styling (colored backgrounds) */
  headerGroup?: 'market' | 'client'
}

/**
 * Totals row configuration
 */
export interface TotalsConfig {
  /** Label for the totals row (first column) */
  label?: string
  /** Manual values for totals (overrides auto-calculation) */
  values?: Record<string, number | string | null>
}

/**
 * Filter value type - values used in filter conditions
 * Covers string searches and numeric comparisons
 * Note: boolean is not included since boolean columns use checkboxes, not text inputs
 * Note: null is not included since filter inputs use empty string for empty state
 */
export type FilterValue = string | number

/**
 * Single filter condition
 */
export interface FilterCondition {
  /** Filter operator */
  type: FilterOperator

  /** Filter value */
  value: FilterValue

  /** Condition join (AND/OR) for multiple conditions */
  operator?: 'AND' | 'OR'
}

/**
 * Filter model - maps field to filter conditions
 */
export interface FilterModel {
  [field: string]: FilterCondition | FilterCondition[]
}

/**
 * Sort model - single column sort
 */
export interface SortModel {
  /** Field to sort by */
  field: string

  /** Sort order */
  order: 'asc' | 'desc'
}

/**
 * Server-side grid params for data fetching
 */
export interface GridParams {
  /** Start row index (0-based) */
  startRow: number

  /** End row index (exclusive) */
  endRow: number

  /** Sort configuration (optional) */
  sortModel?: SortModel[]

  /** Filter configuration (optional) */
  filterModel?: FilterModel
}

/**
 * Cell value type - base type for displayable cell values
 * These are the primitive types that cells can render
 */
export type CellValue = string | number | boolean | null | undefined

/**
 * Row data type - generic constraint for table rows
 * Uses Record<string, unknown> as the base constraint, allowing any object shape.
 * This is intentionally permissive to support various data sources (Property, User, etc.)
 *
 * Note: Using `any` here is intentional - strict typing for row data is impractical
 * since tables display diverse data types. Type safety is enforced at the column
 * definition level (Column.type) and in individual cell renderers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RowData = Record<string, any>

/**
 * Server response for grid data
 */
export interface GridResponse<T = RowData> {
  /** Data rows */
  rows: T[]

  /** Total row count (for pagination) */
  totalCount: number
}

/**
 * Column state (for saved views and localStorage persistence)
 */
export interface ColumnState {
  /** Column order (array of field names) */
  order: string[]

  /** Column widths (field -> width in pixels) */
  widths: Record<string, number>

  /** Column visibility (field -> visible) */
  visibility: Record<string, boolean>

  /** Column pinning (field -> pin side) */
  pinning: Record<string, ColumnPinSide>
}

/**
 * Saved view configuration
 */
export interface TableView {
  /** Unique view ID */
  id: string

  /** View name */
  name: string

  /** Filter configuration */
  filterModel: FilterModel

  /** Sort configuration */
  sortModel: SortModel[]

  /** Column state */
  columnState: ColumnState

  /** Is this the default view? */
  isDefault?: boolean
}

/**
 * Selection state
 */
export interface SelectionState<T = RowData> {
  /** Selected row keys */
  selectedKeys: Set<string | number>

  /** Selected row data */
  selectedRows: T[]
}

/**
 * Table state (internal)
 */
export interface TableState {
  /** Current page (1-based) */
  currentPage: number

  /** Rows per page */
  pageSize: number

  /** Total rows */
  totalRows: number

  /** Current sort */
  sortModel: SortModel[]

  /** Current filter */
  filterModel: FilterModel

  /** Loading state */
  loading: boolean

  /** Error state */
  error: Error | null
}

/**
 * Cell renderer slot props
 */
export interface CellSlotProps<T = RowData> {
  /** Cell value */
  value: CellValue

  /** Row data */
  row: T

  /** Column definition */
  column: Column

  /** Row index */
  rowIndex: number

  /** Column index */
  columnIndex: number
}

/**
 * Header slot props
 */
export interface HeaderSlotProps {
  /** Column definition */
  column: Column

  /** Column index */
  columnIndex: number

  /** Current sort for this column */
  sort: SortOrder
}
