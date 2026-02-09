<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Slider | Components | Design System | 8020",
});

// Variant demos
const basicValue = ref(50);
const withValueDisplay = ref(75);
const withPrefix = ref(250000);
const withSuffix = ref(65);

// Size demos
const sliderSm = ref(30);
const sliderMd = ref(50);
const sliderLg = ref(70);

// State demos
const sliderDefault = ref(50);
const sliderError = ref(25);
const sliderDisabled = ref(40);

// Interactive examples (real-world buybox scenarios)
const minPropertyValue = ref(150000);
const maxPropertyAge = ref(30);
const lotSizeAcres = ref(2);
const confidenceThreshold = ref(80);

// Anatomy demo
const anatomyValue = ref(60);

// Helper for formatting currency
const formatCurrency = (value: number) => {
  return value.toLocaleString();
};
</script>

<template>
  <div class="design-system-page">
    <!-- Header -->
    <div class="mb-8">
      <p class="text-label text-content-tertiary mb-2">3. Components</p>
      <h1 class="text-h1 text-content-primary mb-3">Slider</h1>
      <p class="text-body-regular text-content-secondary max-w-3xl">
        A single-value range slider for selecting numeric values within a defined range. Sliders
        provide a visual representation of a value on a continuous scale, ideal when approximate
        values are acceptable and visual feedback of position adds clarity.
      </p>
    </div>

    <!-- When to Use -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-4">When to Use</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <AxisCallout type="success" title="Use Slider when">
          <ul class="list-disc list-inside space-y-1 text-body-regular">
            <li>User needs to select a value within a continuous numeric range</li>
            <li>Approximate values are acceptable (exact precision is not critical)</li>
            <li>The range has clear, meaningful min/max boundaries</li>
            <li>Visual feedback of position along a scale adds value to the interaction</li>
          </ul>
        </AxisCallout>

        <AxisCallout type="warning" title="Don't use Slider when">
          <ul class="list-disc list-inside space-y-1 text-body-regular">
            <li>Exact numeric input is required (use AxisInput with number type)</li>
            <li>The range is extremely large, e.g. 1-1,000,000, where granularity is lost</li>
            <li>The range has very few discrete values, e.g. 1-3 (use radio buttons)</li>
            <li>Selecting dates or non-numeric values (use date picker or select)</li>
          </ul>
        </AxisCallout>
      </div>
    </section>

    <!-- Variants -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Variants</h2>

      <!-- Default -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Default</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          The basic slider without value display. Use when the precise number is not critical and
          the position along the track provides sufficient feedback.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="max-w-md">
            <AxisSlider v-model="basicValue" :min="0" :max="100" />
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSlider v-model="value" :min="0" :max="100" /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- With Value Display -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">With Value Display</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Shows the current numeric value beside the slider. Use when users need to see the exact
          selected value as they drag.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="max-w-md">
            <AxisSlider v-model="withValueDisplay" :min="0" :max="100" show-value />
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSlider v-model="value" :min="0" :max="100" show-value /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- With Prefix -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">With Prefix</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Adds a prefix to the displayed value, such as a currency symbol. Requires
          <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">show-value</code>
          to be enabled.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="max-w-md">
            <AxisSlider
              v-model="withPrefix"
              :min="0"
              :max="500000"
              :step="10000"
              show-value
              prefix="$"
            />
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSlider
  v-model="value"
  :min="0"
  :max="500000"
  :step="10000"
  show-value
  prefix="$"
/&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- With Suffix -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">With Suffix</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Adds a suffix to the displayed value, such as a unit or percentage sign. Requires
          <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">show-value</code>
          to be enabled.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="max-w-md">
            <AxisSlider
              v-model="withSuffix"
              :min="0"
              :max="100"
              show-value
              suffix="%"
            />
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSlider
  v-model="value"
  :min="0"
  :max="100"
  show-value
  suffix="%"
/&gt;</code></pre>
          </details>
        </div>
      </div>
    </section>

    <!-- Sizes -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Sizes</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Three size variants control the track height. The thumb size remains consistent across all
        variants for comfortable interaction.
      </p>

      <div class="overflow-x-auto mb-6">
        <table class="w-full text-body-regular border-collapse">
          <thead>
            <tr class="border-b-2 border-stroke-strong">
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Size</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Track Height</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Usage</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stroke">
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">sm</td>
              <td class="py-3 px-4 text-content-secondary">h-1 (4px)</td>
              <td class="py-3 px-4 text-content-secondary">Compact contexts, filter sidebars</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">md</td>
              <td class="py-3 px-4 text-content-secondary">h-1.5 (6px)</td>
              <td class="py-3 px-4 text-content-secondary">Standard forms, settings (default)</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">lg</td>
              <td class="py-3 px-4 text-content-secondary">h-2 (8px)</td>
              <td class="py-3 px-4 text-content-secondary">Emphasis, primary controls</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-surface-raised border border-stroke rounded-lg p-6">
        <div class="max-w-md space-y-6">
          <div>
            <p class="text-label text-content-tertiary mb-2">Small (sm)</p>
            <AxisSlider v-model="sliderSm" :min="0" :max="100" size="sm" show-value />
          </div>
          <div>
            <p class="text-label text-content-tertiary mb-2">Medium (md) - default</p>
            <AxisSlider v-model="sliderMd" :min="0" :max="100" size="md" show-value />
          </div>
          <div>
            <p class="text-label text-content-tertiary mb-2">Large (lg)</p>
            <AxisSlider v-model="sliderLg" :min="0" :max="100" size="lg" show-value />
          </div>
        </div>
      </div>

      <!-- Code example -->
      <div class="mt-4">
        <details class="group">
          <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
            View code
          </summary>
          <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisSlider v-model="value" size="sm" show-value /&gt;
&lt;AxisSlider v-model="value" size="md" show-value /&gt;
&lt;AxisSlider v-model="value" size="lg" show-value /&gt;</code></pre>
        </details>
      </div>
    </section>

    <!-- Interactive Examples -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Interactive Examples</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Real-world buybox configuration scenarios showing how sliders work with different ranges,
        steps, prefixes, and suffixes.
      </p>

      <div class="bg-surface-raised border border-stroke rounded-lg divide-y divide-stroke">
        <div class="p-6">
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-body-regular text-content-primary font-medium">Minimum Property Value</p>
              <p class="text-label text-content-tertiary">Set the lowest property value to include in your buybox</p>
            </div>
            <span class="text-label font-medium tabular-nums text-content-primary">${{ formatCurrency(minPropertyValue) }}</span>
          </div>
          <AxisSlider
            v-model="minPropertyValue"
            :min="0"
            :max="500000"
            :step="10000"
            label="Minimum property value"
          />
        </div>

        <div class="p-6">
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-body-regular text-content-primary font-medium">Maximum Property Age</p>
              <p class="text-label text-content-tertiary">Filter properties built within this many years</p>
            </div>
            <span class="text-label font-medium tabular-nums text-content-primary">{{ maxPropertyAge }} yrs</span>
          </div>
          <AxisSlider
            v-model="maxPropertyAge"
            :min="0"
            :max="100"
            label="Maximum property age"
          />
        </div>

        <div class="p-6">
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-body-regular text-content-primary font-medium">Lot Size</p>
              <p class="text-label text-content-tertiary">Minimum lot size in acres for the search area</p>
            </div>
            <span class="text-label font-medium tabular-nums text-content-primary">{{ lotSizeAcres }} acres</span>
          </div>
          <AxisSlider
            v-model="lotSizeAcres"
            :min="0"
            :max="10"
            :step="0.5"
            label="Lot size in acres"
          />
        </div>

        <div class="p-6">
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-body-regular text-content-primary font-medium">Confidence Threshold</p>
              <p class="text-label text-content-tertiary">Minimum confidence score for property matches</p>
            </div>
            <span class="text-label font-medium tabular-nums text-content-primary">{{ confidenceThreshold }}%</span>
          </div>
          <AxisSlider
            v-model="confidenceThreshold"
            :min="0"
            :max="100"
            label="Confidence threshold"
          />
        </div>
      </div>

      <!-- Current state display -->
      <div class="mt-4 p-4 bg-info-50 dark:bg-info-950 border border-info-300 dark:border-info-700 rounded-lg">
        <p class="text-label-bold text-info-900 dark:text-info-100 mb-2">Current Buybox Settings:</p>
        <ul class="text-label text-info-700 dark:text-info-300 space-y-1">
          <li>Min. property value: <strong>${{ formatCurrency(minPropertyValue) }}</strong></li>
          <li>Max. property age: <strong>{{ maxPropertyAge }} years</strong></li>
          <li>Lot size: <strong>{{ lotSizeAcres }} acres</strong></li>
          <li>Confidence threshold: <strong>{{ confidenceThreshold }}%</strong></li>
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
            The standard interactive state. The slider is ready for user interaction with a
            main-500 filled track and a white thumb with a main-500 border.
          </p>
          <div class="bg-surface-raised border border-stroke rounded-lg p-6">
            <div class="max-w-md">
              <AxisSlider v-model="sliderDefault" :min="0" :max="100" show-value />
            </div>
          </div>
        </div>

        <!-- Hover -->
        <div>
          <h3 class="text-h5 text-content-primary mb-3">Hover</h3>
          <p class="text-body-regular text-content-secondary mb-3">
            When the user hovers over the thumb, it scales up to 1.1x, the border darkens to
            main-600, and a subtle shadow appears. This provides clear affordance that the element
            is interactive.
          </p>
          <p class="text-label text-content-tertiary">
            Hover over the slider above to see the effect.
          </p>
        </div>

        <!-- Active -->
        <div>
          <h3 class="text-h5 text-content-primary mb-3">Active (Dragging)</h3>
          <p class="text-body-regular text-content-secondary mb-3">
            While the user is actively dragging the thumb, the border becomes main-700 and the
            thumb scales to 1.05x. The value updates continuously as the user drags.
          </p>
          <p class="text-label text-content-tertiary">
            Click and drag the slider above to see the active state.
          </p>
        </div>

        <!-- Error -->
        <div>
          <h3 class="text-h5 text-content-primary mb-3">Error</h3>
          <p class="text-body-regular text-content-secondary mb-3">
            Indicates a validation error. The track fill, thumb border, and value text all switch to
            the error color palette. Use when the selected value falls outside an acceptable range.
          </p>
          <div class="bg-surface-raised border border-stroke rounded-lg p-6">
            <div class="max-w-md">
              <AxisSlider v-model="sliderError" :min="0" :max="100" show-value suffix="%" error />
            </div>
          </div>
        </div>

        <!-- Disabled -->
        <div>
          <h3 class="text-h5 text-content-primary mb-3">Disabled</h3>
          <p class="text-body-regular text-content-secondary mb-3">
            Non-interactive state at 50% opacity with a cursor-not-allowed indicator. The thumb
            border becomes neutral-400. Use when the slider depends on another setting or the user
            lacks permission.
          </p>
          <div class="bg-surface-raised border border-stroke rounded-lg p-6">
            <div class="max-w-md">
              <AxisSlider v-model="sliderDisabled" :min="0" :max="100" show-value disabled />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Anatomy -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Anatomy</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        The slider is composed of four visual elements that work together to communicate value
        and range.
      </p>

      <div class="bg-surface-raised border border-stroke rounded-lg p-6 mb-6">
        <div class="max-w-md">
          <AxisSlider v-model="anatomyValue" :min="0" :max="100" show-value suffix="%" />
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-label font-semibold text-content-primary">1</span>
          <div>
            <p class="text-body-regular text-content-primary font-medium">Track Background</p>
            <p class="text-body-regular text-content-secondary">
              The full-width rounded bar representing the complete range. Uses
              <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">neutral-200/60</code>
              in light mode and
              <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">neutral-600/40</code>
              in dark mode.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-label font-semibold text-content-primary">2</span>
          <div>
            <p class="text-body-regular text-content-primary font-medium">Fill Track</p>
            <p class="text-body-regular text-content-secondary">
              The colored portion from the minimum value to the current value. Uses
              <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">main-500</code>
              in light mode and
              <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">main-400</code>
              in dark mode. Switches to error colors when in error state.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-label font-semibold text-content-primary">3</span>
          <div>
            <p class="text-body-regular text-content-primary font-medium">Thumb</p>
            <p class="text-body-regular text-content-secondary">
              The draggable circular handle (1rem diameter) with a white background and 2px
              <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">main-500</code>
              border. Includes hover scale (1.1x), active scale (1.05x), and shadow transitions.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-label font-semibold text-content-primary">4</span>
          <div>
            <p class="text-body-regular text-content-primary font-medium">Value Display</p>
            <p class="text-body-regular text-content-secondary">
              Optional numeric text shown to the right of the slider when
              <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">show-value</code>
              is enabled. Renders with
              <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">tabular-nums</code>
              for stable width as values change, and supports prefix/suffix strings.
            </p>
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
              <td class="py-3 px-4 text-content-secondary">number</td>
              <td class="py-3 px-4 text-content-tertiary">&mdash;</td>
              <td class="py-3 px-4 text-content-secondary">Current slider value (required)</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">min</td>
              <td class="py-3 px-4 text-content-secondary">number</td>
              <td class="py-3 px-4 text-content-tertiary">0</td>
              <td class="py-3 px-4 text-content-secondary">Minimum allowed value</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">max</td>
              <td class="py-3 px-4 text-content-secondary">number</td>
              <td class="py-3 px-4 text-content-tertiary">100</td>
              <td class="py-3 px-4 text-content-secondary">Maximum allowed value</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">step</td>
              <td class="py-3 px-4 text-content-secondary">number</td>
              <td class="py-3 px-4 text-content-tertiary">1</td>
              <td class="py-3 px-4 text-content-secondary">Increment step size</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">disabled</td>
              <td class="py-3 px-4 text-content-secondary">boolean</td>
              <td class="py-3 px-4 text-content-tertiary">false</td>
              <td class="py-3 px-4 text-content-secondary">Disables interaction</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">showValue</td>
              <td class="py-3 px-4 text-content-secondary">boolean</td>
              <td class="py-3 px-4 text-content-tertiary">false</td>
              <td class="py-3 px-4 text-content-secondary">Shows numeric value display beside slider</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">prefix</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">""</td>
              <td class="py-3 px-4 text-content-secondary">Prefix for value display (e.g., "$")</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">suffix</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">""</td>
              <td class="py-3 px-4 text-content-secondary">Suffix for value display (e.g., "%")</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">label</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">"Slider"</td>
              <td class="py-3 px-4 text-content-secondary">Accessible label (aria-label)</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">size</td>
              <td class="py-3 px-4 text-content-secondary">'sm' | 'md' | 'lg'</td>
              <td class="py-3 px-4 text-content-tertiary">"md"</td>
              <td class="py-3 px-4 text-content-secondary">Size variant controlling track height</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">error</td>
              <td class="py-3 px-4 text-content-secondary">boolean</td>
              <td class="py-3 px-4 text-content-tertiary">false</td>
              <td class="py-3 px-4 text-content-secondary">Error state styling</td>
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
              <td class="py-3 px-4 text-content-secondary">number</td>
              <td class="py-3 px-4 text-content-secondary">Emitted continuously as the slider value changes (for v-model)</td>
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
            <li><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Tab</kbd> - Focus the slider input</li>
            <li><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Arrow Right</kbd> / <kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Arrow Up</kbd> - Increase by one step</li>
            <li><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Arrow Left</kbd> / <kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Arrow Down</kbd> - Decrease by one step</li>
          </ul>
          <p class="text-label text-content-tertiary mt-2">
            Native
            <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">&lt;input type="range"&gt;</code>
            handles all keyboard interactions automatically.
          </p>
        </div>

        <div>
          <h3 class="text-h5 text-content-primary mb-2">Screen Readers</h3>
          <ul class="list-disc list-inside text-body-regular text-content-secondary space-y-1">
            <li>Uses native <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">&lt;input type="range"&gt;</code> for correct role announcement</li>
            <li>Current value, min, and max are announced natively by the browser</li>
            <li>Custom accessible label via <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">aria-label</code> prop</li>
          </ul>
        </div>

        <div>
          <h3 class="text-h5 text-content-primary mb-2">Focus Indicators</h3>
          <p class="text-body-regular text-content-secondary">
            The browser default focus ring is applied to the native range input when focused via
            keyboard. The thumb also provides visual feedback on focus and hover with border color
            changes and scale transitions.
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
              <span>Set meaningful min and max values that represent the actual data range</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">&#10003;</span>
              <span>Use showValue when the exact number matters to the user</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">&#10003;</span>
              <span>Provide appropriate prefix/suffix to clarify units (e.g., "$", "%", "yrs")</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">&#10003;</span>
              <span>Use appropriate step sizes (step=10000 for dollar ranges, step=0.5 for small ranges)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">&#10003;</span>
              <span>Include a descriptive label for screen reader users</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">&#10007;</span>
              <span>Use extremely large ranges without adjusting the step size</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">&#10007;</span>
              <span>Omit value display when precision matters to the user</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">&#10007;</span>
              <span>Use sliders for ranges with fewer than 5 meaningful positions</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">&#10007;</span>
              <span>Forget to handle the error state for form validation scenarios</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">&#10007;</span>
              <span>Use a slider as the sole input when exact values are critical (pair with number input)</span>
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
          to="/design-system/components/star-rating"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Star Rating</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <NuxtLink
          to="/design-system/components/inputs"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Inputs</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <NuxtLink
          to="/design-system/components/checkbox-radio"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Checkbox & Radio</span>
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
