<script setup lang="ts">
import { ref } from 'vue'
import type { Column, TotalsConfig } from '~/components/axis/table/types'

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Tables | Design System | 8020",
});

// ============================================
// Live Preview - Property List Example
// Matching the 8020REI Figma reference design
// ============================================

const propertyColumns: Column[] = [
  {
    field: 'fullAddress',
    header: 'Full Address',
    type: 'text',
    width: 280,
    tooltip: 'Complete property address with city, state, and zip',
  },
  {
    field: 'address',
    header: 'Address',
    type: 'text',
    width: 200,
  },
  {
    field: 'preForeclosure',
    header: 'Pre-foreclosure',
    type: 'boolean',
    width: 130,
  },
  {
    field: 'city',
    header: 'City',
    type: 'text',
    width: 140,
  },
  {
    field: 'zipCode',
    header: 'Zip Code',
    type: 'text',
    width: 100,
    align: 'center',
  },
  {
    field: 'propertyStatus',
    header: 'Property Status',
    type: 'text',
    width: 130,
  },
]

const propertyData = ref([
  {
    id: 1,
    fullAddress: '2200 E Ogden Ave, Las Vegas, NV, 89101',
    address: '2200 E Ogden Ave',
    preForeclosure: true,
    city: 'Las Vegas',
    zipCode: '89101',
    propertyStatus: 'Prospect',
  },
  {
    id: 2,
    fullAddress: '846 Canary Way, Boulder City, NV, 89005',
    address: '846 Canary Way',
    preForeclosure: true,
    city: 'Boulder City',
    zipCode: '89005',
    propertyStatus: 'Prospect',
  },
  {
    id: 3,
    fullAddress: '7358 Blanco Peak St, Las Vegas, NV, 89139',
    address: '7358 Blanco Peak St',
    preForeclosure: true,
    city: 'Las Vegas',
    zipCode: '89139',
    propertyStatus: 'Prospect',
  },
  {
    id: 4,
    fullAddress: '6205 Casa Loma Ave, Las Vegas, NV, 89156',
    address: '6205 Casa Loma Ave',
    preForeclosure: true,
    city: 'Las Vegas',
    zipCode: '89156',
    propertyStatus: 'Prospect',
  },
  {
    id: 5,
    fullAddress: '10715 Yarmouth Bay Ct, Las Vegas, NV, 89179',
    address: '10715 Yarmouth Bay Ct',
    preForeclosure: true,
    city: 'Las Vegas',
    zipCode: '89179',
    propertyStatus: 'Prospect',
  },
  {
    id: 6,
    fullAddress: '5019 Volcanic Rock Ln, Las Vegas, NV, 89122',
    address: '5019 Volcanic Rock Ln',
    preForeclosure: true,
    city: 'Las Vegas',
    zipCode: '89122',
    propertyStatus: 'Prospect',
  },
  {
    id: 7,
    fullAddress: '205 Catalini St, Las Vegas, NV, 89107',
    address: '205 Catalini St',
    preForeclosure: true,
    city: 'Las Vegas',
    zipCode: '89107',
    propertyStatus: 'Prospect',
  },
  {
    id: 8,
    fullAddress: '5312 Backwoodsman Ave, Las Vegas, NV, 89130',
    address: '5312 Backwoodsman Ave',
    preForeclosure: true,
    city: 'Las Vegas',
    zipCode: '89130',
    propertyStatus: 'Prospect',
  },
  {
    id: 9,
    fullAddress: '8740 Cave Junction Ct, Las Vegas, NV, 89131',
    address: '8740 Cave Junction Ct',
    preForeclosure: true,
    city: 'Las Vegas',
    zipCode: '89131',
    propertyStatus: '-',
  },
  {
    id: 10,
    fullAddress: '9140 Rich Tapestry Ct, Las Vegas, NV, 89149',
    address: '9140 Rich Tapestry Ct',
    preForeclosure: true,
    city: 'Las Vegas',
    zipCode: '89149',
    propertyStatus: 'Prospect',
  },
  {
    id: 11,
    fullAddress: '4655 Gracemont Ave, Las Vegas, NV, 89139',
    address: '4655 Gracemont Ave',
    preForeclosure: true,
    city: 'Las Vegas',
    zipCode: '89139',
    propertyStatus: 'Prospect',
  },
  {
    id: 12,
    fullAddress: '6309 Parsifal Pl, Las Vegas, NV, 89107',
    address: '6309 Parsifal Pl',
    preForeclosure: true,
    city: 'Las Vegas',
    zipCode: '89107',
    propertyStatus: 'Dead Lead',
  },
])

// ============================================
// Value & Equity Table Example
// ============================================

const valueColumns: Column[] = [
  {
    field: 'fullAddress',
    header: 'Full Address',
    type: 'text',
    width: 280,
  },
  {
    field: 'value',
    header: 'Value',
    type: 'currency',
    width: 100,
    totals: 'sum',
  },
  {
    field: 'equity',
    header: 'Equity',
    type: 'percentage',
    width: 80,
    totals: 'avg',
  },
  {
    field: 'likelyDealScore',
    header: 'Likely Deal Score',
    type: 'text',
    width: 140,
    align: 'center',
  },
  {
    field: 'lastSaleDate',
    header: 'Last Sale Date',
    type: 'date',
    width: 130,
  },
  {
    field: 'lastSalePrice',
    header: 'Last Sale Price',
    type: 'currency',
    width: 130,
    totals: 'sum',
  },
]

const valueData = ref([
  {
    id: 1,
    fullAddress: '426 S Sans Souci Ave, Deland, FL, 32720',
    value: 980000,
    equity: 0.31,
    likelyDealScore: '89/100',
    lastSaleDate: '2023-08-15',
    lastSalePrice: 1000000,
  },
  {
    id: 2,
    fullAddress: '1847 Oakbrook Dr, Longwood, FL, 32779',
    value: 750000,
    equity: 0.45,
    likelyDealScore: '76/100',
    lastSaleDate: '2022-03-22',
    lastSalePrice: 680000,
  },
  {
    id: 3,
    fullAddress: '3921 Pine Valley Loop, Orlando, FL, 32808',
    value: 425000,
    equity: 0.22,
    likelyDealScore: '92/100',
    lastSaleDate: '2021-11-05',
    lastSalePrice: 350000,
  },
  {
    id: 4,
    fullAddress: '892 Magnolia Blvd, Kissimmee, FL, 34741',
    value: 560000,
    equity: -0.08,
    likelyDealScore: '45/100',
    lastSaleDate: '2024-01-18',
    lastSalePrice: 595000,
  },
  {
    id: 5,
    fullAddress: '2156 Cypress Creek Rd, Winter Park, FL, 32792',
    value: 1250000,
    equity: 0.67,
    likelyDealScore: '81/100',
    lastSaleDate: '2019-06-30',
    lastSalePrice: 890000,
  },
  {
    id: 6,
    fullAddress: '4478 Lake Shore Dr, Sanford, FL, 32771',
    value: 380000,
    equity: 0.15,
    likelyDealScore: '88/100',
    lastSaleDate: '2023-04-12',
    lastSalePrice: 340000,
  },
  {
    id: 7,
    fullAddress: '7623 Palm Harbor Way, Tampa, FL, 33615',
    value: 695000,
    equity: 0.38,
    likelyDealScore: '72/100',
    lastSaleDate: '2022-09-08',
    lastSalePrice: 550000,
  },
  {
    id: 8,
    fullAddress: '1089 Sunset Ridge Ln, Clearwater, FL, 33756',
    value: 820000,
    equity: 0.52,
    likelyDealScore: '85/100',
    lastSaleDate: '2020-12-15',
    lastSalePrice: 625000,
  },
])

const valueTotalsConfig: TotalsConfig = {
  label: 'Total',
}

// ============================================
// Composite columns example (Buybox-style)
// ============================================

const buyboxColumns: Column[] = [
  {
    field: 'zipCode',
    header: 'Zip Code',
    type: 'text',
    width: 100,
  },
  {
    field: 'properties',
    header: 'Properties',
    type: 'composite',
    width: 140,
    format: {
      primary: 'number',
      secondary: {
        field: 'propertiesPercent',
        type: 'percentage',
        prefix: '(',
        suffix: ')',
      },
    },
    totals: 'sum',
  },
  {
    field: 'avgValue',
    header: 'Avg Value',
    type: 'composite',
    width: 160,
    format: {
      primary: 'currency',
      secondary: {
        field: 'valueChange',
        type: 'change',
        prefix: '(',
        suffix: ')',
      },
    },
  },
  {
    field: 'roiMultiplier',
    header: 'ROI Multiplier',
    type: 'composite',
    width: 140,
    format: {
      primary: 'number',
      secondary: {
        field: 'roiChange',
        type: 'multiplier',
        prefix: '(',
        suffix: ')',
      },
    },
  },
  {
    field: 'status',
    header: 'Active',
    type: 'boolean',
    width: 90,
  },
]

const buyboxData = ref([
  {
    id: 1,
    zipCode: '90210',
    properties: 12500,
    propertiesPercent: 0.23,
    avgValue: 1850000,
    valueChange: 8.5,
    roiMultiplier: 2.4,
    roiChange: 1.2,
    status: true,
  },
  {
    id: 2,
    zipCode: '10001',
    properties: 8700,
    propertiesPercent: 0.16,
    avgValue: 2100000,
    valueChange: -3.2,
    roiMultiplier: 1.8,
    roiChange: -0.4,
    status: true,
  },
  {
    id: 3,
    zipCode: '33139',
    properties: 4200,
    propertiesPercent: 0.08,
    avgValue: 950000,
    valueChange: 12.1,
    roiMultiplier: 3.1,
    roiChange: 2.1,
    status: false,
  },
  {
    id: 4,
    zipCode: '94102',
    properties: 6300,
    propertiesPercent: 0.12,
    avgValue: 1450000,
    valueChange: -1.5,
    roiMultiplier: 2.0,
    roiChange: 0.0,
    status: true,
  },
  {
    id: 5,
    zipCode: '60601',
    properties: 9400,
    propertiesPercent: 0.18,
    avgValue: 780000,
    valueChange: 5.8,
    roiMultiplier: 2.7,
    roiChange: 0.9,
    status: true,
  },
  {
    id: 6,
    zipCode: '75201',
    properties: 5100,
    propertiesPercent: 0.10,
    avgValue: 620000,
    valueChange: 15.3,
    roiMultiplier: 3.5,
    roiChange: 1.8,
    status: true,
  },
  {
    id: 7,
    zipCode: '98101',
    properties: 3800,
    propertiesPercent: 0.07,
    avgValue: 1120000,
    valueChange: -0.8,
    roiMultiplier: 1.9,
    roiChange: -0.2,
    status: false,
  },
  {
    id: 8,
    zipCode: '30301',
    properties: 7200,
    propertiesPercent: 0.14,
    avgValue: 540000,
    valueChange: 9.2,
    roiMultiplier: 2.8,
    roiChange: 1.1,
    status: true,
  },
])

const buyboxTotalsConfig: TotalsConfig = {
  label: 'Total',
}

// ============================================
// Column types example
// ============================================

const typeColumns: Column[] = [
  { field: 'description', header: 'Type', type: 'text', width: 120 },
  { field: 'textValue', header: 'Text', type: 'text', width: 180 },
  { field: 'numberValue', header: 'Number', type: 'number', width: 100 },
  { field: 'currencyValue', header: 'Currency', type: 'currency', width: 120 },
  { field: 'percentageValue', header: 'Percentage', type: 'percentage', width: 110 },
  { field: 'dateValue', header: 'Date', type: 'date', width: 110 },
  { field: 'booleanValue', header: 'Boolean', type: 'boolean', width: 90 },
]

const typeData = ref([
  {
    id: 1,
    description: 'Positive',
    textValue: '123 Main Street',
    numberValue: 1234.56,
    currencyValue: 1234567,
    percentageValue: 0.123,
    dateValue: '2026-01-16',
    booleanValue: true,
  },
  {
    id: 2,
    description: 'Negative',
    textValue: '456 Oak Avenue',
    numberValue: -987.65,
    currencyValue: -987650,
    percentageValue: -0.056,
    dateValue: '2025-12-25',
    booleanValue: false,
  },
  {
    id: 3,
    description: 'Zero',
    textValue: '789 Pine Road',
    numberValue: 0,
    currencyValue: 0,
    percentageValue: 0,
    dateValue: '2026-01-01',
    booleanValue: false,
  },
  {
    id: 4,
    description: 'Large',
    textValue: '1000 Corporate Blvd',
    numberValue: 9876543.21,
    currencyValue: 12500000,
    percentageValue: 0.892,
    dateValue: '2024-06-15',
    booleanValue: true,
  },
])

// ============================================
// Documentation data
// ============================================

const tableProps = [
  { name: 'columns', type: 'Column[]', default: '(required)', description: 'Array of column definitions' },
  { name: 'data', type: 'any[]', default: 'undefined', description: 'Static data array for client-side mode (sorting, filtering, pagination handled automatically)' },
  { name: 'fetchData', type: '(params: GridParams) => Promise<GridResponse>', default: 'undefined', description: 'Server-side data fetch function' },
  { name: 'rowKey', type: 'string', default: '"id"', description: 'Unique row identifier field' },
  { name: 'title', type: 'string', default: 'undefined', description: 'Table title shown in toolbar' },
  { name: 'rowLabel', type: 'string', default: '"rows"', description: 'Label for pagination (e.g., "properties", "records")' },
  { name: 'height', type: 'string', default: '"100%"', description: 'Table container height (fills parent by default)' },
  { name: 'enableSelection', type: 'boolean', default: 'false', description: 'Show selection checkboxes' },
  { name: 'enablePagination', type: 'boolean', default: 'true', description: 'Show pagination controls' },
  { name: 'enableRefresh', type: 'boolean', default: 'true', description: 'Show refresh button in toolbar' },
  { name: 'showToolbar', type: 'boolean', default: 'true', description: 'Show top toolbar with title and actions' },
  { name: 'showTotals', type: 'boolean', default: 'false', description: 'Show totals row at bottom (sticky)' },
  { name: 'totalsConfig', type: 'TotalsConfig', default: 'undefined', description: 'Totals row configuration (label, manual values)' },
  { name: 'defaultPageSize', type: 'number', default: '50', description: 'Initial rows per page. Must match a value in the page size options (25, 50, 100, 250, 500).' },
  { name: 'defaultSort', type: 'SortModel[]', default: 'undefined', description: 'Initial sort configuration' },
  { name: 'compact', type: 'boolean', default: 'false', description: 'Use compact row height' },
  { name: 'striped', type: 'boolean', default: 'false', description: 'Alternate row backgrounds' },
]

const columnProps = [
  { name: 'field', type: 'string', required: true, description: 'Data field key (must match data object property)' },
  { name: 'header', type: 'string', required: true, description: 'Column header text' },
  { name: 'type', type: 'ColumnType', required: false, description: 'Data type for auto-formatting (text, number, currency, percentage, date, boolean, composite)' },
  { name: 'tooltip', type: 'string', required: false, description: 'Tooltip text shown on column header hover' },
  { name: 'format', type: 'CompositeColumnFormat', required: false, description: 'Format configuration for composite columns (primary + secondary value)' },
  { name: 'width', type: 'number', required: false, description: 'Initial column width in pixels (auto-calculated from header text if not specified, can be resized by user)' },
  { name: 'minWidth', type: 'number', required: false, description: 'Minimum column width in pixels (default: 50)' },
  { name: 'maxWidth', type: 'number', required: false, description: 'Maximum column width in pixels' },
  { name: 'align', type: '"left" | "center"', required: false, description: 'Text alignment (center for numbers/dates, left for text). Note: right alignment is not allowed.' },
  { name: 'pinned', type: '"left" | "right" | null', required: false, description: 'Pin column to left or right edge' },
  { name: 'sortable', type: 'boolean', required: false, description: 'Enable sorting (default: true)' },
  { name: 'filterable', type: 'boolean', required: false, description: 'Enable filtering (default: true)' },
  { name: 'resizable', type: 'boolean', required: false, description: 'Enable column resizing (default: true)' },
  { name: 'hidden', type: 'boolean', required: false, description: 'Hide column initially (default: false)' },
  { name: 'totals', type: '"sum" | "avg" | "count" | "none"', required: false, description: 'Totals row calculation mode for this column' },
]

const tableEvents = [
  { name: 'row-click', payload: 'row: any', description: 'Emitted when a row is clicked (excludes clicks on buttons, inputs, links)' },
  { name: 'selection-change', payload: 'rows: any[]', description: 'Emitted when checkbox selection changes' },
  { name: 'data-loaded', payload: 'data: any[]', description: 'Emitted when data is loaded (client or server-side)' },
  { name: 'data-error', payload: 'error: Error', description: 'Emitted when data fetch fails' },
  { name: 'sort-change', payload: 'sortModel: SortModel[]', description: 'Emitted when sort configuration changes' },
  { name: 'column-pin', payload: 'column: Column, side: ColumnPinSide', description: 'Emitted when column is pinned or unpinned' },
  { name: 'column-hide', payload: 'column: Column', description: 'Emitted when column is hidden via menu' },
  { name: 'column-reorder', payload: 'columns: Column[]', description: 'Emitted when columns are reordered via drag-and-drop' },
]

// ============================================
// Event handlers
// ============================================

function handleRowClick(row: any) {
  console.log('Row clicked:', row)
}

function handleSelectionChange(rows: any[]) {
  console.log('Selection changed:', rows)
}

function handleColumnPin(column: any, side: string | null) {
  console.log('Column pinned:', column.field, side)
}

function handleColumnHide(column: any) {
  console.log('Column hidden:', column.field)
}
</script>

<template>
  <div class="min-h-screen bg-surface-base">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- ============================================ -->
      <!-- Header -->
      <!-- ============================================ -->
      <div class="mb-8">
        <h1 class="text-h1 text-content-primary mb-2">Tables</h1>
        <p class="text-body-large text-content-secondary">
          Enterprise-grade data tables for displaying and interacting with large datasets.
          Built with performance, accessibility, and dark mode support.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <AxisTag color="main" size="sm">Sorting</AxisTag>
          <AxisTag color="main" size="sm">Filtering</AxisTag>
          <AxisTag color="main" size="sm">Pagination</AxisTag>
          <AxisTag color="main" size="sm">Selection</AxisTag>
          <AxisTag color="main" size="sm">Column Resize</AxisTag>
          <AxisTag color="main" size="sm">Column Reorder</AxisTag>
          <AxisTag color="main" size="sm">Pinning</AxisTag>
          <AxisTag color="main" size="sm">Totals Row</AxisTag>
          <AxisTag color="main" size="sm">Auto-formatting</AxisTag>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- Mandatory Rule Notice -->
      <!-- ============================================ -->
      <section class="mb-8">
        <AxisCallout type="warning" title="Mandatory: Use AxisTable">
          <p>
            <strong>Raw HTML tables are forbidden.</strong> All tabular data MUST use AxisTable.
            This ensures consistent styling, accessibility, dark mode support, and feature parity across the platform.
          </p>
        </AxisCallout>
      </section>

      <!-- ============================================ -->
      <!-- Live Preview - Property List -->
      <!-- ============================================ -->
      <section class="mb-12">
        <h2 class="text-h3 text-content-primary mb-4">Property List Example</h2>
        <p class="text-body-regular text-content-secondary mb-6">
          A property list table matching the 8020REI design reference. Note the clear grid lines,
          single-line cells with truncation, and proper data alignment (text left, numbers center).
        </p>

        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="h-[500px]">
            <AxisTable
              :columns="propertyColumns"
              :data="propertyData"
              title="Property List"
              row-label="properties"
              enable-selection
              @row-click="handleRowClick"
              @selection-change="handleSelectionChange"
              @column-pin="handleColumnPin"
              @column-hide="handleColumnHide"
            >
              <!-- Custom cell for fullAddress (make it a link) -->
              <template #cell-fullAddress="{ value }">
                <button
                  class="text-main-600 dark:text-main-400 hover:underline text-left truncate max-w-full block"
                  :title="value"
                  @click.stop="console.log(`View property: ${value}`)"
                >
                  {{ value }}
                </button>
              </template>
            </AxisTable>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- Value & Equity Table with Totals -->
      <!-- ============================================ -->
      <section class="mb-12">
        <h2 class="text-h3 text-content-primary mb-4">Value & Equity Analysis</h2>
        <p class="text-body-regular text-content-secondary mb-6">
          A table with numeric columns showing totals row. Currency and percentages are right-aligned with
          monospace font for easy scanning. Positive percentages show green, negative show red.
        </p>

        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="h-[480px]">
            <AxisTable
              :columns="valueColumns"
              :data="valueData"
              title="Property Values"
              row-label="properties"
              show-totals
              :totals-config="valueTotalsConfig"
              @row-click="handleRowClick"
            >
              <!-- Custom cell for fullAddress (make it a link) -->
              <template #cell-fullAddress="{ value }">
                <button
                  class="text-main-600 dark:text-main-400 hover:underline text-left truncate max-w-full block"
                  :title="value"
                  @click.stop="console.log(`View property: ${value}`)"
                >
                  {{ value }}
                </button>
              </template>
            </AxisTable>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- Buybox-Style Composite Columns -->
      <!-- ============================================ -->
      <section class="mb-12">
        <h2 class="text-h3 text-content-primary mb-4">Buybox Analysis (Composite Columns)</h2>
        <p class="text-body-regular text-content-secondary mb-6">
          Composite columns display a primary value with a secondary indicator in parentheses.
          Secondary values are color-coded: green for positive change, red for negative, gray for neutral.
        </p>

        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="h-[450px]">
            <AxisTable
              :columns="buyboxColumns"
              :data="buyboxData"
              title="Zip Code Analysis"
              row-label="zip codes"
              show-totals
              :totals-config="buyboxTotalsConfig"
            />
          </div>
        </div>

        <!-- Composite column code example -->
        <div class="mt-6">
          <details class="bg-surface-overlay border border-stroke rounded-lg">
            <summary class="px-4 py-3 cursor-pointer text-body-regular font-medium text-content-primary hover:bg-surface-raised transition-colors">
              Show composite column definition
            </summary>
            <div class="px-4 py-3 border-t border-stroke">
              <pre class="text-label text-content-secondary overflow-x-auto font-mono"><code>{
  field: 'avgValue',
  header: 'Avg Value',
  type: 'composite',
  format: {
    primary: 'currency',
    secondary: {
      field: 'valueChange',    // Data field for secondary value
      type: 'change',          // 'percentage' | 'change' | 'multiplier'
      prefix: '(',
      suffix: ')',
    },
  },
}</code></pre>
            </div>
          </details>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- Column Types & Formatting -->
      <!-- ============================================ -->
      <section class="mb-12">
        <h2 class="text-h3 text-content-primary mb-4">Column Types & Formatting</h2>
        <p class="text-body-regular text-content-secondary mb-6">
          AxisTable automatically formats values based on column type. Numeric types are center-aligned
          for easy scanning. Dates use M/d/yyyy format.
        </p>

        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="h-[320px]">
            <AxisTable
              :columns="typeColumns"
              :data="typeData"
              title="Column Types"
              :show-toolbar="false"
              :enable-pagination="false"
            />
          </div>
        </div>

        <!-- Type reference -->
        <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-label font-semibold text-content-primary mb-1">text</h4>
            <p class="text-label text-content-tertiary">Left-aligned, truncate long values with tooltip</p>
          </div>
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-label font-semibold text-content-primary mb-1">number</h4>
            <p class="text-label text-content-tertiary">Center-aligned, compact notation (1K, 1.2M)</p>
          </div>
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-label font-semibold text-content-primary mb-1">currency</h4>
            <p class="text-label text-content-tertiary">Center-aligned, compact ($54K, $1.2M)</p>
          </div>
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-label font-semibold text-content-primary mb-1">percentage</h4>
            <p class="text-label text-content-tertiary">Center-aligned, color-coded (+green, -red)</p>
          </div>
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-label font-semibold text-content-primary mb-1">date</h4>
            <p class="text-label text-content-tertiary">Center-aligned, M/D/YY format</p>
          </div>
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-label font-semibold text-content-primary mb-1">boolean</h4>
            <p class="text-label text-content-tertiary">Yes/No badge with green/gray background</p>
          </div>
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-label font-semibold text-content-primary mb-1">composite</h4>
            <p class="text-label text-content-tertiary">Primary + secondary value (e.g., 12K (23%))</p>
          </div>
        </div>

        <!-- Formatting Integration Note -->
        <div class="mt-6">
          <AxisCallout type="info" title="Global Formatting Rules">
            <p>
              AxisTable automatically applies the platform's <strong>global formatting rules</strong> from
              <code class="text-label bg-surface-raised px-1 rounded">~/utils/formatting.ts</code>. All values
              are formatted according to the design system standards:
            </p>
            <ul class="mt-2 list-disc list-inside space-y-1">
              <li><strong>Numbers:</strong> K for thousands (54K), M for millions (1.2M)</li>
              <li><strong>Currency:</strong> Compact format ($54K, $1.2M) for display values</li>
              <li><strong>Percentages:</strong> No decimals ≥10%, one decimal &lt;10%</li>
              <li><strong>Dates:</strong> M/D/YY format (1/16/26)</li>
            </ul>
            <p class="mt-2">
              See <NuxtLink to="/design-system/data-formatting" class="text-main-600 dark:text-main-400 hover:underline">Data Formatting</NuxtLink> for complete rules.
            </p>
          </AxisCallout>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- Column Header Options -->
      <!-- ============================================ -->
      <section class="mb-12">
        <h2 class="text-h3 text-content-primary mb-4">Column Header Options</h2>
        <p class="text-body-regular text-content-secondary mb-6">
          Each column header has a three-dots menu with options for sorting, pinning, and hiding.
          A filter button is always visible on every column header.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-body-regular font-semibold text-content-primary mb-2">Sorting</h4>
            <ul class="text-label text-content-secondary space-y-1">
              <li>• Click header to cycle: asc → desc → none</li>
              <li>• Click menu to set specific order</li>
              <li>• Arrow indicator shows current direction</li>
            </ul>
          </div>
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-body-regular font-semibold text-content-primary mb-2">Pinning</h4>
            <ul class="text-label text-content-secondary space-y-1">
              <li>• Pin left: Stays visible on scroll</li>
              <li>• Pin right: Anchored to right edge</li>
              <li>• Pin icon shows pinned state</li>
            </ul>
          </div>
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-body-regular font-semibold text-content-primary mb-2">Hiding</h4>
            <ul class="text-label text-content-secondary space-y-1">
              <li>• Hide column from view</li>
              <li>• Emits <code class="text-label">column-hide</code> event</li>
              <li>• Can be restored via column picker</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- Column Interaction Features -->
      <!-- ============================================ -->
      <section class="mb-12">
        <h2 class="text-h3 text-content-primary mb-4">Column Interaction Features</h2>
        <p class="text-body-regular text-content-secondary mb-6">
          AxisTable supports advanced column interactions: filtering, resizing, and drag-to-reorder.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-body-regular font-semibold text-content-primary mb-2">Column Filtering</h4>
            <ul class="text-label text-content-secondary space-y-1">
              <li>• Click funnel icon to open filter panel</li>
              <li>• Supports multiple filter types (contains, equals, greater than, etc.)</li>
              <li>• Combine multiple conditions with AND/OR</li>
              <li>• Active filters highlighted in blue</li>
              <li>• Client-side filtering for <code class="text-label">data</code> prop</li>
            </ul>
          </div>
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-body-regular font-semibold text-content-primary mb-2">Column Resizing</h4>
            <ul class="text-label text-content-secondary space-y-1">
              <li>• <strong>Auto-sized by default</strong>: Columns automatically size to fit header text</li>
              <li>• Drag the right edge of column headers to resize</li>
              <li>• Visual indicator appears on hover</li>
              <li>• Minimum width: 50px (configurable)</li>
              <li>• Maximum width can be set per column</li>
              <li>• Resized widths persist during session</li>
            </ul>
          </div>
          <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
            <h4 class="text-body-regular font-semibold text-content-primary mb-2">Column Reordering</h4>
            <ul class="text-label text-content-secondary space-y-1">
              <li>• Drag column headers to reorder</li>
              <li>• Visual drop indicator shows position</li>
              <li>• Emits <code class="text-label">column-reorder</code> event</li>
              <li>• Order persists during session</li>
            </ul>
          </div>
        </div>

        <!-- Filter operators reference -->
        <div class="mt-6">
          <details class="bg-surface-overlay border border-stroke rounded-lg">
            <summary class="px-4 py-3 cursor-pointer text-body-regular font-medium text-content-primary hover:bg-surface-raised transition-colors">
              Show available filter operators
            </summary>
            <div class="px-4 py-3 border-t border-stroke">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p class="text-label font-semibold text-content-primary mb-1">Text Filters</p>
                  <ul class="text-label text-content-secondary space-y-0.5">
                    <li>• contains</li>
                    <li>• notContains</li>
                    <li>• startsWith</li>
                    <li>• endsWith</li>
                  </ul>
                </div>
                <div>
                  <p class="text-label font-semibold text-content-primary mb-1">Comparison</p>
                  <ul class="text-label text-content-secondary space-y-0.5">
                    <li>• equals</li>
                    <li>• notEquals</li>
                    <li>• greaterThan</li>
                    <li>• lessThan</li>
                  </ul>
                </div>
                <div>
                  <p class="text-label font-semibold text-content-primary mb-1">Range</p>
                  <ul class="text-label text-content-secondary space-y-0.5">
                    <li>• greaterThanOrEqual</li>
                    <li>• lessThanOrEqual</li>
                  </ul>
                </div>
                <div>
                  <p class="text-label font-semibold text-content-primary mb-1">Empty Checks</p>
                  <ul class="text-label text-content-secondary space-y-0.5">
                    <li>• isEmpty</li>
                    <li>• isNotEmpty</li>
                  </ul>
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- API Reference -->
      <!-- ============================================ -->
      <section class="mb-12">
        <h2 class="text-h3 text-content-primary mb-4">API Reference</h2>

        <h3 class="text-h5 text-content-primary mb-3 mt-6">Table Props</h3>
        <div class="overflow-x-auto border border-stroke rounded-lg">
          <table class="w-full" style="border-collapse: separate; border-spacing: 0;">
            <thead>
              <tr class="bg-surface-raised">
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-r border-stroke">Prop</th>
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-r border-stroke">Type</th>
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-r border-stroke">Default</th>
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-stroke">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(prop, index) in tableProps" :key="index">
                <td class="px-3 py-2.5 text-body-regular text-content-primary font-mono border-b border-r border-stroke-subtle">{{ prop.name }}</td>
                <td class="px-3 py-2.5 text-body-regular text-content-tertiary font-mono border-b border-r border-stroke-subtle">{{ prop.type }}</td>
                <td class="px-3 py-2.5 text-body-regular text-content-tertiary font-mono border-b border-r border-stroke-subtle">{{ prop.default }}</td>
                <td class="px-3 py-2.5 text-body-regular text-content-secondary border-b border-stroke-subtle">{{ prop.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-h5 text-content-primary mb-3 mt-8">Column Props</h3>
        <div class="overflow-x-auto border border-stroke rounded-lg">
          <table class="w-full" style="border-collapse: separate; border-spacing: 0;">
            <thead>
              <tr class="bg-surface-raised">
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-r border-stroke">Prop</th>
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-r border-stroke">Type</th>
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-r border-stroke">Required</th>
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-stroke">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(prop, index) in columnProps" :key="index">
                <td class="px-3 py-2.5 text-body-regular text-content-primary font-mono border-b border-r border-stroke-subtle">{{ prop.name }}</td>
                <td class="px-3 py-2.5 text-body-regular text-content-tertiary font-mono border-b border-r border-stroke-subtle">{{ prop.type }}</td>
                <td class="px-3 py-2.5 text-body-regular text-content-tertiary border-b border-r border-stroke-subtle">{{ prop.required ? 'Yes' : 'No' }}</td>
                <td class="px-3 py-2.5 text-body-regular text-content-secondary border-b border-stroke-subtle">{{ prop.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-h5 text-content-primary mb-3 mt-8">Events</h3>
        <div class="overflow-x-auto border border-stroke rounded-lg">
          <table class="w-full" style="border-collapse: separate; border-spacing: 0;">
            <thead>
              <tr class="bg-surface-raised">
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-r border-stroke">Event</th>
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-r border-stroke">Payload</th>
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-stroke">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(event, index) in tableEvents" :key="index">
                <td class="px-3 py-2.5 text-body-regular text-content-primary font-mono border-b border-r border-stroke-subtle">@{{ event.name }}</td>
                <td class="px-3 py-2.5 text-body-regular text-content-tertiary font-mono border-b border-r border-stroke-subtle">{{ event.payload }}</td>
                <td class="px-3 py-2.5 text-body-regular text-content-secondary border-b border-stroke-subtle">{{ event.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- Slots -->
      <!-- ============================================ -->
      <section class="mb-12">
        <h2 class="text-h3 text-content-primary mb-4">Slots</h2>
        <p class="text-body-regular text-content-secondary mb-4">
          AxisTable provides several slots for customizing content rendering.
        </p>

        <div class="overflow-x-auto border border-stroke rounded-lg">
          <table class="w-full" style="border-collapse: separate; border-spacing: 0;">
            <thead>
              <tr class="bg-surface-raised">
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-r border-stroke">Slot</th>
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-r border-stroke">Props</th>
                <th class="px-3 py-2.5 text-left text-body-regular font-semibold text-content-primary border-b border-stroke">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="px-3 py-2.5 text-body-regular text-content-primary font-mono border-b border-r border-stroke-subtle">#cell-[field]</td>
                <td class="px-3 py-2.5 text-body-regular text-content-tertiary font-mono border-b border-r border-stroke-subtle">{ value, row, column, rowIndex, columnIndex }</td>
                <td class="px-3 py-2.5 text-body-regular text-content-secondary border-b border-stroke-subtle">Custom cell renderer for a specific column (replace [field] with column field name)</td>
              </tr>
              <tr>
                <td class="px-3 py-2.5 text-body-regular text-content-primary font-mono border-b border-r border-stroke-subtle">#toolbar-actions</td>
                <td class="px-3 py-2.5 text-body-regular text-content-tertiary font-mono border-b border-r border-stroke-subtle">—</td>
                <td class="px-3 py-2.5 text-body-regular text-content-secondary border-b border-stroke-subtle">Additional actions in the toolbar (buttons, dropdowns)</td>
              </tr>
              <tr>
                <td class="px-3 py-2.5 text-body-regular text-content-primary font-mono border-b border-r border-stroke-subtle">#empty</td>
                <td class="px-3 py-2.5 text-body-regular text-content-tertiary font-mono border-b border-r border-stroke-subtle">—</td>
                <td class="px-3 py-2.5 text-body-regular text-content-secondary border-b border-stroke-subtle">Custom empty state content when no data is available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- Accessibility -->
      <!-- ============================================ -->
      <section class="mb-12">
        <h2 class="text-h3 text-content-primary mb-4">Accessibility</h2>
        <div class="space-y-3 text-body-regular text-content-secondary">
          <p>AxisTable implements WCAG AA accessibility standards:</p>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li><strong>ARIA attributes:</strong> role="grid", role="row", role="gridcell", aria-selected, aria-sort</li>
            <li><strong>Keyboard navigation:</strong> Tab to navigate, Enter/Space for selection</li>
            <li><strong>Focus indicators:</strong> Visible focus rings on all interactive elements</li>
            <li><strong>Contrast:</strong> All text meets WCAG AA standards in both light and dark modes</li>
            <li><strong>Screen reader:</strong> Proper semantic markup for assistive technologies</li>
          </ul>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- Code Examples -->
      <!-- ============================================ -->
      <section class="mb-12">
        <h2 class="text-h3 text-content-primary mb-4">Code Examples</h2>

        <div class="space-y-6">
          <div>
            <h3 class="text-h5 text-content-primary mb-3">Basic Usage (Client-Side Data)</h3>
            <div class="bg-surface-overlay border border-stroke rounded-lg px-4 py-3">
              <pre class="text-label text-content-secondary overflow-x-auto font-mono"><code>&lt;AxisTable
  :columns="columns"
  :data="data"
  title="Properties"
  row-label="properties"
/&gt;</code></pre>
            </div>
          </div>

          <div>
            <h3 class="text-h5 text-content-primary mb-3">With Selection and Totals</h3>
            <div class="bg-surface-overlay border border-stroke rounded-lg px-4 py-3">
              <pre class="text-label text-content-secondary overflow-x-auto font-mono"><code>&lt;AxisTable
  :columns="columns"
  :data="data"
  enable-selection
  show-totals
  :totals-config="{ label: 'Total' }"
  @selection-change="handleSelection"
/&gt;</code></pre>
            </div>
          </div>

          <div>
            <h3 class="text-h5 text-content-primary mb-3">Custom Cell Rendering</h3>
            <div class="bg-surface-overlay border border-stroke rounded-lg px-4 py-3">
              <pre class="text-label text-content-secondary overflow-x-auto font-mono"><code>&lt;AxisTable :columns="columns" :data="data"&gt;
  &lt;template #cell-address="&#123; value, row &#125;"&gt;
    &lt;a :href="`/property/$&#123;row.id&#125;`" class="text-main-600 hover:underline"&gt;
      &#123;&#123; value &#125;&#125;
    &lt;/a&gt;
  &lt;/template&gt;
&lt;/AxisTable&gt;</code></pre>
            </div>
          </div>

          <div>
            <h3 class="text-h5 text-content-primary mb-3">Server-Side Data Fetching</h3>
            <div class="bg-surface-overlay border border-stroke rounded-lg px-4 py-3">
              <pre class="text-label text-content-secondary overflow-x-auto font-mono"><code>// Define fetch function
async function fetchProperties(params: GridParams): Promise&lt;GridResponse&gt; {
  const response = await $fetch('/api/properties', {
    query: {
      start: params.startRow,
      end: params.endRow,
      sort: JSON.stringify(params.sortModel),
      filter: JSON.stringify(params.filterModel),
    },
  })
  return {
    rows: response.data,
    totalCount: response.total,
  }
}

// Use in template
&lt;AxisTable
  :columns="columns"
  :fetch-data="fetchProperties"
  title="Properties"
  @data-loaded="onDataLoaded"
  @data-error="onDataError"
/&gt;</code></pre>
            </div>
          </div>

          <div>
            <h3 class="text-h5 text-content-primary mb-3">Column with Tooltip</h3>
            <div class="bg-surface-overlay border border-stroke rounded-lg px-4 py-3">
              <pre class="text-label text-content-secondary overflow-x-auto font-mono"><code>const columns: Column[] = [
  {
    field: 'fullAddress',
    header: 'Full Address',
    type: 'text',
    width: 280,
    tooltip: 'Complete property address with city, state, and zip',
  },
  // ... more columns
]</code></pre>
            </div>
          </div>

          <div>
            <h3 class="text-h5 text-content-primary mb-3">Handling Column Events</h3>
            <div class="bg-surface-overlay border border-stroke rounded-lg px-4 py-3">
              <pre class="text-label text-content-secondary overflow-x-auto font-mono"><code>&lt;AxisTable
  :columns="columns"
  :data="data"
  @column-reorder="handleColumnReorder"
  @column-pin="handleColumnPin"
  @column-hide="handleColumnHide"
  @sort-change="handleSortChange"
/&gt;

&lt;script setup&gt;
function handleColumnReorder(newColumns: Column[]) {
  // Save column order to localStorage or server
  console.log('New column order:', newColumns.map(c => c.field))
}

function handleColumnPin(column: Column, side: 'left' | 'right' | null) {
  console.log(`Column ${column.field} pinned to ${side || 'unpinned'}`)
}
&lt;/script&gt;</code></pre>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- Dark Mode Note -->
      <!-- ============================================ -->
      <section>
        <AxisCallout type="info" title="Dark Mode Support">
          <p>
            AxisTable uses semantic color tokens that automatically adapt to theme changes.
            All cell formatting, including percentage coloring, boolean badges, and composite
            value indicators, has been tested in both light and dark modes.
          </p>
        </AxisCallout>
      </section>
    </div>
  </div>
</template>
