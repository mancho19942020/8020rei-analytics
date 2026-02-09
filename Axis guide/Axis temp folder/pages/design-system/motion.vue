<script setup lang="ts">
import { ref } from "vue";

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Motion | Axis Design System",
});

// Interactive demo state
const isAnimating = ref(false);

const triggerAnimation = () => {
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 600);
};

// Duration tokens
const durationTokens = [
  { name: "instant", value: "0ms", css: "duration-0", use: "Immediate state changes, no perceptible delay" },
  { name: "fast", value: "100ms", css: "duration-100", use: "Micro-interactions, button feedback, icon changes" },
  { name: "normal", value: "200ms", css: "duration-200", use: "DEFAULT - Most UI transitions, hovers, focus states" },
  { name: "slow", value: "300ms", css: "duration-300", use: "Panel slides, modal entrances, larger elements" },
  { name: "slower", value: "400ms", css: "duration-400", use: "Complex animations, page transitions" },
  { name: "slowest", value: "500ms", css: "duration-500", use: "Elaborate sequences, onboarding animations" },
];

// Easing tokens
const easingTokens = [
  { name: "ease-out", value: "cubic-bezier(0.0, 0.0, 0.2, 1)", css: "ease-out", use: "DEFAULT - Elements entering, appearing, expanding" },
  { name: "ease-in", value: "cubic-bezier(0.4, 0.0, 1, 1)", css: "ease-in", use: "Elements exiting, disappearing, collapsing" },
  { name: "ease-in-out", value: "cubic-bezier(0.4, 0.0, 0.2, 1)", css: "ease-in-out", use: "Elements that stay on screen, position changes" },
  { name: "linear", value: "cubic-bezier(0.0, 0.0, 1.0, 1.0)", css: "ease-linear", use: "Progress indicators, loading bars, continuous motion" },
];

// Transition properties
const transitionProperties = [
  { property: "all", css: "transition-all", use: "Animate all changing properties (use sparingly)" },
  { property: "colors", css: "transition-colors", use: "Background, text, border color changes" },
  { property: "opacity", css: "transition-opacity", use: "Fade in/out effects" },
  { property: "shadow", css: "transition-shadow", use: "Elevation changes, focus rings" },
  { property: "transform", css: "transition-transform", use: "Scale, rotate, translate animations" },
];
</script>

<template>
  <div class="space-y-0">
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Motion</h1>
      <p class="text-body-regular text-content-secondary">
        Animation principles, timing functions, and guidelines for meaningful motion in the UI.
        Based on Material Design 3 motion principles adapted for Axis.
      </p>
    </div>

    <!-- Principles -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Motion Principles</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Informative</h3>
          <p class="text-body-regular text-content-secondary">
            Motion should guide users by showing relationships between elements and confirming actions.
          </p>
        </div>
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Focused</h3>
          <p class="text-body-regular text-content-secondary">
            Animations should direct attention to what matters without distracting from the task.
          </p>
        </div>
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Expressive</h3>
          <p class="text-body-regular text-content-secondary">
            Motion adds personality and delight while maintaining usability and performance.
          </p>
        </div>
      </div>
    </div>

    <!-- Duration Tokens -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Duration Tokens</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Duration controls how long an animation takes. Use shorter durations for small elements and longer for larger movements.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-3 pr-4 text-label-bold text-content-primary">Token</th>
              <th class="py-3 pr-4 text-label-bold text-content-primary">Value</th>
              <th class="py-3 pr-4 text-label-bold text-content-primary">Tailwind Class</th>
              <th class="py-3 text-label-bold text-content-primary">Usage</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="token in durationTokens"
              :key="token.name"
              class="border-b border-neutral-100 dark:border-neutral-800"
              :class="{ 'bg-main-50 dark:bg-main-950': token.name === 'normal' }"
            >
              <td class="py-3 pr-4">
                <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">{{ token.name }}</code>
                <span v-if="token.name === 'normal'" class="ml-2 text-suggestion text-main-700 dark:text-main-400 font-medium">DEFAULT</span>
              </td>
              <td class="py-3 pr-4 text-body-regular text-content-primary font-mono">{{ token.value }}</td>
              <td class="py-3 pr-4">
                <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">{{ token.css }}</code>
              </td>
              <td class="py-3 text-body-regular text-content-secondary">{{ token.use }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Easing Tokens -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Easing Curves</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Easing defines the rate of change during an animation. Choose based on whether elements are entering, exiting, or transforming.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-3 pr-4 text-label-bold text-content-primary">Token</th>
              <th class="py-3 pr-4 text-label-bold text-content-primary">Cubic Bezier</th>
              <th class="py-3 pr-4 text-label-bold text-content-primary">Tailwind Class</th>
              <th class="py-3 text-label-bold text-content-primary">Usage</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="token in easingTokens"
              :key="token.name"
              class="border-b border-neutral-100 dark:border-neutral-800"
              :class="{ 'bg-main-50 dark:bg-main-950': token.name === 'ease-out' }"
            >
              <td class="py-3 pr-4">
                <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">{{ token.name }}</code>
                <span v-if="token.name === 'ease-out'" class="ml-2 text-suggestion text-main-700 dark:text-main-400 font-medium">DEFAULT</span>
              </td>
              <td class="py-3 pr-4 text-body-regular text-content-primary font-mono text-label">{{ token.value }}</td>
              <td class="py-3 pr-4">
                <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">{{ token.css }}</code>
              </td>
              <td class="py-3 text-body-regular text-content-secondary">{{ token.use }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Visual Easing Curves -->
      <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="token in easingTokens" :key="token.name" class="text-center">
          <div class="h-24 bg-surface-raised rounded-lg mb-2 flex items-end justify-center pb-2 overflow-hidden">
            <div
              class="w-4 h-4 bg-main-500 rounded-full transition-transform duration-500"
              :class="[token.css, isAnimating ? 'translate-y-[-64px]' : 'translate-y-0']"
            />
          </div>
          <code class="text-label text-content-secondary">{{ token.name }}</code>
        </div>
      </div>
      <div class="mt-4 text-center">
        <AxisButton @click="triggerAnimation">
          Play Animation
        </AxisButton>
      </div>
    </div>

    <!-- Transition Properties -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Transition Properties</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Specify which CSS properties should animate. Be specific to improve performance.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-3 pr-4 text-label-bold text-content-primary">Property</th>
              <th class="py-3 pr-4 text-label-bold text-content-primary">Tailwind Class</th>
              <th class="py-3 text-label-bold text-content-primary">Usage</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="prop in transitionProperties"
              :key="prop.property"
              class="border-b border-neutral-100 dark:border-neutral-800"
            >
              <td class="py-3 pr-4">
                <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">{{ prop.property }}</code>
              </td>
              <td class="py-3 pr-4">
                <code class="text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">{{ prop.css }}</code>
              </td>
              <td class="py-3 text-body-regular text-content-secondary">{{ prop.use }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Common Patterns -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Common Patterns</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Standard transition combinations for common UI interactions.
      </p>

      <div class="space-y-4">
        <!-- Button Hover -->
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Button Hover</h3>
          <div class="flex items-center gap-4 mb-3">
            <AxisButton>
              Hover Me
            </AxisButton>
          </div>
          <code class="text-label bg-neutral-100 dark:bg-neutral-800 text-content-primary px-3 py-2 rounded block">
            transition-colors duration-200 ease-out
          </code>
        </div>

        <!-- Card Elevation -->
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Card Elevation</h3>
          <div class="flex items-center gap-4 mb-3">
            <div class="w-32 h-20 bg-surface-base rounded-lg shadow-sm transition-shadow duration-200 ease-out hover:shadow-lg flex items-center justify-center cursor-pointer">
              <span class="text-label text-content-tertiary">Hover</span>
            </div>
          </div>
          <code class="text-label bg-neutral-100 dark:bg-neutral-800 text-content-primary px-3 py-2 rounded block">
            transition-shadow duration-200 ease-out
          </code>
        </div>

        <!-- Fade In/Out -->
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Fade In/Out</h3>
          <p class="text-body-regular text-content-secondary mb-2">For tooltips, dropdowns, and overlays:</p>
          <code class="text-label bg-neutral-100 dark:bg-neutral-800 text-content-primary px-3 py-2 rounded block">
            transition-opacity duration-200 ease-out (entering)<br>
            transition-opacity duration-100 ease-in (exiting)
          </code>
        </div>

        <!-- Scale Transform -->
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Scale Transform</h3>
          <div class="flex items-center gap-4 mb-3">
            <div class="w-16 h-16 bg-accent-1-500 rounded-lg transition-transform duration-200 ease-out hover:scale-110 flex items-center justify-center cursor-pointer">
              <span class="text-white text-label">Hover</span>
            </div>
          </div>
          <code class="text-label bg-neutral-100 dark:bg-neutral-800 text-content-primary px-3 py-2 rounded block">
            transition-transform duration-200 ease-out hover:scale-110
          </code>
        </div>

        <!-- Slide Panel -->
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Slide Panel</h3>
          <p class="text-body-regular text-content-secondary mb-2">For sidebars, drawers, and slide-overs:</p>
          <code class="text-label bg-neutral-100 dark:bg-neutral-800 text-content-primary px-3 py-2 rounded block">
            transition-transform duration-300 ease-out (entering)<br>
            transition-transform duration-200 ease-in (exiting)
          </code>
        </div>
      </div>
    </div>

    <!-- Accessibility -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Accessibility</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Respect user preferences for reduced motion. Always provide a reduced-motion alternative.
      </p>

      <AxisCallout type="warning" title="WCAG Requirement" class="mb-4">
        Users who experience vestibular disorders or motion sensitivity can enable "Reduce motion" in their OS settings.
        Your animations must respect this preference.
      </AxisCallout>

      <div class="space-y-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">CSS Implementation</h3>
          <pre class="text-label bg-neutral-100 dark:bg-neutral-800 text-content-primary p-3 rounded overflow-x-auto"><code>/* In your CSS */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}</code></pre>
        </div>

        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Tailwind Utility</h3>
          <p class="text-body-regular text-content-secondary mb-2">Use Tailwind's motion-safe and motion-reduce variants:</p>
          <pre class="text-label bg-neutral-100 dark:bg-neutral-800 text-content-primary p-3 rounded overflow-x-auto"><code>&lt;div class="motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:scale-105"&gt;
  Animates only if user hasn't enabled reduced motion
&lt;/div&gt;

&lt;div class="motion-reduce:transition-none"&gt;
  Disables transitions when reduced motion is enabled
&lt;/div&gt;</code></pre>
        </div>
      </div>
    </div>

    <!-- Best Practices -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-4">Best Practices</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Do -->
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use 200ms as default duration for most interactions</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use ease-out for elements entering the viewport</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Keep animations subtle and purposeful</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Always respect prefers-reduced-motion</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Be specific with transition properties (colors, opacity, transform)</span>
            </li>
          </ul>
        </div>

        <!-- Don't -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use animations longer than 500ms for UI feedback</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Animate layout properties (width, height, margin, padding)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use transition-all unnecessarily (impacts performance)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Create animations that flash or strobe</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Make animations that block user interaction</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
