/**
 * AxisTable Type Definitions
 *
 * Type system for the Axis table component.
 */

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
  /** Column width in pixels */
  width?: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Hide column */
  hidden?: boolean;
}

export interface SortModel {
  field: string;
  order: 'asc' | 'desc';
}

export type RowData = Record<string, unknown>;
export type CellValue = string | number | boolean | null | undefined;
