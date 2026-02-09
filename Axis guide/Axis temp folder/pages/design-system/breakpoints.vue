<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Responsiveness | Design System | 8020",
});

// Breakpoint definitions
const breakpoints = [
  { name: "sm", width: "640px", rem: "40rem", css: "@media (width >= 40rem)", usage: "Mobile landscape" },
  { name: "md", width: "768px", rem: "48rem", css: "@media (width >= 48rem)", usage: "Tablets" },
  { name: "lg", width: "1024px", rem: "64rem", css: "@media (width >= 64rem)", usage: "Desktop" },
  { name: "xl", width: "1280px", rem: "80rem", css: "@media (width >= 80rem)", usage: "Large desktop" },
  { name: "2xl", width: "1536px", rem: "96rem", css: "@media (width >= 96rem)", usage: "Extra large screens" },
];

// Max-width variants
const maxBreakpoints = [
  { name: "max-sm", width: "< 640px", css: "@media (width < 40rem)", usage: "Mobile only" },
  { name: "max-md", width: "< 768px", css: "@media (width < 48rem)", usage: "Below tablet" },
  { name: "max-lg", width: "< 1024px", css: "@media (width < 64rem)", usage: "Below desktop" },
  { name: "max-xl", width: "< 1280px", css: "@media (width < 80rem)", usage: "Below large desktop" },
  { name: "max-2xl", width: "< 1536px", css: "@media (width < 96rem)", usage: "Below extra large" },
];

// Responsive examples
const responsiveExamples = [
  {
    title: "Mobile-First Layout",
    description: "Stack on mobile, side-by-side on larger screens",
    code: `<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/3">Sidebar</div>
  <div class="w-full md:w-2/3">Content</div>
</div>`,
  },
  {
    title: "Responsive Grid",
    description: "1 column on mobile, 2 on tablet, 3 on desktop",
    code: `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Grid items -->
</div>`,
  },
  {
    title: "Responsive Text",
    description: "Smaller text on mobile, larger on desktop",
    code: `<h1 class="text-h3 md:text-h2 lg:text-h1">
  Responsive Heading
</h1>`,
  },
  {
    title: "Show/Hide Elements",
    description: "Hide on mobile, show on desktop",
    code: `<div class="hidden lg:block">
  Desktop only sidebar
</div>
<div class="block lg:hidden">
  Mobile navigation
</div>`,
  },
];
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Responsiveness</h1>
      <p class="text-body-regular text-content-secondary">
        Responsive breakpoint definitions, mobile-first approach, and guidelines for adaptive layouts.
      </p>
    </div>

    <!-- Mobile-First Approach -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Mobile-First Approach</h2>

      <AxisCallout title="Core Principle" class="mb-4">
        Tailwind uses a mobile-first approach. <strong>Unprefixed utilities</strong> apply to all screen sizes.
        <strong>Prefixed utilities</strong> (sm:, md:, lg:) apply at that breakpoint <strong>and above</strong>.
      </AxisCallout>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded-lg">
          <p class="text-body-regular font-medium text-error-800 dark:text-error-300 mb-2">Don't target mobile with sm:</p>
          <div class="bg-surface-base rounded p-3 text-label">
            <code class="text-error-600 dark:text-error-400">&lt;div class="sm:text-center"&gt;</code>
            <p class="text-content-secondary mt-2">This only centers text on screens 640px and wider, NOT on mobile!</p>
          </div>
        </div>
        <div class="p-4 bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800 rounded-lg">
          <p class="text-body-regular font-medium text-success-800 dark:text-success-300 mb-2">Use unprefixed for mobile</p>
          <div class="bg-surface-base rounded p-3 text-label">
            <code class="text-success-700 dark:text-success-400">&lt;div class="text-center sm:text-left"&gt;</code>
            <p class="text-content-secondary mt-2">Centers on mobile, left-aligns on sm screens and above.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Breakpoints Table -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Breakpoint Scale</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Standard Tailwind breakpoints. These apply at the minimum width and above.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Prefix</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Min Width</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">CSS</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Typical Usage</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="bp in breakpoints" :key="bp.name">
              <td class="py-2 pr-4">
                <code class="text-h5 text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">{{ bp.name }}:</code>
              </td>
              <td class="py-2 pr-4 text-label text-content-secondary">
                {{ bp.width }} <span class="text-content-tertiary">({{ bp.rem }})</span>
              </td>
              <td class="py-2 pr-4 text-label text-content-tertiary font-mono">{{ bp.css }}</td>
              <td class="py-2 text-label text-content-primary">{{ bp.usage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Max-Width Variants -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Max-Width Variants</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use <code class="bg-neutral-100 dark:bg-neutral-800 px-1 rounded text-label">max-*</code> variants to apply styles only below a breakpoint.
      </p>

      <div class="overflow-x-auto mb-4">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Variant</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Width Range</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">CSS</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Usage</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="bp in maxBreakpoints" :key="bp.name">
              <td class="py-2 pr-4">
                <code class="text-label text-accent-2-600 dark:text-accent-2-400 bg-accent-2-50 dark:bg-accent-2-950 px-2 py-0.5 rounded">{{ bp.name }}:</code>
              </td>
              <td class="py-2 pr-4 text-label text-content-secondary">{{ bp.width }}</td>
              <td class="py-2 pr-4 text-label text-content-tertiary font-mono">{{ bp.css }}</td>
              <td class="py-2 text-label text-content-primary">{{ bp.usage }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Range Example -->
      <div class="p-4 bg-surface-raised rounded-lg">
        <p class="text-label-bold text-content-primary mb-2">Targeting a Range</p>
        <p class="text-label text-content-secondary mb-3">Combine min and max to target a specific range:</p>
        <div class="bg-neutral-900 rounded p-3 text-label">
          <div class="text-neutral-400 mb-1">&lt;!-- Only applies between md (768px) and xl (1280px) --&gt;</div>
          <code class="text-neutral-100">&lt;div class="<span class="text-main-300">md:max-xl:flex</span>"&gt;...&lt;/div&gt;</code>
        </div>
      </div>
    </div>

    <!-- Responsive Examples -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Common Patterns</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Frequently used responsive patterns in the platform.
      </p>

      <div class="space-y-4">
        <div v-for="example in responsiveExamples" :key="example.title" class="bg-surface-base border border-stroke rounded-lg overflow-hidden">
          <div class="px-4 py-3 bg-surface-raised border-b border-stroke">
            <p class="text-body-regular font-medium text-content-primary">{{ example.title }}</p>
            <p class="text-label text-content-secondary">{{ example.description }}</p>
          </div>
          <div class="p-4 bg-neutral-900 overflow-x-auto">
            <pre class="text-label text-neutral-100 whitespace-pre">{{ example.code }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Arbitrary Breakpoints -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Arbitrary Breakpoints</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        For one-off breakpoints not in the scale, use square bracket syntax.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-content-primary mb-2">Custom Min-Width</p>
          <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">min-[900px]:flex</code>
          <p class="text-label text-content-secondary mt-2">Applies flex at 900px and above</p>
        </div>
        <div class="p-4 bg-surface-raised rounded-lg">
          <p class="text-label-bold text-content-primary mb-2">Custom Max-Width</p>
          <code class="text-label text-main-600 dark:text-main-400 bg-main-50 dark:bg-main-950 px-2 py-0.5 rounded">max-[600px]:hidden</code>
          <p class="text-label text-content-secondary mt-2">Hidden on screens below 600px</p>
        </div>
      </div>

      <AxisCallout type="warning" title="Note" class="mt-4">
        Prefer standard breakpoints for consistency. Only use arbitrary values when the standard scale doesn't fit your needs.
      </AxisCallout>
    </div>

    <!-- Platform Sidebar Behavior -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Sidebar Responsive Behavior</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        How the platform sidebar adapts to different screen sizes.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Breakpoint</th>
              <th class="py-2 pr-4 text-label-bold text-neutral-700 dark:text-neutral-300">Sidebar State</th>
              <th class="py-2 text-label-bold text-neutral-700 dark:text-neutral-300">Content Padding</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr>
              <td class="py-2 pr-4 text-label text-content-secondary">< sm (640px)</td>
              <td class="py-2 pr-4 text-label text-content-primary">Hidden or overlay</td>
              <td class="py-2"><code class="text-label text-main-600 dark:text-main-400">pl-0</code></td>
            </tr>
            <tr>
              <td class="py-2 pr-4 text-label text-content-secondary">sm - lg</td>
              <td class="py-2 pr-4 text-label text-content-primary">Collapsed (icons only)</td>
              <td class="py-2"><code class="text-label text-main-600 dark:text-main-400">pl-14</code> (56px)</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 text-label text-content-secondary">lg+ (user expanded)</td>
              <td class="py-2 pr-4 text-label text-content-primary">Expanded (icons + labels)</td>
              <td class="py-2"><code class="text-label text-main-600 dark:text-main-400">pl-56</code> (224px)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Best Practices -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-3">Best Practices</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Design mobile layouts first</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use standard breakpoints when possible</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Test on actual devices, not just resized browsers</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Consider touch targets on mobile (min 44px)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use responsive text sizes for readability</span>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use sm: to target mobile</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Hide important content on mobile</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use fixed widths that break on small screens</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Forget to test landscape orientation</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Create too many arbitrary breakpoints</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
