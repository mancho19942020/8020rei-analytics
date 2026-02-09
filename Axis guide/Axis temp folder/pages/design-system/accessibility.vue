<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Accessibility | Design System | 8020",
});

// Core accessibility principles tailored for 8020 platform
const principles = [
  {
    title: "Design for People, Not Compliance",
    description: "Accessibility is about creating experiences where no user feels excluded. We design for real people with diverse abilities, not just to check boxes.",
    icon: "people",
    practices: [
      "Consider users with permanent, temporary, and situational disabilities",
      "Test with real assistive technologies, not just automated tools",
      "Prioritize usability alongside technical compliance",
    ],
  },
  {
    title: "Accessibility Succeeds at the Foundation",
    description: "When our design tokens for color, typography, and spacing meet standards, every component inherits those strengths automatically.",
    icon: "foundation",
    practices: [
      "All color tokens meet WCAG AA contrast requirements",
      "Typography scales support user zoom preferences",
      "Spacing tokens ensure touch targets are adequate",
    ],
  },
  {
    title: "Never Rely on Color Alone",
    description: "Color should enhance meaning, not be the only way to convey it. Some users cannot perceive color, and colors have different meanings across cultures.",
    icon: "color",
    practices: [
      "Use icons, patterns, or text labels alongside color indicators",
      "Error states include both red color AND an icon/message",
      "Charts use patterns or labels in addition to color coding",
    ],
  },
  {
    title: "Keyboard Navigation is Non-Negotiable",
    description: "Every interactive element must be accessible via keyboard. Many users rely on keyboards due to motor impairments or preference.",
    icon: "keyboard",
    practices: [
      "All interactive elements are focusable with Tab key",
      "Focus order follows logical reading order",
      "Visible focus indicators on all focusable elements",
    ],
  },
];

// WCAG standards we follow
const wcagStandards = [
  {
    level: "WCAG 2.2 AA",
    description: "Our target compliance level",
    requirements: [
      { name: "Perceivable", description: "Information must be presentable in ways all users can perceive" },
      { name: "Operable", description: "UI components must be operable by all users" },
      { name: "Understandable", description: "Information and operation must be understandable" },
      { name: "Robust", description: "Content must be robust enough for assistive technologies" },
    ],
  },
];

// Contrast requirements
const contrastRequirements = [
  {
    ratio: "4.5:1",
    label: "Normal Text",
    description: "Required for body text, labels, and text smaller than 18px (or 14px bold)",
    examples: [
      { good: "text-neutral-700 on bg-white", bad: "text-neutral-400 on bg-white" },
      { good: "text-main-900 on bg-main-50", bad: "text-main-500 on bg-main-50" },
    ],
  },
  {
    ratio: "3:1",
    label: "Large Text & UI",
    description: "Required for text 18px+, icons, buttons, and graphical elements",
    examples: [
      { good: "text-neutral-500 on bg-white (headings)", bad: "text-neutral-300 on bg-white" },
      { good: "border-neutral-300 on bg-white", bad: "border-neutral-200 on bg-white" },
    ],
  },
];

// Keyboard navigation patterns
const keyboardPatterns = [
  { key: "Tab", action: "Move focus to next interactive element" },
  { key: "Shift + Tab", action: "Move focus to previous interactive element" },
  { key: "Enter / Space", action: "Activate buttons and links" },
  { key: "Arrow Keys", action: "Navigate within components (menus, tabs, radio groups)" },
  { key: "Escape", action: "Close modals, dropdowns, and dismiss overlays" },
  { key: "Home / End", action: "Jump to first/last item in lists" },
];

// Screen reader guidelines
const screenReaderGuidelines = [
  {
    category: "Semantic HTML",
    description: "Use the correct HTML element for its purpose",
    dos: [
      "Use <button> for actions, <a> for navigation",
      "Use heading hierarchy (h1 > h2 > h3) properly",
      "Use <nav>, <main>, <aside> for page regions",
      "Use <table> with proper <th> for data tables",
    ],
    donts: [
      "Don't use <div> or <span> for interactive elements",
      "Don't skip heading levels (h1 to h3)",
      "Don't use headings just for visual styling",
    ],
  },
  {
    category: "Labels & Text",
    description: "Every element needs accessible text",
    dos: [
      "Provide aria-label for icon-only buttons",
      "Write descriptive link text ('View property details' not 'Click here')",
      "Add alt text to meaningful images",
      "Use aria-describedby for additional context",
    ],
    donts: [
      "Don't leave buttons without accessible names",
      "Don't use 'Click here' or 'Read more' as link text",
      "Don't add alt text to decorative images (use alt='')",
    ],
  },
  {
    category: "Dynamic Content",
    description: "Announce changes to screen reader users",
    dos: [
      "Use aria-live regions for dynamic updates",
      "Announce loading states and completions",
      "Move focus to new content when appropriate",
      "Provide status messages for form submissions",
    ],
    donts: [
      "Don't update content silently without announcement",
      "Don't trap focus in infinite loops",
      "Don't auto-play audio or video without controls",
    ],
  },
];

// Platform-specific considerations for 8020
const platformConsiderations = [
  {
    area: "Data Tables",
    description: "Property data tables are central to our platform",
    guidelines: [
      "Use proper table markup with headers (<th>) and scope attributes",
      "Provide table captions or aria-label describing the data",
      "Ensure sortable columns announce their sort state",
      "Allow keyboard navigation between cells",
    ],
  },
  {
    area: "Maps & Visualizations",
    description: "Geographic data must be accessible",
    guidelines: [
      "Provide text alternatives for map data",
      "Offer tabular views as alternatives to map views",
      "Ensure map controls are keyboard accessible",
      "Don't convey critical info only through map colors",
    ],
  },
  {
    area: "Forms & Filters",
    description: "Search and filter interfaces must be usable by all",
    guidelines: [
      "Label all form inputs clearly",
      "Group related fields with fieldset and legend",
      "Provide clear error messages linked to inputs",
      "Allow form submission via keyboard (Enter key)",
    ],
  },
  {
    area: "Numeric Data",
    description: "Financial and statistical data needs context",
    guidelines: [
      "Use appropriate formatting (currency, percentages)",
      "Provide context for numbers (up/down indicators with text)",
      "Don't rely solely on color for positive/negative values",
      "Consider users who may use screen magnification",
    ],
  },
];

// Motion and animation guidelines
const motionGuidelines = [
  {
    rule: "Respect prefers-reduced-motion",
    description: "Honor the user's system preference for reduced motion. Some users experience motion sickness or have vestibular disorders.",
    implementation: "@media (prefers-reduced-motion: reduce) { ... }",
  },
  {
    rule: "No auto-playing animations",
    description: "Animations that play automatically can be distracting or cause seizures. Always provide controls.",
    implementation: "Pause/stop controls for any animation > 5 seconds",
  },
  {
    rule: "Avoid flashing content",
    description: "Content that flashes more than 3 times per second can trigger seizures in users with photosensitive epilepsy.",
    implementation: "Never use flashing or strobing effects",
  },
];
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Accessibility</h1>
      <p class="text-body-regular text-content-secondary">
        Guidelines for building inclusive experiences that work for everyone, regardless of ability.
      </p>
    </div>

    <!-- Philosophy Banner -->
    <div class="docs-section">
      <AxisCallout title="Accessibility is a Core Principle, Not an Afterthought">
        Everyone will experience disability at some point in their lives - whether permanent, temporary (a broken arm), or situational (bright sunlight on a screen).
        Great accessible design benefits all users and is built into our foundations from the start.
      </AxisCallout>
    </div>

    <!-- Core Principles -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-4">Core Accessibility Principles</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="principle in principles" :key="principle.title" class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-main-100 rounded-lg flex items-center justify-center shrink-0">
              <!-- People icon -->
              <svg v-if="principle.icon === 'people'" class="w-5 h-5 text-main-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <!-- Foundation icon -->
              <svg v-else-if="principle.icon === 'foundation'" class="w-5 h-5 text-main-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <!-- Color icon -->
              <svg v-else-if="principle.icon === 'color'" class="w-5 h-5 text-main-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <!-- Keyboard icon -->
              <svg v-else-if="principle.icon === 'keyboard'" class="w-5 h-5 text-main-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-body-regular font-medium text-content-primary">{{ principle.title }}</h3>
              <p class="text-label text-content-secondary mt-1">{{ principle.description }}</p>
              <ul class="mt-3 space-y-1">
                <li v-for="practice in principle.practices" :key="practice" class="flex items-start gap-2 text-label text-content-secondary">
                  <svg class="w-4 h-4 text-main-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ practice }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- WCAG Compliance -->
    <div class="docs-section">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-h4 text-content-primary">WCAG Compliance</h2>
        <span class="px-2 py-0.5 text-suggestion-bold bg-accent-1-100 dark:bg-accent-1-900 text-accent-1-700 dark:text-accent-1-300 rounded">Target: AA</span>
      </div>

      <p class="text-body-regular text-content-secondary mb-4">
        We follow the Web Content Accessibility Guidelines (WCAG) 2.2 at the AA conformance level.
        This ensures our platform is usable by people with a wide range of disabilities.
      </p>

      <div class="bg-surface-raised border border-stroke rounded-lg p-4">
        <h3 class="text-body-regular font-medium text-content-primary mb-3">The Four Principles (POUR)</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div v-for="req in wcagStandards[0].requirements" :key="req.name" class="p-3 bg-surface-base rounded-lg border border-stroke">
            <p class="text-body-regular font-medium text-content-primary">{{ req.name }}</p>
            <p class="text-label text-content-secondary mt-1">{{ req.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Color Contrast -->
    <div class="docs-section">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-h4 text-content-primary">Color Contrast Requirements</h2>
        <span class="px-2 py-0.5 text-suggestion-bold bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300 rounded uppercase">Mandatory</span>
      </div>

      <p class="text-body-regular text-content-secondary mb-4">
        All text and UI elements must meet minimum contrast ratios to ensure readability for users with low vision.
        See the <NuxtLink to="/design-system/colors" class="text-accent-1-600 hover:text-accent-1-700 underline">Colors page</NuxtLink> for approved combinations.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="req in contrastRequirements" :key="req.ratio" class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-h3 text-accent-1-700">{{ req.ratio }}</span>
            <span class="px-2 py-0.5 text-suggestion-bold bg-accent-1-100 dark:bg-accent-1-900 text-accent-1-700 dark:text-accent-1-300 rounded">{{ req.label }}</span>
          </div>
          <p class="text-label text-content-secondary mb-3">{{ req.description }}</p>
          <div class="space-y-2">
            <div v-for="(example, idx) in req.examples" :key="idx" class="flex items-center gap-2 text-label">
              <svg class="w-4 h-4 text-success-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <code class="text-content-secondary bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded">{{ example.good }}</code>
            </div>
            <div v-for="(example, idx) in req.examples" :key="'bad-' + idx" class="flex items-center gap-2 text-label">
              <svg class="w-4 h-4 text-error-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <code class="text-content-tertiary bg-surface-raised dark:bg-neutral-800 px-1.5 py-0.5 rounded line-through">{{ example.bad }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Keyboard Navigation -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-4">Keyboard Navigation</h2>

      <p class="text-body-regular text-content-secondary mb-4">
        All functionality must be accessible via keyboard. Users who cannot use a mouse rely entirely on keyboard navigation.
      </p>

      <div class="bg-surface-raised border border-stroke rounded-lg overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-surface-sunken border-b border-stroke">
              <th class="px-4 py-2 text-left text-label-bold text-content-secondary">Key</th>
              <th class="px-4 py-2 text-left text-label-bold text-content-secondary">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pattern in keyboardPatterns" :key="pattern.key" class="border-b border-stroke last:border-0">
              <td class="px-4 py-2">
                <kbd class="px-2 py-1 text-label bg-surface-base border border-stroke rounded shadow-sm text-content-primary">{{ pattern.key }}</kbd>
              </td>
              <td class="px-4 py-2 text-body-regular text-content-secondary">{{ pattern.action }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Focus Indicators -->
      <AxisCallout type="warning" title="Focus Indicators are Required" class="mt-4">
        Never remove focus outlines (<code class="bg-surface-base dark:bg-neutral-800 px-1 rounded">outline: none</code>) without providing a visible alternative.
        Users must always be able to see which element has keyboard focus.
      </AxisCallout>
    </div>

    <!-- Screen Reader Guidelines -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-4">Screen Reader Support</h2>

      <p class="text-body-regular text-content-secondary mb-4">
        Screen readers convert visual interfaces to audio. Following these guidelines ensures our content is properly announced.
      </p>

      <div class="space-y-4">
        <div v-for="guideline in screenReaderGuidelines" :key="guideline.category" class="mb-8">
          <h3 class="text-body-regular font-medium text-content-primary mb-1">{{ guideline.category }}</h3>
          <p class="text-label text-content-secondary mb-4">{{ guideline.description }}</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Do's -->
            <div>
              <h4 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h4>
              <ul class="space-y-2 text-body-regular text-content-secondary">
                <li v-for="item in guideline.dos" :key="item" class="flex items-start gap-2">
                  <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- Don'ts -->
            <div>
              <h4 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h4>
              <ul class="space-y-2 text-body-regular text-content-secondary">
                <li v-for="item in guideline.donts" :key="item" class="flex items-start gap-2">
                  <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Platform-Specific Considerations -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">8020 Platform Considerations</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Specific accessibility guidelines for common patterns in our real estate data platform.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="consideration in platformConsiderations" :key="consideration.area" class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-1">{{ consideration.area }}</h3>
          <p class="text-label text-content-secondary mb-3">{{ consideration.description }}</p>
          <ul class="space-y-1">
            <li v-for="guideline in consideration.guidelines" :key="guideline" class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-main-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ guideline }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Motion Guidelines -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-4">Motion & Animation</h2>

      <p class="text-body-regular text-content-secondary mb-4">
        Animations must be used thoughtfully to avoid causing discomfort or accessibility issues.
      </p>

      <div class="space-y-3">
        <div v-for="guideline in motionGuidelines" :key="guideline.rule" class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">{{ guideline.rule }}</h3>
              <p class="text-label text-content-secondary mt-1">{{ guideline.description }}</p>
            </div>
            <code class="text-label text-content-secondary bg-surface-raised dark:bg-neutral-800 px-2 py-1 rounded shrink-0 hidden md:block">{{ guideline.implementation }}</code>
          </div>
        </div>
      </div>
    </div>

    <!-- Testing Checklist -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-4">Accessibility Testing Checklist</h2>

      <p class="text-body-regular text-content-secondary mb-4">
        Before shipping any feature, verify these accessibility requirements:
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Visual</h3>
          <ul class="space-y-2">
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Color contrast meets 4.5:1 / 3:1 ratios
            </li>
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Information not conveyed by color alone
            </li>
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Text resizes up to 200% without loss
            </li>
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Focus indicators visible
            </li>
          </ul>
        </div>

        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Keyboard</h3>
          <ul class="space-y-2">
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              All functions keyboard accessible
            </li>
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Logical tab order
            </li>
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No keyboard traps
            </li>
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Skip links available
            </li>
          </ul>
        </div>

        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3">Screen Reader</h3>
          <ul class="space-y-2">
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Semantic HTML used correctly
            </li>
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              All images have alt text
            </li>
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Form inputs labeled
            </li>
            <li class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Dynamic changes announced
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Resources -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-4">Resources</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="https://www.w3.org/WAI/WCAG22/quickref/" target="_blank" class="p-4 bg-surface-base border border-stroke rounded-lg hover:border-main-300 dark:hover:border-main-700 hover:bg-main-50/30 dark:hover:bg-main-900/20 transition-colors group">
          <p class="text-body-regular font-medium text-content-primary group-hover:text-main-700 dark:group-hover:text-main-400">WCAG 2.2 Quick Reference</p>
          <p class="text-label text-content-secondary mt-1">Official W3C guidelines and success criteria</p>
        </a>

        <a href="https://webaim.org/resources/contrastchecker/" target="_blank" class="p-4 bg-surface-base border border-stroke rounded-lg hover:border-main-300 dark:hover:border-main-700 hover:bg-main-50/30 dark:hover:bg-main-900/20 transition-colors group">
          <p class="text-body-regular font-medium text-content-primary group-hover:text-main-700 dark:group-hover:text-main-400">WebAIM Contrast Checker</p>
          <p class="text-label text-content-secondary mt-1">Test color contrast ratios</p>
        </a>

        <a href="https://www.nvaccess.org/download/" target="_blank" class="p-4 bg-surface-base border border-stroke rounded-lg hover:border-main-300 dark:hover:border-main-700 hover:bg-main-50/30 dark:hover:bg-main-900/20 transition-colors group">
          <p class="text-body-regular font-medium text-content-primary group-hover:text-main-700 dark:group-hover:text-main-400">NVDA Screen Reader</p>
          <p class="text-label text-content-secondary mt-1">Free screen reader for testing (Windows)</p>
        </a>
      </div>
    </div>
  </div>
</template>
