<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Axis Design System | 8020",
});

// ============================================
// DESIGN SYSTEM CHAPTER INDEX
// Complete structure following enterprise-grade design system guidelines
// ============================================

interface ChapterItem {
  title: string;
  href: string;
  description: string;
  ready: boolean;
}

interface Chapter {
  number: string;
  name: string;
  description: string;
  items: ChapterItem[];
}

const chapters: Chapter[] = [
  {
    number: "0",
    name: "Introduction",
    description: "Core philosophy, governance, and accessibility standards.",
    items: [
      { title: "Overview", href: "/design-system", description: "Design system introduction and chapter index", ready: true },
      { title: "Design Principles", href: "/design-system/principles", description: "Core principles guiding design decisions", ready: true },
      { title: "Accessibility", href: "/design-system/accessibility", description: "WCAG compliance and inclusive design", ready: true },
      { title: "Governance", href: "/design-system/governance", description: "Contribution and maintenance guidelines", ready: true },
    ],
  },
  {
    number: "1",
    name: "Foundations",
    description: "Core visual tokens that define the design language.",
    items: [
      { title: "Colors", href: "/design-system/colors", description: "Semantic color tokens (11 scales)", ready: true },
      { title: "Typography", href: "/design-system/typography", description: "Font styles for hierarchy (17 styles)", ready: true },
      { title: "Layout & Grid", href: "/design-system/layout", description: "Spacing, grids, responsive patterns", ready: true },
      { title: "Spacing", href: "/design-system/spacing", description: "Margin and padding tokens", ready: true },
      { title: "Shadows", href: "/design-system/shadows", description: "Elevation scale (6 levels)", ready: true },
      { title: "Border Radius", href: "/design-system/border-radius", description: "Corner rounding (10 values)", ready: true },
      { title: "Z-Index", href: "/design-system/z-index", description: "Layering and stacking contexts", ready: true },
      { title: "Breakpoints", href: "/design-system/breakpoints", description: "Responsive breakpoint definitions", ready: true },
    ],
  },
  {
    number: "2",
    name: "Styles",
    description: "Visual styles applied across the platform.",
    items: [
      { title: "Icons", href: "/design-system/icons", description: "Heroicons with consistent sizing", ready: true },
      { title: "Data Formatting", href: "/design-system/data-formatting", description: "Numbers, currency, dates rules", ready: true },
      { title: "Motion", href: "/design-system/motion", description: "Animation and transition guidelines", ready: true },
      { title: "Data Visualization", href: "/design-system/data-visualization", description: "Charts and graph standards", ready: true },
    ],
  },
  {
    number: "3",
    name: "Components",
    description: "Reusable UI building blocks.",
    items: [
      { title: "Buttons", href: "/design-system/components/buttons", description: "Primary, secondary, tertiary variants", ready: true },
      { title: "Inputs", href: "/design-system/components/inputs", description: "Text inputs and textareas", ready: true },
      { title: "Callouts", href: "/design-system/components/callouts", description: "Contextual feedback with accent bar", ready: true },
      { title: "Select", href: "/design-system/components/select", description: "Dropdown select components", ready: true },
      { title: "Checkbox & Radio", href: "/design-system/components/checkbox-radio", description: "Selection controls", ready: true },
      { title: "Toggle", href: "/design-system/components/toggle", description: "Binary on/off switch controls", ready: true },
      { title: "Tables", href: "/design-system/components/tables", description: "Enterprise data tables with sorting, pagination, and selection", ready: true },
      { title: "Star Rating", href: "/design-system/components/star-rating", description: "Interactive 0-5 star scoring for weighted prioritization", ready: true },
      { title: "Slider", href: "/design-system/components/slider", description: "Single-value range slider for numeric selection within bounds", ready: true },
      { title: "Cards", href: "/design-system/components/cards", description: "Versatile containers for grouping content and actions", ready: true },
      { title: "Tags", href: "/design-system/components/tags", description: "Compact labels for status, categories, and metrics display", ready: true },
      { title: "Button Group", href: "/design-system/components/button-group", description: "Grouped toggle buttons for same-screen views and modes", ready: true },
      { title: "Navigation Tab", href: "/design-system/components/navigation-tab", description: "Tab navigation for switching between related content views", ready: true },
      { title: "Breadcrumb", href: "/design-system/components/breadcrumb", description: "Secondary navigation showing user's location in hierarchy", ready: true },
      { title: "Stepper", href: "/design-system/components/stepper", description: "Multi-step progress indicator for wizards and flows", ready: true },
      { title: "Accordion", href: "/design-system/components/accordion", description: "Collapsible sections for FAQs, filters, and progressive disclosure", ready: true },
      { title: "Modals", href: "/design-system/components/modals", description: "Dialog overlays", ready: false },
      { title: "Tooltips", href: "/design-system/components/tooltips", description: "Contextual information", ready: false },
      { title: "Alerts", href: "/design-system/components/alerts", description: "Inline feedback messages", ready: false },
      { title: "Toast", href: "/design-system/components/toast", description: "Transient notifications with auto-dismiss", ready: true },
    ],
  },
  {
    number: "4",
    name: "Patterns",
    description: "Common UI patterns and compositions.",
    items: [
      { title: "Forms", href: "/design-system/patterns/forms", description: "Form layout and validation", ready: false },
      { title: "Navigation", href: "/design-system/patterns/navigation", description: "Navigation patterns", ready: false },
      { title: "Data Tables", href: "/design-system/patterns/data-tables", description: "Complex table patterns", ready: false },
      { title: "Empty States", href: "/design-system/patterns/empty-states", description: "No data experiences", ready: false },
      { title: "Skeleton Loaders", href: "/design-system/patterns/skeleton-loaders", description: "Loading placeholders for improved perceived performance", ready: true },
      { title: "Loading States", href: "/design-system/patterns/loading-states", description: "Loading indicators", ready: false },
      { title: "Error Handling", href: "/design-system/patterns/error-handling", description: "Error display patterns", ready: false },
    ],
  },
  {
    number: "5",
    name: "Development",
    description: "Developer resources and guidelines.",
    items: [
      { title: "Getting Started", href: "/design-system/dev/getting-started", description: "Quick start guide", ready: false },
      { title: "Coding Standards", href: "/design-system/dev/coding-standards", description: "Code style guidelines", ready: false },
      { title: "Component API", href: "/design-system/dev/component-api", description: "Props, events, slots", ready: false },
      { title: "Theming", href: "/design-system/dev/theming", description: "Theme customization", ready: false },
    ],
  },
];

const principles = [
  {
    title: "The Center of Alignment",
    description: "Everything orbits this system. The single source of truth for all 8020 platforms.",
  },
  {
    title: "Multi-Vertical Ready",
    description: "Built to scale from Roofing to REI and future verticals without rebuilding.",
  },
  {
    title: "Space Efficient",
    description: "Maximizes content density for data-heavy interfaces.",
  },
  {
    title: "Accessible",
    description: "WCAG 2.2 AA compliant with proper contrast and keyboard navigation.",
  },
];

// Calculate stats
const totalItems = chapters.reduce((acc, ch) => acc + ch.items.length, 0);
const readyItems = chapters.reduce((acc, ch) => acc + ch.items.filter(i => i.ready).length, 0);
const pendingItems = totalItems - readyItems;
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-page-header">
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-h1-alt text-content-primary">Axis</h1>
        <AxisTag color="main">Design System</AxisTag>
      </div>
      <p class="text-body-large text-content-secondary">
        The center of alignment for all 8020 platforms.
      </p>
    </div>

    <!-- Vision Statement -->
    <div class="docs-section-highlight">
      <div class="max-w-3xl">
        <h2 class="docs-section-title">What is Axis?</h2>
        <p class="text-body-regular text-content-secondary mb-3">
          <strong>Axis</strong> is 8020's next-generation design system built for multi-vertical scalability.
          It serves as the single source of truth that governs how everything is built across Roofing8020,
          8020REI, and future platforms.
        </p>
        <p class="text-body-regular text-content-tertiary mb-3">
          Learning from <strong>Kairo</strong> (our legacy REI design system), Axis is designed from the ground up
          to scale across verticals without rebuilding. What we establish here becomes the foundation
          for every 8020 product.
        </p>
        <div class="flex flex-wrap gap-2">
          <AxisTag color="main" variant="outlined">Roofing8020</AxisTag>
          <AxisTag variant="outlined">8020REI (planned)</AxisTag>
          <AxisTag variant="outlined" disabled>Future Verticals</AxisTag>
        </div>
      </div>
    </div>

    <!-- Important Notice -->
    <div class="docs-section">
      <AxisCallout title="This is the Source of Truth">
        All components and pages MUST follow Axis specifications. These rules define how everything is built, not just documentation.
      </AxisCallout>
    </div>

    <!-- Progress Overview -->
    <div class="docs-section">
      <h2 class="docs-section-title">Documentation Progress</h2>
      <div class="flex flex-wrap gap-4 mb-4">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-main-500"/>
          <span class="text-body-regular text-content-secondary">{{ readyItems }} Ready</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-error-400"/>
          <span class="text-body-regular text-content-secondary">{{ pendingItems }} Pending</span>
        </div>
        <div class="text-body-regular text-content-tertiary">
          {{ totalItems }} total items across {{ chapters.length }} chapters
        </div>
      </div>
      <!-- Progress bar -->
      <div class="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-main-500 rounded-full transition-all"
          :style="{ width: `${(readyItems / totalItems) * 100}%` }"
        />
      </div>
    </div>

    <!-- Principles -->
    <div class="docs-section">
      <h2 class="docs-section-title">Axis Principles</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="principle in principles" :key="principle.title" class="p-3 bg-surface-raised rounded-lg">
          <p class="text-body-regular font-medium text-content-primary">{{ principle.title }}</p>
          <p class="text-label text-content-tertiary mt-1">{{ principle.description }}</p>
        </div>
      </div>
    </div>

    <!-- Chapters Index -->
    <div class="docs-section">
      <h2 class="docs-section-title">Chapter Index</h2>

      <div class="space-y-6">
        <div v-for="chapter in chapters" :key="chapter.number" class="border border-stroke rounded-lg overflow-hidden">
          <!-- Chapter Header -->
          <div class="px-4 py-3 bg-surface-raised border-b border-stroke">
            <div class="flex items-center gap-3">
              <span class="text-h5 text-main-600 dark:text-main-400">{{ chapter.number }}.</span>
              <div>
                <h3 class="text-body-regular font-medium text-content-primary">{{ chapter.name }}</h3>
                <p class="text-label text-content-tertiary">{{ chapter.description }}</p>
              </div>
            </div>
          </div>

          <!-- Chapter Items -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-stroke-subtle">
            <NuxtLink
              v-for="item in chapter.items"
              :key="item.href"
              :to="item.href"
              class="group flex items-start gap-3 p-3 bg-surface-base hover:bg-main-50/30 dark:hover:bg-main-900/20 transition-colors"
            >
              <!-- Status indicator -->
              <span
                :class="[
                  'w-2 h-2 rounded-full mt-1.5 shrink-0',
                  item.ready ? 'bg-main-500' : 'bg-error-400'
                ]"
              />
              <div class="flex-1 min-w-0">
                <p
                  :class="[
                    'text-body-regular font-medium transition-colors',
                    item.ready
                      ? 'text-content-primary group-hover:text-main-700 dark:group-hover:text-main-400'
                      : 'text-content-tertiary group-hover:text-error-600 dark:group-hover:text-error-400'
                  ]"
                >
                  {{ item.title }}
                </p>
                <p class="text-label text-content-tertiary truncate">{{ item.description }}</p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="docs-section-last border-t border-stroke-subtle">
      <div class="flex items-center gap-6 text-label text-content-tertiary">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-main-500"/>
          <span>Ready - Documented and available</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-error-400"/>
          <span>Pending - Not yet documented</span>
        </div>
      </div>
    </div>
  </div>
</template>
