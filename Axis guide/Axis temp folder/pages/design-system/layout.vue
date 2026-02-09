<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Layout & Grid | Design System | 8020",
});

// ============================================
// LAYOUT SPECIFICATION
// This is the source of truth for all layout rules.
// All pages MUST follow these specifications.
// ============================================

const layoutTypes = [
  {
    id: "full-width",
    name: "Full-Width Responsive",
    description: "For data-dense interfaces like dashboards, tables, maps, and analytics. Content expands to fill available width.",
    useCases: ["Dashboards", "Data tables", "Maps & visualizations", "List views", "Analytics screens"],
    contentWidth: "100% (no max-width)",
    behavior: "Content stretches horizontally, grids reflow at breakpoints",
  },
  {
    id: "bounded",
    name: "Bounded Content",
    description: "For focused content like forms, documentation, and settings. Content is centered with a maximum width for readability.",
    useCases: ["Forms & inputs", "Settings pages", "Documentation", "Design system pages", "Onboarding flows"],
    contentWidth: "max-w-5xl (1024px) centered",
    behavior: "Content has fixed max-width, centered in available space",
  },
];

const layoutPrinciples = [
  {
    title: "Maximize Content Space",
    description: "Reduce chrome, increase content. Compact header (48px) and collapsible sidebar (56px/224px).",
    rule: "REQUIRED",
  },
  {
    title: "Flat Sections with Dividers",
    description: "No cards or wrappers. Use horizontal divider lines (border-b border-stroke) between sections.",
    rule: "REQUIRED",
  },
  {
    title: "Consistent Section Padding",
    description: "All sections use px-6 py-4 padding. Tight, uniform spacing throughout.",
    rule: "REQUIRED",
  },
  {
    title: "Dark Mode Support",
    description: "The platform supports both light and dark modes. All components use semantic color tokens that adapt automatically.",
    rule: "REQUIRED",
  },
  {
    title: "Uniform Background Color",
    description: "All page backgrounds must use bg-surface-base for consistency across light and dark modes. Never use bg-surface-sunken for page backgrounds.",
    rule: "REQUIRED",
  },
  {
    title: "Section Header Pattern",
    description: "Section titles (text-h4) must be isolated in their own header bar with border-b border-stroke. Content goes below in a separate area.",
    rule: "REQUIRED",
  },
  {
    title: "Page Header Pattern",
    description: "Non-dashboard pages must have a page header bar with bg-surface-base, border-b border-stroke, and px-6 py-4. Page title uses text-h4.",
    rule: "REQUIRED",
  },
];

const sectionPattern = {
  padding: "px-6 py-4",
  divider: "border-b border-stroke",
  sectionHeader: "text-h4 text-content-primary",
  pageTitle: "text-h4 text-content-primary",
  subtitle: "text-body-regular text-content-secondary",
  pageBackground: "bg-surface-base",
};

// Page structure patterns
const pagePatterns = [
  {
    name: "Dashboard Section",
    description: "Standard section with header bar and content area",
    structure: [
      "Section container: bg-surface-base border-b border-stroke",
      "Header bar: px-6 py-4 border-b border-stroke-subtle with text-h4 title",
      "Content area: p-4 or px-6 py-4",
    ],
    example: `<div class="border-b border-stroke bg-surface-base">
  <div class="flex items-center justify-between px-6 py-4 border-b border-stroke-subtle">
    <h2 class="text-h4 text-content-primary">Section Title</h2>
    <AxisButton variant="outlined" size="sm">Action</AxisButton>
  </div>
  <div class="p-4">
    <!-- Content here -->
  </div>
</div>`,
  },
  {
    name: "Non-Dashboard Page",
    description: "Pages like User Management, Settings, etc.",
    structure: [
      "Page wrapper: min-h-screen bg-surface-base",
      "Page header: bg-surface-base border-b border-stroke px-6 py-4 with text-h4 title",
      "Search/filter bar (if any): bg-surface-base border-b border-stroke px-6 py-4",
      "Content area: p-6",
    ],
    example: `<div class="min-h-screen bg-surface-base">
  <!-- Page Header -->
  <div class="bg-surface-base border-b border-stroke px-6 py-4">
    <h1 class="text-h4 text-content-primary">Page Title</h1>
  </div>

  <!-- Filter Bar (optional) -->
  <div class="bg-surface-base border-b border-stroke px-6 py-4">
    <div class="flex items-center justify-between">
      <AxisInput type="search" placeholder="Search..." />
      <div class="flex gap-3">
        <AxisSelect :options="options" />
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="p-6">
    <!-- Content here -->
  </div>
</div>`,
  },
  {
    name: "Detail Page",
    description: "Pages showing details for a single item (User Detail, Property Detail)",
    structure: [
      "Page wrapper: min-h-screen bg-surface-base",
      "Back navigation: bg-surface-base border-b border-stroke px-6 py-3",
      "Page header: bg-surface-base border-b border-stroke px-6 py-4 with text-h4 title",
      "Content area: p-6 with grid layout",
    ],
    example: `<div class="min-h-screen bg-surface-base">
  <!-- Back Navigation -->
  <div class="bg-surface-base border-b border-stroke px-6 py-3">
    <AxisButton variant="ghost" size="sm" :icon-left="ArrowLeftIcon">
      Back to List
    </AxisButton>
  </div>

  <!-- Page Header -->
  <div class="bg-surface-base border-b border-stroke px-6 py-4">
    <h1 class="text-h4 text-content-primary">Item Name</h1>
  </div>

  <!-- Content -->
  <div class="p-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Sidebar card -->
      <div class="lg:col-span-1">
        <div class="bg-surface-base border border-stroke rounded-lg p-6">
          <!-- Info card content -->
        </div>
      </div>
      <!-- Main content -->
      <div class="lg:col-span-2">
        <!-- Form sections -->
      </div>
    </div>
  </div>
</div>`,
  },
];

const spacingScale = [
  { name: "1", value: "4px", class: "p-1", usage: "Icon gaps, tight spacing" },
  { name: "2", value: "8px", class: "p-2", usage: "Small gaps between items" },
  { name: "3", value: "12px", class: "p-3 / mb-3", usage: "Section header margin" },
  { name: "4", value: "16px", class: "p-4 / py-4", usage: "Section vertical padding" },
  { name: "6", value: "24px", class: "p-6 / px-6", usage: "Section horizontal padding" },
  { name: "8", value: "32px", class: "p-8", usage: "Large separations" },
];

const layoutZones = [
  {
    name: "Header",
    dimension: "h-12 (48px)",
    classes: "fixed top-0 left-0 right-0 z-50",
    theme: "bg-surface-base, border-stroke-subtle",
    description: "Compact fixed header with logo, search, user menu",
  },
  {
    name: "Sidebar (collapsed)",
    dimension: "w-14 (56px)",
    classes: "fixed left-0 top-12 bottom-0",
    theme: "bg-surface-base, border-stroke-subtle",
    description: "Icons only, tooltip labels on hover",
  },
  {
    name: "Sidebar (expanded)",
    dimension: "w-56 (224px)",
    classes: "fixed left-0 top-12 bottom-0",
    theme: "bg-surface-base, border-stroke-subtle",
    description: "Icons with text labels, expandable submenus",
  },
  {
    name: "Content",
    dimension: "pl-14 / pl-56",
    classes: "pt-12 min-h-screen transition-all",
    theme: "bg-surface-base or bg-surface-raised",
    description: "Main area, left padding responds to sidebar state",
  },
];

const breakpoints = [
  { name: "sm", width: "640px", usage: "Mobile landscape", sidebarState: "Hidden or collapsed" },
  { name: "md", width: "768px", usage: "Tablets", sidebarState: "Collapsed (icons only)" },
  { name: "lg", width: "1024px", usage: "Desktop", sidebarState: "User preference (default: collapsed)" },
  { name: "xl", width: "1280px", usage: "Large desktop", sidebarState: "User preference" },
  { name: "2xl", width: "1536px", usage: "Extra large screens", sidebarState: "User preference" },
];

const contentWidthOptions = [
  {
    class: "max-w-5xl mx-auto",
    width: "1024px",
    usage: "Forms, settings, documentation, design system",
    layoutType: "Bounded Content",
  },
  {
    class: "max-w-prose mx-auto",
    width: "65ch (~585px)",
    usage: "Long-form text, articles, help content",
    layoutType: "Bounded Content",
  },
  {
    class: "w-full (no max-width)",
    width: "100%",
    usage: "Dashboards, data tables, maps, analytics",
    layoutType: "Full-Width Responsive",
  },
];

const copiedValue = ref<string | null>(null);

const copyToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    copiedValue.value = value;
    setTimeout(() => {
      copiedValue.value = null;
    }, 1500);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Layout & Grid</h1>
      <p class="text-body-regular text-content-secondary">
        Structural patterns for organizing content. These rules are the source of truth for all page layouts.
      </p>
    </div>

    <!-- Important Notice -->
    <div class="docs-section">
      <AxisCallout title="This is the Source of Truth">
        All pages and components MUST follow these layout specifications. This is not just documentation - these are the rules that govern how everything is built in this platform.
      </AxisCallout>
    </div>

    <!-- Layout Types -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Layout Types</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Two layout types are available. Choose based on the content being displayed.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          v-for="layout in layoutTypes"
          :key="layout.id"
          class="bg-surface-base border border-stroke rounded-lg overflow-hidden"
        >
          <!-- Visual Preview -->
          <div class="h-40 bg-surface-raised p-4 border-b border-stroke">
            <!-- Full-width preview -->
            <div v-if="layout.id === 'full-width'" class="h-full border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800">
              <div class="h-6 border-b border-neutral-100 dark:border-neutral-700 px-2 flex items-center gap-2">
                <div class="w-16 h-2 bg-neutral-200 dark:bg-neutral-600 rounded"/>
              </div>
              <div class="p-2 grid grid-cols-3 gap-2 h-[calc(100%-24px)]">
                <div class="bg-neutral-100 dark:bg-neutral-700 rounded"/>
                <div class="bg-neutral-100 dark:bg-neutral-700 rounded"/>
                <div class="bg-neutral-100 dark:bg-neutral-700 rounded"/>
              </div>
            </div>
            <!-- Bounded preview -->
            <div v-else class="h-full flex justify-center">
              <div class="w-3/5 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800">
                <div class="h-6 border-b border-neutral-100 dark:border-neutral-700 px-2 flex items-center gap-2">
                  <div class="w-16 h-2 bg-neutral-200 dark:bg-neutral-600 rounded"/>
                </div>
                <div class="p-2 space-y-2">
                  <div class="h-3 bg-neutral-100 dark:bg-neutral-700 rounded w-full"/>
                  <div class="h-3 bg-neutral-100 dark:bg-neutral-700 rounded w-4/5"/>
                  <div class="h-3 bg-neutral-100 dark:bg-neutral-700 rounded w-full"/>
                </div>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4">
            <h3 class="text-h4 text-content-primary">{{ layout.name }}</h3>
            <p class="text-label text-content-secondary mt-1">{{ layout.description }}</p>

            <div class="mt-3 space-y-2">
              <div class="flex items-start gap-2">
                <span class="text-suggestion-bold text-content-tertiary uppercase w-20 shrink-0">Width:</span>
                <code class="text-label text-main-600 dark:text-main-400">{{ layout.contentWidth }}</code>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-suggestion-bold text-content-tertiary uppercase w-20 shrink-0">Behavior:</span>
                <span class="text-label text-content-primary">{{ layout.behavior }}</span>
              </div>
            </div>

            <div class="mt-3">
              <span class="text-suggestion-bold text-content-tertiary uppercase">Use for:</span>
              <div class="flex flex-wrap gap-1.5 mt-1">
                <span
                  v-for="useCase in layout.useCases"
                  :key="useCase"
                  class="px-2 py-0.5 text-suggestion-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded"
                >
                  {{ useCase }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Layout Principles -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Layout Principles</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        These principles apply to ALL layouts regardless of type.
      </p>
      <div class="space-y-3">
        <div
          v-for="principle in layoutPrinciples"
          :key="principle.title"
          class="flex gap-3 p-3 bg-surface-raised rounded-lg"
        >
          <span class="px-2 py-0.5 h-fit text-suggestion-bold bg-main-100 dark:bg-main-900 text-main-700 dark:text-main-300 rounded uppercase">
            {{ principle.rule }}
          </span>
          <div>
            <p class="text-body-regular font-medium text-content-primary">{{ principle.title }}</p>
            <p class="text-label text-content-secondary">{{ principle.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Pattern -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Section Pattern</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Standard pattern for page sections. Each section uses consistent padding with horizontal dividers.
      </p>

      <!-- Code Example -->
      <div class="bg-surface-raised rounded-lg p-4  text-label">
        <div class="text-content-tertiary">&lt;!-- Section with divider --&gt;</div>
        <div class="text-content-primary">
          &lt;div class="<span class="text-main-600">px-6 py-4 border-b border-neutral-100</span>"&gt;
        </div>
        <div class="text-content-primary pl-4">
          &lt;h2 class="<span class="text-main-600">text-h4 text-neutral-800 mb-3</span>"&gt;Section Title&lt;/h2&gt;
        </div>
        <div class="text-content-primary pl-4">&lt;!-- Section content --&gt;</div>
        <div class="text-content-primary">&lt;/div&gt;</div>
        <div class="mt-3 text-content-tertiary">&lt;!-- Last section (no bottom border) --&gt;</div>
        <div class="text-content-primary">&lt;div class="<span class="text-main-600">px-6 py-4</span>"&gt;</div>
        <div class="text-content-primary pl-4">&lt;!-- Content --&gt;</div>
        <div class="text-content-primary">&lt;/div&gt;</div>
      </div>

      <!-- Pattern Classes -->
      <div class="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3">
        <button
          v-for="(value, key) in sectionPattern"
          :key="key"
          class="relative text-left p-2 rounded bg-surface-base border border-stroke hover:bg-surface-raised transition-colors"
          @click="copyToClipboard(value)"
        >
          <p class="text-suggestion text-content-tertiary uppercase">{{ key }}</p>
          <code class="text-label text-main-600 dark:text-main-400">{{ value }}</code>
          <span v-if="copiedValue === value" class="absolute -top-4 left-0 text-suggestion-bold text-main-500">
            Copied!
          </span>
        </button>
      </div>
    </div>

    <!-- Page Patterns -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Page Structure Patterns</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Standard patterns for different page types. All pages must follow one of these patterns.
      </p>

      <AxisCallout type="warning" title="Mandatory - All Pages Must Follow">
        Every page in the platform must follow one of these structural patterns. Inconsistent layouts break visual coherence.
      </AxisCallout>

      <div class="mt-6 space-y-6">
        <div
          v-for="pattern in pagePatterns"
          :key="pattern.name"
          class="bg-surface-base border border-stroke rounded-lg overflow-hidden"
        >
          <!-- Pattern Header -->
          <div class="px-4 py-3 border-b border-stroke bg-surface-raised">
            <h3 class="text-h5 text-content-primary">{{ pattern.name }}</h3>
            <p class="text-label text-content-secondary mt-1">{{ pattern.description }}</p>
          </div>

          <!-- Structure List -->
          <div class="px-4 py-3 border-b border-stroke">
            <p class="text-label-bold text-content-tertiary uppercase mb-2">Structure</p>
            <ul class="space-y-1">
              <li
                v-for="(item, index) in pattern.structure"
                :key="index"
                class="flex items-start gap-2 text-label text-content-secondary"
              >
                <span class="text-main-500 mt-0.5">{{ index + 1 }}.</span>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>

          <!-- Code Example -->
          <div class="px-4 py-3">
            <p class="text-label-bold text-content-tertiary uppercase mb-2">Example Code</p>
            <pre class="bg-neutral-900 text-neutral-100 p-3 rounded-lg text-label overflow-x-auto"><code>{{ pattern.example }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Page Structure -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Page Structure</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        The application shell consists of a fixed header, collapsible sidebar, and main content area. All elements use light theme.
      </p>

      <!-- Visual Layout Diagram -->
      <div class="bg-surface-base border border-stroke rounded-lg overflow-hidden mb-4" style="height: 280px">
        <!-- Header -->
        <div class="h-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-3 gap-3">
          <div class="w-5 h-5 bg-main-500 rounded"/>
          <div class="flex-1 h-6 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded max-w-xs"/>
          <div class="w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full"/>
        </div>

        <div class="flex" style="height: calc(100% - 40px)">
          <!-- Sidebar -->
          <div class="w-12 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 flex flex-col py-2 gap-1">
            <div
              v-for="i in 5"
              :key="i"
              class="mx-1.5 h-8 rounded flex items-center justify-center"
              :class="i === 1 ? 'bg-main-50 dark:bg-main-950' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'"
            >
              <div class="w-4 h-4 rounded" :class="i === 1 ? 'bg-main-500' : 'bg-neutral-300 dark:bg-neutral-600'"/>
            </div>
          </div>

          <!-- Content Area -->
          <div class="flex-1 bg-neutral-50 dark:bg-neutral-950">
            <!-- Section 1 -->
            <div class="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
              <div class="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-1"/>
              <div class="h-3 w-48 bg-neutral-100 dark:bg-neutral-800 rounded"/>
            </div>
            <!-- Section 2 -->
            <div class="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
              <div class="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"/>
              <div class="flex gap-2">
                <div class="h-12 flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded"/>
                <div class="h-12 flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded"/>
                <div class="h-12 flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded"/>
              </div>
            </div>
            <!-- Section 3 -->
            <div class="px-3 py-2 bg-white dark:bg-neutral-900">
              <div class="h-3 w-20 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"/>
              <div class="h-16 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded"/>
            </div>
          </div>
        </div>
      </div>

      <!-- Layout Zones Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Zone</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Dimension</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Classes</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Theme</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="zone in layoutZones" :key="zone.name">
              <td class="py-2 pr-4 text-body-regular text-content-primary font-medium">{{ zone.name }}</td>
              <td class="py-2 pr-4 text-label text-content-secondary ">{{ zone.dimension }}</td>
              <td class="py-2 pr-4 text-label text-main-600 dark:text-main-400">{{ zone.classes }}</td>
              <td class="py-2 pr-4 text-label text-content-secondary">{{ zone.theme }}</td>
              <td class="py-2 text-label text-content-secondary">{{ zone.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Content Width Guidelines -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Content Width Guidelines</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Choose the appropriate width based on content type and layout type.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Class</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Width</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Layout Type</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Use For</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="option in contentWidthOptions" :key="option.class">
              <td class="py-2 pr-4">
                <code class="text-label text-main-600 dark:text-main-400">{{ option.class }}</code>
              </td>
              <td class="py-2 pr-4 text-label text-content-secondary ">{{ option.width }}</td>
              <td class="py-2 pr-4">
                <span
                  class="px-2 py-0.5 text-suggestion-bold rounded"
                  :class="
                    option.layoutType === 'Full-Width Responsive'
                      ? 'bg-accent-1-100 dark:bg-accent-1-900 text-accent-1-700 dark:text-accent-1-300'
                      : 'bg-accent-2-100 dark:bg-accent-2-900 text-accent-2-700 dark:text-accent-2-300'
                  "
                >
                  {{ option.layoutType }}
                </span>
              </td>
              <td class="py-2 text-label text-content-secondary">{{ option.usage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Spacing Scale -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Spacing Scale</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Consistent spacing values used throughout the platform.
      </p>
      <div class="grid grid-cols-6 gap-2">
        <div v-for="space in spacingScale" :key="space.name" class="text-center">
          <div class="flex items-end justify-center h-10 mb-1">
            <div class="bg-main-500 rounded-sm" :style="{ width: space.value, height: space.value }"/>
          </div>
          <p class="text-label font-medium text-content-primary">{{ space.name }}</p>
          <p class="text-suggestion text-content-tertiary">{{ space.value }}</p>
          <code class="text-suggestion text-content-tertiary ">{{ space.class }}</code>
        </div>
      </div>
    </div>

    <!-- Sidebar Behavior -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Sidebar Behavior</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <p class="text-body-regular font-medium text-content-primary mb-2">Collapsed State (56px)</p>
          <ul class="space-y-1 text-body-regular text-content-secondary">
            <li class="flex items-center gap-2">
              <div class="w-1 h-1 bg-neutral-400 rounded-full"/>
              Icons only, no labels
            </li>
            <li class="flex items-center gap-2">
              <div class="w-1 h-1 bg-neutral-400 rounded-full"/>
              Tooltip shows label on hover
            </li>
            <li class="flex items-center gap-2">
              <div class="w-1 h-1 bg-neutral-400 rounded-full"/>
              Click parent item expands sidebar + navigates
            </li>
            <li class="flex items-center gap-2">
              <div class="w-1 h-1 bg-neutral-400 rounded-full"/>
              Content area uses <code class="text-main-600 dark:text-main-400 text-label">pl-14</code>
            </li>
          </ul>
        </div>
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <p class="text-body-regular font-medium text-content-primary mb-2">Expanded State (208px)</p>
          <ul class="space-y-1 text-body-regular text-content-secondary">
            <li class="flex items-center gap-2">
              <div class="w-1 h-1 bg-neutral-400 rounded-full"/>
              Icons with text labels
            </li>
            <li class="flex items-center gap-2">
              <div class="w-1 h-1 bg-neutral-400 rounded-full"/>
              Submenus expand inline
            </li>
            <li class="flex items-center gap-2">
              <div class="w-1 h-1 bg-neutral-400 rounded-full"/>
              Click parent toggles submenu
            </li>
            <li class="flex items-center gap-2">
              <div class="w-1 h-1 bg-neutral-400 rounded-full"/>
              Content area uses <code class="text-main-600 dark:text-main-400 text-label">pl-56</code>
            </li>
          </ul>
        </div>
      </div>
      <AxisCallout type="info" class="mt-4">
        Sidebar state is global via
        <code class="bg-info-100 dark:bg-info-900 px-1 rounded text-label">useState("sidebar-expanded")</code>.
        Layouts and components share this state for responsive content positioning.
      </AxisCallout>
    </div>

    <!-- Responsive Breakpoints -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-3">Responsive Breakpoints</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Standard Tailwind breakpoints with sidebar behavior at each size.
        See <NuxtLink to="/design-system/breakpoints" class="text-accent-1-600 hover:text-accent-1-700 underline">Responsiveness</NuxtLink> for full documentation.
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Breakpoint</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Min Width</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Device</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Sidebar State</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="bp in breakpoints" :key="bp.name">
              <td class="py-2 pr-4">
                <code class="text-h5 text-main-600">{{ bp.name }}</code>
              </td>
              <td class="py-2 pr-4 text-label text-content-secondary">{{ bp.width }}</td>
              <td class="py-2 pr-4 text-label text-content-primary">{{ bp.usage }}</td>
              <td class="py-2 text-label text-content-secondary">{{ bp.sidebarState }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
