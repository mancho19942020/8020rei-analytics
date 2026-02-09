<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Design Principles | Design System | 8020",
});

// Jakob Nielsen's 10 Heuristics of Usability
const nielsenHeuristics = [
  {
    number: 1,
    title: "Visibility of System Status",
    description: "Keep users informed about what's going on through appropriate feedback within a reasonable time.",
    example: "Loading indicators, progress bars, success/error messages",
  },
  {
    number: 2,
    title: "Match Between System and Real World",
    description: "Speak the user's language, with words, phrases, and concepts familiar to the user rather than technical jargon.",
    example: "Use 'Properties' not 'Records', 'Save' not 'Persist'",
  },
  {
    number: 3,
    title: "User Control and Freedom",
    description: "Users often make mistakes. Provide a clearly marked 'emergency exit' without having to go through an extended process.",
    example: "Undo actions, cancel buttons, back navigation",
  },
  {
    number: 4,
    title: "Consistency and Standards",
    description: "Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform conventions.",
    example: "This design system ensures consistency",
  },
  {
    number: 5,
    title: "Error Prevention",
    description: "Better than good error messages is a careful design that prevents problems from occurring in the first place.",
    example: "Disable submit until form is valid, confirm destructive actions",
  },
  {
    number: 6,
    title: "Recognition Rather Than Recall",
    description: "Minimize user's memory load by making objects, actions, and options visible.",
    example: "Show recent searches, autofill, visible navigation",
  },
  {
    number: 7,
    title: "Flexibility and Efficiency of Use",
    description: "Accelerators may speed up interaction for expert users. Allow users to tailor frequent actions.",
    example: "Keyboard shortcuts, saved filters, quick actions",
  },
  {
    number: 8,
    title: "Aesthetic and Minimalist Design",
    description: "Dialogues should not contain irrelevant information. Every extra unit competes with relevant information.",
    example: "Clean layouts, focused content, no unnecessary elements",
  },
  {
    number: 9,
    title: "Help Users Recognize, Diagnose, and Recover from Errors",
    description: "Error messages should be expressed in plain language, precisely indicate the problem, and suggest a solution.",
    example: "Clear error messages with actionable guidance",
  },
  {
    number: 10,
    title: "Help and Documentation",
    description: "Even though it's better if the system can be used without documentation, help should be easy to search and focused on the user's task.",
    example: "Contextual help, tooltips, documentation links",
  },
];

// UX/UI Laws
const uxLaws = [
  {
    title: "Aesthetic-Usability Effect",
    description: "Users often perceive aesthetically pleasing design as more usable. Good visual design creates positive responses and increases tolerance for minor usability issues.",
    category: "Perception",
  },
  {
    title: "Doherty Threshold",
    description: "Productivity soars when a computer and its user interact at a pace (<400ms) that ensures neither has to wait on the other.",
    category: "Performance",
  },
  {
    title: "Fitts's Law",
    description: "The time to acquire a target is a function of the distance to and size of the target. Make important buttons larger and closer to the user's cursor.",
    category: "Interaction",
  },
  {
    title: "Goal-Gradient Effect",
    description: "The tendency to approach a goal increases with proximity to the goal. Show progress to motivate completion.",
    category: "Motivation",
  },
  {
    title: "Hick's Law",
    description: "The time it takes to make a decision increases with the number and complexity of choices. Simplify choices where possible.",
    category: "Decision Making",
  },
  {
    title: "Jakob's Law",
    description: "Users spend most of their time on other sites. They prefer your site to work the same way as sites they already know.",
    category: "Familiarity",
  },
  {
    title: "Law of Common Region",
    description: "Elements tend to be perceived as grouped if they are sharing an area with a clearly defined boundary.",
    category: "Grouping",
  },
  {
    title: "Law of Proximity",
    description: "Objects that are near each other tend to be grouped together. Use spacing to create visual relationships.",
    category: "Grouping",
  },
  {
    title: "Law of Prägnanz",
    description: "People will perceive and interpret ambiguous or complex images as the simplest form possible. Keep designs simple and clear.",
    category: "Perception",
  },
  {
    title: "Law of Similarity",
    description: "The human eye tends to perceive similar elements as a complete picture, shape, or group. Use consistent styling for related items.",
    category: "Grouping",
  },
  {
    title: "Law of Uniform Connectedness",
    description: "Elements that are visually connected are perceived as more related than elements with no connection.",
    category: "Grouping",
  },
  {
    title: "Miller's Law",
    description: "The average person can only keep 7 (plus or minus 2) items in their working memory. Chunk information into manageable groups.",
    category: "Memory",
  },
  {
    title: "Occam's Razor",
    description: "Among competing hypotheses that predict equally well, the one with the fewest assumptions should be selected. The simplest solution is usually the best.",
    category: "Simplicity",
  },
  {
    title: "Pareto Principle",
    description: "The Pareto principle states that roughly 80% of effects come from 20% of causes. Focus on the vital few features.",
    category: "Prioritization",
  },
  {
    title: "Parkinson's Law",
    description: "Work expands to fill the time available for its completion. Set clear constraints and deadlines.",
    category: "Time",
  },
  {
    title: "Peak-End Rule",
    description: "People judge an experience largely based on how they felt at its peak and at its end. Make key moments memorable.",
    category: "Experience",
  },
  {
    title: "Postel's Law",
    description: "Be liberal in what you accept, and conservative in what you send. Accept varied user input, provide consistent output.",
    category: "Input/Output",
  },
  {
    title: "Serial Position Effect",
    description: "Users have a propensity to best remember the first and last items in a series. Place important items at the beginning and end.",
    category: "Memory",
  },
  {
    title: "Tesler's Law",
    description: "For any system there is a certain amount of complexity that cannot be reduced. Ensure complexity is handled by the system, not the user.",
    category: "Complexity",
  },
  {
    title: "Von Restorff Effect",
    description: "The Von Restorff effect predicts that when multiple similar objects are present, the one that differs from the rest is most likely to be remembered.",
    category: "Attention",
  },
  {
    title: "Zeigarnik Effect",
    description: "People remember uncompleted or interrupted tasks better than completed tasks. Use this to encourage task completion.",
    category: "Memory",
  },
];

// Platform-specific principles
const platformPrinciples = [
  {
    title: "Data Density First",
    description: "Our users work with large datasets. Every pixel should serve a purpose. Maximize information density while maintaining readability.",
    icon: "data",
  },
  {
    title: "Speed Over Aesthetics",
    description: "Performance is a feature. If a choice is between beautiful and fast, choose fast. Users value efficiency over decoration.",
    icon: "speed",
  },
  {
    title: "Scalable by Design",
    description: "Everything we build must work across the 8020 platform family. Use semantic naming and tokens, not hard-coded values.",
    icon: "scale",
  },
  {
    title: "Accessible by Default",
    description: "Accessibility is not optional. All components must meet WCAG AA standards. Design for all users from the start.",
    icon: "accessible",
  },
];
</script>

<template>
  <div>
    <!-- Header -->
    <div class="docs-section">
      <h1 class="text-h2 text-content-primary">Design Principles</h1>
      <p class="text-body-regular text-content-secondary">
        Guidelines that govern the design system and all design proposals at 8020.
      </p>
    </div>

    <!-- Important Notice -->
    <div class="docs-section">
      <AxisCallout title="These principles guide every design decision">
        When proposing new features or evaluating designs, refer to these principles. They ensure consistency, usability, and quality across all 8020 products.
      </AxisCallout>
    </div>

    <!-- Platform-Specific Principles -->
    <div class="docs-section">
      <h2 class="text-h4 text-content-primary mb-4">8020 Platform Principles</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        These are our core principles that differentiate how we build products at 8020.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="principle in platformPrinciples" :key="principle.title" class="p-4 bg-surface-raised border border-stroke rounded-lg">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-main-100 rounded-lg flex items-center justify-center shrink-0">
              <svg v-if="principle.icon === 'data'" class="w-5 h-5 text-main-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              <svg v-else-if="principle.icon === 'speed'" class="w-5 h-5 text-main-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <svg v-else-if="principle.icon === 'scale'" class="w-5 h-5 text-main-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <svg v-else-if="principle.icon === 'accessible'" class="w-5 h-5 text-main-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">{{ principle.title }}</h3>
              <p class="text-label text-content-secondary mt-1">{{ principle.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Jakob Nielsen's 10 Heuristics -->
    <div class="docs-section">
      <div class="flex items-center gap-3 mb-2">
        <h2 class="text-h4 text-content-primary">Jakob Nielsen's 10 Heuristics of Usability</h2>
        <a href="https://www.nngroup.com/articles/ten-usability-heuristics/" target="_blank" class="text-link-small text-accent-1-600 hover:text-accent-1-700 underline">
          Learn More
        </a>
      </div>
      <p class="text-body-regular text-content-secondary mb-4">
        Laws of UX using Psychology to Design Better Products & Services.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="heuristic in nielsenHeuristics"
          :key="heuristic.number"
          class="p-4 bg-surface-base border border-stroke rounded-lg hover:border-stroke-strong transition-colors"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-accent-1-100 rounded-lg flex items-center justify-center shrink-0">
              <span class="text-h5 text-accent-1-700">{{ heuristic.number }}</span>
            </div>
            <div>
              <h3 class="text-body-regular font-medium text-content-primary">{{ heuristic.title }}</h3>
              <p class="text-label text-content-secondary mt-1">{{ heuristic.description }}</p>
              <p class="text-suggestion text-content-tertiary mt-2 italic">
                Example: {{ heuristic.example }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- UX/UI Laws -->
    <div class="docs-section">
      <div class="flex items-center gap-3 mb-2">
        <h2 class="text-h4 text-content-primary">UX/UI Laws</h2>
        <a href="https://lawsofux.com/" target="_blank" class="text-link-small text-accent-1-600 hover:text-accent-1-700 underline">
          Laws of UX
        </a>
      </div>
      <p class="text-body-regular text-content-secondary mb-4">
        Laws of UX using Psychology to Design Better Products & Services.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="law in uxLaws"
          :key="law.title"
          class="p-3 bg-surface-base border border-stroke rounded-lg hover:border-stroke-strong transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-body-regular font-medium text-content-primary">{{ law.title }}</h3>
          </div>
          <p class="text-label text-content-secondary">{{ law.description }}</p>
          <span class="inline-block mt-2 px-2 py-0.5 text-suggestion bg-neutral-100 dark:bg-neutral-800 text-content-secondary rounded">
            {{ law.category }}
          </span>
        </div>
      </div>
    </div>

    <!-- How to Apply -->
    <div class="docs-section-last">
      <h2 class="text-h4 text-content-primary mb-4">How to Apply These Principles</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 bg-surface-raised rounded-lg">
          <div class="w-8 h-8 bg-main-100 rounded-lg flex items-center justify-center mb-3">
            <span class="text-h5 text-main-700">1</span>
          </div>
          <h3 class="text-body-regular font-medium text-content-primary mb-2">Before Designing</h3>
          <p class="text-label text-content-secondary">
            Review relevant principles before starting a new feature. Consider which heuristics and laws apply to your use case.
          </p>
        </div>

        <div class="p-4 bg-surface-raised rounded-lg">
          <div class="w-8 h-8 bg-main-100 rounded-lg flex items-center justify-center mb-3">
            <span class="text-h5 text-main-700">2</span>
          </div>
          <h3 class="text-body-regular font-medium text-content-primary mb-2">During Review</h3>
          <p class="text-label text-content-secondary">
            Use principles as a checklist during design reviews. Ask: "Does this follow Hick's Law? Are we meeting Nielsen's heuristics?"
          </p>
        </div>

        <div class="p-4 bg-surface-raised rounded-lg">
          <div class="w-8 h-8 bg-main-100 rounded-lg flex items-center justify-center mb-3">
            <span class="text-h5 text-main-700">3</span>
          </div>
          <h3 class="text-body-regular font-medium text-content-primary mb-2">When Debugging UX</h3>
          <p class="text-label text-content-secondary">
            If users struggle with a feature, reference these principles to identify what's wrong and how to fix it.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
