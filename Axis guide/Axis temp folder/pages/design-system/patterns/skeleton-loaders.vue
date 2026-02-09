<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Skeleton Loaders | Patterns | Design System | 8020",
});

// Demo states
const selectedAnimation = ref<"pulse" | "wave" | "none">("pulse");
const selectedPreset = ref("dashboard");

// Available presets for demo
const presetOptions = [
  { value: "dashboard", label: "Dashboard" },
  { value: "propertyList", label: "Property List" },
  { value: "users", label: "Users" },
  { value: "settings", label: "Settings" },
  { value: "detail", label: "Detail View" },
  { value: "cardGrid", label: "Card Grid" },
  { value: "tableView", label: "Table View" },
  { value: "content", label: "Content Page" },
];

// Animation options
const animationOptions = [
  { value: "pulse", label: "Pulse (Default)" },
  { value: "wave", label: "Wave (Shimmer)" },
  { value: "none", label: "None (Static)" },
];

// Toggle demo loading states
const simulateLoad = ref(false);
const loadedContent = ref(false);

const toggleSimulation = () => {
  simulateLoad.value = true;
  loadedContent.value = false;
  setTimeout(() => {
    simulateLoad.value = false;
    loadedContent.value = true;
  }, 2000);
};
</script>

<template>
  <div class="design-system-page">
    <!-- Header -->
    <div class="mb-8">
      <p class="text-label text-content-tertiary mb-2">4. Patterns</p>
      <h1 class="text-h1 text-content-primary mb-3">Skeleton Loaders</h1>
      <p class="text-body-regular text-content-secondary max-w-3xl">
        Skeleton loaders provide visual placeholders that indicate content is loading. They improve
        perceived performance by showing users the structure of upcoming content before it arrives,
        reducing the feeling of waiting.
      </p>
    </div>

    <!-- When to Use -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-4">When to Use</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <AxisCallout type="success" title="Use Skeleton Loaders when">
          <ul class="list-disc list-inside space-y-1 text-body-regular">
            <li>Page content is loading from an API</li>
            <li>User navigates between pages</li>
            <li>Initial page render while data fetches</li>
            <li>Content structure is predictable</li>
            <li>Load time exceeds 300ms</li>
          </ul>
        </AxisCallout>

        <AxisCallout type="warning" title="Don't use Skeleton Loaders when">
          <ul class="list-disc list-inside space-y-1 text-body-regular">
            <li>Content loads instantly (under 100ms)</li>
            <li>Layout is unpredictable or highly dynamic</li>
            <li>Simple actions (use button loading state instead)</li>
            <li>Background operations (use toast/progress bar)</li>
            <li>Infinite scroll (use loading spinner at bottom)</li>
          </ul>
        </AxisCallout>
      </div>
    </section>

    <!-- Component Overview -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Component Overview</h2>

      <AxisCallout title="Two Components Available">
        <p class="text-body-regular mb-3">
          The skeleton system includes two components for different use cases:
        </p>
        <ul class="list-disc list-inside space-y-1 text-body-regular">
          <li><strong>AxisSkeleton</strong> - Basic skeleton primitives (text, avatar, button, etc.)</li>
          <li><strong>AxisPageSkeleton</strong> - Pre-built page layouts using skeleton presets</li>
        </ul>
      </AxisCallout>
    </section>

    <!-- Basic Variants -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Basic Skeleton Variants</h2>

      <!-- Text -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Text</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Text skeletons represent lines of text content. Use the <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">lines</code> prop for multiple lines.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="space-y-6">
            <div>
              <p class="text-label text-content-tertiary mb-3">Single Line</p>
              <AxisSkeleton variant="text" />
            </div>
            <div>
              <p class="text-label text-content-tertiary mb-3">Multiple Lines (3)</p>
              <AxisSkeleton variant="text" :lines="3" />
            </div>
            <div>
              <p class="text-label text-content-tertiary mb-3">Paragraph (5 lines)</p>
              <AxisSkeleton variant="text" :lines="5" full-width />
            </div>
          </div>
        </div>

        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSkeleton variant="text" /&gt;
&lt;AxisSkeleton variant="text" :lines="3" /&gt;
&lt;AxisSkeleton variant="text" :lines="5" full-width /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- Avatar -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Avatar</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Circular skeletons for profile pictures and user avatars.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex items-end gap-6">
            <div class="text-center">
              <AxisSkeleton variant="avatar" size="sm" />
              <p class="text-label text-content-tertiary mt-2">Small</p>
            </div>
            <div class="text-center">
              <AxisSkeleton variant="avatar" size="md" />
              <p class="text-label text-content-tertiary mt-2">Medium</p>
            </div>
            <div class="text-center">
              <AxisSkeleton variant="avatar" size="lg" />
              <p class="text-label text-content-tertiary mt-2">Large</p>
            </div>
            <div class="text-center">
              <AxisSkeleton variant="avatar" size="xl" />
              <p class="text-label text-content-tertiary mt-2">XL</p>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSkeleton variant="avatar" size="sm" /&gt;
&lt;AxisSkeleton variant="avatar" size="md" /&gt;
&lt;AxisSkeleton variant="avatar" size="lg" /&gt;
&lt;AxisSkeleton variant="avatar" size="xl" /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- Button -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Button</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Button-shaped skeletons for action areas.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex items-end gap-6">
            <div class="text-center">
              <AxisSkeleton variant="button" size="sm" />
              <p class="text-label text-content-tertiary mt-2">Small</p>
            </div>
            <div class="text-center">
              <AxisSkeleton variant="button" size="md" />
              <p class="text-label text-content-tertiary mt-2">Medium</p>
            </div>
            <div class="text-center">
              <AxisSkeleton variant="button" size="lg" />
              <p class="text-label text-content-tertiary mt-2">Large</p>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSkeleton variant="button" size="sm" /&gt;
&lt;AxisSkeleton variant="button" size="md" /&gt;
&lt;AxisSkeleton variant="button" size="lg" /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- Input -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Input</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Form input skeletons with label placeholder.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex items-end gap-6">
            <div>
              <AxisSkeleton variant="input" size="sm" />
              <p class="text-label text-content-tertiary mt-2">Small</p>
            </div>
            <div>
              <AxisSkeleton variant="input" size="md" />
              <p class="text-label text-content-tertiary mt-2">Medium</p>
            </div>
            <div>
              <AxisSkeleton variant="input" size="lg" />
              <p class="text-label text-content-tertiary mt-2">Large</p>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSkeleton variant="input" size="md" /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- Image -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Image</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Image placeholder with an icon indicator.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <AxisSkeleton variant="image" height="150px" />
              <p class="text-label text-content-tertiary mt-2">Default (100% width)</p>
            </div>
            <div>
              <AxisSkeleton variant="image" width="200px" height="150px" />
              <p class="text-label text-content-tertiary mt-2">Custom dimensions</p>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSkeleton variant="image" height="150px" /&gt;
&lt;AxisSkeleton variant="image" width="200px" height="150px" /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- Card -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Card</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Complete card skeleton with image, title, description, and actions.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AxisSkeleton variant="card" />
            <AxisSkeleton variant="card" />
            <AxisSkeleton variant="card" />
          </div>
        </div>

        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSkeleton variant="card" /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- Table Row -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Table Row</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Table row skeleton with configurable columns for data tables.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg overflow-hidden">
          <AxisSkeleton variant="table-row" :columns="4" full-width />
          <AxisSkeleton variant="table-row" :columns="4" full-width />
          <AxisSkeleton variant="table-row" :columns="4" full-width />
          <AxisSkeleton variant="table-row" :columns="4" full-width />
          <AxisSkeleton variant="table-row" :columns="4" full-width />
        </div>

        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSkeleton variant="table-row" :columns="4" full-width /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- Custom -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Custom</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Custom dimensions for unique layout needs.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex gap-4">
            <AxisSkeleton variant="custom" width="100px" height="100px" rounded="lg" />
            <AxisSkeleton variant="custom" width="200px" height="50px" rounded="full" />
            <AxisSkeleton variant="custom" width="150px" height="80px" rounded="none" />
          </div>
        </div>

        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSkeleton variant="custom" width="100px" height="100px" rounded="lg" /&gt;
&lt;AxisSkeleton variant="custom" width="200px" height="50px" rounded="full" /&gt;</code></pre>
          </details>
        </div>
      </div>
    </section>

    <!-- Animation Types -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Animation Types</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Choose an animation style that fits the context. Pulse is recommended for most cases.
      </p>

      <div class="bg-surface-raised border border-stroke rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p class="text-label-bold text-content-primary mb-3">Pulse (Default)</p>
            <p class="text-label text-content-tertiary mb-3">Gentle opacity animation, least distracting</p>
            <AxisSkeleton variant="card" animation="pulse" />
          </div>
          <div>
            <p class="text-label-bold text-content-primary mb-3">Wave (Shimmer)</p>
            <p class="text-label text-content-tertiary mb-3">Left-to-right shimmer effect</p>
            <AxisSkeleton variant="card" animation="wave" />
          </div>
          <div>
            <p class="text-label-bold text-content-primary mb-3">None (Static)</p>
            <p class="text-label text-content-tertiary mb-3">No animation, static placeholder</p>
            <AxisSkeleton variant="card" animation="none" />
          </div>
        </div>
      </div>

      <div class="mt-4">
        <details class="group">
          <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
            View code
          </summary>
          <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSkeleton variant="card" animation="pulse" /&gt;
&lt;AxisSkeleton variant="card" animation="wave" /&gt;
&lt;AxisSkeleton variant="card" animation="none" /&gt;</code></pre>
        </details>
      </div>
    </section>

    <!-- Page Skeleton Presets -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Page Skeleton Presets</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">AxisPageSkeleton</code> with
        pre-built presets for common page layouts. This ensures consistent loading states across the platform.
      </p>

      <!-- Preset Selector -->
      <div class="mb-6 flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-label text-content-secondary">Preset:</span>
          <select
            v-model="selectedPreset"
            class="px-3 py-1.5 bg-surface-base border border-stroke rounded text-body-regular text-content-primary focus:outline-none focus:ring-2 focus:ring-main-500"
          >
            <option v-for="option in presetOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-label text-content-secondary">Animation:</span>
          <select
            v-model="selectedAnimation"
            class="px-3 py-1.5 bg-surface-base border border-stroke rounded text-body-regular text-content-primary focus:outline-none focus:ring-2 focus:ring-main-500"
          >
            <option v-for="option in animationOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Preset Preview -->
      <div class="border border-stroke rounded-lg overflow-hidden">
        <div class="p-4 bg-surface-raised border-b border-stroke">
          <p class="text-label-bold text-content-primary">Preview: {{ selectedPreset }}</p>
        </div>
        <div class="p-6 bg-surface-base max-h-[600px] overflow-y-auto">
          <AxisPageSkeleton :preset="selectedPreset" :animation="selectedAnimation" />
        </div>
      </div>

      <div class="mt-4">
        <details class="group">
          <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
            View code
          </summary>
          <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisPageSkeleton preset="dashboard" /&gt;
&lt;AxisPageSkeleton preset="propertyList" /&gt;
&lt;AxisPageSkeleton preset="settings" animation="wave" /&gt;</code></pre>
        </details>
      </div>
    </section>

    <!-- Interactive Demo -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Interactive Demo</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Click the button to simulate a loading state and see the skeleton transition to real content.
      </p>

      <div class="mb-4">
        <AxisButton :loading="simulateLoad" @click="toggleSimulation">
          {{ simulateLoad ? 'Loading...' : 'Simulate Page Load' }}
        </AxisButton>
      </div>

      <div class="border border-stroke rounded-lg overflow-hidden">
        <div class="p-4 bg-surface-raised border-b border-stroke">
          <p class="text-label-bold text-content-primary">
            {{ simulateLoad ? 'Loading content...' : loadedContent ? 'Content loaded!' : 'Click button to start' }}
          </p>
        </div>
        <div class="p-6 bg-surface-base">
          <!-- Skeleton state -->
          <template v-if="simulateLoad">
            <div class="space-y-4">
              <div class="flex items-center gap-4">
                <AxisSkeleton variant="avatar" size="lg" />
                <div class="flex-1">
                  <AxisSkeleton variant="text" width="200px" />
                  <AxisSkeleton variant="text" width="150px" class="mt-2" />
                </div>
              </div>
              <AxisSkeleton variant="text" :lines="3" full-width />
              <div class="flex gap-3">
                <AxisSkeleton variant="button" size="md" />
                <AxisSkeleton variant="button" size="md" />
              </div>
            </div>
          </template>

          <!-- Loaded content -->
          <template v-else-if="loadedContent">
            <div class="space-y-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-main-500 flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div>
                  <p class="text-body-regular font-medium text-content-primary">John Doe</p>
                  <p class="text-label text-content-tertiary">Software Engineer</p>
                </div>
              </div>
              <p class="text-body-regular text-content-secondary">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
                ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
              </p>
              <div class="flex gap-3">
                <AxisButton variant="filled">View Profile</AxisButton>
                <AxisButton variant="outlined">Send Message</AxisButton>
              </div>
            </div>
          </template>

          <!-- Initial state -->
          <template v-else>
            <p class="text-body-regular text-content-tertiary text-center py-8">
              Click "Simulate Page Load" to see the skeleton transition
            </p>
          </template>
        </div>
      </div>
    </section>

    <!-- Props Reference -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">AxisSkeleton Props</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-label border-collapse">
          <thead>
            <tr class="border-b-2 border-stroke-strong">
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Prop</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Type</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Default</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stroke">
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">variant</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">"text"</td>
              <td class="py-3 px-4 text-content-secondary">text | avatar | button | image | card | table-row | input | custom</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">animation</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">"pulse"</td>
              <td class="py-3 px-4 text-content-secondary">pulse | wave | none</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">size</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">"md"</td>
              <td class="py-3 px-4 text-content-secondary">sm | md | lg | xl (for avatar, button, input)</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">lines</td>
              <td class="py-3 px-4 text-content-secondary">number</td>
              <td class="py-3 px-4 text-content-tertiary">1</td>
              <td class="py-3 px-4 text-content-secondary">Number of text lines (for text variant)</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">columns</td>
              <td class="py-3 px-4 text-content-secondary">number</td>
              <td class="py-3 px-4 text-content-tertiary">4</td>
              <td class="py-3 px-4 text-content-secondary">Number of columns (for table-row variant)</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">width</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">""</td>
              <td class="py-3 px-4 text-content-secondary">Custom width (e.g., "200px", "50%")</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">height</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">""</td>
              <td class="py-3 px-4 text-content-secondary">Custom height (e.g., "100px")</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">rounded</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">"md"</td>
              <td class="py-3 px-4 text-content-secondary">none | sm | md | lg | full</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">full-width</td>
              <td class="py-3 px-4 text-content-secondary">boolean</td>
              <td class="py-3 px-4 text-content-tertiary">false</td>
              <td class="py-3 px-4 text-content-secondary">Expand to fill container width</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">label</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">"Loading..."</td>
              <td class="py-3 px-4 text-content-secondary">Screen reader label</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- AxisPageSkeleton Props -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">AxisPageSkeleton Props</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-label border-collapse">
          <thead>
            <tr class="border-b-2 border-stroke-strong">
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Prop</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Type</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Default</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stroke">
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">preset</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">"content"</td>
              <td class="py-3 px-4 text-content-secondary">dashboard | propertyList | users | settings | detail | cardGrid | tableView | content</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">animation</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">"pulse"</td>
              <td class="py-3 px-4 text-content-secondary">pulse | wave | none</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Accessibility -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Accessibility</h2>

      <div class="space-y-4">
        <div>
          <h3 class="text-h5 text-content-primary mb-2">Screen Readers</h3>
          <ul class="list-disc list-inside text-body-regular text-content-secondary space-y-1">
            <li>Uses <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">role="status"</code> to announce loading state</li>
            <li>Provides <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">aria-label</code> for descriptive loading messages</li>
            <li>Visual elements are marked with <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">aria-hidden="true"</code></li>
            <li>Screen reader text provided via <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">.sr-only</code> class</li>
          </ul>
        </div>

        <div>
          <h3 class="text-h5 text-content-primary mb-2">Reduced Motion</h3>
          <p class="text-body-regular text-content-secondary">
            For users who prefer reduced motion, consider using <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">animation="none"</code>
            or checking <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">prefers-reduced-motion</code> media query.
          </p>
        </div>
      </div>
    </section>

    <!-- Best Practices -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Best Practices</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Match skeleton structure to actual content layout</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use consistent animation across a page</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Show skeletons only when load time exceeds 300ms</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use page presets for consistent full-page loading</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Provide meaningful screen reader labels</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use skeletons for instant loads (under 100ms)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Mix different animation types on same page</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Create skeletons that don't match final content</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use wave animation excessively (can be distracting)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Forget to handle error states after loading</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Related Patterns -->
    <section>
      <h2 class="text-h3 text-content-primary mb-4">Related Patterns</h2>
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          to="/design-system/patterns/loading-states"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Loading States</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <NuxtLink
          to="/design-system/patterns/empty-states"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Empty States</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <NuxtLink
          to="/design-system/patterns/error-handling"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Error Handling</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <NuxtLink
          to="/design-system/components/buttons"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Buttons (Loading State)</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.design-system-page {
  @apply max-w-5xl mx-auto;
}

code {
  @apply inline-block;
}
</style>
