<script setup lang="ts">
import type { Rating } from '~/types/buybox-configurator';

definePageMeta({
  layout: 'design-system',
});

useHead({
  title: 'Star Rating | Components | Design System | 8020',
});

// Size demos
const ratingSmall = ref<Rating>(2);
const ratingDefault = ref<Rating>(3);
const ratingLarge = ref<Rating>(4);

// Variant demos
const ratingInteractive = ref<Rating>(3);
const ratingEmpty = ref<Rating>(0);

// State demos
const ratingState = ref<Rating>(3);

// Interactive examples (buybox scoring)
const propertyCondition = ref<Rating>(4);
const locationDesirability = ref<Rating>(3);
const ownerMotivation = ref<Rating>(5);
const roofAge = ref<Rating>(0);
</script>

<template>
  <div class="design-system-page">
    <!-- Header -->
    <div class="mb-8">
      <p class="text-label text-content-tertiary mb-2">3. Components</p>
      <h1 class="text-h1 text-content-primary mb-3">Star Rating</h1>
      <p class="text-body-regular text-content-secondary max-w-3xl">
        An interactive 5-star rating component for scoring and prioritizing items on a 0-5 scale.
        Used in the buybox configurator to rate property criteria where 0 means excluded and 1-5
        represents weighted importance.
      </p>
    </div>

    <!-- When to Use -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-4">When to Use</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <AxisCallout type="success" title="Use Star Rating when">
          <ul class="list-disc list-inside space-y-1 text-body-regular">
            <li>Scoring or prioritizing items on a relative scale</li>
            <li>Expressing weighted importance (not satisfaction)</li>
            <li>A compact inline control is needed for tables or grids</li>
            <li>Including or excluding items by toggling between 0 and rated</li>
          </ul>
        </AxisCallout>

        <AxisCallout type="warning" title="Don't use Star Rating when">
          <ul class="list-disc list-inside space-y-1 text-body-regular">
            <li>Collecting customer satisfaction or product reviews</li>
            <li>A binary yes/no decision is needed (use checkbox or toggle)</li>
            <li>More than 5 discrete values are required (use slider or input)</li>
            <li>Precise numeric input is required (use AxisInput type="number")</li>
          </ul>
        </AxisCallout>
      </div>
    </section>

    <!-- Variants -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Variants</h2>

      <!-- Interactive (Default) -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Interactive (Default)</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          The standard interactive variant. Users click a star to set the rating. Hovering over
          unfilled stars shows a preview tint. Clicking the same star again deselects it, setting
          the value to 0.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex flex-col gap-3">
            <p class="text-label text-content-tertiary">Click a star to rate, click again to deselect</p>
            <AxisStarRating v-model="ratingInteractive" />
            <p class="text-label text-content-tertiary">
              Current value: <strong class="text-content-primary">{{ ratingInteractive }}</strong>
            </p>
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisStarRating v-model="rating" /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- Read-Only -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Read-Only</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Use for display contexts where the rating should be visible but not editable. The component
          is not focusable and does not respond to hover or click events.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex flex-wrap items-center gap-8">
            <div class="flex flex-col gap-2">
              <p class="text-label text-content-tertiary">4 out of 5</p>
              <AxisStarRating :model-value="4" readonly />
            </div>
            <div class="flex flex-col gap-2">
              <p class="text-label text-content-tertiary">1 out of 5</p>
              <AxisStarRating :model-value="1" readonly />
            </div>
            <div class="flex flex-col gap-2">
              <p class="text-label text-content-tertiary">0 (excluded)</p>
              <AxisStarRating :model-value="0" readonly />
            </div>
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisStarRating :model-value="4" readonly /&gt;
&lt;AxisStarRating :model-value="1" readonly /&gt;
&lt;AxisStarRating :model-value="0" readonly /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- With Custom Label -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">With Custom Label</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Provide a descriptive label for screen readers when the rating's purpose is not clear from
          surrounding context. The label is not visually rendered but is announced by assistive technology.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex flex-col gap-3">
            <p class="text-label text-content-tertiary">Custom label: "Condition rating"</p>
            <AxisStarRating v-model="ratingInteractive" label="Condition rating" />
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisStarRating v-model="rating" label="Condition rating" /&gt;</code></pre>
          </details>
        </div>
      </div>
    </section>

    <!-- Sizes -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Sizes</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Three size variants are available to fit different layout densities. Use
        <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">sm</code>
        for compact tables,
        <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">md</code>
        (default) for standard forms, and
        <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">lg</code>
        for emphasis or detail views.
      </p>

      <div class="bg-surface-raised border border-stroke rounded-lg p-6 mb-4">
        <div class="flex flex-wrap items-end gap-8">
          <div class="flex flex-col gap-2">
            <p class="text-label text-content-tertiary">Small</p>
            <AxisStarRating v-model="ratingSmall" size="sm" />
          </div>
          <div class="flex flex-col gap-2">
            <p class="text-label text-content-tertiary">Medium (default)</p>
            <AxisStarRating v-model="ratingDefault" />
          </div>
          <div class="flex flex-col gap-2">
            <p class="text-label text-content-tertiary">Large</p>
            <AxisStarRating v-model="ratingLarge" size="lg" />
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-label border-collapse">
          <thead>
            <tr class="border-b-2 border-stroke-strong">
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Size</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Dimensions</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Gap</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Usage</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stroke">
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">sm</td>
              <td class="py-3 px-4 text-content-secondary">16px stars</td>
              <td class="py-3 px-4 text-content-secondary">gap-0.5</td>
              <td class="py-3 px-4 text-content-secondary">Compact tables and dense data grids</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">md</td>
              <td class="py-3 px-4 text-content-secondary">20px stars</td>
              <td class="py-3 px-4 text-content-secondary">gap-0.5</td>
              <td class="py-3 px-4 text-content-secondary">Standard forms and settings (default)</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">lg</td>
              <td class="py-3 px-4 text-content-secondary">24px stars</td>
              <td class="py-3 px-4 text-content-secondary">gap-1</td>
              <td class="py-3 px-4 text-content-secondary">Emphasis, detail views, hero sections</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Code example -->
      <div class="mt-4">
        <details class="group">
          <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
            View code
          </summary>
          <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisStarRating v-model="rating" size="sm" /&gt;
&lt;AxisStarRating v-model="rating" /&gt;            &lt;!-- md is default --&gt;
&lt;AxisStarRating v-model="rating" size="lg" /&gt;</code></pre>
        </details>
      </div>
    </section>

    <!-- Interactive Examples -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Interactive Examples</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        A real-world buybox scoring scenario. Rate each property criterion on a 0-5 scale where 0 means
        excluded from scoring and 1-5 represents weighted importance.
      </p>

      <div class="bg-surface-raised border border-stroke rounded-lg divide-y divide-stroke">
        <div class="p-6 flex items-center justify-between">
          <div>
            <p class="text-body-regular text-content-primary font-medium">Property Condition</p>
            <p class="text-label text-content-tertiary">Overall structural and cosmetic condition</p>
          </div>
          <AxisStarRating v-model="propertyCondition" label="Property condition rating" />
        </div>

        <div class="p-6 flex items-center justify-between">
          <div>
            <p class="text-body-regular text-content-primary font-medium">Location Desirability</p>
            <p class="text-label text-content-tertiary">Neighborhood quality and proximity to amenities</p>
          </div>
          <AxisStarRating v-model="locationDesirability" label="Location desirability rating" />
        </div>

        <div class="p-6 flex items-center justify-between">
          <div>
            <p class="text-body-regular text-content-primary font-medium">Owner Motivation</p>
            <p class="text-label text-content-tertiary">Likelihood of owner accepting an offer</p>
          </div>
          <AxisStarRating v-model="ownerMotivation" label="Owner motivation rating" />
        </div>

        <div class="p-6 flex items-center justify-between">
          <div>
            <p class="text-body-regular text-content-primary font-medium">Roof Age</p>
            <p class="text-label text-content-tertiary">Age and condition of the roof</p>
          </div>
          <AxisStarRating v-model="roofAge" label="Roof age rating" />
        </div>
      </div>

      <!-- Current state display -->
      <div class="mt-4 p-4 bg-info-50 dark:bg-info-950 border border-info-300 dark:border-info-700 rounded-lg">
        <p class="text-label-bold text-info-900 dark:text-info-100 mb-2">Current Scores:</p>
        <ul class="text-label text-info-700 dark:text-info-300 space-y-1">
          <li>
            Property Condition: <strong>{{ propertyCondition }}/5</strong>
            <span v-if="propertyCondition === 0"> (excluded)</span>
            <span v-else> (included)</span>
          </li>
          <li>
            Location Desirability: <strong>{{ locationDesirability }}/5</strong>
            <span v-if="locationDesirability === 0"> (excluded)</span>
            <span v-else> (included)</span>
          </li>
          <li>
            Owner Motivation: <strong>{{ ownerMotivation }}/5</strong>
            <span v-if="ownerMotivation === 0"> (excluded)</span>
            <span v-else> (included)</span>
          </li>
          <li>
            Roof Age: <strong>{{ roofAge }}/5</strong>
            <span v-if="roofAge === 0"> (excluded)</span>
            <span v-else> (included)</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- States -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">States</h2>

      <div class="space-y-6">
        <!-- Default -->
        <div>
          <h3 class="text-h5 text-content-primary mb-3">Default</h3>
          <p class="text-body-regular text-content-secondary mb-3">
            The resting state, ready for user interaction. Stars display as filled (rated) or outlined (unrated).
          </p>
          <div class="flex gap-8">
            <div class="flex flex-col gap-2">
              <p class="text-label text-content-tertiary">Empty (0)</p>
              <AxisStarRating v-model="ratingEmpty" />
            </div>
            <div class="flex flex-col gap-2">
              <p class="text-label text-content-tertiary">Rated (3)</p>
              <AxisStarRating v-model="ratingState" />
            </div>
          </div>
        </div>

        <!-- Hover -->
        <div>
          <h3 class="text-h5 text-content-primary mb-3">Hover</h3>
          <p class="text-body-regular text-content-secondary mb-3">
            When hovering over unfilled stars, they display a preview tint
            (<code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">alert-300</code>)
            to indicate the potential new rating.
          </p>
          <p class="text-label text-content-tertiary">
            Hover over the rating above to see the effect.
          </p>
        </div>

        <!-- Focus -->
        <div>
          <h3 class="text-h5 text-content-primary mb-3">Focus</h3>
          <p class="text-body-regular text-content-secondary mb-3">
            Keyboard users see a visible focus ring (2px main-500 ring) around the container when focused.
            Arrow keys navigate the rating value within the focused component.
          </p>
          <p class="text-label text-content-tertiary">
            Tab to the rating component to see the focus ring.
          </p>
        </div>

        <!-- Read-Only -->
        <div>
          <h3 class="text-h5 text-content-primary mb-3">Read-Only</h3>
          <p class="text-body-regular text-content-secondary mb-3">
            Non-interactive display state. The component sets
            <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">tabindex="-1"</code>
            and
            <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">cursor-default</code>,
            preventing focus and interaction.
          </p>
          <div class="flex gap-4">
            <AxisStarRating :model-value="3" readonly />
          </div>
        </div>
      </div>
    </section>

    <!-- Props Reference -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Props</h2>

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
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">v-model</td>
              <td class="py-3 px-4 text-content-secondary">Rating (0|1|2|3|4|5)</td>
              <td class="py-3 px-4 text-content-tertiary">&mdash;</td>
              <td class="py-3 px-4 text-content-secondary">Current star rating value</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">readonly</td>
              <td class="py-3 px-4 text-content-secondary">boolean</td>
              <td class="py-3 px-4 text-content-tertiary">false</td>
              <td class="py-3 px-4 text-content-secondary">Disables interaction, display only</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">size</td>
              <td class="py-3 px-4 text-content-secondary">'sm' | 'md' | 'lg'</td>
              <td class="py-3 px-4 text-content-tertiary">'md'</td>
              <td class="py-3 px-4 text-content-secondary">Size variant controlling star dimensions</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">label</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">'Rating'</td>
              <td class="py-3 px-4 text-content-secondary">Accessible label for screen readers</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Events -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Events</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-label border-collapse">
          <thead>
            <tr class="border-b-2 border-stroke-strong">
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Event</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Payload</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stroke">
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">update:modelValue</td>
              <td class="py-3 px-4 text-content-secondary">Rating (0|1|2|3|4|5)</td>
              <td class="py-3 px-4 text-content-secondary">Emitted when rating changes. Clicking the same star toggles to 0.</td>
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
          <h3 class="text-h5 text-content-primary mb-2">Keyboard Navigation</h3>
          <ul class="list-disc list-inside text-body-regular text-content-secondary space-y-1">
            <li><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Tab</kbd> - Move focus to/from the star rating</li>
            <li><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Arrow Right</kbd> or <kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Arrow Up</kbd> - Increase rating by 1</li>
            <li><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Arrow Left</kbd> or <kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Arrow Down</kbd> - Decrease rating by 1</li>
            <li><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Home</kbd> - Set rating to 0 (minimum)</li>
            <li><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">End</kbd> - Set rating to 5 (maximum)</li>
          </ul>
        </div>

        <div>
          <h3 class="text-h5 text-content-primary mb-2">Screen Readers</h3>
          <ul class="list-disc list-inside text-body-regular text-content-secondary space-y-1">
            <li>Uses <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">role="slider"</code> for correct ARIA semantics</li>
            <li>Current value announced via <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">aria-valuenow</code></li>
            <li>Range defined by <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">aria-valuemin="0"</code> and <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">aria-valuemax="5"</code></li>
            <li>Human-readable text via <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">aria-valuetext="X out of 5 stars"</code></li>
            <li>Individual star buttons have descriptive <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">aria-label</code> attributes</li>
          </ul>
        </div>

        <div>
          <h3 class="text-h5 text-content-primary mb-2">Focus Indicators</h3>
          <p class="text-body-regular text-content-secondary">
            Focus ring appears on the container element (not individual stars). Arrow key navigation
            moves the rating value within the focused slider, so individual stars are not separately
            tabbable (<code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">tabindex="-1"</code> on each star button).
          </p>
        </div>
      </div>
    </section>

    <!-- Best Practices -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Best Practices</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Do's -->
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">&#10003;</span>
              <span>Use the standard 5-star scale consistently across the platform</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">&#10003;</span>
              <span>Provide a descriptive label prop when context is not obvious</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">&#10003;</span>
              <span>Use sm size when embedding in data tables for compact layout</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">&#10003;</span>
              <span>Explain rating meanings (0=excluded, 1-5=weighted) in surrounding UI</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">&#10003;</span>
              <span>Use read-only mode for display contexts where editing is not expected</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">&#10007;</span>
              <span>Use for customer reviews or satisfaction scoring</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">&#10007;</span>
              <span>Omit the label prop when the rating purpose is not clear from context</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">&#10007;</span>
              <span>Mix different size variants within the same table or form</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">&#10007;</span>
              <span>Use star rating when simple include/exclude is sufficient (use checkbox)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">&#10007;</span>
              <span>Expect users to understand the 0-5 scale without contextual guidance</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Related Components -->
    <section>
      <h2 class="text-h3 text-content-primary mb-4">Related Components</h2>
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          to="/design-system/components/checkbox-radio"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Checkbox & Radio</span>
          <span class="text-label text-content-tertiary">&mdash; For binary include/exclude</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <NuxtLink
          to="/design-system/components/toggle"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Toggle</span>
          <span class="text-label text-content-tertiary">&mdash; For on/off settings</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <NuxtLink
          to="/design-system/components/input"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Input</span>
          <span class="text-label text-content-tertiary">&mdash; For precise numeric values</span>
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

kbd {
  @apply inline-block;
}

code {
  @apply inline-block;
}
</style>
