<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Light & Dark Mode | Design System | 8020",
});

// Surface tokens - the foundation of our theming
const surfaceTokens = {
  light: [
    { token: "surface-base", value: "#ffffff", neutral: "white", description: "Primary background for pages and main content areas" },
    { token: "surface-raised", value: "#f9fafb", neutral: "neutral-50", description: "Cards, modals, elevated containers" },
    { token: "surface-overlay", value: "#f3f4f6", neutral: "neutral-100", description: "Dropdowns, popovers, floating elements" },
    { token: "surface-sunken", value: "#f3f4f6", neutral: "neutral-100", description: "Inset areas, input backgrounds" },
  ],
  dark: [
    { token: "surface-base", value: "#111827", neutral: "neutral-900", description: "Primary background - softer than pure dark for reduced eye strain" },
    { token: "surface-raised", value: "#1f2937", neutral: "neutral-800", description: "Cards, modals, elevated containers" },
    { token: "surface-overlay", value: "#374151", neutral: "neutral-700", description: "Dropdowns, popovers, floating elements" },
    { token: "surface-sunken", value: "#030712", neutral: "neutral-950", description: "Deepest level for inset areas like form inputs" },
  ],
};

// Content/text tokens
const contentTokens = {
  light: [
    { token: "content-primary", value: "#111827", neutral: "neutral-900", description: "Primary text, headings" },
    { token: "content-secondary", value: "#374151", neutral: "neutral-700", description: "Secondary text, labels" },
    { token: "content-tertiary", value: "#6b7280", neutral: "neutral-500", description: "Placeholder text, hints" },
    { token: "content-disabled", value: "#9ca3af", neutral: "neutral-400", description: "Disabled text" },
  ],
  dark: [
    { token: "content-primary", value: "#f9fafb", neutral: "neutral-50", description: "Primary text, headings" },
    { token: "content-secondary", value: "#d1d5db", neutral: "neutral-300", description: "Secondary text, labels" },
    { token: "content-tertiary", value: "#9ca3af", neutral: "neutral-400", description: "Placeholder text, hints" },
    { token: "content-disabled", value: "#4b5563", neutral: "neutral-600", description: "Disabled text" },
  ],
};

// Border/stroke tokens
const strokeTokens = {
  light: [
    { token: "stroke", value: "#e5e7eb", neutral: "neutral-200", description: "Default borders" },
    { token: "stroke-subtle", value: "#f3f4f6", neutral: "neutral-100", description: "Subtle dividers" },
    { token: "stroke-strong", value: "#d1d5db", neutral: "neutral-300", description: "Emphasized borders" },
  ],
  dark: [
    { token: "stroke", value: "#374151", neutral: "neutral-700", description: "Default borders" },
    { token: "stroke-subtle", value: "#1f2937", neutral: "neutral-800", description: "Subtle dividers" },
    { token: "stroke-strong", value: "#4b5563", neutral: "neutral-600", description: "Emphasized borders" },
  ],
};

// Copy to clipboard functionality
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
      <h1 class="docs-page-title">Light & Dark Mode</h1>
      <p class="docs-page-description">
        Semantic color tokens and guidelines for building interfaces that work beautifully in both light and dark themes.
      </p>
    </div>

    <!-- Core Principle -->
    <div class="docs-section-highlight">
      <h2 class="docs-section-title">Core Principle</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-4 bg-white border border-neutral-200 rounded-lg">
          <p class="text-h5 text-neutral-900 mb-2">Light Mode</p>
          <p class="text-body-regular text-neutral-700">
            Surfaces get <strong>darker</strong> as they elevate. Base is white, raised surfaces are light gray.
          </p>
          <div class="mt-3 flex gap-1">
            <div class="flex-1 h-8 bg-white border border-neutral-200 rounded flex items-center justify-center text-suggestion text-neutral-500">base</div>
            <div class="flex-1 h-8 bg-neutral-50 border border-neutral-200 rounded flex items-center justify-center text-suggestion text-neutral-500">raised</div>
            <div class="flex-1 h-8 bg-neutral-100 border border-neutral-200 rounded flex items-center justify-center text-suggestion text-neutral-500">overlay</div>
          </div>
        </div>
        <div class="p-4 bg-neutral-900 border border-neutral-700 rounded-lg">
          <p class="text-h5 text-neutral-100 mb-2">Dark Mode</p>
          <p class="text-body-regular text-neutral-300">
            Surfaces get <strong>lighter</strong> as they elevate. Base is neutral-900, raised surfaces are neutral-800.
          </p>
          <div class="mt-3 flex gap-1">
            <div class="flex-1 h-8 bg-neutral-900 border border-neutral-700 rounded flex items-center justify-center text-suggestion text-neutral-400">base</div>
            <div class="flex-1 h-8 bg-neutral-800 border border-neutral-700 rounded flex items-center justify-center text-suggestion text-neutral-400">raised</div>
            <div class="flex-1 h-8 bg-neutral-700 border border-neutral-600 rounded flex items-center justify-center text-suggestion text-neutral-400">overlay</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Design Rationale -->
    <div class="docs-section">
      <h2 class="docs-section-title">Why neutral-900 for Dark Mode Base?</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        We use <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">neutral-900</code> (#111827) instead of
        <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">neutral-950</code> (#030712) for the dark mode base background.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <div class="w-10 h-10 mb-3 rounded-lg bg-main-100 dark:bg-main-900 flex items-center justify-center">
            <svg class="w-5 h-5 text-main-700 dark:text-main-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p class="text-h5 text-content-primary mb-1">Reduced Eye Strain</p>
          <p class="text-label text-content-secondary">Pure black (#030712) creates harsh contrast that causes eye fatigue during extended use.</p>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <div class="w-10 h-10 mb-3 rounded-lg bg-accent-1-100 dark:bg-accent-1-900 flex items-center justify-center">
            <svg class="w-5 h-5 text-accent-1-700 dark:text-accent-1-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <p class="text-h5 text-content-primary mb-1">Better Elevation</p>
          <p class="text-label text-content-secondary">Starting from neutral-900 allows clear visual distinction between surface levels.</p>
        </div>

        <div class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <div class="w-10 h-10 mb-3 rounded-lg bg-accent-2-100 dark:bg-accent-2-900 flex items-center justify-center">
            <svg class="w-5 h-5 text-accent-2-700 dark:text-accent-2-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p class="text-h5 text-content-primary mb-1">WCAG Compliance</p>
          <p class="text-label text-content-secondary">Softer background maintains contrast ratios while being more comfortable to view.</p>
        </div>
      </div>
    </div>

    <!-- Surface Tokens -->
    <div class="docs-section">
      <h2 class="docs-section-title">Surface Tokens</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use semantic surface tokens for backgrounds. They automatically adapt between light and dark modes.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Light Mode -->
        <div>
          <p class="text-label-bold text-content-secondary mb-3">Light Mode</p>
          <div class="space-y-2">
            <button
              v-for="token in surfaceTokens.light"
              :key="token.token"
              class="relative w-full flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg hover:border-main-500 transition-colors group"
              @click="copyToClipboard(`bg-${token.token}`)"
            >
              <div
                class="w-12 h-12 rounded border border-neutral-200 shrink-0"
                :style="{ backgroundColor: token.value }"
              />
              <div class="flex-1 text-left">
                <code class="text-label text-main-700 bg-main-50 px-1.5 py-0.5 rounded">bg-{{ token.token }}</code>
                <p class="text-suggestion text-neutral-500 mt-0.5">{{ token.neutral }} ({{ token.value }})</p>
                <p class="text-label text-neutral-600 mt-1">{{ token.description }}</p>
              </div>
              <div
                v-if="copiedValue === `bg-${token.token}`"
                class="absolute inset-0 flex items-center justify-center bg-neutral-900/80 rounded-lg"
              >
                <span class="text-label text-white">Copied!</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Dark Mode -->
        <div>
          <p class="text-label-bold text-content-secondary mb-3">Dark Mode</p>
          <div class="space-y-2">
            <button
              v-for="token in surfaceTokens.dark"
              :key="token.token"
              class="relative w-full flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-700 rounded-lg hover:border-main-500 transition-colors group"
              @click="copyToClipboard(`bg-${token.token}`)"
            >
              <div
                class="w-12 h-12 rounded border border-neutral-700 shrink-0"
                :style="{ backgroundColor: token.value }"
              />
              <div class="flex-1 text-left">
                <code class="text-label text-main-300 bg-main-950 px-1.5 py-0.5 rounded">bg-{{ token.token }}</code>
                <p class="text-suggestion text-neutral-400 mt-0.5">{{ token.neutral }} ({{ token.value }})</p>
                <p class="text-label text-neutral-300 mt-1">{{ token.description }}</p>
              </div>
              <div
                v-if="copiedValue === `bg-${token.token}`"
                class="absolute inset-0 flex items-center justify-center bg-neutral-900/80 rounded-lg"
              >
                <span class="text-label text-white">Copied!</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content/Text Tokens -->
    <div class="docs-section">
      <h2 class="docs-section-title">Content Tokens</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use semantic content tokens for text colors. They ensure proper contrast in both themes.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Light Mode -->
        <div>
          <p class="text-label-bold text-content-secondary mb-3">Light Mode</p>
          <div class="p-4 bg-white border border-neutral-200 rounded-lg space-y-3">
            <div v-for="token in contentTokens.light" :key="token.token" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span
                  class="text-body-regular"
                  :style="{ color: token.value }"
                >
                  Sample Text
                </span>
                <code class="text-suggestion text-neutral-500">text-{{ token.token }}</code>
              </div>
              <span class="text-suggestion text-neutral-400">{{ token.neutral }}</span>
            </div>
          </div>
        </div>

        <!-- Dark Mode -->
        <div>
          <p class="text-label-bold text-content-secondary mb-3">Dark Mode</p>
          <div class="p-4 bg-neutral-900 border border-neutral-700 rounded-lg space-y-3">
            <div v-for="token in contentTokens.dark" :key="token.token" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span
                  class="text-body-regular"
                  :style="{ color: token.value }"
                >
                  Sample Text
                </span>
                <code class="text-suggestion text-neutral-400">text-{{ token.token }}</code>
              </div>
              <span class="text-suggestion text-neutral-500">{{ token.neutral }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stroke/Border Tokens -->
    <div class="docs-section">
      <h2 class="docs-section-title">Stroke Tokens</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use semantic stroke tokens for borders and dividers.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Light Mode -->
        <div>
          <p class="text-label-bold text-content-secondary mb-3">Light Mode</p>
          <div class="p-4 bg-white border border-neutral-200 rounded-lg space-y-3">
            <div v-for="token in strokeTokens.light" :key="token.token" class="flex items-center justify-between pb-3" :class="token.token === 'stroke-strong' ? '' : 'border-b'" :style="{ borderColor: token.value }">
              <div>
                <code class="text-label text-neutral-700">border-{{ token.token }}</code>
                <p class="text-suggestion text-neutral-500 mt-0.5">{{ token.description }}</p>
              </div>
              <span class="text-suggestion text-neutral-400">{{ token.neutral }}</span>
            </div>
          </div>
        </div>

        <!-- Dark Mode -->
        <div>
          <p class="text-label-bold text-content-secondary mb-3">Dark Mode</p>
          <div class="p-4 bg-neutral-900 border border-neutral-700 rounded-lg space-y-3">
            <div v-for="token in strokeTokens.dark" :key="token.token" class="flex items-center justify-between pb-3" :class="token.token === 'stroke-strong' ? '' : 'border-b'" :style="{ borderColor: token.value }">
              <div>
                <code class="text-label text-neutral-300">border-{{ token.token }}</code>
                <p class="text-suggestion text-neutral-400 mt-0.5">{{ token.description }}</p>
              </div>
              <span class="text-suggestion text-neutral-500">{{ token.neutral }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Implementation Guidelines -->
    <div class="docs-section">
      <h2 class="docs-section-title">Implementation Guidelines</h2>

      <div class="space-y-4">
        <!-- Prefer Semantic Tokens -->
        <div class="p-4 bg-main-50 dark:bg-main-950 border border-main-200 dark:border-main-800 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-main-700 dark:text-main-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-body-regular font-medium text-main-900 dark:text-main-100">Prefer Semantic Tokens</p>
              <p class="text-label text-main-700 dark:text-main-300 mt-1">
                Always use semantic tokens like <code class="bg-white dark:bg-neutral-800 px-1 rounded">bg-surface-base</code>
                and <code class="bg-white dark:bg-neutral-800 px-1 rounded">text-content-primary</code> instead of raw color values.
                They automatically adapt to theme changes.
              </p>
            </div>
          </div>
        </div>

        <!-- Manual dark: Variants -->
        <div class="p-4 bg-accent-1-50 dark:bg-accent-1-950 border border-accent-1-200 dark:border-accent-1-800 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-accent-1-700 dark:text-accent-1-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p class="text-body-regular font-medium text-accent-1-900 dark:text-accent-1-100">When to Use Manual Variants</p>
              <p class="text-label text-accent-1-700 dark:text-accent-1-300 mt-1">
                When semantic tokens don't cover your use case, use manual <code class="bg-white dark:bg-neutral-800 px-1 rounded">dark:</code> variants.
                Example: <code class="bg-white dark:bg-neutral-800 px-1 rounded">bg-neutral-100 dark:bg-neutral-800</code>
              </p>
            </div>
          </div>
        </div>

        <!-- Testing Requirement -->
        <div class="p-4 bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-error-700 dark:text-error-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p class="text-body-regular font-medium text-error-900 dark:text-error-100">Mandatory Testing</p>
              <p class="text-label text-error-700 dark:text-error-300 mt-1">
                ALL components MUST be tested in both light and dark modes before committing.
                No hardcoded light-only or dark-only styles are allowed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Examples -->
    <div class="docs-section">
      <h2 class="docs-section-title">Code Examples</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Good Example -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-0.5 text-suggestion-bold bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded">Correct</span>
            <span class="text-label text-content-secondary">Using Semantic Tokens</span>
          </div>
          <div class="p-4 bg-neutral-900 rounded-lg overflow-x-auto">
            <pre class="text-label text-neutral-100"><code>&lt;div class="bg-surface-base text-content-primary border-stroke"&gt;
  &lt;h2 class="text-content-primary"&gt;Title&lt;/h2&gt;
  &lt;p class="text-content-secondary"&gt;Description&lt;/p&gt;
&lt;/div&gt;</code></pre>
          </div>
        </div>

        <!-- Also Good Example -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-0.5 text-suggestion-bold bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded">Also Correct</span>
            <span class="text-label text-content-secondary">Manual Variants for Special Cases</span>
          </div>
          <div class="p-4 bg-neutral-900 rounded-lg overflow-x-auto">
            <pre class="text-label text-neutral-100"><code>&lt;div class="bg-neutral-50 dark:bg-neutral-800
            text-neutral-900 dark:text-neutral-100"&gt;
  &lt;!-- Custom surface that needs specific shades --&gt;
&lt;/div&gt;</code></pre>
          </div>
        </div>

        <!-- Bad Example -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-0.5 text-suggestion-bold bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300 rounded">Wrong</span>
            <span class="text-label text-content-secondary">Missing Dark Mode Support</span>
          </div>
          <div class="p-4 bg-neutral-900 rounded-lg overflow-x-auto">
            <pre class="text-label text-neutral-100"><code>&lt;!-- DON'T: Light-only styles --&gt;
&lt;div class="bg-white text-gray-900"&gt;
  &lt;p class="text-gray-600"&gt;Broken in dark mode&lt;/p&gt;
&lt;/div&gt;</code></pre>
          </div>
        </div>

        <!-- Also Bad Example -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-0.5 text-suggestion-bold bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300 rounded">Wrong</span>
            <span class="text-label text-content-secondary">Hardcoded Colors</span>
          </div>
          <div class="p-4 bg-neutral-900 rounded-lg overflow-x-auto">
            <pre class="text-label text-neutral-100"><code>&lt;!-- DON'T: Hardcoded hex values --&gt;
&lt;div style="background: #ffffff; color: #111827"&gt;
  &lt;p&gt;Won't adapt to theme changes&lt;/p&gt;
&lt;/div&gt;</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Reference -->
    <div class="docs-section-last">
      <h2 class="docs-section-title">Quick Reference</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-3 pr-4 text-label-bold text-content-secondary">Purpose</th>
              <th class="py-3 pr-4 text-label-bold text-content-secondary">Token</th>
              <th class="py-3 pr-4 text-label-bold text-content-secondary">Light</th>
              <th class="py-3 text-label-bold text-content-secondary">Dark</th>
            </tr>
          </thead>
          <tbody class="text-body-regular text-content-primary">
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Page Background</td>
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">bg-surface-base</code></td>
              <td class="py-3 pr-4">white</td>
              <td class="py-3">neutral-900</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Cards & Modals</td>
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">bg-surface-raised</code></td>
              <td class="py-3 pr-4">neutral-50</td>
              <td class="py-3">neutral-800</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Dropdowns</td>
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">bg-surface-overlay</code></td>
              <td class="py-3 pr-4">neutral-100</td>
              <td class="py-3">neutral-700</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Form Inputs</td>
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">bg-surface-sunken</code></td>
              <td class="py-3 pr-4">neutral-100</td>
              <td class="py-3">neutral-950</td>
            </tr>
            <tr class="border-b border-stroke-subtle">
              <td class="py-3 pr-4">Primary Text</td>
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">text-content-primary</code></td>
              <td class="py-3 pr-4">neutral-900</td>
              <td class="py-3">neutral-50</td>
            </tr>
            <tr>
              <td class="py-3 pr-4">Default Borders</td>
              <td class="py-3 pr-4"><code class="text-label bg-surface-raised px-1.5 py-0.5 rounded">border-stroke</code></td>
              <td class="py-3 pr-4">neutral-200</td>
              <td class="py-3">neutral-700</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
