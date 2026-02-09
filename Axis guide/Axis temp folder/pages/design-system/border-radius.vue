<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Border Radius | Design System | 8020",
});

// ============================================
// BORDER RADIUS SPECIFICATION
// Source of truth for all border radius values.
// ============================================

const radiusScale = [
  {
    name: "rounded-none",
    value: "0px",
    tailwind: "rounded-none",
    usage: "Sharp corners, no rounding",
  },
  {
    name: "rounded-xs",
    value: "2px",
    tailwind: "rounded-xs",
    usage: "Very subtle rounding, tags",
  },
  {
    name: "rounded-sm",
    value: "4px",
    tailwind: "rounded-sm",
    usage: "Small elements, badges, chips",
  },
  {
    name: "rounded",
    value: "6px",
    tailwind: "rounded",
    usage: "Default for most UI elements",
  },
  {
    name: "rounded-md",
    value: "8px",
    tailwind: "rounded-md",
    usage: "Buttons, inputs, small cards",
  },
  {
    name: "rounded-lg",
    value: "12px",
    tailwind: "rounded-lg",
    usage: "Cards, panels, containers",
  },
  {
    name: "rounded-xl",
    value: "16px",
    tailwind: "rounded-xl",
    usage: "Large cards, modals",
  },
  {
    name: "rounded-2xl",
    value: "24px",
    tailwind: "rounded-2xl",
    usage: "Hero sections, large panels",
  },
  {
    name: "rounded-3xl",
    value: "32px",
    tailwind: "rounded-3xl",
    usage: "Feature cards, marketing elements",
  },
  {
    name: "rounded-full",
    value: "9999px",
    tailwind: "rounded-full",
    usage: "Avatars, circular buttons, pills",
  },
];

const componentGuidelines = [
  {
    component: "Buttons",
    radius: "rounded-md (8px)",
    description: "Standard radius for all button sizes",
  },
  {
    component: "Inputs & Selects",
    radius: "rounded-lg (12px)",
    description: "Form fields use slightly larger radius",
  },
  {
    component: "Cards",
    radius: "rounded-lg (12px)",
    description: "Default radius for card containers",
  },
  {
    component: "Modals & Dialogs",
    radius: "rounded-xl (16px)",
    description: "Larger radius for overlay elements",
  },
  {
    component: "Tags & Badges",
    radius: "rounded or rounded-full",
    description: "Small radius for subtle, full for pills",
  },
  {
    component: "Avatars",
    radius: "rounded-full",
    description: "Always circular",
  },
  {
    component: "Tooltips",
    radius: "rounded-md (8px)",
    description: "Subtle rounding for floating elements",
  },
  {
    component: "Progress Bars",
    radius: "rounded-full",
    description: "Fully rounded track and fill",
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
      <h1 class="text-h2 text-content-primary">Border Radius</h1>
      <p class="text-body-regular text-content-secondary">
        Round the corners of elements for a softer, more modern appearance. Consistent radius values create visual harmony.
      </p>
    </div>

    <!-- Radius Scale -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Radius Scale</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Ten radius values from sharp corners (0px) to fully circular.
      </p>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <div
          v-for="radius in radiusScale"
          :key="radius.name"
          class="group"
        >
          <!-- Radius Preview -->
          <div
            class="h-28 bg-surface-base border border-stroke flex items-center justify-center"
            :class="radius.tailwind"
          >
            <span class="text-label text-content-tertiary">{{ radius.value }}</span>
          </div>

          <!-- Info -->
          <div class="mt-2">
            <button
              class="relative text-left"
              @click="copyToClipboard(radius.tailwind)"
            >
              <code class="text-label text-main-600  hover:text-main-700">{{ radius.tailwind }}</code>
              <span v-if="copiedValue === radius.tailwind" class="ml-2 text-suggestion-bold text-main-500">
                Copied!
              </span>
            </button>
            <p class="text-suggestion text-content-tertiary mt-0.5">{{ radius.usage }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Visual Comparison -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Visual Comparison</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Same-sized elements with different radius values.
      </p>

      <div class="flex flex-wrap gap-4">
        <div
          v-for="radius in radiusScale.filter(r => r.name !== 'rounded-full')"
          :key="radius.name"
          class="w-20 h-20 bg-main-100 border border-main-300 flex items-center justify-center"
          :class="radius.tailwind"
        >
          <span class="text-suggestion text-main-700">{{ radius.value }}</span>
        </div>
        <div class="w-20 h-20 bg-main-100 border border-main-300 flex items-center justify-center rounded-full">
          <span class="text-suggestion text-main-700">full</span>
        </div>
      </div>
    </div>

    <!-- Component Guidelines -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Component Guidelines</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Standard radius values for common UI components.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-200">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 w-36">Component</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 w-40">Radius</th>
              <th class="py-2 text-label-bold text-neutral-700">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            <tr v-for="guideline in componentGuidelines" :key="guideline.component">
              <td class="py-2 pr-4 text-body-regular text-content-primary font-medium">{{ guideline.component }}</td>
              <td class="py-2 pr-4">
                <code class="text-label text-main-600 ">{{ guideline.radius }}</code>
              </td>
              <td class="py-2 text-label text-content-secondary">{{ guideline.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Live Examples -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-3">Live Examples</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Radius applied to common UI patterns.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Button Example -->
        <div class="space-y-2">
          <p class="text-label-bold text-neutral-700">Buttons</p>
          <div class="flex gap-2">
            <AxisButton>Primary</AxisButton>
            <AxisButton variant="outlined">Secondary</AxisButton>
          </div>
        </div>

        <!-- Input Example -->
        <div class="space-y-2">
          <p class="text-label-bold text-neutral-700">Inputs</p>
          <AxisInput placeholder="Enter text..." />
        </div>

        <!-- Card Example -->
        <div class="space-y-2">
          <p class="text-label-bold text-content-primary">Card</p>
          <div class="p-4 bg-surface-base border border-stroke rounded-lg shadow-sm">
            <p class="text-body-regular text-content-primary">Card content with rounded-lg</p>
          </div>
        </div>

        <!-- Badge Examples -->
        <div class="space-y-2">
          <p class="text-label-bold text-neutral-700">Tags & Badges</p>
          <div class="flex gap-2">
            <span class="px-2 py-0.5 bg-main-100 text-main-700 text-label rounded">Tag</span>
            <span class="px-2.5 py-0.5 bg-accent-1-100 text-accent-1-700 text-label rounded-full">Pill</span>
            <span class="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-label rounded-sm">Label</span>
          </div>
        </div>

        <!-- Avatar Examples -->
        <div class="space-y-2">
          <p class="text-label-bold text-neutral-700">Avatars</p>
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 bg-accent-2-100 rounded-full flex items-center justify-center">
              <span class="text-label-bold text-accent-2-700">JD</span>
            </div>
            <div class="w-8 h-8 bg-accent-3-100 rounded-full flex items-center justify-center">
              <span class="text-suggestion-bold text-accent-3-700">AB</span>
            </div>
            <div class="w-6 h-6 bg-accent-1-100 rounded-full flex items-center justify-center">
              <span class="text-suggestion-bold text-accent-1-700">C</span>
            </div>
          </div>
        </div>

        <!-- Progress Bar Example -->
        <div class="space-y-2">
          <p class="text-label-bold text-neutral-700">Progress Bar</p>
          <div class="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div class="h-full w-3/5 bg-main-500 rounded-full"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
