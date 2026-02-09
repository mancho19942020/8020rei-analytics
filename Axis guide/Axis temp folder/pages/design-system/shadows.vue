<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Shadows | Design System | 8020",
});

// ============================================
// SHADOW SPECIFICATION
// Source of truth for all shadow values.
// ============================================

const shadows = [
  {
    name: "shadow-0",
    tailwind: "shadow-none",
    css: "none",
    usage: "No elevation, flat elements",
  },
  {
    name: "shadow-xs",
    tailwind: "shadow-xs",
    css: "0px 1px 2px rgba(16, 24, 40, 0.05)",
    usage: "Subtle lift for inputs, cards at rest",
  },
  {
    name: "shadow-sm",
    tailwind: "shadow-sm",
    css: "0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)",
    usage: "Default cards, dropdowns",
  },
  {
    name: "shadow-md",
    tailwind: "shadow-md",
    css: "0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)",
    usage: "Elevated cards, popovers",
  },
  {
    name: "shadow-lg",
    tailwind: "shadow-lg",
    css: "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
    usage: "Modals, dialogs",
  },
  {
    name: "shadow-xl",
    tailwind: "shadow-xl",
    css: "0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)",
    usage: "Maximum elevation, large modals, overlays",
  },
];

const usageGuidelines = [
  {
    context: "Form Inputs",
    shadow: "shadow-xs",
    description: "Use subtle shadow on focus states for inputs",
  },
  {
    context: "Cards at Rest",
    shadow: "shadow-sm",
    description: "Default shadow for cards and contained elements",
  },
  {
    context: "Dropdowns & Menus",
    shadow: "shadow-md",
    description: "Elevated elements that appear above the page",
  },
  {
    context: "Modals & Dialogs",
    shadow: "shadow-lg to shadow-xl",
    description: "High elevation for overlay content",
  },
  {
    context: "Toast Notifications",
    shadow: "shadow-lg",
    description: "Floating elements that need attention",
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
      <h1 class="text-h2 text-content-primary">Shadows</h1>
      <p class="text-body-regular text-content-secondary">
        Shadows add depth and realism to designs by positioning elements on a z-axis. Use shadows consistently to establish visual hierarchy.
      </p>
    </div>

    <!-- Important Notice -->
    <div class="docs-section">
      <AxisCallout title="Consistency Rule">
        Use shadows sparingly. Our design system favors flat sections with dividers over elevated cards. Only use shadows when an element truly needs to appear above the page surface.
      </AxisCallout>
    </div>

    <!-- Shadow Scale -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Shadow Scale</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Six shadow levels from no shadow (0) to maximum elevation (XL).
      </p>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="shadow in shadows"
          :key="shadow.name"
          class="group"
        >
          <!-- Shadow Preview -->
          <div
            class="h-32 bg-surface-base border border-stroke rounded-lg p-4 flex items-start transition-shadow"
            :class="shadow.tailwind"
          >
            <span class="text-body-regular text-content-primary">{{ shadow.name }}</span>
          </div>

          <!-- Info -->
          <div class="mt-2">
            <button
              class="relative text-left"
              @click="copyToClipboard(shadow.tailwind)"
            >
              <code class="text-label text-main-600  hover:text-main-700">{{ shadow.tailwind }}</code>
              <span v-if="copiedValue === shadow.tailwind" class="ml-2 text-suggestion-bold text-main-500">
                Copied!
              </span>
            </button>
            <p class="text-suggestion text-content-tertiary mt-0.5">{{ shadow.usage }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CSS Values Reference -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">CSS Values Reference</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Raw CSS box-shadow values for custom implementations.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-200">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 w-28">Token</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 w-24">Tailwind</th>
              <th class="py-2 text-label-bold text-neutral-700">CSS Value</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            <tr v-for="shadow in shadows" :key="shadow.name">
              <td class="py-2 pr-4 text-body-regular text-content-primary font-medium">{{ shadow.name }}</td>
              <td class="py-2 pr-4">
                <code class="text-label text-main-600 ">{{ shadow.tailwind }}</code>
              </td>
              <td class="py-2">
                <code class="text-label text-content-secondary  break-all">{{ shadow.css }}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Usage Guidelines -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Usage Guidelines</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        When to use each shadow level.
      </p>

      <div class="space-y-3">
        <div
          v-for="guideline in usageGuidelines"
          :key="guideline.context"
          class="flex items-start gap-4 p-3 bg-surface-raised rounded-lg"
        >
          <div class="w-32 shrink-0">
            <p class="text-body-regular font-medium text-content-primary">{{ guideline.context }}</p>
          </div>
          <div class="w-40 shrink-0">
            <code class="text-label text-main-600 ">{{ guideline.shadow }}</code>
          </div>
          <p class="text-label text-content-secondary">{{ guideline.description }}</p>
        </div>
      </div>
    </div>

    <!-- Interactive Demo -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-3">Interactive Comparison</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Hover over each card to see the shadow in context.
      </p>

      <div class="flex gap-4 overflow-x-auto pb-4">
        <div
          v-for="shadow in shadows"
          :key="shadow.name"
          class="shrink-0 w-40 h-24 bg-surface-base border border-stroke rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
          :class="shadow.tailwind"
        >
          <span class="text-label text-content-secondary">{{ shadow.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
