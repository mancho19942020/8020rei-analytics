<script setup lang="ts">
/**
 * Breadcrumb Documentation Page
 * Design System - Axis Components
 */
import { FolderIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Breadcrumb | Design System | 8020",
});

// Demo breadcrumb configurations
// Note: Using '#' for demo purposes - in real implementation, use actual routes
const basicItems = [
  { label: 'Home', href: '#' },
  { label: 'Properties', href: '#' },
  { label: 'Property Details' },
]

const withHomeIcon = [
  { label: 'Home', href: '#' },
  { label: 'Users', href: '#' },
  { label: 'User Management', href: '#' },
  { label: 'John Doe' },
]

const withCustomIcon = [
  { label: 'Projects', href: '#', icon: FolderIcon },
  { label: 'Project Alpha', href: '#', icon: FolderIcon },
  { label: 'Documents', icon: FolderIcon },
]

const longPath = [
  { label: 'Home', href: '#' },
  { label: 'Category', href: '#' },
  { label: 'Subcategory', href: '#' },
  { label: 'Section', href: '#' },
  { label: 'Subsection', href: '#' },
  { label: 'Current Page' },
]
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-h1 text-content-primary mb-2">Breadcrumb</h1>
      <p class="text-body-large text-content-secondary">
        Secondary navigation showing the user's current location within the site hierarchy.
        Helps users navigate back efficiently through the page structure.
      </p>
    </div>

    <!-- Overview -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-6">
        Breadcrumbs provide a trail for users to follow back to the starting or entry point.
        They show the hierarchical structure and allow quick navigation to parent pages.
      </p>

      <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
        <AxisBreadcrumb :items="basicItems" />
      </div>
    </section>

    <!-- When to Use -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">When to Use</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Do's -->
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Detail pages within a hierarchical structure</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Multi-step processes (forms, wizards)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Nested sections (user management, settings)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>When browser back button is insufficient</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Sites with more than 2 levels of depth</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Single-level pages (home, dashboard)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Replace primary navigation</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Show more than 5-6 levels (use overflow)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Flat site structures with no hierarchy</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>As the only navigation method</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Separators -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Separators</h2>
      <p class="text-body-regular text-content-secondary mb-6">
        Three separator styles to match different design aesthetics.
      </p>

      <div class="space-y-6">
        <!-- Slash -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="mb-4">
            <h3 class="text-h4 text-content-primary mb-1">Slash (Default)</h3>
            <p class="text-body-regular text-content-secondary">Simple and clean, traditional style</p>
          </div>
          <AxisBreadcrumb :items="basicItems" separator="slash" />
        </div>

        <!-- Chevron -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="mb-4">
            <h3 class="text-h4 text-content-primary mb-1">Chevron</h3>
            <p class="text-body-regular text-content-secondary">Directional indicator, modern look</p>
          </div>
          <AxisBreadcrumb :items="basicItems" separator="chevron" />
        </div>

        <!-- Arrow -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="mb-4">
            <h3 class="text-h4 text-content-primary mb-1">Arrow</h3>
            <p class="text-body-regular text-content-secondary">Strong directional emphasis</p>
          </div>
          <AxisBreadcrumb :items="basicItems" separator="arrow" />
        </div>
      </div>
    </section>

    <!-- With Icons -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">With Icons</h2>

      <!-- Home Icon -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Home Icon</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Show a home icon for the first item to indicate the starting point.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisBreadcrumb :items="withHomeIcon" show-home-icon />
        </div>
      </div>

      <!-- Custom Icons -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Custom Icons</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Each item can have its own icon for visual context.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisBreadcrumb :items="withCustomIcon" separator="chevron" />
        </div>
      </div>
    </section>

    <!-- Overflow Handling -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Overflow Handling</h2>
      <p class="text-body-regular text-content-secondary mb-6">
        For deep hierarchies, use <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">maxItems</code>
        to show ellipsis for middle items while preserving first and last items.
      </p>

      <div class="space-y-6">
        <!-- Full Path -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="mb-4">
            <h3 class="text-h4 text-content-primary mb-1">Full Path (6 items)</h3>
          </div>
          <AxisBreadcrumb :items="longPath" separator="chevron" />
        </div>

        <!-- With Max Items -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="mb-4">
            <h3 class="text-h4 text-content-primary mb-1">With maxItems=4</h3>
            <p class="text-body-regular text-content-secondary">Shows first, ellipsis, and last 3 items</p>
          </div>
          <AxisBreadcrumb :items="longPath" :max-items="4" separator="chevron" />
        </div>

        <!-- Minimal -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="mb-4">
            <h3 class="text-h4 text-content-primary mb-1">With maxItems=3</h3>
            <p class="text-body-regular text-content-secondary">Shows first, ellipsis, and last 2 items</p>
          </div>
          <AxisBreadcrumb :items="longPath" :max-items="3" separator="chevron" />
        </div>
      </div>
    </section>

    <!-- Current Page -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Current Page Handling</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        The last item represents the current page. It is not clickable and styled differently
        to indicate the user's current location.
      </p>
      <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
        <AxisBreadcrumb :items="basicItems" />
        <p class="mt-4 text-label text-content-tertiary">
          Note: "Property Details" has no href and is styled as the current page (non-clickable, bold text).
        </p>
      </div>
    </section>

    <!-- API Reference -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">API Reference</h2>

      <!-- Props -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-4">Props</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-stroke">
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Prop</th>
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Type</th>
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Default</th>
                <th class="py-3 text-body-regular font-semibold text-content-primary">Description</th>
              </tr>
            </thead>
            <tbody class="text-body-regular text-content-secondary">
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">items</td>
                <td class="py-3 pr-4 font-mono text-label">BreadcrumbItem[]</td>
                <td class="py-3 pr-4">Required</td>
                <td class="py-3">Breadcrumb items from root to current</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">separator</td>
                <td class="py-3 pr-4 font-mono text-label">'slash' | 'chevron' | 'arrow'</td>
                <td class="py-3 pr-4">'slash'</td>
                <td class="py-3">Separator style between items</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">maxItems</td>
                <td class="py-3 pr-4 font-mono text-label">number</td>
                <td class="py-3 pr-4">0 (show all)</td>
                <td class="py-3">Max items to show (uses ellipsis for overflow)</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">showHomeIcon</td>
                <td class="py-3 pr-4 font-mono text-label">boolean</td>
                <td class="py-3 pr-4">false</td>
                <td class="py-3">Show home icon for first item</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- BreadcrumbItem Interface -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-4">BreadcrumbItem Interface</h3>
        <div class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg font-mono text-label">
          <pre class="text-content-secondary">interface BreadcrumbItem {
  label: string       // Display text
  href?: string       // Navigation href (optional for current page)
  icon?: Component    // Optional icon component
}</pre>
        </div>
      </div>
    </section>

    <!-- Usage Examples -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Usage Examples</h2>

      <div class="space-y-6">
        <!-- Basic Usage -->
        <div class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <h3 class="text-h4 text-content-primary mb-3">Basic Usage</h3>
          <pre class="font-mono text-label text-content-secondary overflow-x-auto"><code>&lt;AxisBreadcrumb
  :items="[
    { label: 'Home', href: '/' },
    { label: 'Users', href: '/users' },
    { label: 'John Doe' }
  ]"
/&gt;</code></pre>
        </div>

        <!-- With Separator -->
        <div class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <h3 class="text-h4 text-content-primary mb-3">With Chevron Separator</h3>
          <pre class="font-mono text-label text-content-secondary overflow-x-auto"><code>&lt;AxisBreadcrumb
  :items="breadcrumbItems"
  separator="chevron"
  show-home-icon
/&gt;</code></pre>
        </div>

        <!-- With Max Items -->
        <div class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <h3 class="text-h4 text-content-primary mb-3">With Overflow</h3>
          <pre class="font-mono text-label text-content-secondary overflow-x-auto"><code>&lt;AxisBreadcrumb
  :items="deepHierarchy"
  :max-items="4"
  separator="chevron"
/&gt;</code></pre>
        </div>
      </div>
    </section>

    <!-- Accessibility -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Accessibility</h2>
      <ul class="space-y-3 text-body-regular text-content-secondary">
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Uses <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">&lt;nav&gt;</code> element with <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-label="Breadcrumb"</code>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Ordered list (<code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">&lt;ol&gt;</code>) structure for semantic meaning
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Current page marked with <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-current="page"</code>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Separators hidden from screen readers with <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-hidden="true"</code>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Links are keyboard accessible and have visible focus states
        </li>
      </ul>
    </section>
  </div>
</template>
