/**
 * AxisTable Type Definitions
 *
 * Type system for the Axis table component.
 */

import type { ReactNode } from 'react';

export type ColumnType = 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean';
export type ColumnAlign = 'left' | 'center';
export type SortOrder = 'asc' | 'desc' | null;

export interface Column {
  /** Unique field identifier */
  field: string;
  /** Column header label */
  header: string;
  /** Column data type (determines formatting) */
  type?: ColumnType;
  /** Text alignment (auto-determined if not specified) */
  align?: ColumnAlign;
  /** Column width in pixels or CSS string (e.g. '33%') */
  width?: number | string;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Hide column */
  hidden?: boolean;
  /** Tooltip shown on hover over the column header */
  headerTooltip?: string;
  /** Custom cell renderer — when provided, overrides default formatting */
  render?: (value: CellValue, row: RowData) => ReactNode;
}

export interface SortModel {
  field: string;
  order: 'asc' | 'desc';
}

export type RowData = Record<string, unknown>;
export type CellValue = string | number | boolean | null | undefined;
