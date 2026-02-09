<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Data Formatting Rules | Design System | 8020",
});

// ============================================
// DATA FORMATTING SPECIFICATION
// Source of truth for all number, currency, date,
// and percentage formatting across the platform.
// These rules are MANDATORY and apply everywhere.
// ============================================

const generalRules = [
  {
    rule: "Numerical values must be center-aligned in tables",
    context: "Tables",
    required: true,
  },
  {
    rule: "Date values must be center-aligned in tables",
    context: "Tables",
    required: true,
  },
  {
    rule: "Text-based information must be left-aligned",
    context: "Tables",
    required: true,
  },
  {
    rule: "Right-alignment is NOT allowed - only left or center",
    context: "Tables",
    required: true,
  },
  {
    rule: "Time must always be displayed as: [Hour] [AM/PM] EST",
    context: "All timestamps",
    required: true,
  },
  {
    rule: "Always use EST timezone",
    context: "All timestamps",
    required: true,
  },
];

const numberFormats = [
  {
    type: "Numbers (compact)",
    format: "Abbreviated, no $",
    example: "54K",
    code: "formatNumberCompact(54000)",
    usage: "Most common - tables, stats, counts",
  },
  {
    type: "Numbers (full)",
    format: "With commas",
    example: "54,200",
    code: "formatNumberFull(54200)",
    usage: "Billing, totals, when precision matters",
  },
  {
    type: "Currency (compact)",
    format: "Abbreviated with $",
    example: "$54K",
    code: "formatCurrencyCompact(54000)",
    usage: "Property values in tables",
  },
  {
    type: "Currency (full)",
    format: "With 2 decimals",
    example: "$54,200.00",
    code: "formatCurrencyFull(54200)",
    usage: "Transactional values (payments, RR)",
  },
  {
    type: "Currency (no decimals)",
    format: "Rounded, no decimals",
    example: "$54,200",
    code: "formatCurrencyNoDecimals(54200)",
    usage: "Property values, estimates, PV",
  },
];

// Currency context clarification
const currencyContextRules = [
  {
    context: "Rapid Response (RR)",
    format: "Currency full",
    example: "$54,200.00",
    reason: "Transactional values paid by customers",
  },
  {
    context: "Property Value (PV)",
    format: "Currency compact or no decimals",
    example: "$425K or $425,000",
    reason: "Display values, not transactions",
  },
  {
    context: "Property List",
    format: "Currency compact",
    example: "$425K",
    reason: "Display values, not transactions",
  },
  {
    context: "BuyBox",
    format: "Currency compact",
    example: "$1.2M",
    reason: "Display values, not transactions",
  },
  {
    context: "Buyers List",
    format: "Currency compact",
    example: "$380K",
    reason: "Display values, not transactions",
  },
];

const abbreviationRules = [
  {
    range: "1,000 - 9,999",
    format: "X.XK (one decimal allowed)",
    examples: ["1,200 → 1.2K", "2,000 → 2K", "9,500 → 9.5K"],
  },
  {
    range: "10,000 - 999,999",
    format: "XXK or XXXK (no decimals)",
    examples: ["20,000 → 20K", "200,000 → 200K", "500,500 → 501K"],
  },
  {
    range: "1,000,000+",
    format: "X.XM (one decimal max)",
    examples: ["1,200,000 → 1.2M", "2,000,000 → 2M", "23,000,000 → 23M"],
  },
];

const percentageRules = [
  {
    condition: "≥ 10%",
    format: "No decimals",
    examples: ["85.2% → 85%", "91.1% → 91%", "100% → 100%"],
  },
  {
    condition: "< 10% (but ≥ 1%)",
    format: "One decimal if not .0",
    examples: ["9.0% → 9%", "9.1% → 9.1%", "5.5% → 5.5%"],
  },
  {
    condition: "< 1%",
    format: "One decimal",
    examples: ["0.5% → 0.5%", "0.1% → 0.1%"],
  },
  {
    condition: "< 0.01%",
    format: "Special rule",
    examples: ["≥ 0.005% → 0.01%", "< 0.005% → 0%"],
  },
];

const dateTimeFormats = [
  {
    type: "Date (standard)",
    format: "M/D/YY",
    example: "1/20/24",
    usage: "Tables, lists, compact displays",
  },
  {
    type: "Date (full)",
    format: "Month D, YYYY",
    example: "January 20, 2024",
    usage: "Headers, detailed views",
  },
  {
    type: "Time",
    format: "[Hour]:[Min] [AM/PM] EST",
    example: "10:00 AM EST",
    usage: "All time displays",
  },
  {
    type: "Date + Time",
    format: "M/D/YY [Hour]:[Min] [AM/PM] EST",
    example: "1/20/24 10:00 AM EST",
    usage: "Activity logs, timestamps",
  },
];

const summaryTable = [
  { context: "Numbers (compact)", format: "Abbreviated, no $", example: "54K" },
  { context: "Numbers (full)", format: "With commas", example: "54,200" },
  { context: "Currency (compact)", format: "Abbreviated with $", example: "$54K" },
  { context: "Currency (full)", format: "With 2 decimals", example: "$54,200.00" },
  { context: "Currency (full, no decimals)", format: "Rounded, no decimals", example: "$54,200" },
  { context: "Percentages ≥ 10%", format: "No decimals", example: "85%" },
  { context: "Percentages < 10%", format: "One decimal", example: "9.1%, 0.5%" },
  { context: "Very small % (<0.01%)", format: "Special rule", example: "0.01% or 0%" },
  { context: "Time", format: "[Hour] [AM/PM] EST", example: "10:00 AM EST" },
];
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Numbers, Data & Dates Rules</h1>
      <p class="text-body-regular text-content-secondary">
        All representation of data must follow these rules. These are mandatory platform-wide standards.
      </p>
    </div>

    <!-- Critical Notice -->
    <div class="docs-section">
      <AxisCallout type="warning" title="Mandatory Rules">
        These formatting rules apply platform-wide to ALL features. Inconsistent formatting creates a poor user experience and makes data hard to read.
      </AxisCallout>
    </div>

    <!-- Quick Reference Summary -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Quick Reference</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Summary of all formatting rules at a glance.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke bg-surface-raised">
              <th class="py-2 px-3 text-label-bold text-content-primary">Context / Value Type</th>
              <th class="py-2 px-3 text-label-bold text-content-primary">Format</th>
              <th class="py-2 px-3 text-label-bold text-content-primary">Example</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="row in summaryTable" :key="row.context" class="hover:bg-surface-raised">
              <td class="py-2 px-3 text-body-regular text-content-primary">{{ row.context }}</td>
              <td class="py-2 px-3 text-label text-content-secondary">{{ row.format }}</td>
              <td class="py-2 px-3">
                <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-1.5 py-0.5 rounded">{{ row.example }}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- General Rules -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">General Formatting Rules</h2>

      <div class="space-y-2">
        <div
          v-for="rule in generalRules"
          :key="rule.rule"
          class="flex items-start gap-3 p-3 bg-surface-raised rounded-lg"
        >
          <span class="px-2 py-0.5 text-suggestion-bold bg-main-100 dark:bg-main-900 text-main-700 dark:text-main-300 rounded uppercase shrink-0">
            Required
          </span>
          <div>
            <p class="text-body-regular text-content-primary">{{ rule.rule }}</p>
            <p class="text-label text-content-tertiary mt-0.5">Context: {{ rule.context }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Number Formats -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Number & Currency Formats</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Different formats for different contexts. Choose based on the type of value being displayed.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-primary">Type</th>
              <th class="py-2 pr-4 text-label-bold text-content-primary">Format</th>
              <th class="py-2 pr-4 text-label-bold text-content-primary">Example</th>
              <th class="py-2 text-label-bold text-content-primary">Usage</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="format in numberFormats" :key="format.type">
              <td class="py-2 pr-4 text-body-regular text-content-primary font-medium">{{ format.type }}</td>
              <td class="py-2 pr-4 text-label text-content-secondary">{{ format.format }}</td>
              <td class="py-2 pr-4">
                <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-1.5 py-0.5 rounded">{{ format.example }}</code>
              </td>
              <td class="py-2 text-label text-neutral-600 dark:text-neutral-400">{{ format.usage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Currency Context Rules -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Currency Format by Context</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Currency format depends on whether the value is transactional (paid by customers) or display-only.
      </p>

      <AxisCallout type="info" title="Rule of Thumb">
        Use <strong>Currency (full)</strong> only for transactional values (money actually paid).
        All other monetary displays should use <strong>Currency (compact)</strong> or <strong>Currency (no decimals)</strong>.
      </AxisCallout>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke bg-surface-raised">
              <th class="py-2 px-3 text-label-bold text-content-primary">Context</th>
              <th class="py-2 px-3 text-label-bold text-content-primary">Format</th>
              <th class="py-2 px-3 text-label-bold text-content-primary">Example</th>
              <th class="py-2 px-3 text-label-bold text-content-primary">Reason</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="rule in currencyContextRules" :key="rule.context" class="hover:bg-surface-raised">
              <td class="py-2 px-3 text-body-regular text-content-primary font-medium">{{ rule.context }}</td>
              <td class="py-2 px-3 text-label text-content-secondary">{{ rule.format }}</td>
              <td class="py-2 px-3">
                <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-1.5 py-0.5 rounded">{{ rule.example }}</code>
              </td>
              <td class="py-2 px-3 text-label text-content-tertiary">{{ rule.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Abbreviation Rules (K/M) -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Thousands & Millions (K/M) Abbreviation</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Rules for abbreviating large numbers. Maximum 3 significant digits.
      </p>

      <div class="space-y-4">
        <div
          v-for="rule in abbreviationRules"
          :key="rule.range"
          class="p-4 bg-surface-base border border-stroke rounded-lg"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="px-2 py-0.5 text-suggestion-bold bg-accent-1-100 dark:bg-accent-1-900 text-accent-1-700 dark:text-accent-1-300 rounded">
              {{ rule.range }}
            </span>
            <span class="text-body-regular text-content-primary">→ {{ rule.format }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <code
              v-for="example in rule.examples"
              :key="example"
              class="text-label text-content-secondary  bg-surface-raised px-2 py-1 rounded"
            >
              {{ example }}
            </code>
          </div>
        </div>
      </div>

      <div class="mt-4 p-3 bg-alert-50 dark:bg-alert-950 border border-alert-200 dark:border-alert-800 rounded-lg">
        <p class="text-body-regular text-alert-900 dark:text-alert-100">
          <span class="font-medium">Max 3 significant digits:</span> When abbreviating, display a maximum of 3 significant digits (excluding the K/M). Always round appropriately.
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <code class="text-label text-alert-700 dark:text-alert-300 bg-alert-100 dark:bg-alert-900 px-1.5 py-0.5 rounded">200,500 → 200K</code>
          <code class="text-label text-alert-700 dark:text-alert-300 bg-alert-100 dark:bg-alert-900 px-1.5 py-0.5 rounded">20,500 → 21K (rounded)</code>
          <code class="text-label text-alert-700 dark:text-alert-300 bg-alert-100 dark:bg-alert-900 px-1.5 py-0.5 rounded">2,050,000 → 2.1M</code>
        </div>
      </div>
    </div>

    <!-- Percentage Rules -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Percentage Formatting</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Decimal display depends on the value. Larger percentages show no decimals.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-primary">Condition</th>
              <th class="py-2 pr-4 text-label-bold text-content-primary">Format</th>
              <th class="py-2 text-label-bold text-content-primary">Examples</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="rule in percentageRules" :key="rule.condition">
              <td class="py-2 pr-4 text-body-regular text-content-primary font-medium">{{ rule.condition }}</td>
              <td class="py-2 pr-4 text-label text-content-secondary">{{ rule.format }}</td>
              <td class="py-2">
                <div class="flex flex-wrap gap-2">
                  <code
                    v-for="example in rule.examples"
                    :key="example"
                    class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-1.5 py-0.5 rounded"
                  >
                    {{ example }}
                  </code>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 p-3 bg-info-50 dark:bg-info-950 border border-info-200 dark:border-info-800 rounded-lg">
        <p class="text-body-regular text-info-900 dark:text-info-100">
          <span class="font-medium">Backend requirement:</span> Percentages must be sent as flat decimals (e.g., 0.12 for 12%). Never send as "12%".
        </p>
      </div>
    </div>

    <!-- Date & Time Formats -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Date & Time Formats</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Consistent date and time formatting. Always use EST timezone.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-primary">Type</th>
              <th class="py-2 pr-4 text-label-bold text-content-primary">Format</th>
              <th class="py-2 pr-4 text-label-bold text-content-primary">Example</th>
              <th class="py-2 text-label-bold text-content-primary">Usage</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="format in dateTimeFormats" :key="format.type">
              <td class="py-2 pr-4 text-body-regular text-content-primary font-medium">{{ format.type }}</td>
              <td class="py-2 pr-4">
                <code class="text-label text-content-secondary">{{ format.format }}</code>
              </td>
              <td class="py-2 pr-4">
                <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-1.5 py-0.5 rounded">{{ format.example }}</code>
              </td>
              <td class="py-2 text-label text-neutral-600 dark:text-neutral-400">{{ format.usage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Developer Reference -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Developer Reference</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use the global formatting utilities in <code class="text-label bg-surface-raised px-1 rounded">~/utils/formatting.ts</code> to ensure consistent formatting across the platform.
      </p>

      <AxisCallout type="success" title="AxisTable Auto-Formatting">
        When using <strong>AxisTable</strong>, formatting is automatic based on the column type.
        Set <code>type: 'number'</code>, <code>type: 'currency'</code>, <code>type: 'percentage'</code>, or <code>type: 'date'</code> in your column definition.
      </AxisCallout>

      <div class="mt-4 bg-neutral-900 dark:bg-neutral-950 rounded-lg p-4 overflow-x-auto">
        <pre class="text-label text-neutral-100"><code>// Import formatting utilities
import {
  formatNumberCompact,     // 54000 → "54K"
  formatNumberFull,        // 54000 → "54,000"
  formatCurrencyCompact,   // 54000 → "$54K"
  formatCurrencyFull,      // 54000 → "$54,000.00"
  formatCurrencyNoDecimals,// 54000 → "$54,000"
  formatPercentage,        // 0.852 → "85%" or 0.091 → "9.1%"
  formatDateShort,         // Date → "1/20/24"
  formatTime,              // Date → "10:00 AM EST"
  formatDateTime,          // Date → "1/20/24 10:00 AM EST"
} from '~/utils/formatting'

// Example usage
const value = formatCurrencyCompact(425000) // "$425K"
const percent = formatPercentage(0.152)     // "15%"
const date = formatDateShort(new Date())    // "1/16/26"</code></pre>
      </div>
    </div>

    <!-- Live Examples -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-3">Live Formatting Examples</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        How formatted data appears in context.
      </p>

      <!-- Example Table -->
      <div class="bg-surface-base border border-stroke rounded-lg overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke bg-surface-raised">
              <th class="py-2 px-4 text-label-bold text-content-primary text-left">Property</th>
              <th class="py-2 px-4 text-label-bold text-content-primary text-center">Value</th>
              <th class="py-2 px-4 text-label-bold text-content-primary text-center">Properties</th>
              <th class="py-2 px-4 text-label-bold text-content-primary text-center">Deal Rate</th>
              <th class="py-2 px-4 text-label-bold text-content-primary text-left">Last Updated</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr class="hover:bg-surface-raised">
              <td class="py-2 px-4 text-body-regular text-content-primary">Miami-Dade County</td>
              <td class="py-2 px-4 text-body-regular text-content-primary text-center">$425K</td>
              <td class="py-2 px-4 text-body-regular text-content-primary text-center">12.4K</td>
              <td class="py-2 px-4 text-body-regular text-content-primary text-center">2.5%</td>
              <td class="py-2 px-4 text-label text-content-secondary">1/20/24 10:00 AM EST</td>
            </tr>
            <tr class="hover:bg-surface-raised">
              <td class="py-2 px-4 text-body-regular text-content-primary">Broward County</td>
              <td class="py-2 px-4 text-body-regular text-content-primary text-center">$380K</td>
              <td class="py-2 px-4 text-body-regular text-content-primary text-center">8.7K</td>
              <td class="py-2 px-4 text-body-regular text-content-primary text-center">15%</td>
              <td class="py-2 px-4 text-label text-content-secondary">1/19/24 3:30 PM EST</td>
            </tr>
            <tr class="hover:bg-surface-raised">
              <td class="py-2 px-4 text-body-regular text-content-primary">Palm Beach County</td>
              <td class="py-2 px-4 text-body-regular text-content-primary text-center">$1.2M</td>
              <td class="py-2 px-4 text-body-regular text-content-primary text-center">5.2K</td>
              <td class="py-2 px-4 text-body-regular text-content-primary text-center">0.8%</td>
              <td class="py-2 px-4 text-label text-content-secondary">1/18/24 9:15 AM EST</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Stats Cards Example -->
      <div class="mt-6">
        <p class="text-label-bold text-content-primary mb-3">Stats Cards</p>
        <div class="grid grid-cols-4 gap-4">
          <div class="p-4 bg-surface-base border border-stroke rounded-lg">
            <p class="text-label text-content-tertiary">Total Properties</p>
            <p class="text-h2 text-content-primary ">32.3K</p>
            <span class="text-label text-main-600 dark:text-main-400">+20%</span>
          </div>
          <div class="p-4 bg-surface-base border border-stroke rounded-lg">
            <p class="text-label text-content-tertiary">Avg. Value</p>
            <p class="text-h2 text-content-primary">$425K</p>
            <span class="text-label text-main-600 dark:text-main-400">+5.2%</span>
          </div>
          <div class="p-4 bg-surface-base border border-stroke rounded-lg">
            <p class="text-label text-content-tertiary">Deal Rate</p>
            <p class="text-h2 text-content-primary">12%</p>
            <span class="text-label text-error-600 dark:text-error-400">-2%</span>
          </div>
          <div class="p-4 bg-surface-base border border-stroke rounded-lg">
            <p class="text-label text-content-tertiary">Revenue</p>
            <p class="text-h2 text-content-primary">$2.4M</p>
            <span class="text-label text-main-600 dark:text-main-400">+18%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
