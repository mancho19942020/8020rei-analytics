<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Data Visualization | Axis Design System",
});

// Categorical color palette for charts
const categoricalColors = [
  { name: "Category 1", token: "accent-1-500", hex: "#3b82f6", use: "Primary data series" },
  { name: "Category 2", token: "accent-2-500", hex: "#6366f1", use: "Secondary data series" },
  { name: "Category 3", token: "accent-3-500", hex: "#f97316", use: "Third data series" },
  { name: "Category 4", token: "accent-4-500", hex: "#84cc16", use: "Fourth data series" },
  { name: "Category 5", token: "accent-5-500", hex: "#ec4899", use: "Fifth data series" },
  { name: "Category 6", token: "info-500", hex: "#06b6d4", use: "Sixth data series" },
];

// Sequential palette (single hue for gradients)
const sequentialPalettes = [
  {
    name: "Blue Sequential",
    description: "For continuous data, heat maps, density",
    colors: [
      { shade: "100", hex: "#dbeafe" },
      { shade: "300", hex: "#93c5fd" },
      { shade: "500", hex: "#3b82f6" },
      { shade: "700", hex: "#1d4ed8" },
      { shade: "900", hex: "#1e3a8a" },
    ],
  },
  {
    name: "Green Sequential",
    description: "For positive trends, growth metrics",
    colors: [
      { shade: "100", hex: "#dcfce7" },
      { shade: "300", hex: "#86efac" },
      { shade: "500", hex: "#22c55e" },
      { shade: "700", hex: "#15803d" },
      { shade: "900", hex: "#14532d" },
    ],
  },
];

// Semantic colors for status visualization
const semanticDataColors = [
  { name: "Positive", token: "success-500", hex: "#22c55e", use: "Growth, gains, positive values" },
  { name: "Negative", token: "error-500", hex: "#ef4444", use: "Decline, losses, negative values" },
  { name: "Warning", token: "alert-500", hex: "#eab308", use: "Caution, threshold warnings" },
  { name: "Neutral", token: "neutral-400", hex: "#9ca3af", use: "Baseline, unchanged values" },
];

// Chart types with use cases
const chartTypes = [
  {
    name: "Bar Chart",
    icon: "bar",
    use: "Compare discrete categories",
    when: "Comparing values across categories, showing rankings",
    avoid: "Too many categories (>12), continuous data",
  },
  {
    name: "Line Chart",
    icon: "line",
    use: "Show trends over time",
    when: "Time series data, tracking changes, multiple series comparison",
    avoid: "Categorical data, few data points (<5)",
  },
  {
    name: "Donut Chart",
    icon: "donut",
    use: "Show part-to-whole relationships",
    when: "Composition data, percentages, limited categories (2-6)",
    avoid: "Many categories, comparing similar values, time series",
  },
  {
    name: "Area Chart",
    icon: "area",
    use: "Show volume over time",
    when: "Cumulative totals, stacked comparisons, emphasizing magnitude",
    avoid: "Negative values, overlapping series that obscure data",
  },
  {
    name: "Scatter Plot",
    icon: "scatter",
    use: "Show correlations",
    when: "Relationship between two variables, identifying clusters/outliers",
    avoid: "Time series, categorical data, small datasets",
  },
];
</script>

<template>
  <div class="space-y-0">
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Data Visualization</h1>
      <p class="text-body-regular text-content-secondary">
        Chart styles, color palettes for data, and best practices for creating
        clear, accessible, and meaningful visualizations.
      </p>
    </div>

    <!-- Color Palettes Introduction -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Color Principles</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Data visualization colors must be distinct, accessible, and meaningful.
        Use semantic colors for status, categorical colors for comparison, and
        sequential colors for continuous data.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Distinguishable</h3>
          <p class="text-body-regular text-content-secondary">
            Adjacent colors should have enough contrast to be easily distinguished,
            even for colorblind users.
          </p>
        </div>
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Meaningful</h3>
          <p class="text-body-regular text-content-secondary">
            Use semantic colors consistently. Green for positive, red for negative,
            and neutral grays for baseline.
          </p>
        </div>
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-h5 text-content-primary mb-2">Accessible</h3>
          <p class="text-body-regular text-content-secondary">
            Ensure 3:1 contrast ratio minimum. Don't rely on color alone—use
            patterns, labels, or icons.
          </p>
        </div>
      </div>
    </div>

    <!-- Categorical Colors -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Categorical Palette</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use for comparing distinct categories. Maximum 6 colors recommended for
        readability. For more categories, group or use interactive filtering.
      </p>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <div
          v-for="(color, index) in categoricalColors"
          :key="color.token"
          class="text-center"
        >
          <div
            class="h-16 rounded-lg mb-2 shadow-sm"
            :style="{ backgroundColor: color.hex }"
          />
          <p class="text-label-bold text-content-primary">{{ index + 1 }}</p>
          <code class="text-suggestion text-content-tertiary">{{ color.token }}</code>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-stroke">
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Order</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Token</th>
              <th class="py-2 pr-4 text-label-bold text-content-secondary">Hex</th>
              <th class="py-2 text-label-bold text-content-secondary">Usage</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(color, index) in categoricalColors"
              :key="color.token"
              class="border-b border-stroke-subtle"
            >
              <td class="py-2 pr-4">
                <div class="flex items-center gap-2">
                  <span
                    class="w-4 h-4 rounded"
                    :style="{ backgroundColor: color.hex }"
                  />
                  <span class="text-body-regular text-content-secondary">{{ index + 1 }}</span>
                </div>
              </td>
              <td class="py-2 pr-4">
                <code class="text-label bg-surface-raised px-2 py-1 rounded">{{ color.token }}</code>
              </td>
              <td class="py-2 pr-4 text-body-regular text-content-secondary font-mono">{{ color.hex }}</td>
              <td class="py-2 text-body-regular text-content-secondary">{{ color.use }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sequential Colors -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Sequential Palettes</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use for continuous data, heat maps, and showing intensity or density.
        Lighter values represent lower values, darker for higher.
      </p>

      <div class="space-y-6">
        <div v-for="palette in sequentialPalettes" :key="palette.name">
          <h3 class="text-h5 text-content-primary mb-1">{{ palette.name }}</h3>
          <p class="text-body-regular text-content-tertiary mb-3">{{ palette.description }}</p>

          <div class="flex rounded-lg overflow-hidden h-12 shadow-sm">
            <div
              v-for="color in palette.colors"
              :key="color.shade"
              class="flex-1 flex items-center justify-center"
              :style="{ backgroundColor: color.hex }"
            >
              <span
                :class="[
                  'text-suggestion font-medium',
                  parseInt(color.shade) < 500 ? 'text-neutral-700' : 'text-white'
                ]"
              >
                {{ color.shade }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Semantic Data Colors -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Semantic Colors</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Use consistent semantic colors to convey meaning. These should be used
        for status indicators, trend directions, and threshold alerts.
      </p>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="color in semanticDataColors"
          :key="color.name"
          class="p-4 bg-surface-raised rounded-lg"
        >
          <div
            class="w-full h-10 rounded-md mb-3"
            :style="{ backgroundColor: color.hex }"
          />
          <h3 class="text-h5 text-content-primary mb-1">{{ color.name }}</h3>
          <code class="text-suggestion text-content-tertiary block mb-2">{{ color.token }}</code>
          <p class="text-label text-content-secondary">{{ color.use }}</p>
        </div>
      </div>
    </div>

    <!-- Chart Types -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Chart Selection Guide</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Choose the right chart type based on your data and the story you want to tell.
      </p>

      <div class="space-y-4">
        <div
          v-for="chart in chartTypes"
          :key="chart.name"
          class="p-4 bg-surface-raised rounded-lg"
        >
          <div class="flex items-start gap-4">
            <!-- Chart icon placeholder -->
            <div class="w-16 h-16 bg-surface-base rounded-lg flex items-center justify-center shrink-0 border border-stroke-subtle">
              <svg v-if="chart.icon === 'bar'" class="w-8 h-8 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13h2v8H3v-8zm6-5h2v13H9V8zm6-5h2v18h-2V3zm6 8h2v10h-2v-10z" />
              </svg>
              <svg v-else-if="chart.icon === 'line'" class="w-8 h-8 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 17l6-6 4 4 8-8" />
              </svg>
              <svg v-else-if="chart.icon === 'donut'" class="w-8 h-8 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              <svg v-else-if="chart.icon === 'area'" class="w-8 h-8 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 17l6-6 4 4 8-8v11H3z" />
              </svg>
              <svg v-else-if="chart.icon === 'scatter'" class="w-8 h-8 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <circle cx="6" cy="14" r="2" />
                <circle cx="10" cy="8" r="2" />
                <circle cx="14" cy="16" r="2" />
                <circle cx="18" cy="6" r="2" />
              </svg>
            </div>

            <div class="flex-1">
              <h3 class="text-h5 text-content-primary mb-1">{{ chart.name }}</h3>
              <p class="text-body-regular text-content-secondary mb-2">{{ chart.use }}</p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-label">
                <div>
                  <span class="text-success-700 font-medium">When to use:</span>
                  <span class="text-content-secondary ml-1">{{ chart.when }}</span>
                </div>
                <div>
                  <span class="text-error-700 font-medium">Avoid when:</span>
                  <span class="text-content-secondary ml-1">{{ chart.avoid }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Accessibility -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Accessibility Guidelines</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Approximately 8% of men and 0.5% of women have some form of color vision deficiency.
        Design charts that work for everyone.
      </p>

      <AxisCallout type="info" title="WCAG Compliance" class="mb-6">
        Ensure a minimum 3:1 contrast ratio between adjacent colors in charts.
        Use patterns, labels, or direct annotation in addition to color.
      </AxisCallout>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Add direct labels to data series</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use patterns or textures with color</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Provide text alternatives for key insights</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Test with colorblind simulation tools</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Rely solely on color to convey meaning</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use red and green as only differentiators</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Place text on low-contrast backgrounds</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use thin lines with subtle color differences</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Best Practices -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-4">Best Practices</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Start Y-axis at zero for bar charts</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use consistent time intervals for line charts</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Sort bar charts by value when relevant</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Limit pie/donut slices to 6 maximum</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Remove unnecessary gridlines and borders</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use neutral colors for axes and labels</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Highlight key data points, not everything</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Provide context with titles and annotations</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Show tooltips on hover with full values</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Support keyboard navigation for accessibility</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use 3D effects or chartjunk</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Truncate Y-axis to exaggerate trends</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use pie charts for more than 6 categories</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Rely solely on color to convey meaning</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use red/green as only differentiators</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Clutter charts with too many gridlines</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Render 1000+ points without aggregation</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Hide important context or data sources</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Forget to provide export options</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Make charts inaccessible to keyboard users</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
