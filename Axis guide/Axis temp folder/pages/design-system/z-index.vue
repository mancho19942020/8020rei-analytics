<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Z-Index | Design System | 8020",
});

// Z-Index scale for layering
const zIndexScale = [
  { class: "z-0", value: "0", usage: "Base layer, default stacking" },
  { class: "z-10", value: "10", usage: "Slightly elevated content" },
  { class: "z-20", value: "20", usage: "Dropdowns, tooltips" },
  { class: "z-30", value: "30", usage: "Sticky elements" },
  { class: "z-40", value: "40", usage: "Fixed navigation, sidebar" },
  { class: "z-50", value: "50", usage: "Modals, overlays, header" },
  { class: "z-auto", value: "auto", usage: "Browser default stacking" },
];

const platformConventions = [
  { element: "Header", class: "z-50", reason: "Always on top of page content" },
  { element: "Sidebar", class: "z-40", reason: "Below header, above content" },
  { element: "Modals/Dialogs", class: "z-50", reason: "Above everything when open" },
  { element: "Dropdowns", class: "z-20", reason: "Above content, below navigation" },
  { element: "Tooltips", class: "z-30", reason: "Above dropdowns, below fixed elements" },
  { element: "Sticky headers", class: "z-30", reason: "Within content area" },
];
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Z-Index</h1>
      <p class="text-body-regular text-content-secondary">
        Layering scale for managing stacking contexts across modals, dropdowns, tooltips, and overlays.
      </p>
    </div>

    <!-- Visual Demo -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Stacking Order</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Higher z-index values appear on top of lower values. Elements must share a stacking context for z-index to have effect.
      </p>

      <!-- Visual Z-Index Demo -->
      <div class="relative h-56 bg-surface-raised rounded-lg mb-4 overflow-hidden">
        <div class="absolute inset-x-4 top-4 bottom-24 bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center">
          <span class="text-label text-content-tertiary">z-0 (Base layer)</span>
        </div>
        <div class="absolute left-8 top-8 right-20 bottom-20 bg-accent-1-100 dark:bg-accent-1-900 border border-accent-1-300 dark:border-accent-1-700 rounded flex items-center justify-center z-10">
          <span class="text-label text-accent-1-700 dark:text-accent-1-300">z-10</span>
        </div>
        <div class="absolute left-12 top-12 right-16 bottom-16 bg-accent-2-100 dark:bg-accent-2-900 border border-accent-2-300 dark:border-accent-2-700 rounded flex items-center justify-center z-20">
          <span class="text-label text-accent-2-700 dark:text-accent-2-300">z-20 (Dropdowns)</span>
        </div>
        <div class="absolute left-16 top-16 right-12 bottom-12 bg-accent-3-100 dark:bg-accent-3-900 border border-accent-3-300 dark:border-accent-3-700 rounded flex items-center justify-center z-30">
          <span class="text-label text-accent-3-700 dark:text-accent-3-300">z-30 (Tooltips)</span>
        </div>
        <div class="absolute left-20 top-20 right-8 bottom-8 bg-main-100 dark:bg-main-900 border border-main-300 dark:border-main-700 rounded flex items-center justify-center z-40">
          <span class="text-label text-main-700 dark:text-main-300">z-40 (Sidebar)</span>
        </div>
        <div class="absolute right-4 bottom-4 px-4 py-3 bg-neutral-900 text-white rounded-lg shadow-xl z-50">
          <span class="text-label font-medium">z-50 (Header/Modals)</span>
        </div>
      </div>
    </div>

    <!-- Z-Index Scale Table -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Z-Index Scale</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Standard Tailwind z-index utilities. Use these values consistently across the platform.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Class</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Value</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Usage</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="z in zIndexScale" :key="z.class">
              <td class="py-2 pr-4">
                <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">{{ z.class }}</code>
              </td>
              <td class="py-2 pr-4 text-label text-content-secondary font-mono">{{ z.value }}</td>
              <td class="py-2 text-label text-content-secondary">{{ z.usage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Negative Z-Index -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Negative Z-Index</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use negative z-index values to place elements behind other content.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-content-primary mb-2">Background Decorations</p>
          <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">-z-10</code>
          <p class="text-label text-content-secondary mt-2">
            Place decorative elements behind content without removing them from the DOM.
          </p>
        </div>
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-content-primary mb-2">Example</p>
          <div class="bg-neutral-900 rounded p-3 text-label">
            <code class="text-neutral-100">&lt;div class="<span class="text-main-300">-z-10</span> absolute inset-0"&gt;</code>
            <div class="text-neutral-400 pl-4">&lt;!-- Background pattern --&gt;</div>
            <code class="text-neutral-100">&lt;/div&gt;</code>
          </div>
        </div>
      </div>
    </div>

    <!-- Platform Conventions -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Platform Conventions</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Standard z-index assignments for common UI elements in the 8020 platform.
      </p>

      <AxisCallout title="Required Convention" class="mb-4">
        Follow these z-index assignments to ensure consistent layering behavior across all pages.
      </AxisCallout>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Element</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Class</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Reason</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="conv in platformConventions" :key="conv.element">
              <td class="py-2 pr-4 text-body-regular text-content-primary font-medium">{{ conv.element }}</td>
              <td class="py-2 pr-4">
                <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">{{ conv.class }}</code>
              </td>
              <td class="py-2 text-label text-content-secondary">{{ conv.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Arbitrary Values -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Arbitrary Values</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        For one-off z-index values not in the scale, use square bracket syntax.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-content-primary mb-2">Custom Value</p>
          <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">z-[100]</code>
          <p class="text-label text-content-secondary mt-2">Sets z-index to 100</p>
        </div>
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-content-primary mb-2">CSS Variable</p>
          <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">z-[var(--layer)]</code>
          <p class="text-label text-content-secondary mt-2">Use a CSS custom property</p>
        </div>
      </div>

      <AxisCallout type="warning" title="Note" class="mt-4">
        Prefer standard scale values for consistency. Only use arbitrary values when absolutely necessary.
      </AxisCallout>
    </div>

    <!-- Stacking Context -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-3">Stacking Context</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Understanding stacking context is crucial for z-index to work correctly.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-body-regular font-medium text-content-primary mb-2">Creates New Stacking Context</p>
          <ul class="space-y-1 text-label text-content-secondary">
            <li>• <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">position: fixed</code> or <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">sticky</code></li>
            <li>• <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">position: absolute/relative</code> with z-index</li>
            <li>• <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">transform</code>, <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">filter</code>, or <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">opacity < 1</code></li>
            <li>• Flex/Grid children with z-index</li>
          </ul>
        </div>
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-body-regular font-medium text-content-primary mb-2">Common Issues</p>
          <ul class="space-y-1 text-label text-content-secondary">
            <li>• Z-index only works within same stacking context</li>
            <li>• Parent context limits child z-index</li>
            <li>• Use <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">isolation: isolate</code> to create explicit context</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
