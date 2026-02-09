<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Colors | Design System | 8020",
});

// Main brand color
const mainColor = {
  name: "Main",
  token: "main",
  description: "Primary brand color. Green for Roofing8020, changeable per brand.",
  shades: [
    { name: "50", value: "#f0fdf4", token: "main-50" },
    { name: "100", value: "#dcfce7", token: "main-100" },
    { name: "300", value: "#86efac", token: "main-300" },
    { name: "500", value: "#22c55e", token: "main-500" },
    { name: "700", value: "#15803d", token: "main-700" },
    { name: "900", value: "#14532d", token: "main-900" },
    { name: "950", value: "#052e16", token: "main-950" },
  ],
};

// Accent colors (5 palettes)
const accentColors = [
  {
    name: "Accent 1",
    token: "accent-1",
    description: "Charts, links, interactive elements",
    shades: [
      { name: "50", value: "#eff6ff", token: "accent-1-50" },
      { name: "100", value: "#dbeafe", token: "accent-1-100" },
      { name: "300", value: "#93c5fd", token: "accent-1-300" },
      { name: "500", value: "#3b82f6", token: "accent-1-500" },
      { name: "700", value: "#1d4ed8", token: "accent-1-700" },
      { name: "900", value: "#1e3a8a", token: "accent-1-900" },
      { name: "950", value: "#172554", token: "accent-1-950" },
    ],
  },
  {
    name: "Accent 2",
    token: "accent-2",
    description: "Secondary highlights, data series",
    shades: [
      { name: "50", value: "#eef2ff", token: "accent-2-50" },
      { name: "100", value: "#e0e7ff", token: "accent-2-100" },
      { name: "300", value: "#a5b4fc", token: "accent-2-300" },
      { name: "500", value: "#6366f1", token: "accent-2-500" },
      { name: "700", value: "#4338ca", token: "accent-2-700" },
      { name: "900", value: "#312e81", token: "accent-2-900" },
      { name: "950", value: "#1e1b4b", token: "accent-2-950" },
    ],
  },
  {
    name: "Accent 3",
    token: "accent-3",
    description: "Warm highlights, notifications",
    shades: [
      { name: "50", value: "#fff7ed", token: "accent-3-50" },
      { name: "100", value: "#ffedd5", token: "accent-3-100" },
      { name: "300", value: "#fdba74", token: "accent-3-300" },
      { name: "500", value: "#f97316", token: "accent-3-500" },
      { name: "700", value: "#c2410c", token: "accent-3-700" },
      { name: "900", value: "#7c2d12", token: "accent-3-900" },
      { name: "950", value: "#431407", token: "accent-3-950" },
    ],
  },
  {
    name: "Accent 4",
    token: "accent-4",
    description: "Positive trends, data visualization",
    shades: [
      { name: "50", value: "#f7fee7", token: "accent-4-50" },
      { name: "100", value: "#ecfccb", token: "accent-4-100" },
      { name: "300", value: "#bef264", token: "accent-4-300" },
      { name: "500", value: "#84cc16", token: "accent-4-500" },
      { name: "700", value: "#4d7c0f", token: "accent-4-700" },
      { name: "900", value: "#365314", token: "accent-4-900" },
      { name: "950", value: "#1a2e05", token: "accent-4-950" },
    ],
  },
  {
    name: "Accent 5",
    token: "accent-5",
    description: "Creative highlights, special elements",
    shades: [
      { name: "50", value: "#fdf2f8", token: "accent-5-50" },
      { name: "100", value: "#fce7f3", token: "accent-5-100" },
      { name: "300", value: "#f9a8d4", token: "accent-5-300" },
      { name: "500", value: "#ec4899", token: "accent-5-500" },
      { name: "700", value: "#be185d", token: "accent-5-700" },
      { name: "900", value: "#831843", token: "accent-5-900" },
      { name: "950", value: "#500724", token: "accent-5-950" },
    ],
  },
];

// Neutral (Gray) scale
const neutralColor = {
  name: "Neutral",
  token: "neutral",
  description: "Text, backgrounds, borders, disabled states",
  shades: [
    { name: "50", value: "#f9fafb", token: "neutral-50" },
    { name: "100", value: "#f3f4f6", token: "neutral-100" },
    { name: "200", value: "#e5e7eb", token: "neutral-200" },
    { name: "300", value: "#d1d5db", token: "neutral-300" },
    { name: "400", value: "#9ca3af", token: "neutral-400" },
    { name: "500", value: "#6b7280", token: "neutral-500" },
    { name: "600", value: "#4b5563", token: "neutral-600" },
    { name: "700", value: "#374151", token: "neutral-700" },
    { name: "800", value: "#1f2937", token: "neutral-800" },
    { name: "900", value: "#111827", token: "neutral-900" },
    { name: "950", value: "#030712", token: "neutral-950" },
  ],
};

// Black & White
const bwColors = [
  { name: "White", value: "#ffffff", token: "white" },
  { name: "Black", value: "#000000", token: "black" },
];

// Semantic status colors
const semanticColors = [
  {
    name: "Success",
    token: "success",
    description: "Positive feedback, confirmations, completed states",
    shades: [
      { name: "50", value: "#f0fdf4", token: "success-50" },
      { name: "100", value: "#dcfce7", token: "success-100" },
      { name: "300", value: "#86efac", token: "success-300" },
      { name: "500", value: "#22c55e", token: "success-500" },
      { name: "700", value: "#15803d", token: "success-700" },
      { name: "900", value: "#14532d", token: "success-900" },
      { name: "950", value: "#052e16", token: "success-950" },
    ],
  },
  {
    name: "Alert",
    token: "alert",
    description: "Warnings, cautions, attention needed",
    shades: [
      { name: "50", value: "#fefce8", token: "alert-50" },
      { name: "100", value: "#fef9c3", token: "alert-100" },
      { name: "300", value: "#fde047", token: "alert-300" },
      { name: "500", value: "#eab308", token: "alert-500" },
      { name: "700", value: "#a16207", token: "alert-700" },
      { name: "900", value: "#713f12", token: "alert-900" },
      { name: "950", value: "#422006", token: "alert-950" },
    ],
  },
  {
    name: "Error",
    token: "error",
    description: "Errors, destructive actions, critical issues",
    shades: [
      { name: "50", value: "#fef2f2", token: "error-50" },
      { name: "100", value: "#fee2e2", token: "error-100" },
      { name: "300", value: "#fca5a5", token: "error-300" },
      { name: "500", value: "#ef4444", token: "error-500" },
      { name: "700", value: "#b91c1c", token: "error-700" },
      { name: "900", value: "#7f1d1d", token: "error-900" },
      { name: "950", value: "#450a0a", token: "error-950" },
    ],
  },
  {
    name: "Info",
    token: "info",
    description: "Informational, neutral feedback, help text",
    shades: [
      { name: "50", value: "#ecfeff", token: "info-50" },
      { name: "100", value: "#cffafe", token: "info-100" },
      { name: "300", value: "#67e8f9", token: "info-300" },
      { name: "500", value: "#06b6d4", token: "info-500" },
      { name: "700", value: "#0e7490", token: "info-700" },
      { name: "900", value: "#164e63", token: "info-900" },
      { name: "950", value: "#083344", token: "info-950" },
    ],
  },
];

// Copy to clipboard
const copiedValue = ref<string | null>(null);

const copyToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    copiedValue.value = value;
    setTimeout(() => { copiedValue.value = null; }, 1500);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-page-header">
      <h1 class="docs-page-title">Colors</h1>
      <p class="docs-page-description">
        Semantic color tokens for scalable design. Click any swatch to copy the token name.
      </p>
    </div>

    <!-- Naming Convention -->
    <div class="docs-section-highlight">
      <h2 class="docs-section-title">Token Naming Convention</h2>
      <p class="text-body-regular text-content-secondary mb-2">
        All colors use semantic names (not color names) for scalability across brands.
      </p>
      <div class="flex flex-wrap gap-3 text-label ">
        <span class="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded text-content-primary">main-{shade}</span>
        <span class="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded text-content-primary">accent-{1-5}-{shade}</span>
        <span class="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded text-content-primary">neutral-{shade}</span>
        <span class="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded text-content-primary">success|alert|error|info-{shade}</span>
      </div>
    </div>

    <!-- Main Brand Color -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-1">{{ mainColor.name }}</h2>
      <div class="flex items-center gap-2 mb-3">
        <code class="text-label text-main-700 dark:text-main-300 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">{{ mainColor.token }}</code>
        <span class="text-body-regular text-content-secondary">{{ mainColor.description }}</span>
      </div>
      <div class="flex gap-1">
        <button
          v-for="shade in mainColor.shades"
          :key="shade.name"
          class="relative flex-1 group"
          @click="copyToClipboard(shade.token)"
        >
          <div
            class="h-12 rounded-lg ring-1 ring-inset ring-black/5 group-hover:ring-2 group-hover:ring-main-500 transition-all"
            :style="{ backgroundColor: shade.value }"
          />
          <div class="mt-1 text-center">
            <span class="text-label text-content-secondary block">{{ shade.name }}</span>
            <code class="text-label text-content-tertiary ">{{ shade.token }}</code>
          </div>
          <div
            v-if="copiedValue === shade.token"
            class="absolute inset-0 flex items-center justify-center bg-neutral-900/80 rounded-lg"
          >
            <span class="text-label text-white">Copied!</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Accent Colors -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Accent Colors</h2>
      <p class="text-body-regular text-content-secondary mb-4">Five accent palettes for charts, data visualization, and UI highlights.</p>
      <div class="space-y-4">
        <div v-for="color in accentColors" :key="color.token">
          <div class="flex items-center gap-2 mb-2">
            <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{{ color.token }}</code>
            <span class="text-label text-content-tertiary">{{ color.description }}</span>
          </div>
          <div class="flex gap-1">
            <button
              v-for="shade in color.shades"
              :key="shade.name"
              class="relative flex-1 group"
              @click="copyToClipboard(shade.token)"
            >
              <div
                class="h-8 rounded ring-1 ring-inset ring-black/5 group-hover:ring-2 group-hover:ring-main-500 transition-all"
                :style="{ backgroundColor: shade.value }"
              />
              <span class="text-label text-content-tertiary mt-0.5 block text-center">{{ shade.name }}</span>
              <div
                v-if="copiedValue === shade.token"
                class="absolute inset-0 flex items-center justify-center bg-neutral-900/80 rounded"
              >
                <span class="text-suggestion text-white">Copied!</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Neutral -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-1">{{ neutralColor.name }}</h2>
      <div class="flex items-center gap-2 mb-3">
        <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{{ neutralColor.token }}</code>
        <span class="text-body-regular text-content-secondary">{{ neutralColor.description }}</span>
      </div>
      <div class="flex gap-1">
        <button
          v-for="shade in neutralColor.shades"
          :key="shade.name"
          class="relative flex-1 group"
          @click="copyToClipboard(shade.token)"
        >
          <div
            class="h-8 rounded ring-1 ring-inset ring-black/5 group-hover:ring-2 group-hover:ring-main-500 transition-all"
            :style="{ backgroundColor: shade.value }"
          />
          <span class="text-label text-content-tertiary mt-0.5 block text-center">{{ shade.name }}</span>
          <div
            v-if="copiedValue === shade.token"
            class="absolute inset-0 flex items-center justify-center bg-neutral-900/80 rounded"
          >
            <span class="text-suggestion text-white">Copied!</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Black & White -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Black & White</h2>
      <div class="flex gap-4">
        <button
          v-for="color in bwColors"
          :key="color.name"
          class="relative group"
          @click="copyToClipboard(color.token)"
        >
          <div
            class="w-16 h-16 rounded-lg ring-1 ring-inset ring-black/10 group-hover:ring-2 group-hover:ring-main-500 transition-all"
            :style="{ backgroundColor: color.value }"
          />
          <div class="mt-1 text-center">
            <span class="text-label text-content-primary">{{ color.name }}</span>
            <code class="text-label text-content-tertiary  block">{{ color.token }}</code>
          </div>
          <div
            v-if="copiedValue === color.token"
            class="absolute inset-0 flex items-center justify-center bg-neutral-900/80 rounded-lg"
          >
            <span class="text-suggestion text-white">Copied!</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Semantic Status Colors -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Semantic Status Colors</h2>
      <p class="text-label text-content-tertiary mb-4">For feedback states, validation, and user guidance.</p>
      <div class="space-y-4">
        <div v-for="color in semanticColors" :key="color.token">
          <div class="flex items-center gap-2 mb-2">
            <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{{ color.token }}</code>
            <span class="text-label text-content-tertiary">{{ color.description }}</span>
          </div>
          <div class="flex gap-1">
            <button
              v-for="shade in color.shades"
              :key="shade.name"
              class="relative flex-1 group"
              @click="copyToClipboard(shade.token)"
            >
              <div
                class="h-8 rounded ring-1 ring-inset ring-black/5 group-hover:ring-2 group-hover:ring-main-500 transition-all"
                :style="{ backgroundColor: shade.value }"
              />
              <span class="text-label text-content-tertiary mt-0.5 block text-center">{{ shade.name }}</span>
              <div
                v-if="copiedValue === shade.token"
                class="absolute inset-0 flex items-center justify-center bg-neutral-900/80 rounded"
              >
                <span class="text-suggestion text-white">Copied!</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Usage Guidelines -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Usage Guidelines</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p class="text-body-regular font-medium text-content-primary mb-2">Shade Scale</p>
          <ul class="space-y-1 text-body-regular text-content-secondary">
            <li><strong class="text-neutral-800 dark:text-neutral-200">50-100:</strong> Backgrounds, subtle fills</li>
            <li><strong class="text-neutral-800 dark:text-neutral-200">300:</strong> Borders, disabled states</li>
            <li><strong class="text-neutral-800 dark:text-neutral-200">500:</strong> Primary actions, icons</li>
            <li><strong class="text-neutral-800 dark:text-neutral-200">700:</strong> Hover states, emphasis</li>
            <li><strong class="text-neutral-800 dark:text-neutral-200">900-950:</strong> Text, high contrast</li>
          </ul>
        </div>
        <div>
          <p class="text-body-regular font-medium text-content-primary mb-2">Best Practices</p>
          <ul class="space-y-1 text-body-regular text-content-secondary">
            <li>Always use token names, not hex values</li>
            <li>Use semantic colors for their purpose</li>
            <li>Main color for primary brand actions</li>
            <li>Accents for charts and data variety</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- COLOR CONTRAST - WCAG & Material Design Guidelines -->
    <!-- ============================================ -->
    <div class="docs-section">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-h4 text-content-primary">Color Contrast</h2>
        <span class="px-2 py-0.5 text-suggestion-bold bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300 rounded uppercase">Mandatory</span>
      </div>

      <p class="text-body-regular text-content-secondary mb-4">
        All color combinations in this platform MUST meet WCAG 2.1 AA contrast standards.
        This ensures readability for users with low vision and meets accessibility requirements.
      </p>

      <!-- Contrast Ratios Explained -->
      <div class="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 mb-6">
        <h3 class="text-h4 text-content-primary mb-3">Required Contrast Ratios</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-h3 text-accent-1-700 dark:text-accent-1-400">4.5:1</span>
              <span class="px-2 py-0.5 text-suggestion-bold bg-accent-1-100 dark:bg-accent-1-900 text-accent-1-700 dark:text-accent-1-300 rounded">Normal Text</span>
            </div>
            <p class="text-label text-content-secondary">Required for body text, labels, and any text smaller than 18px (or 14px bold)</p>
          </div>
          <div class="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-h3 text-accent-2-700 dark:text-accent-2-400">3:1</span>
              <span class="px-2 py-0.5 text-suggestion-bold bg-accent-2-100 dark:bg-accent-2-900 text-accent-2-700 dark:text-accent-2-300 rounded">Large Text & UI</span>
            </div>
            <p class="text-label text-content-secondary">Required for large text (18px+), UI components, icons, and graphical elements</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Approved Combinations -->
    <div class="docs-section">
      <h3 class="text-h4 text-content-primary mb-4">Approved Color Combinations</h3>

      <!-- Text on Light Backgrounds -->
      <div class="mb-6">
        <p class="text-label-bold text-neutral-700 dark:text-neutral-300 mb-3">Text on Light Backgrounds</p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <!-- Approved combinations -->
          <div class="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-body-regular text-neutral-800 dark:text-neutral-200">Primary Text</span>
              <span class="px-1.5 py-0.5 text-suggestion-bold bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded">Passes</span>
            </div>
            <div class="flex items-center gap-2">
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">text-neutral-900</code>
              <span class="text-label text-content-tertiary">on</span>
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">bg-white</code>
            </div>
            <p class="text-suggestion text-neutral-500 dark:text-neutral-400 mt-1">Ratio: 17.4:1</p>
          </div>

          <div class="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-body-regular text-neutral-700 dark:text-neutral-300">Secondary Text</span>
              <span class="px-1.5 py-0.5 text-suggestion-bold bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded">Passes</span>
            </div>
            <div class="flex items-center gap-2">
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">text-neutral-700</code>
              <span class="text-label text-content-tertiary">on</span>
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">bg-white</code>
            </div>
            <p class="text-suggestion text-neutral-500 dark:text-neutral-400 mt-1">Ratio: 8.6:1</p>
          </div>

          <div class="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-body-regular text-content-secondary">Tertiary Text</span>
              <span class="px-1.5 py-0.5 text-suggestion-bold bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded">Passes</span>
            </div>
            <div class="flex items-center gap-2">
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">text-neutral-600</code>
              <span class="text-label text-content-tertiary">on</span>
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">bg-white</code>
            </div>
            <p class="text-suggestion text-neutral-500 dark:text-neutral-400 mt-1">Ratio: 5.7:1</p>
          </div>

          <div class="p-3 bg-main-50 dark:bg-main-950 border border-main-200 dark:border-main-800 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-body-regular text-main-900 dark:text-main-100">Main on Main-50</span>
              <span class="px-1.5 py-0.5 text-suggestion-bold bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded">Passes</span>
            </div>
            <div class="flex items-center gap-2">
              <code class="text-label text-content-primary bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded">text-main-900</code>
              <span class="text-label text-content-tertiary">on</span>
              <code class="text-label text-content-primary bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded">bg-main-50</code>
            </div>
            <p class="text-suggestion text-main-700 dark:text-main-400 mt-1">Ratio: 10.8:1</p>
          </div>

          <div class="p-3 bg-main-50 dark:bg-main-950 border border-main-200 dark:border-main-800 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-body-regular text-main-700 dark:text-main-300">Main-700 on Main-50</span>
              <span class="px-1.5 py-0.5 text-suggestion-bold bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded">Passes</span>
            </div>
            <div class="flex items-center gap-2">
              <code class="text-label text-content-primary bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded">text-main-700</code>
              <span class="text-label text-content-tertiary">on</span>
              <code class="text-label text-content-primary bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded">bg-main-50</code>
            </div>
            <p class="text-suggestion text-main-700 dark:text-main-400 mt-1">Ratio: 5.1:1</p>
          </div>

          <div class="p-3 bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-body-regular text-error-900 dark:text-error-100">Error on Error-50</span>
              <span class="px-1.5 py-0.5 text-suggestion-bold bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded">Passes</span>
            </div>
            <div class="flex items-center gap-2">
              <code class="text-label text-content-primary bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded">text-error-900</code>
              <span class="text-label text-content-tertiary">on</span>
              <code class="text-label text-content-primary bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded">bg-error-50</code>
            </div>
            <p class="text-suggestion text-error-700 dark:text-error-400 mt-1">Ratio: 10.2:1</p>
          </div>
        </div>
      </div>

      <!-- Buttons and Interactive Elements -->
      <div class="mb-6">
        <p class="text-label-bold text-neutral-700 dark:text-neutral-300 mb-3">Buttons & Interactive Elements</p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div class="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <AxisButton size="sm">Primary Button</AxisButton>
              <span class="px-1.5 py-0.5 text-suggestion-bold bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded">Passes</span>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">text-white</code>
              <span class="text-label text-content-tertiary">on</span>
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">bg-main-700</code>
            </div>
            <p class="text-suggestion text-neutral-500 dark:text-neutral-400 mt-1">Ratio: 4.5:1</p>
          </div>

          <div class="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <AxisButton variant="outlined" size="sm">Secondary Button</AxisButton>
              <span class="px-1.5 py-0.5 text-suggestion-bold bg-alert-100 dark:bg-alert-900 text-alert-700 dark:text-alert-300 rounded">Use Carefully</span>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">text-main-700</code>
              <span class="text-label text-content-tertiary">on</span>
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">bg-white</code>
            </div>
            <p class="text-suggestion text-neutral-500 dark:text-neutral-400 mt-1">Ratio: 4.5:1</p>
          </div>

          <div class="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <AxisButton variant="ghost" size="sm">Ghost Button</AxisButton>
              <span class="px-1.5 py-0.5 text-suggestion-bold bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded">Passes</span>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">text-main-700</code>
              <span class="text-label text-content-tertiary">on</span>
              <code class="text-label text-content-primary bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">transparent</code>
            </div>
            <p class="text-suggestion text-neutral-500 dark:text-neutral-400 mt-1">Ratio: 4.5:1</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Prohibited Combinations -->
    <div class="docs-section">
      <h3 class="text-h5 text-error-700 dark:text-error-400 mb-4">Prohibited Combinations</h3>
      <p class="text-body-regular text-content-secondary mb-4">
        These combinations fail WCAG contrast requirements and must NEVER be used.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div class="p-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg opacity-75">
          <div class="flex items-center justify-between mb-2">
            <span class="text-body-regular text-neutral-400">Light Gray Text</span>
            <span class="px-1.5 py-0.5 text-suggestion-bold bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300 rounded">Fails</span>
          </div>
          <div class="flex items-center gap-2">
            <code class="text-label text-content-primary bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded line-through">text-neutral-400</code>
            <span class="text-label text-content-tertiary">on</span>
            <code class="text-label text-content-primary bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded">bg-white</code>
          </div>
          <p class="text-suggestion text-error-600 dark:text-error-400 mt-1">Ratio: 2.7:1 (Fails 4.5:1)</p>
        </div>

        <div class="p-3 bg-main-50 dark:bg-main-950 border border-main-200 dark:border-main-800 rounded-lg opacity-75">
          <div class="flex items-center justify-between mb-2">
            <span class="text-body-regular text-main-500">Main-500 on Light</span>
            <span class="px-1.5 py-0.5 text-suggestion-bold bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300 rounded">Fails</span>
          </div>
          <div class="flex items-center gap-2">
            <code class="text-label text-content-primary bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded line-through">text-main-500</code>
            <span class="text-label text-content-tertiary">on</span>
            <code class="text-label text-content-primary bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded">bg-main-50</code>
          </div>
          <p class="text-suggestion text-error-600 dark:text-error-400 mt-1">Ratio: 2.4:1 (Fails 4.5:1)</p>
        </div>

        <div class="p-3 bg-main-100 dark:bg-main-900 border border-main-300 dark:border-main-700 rounded-lg opacity-75">
          <div class="flex items-center justify-between mb-2">
            <span class="text-body-regular text-main-300">Main-300 on Main-100</span>
            <span class="px-1.5 py-0.5 text-suggestion-bold bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300 rounded">Fails</span>
          </div>
          <div class="flex items-center gap-2">
            <code class="text-label text-content-primary bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded line-through">text-main-300</code>
            <span class="text-label text-content-tertiary">on</span>
            <code class="text-label text-content-primary bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded">bg-main-100</code>
          </div>
          <p class="text-suggestion text-error-600 dark:text-error-400 mt-1">Ratio: 1.6:1 (Fails 3:1)</p>
        </div>
      </div>
    </div>

    <!-- Contrast Rules Summary -->
    <div class="docs-section-last">
      <h3 class="text-h4 text-content-primary mb-4">Quick Reference Rules</h3>

      <div class="bg-main-50 dark:bg-main-950 border border-main-200 dark:border-main-800 rounded-lg p-4 mb-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-main-700 dark:text-main-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-body-regular font-medium text-main-900 dark:text-main-100">Golden Rules for Main (Green) Color</p>
            <ul class="text-label text-main-700 dark:text-main-300 mt-2 space-y-1">
              <li>• <strong>Text:</strong> Use <code class="bg-white dark:bg-neutral-800 px-1 rounded">main-700</code> or darker for text on light backgrounds</li>
              <li>• <strong>Buttons:</strong> Use <code class="bg-white dark:bg-neutral-800 px-1 rounded">bg-main-700</code> with white text for primary buttons</li>
              <li>• <strong>Backgrounds:</strong> Use <code class="bg-white dark:bg-neutral-800 px-1 rounded">main-50</code> or <code class="bg-white dark:bg-neutral-800 px-1 rounded">main-100</code> with <code class="bg-white dark:bg-neutral-800 px-1 rounded">main-900</code> text</li>
              <li>• <strong>Never:</strong> Use <code class="bg-white dark:bg-neutral-800 px-1 rounded">main-500</code> or lighter shades for body text</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <p class="text-body-regular font-medium text-content-primary mb-2">For Normal Text (4.5:1)</p>
          <ul class="space-y-1 text-label text-content-primary">
            <li>✓ Use <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">neutral-600</code> or darker on white</li>
            <li>✓ Use <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">main-700</code> or darker on main-50</li>
            <li>✓ Use white on <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">main-700</code> or darker</li>
          </ul>
        </div>
        <div class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <p class="text-body-regular font-medium text-content-primary mb-2">For Large Text & UI (3:1)</p>
          <ul class="space-y-1 text-label text-content-primary">
            <li>✓ Headings 18px+ can use <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">neutral-500</code></li>
            <li>✓ Icons can use <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">main-500</code> on white</li>
            <li>✓ Borders must be <code class="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">neutral-300</code> or darker</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
