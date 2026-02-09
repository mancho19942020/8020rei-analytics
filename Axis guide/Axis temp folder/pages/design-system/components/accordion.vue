<script setup lang="ts">
import { FunnelIcon } from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Accordion | Components | Design System | 8020",
});

// ============================================
// ACCORDION SPECIFICATION - AXIS DESIGN SYSTEM
// Source of truth - NO EXCEPTIONS
// ============================================

// Track copy state
const copiedCode = ref<string | null>(null);

const copyToClipboard = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code);
    copiedCode.value = code;
    setTimeout(() => {
      copiedCode.value = null;
    }, 1500);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

// Demo state
const singleDemo = ref<string | null>("section-1");
const multipleDemo = ref<string[]>(["filter-1"]);
const nestedDemo = ref<string[]>(["category-1"]);

// Code examples
const codeExamples = {
  basic: `<AxisAccordion>
  <AxisAccordionItem title="What is 8020?">
    8020 is a real estate data platform providing access to property records,
    owner information, and market analytics.
  </AxisAccordionItem>
  <AxisAccordionItem title="How do I get started?">
    Sign in with your Google account and you'll have immediate access to
    explore properties in your assigned counties.
  </AxisAccordionItem>
  <AxisAccordionItem title="What data is available?">
    Property details, ownership records, market values, and comprehensive
    analytics for your subscribed regions.
  </AxisAccordionItem>
</AxisAccordion>`,
  single: `<AxisAccordion v-model="selectedSection">
  <AxisAccordionItem id="section-1" title="Account Settings">
    Update your profile, email, and notification preferences.
  </AxisAccordionItem>
  <AxisAccordionItem id="section-2" title="Billing">
    Manage your subscription and payment methods.
  </AxisAccordionItem>
  <AxisAccordionItem id="section-3" title="Security">
    Two-factor authentication and connected devices.
  </AxisAccordionItem>
</AxisAccordion>`,
  multiple: `<AxisAccordion v-model="openSections" multiple>
  <AxisAccordionItem id="section-1" title="Account Settings">
    Update your profile, email, and notification preferences.
  </AxisAccordionItem>
  <AxisAccordionItem id="section-2" title="Billing">
    Manage your subscription and payment methods.
  </AxisAccordionItem>
  <AxisAccordionItem id="section-3" title="Security">
    Two-factor authentication and connected devices.
  </AxisAccordionItem>
</AxisAccordion>`,
  twoRow: `<AxisAccordion>
  <AxisAccordionItem
    title="Property Type"
    subtitle="Residential, commercial, and land parcels"
  >
    <AxisCheckbox label="Single Family" />
    <AxisCheckbox label="Multi-Family" />
    <AxisCheckbox label="Commercial" />
  </AxisAccordionItem>
  <AxisAccordionItem
    title="Price Range"
    subtitle="Filter by market value or assessed value"
  >
    <AxisInput type="number" label="Min Value" />
    <AxisInput type="number" label="Max Value" />
  </AxisAccordionItem>
</AxisAccordion>`,
  nested: `<AxisAccordion v-model="openFilters" multiple>
  <AxisAccordionItem id="category-1" title="Property Filters" :level="1">
    <AxisAccordion>
      <AxisAccordionItem title="Type" :level="2">
        <AxisCheckbox label="Single Family" />
        <AxisCheckbox label="Multi-Family" />
      </AxisAccordionItem>
      <AxisAccordionItem title="Size" :level="2">
        <AxisInput type="number" label="Min sq ft" />
      </AxisAccordionItem>
    </AxisAccordion>
  </AxisAccordionItem>
  <AxisAccordionItem id="category-2" title="Location Filters" :level="1">
    <AxisAccordion>
      <AxisAccordionItem title="County" :level="2">
        <AxisCheckbox label="Los Angeles" />
        <AxisCheckbox label="Orange County" />
      </AxisAccordionItem>
    </AxisAccordion>
  </AxisAccordionItem>
</AxisAccordion>`,
  filters: `<AxisAccordion v-model="activeFilters" multiple>
  <AxisAccordionItem id="property-filters" title="Property Filters">
    <div class="space-y-3">
      <AxisCheckbox v-model="filters.singleFamily" label="Single Family" />
      <AxisCheckbox v-model="filters.multiFamily" label="Multi-Family" />
      <AxisCheckbox v-model="filters.commercial" label="Commercial" />
    </div>
  </AxisAccordionItem>
  <AxisAccordionItem id="price-filters" title="Price Range">
    <div class="space-y-3">
      <AxisInput v-model="filters.minPrice" type="number" label="Min Price" />
      <AxisInput v-model="filters.maxPrice" type="number" label="Max Price" />
    </div>
  </AxisAccordionItem>
  <AxisAccordionItem id="location-filters" title="Location">
    <AxisSelect
      v-model="filters.county"
      :options="countyOptions"
      label="County"
      multiple
    />
  </AxisAccordionItem>
</AxisAccordion>`,
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Accordion</h1>
      <p class="text-body-regular text-content-secondary">
        Collapsible content sections for organizing filters, FAQs, settings panels, and progressive disclosure of information.
      </p>
    </div>

    <!-- Overview -->
    <div class="docs-section-highlight">
      <h2 class="text-h4 text-content-primary mb-2">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Accordions allow users to expand and collapse content sections, revealing details only when needed.
        They're ideal for managing large amounts of content in a compact space, such as filter panels,
        FAQ sections, or settings interfaces.
      </p>
      <AxisAccordion v-model="singleDemo">
        <AxisAccordionItem id="section-1" title="What is an accordion?">
          An accordion is a vertically stacked list of items. Each item can be expanded or
          collapsed to reveal the content associated with that item.
        </AxisAccordionItem>
        <AxisAccordionItem id="section-2" title="When should I use it?">
          Use accordions to organize related information into collapsible sections. They're
          particularly useful for FAQs, filter panels, and settings pages.
        </AxisAccordionItem>
        <AxisAccordionItem id="section-3" title="Is it accessible?">
          Yes! The Axis accordion follows WCAG accessibility guidelines with proper ARIA
          attributes and full keyboard navigation support.
        </AxisAccordionItem>
      </AxisAccordion>
    </div>

    <!-- MANDATORY RULE Notice -->
    <div class="docs-section">
      <AxisCallout type="warning" title="Mandatory Rule - No Exceptions">
        All collapsible/expandable sections in the platform MUST use the <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">AxisAccordion</code> and <code class="bg-alert-100 dark:bg-alert-900 px-1 rounded">AxisAccordionItem</code> components.
        Custom collapsible patterns are <strong>strictly prohibited</strong>.
      </AxisCallout>
    </div>

    <!-- ============================================ -->
    <!-- VARIANTS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Variants</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Two behavior modes determine how many sections can be open simultaneously.
      </p>

      <div class="space-y-6">
        <!-- Single -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Single (Default)</h3>
              <p class="text-label text-content-secondary">Only one item can be open at a time. Opening a new item closes the currently open one.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary shrink-0">default</code>
          </div>
          <AxisAccordion v-model="singleDemo">
            <AxisAccordionItem id="section-1" title="Account Settings">
              Update your profile, email, and notification preferences.
            </AxisAccordionItem>
            <AxisAccordionItem id="section-2" title="Billing">
              Manage your subscription and payment methods.
            </AxisAccordionItem>
            <AxisAccordionItem id="section-3" title="Security">
              Two-factor authentication and connected devices.
            </AxisAccordionItem>
          </AxisAccordion>
        </div>

        <!-- Multiple -->
        <div class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">Multiple</h3>
              <p class="text-label text-content-secondary">Multiple items can be open simultaneously. Best for filter panels and comparison views.</p>
            </div>
            <code class="text-label bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded text-content-secondary shrink-0">multiple</code>
          </div>
          <AxisAccordion v-model="multipleDemo" multiple>
            <AxisAccordionItem id="filter-1" title="Property Type">
              <div class="space-y-2">
                <AxisCheckbox label="Single Family" />
                <AxisCheckbox label="Multi-Family" />
                <AxisCheckbox label="Commercial" />
              </div>
            </AxisAccordionItem>
            <AxisAccordionItem id="filter-2" title="Price Range">
              <div class="space-y-3">
                <AxisInput type="number" label="Min Value" placeholder="$0" />
                <AxisInput type="number" label="Max Value" placeholder="$1,000,000" />
              </div>
            </AxisAccordionItem>
            <AxisAccordionItem id="filter-3" title="Location">
              <div class="space-y-2">
                <AxisCheckbox label="Los Angeles County" />
                <AxisCheckbox label="Orange County" />
                <AxisCheckbox label="San Diego County" />
              </div>
            </AxisAccordionItem>
          </AxisAccordion>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- TWO-ROW VARIANT -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Two-Row Variant</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Add a subtitle to provide additional context or description for each item.
      </p>

      <div class="p-4 bg-surface-base border border-stroke rounded-lg">
        <AxisAccordion>
          <AxisAccordionItem
            title="Property Filters"
            subtitle="Filter by type, size, and features"
          >
            <div class="space-y-2">
              <AxisCheckbox label="Single Family" />
              <AxisCheckbox label="Multi-Family" />
              <AxisCheckbox label="Pool" />
            </div>
          </AxisAccordionItem>
          <AxisAccordionItem
            title="Price Range"
            subtitle="Market value or assessed value"
          >
            <div class="space-y-3">
              <AxisInput type="number" label="Min Value" />
              <AxisInput type="number" label="Max Value" />
            </div>
          </AxisAccordionItem>
          <AxisAccordionItem
            title="Location"
            subtitle="County and zip code filters"
          >
            <div class="space-y-2">
              <AxisCheckbox label="Los Angeles County" />
              <AxisCheckbox label="Orange County" />
            </div>
          </AxisAccordionItem>
        </AxisAccordion>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- NESTING LEVELS -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Nesting Levels</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Accordions support up to 3 levels of nesting with progressive left padding. Use the <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">level</code> prop (1-3) to control visual hierarchy.
      </p>

      <div class="p-4 bg-surface-base border border-stroke rounded-lg">
        <AxisAccordion v-model="nestedDemo" multiple>
          <AxisAccordionItem id="category-1" title="Property Filters" :level="1">
            <AxisAccordion>
              <AxisAccordionItem title="Type" :level="2">
                <div class="space-y-2">
                  <AxisCheckbox label="Single Family" />
                  <AxisCheckbox label="Multi-Family" />
                  <AxisCheckbox label="Commercial" />
                </div>
              </AxisAccordionItem>
              <AxisAccordionItem title="Features" :level="2">
                <div class="space-y-2">
                  <AxisCheckbox label="Pool" />
                  <AxisCheckbox label="Garage" />
                  <AxisCheckbox label="Fireplace" />
                </div>
              </AxisAccordionItem>
              <AxisAccordionItem title="Size" :level="2">
                <AxisAccordion>
                  <AxisAccordionItem title="Square Footage" :level="3">
                    <div class="space-y-2">
                      <AxisInput type="number" label="Min sq ft" size="sm" />
                      <AxisInput type="number" label="Max sq ft" size="sm" />
                    </div>
                  </AxisAccordionItem>
                  <AxisAccordionItem title="Lot Size" :level="3">
                    <div class="space-y-2">
                      <AxisInput type="number" label="Min acres" size="sm" />
                      <AxisInput type="number" label="Max acres" size="sm" />
                    </div>
                  </AxisAccordionItem>
                </AxisAccordion>
              </AxisAccordionItem>
            </AxisAccordion>
          </AxisAccordionItem>
          <AxisAccordionItem id="category-2" title="Location Filters" :level="1">
            <AxisAccordion>
              <AxisAccordionItem title="County" :level="2">
                <div class="space-y-2">
                  <AxisCheckbox label="Los Angeles" />
                  <AxisCheckbox label="Orange County" />
                </div>
              </AxisAccordionItem>
              <AxisAccordionItem title="Zip Code" :level="2">
                <div class="space-y-2">
                  <AxisInput label="Zip Code" placeholder="90210" size="sm" />
                </div>
              </AxisAccordionItem>
            </AxisAccordion>
          </AxisAccordionItem>
        </AxisAccordion>
      </div>

      <div class="mt-4 p-3 bg-info-50 dark:bg-info-950 border border-info-200 dark:border-info-800 rounded-lg">
        <p class="text-label text-info-800 dark:text-info-300">
          <strong>Visual Hierarchy:</strong> Level 1 has 12px left padding, Level 2 has 24px, and Level 3 has 36px.
          This progressive indentation creates clear visual hierarchy.
        </p>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- DISABLED STATE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Disabled State</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Disable specific accordion items to prevent interaction.
      </p>

      <div class="p-4 bg-surface-base border border-stroke rounded-lg">
        <AxisAccordion>
          <AxisAccordionItem title="Available Feature">
            This feature is available to all users.
          </AxisAccordionItem>
          <AxisAccordionItem title="Premium Feature" disabled>
            This feature requires a premium subscription.
          </AxisAccordionItem>
          <AxisAccordionItem title="Another Available Feature">
            This feature is also available to all users.
          </AxisAccordionItem>
        </AxisAccordion>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- USAGE GUIDELINES -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Usage Guidelines</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Do's -->
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use for organizing related content into collapsible sections</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Keep section titles concise and descriptive</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use multiple mode for filter panels where users may want to view multiple categories</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use single mode for FAQs and settings where one section at a time makes sense</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Add subtitles to provide helpful context</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Nest more than 3 levels deep - it becomes hard to navigate</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Put critical information that should always be visible in accordions</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use accordions for navigation - use tabs or links instead</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use overly long section titles - keep them scannable</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Have only one or two items - accordions work best with 3+ sections</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- WHEN TO USE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">When to Use</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Scenario</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Mode</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Why</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Filter panels</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">multiple</code></td>
              <td class="py-3 text-label">Users often need to see and adjust multiple filter categories</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">FAQ sections</td>
              <td class="py-3 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300">single</code></td>
              <td class="py-3 text-label">Users typically read one question/answer at a time</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Settings panels</td>
              <td class="py-3 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300">single</code></td>
              <td class="py-3 text-label">Reduces cognitive load by showing one settings category at a time</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Data comparison</td>
              <td class="py-3 pr-4"><code class="text-label bg-success-100 dark:bg-success-900 px-1.5 py-0.5 rounded text-success-700 dark:text-success-300">multiple</code></td>
              <td class="py-3 text-label">Users need to compare information across multiple sections</td>
            </tr>
            <tr>
              <td class="py-3 pr-4">Help documentation</td>
              <td class="py-3 pr-4"><code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300">single</code></td>
              <td class="py-3 text-label">Maintains focus on one topic at a time</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- REAL-WORLD EXAMPLE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Real-World Example: Filter Panel</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        This example demonstrates how accordions are used in property search filters across the platform.
      </p>

      <div class="p-4 bg-surface-base border border-stroke rounded-lg">
        <div class="flex items-center gap-2 mb-4">
          <FunnelIcon class="w-5 h-5 text-content-secondary" />
          <h3 class="text-body-regular font-medium text-content-primary">Property Filters</h3>
        </div>
        <AxisAccordion multiple>
          <AxisAccordionItem
            title="Property Type"
            subtitle="Residential, commercial, and land"
          >
            <div class="space-y-2">
              <AxisCheckbox label="Single Family" />
              <AxisCheckbox label="Multi-Family" />
              <AxisCheckbox label="Commercial" />
              <AxisCheckbox label="Land/Lot" />
              <AxisCheckbox label="Mobile Home" />
            </div>
          </AxisAccordionItem>
          <AxisAccordionItem
            title="Price Range"
            subtitle="Market value in USD"
          >
            <div class="space-y-3">
              <AxisInput type="number" label="Min Value" placeholder="$0" />
              <AxisInput type="number" label="Max Value" placeholder="$5,000,000" />
            </div>
          </AxisAccordionItem>
          <AxisAccordionItem
            title="Location"
            subtitle="County and city filters"
          >
            <div class="space-y-3">
              <div class="space-y-2">
                <AxisCheckbox label="Los Angeles County" />
                <AxisCheckbox label="Orange County" />
                <AxisCheckbox label="San Diego County" />
              </div>
            </div>
          </AxisAccordionItem>
          <AxisAccordionItem
            title="Property Features"
            subtitle="Size, bedrooms, and amenities"
          >
            <div class="space-y-3">
              <AxisInput type="number" label="Min Bedrooms" placeholder="1" />
              <AxisInput type="number" label="Min Bathrooms" placeholder="1" />
              <div class="space-y-2">
                <AxisCheckbox label="Pool" />
                <AxisCheckbox label="Garage" />
                <AxisCheckbox label="Fireplace" />
              </div>
            </div>
          </AxisAccordionItem>
        </AxisAccordion>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- API REFERENCE -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">API Reference</h2>

      <!-- AxisAccordion Props -->
      <h3 class="text-body-regular font-medium text-content-primary mb-2">AxisAccordion Props</h3>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Prop</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Type</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Default</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">v-model</code></td>
              <td class="py-2 pr-4 text-label">string | string[] | null</td>
              <td class="py-2 pr-4 text-label">null</td>
              <td class="py-2 text-label">ID(s) of currently open item(s)</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">multiple</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Allow multiple items to be open simultaneously</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- AxisAccordionItem Props -->
      <h3 class="text-body-regular font-medium text-content-primary mb-2">AxisAccordionItem Props</h3>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Prop</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Type</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Default</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">id</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">auto-generated</td>
              <td class="py-2 text-label">Unique identifier for the item (required for v-model)</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">title</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">required</td>
              <td class="py-2 text-label">Item title/heading text</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">subtitle</code></td>
              <td class="py-2 pr-4 text-label">string</td>
              <td class="py-2 pr-4 text-label">''</td>
              <td class="py-2 text-label">Optional subtitle for two-row variant</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">level</code></td>
              <td class="py-2 pr-4 text-label">1 | 2 | 3</td>
              <td class="py-2 pr-4 text-label">1</td>
              <td class="py-2 text-label">Nesting level (controls left padding)</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">disabled</code></td>
              <td class="py-2 pr-4 text-label">boolean</td>
              <td class="py-2 pr-4 text-label">false</td>
              <td class="py-2 text-label">Disable the item</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Slots -->
      <h3 class="text-body-regular font-medium text-content-primary mb-2">Slots</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Slot</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Component</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-secondary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">default</code></td>
              <td class="py-2 pr-4 text-label">AxisAccordion</td>
              <td class="py-2 text-label">AxisAccordionItem components</td>
            </tr>
            <tr>
              <td class="py-2 pr-4"><code class="text-label bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">default</code></td>
              <td class="py-2 pr-4 text-label">AxisAccordionItem</td>
              <td class="py-2 text-label">Collapsible content for the item</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- ACCESSIBILITY -->
    <!-- ============================================ -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Accessibility</h2>

      <div class="space-y-4">
        <div class="p-4 bg-info-50 dark:bg-info-950 border border-info-200 dark:border-info-800 rounded-lg">
          <h3 class="text-body-regular font-medium text-info-900 dark:text-info-100 mb-2">ARIA Pattern</h3>
          <ul class="text-label text-info-800 dark:text-info-300 space-y-1">
            <li><strong>Button:</strong> Trigger uses <code class="bg-info-100 dark:bg-info-900 px-1 rounded">aria-expanded</code> and <code class="bg-info-100 dark:bg-info-900 px-1 rounded">aria-controls</code></li>
            <li><strong>Region:</strong> Content panel uses <code class="bg-info-100 dark:bg-info-900 px-1 rounded">role="region"</code> and <code class="bg-info-100 dark:bg-info-900 px-1 rounded">aria-labelledby</code></li>
            <li><strong>Container:</strong> Wrapper uses <code class="bg-info-100 dark:bg-info-900 px-1 rounded">role="region"</code> with appropriate aria-label</li>
          </ul>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Keyboard Navigation</h3>
          <ul class="text-label text-content-secondary space-y-1">
            <li><kbd class="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-label">Tab</kbd> - Navigate between accordion items</li>
            <li><kbd class="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-label">Enter</kbd> or <kbd class="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-label">Space</kbd> - Toggle item open/closed</li>
            <li><strong>Focus Visible:</strong> Clear focus ring on keyboard navigation</li>
          </ul>
        </div>

        <div class="p-4 bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800 rounded-lg">
          <h3 class="text-body-regular font-medium text-success-900 dark:text-success-100 mb-2">Screen Reader Support</h3>
          <p class="text-label text-success-800 dark:text-success-300">
            Announces "expanded" or "collapsed" state, section titles, and disabled status.
            Content regions are properly labeled and associated with their triggers.
          </p>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- CODE EXAMPLES -->
    <!-- ============================================ -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-3">Code Examples</h2>

      <div class="space-y-4">
        <!-- Basic -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Basic Usage</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.basic)"
            >
              {{ copiedCode === codeExamples.basic ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.basic }}</code></pre>
        </div>

        <!-- Single Mode -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Single Mode (Default)</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.single)"
            >
              {{ copiedCode === codeExamples.single ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.single }}</code></pre>
        </div>

        <!-- Multiple Mode -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Multiple Mode</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.multiple)"
            >
              {{ copiedCode === codeExamples.multiple ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.multiple }}</code></pre>
        </div>

        <!-- Two-Row Variant -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Two-Row Variant (with Subtitles)</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.twoRow)"
            >
              {{ copiedCode === codeExamples.twoRow ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.twoRow }}</code></pre>
        </div>

        <!-- Nested Levels -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Nested Levels</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.nested)"
            >
              {{ copiedCode === codeExamples.nested ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.nested }}</code></pre>
        </div>

        <!-- Filter Panel Example -->
        <div class="border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-2 bg-surface-raised border-b border-stroke flex items-center justify-between">
            <span class="text-label-bold text-content-secondary">Filter Panel Example</span>
            <button
              class="text-label text-main-700 dark:text-main-400 hover:text-main-900 dark:hover:text-main-200"
              @click="copyToClipboard(codeExamples.filters)"
            >
              {{ copiedCode === codeExamples.filters ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="p-4 text-label bg-neutral-900 overflow-x-auto"><code class="text-neutral-100">{{ codeExamples.filters }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
