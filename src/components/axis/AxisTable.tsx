/**
 * AxisTable Component (React/Next.js version)
 *
 * A production-ready data table following Axis design system specifications.
 * Simplified from the Vue version to include core essential features.
 *
 * FEATURES:
 * - Sortable columns (click header to sort)
 * - Row selection with checkboxes
 * - Pagination with rows-per-page selector
 * - Auto-formatting (currency, percentage, number, date, boolean)
 * - Loading, empty, and error states
 * - Fixed header with scrollable body
 * - Dark mode support
 * - Responsive design
 *
 * USAGE:
 * <AxisTable
 *   columns={columns}
 *   data={data}
 *   loading={loading}
 *   sortable
 *   selectable
 *   paginated
 * />
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AxisButton } from './AxisButton';
import { AxisSelect, AxisSelectOption } from './AxisSelect';
import { AxisCallout } from './AxisCallout';
import type { Column, RowData, SortModel, CellValue } from '@/types/table';

export interface AxisTableProps {
  /** Column definitions */
  columns: Column[];
  /** Table data */
  data: RowData[];
  /** Unique row key field (default: 'id') */
  rowKey?: string;
  /** Table title */
  title?: string;
  /** Row label for pagination (default: 'rows') */
  rowLabel?: string;
  /** Enable sortable columns */
  sortable?: boolean;
  /** Enable row selection checkboxes */
  selectable?: boolean;
  /** Enable pagination */
  paginated?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Empty state message */
  emptyMessage?: string;
  /** Default page size */
  defaultPageSize?: number;
  /** Callback when rows are selected */
  onSelectionChange?: (selectedRows: RowData[]) => void;
  /** Callback when sort changes */
  onSortChange?: (sort: SortModel | null) => void;
  /** Callback when row is clicked */
  onRowClick?: (row: RowData) => void;
}

// Page size options for pagination
const PAGE_SIZE_OPTIONS: AxisSelectOption[] = [
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 250, label: '250' },
];

export function AxisTable({
  columns,
  data,
  rowKey = 'id',
  title,
  rowLabel = 'rows',
  sortable = false,
  selectable = false,
  paginated = true,
  loading = false,
  error = null,
  emptyMessage = 'No data found',
  defaultPageSize = 50,
  onSelectionChange,
  onSortChange,
  onRowClick,
}: AxisTableProps) {
  // State
  const [sortModel, setSortModel] = useState<SortModel | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Get visible columns (filter out hidden columns)
  const visibleColumns = useMemo(
    () => columns.filter((col) => !col.hidden),
    [columns]
  );

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortModel) return data;

    const { field, order } = sortModel;
    return [...data].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return order === 'asc' ? 1 : -1;
      if (bVal == null) return order === 'asc' ? -1 : 1;

      // Compare values
      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }, [data, sortModel]);

  // Apply pagination
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;

    const startRow = (currentPage - 1) * pageSize;
    const endRow = startRow + pageSize;
    return sortedData.slice(startRow, endRow);
  }, [sortedData, paginated, currentPage, pageSize]);

  // Calculate pagination info
  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, totalRows);

  // Get row key
  const getRowKey = (row: RowData): string | number => {
    const key = row[rowKey];
    return typeof key === 'string' || typeof key === 'number' ? key : String(key);
  };

  // Selection handlers
  const isRowSelected = (row: RowData) => selectedKeys.has(getRowKey(row));

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(isRowSelected);
  const isSomeSelected = paginatedData.length > 0 && paginatedData.some(isRowSelected);

  const toggleRowSelection = (row: RowData) => {
    const key = getRowKey(row);
    const newSelection = new Set(selectedKeys);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setSelectedKeys(newSelection);

    if (onSelectionChange) {
      const selectedRows = data.filter((r) => newSelection.has(getRowKey(r)));
      onSelectionChange(selectedRows);
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all on current page
      const newSelection = new Set(selectedKeys);
      paginatedData.forEach((row) => newSelection.delete(getRowKey(row)));
      setSelectedKeys(newSelection);

      if (onSelectionChange) {
        const selectedRows = data.filter((r) => newSelection.has(getRowKey(r)));
        onSelectionChange(selectedRows);
      }
    } else {
      // Select all on current page
      const newSelection = new Set(selectedKeys);
      paginatedData.forEach((row) => newSelection.add(getRowKey(row)));
      setSelectedKeys(newSelection);

      if (onSelectionChange) {
        const selectedRows = data.filter((r) => newSelection.has(getRowKey(r)));
        onSelectionChange(selectedRows);
      }
    }
  };

  // Sort handler
  const handleSort = (column: Column) => {
    if (!sortable || column.sortable === false) return;

    let newSort: SortModel | null = null;

    if (!sortModel || sortModel.field !== column.field) {
      // Start with ascending
      newSort = { field: column.field, order: 'asc' };
    } else if (sortModel.order === 'asc') {
      // Change to descending
      newSort = { field: column.field, order: 'desc' };
    } else {
      // Remove sort
      newSort = null;
    }

    setSortModel(newSort);
    if (onSortChange) {
      onSortChange(newSort);
    }
  };

  // Get sort indicator for column
  const getSortIndicator = (column: Column) => {
    if (!sortModel || sortModel.field !== column.field) return null;
    return sortModel.order;
  };

  // Get column alignment (text left, numbers center)
  const getColumnAlign = (column: Column): 'left' | 'center' => {
    if (column.align) return column.align;
    if (column.type === 'number' || column.type === 'currency' ||
        column.type === 'percentage' || column.type === 'date' ||
        column.type === 'boolean') {
      return 'center';
    }
    return 'left';
  };

  // Format cell value based on column type
  const formatCellValue = (value: CellValue, column: Column): string => {
    if (value === null || value === undefined) return '—';

    switch (column.type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value);
      case 'date':
        return formatDate(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };

  // Reset to page 1 when data or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortModel]);

  // Loading skeleton
  if (loading && data.length === 0) {
    return (
      <div className="border border-stroke rounded-lg bg-surface-base overflow-hidden">
        {/* Skeleton header */}
        <div className="flex items-center bg-surface-raised border-b border-stroke">
          {selectable && (
            <div className="w-12 px-3 py-2.5 border-r border-stroke">
              <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            </div>
          )}
          {visibleColumns.slice(0, 6).map((col, idx) => (
            <div
              key={col.field}
              className="flex-1 px-3 py-2.5 border-r border-stroke last:border-r-0"
              style={{ minWidth: '100px' }}
            >
              <div
                className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"
                style={{ width: `${60 + (idx % 3) * 15}%` }}
              />
            </div>
          ))}
        </div>

        {/* Skeleton body rows */}
        <div>
          {Array.from({ length: 10 }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex items-center border-b border-stroke-subtle">
              {selectable && (
                <div className="w-12 px-3 py-2.5 border-r border-stroke-subtle">
                  <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                </div>
              )}
              {visibleColumns.slice(0, 6).map((col, colIdx) => (
                <div
                  key={col.field}
                  className="flex-1 px-3 py-2.5 h-11 border-r border-stroke-subtle last:border-r-0"
                  style={{ minWidth: '100px' }}
                >
                  <div
                    className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"
                    style={{ width: `${40 + ((rowIdx + colIdx) % 5) * 12}%` }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="border border-stroke rounded-lg bg-surface-base p-8">
        <AxisCallout type="error" title="Failed to load data">
          {error}
        </AxisCallout>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="border border-stroke rounded-lg bg-surface-base p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center">
            <svg className="w-8 h-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <div>
            <p className="text-h5 text-content-primary mb-1">No data found</p>
            <p className="text-body-regular text-content-secondary">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Main table render
  return (
    <div className="border border-stroke rounded-lg bg-surface-base overflow-hidden flex flex-col">
      {/* Header */}
      {title && (
        <div className="px-4 py-3 border-b border-stroke bg-surface-raised">
          <h3 className="text-h4 text-content-primary font-semibold">{title}</h3>
        </div>
      )}

      {/* Table container with fixed header */}
      <div className="overflow-auto flex-1">
        <table className="w-full" style={{ tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr>
              {/* Selection column */}
              {selectable && (
                <th className="w-12 px-3 py-2.5 text-left bg-surface-raised border-b border-r border-stroke">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeSelected && !isAllSelected;
                      }
                    }}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-stroke checked:bg-main-700 checked:border-main-700 focus:ring-2 focus:ring-main-500 focus:ring-offset-2"
                    aria-label="Select all rows"
                  />
                </th>
              )}

              {/* Data columns */}
              {visibleColumns.map((column) => {
                const align = getColumnAlign(column);
                const sortOrder = getSortIndicator(column);
                const isSortable = sortable && column.sortable !== false;

                return (
                  <th
                    key={column.field}
                    className={`px-3 py-2.5 bg-surface-raised border-b border-r border-stroke last:border-r-0 ${
                      align === 'center' ? 'text-center' : 'text-left'
                    }`}
                    style={{ width: column.width, minWidth: column.minWidth, maxWidth: column.maxWidth }}
                  >
                    {isSortable ? (
                      <button
                        className="flex items-center gap-1 hover:text-content-primary transition-colors w-full"
                        onClick={() => handleSort(column)}
                      >
                        <span className="text-body-regular font-semibold text-content-primary">
                          {column.header}
                        </span>
                        <div className="w-4 h-4 flex items-center justify-center">
                          {sortOrder === 'asc' && (
                            <svg className="w-4 h-4 text-main-600 dark:text-main-400" fill="none" viewBox="0 0 20 20">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l5-5 5 5" />
                            </svg>
                          )}
                          {sortOrder === 'desc' && (
                            <svg className="w-4 h-4 text-main-600 dark:text-main-400" fill="none" viewBox="0 0 20 20">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l-5 5-5-5" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ) : (
                      <span className="text-body-regular font-semibold text-content-primary">
                        {column.header}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {paginatedData.map((row) => {
              const isSelected = isRowSelected(row);

              return (
                <tr
                  key={getRowKey(row)}
                  className={`transition-colors duration-200 hover:bg-surface-raised cursor-pointer ${
                    isSelected ? 'bg-main-50 dark:bg-main-950/30' : 'bg-surface-base'
                  }`}
                  onClick={(e) => {
                    // Don't trigger row click if clicking on checkbox or button
                    if ((e.target as HTMLElement).closest('input, button')) return;
                    if (onRowClick) onRowClick(row);
                  }}
                >
                  {/* Selection cell */}
                  {selectable && (
                    <td
                      className={`px-3 py-2.5 border-b border-r border-stroke-subtle ${
                        isSelected ? 'bg-main-50 dark:bg-main-950/30' : 'bg-surface-base'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleRowSelection(row);
                        }}
                        className="w-5 h-5 rounded border-stroke checked:bg-main-700 checked:border-main-700 focus:ring-2 focus:ring-main-500"
                        aria-label={`Select row`}
                      />
                    </td>
                  )}

                  {/* Data cells */}
                  {visibleColumns.map((column) => {
                    const align = getColumnAlign(column);
                    const value = row[column.field] as CellValue;

                    return (
                      <td
                        key={column.field}
                        className={`px-3 py-2.5 h-11 border-b border-r border-stroke-subtle last:border-r-0 overflow-hidden ${
                          align === 'center' ? 'text-center' : 'text-left'
                        } ${isSelected ? 'bg-main-50 dark:bg-main-950/30' : 'bg-surface-base'}`}
                      >
                        <div className="text-body-regular text-content-primary truncate" title={formatCellValue(value, column)}>
                          {formatCellValue(value, column)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalRows > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-stroke bg-surface-base">
          {/* Left: Row count */}
          <div className="text-body-regular text-content-secondary">
            <span className="font-medium">{startRow}</span>
            {' - '}
            <span className="font-medium">{endRow}</span>
            {' of '}
            <span className="font-medium">{totalRows.toLocaleString()}</span>
            {' '}
            {rowLabel}
          </div>

          {/* Right: Page controls */}
          <div className="flex items-center gap-2">
            {/* Previous button */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-2 py-1 rounded text-content-secondary hover:bg-surface-raised disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6l-4 4 4 4" />
              </svg>
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const page = i + 1;
                const isActive = page === currentPage;

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[32px] h-8 px-2 text-body-regular font-medium rounded transition-colors ${
                      isActive
                        ? 'bg-main-700 text-white'
                        : 'text-content-secondary hover:bg-surface-raised'
                    }`}
                    aria-label={`Go to page ${page}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-2 py-1 rounded text-content-secondary hover:bg-surface-raised disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6l4 4-4 4" />
              </svg>
            </button>

            {/* Rows per page */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-stroke">
              <span className="text-body-regular text-content-secondary whitespace-nowrap">Rows per page:</span>
              <AxisSelect
                value={pageSize}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
                options={PAGE_SIZE_OPTIONS}
                size="sm"
                fullWidth={false}
                className="w-20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility formatting functions
function formatNumber(value: CellValue): string {
  const num = toNumber(value);
  if (num === null) return '—';

  // Format with compact notation for large numbers
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

function formatCurrency(value: CellValue): string {
  const num = toNumber(value);
  if (num === null) return '—';

  // Format with compact notation for large numbers
  if (Math.abs(num) >= 1000000) {
    return '$' + (num / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return '$' + (num / 1000).toFixed(1) + 'K';
  }
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatPercentage(value: CellValue): string {
  const num = toNumber(value);
  if (num === null) return '—';

  // If value is between -1 and 1, assume it's a decimal (0.25 = 25%)
  const displayValue = Math.abs(num) < 1 && num !== 0 ? num * 100 : num;
  return displayValue.toFixed(1) + '%';
}

function formatDate(value: CellValue): string {
  if (!value) return '—';

  try {
    const date = new Date(String(value));
    if (isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
}

function toNumber(value: CellValue): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}
