<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Governance | Axis Design System | 8020",
});

// Team roles and responsibilities
const teamRoles = [
  {
    role: "Product Director",
    name: "Your Boss",
    responsibilities: [
      "Final approval on design system strategy",
      "Align design system with business goals",
      "Prioritize roadmap items across verticals",
      "Approve major breaking changes",
    ],
    decisionScope: "Strategic direction, cross-vertical consistency, business alignment",
  },
  {
    role: "Lead Product Designer",
    name: "You",
    responsibilities: [
      "Design system architecture and vision",
      "Component design and specifications",
      "Token definitions (colors, typography, spacing)",
      "Documentation and design guidelines",
      "Review all design contributions",
    ],
    decisionScope: "Visual design, component behavior, design patterns, accessibility",
  },
  {
    role: "QA Leader",
    name: "Nicolas",
    responsibilities: [
      "Verify component implementations match specs",
      "Accessibility compliance testing",
      "Cross-browser and device testing",
      "Regression testing after updates",
      "Sign-off on releases",
    ],
    decisionScope: "Quality standards, test coverage, release readiness",
  },
];

// Governance model explanation
const governanceModel = {
  type: "Hybrid/Federated",
  description: "A small core team maintains the design system with structured processes for contributions. As the team grows, this model scales to allow more contributors while maintaining quality.",
  benefits: [
    "Clear ownership prevents drift",
    "Small team enables fast decisions",
    "Documented processes prepare for scaling",
    "Quality over quantity approach",
  ],
};

// Contribution workflow steps
const contributionSteps = [
  {
    step: 1,
    title: "Identify the Need",
    description: "Before proposing a new component or change, verify it doesn't already exist in the system.",
    actions: [
      "Search existing components in Axis documentation",
      "Check if an existing component can be extended",
      "Confirm the need isn't a one-off edge case",
    ],
    owner: "Contributor",
  },
  {
    step: 2,
    title: "Document the Proposal",
    description: "Create a clear proposal explaining what you need and why.",
    actions: [
      "Describe the use case and user need",
      "Show examples or mockups",
      "Explain why existing components don't work",
      "Note any accessibility considerations",
    ],
    owner: "Contributor",
  },
  {
    step: 3,
    title: "Design Review",
    description: "The Lead Designer reviews the proposal for alignment with Axis principles.",
    actions: [
      "Verify alignment with design principles",
      "Check for consistency with existing patterns",
      "Ensure multi-vertical compatibility",
      "Define component specifications",
    ],
    owner: "Lead Product Designer",
  },
  {
    step: 4,
    title: "Implementation",
    description: "Build the component following Axis coding standards.",
    actions: [
      "Follow Vue/Nuxt component patterns",
      "Use semantic design tokens only",
      "Implement all required states",
      "Add accessibility attributes",
    ],
    owner: "Developer",
  },
  {
    step: 5,
    title: "QA Verification",
    description: "QA tests the implementation against specifications.",
    actions: [
      "Visual comparison with design specs",
      "Accessibility audit (WCAG AA)",
      "Cross-browser testing",
      "Keyboard navigation testing",
    ],
    owner: "QA Leader",
  },
  {
    step: 6,
    title: "Documentation",
    description: "Document the component in Axis before release.",
    actions: [
      "Add to design system pages",
      "Include usage guidelines",
      "Document props, events, slots",
      "Add code examples",
    ],
    owner: "Lead Product Designer",
  },
  {
    step: 7,
    title: "Release",
    description: "Merge to main branch and notify stakeholders.",
    actions: [
      "Update changelog",
      "Merge pull request",
      "Announce in team channel",
      "Update version if needed",
    ],
    owner: "Team",
  },
];

// Review checklist
const reviewChecklist = {
  design: [
    "Follows Axis design principles",
    "Uses semantic color tokens (never raw colors)",
    "Typography matches defined tokens",
    "Spacing uses standard token values",
    "Works across all supported breakpoints",
    "Consistent with existing component patterns",
  ],
  accessibility: [
    "Meets WCAG 2.2 AA contrast requirements",
    "Keyboard navigable (Tab, Enter, Escape)",
    "Screen reader compatible (proper ARIA)",
    "Visible focus indicators",
    "No color-only information",
    "Respects prefers-reduced-motion",
  ],
  code: [
    "Vue 3 Composition API used",
    "TypeScript types defined",
    "Props validated with defaults",
    "Events properly emitted",
    "No hard-coded values (use tokens)",
    "Component is self-contained",
  ],
  documentation: [
    "Component added to design system pages",
    "All variants demonstrated",
    "States shown (default, hover, focus, disabled)",
    "Code examples provided",
    "Accessibility notes included",
    "Usage guidelines written",
  ],
};

// Versioning strategy
const versioningStrategy = {
  approach: "Semantic Versioning (SemVer)",
  format: "MAJOR.MINOR.PATCH",
  rules: [
    {
      type: "PATCH",
      version: "x.x.X",
      description: "Bug fixes, documentation updates",
      examples: ["Fix button hover state", "Update color token value", "Typo corrections"],
      breaking: false,
    },
    {
      type: "MINOR",
      version: "x.X.0",
      description: "New components, new features, backwards-compatible changes",
      examples: ["Add new Badge component", "Add new button variant", "New icon added"],
      breaking: false,
    },
    {
      type: "MAJOR",
      version: "X.0.0",
      description: "Breaking changes that require migration",
      examples: ["Rename component props", "Remove deprecated components", "Token restructuring"],
      breaking: true,
    },
  ],
};

// Changelog template
const changelogFormat = `## [1.2.0] - 2026-01-15

### Added
- New Badge component with 5 variants
- Toast notification system
- Dark mode support (experimental)

### Changed
- Button hover state now uses main-600
- Improved modal accessibility

### Fixed
- Select dropdown z-index issue
- Input placeholder contrast

### Deprecated
- ButtonOld component (use Button instead)`;

// Maintenance schedule
const maintenanceSchedule = [
  {
    frequency: "Weekly",
    activity: "Review open issues and PRs",
    owner: "Lead Product Designer",
  },
  {
    frequency: "Bi-weekly",
    activity: "Design system sync meeting",
    owner: "Full Team",
  },
  {
    frequency: "Monthly",
    activity: "Accessibility audit of new components",
    owner: "QA Leader",
  },
  {
    frequency: "Quarterly",
    activity: "Review design system adoption metrics",
    owner: "Product Director",
  },
  {
    frequency: "Quarterly",
    activity: "Evaluate deprecated items for removal",
    owner: "Lead Product Designer",
  },
];

// Decision matrix
const decisionMatrix = [
  {
    change: "New color token",
    approver: "Lead Product Designer",
    process: "Design review",
  },
  {
    change: "New component",
    approver: "Lead Product Designer + QA",
    process: "Full contribution workflow",
  },
  {
    change: "Token value update",
    approver: "Lead Product Designer",
    process: "Design review + QA verification",
  },
  {
    change: "Component API change",
    approver: "Full Team",
    process: "RFC process + migration plan",
  },
  {
    change: "Breaking change",
    approver: "Product Director",
    process: "RFC + migration plan + deprecation period",
  },
  {
    change: "New vertical branding",
    approver: "Product Director",
    process: "Strategic review + theming implementation",
  },
];

// Multi-vertical governance
const multiVerticalGuidelines = [
  {
    principle: "Axis First",
    description: "All components are designed for Axis (the core system) first, then themed for verticals.",
    example: "A Button component uses main-500 which maps to green in Roofing, blue in REI.",
  },
  {
    principle: "Semantic Over Literal",
    description: "Never use product-specific colors or names in the core system.",
    example: "Use 'main' not 'roofing-green' or 'rei-blue'. Use 'primary action' not 'submit roof quote'.",
  },
  {
    principle: "Shared Components, Themed Tokens",
    description: "Components are shared across all verticals; only token values change per brand.",
    example: "The same Card component works in Roofing and REI with different accent colors.",
  },
  {
    principle: "Document Vertical Differences",
    description: "When a vertical requires unique behavior, document it clearly with rationale.",
    example: "REI uses 5-column grid for property cards; Roofing uses 4-column for larger imagery.",
  },
];
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Governance</h1>
      <p class="text-body-regular text-content-secondary">
        Contribution guidelines, review processes, versioning strategy, and design system maintenance procedures.
      </p>
    </div>

    <!-- Philosophy Banner -->
    <div class="docs-section">
      <AxisCallout title="Governance Enables Scale">
        Good governance isn't about control - it's about enabling consistent, quality contributions at scale.
        As Axis grows to serve multiple verticals (Roofing, REI, and beyond), these processes ensure every
        team builds on a solid, unified foundation.
      </AxisCallout>
    </div>

    <!-- Governance Model -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Governance Model</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Axis uses a <strong>{{ governanceModel.type }}</strong> governance model, optimized for our current team size.
      </p>

      <div class="p-4 bg-surface-raised border border-stroke rounded-lg mb-4">
        <p class="text-body-regular text-content-secondary">{{ governanceModel.description }}</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div v-for="benefit in governanceModel.benefits" :key="benefit" class="p-3 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-main-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="text-label text-content-secondary">{{ benefit }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Roles -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Team Roles & Responsibilities</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Clear ownership ensures accountability and prevents design system drift.
      </p>

      <div class="space-y-4">
        <div v-for="member in teamRoles" :key="member.role" class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-main-100 rounded-lg flex items-center justify-center shrink-0">
              <svg v-if="member.role === 'Product Director'" class="w-5 h-5 text-main-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <svg v-else-if="member.role === 'Lead Product Designer'" class="w-5 h-5 text-main-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <svg v-else class="w-5 h-5 text-main-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">{{ member.role }}</h3>
              <p class="text-label text-content-tertiary">{{ member.decisionScope }}</p>
            </div>
          </div>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <li v-for="resp in member.responsibilities" :key="resp" class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-main-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ resp }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Contribution Workflow -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Contribution Workflow</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Follow these steps when proposing new components, patterns, or changes to Axis.
      </p>

      <div class="space-y-3">
        <div v-for="step in contributionSteps" :key="step.step" class="flex gap-4">
          <!-- Step number -->
          <div class="w-8 h-8 bg-main-100 rounded-lg flex items-center justify-center shrink-0">
            <span class="text-h5 text-main-700">{{ step.step }}</span>
          </div>

          <!-- Step content -->
          <div class="flex-1 pb-4 border-b border-stroke-subtle last:border-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-body-regular font-medium text-content-primary">{{ step.title }}</h3>
              <span class="px-2 py-0.5 text-suggestion bg-surface-raised dark:bg-neutral-800 text-content-secondary rounded">{{ step.owner }}</span>
            </div>
            <p class="text-label text-content-secondary mb-2">{{ step.description }}</p>
            <ul class="space-y-1">
              <li v-for="action in step.actions" :key="action" class="flex items-start gap-2 text-label text-content-secondary">
                <svg class="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                {{ action }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Checklist -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Review Checklist</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Every contribution must pass these checks before being merged into Axis.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Design Checklist -->
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3 flex items-center gap-2">
            <svg class="w-5 h-5 text-accent-1-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Design
          </h3>
          <ul class="space-y-2">
            <li v-for="item in reviewChecklist.design" :key="item" class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-accent-1-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Accessibility Checklist -->
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3 flex items-center gap-2">
            <svg class="w-5 h-5 text-accent-2-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Accessibility
          </h3>
          <ul class="space-y-2">
            <li v-for="item in reviewChecklist.accessibility" :key="item" class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-accent-2-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Code Checklist -->
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3 flex items-center gap-2">
            <svg class="w-5 h-5 text-accent-3-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Code
          </h3>
          <ul class="space-y-2">
            <li v-for="item in reviewChecklist.code" :key="item" class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-accent-3-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Documentation Checklist -->
        <div class="p-4 bg-surface-raised rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-3 flex items-center gap-2">
            <svg class="w-5 h-5 text-accent-4-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Documentation
          </h3>
          <ul class="space-y-2">
            <li v-for="item in reviewChecklist.documentation" :key="item" class="flex items-start gap-2 text-label text-content-secondary">
              <svg class="w-4 h-4 text-accent-4-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Decision Matrix -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Decision Matrix</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Who approves what? This matrix clarifies decision authority.
      </p>

      <div class="bg-surface-raised border border-stroke rounded-lg overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-surface-sunken border-b border-stroke">
              <th class="px-4 py-2 text-left text-label-bold text-content-secondary">Change Type</th>
              <th class="px-4 py-2 text-left text-label-bold text-content-secondary">Approver</th>
              <th class="px-4 py-2 text-left text-label-bold text-content-secondary">Process</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="decision in decisionMatrix" :key="decision.change" class="border-b border-stroke last:border-0">
              <td class="px-4 py-2 text-body-regular text-content-primary">{{ decision.change }}</td>
              <td class="px-4 py-2 text-body-regular text-content-secondary">{{ decision.approver }}</td>
              <td class="px-4 py-2 text-label text-content-secondary">{{ decision.process }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Versioning Strategy -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Versioning Strategy</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Axis follows <strong>{{ versioningStrategy.approach }}</strong> ({{ versioningStrategy.format }}) to communicate change impact.
      </p>

      <div class="space-y-3">
        <div v-for="rule in versioningStrategy.rules" :key="rule.type" class="p-4 bg-surface-base border border-stroke rounded-lg">
          <div class="flex items-center gap-3 mb-2">
            <span
              :class="[
                'px-2 py-0.5 text-label-bold rounded',
                rule.breaking ? 'bg-error-100 text-error-700' : 'bg-main-100 text-main-700'
              ]"
            >
              {{ rule.type }}
            </span>
            <code class="text-body-regular text-content-secondary bg-surface-raised dark:bg-neutral-800 px-2 py-0.5 rounded">{{ rule.version }}</code>
            <span v-if="rule.breaking" class="text-label text-error-600">Breaking</span>
          </div>
          <p class="text-body-regular text-content-secondary mb-2">{{ rule.description }}</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="example in rule.examples" :key="example" class="px-2 py-1 text-label bg-surface-raised text-content-secondary rounded border border-stroke">
              {{ example }}
            </span>
          </div>
        </div>
      </div>

      <!-- Changelog Format -->
      <div class="mt-4">
        <h3 class="text-body-regular font-medium text-content-primary mb-2">Changelog Format</h3>
        <div class="bg-neutral-900 rounded-lg p-4 overflow-x-auto">
          <pre class="text-label text-neutral-100 whitespace-pre-wrap">{{ changelogFormat }}</pre>
        </div>
      </div>
    </div>

    <!-- Multi-Vertical Guidelines -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Multi-Vertical Guidelines</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Axis is designed to scale across Roofing8020, 8020REI, and future verticals. Follow these principles.
      </p>

      <div class="space-y-3">
        <div v-for="guideline in multiVerticalGuidelines" :key="guideline.principle" class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <h3 class="text-body-regular font-medium text-content-primary mb-1">{{ guideline.principle }}</h3>
          <p class="text-label text-content-secondary mb-2">{{ guideline.description }}</p>
          <div class="flex items-start gap-2 p-2 bg-surface-base rounded border border-stroke">
            <span class="text-label-bold text-content-tertiary shrink-0">Example:</span>
            <span class="text-label text-content-secondary">{{ guideline.example }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Maintenance Schedule -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-2">Maintenance Schedule</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Regular maintenance keeps Axis healthy and up-to-date.
      </p>

      <div class="bg-surface-raised border border-stroke rounded-lg overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-surface-sunken border-b border-stroke">
              <th class="px-4 py-2 text-left text-label-bold text-content-secondary">Frequency</th>
              <th class="px-4 py-2 text-left text-label-bold text-content-secondary">Activity</th>
              <th class="px-4 py-2 text-left text-label-bold text-content-secondary">Owner</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in maintenanceSchedule" :key="item.activity" class="border-b border-stroke last:border-0">
              <td class="px-4 py-2">
                <span class="px-2 py-0.5 text-label bg-main-50 text-main-700 rounded">{{ item.frequency }}</span>
              </td>
              <td class="px-4 py-2 text-body-regular text-content-secondary">{{ item.activity }}</td>
              <td class="px-4 py-2 text-label text-content-secondary">{{ item.owner }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mandatory Requirements -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-3">Mandatory Requirements</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        These requirements are NON-NEGOTIABLE. Any component or feature that violates these rules is considered broken and must be fixed immediately.
      </p>

      <div class="space-y-4">
        <!-- Axis Component Usage -->
        <div class="p-4 bg-error-50 dark:bg-error-950 border-l-4 border-error-500 rounded-r-lg">
          <h3 class="text-body-regular font-medium text-error-800 dark:text-error-300 mb-2">1. Axis Component Usage</h3>
          <p class="text-label text-error-700 dark:text-error-300 mb-2">
            All UI elements MUST use Axis components. Raw HTML elements are prohibited.
          </p>
          <ul class="space-y-1 text-label text-error-700 dark:text-error-300 ml-4">
            <li>• Use <code class="bg-error-100 dark:bg-error-900 px-1 rounded">AxisButton</code> instead of <code class="bg-error-100 dark:bg-error-900 px-1 rounded">&lt;button&gt;</code></li>
            <li>• Use <code class="bg-error-100 dark:bg-error-900 px-1 rounded">AxisInput</code> instead of <code class="bg-error-100 dark:bg-error-900 px-1 rounded">&lt;input&gt;</code></li>
            <li>• Use <code class="bg-error-100 dark:bg-error-900 px-1 rounded">AxisSelect</code> instead of <code class="bg-error-100 dark:bg-error-900 px-1 rounded">&lt;select&gt;</code></li>
            <li>• Use <code class="bg-error-100 dark:bg-error-900 px-1 rounded">AxisCheckbox</code> instead of <code class="bg-error-100 dark:bg-error-900 px-1 rounded">&lt;input type="checkbox"&gt;</code></li>
            <li>• Use <code class="bg-error-100 dark:bg-error-900 px-1 rounded">AxisRadio</code> instead of <code class="bg-error-100 dark:bg-error-900 px-1 rounded">&lt;input type="radio"&gt;</code></li>
            <li>• Use <code class="bg-error-100 dark:bg-error-900 px-1 rounded">AxisCallout</code> for feedback messages</li>
          </ul>
        </div>

        <!-- Dark Mode Support -->
        <div class="p-4 bg-error-50 dark:bg-error-950 border-l-4 border-error-500 rounded-r-lg">
          <h3 class="text-body-regular font-medium text-error-800 dark:text-error-300 mb-2">2. Dark Mode Support (CRITICAL)</h3>
          <p class="text-label text-error-700 dark:text-error-300 mb-2">
            Every component and page MUST work correctly in both light and dark modes.
          </p>
          <ul class="space-y-1 text-label text-error-700 dark:text-error-300 ml-4">
            <li>• Use semantic tokens: <code class="bg-error-100 dark:bg-error-900 px-1 rounded">surface-*</code>, <code class="bg-error-100 dark:bg-error-900 px-1 rounded">content-*</code>, <code class="bg-error-100 dark:bg-error-900 px-1 rounded">stroke-*</code></li>
            <li>• Add <code class="bg-error-100 dark:bg-error-900 px-1 rounded">dark:</code> variants when using raw color tokens</li>
            <li>• Verify WCAG AA contrast (4.5:1 for text) in BOTH themes</li>
            <li>• Test theme toggle transitions</li>
            <li>• Check for FOUC (Flash of Unstyled Content) on reload</li>
          </ul>
        </div>

        <!-- Semantic Token Usage -->
        <div class="p-4 bg-error-50 dark:bg-error-950 border-l-4 border-error-500 rounded-r-lg">
          <h3 class="text-body-regular font-medium text-error-800 dark:text-error-300 mb-2">3. Semantic Token Usage</h3>
          <p class="text-label text-error-700 dark:text-error-300 mb-2">
            Never use raw color names. Always use semantic or purpose-based tokens.
          </p>
          <ul class="space-y-1 text-label text-error-700 dark:text-error-300 ml-4">
            <li>• ❌ NEVER: <code class="bg-error-100 dark:bg-error-900 px-1 rounded">bg-blue-500</code>, <code class="bg-error-100 dark:bg-error-900 px-1 rounded">text-green-700</code></li>
            <li>• ✅ ALWAYS: <code class="bg-error-100 dark:bg-error-900 px-1 rounded">bg-main-500</code>, <code class="bg-error-100 dark:bg-error-900 px-1 rounded">text-success-700</code></li>
            <li>• Use <code class="bg-error-100 dark:bg-error-900 px-1 rounded">main</code> for primary brand color</li>
            <li>• Use <code class="bg-error-100 dark:bg-error-900 px-1 rounded">accent-1</code> through <code class="bg-error-100 dark:bg-error-900 px-1 rounded">accent-5</code> for data visualization</li>
            <li>• Use <code class="bg-error-100 dark:bg-error-900 px-1 rounded">success</code>, <code class="bg-error-100 dark:bg-error-900 px-1 rounded">error</code>, <code class="bg-error-100 dark:bg-error-900 px-1 rounded">alert</code>, <code class="bg-error-100 dark:bg-error-900 px-1 rounded">info</code> for feedback</li>
          </ul>
        </div>

        <!-- Accessibility Compliance -->
        <div class="p-4 bg-error-50 dark:bg-error-950 border-l-4 border-error-500 rounded-r-lg">
          <h3 class="text-body-regular font-medium text-error-800 dark:text-error-300 mb-2">4. Accessibility Compliance</h3>
          <p class="text-label text-error-700 dark:text-error-300 mb-2">
            All components MUST meet WCAG 2.2 AA standards.
          </p>
          <ul class="space-y-1 text-label text-error-700 dark:text-error-300 ml-4">
            <li>• All interactive elements must have <code class="bg-error-100 dark:bg-error-900 px-1 rounded">aria-label</code> or visible text</li>
            <li>• Text contrast: 4.5:1 minimum (normal text), 3:1 (large text)</li>
            <li>• Keyboard navigation fully supported</li>
            <li>• Focus states clearly visible</li>
            <li>• Test with screen readers when applicable</li>
          </ul>
        </div>

        <!-- Documentation Requirement -->
        <div class="p-4 bg-error-50 dark:bg-error-950 border-l-4 border-error-500 rounded-r-lg">
          <h3 class="text-body-regular font-medium text-error-800 dark:text-error-300 mb-2">5. Documentation Requirement</h3>
          <p class="text-label text-error-700 dark:text-error-300 mb-2">
            Every component and pattern MUST be documented before release.
          </p>
          <ul class="space-y-1 text-label text-error-700 dark:text-error-300 ml-4">
            <li>• Create a page in <code class="bg-error-100 dark:bg-error-900 px-1 rounded">/design-system</code> for new components</li>
            <li>• Document all props, slots, and events</li>
            <li>• Show usage examples with code snippets</li>
            <li>• Include variants and states (default, hover, disabled, error)</li>
            <li>• Update <code class="bg-error-100 dark:bg-error-900 px-1 rounded">AppSidebar.vue</code> to mark as <code class="bg-error-100 dark:bg-error-900 px-1 rounded">ready: true</code></li>
          </ul>
        </div>
      </div>

      <AxisCallout type="error" title="Enforcement" class="mt-4">
        Violations of these mandatory requirements are considered <strong>bugs</strong> and will block PR approval. Code that doesn't follow these rules is broken code that must be fixed immediately.
      </AxisCallout>
    </div>

    <!-- Best Practices -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-4">Best Practices</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Do's -->
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Check existing components before proposing new ones</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use semantic design tokens for all values</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Document every component and pattern</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Test accessibility before submitting</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Communicate changes to the team</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Think multi-vertical from the start</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Create one-off components for specific pages</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Hard-code colors, fonts, or spacing values</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Ship components without documentation</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Skip accessibility reviews</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Make breaking changes without a migration plan</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use vertical-specific naming (e.g., "roofing-green")</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Resources -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-4">Resources</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink to="/design-system/principles" class="p-4 bg-surface-base border border-stroke rounded-lg hover:border-main-300 dark:hover:border-main-700 hover:bg-main-50/30 dark:hover:bg-main-900/20 transition-colors group">
          <p class="text-body-regular font-medium text-content-primary group-hover:text-main-700 dark:group-hover:text-main-400">Design Principles</p>
          <p class="text-label text-content-secondary mt-1">Core principles guiding all design decisions</p>
        </NuxtLink>

        <NuxtLink to="/design-system/accessibility" class="p-4 bg-surface-base border border-stroke rounded-lg hover:border-main-300 dark:hover:border-main-700 hover:bg-main-50/30 dark:hover:bg-main-900/20 transition-colors group">
          <p class="text-body-regular font-medium text-content-primary group-hover:text-main-700 dark:group-hover:text-main-400">Accessibility Guidelines</p>
          <p class="text-label text-content-secondary mt-1">WCAG compliance and inclusive design</p>
        </NuxtLink>

        <a href="https://semver.org/" target="_blank" class="p-4 bg-surface-base border border-stroke rounded-lg hover:border-main-300 dark:hover:border-main-700 hover:bg-main-50/30 dark:hover:bg-main-900/20 transition-colors group">
          <p class="text-body-regular font-medium text-content-primary group-hover:text-main-700 dark:group-hover:text-main-400">Semantic Versioning</p>
          <p class="text-label text-content-secondary mt-1">Official SemVer specification</p>
        </a>
      </div>
    </div>
  </div>
</template>
