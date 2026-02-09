<script setup lang="ts">
definePageMeta({
  layout: "design-system",
});

useHead({
  title: "Toggle | Components | Design System | 8020",
});

// Example states
const singleOn = ref(true);
const singleOff = ref(false);
const singleDisabledOn = ref(true);
const singleDisabledOff = ref(false);

const labelOn = ref(true);
const labelOff = ref(false);
const labelDisabledOn = ref(true);
const labelDisabledOff = ref(false);

const hintOn = ref(true);
const hintOff = ref(false);

const insideOn = ref(true);
const insideOff = ref(false);
const insideDisabledOn = ref(true);
const insideDisabledOff = ref(false);

const insideHintOn = ref(true);
const insideHintOff = ref(false);

// Interactive examples
const notifications = ref(true);
const autoSave = ref(false);
const darkMode = ref(false);
const twoFactor = ref(true);
</script>

<template>
  <div class="design-system-page">
    <!-- Header -->
    <div class="mb-8">
      <p class="text-label text-content-tertiary mb-2">3. Components</p>
      <h1 class="text-h1 text-content-primary mb-3">Toggle</h1>
      <p class="text-body-regular text-content-secondary max-w-3xl">
        Toggle switches are used to immediately turn settings on or off. Unlike checkboxes, toggles
        provide instant feedback and are best for settings that take effect immediately without requiring
        a save action.
      </p>
    </div>

    <!-- When to Use -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-4">When to Use</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <AxisCallout type="success" title="Use Toggle when">
          <ul class="list-disc list-inside space-y-1 text-body-regular">
            <li>Settings take effect immediately</li>
            <li>Switching between two mutually exclusive states (on/off)</li>
            <li>Enabling or disabling a feature or service</li>
            <li>User needs instant visual feedback</li>
          </ul>
        </AxisCallout>

        <AxisCallout type="warning" title="Don't use Toggle when">
          <ul class="list-disc list-inside space-y-1 text-body-regular">
            <li>Changes require a save/submit action (use checkbox instead)</li>
            <li>Selecting multiple options from a list (use checkbox)</li>
            <li>Part of a form that requires confirmation (use checkbox)</li>
            <li>More than two options are available (use radio or select)</li>
          </ul>
        </AxisCallout>
      </div>
    </section>

    <!-- Variants -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Variants</h2>

      <!-- Single (no label) -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Single (No Label)</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Use when the toggle's purpose is clear from surrounding context, or when space is limited.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex flex-wrap items-center gap-8">
            <!-- On states -->
            <div class="flex flex-col gap-3">
              <p class="text-label text-content-tertiary">On</p>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Default</span>
                <AxisToggle v-model="singleOn" />
              </div>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Disabled</span>
                <AxisToggle v-model="singleDisabledOn" disabled />
              </div>
            </div>

            <!-- Off states -->
            <div class="flex flex-col gap-3">
              <p class="text-label text-content-tertiary">Off</p>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Default</span>
                <AxisToggle v-model="singleOff" />
              </div>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Disabled</span>
                <AxisToggle v-model="singleDisabledOff" disabled />
              </div>
            </div>
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisToggle v-model="enabled" /&gt;
&lt;AxisToggle v-model="enabled" disabled /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- With Label -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">With Label</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          The most common variant. Always include a label when the toggle's purpose isn't immediately obvious.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex flex-wrap items-start gap-8">
            <!-- On states -->
            <div class="flex flex-col gap-3">
              <p class="text-label text-content-tertiary">On</p>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Default</span>
                <AxisToggle v-model="labelOn" label="Enable feature" />
              </div>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Disabled</span>
                <AxisToggle v-model="labelDisabledOn" label="Enable feature" disabled />
              </div>
            </div>

            <!-- Off states -->
            <div class="flex flex-col gap-3">
              <p class="text-label text-content-tertiary">Off</p>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Default</span>
                <AxisToggle v-model="labelOff" label="Enable feature" />
              </div>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Disabled</span>
                <AxisToggle v-model="labelDisabledOff" label="Enable feature" disabled />
              </div>
            </div>
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisToggle v-model="enabled" label="Enable feature" /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- With Label and Hint -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">With Label and Hint</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Add a hint to provide additional context or explain the consequences of toggling.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex flex-wrap items-start gap-8">
            <!-- On state -->
            <div class="flex flex-col gap-3">
              <p class="text-label text-content-tertiary">On</p>
              <AxisToggle
                v-model="hintOn"
                label="Email notifications"
                hint="Receive updates via email"
              />
            </div>

            <!-- Off state -->
            <div class="flex flex-col gap-3">
              <p class="text-label text-content-tertiary">Off</p>
              <AxisToggle
                v-model="hintOff"
                label="Email notifications"
                hint="Receive updates via email"
              />
            </div>
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisToggle
  v-model="enabled"
  label="Email notifications"
  hint="Receive updates via email"
/&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- Inside Text -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Inside Text (ON/OFF Labels)</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Shows "ON" or "OFF" text inside the toggle for extra clarity. Use when the on/off state needs to be
          explicitly labeled, such as in control panels or critical settings.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex flex-wrap items-start gap-8">
            <!-- On states -->
            <div class="flex flex-col gap-3">
              <p class="text-label text-content-tertiary">On</p>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Default</span>
                <AxisToggle v-model="insideOn" inside-text />
              </div>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Disabled</span>
                <AxisToggle v-model="insideDisabledOn" inside-text disabled />
              </div>
            </div>

            <!-- Off states -->
            <div class="flex flex-col gap-3">
              <p class="text-label text-content-tertiary">Off</p>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Default</span>
                <AxisToggle v-model="insideOff" inside-text />
              </div>
              <div class="flex items-center gap-3">
                <span class="text-label text-content-tertiary w-20">Disabled</span>
                <AxisToggle v-model="insideDisabledOff" inside-text disabled />
              </div>
            </div>
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisToggle v-model="enabled" inside-text /&gt;</code></pre>
          </details>
        </div>
      </div>

      <!-- Inside Text with Label and Hint -->
      <div class="mb-8">
        <h3 class="text-h4 text-content-primary mb-4">Inside Text with Label and Hint</h3>
        <p class="text-body-regular text-content-secondary mb-4">
          Combine inside text with label and hint for maximum clarity in complex settings interfaces.
        </p>

        <div class="bg-surface-raised border border-stroke rounded-lg p-6">
          <div class="flex flex-wrap items-start gap-8">
            <!-- On state -->
            <div class="flex flex-col gap-3">
              <p class="text-label text-content-tertiary">On</p>
              <AxisToggle
                v-model="insideHintOn"
                label="Two-factor authentication"
                hint="Adds an extra security layer"
                inside-text
              />
            </div>

            <!-- Off state -->
            <div class="flex flex-col gap-3">
              <p class="text-label text-content-tertiary">Off</p>
              <AxisToggle
                v-model="insideHintOff"
                label="Two-factor authentication"
                hint="Adds an extra security layer"
                inside-text
              />
            </div>
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-label-bold text-main-700 dark:text-main-300 hover:text-main-500">
              View code
            </summary>
            <pre class="mt-2 p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-lg overflow-x-auto text-label"><code>&lt;AxisToggle
  v-model="enabled"
  label="Two-factor authentication"
  hint="Adds an extra security layer"
  inside-text
/&gt;</code></pre>
          </details>
        </div>
      </div>
    </section>

    <!-- Interactive Examples -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Interactive Examples</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Try toggling these settings to see how AxisToggle works in real interfaces.
      </p>

      <div class="bg-surface-raised border border-stroke rounded-lg divide-y divide-stroke">
        <div class="p-6">
          <AxisToggle
            v-model="notifications"
            label="Push notifications"
            hint="Receive notifications on your device"
          />
        </div>

        <div class="p-6">
          <AxisToggle
            v-model="autoSave"
            label="Auto-save"
            hint="Automatically save changes as you work"
          />
        </div>

        <div class="p-6">
          <AxisToggle
            v-model="darkMode"
            label="Dark mode"
            hint="Use dark theme for better visibility in low light"
            inside-text
          />
        </div>

        <div class="p-6">
          <AxisToggle
            v-model="twoFactor"
            label="Two-factor authentication"
            hint="Require a verification code when signing in"
            inside-text
          />
        </div>
      </div>

      <!-- Current state display -->
      <div class="mt-4 p-4 bg-info-50 dark:bg-info-950 border border-info-300 dark:border-info-700 rounded-lg">
        <p class="text-label-bold text-info-900 dark:text-info-100 mb-2">Current Settings:</p>
        <ul class="text-label text-info-700 dark:text-info-300 space-y-1">
          <li>Push notifications: <strong>{{ notifications ? 'ON' : 'OFF' }}</strong></li>
          <li>Auto-save: <strong>{{ autoSave ? 'ON' : 'OFF' }}</strong></li>
          <li>Dark mode: <strong>{{ darkMode ? 'ON' : 'OFF' }}</strong></li>
          <li>Two-factor auth: <strong>{{ twoFactor ? 'ON' : 'OFF' }}</strong></li>
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
            The resting state, ready for user interaction.
          </p>
          <div class="flex gap-4">
            <AxisToggle v-model="singleOff" label="Off state" />
            <AxisToggle v-model="singleOn" label="On state" />
          </div>
        </div>

        <!-- Hover -->
        <div>
          <h3 class="text-h5 text-content-primary mb-3">Hover</h3>
          <p class="text-body-regular text-content-secondary mb-3">
            Visual feedback when the user hovers over the toggle. Background color becomes slightly lighter.
          </p>
          <p class="text-label text-content-tertiary">
            Hover over the toggles above to see the effect.
          </p>
        </div>

        <!-- Disabled -->
        <div>
          <h3 class="text-h5 text-content-primary mb-3">Disabled</h3>
          <p class="text-body-regular text-content-secondary mb-3">
            Non-interactive state when the setting cannot be changed (e.g., requires permissions, dependent on another setting).
          </p>
          <div class="flex gap-4">
            <AxisToggle v-model="singleDisabledOff" label="Disabled off" disabled />
            <AxisToggle v-model="singleDisabledOn" label="Disabled on" disabled />
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
              <td class="py-3 px-4 text-content-secondary">boolean</td>
              <td class="py-3 px-4 text-content-tertiary">false</td>
              <td class="py-3 px-4 text-content-secondary">Toggle state (on/off)</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">label</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">""</td>
              <td class="py-3 px-4 text-content-secondary">Label text displayed next to toggle</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">hint</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">""</td>
              <td class="py-3 px-4 text-content-secondary">Helper text shown below label</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">inside-text</td>
              <td class="py-3 px-4 text-content-secondary">boolean</td>
              <td class="py-3 px-4 text-content-tertiary">false</td>
              <td class="py-3 px-4 text-content-secondary">Show "ON"/"OFF" text inside toggle</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">disabled</td>
              <td class="py-3 px-4 text-content-secondary">boolean</td>
              <td class="py-3 px-4 text-content-tertiary">false</td>
              <td class="py-3 px-4 text-content-secondary">Disable the toggle</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">name</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">""</td>
              <td class="py-3 px-4 text-content-secondary">HTML name attribute (for forms)</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">id</td>
              <td class="py-3 px-4 text-content-secondary">string</td>
              <td class="py-3 px-4 text-content-tertiary">auto-generated</td>
              <td class="py-3 px-4 text-content-secondary">HTML id attribute</td>
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
              <td class="py-3 px-4 text-content-secondary">boolean</td>
              <td class="py-3 px-4 text-content-secondary">Emitted when toggle state changes (for v-model)</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-main-700 dark:text-main-300">change</td>
              <td class="py-3 px-4 text-content-secondary">boolean</td>
              <td class="py-3 px-4 text-content-secondary">Emitted when toggle state changes (new value)</td>
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
            <li><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Tab</kbd> - Move focus to/from toggle</li>
            <li><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Space</kbd> or <kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">Enter</kbd> - Toggle on/off</li>
          </ul>
        </div>

        <div>
          <h3 class="text-h5 text-content-primary mb-2">Screen Readers</h3>
          <ul class="list-disc list-inside text-body-regular text-content-secondary space-y-1">
            <li>Uses proper <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">role="switch"</code> for correct announcement</li>
            <li>Current state announced via <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">aria-checked</code></li>
            <li>Label associated via <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">aria-labelledby</code></li>
            <li>Hint text linked via <code class="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-label font-mono">aria-describedby</code></li>
          </ul>
        </div>

        <div>
          <h3 class="text-h5 text-content-primary mb-2">Focus Indicators</h3>
          <p class="text-body-regular text-content-secondary">
            Keyboard users see a visible focus ring (2px main-500 ring) around the toggle when focused,
            ensuring they know which element is active.
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
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use for settings that take effect immediately</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Always include a label unless context is crystal clear</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Provide hint text for complex or risky settings</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Use inside text for critical on/off settings</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success-500 dark:text-success-400 mt-1">✓</span>
              <span>Disable toggles that depend on other settings</span>
            </li>
          </ul>
        </div>

        <!-- Don'ts -->
        <div>
          <h3 class="text-h5 text-error-700 dark:text-error-400 mb-3">Don't</h3>
          <ul class="space-y-2 text-body-regular text-content-secondary">
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use for form inputs that need submission</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use when there are more than two options</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Make toggles too small to interact with on mobile</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Use ambiguous labels like "Toggle feature"</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error-500 dark:text-error-400 mt-1">✗</span>
              <span>Forget to provide feedback when state changes</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Toggle vs Checkbox -->
    <section class="mb-12">
      <h2 class="text-h3 text-content-primary mb-6">Toggle vs Checkbox</h2>
      <p class="text-body-regular text-content-secondary mb-4">
        Confused when to use a toggle versus a checkbox? Here's a quick reference:
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-body-regular border-collapse">
          <thead>
            <tr class="border-b-2 border-stroke-strong">
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Scenario</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Use Toggle</th>
              <th class="text-left py-3 px-4 text-content-primary font-semibold">Use Checkbox</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stroke">
            <tr>
              <td class="py-3 px-4 text-content-secondary">Takes effect...</td>
              <td class="py-3 px-4 text-success-700 dark:text-success-300">Immediately</td>
              <td class="py-3 px-4 text-content-tertiary">After save/submit</td>
            </tr>
            <tr>
              <td class="py-3 px-4 text-content-secondary">Selection type</td>
              <td class="py-3 px-4 text-success-700 dark:text-success-300">Single on/off</td>
              <td class="py-3 px-4 text-content-tertiary">Multiple from list</td>
            </tr>
            <tr>
              <td class="py-3 px-4 text-content-secondary">Use case</td>
              <td class="py-3 px-4 text-success-700 dark:text-success-300">Enable/disable features</td>
              <td class="py-3 px-4 text-content-tertiary">Select options in forms</td>
            </tr>
            <tr>
              <td class="py-3 px-4 text-content-secondary">Visual metaphor</td>
              <td class="py-3 px-4 text-success-700 dark:text-success-300">Physical switch</td>
              <td class="py-3 px-4 text-content-tertiary">Checklist item</td>
            </tr>
            <tr>
              <td class="py-3 px-4 text-content-secondary">Example</td>
              <td class="py-3 px-4 text-success-700 dark:text-success-300">"Enable dark mode"</td>
              <td class="py-3 px-4 text-content-tertiary">"I agree to terms"</td>
            </tr>
          </tbody>
        </table>
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
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <NuxtLink
          to="/design-system/components/select"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Select</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <NuxtLink
          to="/design-system/components/buttons"
          class="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-stroke rounded-lg hover:border-main-500 hover:bg-main-50 dark:hover:bg-main-950 transition-colors text-body-regular text-content-secondary hover:text-main-700 dark:hover:text-main-300"
        >
          <span>Buttons</span>
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
