<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Icons | Design System | 8020",
});

const iconSizes = [
  { name: "xs", size: "16px", class: "w-4 h-4" },
  { name: "sm", size: "20px", class: "w-5 h-5" },
  { name: "md", size: "24px", class: "w-6 h-6" },
  { name: "lg", size: "32px", class: "w-8 h-8" },
];

const sampleIcons = [
  { name: "home", path: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" },
  { name: "search", path: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" },
  { name: "plus", path: "M12 4.5v15m7.5-7.5h-15" },
  { name: "check", path: "M4.5 12.75l6 6 9-13.5" },
  { name: "bell", path: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
  { name: "user", path: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
  { name: "cog", path: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" },
  { name: "trash", path: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" },
];

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
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Icons</h1>
      <p class="text-body-regular text-content-secondary">
        Heroicons (outline style) with consistent sizing. Click icon names to copy.
      </p>
    </div>

    <!-- Icon Sizes -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Sizes</h2>
      <div class="flex items-end gap-6">
        <div v-for="size in iconSizes" :key="size.name" class="text-center">
          <div class="flex items-center justify-center h-12 mb-1">
            <svg
              :class="[size.class, 'text-content-primary']"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <p class="text-label font-medium text-content-primary">{{ size.name }}</p>
          <p class="text-suggestion text-content-tertiary">{{ size.size }}</p>
          <code class="text-suggestion text-content-tertiary ">{{ size.class }}</code>
        </div>
      </div>
    </div>

    <!-- Sample Icons -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Sample Icons</h2>
      <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
        <button
          v-for="icon in sampleIcons"
          :key="icon.name"
          class="relative group p-3 rounded-lg hover:bg-main-50 transition-colors text-center"
          @click="copyToClipboard(icon.name)"
        >
          <svg
            class="w-6 h-6 mx-auto text-content-secondary group-hover:text-main-600 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" :d="icon.path" />
          </svg>
          <span class="text-suggestion text-content-tertiary group-hover:text-main-600 block mt-1">
            {{ icon.name }}
          </span>
          <div
            v-if="copiedValue === icon.name"
            class="absolute inset-0 flex items-center justify-center bg-main-500 rounded-lg"
          >
            <span class="text-suggestion text-white">Copied</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Platform Standard Icons -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Platform Standard Icons</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Certain behaviors have standardized icons that must be used consistently across the entire platform.
      </p>

      <div class="bg-surface-raised rounded-lg border border-stroke-subtle overflow-hidden">
        <table class="w-full text-left">
          <thead class="bg-surface-base border-b border-stroke-subtle">
            <tr>
              <th class="px-4 py-3 text-body-regular font-semibold text-content-primary">Icon</th>
              <th class="px-4 py-3 text-body-regular font-semibold text-content-primary">Usage</th>
              <th class="px-4 py-3 text-body-regular font-semibold text-content-primary">Size</th>
              <th class="px-4 py-3 text-body-regular font-semibold text-content-primary">Components</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stroke-subtle">
            <!-- Pinned Indicator -->
            <tr>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-main-50 dark:bg-main-900/30 rounded-lg">
                    <svg
                      class="w-5 h-5 text-main-600 dark:text-main-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 12.87c0-.47-.18-.92-.51-1.25l-3.12-3.12V4c.55 0 1-.45 1-1s-.45-1-1-1H8.5c-.55 0-1 .45-1 1s.45 1 1 1v4.5L5.38 11.62c-.33.33-.51.78-.51 1.25 0 .97.78 1.75 1.75 1.75H11v6.62c0 .55.45 1 1 1s1-.45 1-1v-6.62h4.38c.97 0 1.75-.78 1.62-1.75Z" />
                    </svg>
                  </div>
                  <span class="text-body-regular font-medium text-content-primary">Pushpin</span>
                </div>
              </td>
              <td class="px-4 py-3 text-body-regular text-content-secondary">
                <strong class="text-content-primary">Pinned indicator</strong><br>
                Any item that is "pinned" (views, columns, favorites)
              </td>
              <td class="px-4 py-3">
                <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">w-4 h-4</code>
              </td>
              <td class="px-4 py-3 text-body-regular text-content-secondary">
                AxisNavigationTab, AxisTable
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 p-4 bg-alert-50 dark:bg-alert-950 border border-alert-200 dark:border-alert-800 rounded-lg">
        <p class="text-body-regular text-alert-800 dark:text-alert-200">
          <strong>Important:</strong> These icons are platform standards and must NOT be substituted with alternatives.
          Using consistent icons across the platform improves user recognition and reduces cognitive load.
        </p>
      </div>

      <!-- SVG Code Reference -->
      <div class="mt-4">
        <p class="text-body-regular font-medium text-content-primary mb-2">Pushpin SVG Path (copy for reuse)</p>
        <div class="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg font-mono text-label overflow-x-auto">
          <code class="text-content-secondary whitespace-pre">M19 12.87c0-.47-.18-.92-.51-1.25l-3.12-3.12V4c.55 0 1-.45 1-1s-.45-1-1-1H8.5c-.55 0-1 .45-1 1s.45 1 1 1v4.5L5.38 11.62c-.33.33-.51.78-.51 1.25 0 .97.78 1.75 1.75 1.75H11v6.62c0 .55.45 1 1 1s1-.45 1-1v-6.62h4.38c.97 0 1.75-.78 1.62-1.75Z</code>
        </div>
      </div>
    </div>

    <!-- Usage Guidelines -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-3">Usage Guidelines</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p class="text-body-regular font-medium text-content-primary mb-2">Best Practices</p>
          <ul class="space-y-1 text-body-regular text-content-secondary">
            <li>Use 1.5px stroke width consistently</li>
            <li>Pair icons with text labels for accessibility</li>
            <li>20px (sm) for inline text and navigation</li>
            <li>24px (md) for buttons and primary actions</li>
          </ul>
        </div>
        <div>
          <p class="text-body-regular font-medium text-content-primary mb-2">Color Usage</p>
          <ul class="space-y-1 text-body-regular text-content-secondary">
            <li>Neutral 500-700 for default state</li>
            <li>Main 500-700 for active/selected</li>
            <li>Error 500 for destructive actions</li>
            <li>Success 500 for confirmations</li>
          </ul>
        </div>
      </div>
      <div class="mt-4 p-3 bg-info-50 rounded-lg">
        <p class="text-body-regular text-info-700">
          Uses <a href="https://heroicons.com" target="_blank" class="underline">Heroicons</a>.
          Install: <code class="bg-info-100 px-1 rounded text-label">npm install @heroicons/vue</code>
        </p>
      </div>
    </div>
  </div>
</template>
