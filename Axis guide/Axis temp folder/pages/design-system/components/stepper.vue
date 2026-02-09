<script setup lang="ts">
/**
 * Stepper Documentation Page
 * Design System - Axis Components
 */
import { ref } from 'vue'

definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Stepper | Design System | 8020",
});

// Demo state
const currentStep = ref(1)
const verticalStep = ref(1)
const dashStep = ref(2)
const errorStep = ref(1)
const manyStepsExample = ref(3)
const fewStepsExample = ref(0)

// Step configurations
const basicSteps = [
  { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
  { id: 'review', label: 'Review' },
  { id: 'complete', label: 'Complete' },
]

const fewSteps = [
  { id: 'start', label: 'Start' },
  { id: 'finish', label: 'Finish' },
]

const optionalSteps = [
  { id: 'required1', label: 'Account Setup' },
  { id: 'optional', label: 'Preferences', optional: true },
  { id: 'required2', label: 'Confirmation' },
]

const errorSteps = [
  { id: 'step1', label: 'Basic Info' },
  { id: 'step2', label: 'Verification', error: true },
  { id: 'step3', label: 'Complete' },
]

const verticalSteps = [
  { id: 'step1', label: 'Select Campaign', description: 'Choose the type of campaign you want to create.' },
  { id: 'step2', label: 'Configure Settings', description: 'Set up targeting, budget, and scheduling.' },
  { id: 'step3', label: 'Create Content', description: 'Add your creative assets and copy.' },
  { id: 'step4', label: 'Review & Launch', description: 'Review all settings and launch your campaign.' },
]

const disabledSteps = [
  { id: 'step1', label: 'Step 1' },
  { id: 'step2', label: 'Step 2', disabled: true },
  { id: 'step3', label: 'Step 3' },
]

const manySteps = [
  { id: 'step1', label: 'Personal Info' },
  { id: 'step2', label: 'Contact Details' },
  { id: 'step3', label: 'Address' },
  { id: 'step4', label: 'Payment Method' },
  { id: 'step5', label: 'Billing Address' },
  { id: 'step6', label: 'Preferences' },
  { id: 'step7', label: 'Notifications' },
  { id: 'step8', label: 'Security' },
  { id: 'step9', label: 'Review' },
  { id: 'step10', label: 'Complete' },
]

// Navigation helpers
const handleNext = () => {
  if (currentStep.value < basicSteps.length - 1) {
    currentStep.value++
  }
}

const handlePrev = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-h1 text-content-primary mb-2">Stepper</h1>
      <p class="text-body-large text-content-secondary">
        Step-based navigation for multi-step processes, wizards, and flows.
        Displays progress through a sequence with circular indicators and chevron separators.
      </p>
    </div>

    <!-- Overview -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Overview</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Steppers guide users through multi-step workflows with clear visual feedback.
        The horizontal variant displays steps in a scrollable container with navigation arrows for overflow.
      </p>

      <!-- Design Principle Callout -->
      <AxisCallout type="info" class="mb-6">
        <strong>Centering Rule:</strong> When steps don't overflow the container width, they are automatically centered.
        This maintains visual balance and prevents awkward left-aligned layouts with excessive whitespace.
      </AxisCallout>

      <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
        <AxisStepper
          v-model="currentStep"
          :steps="basicSteps"
        />
        <div class="mt-6 flex items-center justify-between">
          <AxisButton
            variant="outlined"
            :disabled="currentStep === 0"
            @click="handlePrev"
          >
            Previous
          </AxisButton>
          <span class="text-body-regular text-content-secondary">
            Step {{ currentStep + 1 }} of {{ basicSteps.length }}
          </span>
          <AxisButton
            :disabled="currentStep === basicSteps.length - 1"
            @click="handleNext"
          >
            Next
          </AxisButton>
        </div>
      </div>
    </section>

    <!-- When to Use -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">When to Use</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Do's -->
        <div>
          <h3 class="text-h5 text-success-700 dark:text-success-400 mb-3">Do</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Multi-step forms (registration, checkout)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Onboarding flows</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Configuration wizards</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>Processes that must be completed in order</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1 shrink-0">&#x2713;</span>
              <span>When users need to see overall progress</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Navigation between unrelated pages</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>More than 10 steps (break into sub-processes)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Simple forms that fit on one page</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>When steps can be completed in any order</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1 shrink-0">&#x2717;</span>
              <span>Replace primary navigation</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Variants -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Variants</h2>

      <!-- Default Horizontal -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Horizontal (Default)</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Steps in a white container with rounded borders. Circular indicators show status, chevron separators between steps.
          Automatically adds scroll arrows when steps overflow the container.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisStepper
            v-model="currentStep"
            :steps="basicSteps"
          />
        </div>
      </div>

      <!-- Few Steps (Centered) -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Few Steps (Centered)</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          <strong>Important:</strong> When there are only 2-4 steps and no overflow occurs, steps are automatically centered in the container.
          This is a design system rule applied across all stepper usage.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisStepper
            v-model="fewStepsExample"
            :steps="fewSteps"
          />
        </div>
      </div>

      <!-- Many Steps (Scrollable) -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">With Many Steps (Scrollable)</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          When steps overflow the container, navigation arrows appear automatically.
          Click arrows to scroll or use mouse/trackpad to scroll horizontally.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <AxisStepper
            v-model="manyStepsExample"
            :steps="manySteps"
          />
        </div>
      </div>

      <!-- Dash Variant -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Dash (Compact)</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Minimal progress indicator for space-constrained layouts or mobile views.
          Shows progress as colored dashes without labels.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="flex flex-col items-center gap-4">
            <AxisStepper
              v-model="dashStep"
              :steps="basicSteps"
              variant="dash"
            />
            <p class="text-body-regular text-content-secondary">
              Step {{ dashStep + 1 }} of {{ basicSteps.length }}
            </p>
          </div>
        </div>
      </div>

      <!-- Vertical -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-3">Vertical</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Vertical layout with optional descriptions. Great for sidebars or detailed wizards.
          Uses larger indicators with connecting lines.
        </p>
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <div class="max-w-md">
            <AxisStepper
              v-model="verticalStep"
              :steps="verticalSteps"
              orientation="vertical"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Step States -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Step States</h2>

      <div class="space-y-6">
        <!-- Visual State Examples -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <h3 class="text-h4 text-content-primary mb-4">Visual States</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <!-- Pending -->
            <div class="text-center">
              <div class="flex items-center justify-center mb-3">
                <div class="w-4 h-4 rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent" />
              </div>
              <div class="text-label font-semibold text-content-primary mb-1">Pending</div>
              <p class="text-label text-content-secondary">Empty circle, gray text</p>
            </div>

            <!-- Active -->
            <div class="text-center">
              <div class="flex items-center justify-center mb-3">
                <div class="w-4 h-4 rounded-full border border-main-500 dark:border-main-400 bg-main-50 dark:bg-main-900" />
              </div>
              <div class="text-label font-semibold text-content-primary mb-1">Active</div>
              <p class="text-label text-content-secondary">Blue ring, blue text</p>
            </div>

            <!-- Completed -->
            <div class="text-center">
              <div class="flex items-center justify-center mb-3">
                <div class="w-4 h-4 rounded-full border border-main-950 dark:border-main-800 bg-main-900 dark:bg-main-700 flex items-center justify-center">
                  <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div class="text-label font-semibold text-content-primary mb-1">Completed</div>
              <p class="text-label text-content-secondary">Dark blue, checkmark</p>
            </div>

            <!-- Disabled -->
            <div class="text-center">
              <div class="flex items-center justify-center mb-3">
                <div class="w-4 h-4 rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent opacity-50" />
              </div>
              <div class="text-label font-semibold text-content-primary mb-1">Disabled</div>
              <p class="text-label text-content-secondary">Light gray, no interaction</p>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <h3 class="text-h4 text-content-primary mb-3">Error State</h3>
          <p class="text-body-regular text-content-secondary mb-4">
            Steps can show error state when validation fails or an issue occurs.
          </p>
          <AxisStepper
            v-model="errorStep"
            :steps="errorSteps"
          />
        </div>

        <!-- Optional Steps -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <h3 class="text-h4 text-content-primary mb-3">Optional Steps</h3>
          <p class="text-body-regular text-content-secondary mb-4">
            Steps can be marked as optional with "(Optional)" label, allowing users to skip them.
          </p>
          <AxisStepper
            v-model="currentStep"
            :steps="optionalSteps"
          />
        </div>

        <!-- Disabled Steps -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <h3 class="text-h4 text-content-primary mb-3">Disabled Steps</h3>
          <p class="text-body-regular text-content-secondary mb-4">
            Individual steps can be disabled to prevent navigation. Try clicking Step 2.
          </p>
          <AxisStepper
            v-model="currentStep"
            :steps="disabledSteps"
            non-linear
          />
        </div>
      </div>
    </section>

    <!-- Navigation Modes -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Navigation Modes</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Linear -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <h3 class="text-h4 text-content-primary mb-3">Linear (Default)</h3>
          <p class="text-body-regular text-content-secondary mb-4">
            Users can only go back to completed steps. Forward navigation requires completing current step.
          </p>
          <AxisStepper
            v-model="currentStep"
            :steps="basicSteps"
            :non-linear="false"
          />
        </div>

        <!-- Non-Linear -->
        <div class="p-6 bg-surface-raised rounded-lg border border-stroke-subtle">
          <h3 class="text-h4 text-content-primary mb-3">Non-Linear</h3>
          <p class="text-body-regular text-content-secondary mb-4">
            Users can click any step to navigate freely. Use when steps are independent.
          </p>
          <AxisStepper
            v-model="currentStep"
            :steps="basicSteps"
            non-linear
          />
        </div>
      </div>
    </section>

    <!-- API Reference -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">API Reference</h2>

      <!-- Props -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-4">Props</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-stroke">
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Prop</th>
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Type</th>
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Default</th>
                <th class="py-3 text-body-regular font-semibold text-content-primary">Description</th>
              </tr>
            </thead>
            <tbody class="text-body-regular text-content-secondary">
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">modelValue</td>
                <td class="py-3 pr-4 font-mono text-label">number</td>
                <td class="py-3 pr-4">Required</td>
                <td class="py-3">Current step index (0-based)</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">steps</td>
                <td class="py-3 pr-4 font-mono text-label">Step[]</td>
                <td class="py-3 pr-4">Required</td>
                <td class="py-3">Array of step objects</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">variant</td>
                <td class="py-3 pr-4 font-mono text-label">'default' | 'dash' | 'numbered'</td>
                <td class="py-3 pr-4">'default'</td>
                <td class="py-3">Visual variant</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">orientation</td>
                <td class="py-3 pr-4 font-mono text-label">'horizontal' | 'vertical'</td>
                <td class="py-3 pr-4">'horizontal'</td>
                <td class="py-3">Layout orientation</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">nonLinear</td>
                <td class="py-3 pr-4 font-mono text-label">boolean</td>
                <td class="py-3 pr-4">false</td>
                <td class="py-3">Allow clicking any step</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">size</td>
                <td class="py-3 pr-4 font-mono text-label">'sm' | 'md'</td>
                <td class="py-3 pr-4">'md'</td>
                <td class="py-3">Size variant</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Step Interface -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-4">Step Interface</h3>
        <div class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg font-mono text-label">
          <pre class="text-content-secondary">interface Step {
  id: string              // Unique identifier
  label: string           // Display label
  description?: string    // Optional description (vertical)
  icon?: Component        // Optional icon (not shown in default horizontal)
  optional?: boolean      // Mark as optional
  error?: boolean         // Show error state
  disabled?: boolean      // Disable navigation
}</pre>
        </div>
      </div>

      <!-- Exposed Methods -->
      <div class="mb-8">
        <h3 class="text-h3 text-content-primary mb-4">Exposed Methods</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-stroke">
                <th class="py-3 pr-4 text-body-regular font-semibold text-content-primary">Method</th>
                <th class="py-3 text-body-regular font-semibold text-content-primary">Description</th>
              </tr>
            </thead>
            <tbody class="text-body-regular text-content-secondary">
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">nextStep()</td>
                <td class="py-3">Navigate to next step programmatically</td>
              </tr>
              <tr class="border-b border-stroke-subtle">
                <td class="py-3 pr-4 font-mono text-label">prevStep()</td>
                <td class="py-3">Navigate to previous step programmatically</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Accessibility -->
    <section class="mb-12">
      <h2 class="text-h2 text-content-primary mb-4">Accessibility</h2>
      <ul class="space-y-3 text-body-regular text-content-secondary">
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Uses <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">role="group"</code> with descriptive <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-label</code>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Active step marked with <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-current="step"</code>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Step status communicated via comprehensive <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-label</code>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Keyboard accessible - Tab to focus steps and scroll buttons, Enter/Space to select
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Disabled steps have <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">disabled</code> attribute and cannot be clicked
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Scroll buttons have clear <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-label</code> text
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 text-success-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Decorative icons hidden from screen readers with <code class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label">aria-hidden="true"</code>
        </li>
      </ul>
    </section>
  </div>
</template>
