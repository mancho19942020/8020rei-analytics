<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Spacing | Design System | 8020",
});

// Spacing scale based on 4px base unit
const spacingScale = [
  { name: "0", value: "0px", class: "p-0", usage: "No spacing" },
  { name: "0.5", value: "2px", class: "p-0.5", usage: "Hairline gaps" },
  { name: "1", value: "4px", class: "p-1", usage: "Icon gaps, tight spacing" },
  { name: "1.5", value: "6px", class: "p-1.5", usage: "Small inner padding" },
  { name: "2", value: "8px", class: "p-2", usage: "Small gaps between items" },
  { name: "2.5", value: "10px", class: "p-2.5", usage: "Badge/chip padding" },
  { name: "3", value: "12px", class: "p-3", usage: "Section header margin" },
  { name: "4", value: "16px", class: "p-4", usage: "Section vertical padding" },
  { name: "5", value: "20px", class: "p-5", usage: "Medium padding" },
  { name: "6", value: "24px", class: "p-6", usage: "Section horizontal padding" },
  { name: "8", value: "32px", class: "p-8", usage: "Large separations" },
  { name: "10", value: "40px", class: "p-10", usage: "Major sections" },
  { name: "12", value: "48px", class: "p-12", usage: "Page-level spacing" },
  { name: "16", value: "64px", class: "p-16", usage: "Large gaps" },
  { name: "20", value: "80px", class: "p-20", usage: "Extra large spacing" },
];

// Common spacing patterns in the platform
const platformPatterns = [
  {
    name: "Section Padding",
    classes: "px-6 py-4",
    description: "Standard padding for all page sections",
    horizontal: "24px",
    vertical: "16px",
  },
  {
    name: "Card Padding",
    classes: "p-4",
    description: "Internal padding for cards and containers",
    horizontal: "16px",
    vertical: "16px",
  },
  {
    name: "Button Padding",
    classes: "px-4 py-2",
    description: "Standard button padding",
    horizontal: "16px",
    vertical: "8px",
  },
  {
    name: "Input Padding",
    classes: "px-3 py-2",
    description: "Form input padding",
    horizontal: "12px",
    vertical: "8px",
  },
  {
    name: "Badge Padding",
    classes: "px-2 py-0.5",
    description: "Small badge/tag padding",
    horizontal: "8px",
    vertical: "2px",
  },
];

// Gap scale for flex/grid
const gapScale = [
  { name: "gap-1", value: "4px", usage: "Very tight spacing (icon groups)" },
  { name: "gap-2", value: "8px", usage: "Tight spacing (inline items)" },
  { name: "gap-3", value: "12px", usage: "Default list item spacing" },
  { name: "gap-4", value: "16px", usage: "Standard grid gap" },
  { name: "gap-6", value: "24px", usage: "Card grid spacing" },
  { name: "gap-8", value: "32px", usage: "Section separations" },
];

// Margin patterns
const marginPatterns = [
  { name: "mb-2", value: "8px", usage: "Paragraph spacing" },
  { name: "mb-3", value: "12px", usage: "Section header to content" },
  { name: "mb-4", value: "16px", usage: "Between components" },
  { name: "mb-6", value: "24px", usage: "Between major sections" },
  { name: "mt-auto", value: "auto", usage: "Push to bottom (flex)" },
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
    <div class="docs-page-header">
      <h1 class="docs-page-title">Spacing</h1>
      <p class="docs-page-description">
        Spacing scale, margin and padding tokens, and consistent spacing patterns for layouts and components.
      </p>
    </div>

    <!-- 4px Base Unit -->
    <div class="docs-section">
      <h2 class="docs-section-title">4px Base Unit</h2>
      <AxisCallout title="Spacing Scale Foundation">
        All spacing in Tailwind is based on a <strong>4px base unit</strong>. Each spacing value is a multiple of 4px
        (e.g., <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">p-1</code> = 4px, <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">p-2</code> = 8px,
        <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded">p-4</code> = 16px). This creates visual consistency and harmony.
      </AxisCallout>
    </div>

    <!-- Spacing Scale Visual -->
    <div class="docs-section">
      <h2 class="docs-section-title">Spacing Scale</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Click any value to copy the class name.
      </p>

      <div class="space-y-2">
        <div
          v-for="space in spacingScale.slice(0, 12)"
          :key="space.name"
          class="flex items-center gap-4"
        >
          <button
            class="relative w-16 text-left group"
            @click="copyToClipboard(space.class)"
          >
            <code class="text-label text-main-600 group-hover:text-main-800">{{ space.class }}</code>
            <span v-if="copiedValue === space.class" class="absolute -top-4 left-0 text-suggestion-bold text-main-500">
              Copied!
            </span>
          </button>
          <span class="w-12 text-label text-content-tertiary font-mono">{{ space.value }}</span>
          <div class="flex-1 flex items-center gap-2">
            <div
              class="bg-main-500 rounded-sm h-4 transition-all"
              :style="{ width: space.value === '0px' ? '2px' : space.value }"
            />
            <span class="text-label text-content-secondary">{{ space.usage }}</span>
          </div>
        </div>
      </div>

      <!-- Extended scale -->
      <details class="mt-4">
        <summary class="text-label text-accent-1-600 cursor-pointer hover:text-accent-1-700">
          Show extended scale (16-20)
        </summary>
        <div class="mt-3 space-y-2">
          <div
            v-for="space in spacingScale.slice(12)"
            :key="space.name"
            class="flex items-center gap-4"
          >
            <button
              class="relative w-16 text-left group"
              @click="copyToClipboard(space.class)"
            >
              <code class="text-label text-main-600 group-hover:text-main-800">{{ space.class }}</code>
              <span v-if="copiedValue === space.class" class="absolute -top-4 left-0 text-suggestion-bold text-main-500">
                Copied!
              </span>
            </button>
            <span class="w-12 text-label text-content-tertiary font-mono">{{ space.value }}</span>
            <span class="text-label text-content-secondary">{{ space.usage }}</span>
          </div>
        </div>
      </details>
    </div>

    <!-- Platform Patterns -->
    <div class="docs-section">
      <h2 class="docs-section-title">Platform Spacing Patterns</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Standard spacing combinations used throughout the 8020 platform.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Pattern</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Classes</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">H × V</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="pattern in platformPatterns" :key="pattern.name">
              <td class="py-2 pr-4 text-body-regular text-content-primary font-medium">{{ pattern.name }}</td>
              <td class="py-2 pr-4">
                <button class="relative" @click="copyToClipboard(pattern.classes)">
                  <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded hover:bg-main-100 dark:hover:bg-main-900">
                    {{ pattern.classes }}
                  </code>
                  <span v-if="copiedValue === pattern.classes" class="absolute -top-4 left-0 text-suggestion-bold text-main-500 dark:text-main-400">
                    Copied!
                  </span>
                </button>
              </td>
              <td class="py-2 pr-4 text-label text-content-tertiary font-mono">
                {{ pattern.horizontal }} × {{ pattern.vertical }}
              </td>
              <td class="py-2 text-label text-content-secondary">{{ pattern.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Gap for Flex/Grid -->
    <div class="docs-section">
      <h2 class="docs-section-title">Gap (Flex & Grid)</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded text-label">gap-*</code> for spacing between flex/grid children instead of margin.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-neutral-700 dark:text-neutral-300 mb-3">Flex Example</p>
          <div class="flex gap-2 mb-2">
            <div class="w-12 h-8 bg-main-500 rounded"/>
            <div class="w-12 h-8 bg-main-500 rounded"/>
            <div class="w-12 h-8 bg-main-500 rounded"/>
          </div>
          <code class="text-label text-content-secondary">flex gap-2</code>
        </div>
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-neutral-700 dark:text-neutral-300 mb-3">Grid Example</p>
          <div class="grid grid-cols-3 gap-4 mb-2">
            <div class="h-8 bg-accent-1-500 rounded"/>
            <div class="h-8 bg-accent-1-500 rounded"/>
            <div class="h-8 bg-accent-1-500 rounded"/>
          </div>
          <code class="text-label text-content-secondary">grid grid-cols-3 gap-4</code>
        </div>
      </div>

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
            <tr v-for="gap in gapScale" :key="gap.name">
              <td class="py-2 pr-4">
                <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">{{ gap.name }}</code>
              </td>
              <td class="py-2 pr-4 text-label text-content-tertiary font-mono">{{ gap.value }}</td>
              <td class="py-2 text-label text-content-secondary">{{ gap.usage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Margin Patterns -->
    <div class="docs-section">
      <h2 class="docs-section-title">Margin Patterns</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Common margin values for vertical rhythm and component separation.
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
            <tr v-for="margin in marginPatterns" :key="margin.name">
              <td class="py-2 pr-4">
                <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">{{ margin.name }}</code>
              </td>
              <td class="py-2 pr-4 text-label text-content-tertiary font-mono">{{ margin.value }}</td>
              <td class="py-2 text-label text-content-secondary">{{ margin.usage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Negative Spacing -->
    <div class="docs-section">
      <h2 class="docs-section-title">Negative Spacing</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use negative margins to pull elements outside their container or overlap.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-content-primary mb-2">Pull Element Up</p>
          <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">-mt-4</code>
          <p class="text-label text-content-secondary mt-2">Moves element up by 16px</p>
        </div>
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-content-primary mb-2">Full-Bleed Pattern</p>
          <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">-mx-6</code>
          <p class="text-label text-content-secondary mt-2">Extend element to edges of padded container</p>
        </div>
      </div>
    </div>

    <!-- Space Utilities -->
    <div class="docs-section">
      <h2 class="docs-section-title">Space Between Children</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use <code class="bg-surface-raised dark:bg-neutral-800 px-1 rounded text-label">space-*</code> utilities for consistent spacing between direct children.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-content-primary mb-3">Vertical Stack</p>
          <div class="space-y-2">
            <div class="h-8 bg-accent-2-500 rounded"/>
            <div class="h-8 bg-accent-2-500 rounded"/>
            <div class="h-8 bg-accent-2-500 rounded"/>
          </div>
          <code class="text-label text-content-secondary mt-2 block">space-y-2</code>
        </div>
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-content-primary mb-3">Horizontal Row</p>
          <div class="flex space-x-4">
            <div class="w-12 h-8 bg-accent-3-500 rounded"/>
            <div class="w-12 h-8 bg-accent-3-500 rounded"/>
            <div class="w-12 h-8 bg-accent-3-500 rounded"/>
          </div>
          <code class="text-label text-content-secondary mt-2 block">flex space-x-4</code>
        </div>
      </div>

      <AxisCallout type="info" title="Tip" class="mt-4">
        Prefer <code class="bg-info-100 dark:bg-info-950 px-1 rounded">gap-*</code> over <code class="bg-info-100 dark:bg-info-950 px-1 rounded">space-*</code>
        when using flexbox or grid, as gap handles wrapping better.
      </AxisCallout>
    </div>

    <!-- Best Practices -->
    <div class="docs-section-last">
      <h2 class="docs-section-title">Best Practices</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use standard spacing scale values</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Keep spacing consistent within sections</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use gap for flex/grid layouts</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Match horizontal and vertical rhythms</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use platform patterns for consistency</span>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use arbitrary spacing values</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Mix spacing scales in same context</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use margin for grid/flex gaps</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Add spacing "by eye"</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Over-space - tight is usually better</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
