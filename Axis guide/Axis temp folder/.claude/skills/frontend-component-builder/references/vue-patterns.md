# Vue/Nuxt/TypeScript Patterns

## Script Setup (Required)

Always use `<script setup lang="ts">` for components:

```vue
<script setup lang="ts">
// All declarations auto-exposed to template
const count = ref(0)
const increment = () => count.value++
</script>
```

## Props with TypeScript

### Simple props
```typescript
interface Props {
  title: string
  count?: number
  variant?: 'primary' | 'secondary'
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  variant: 'primary',
})
```

### Complex props
```typescript
interface ListItem {
  id: string
  label: string
}

interface Props {
  items: ListItem[]
  selectedId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
})
```

## Emits with TypeScript

```typescript
const emit = defineEmits<{
  click: [event: MouseEvent]
  update: [value: string]
  'item-selected': [item: ListItem, index: number]
}>()

// Usage
emit('click', event)
emit('update', newValue)
emit('item-selected', item, 0)
```

## v-model Support

```typescript
interface Props {
  modelValue: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// In template: v-model binds automatically
```

## State Management

### Local state (component-only)
```typescript
const isOpen = ref(false)
const items = ref<Item[]>([])
const form = reactive({
  name: '',
  email: '',
})
```

### Shared state (Nuxt useState)
```typescript
// In composable
const state = useState<AuthState>('auth', () => ({
  user: null,
  isLoading: true,
}))

// Automatically shared across components
```

## Computed Properties

```typescript
const isValid = computed(() => form.name.length > 0 && form.email.includes('@'))

const displayName = computed(() => {
  if (!user.value) return 'Guest'
  return user.value.name || user.value.email
})
```

## Watchers

```typescript
// Simple watch
watch(searchQuery, (newQuery) => {
  fetchResults(newQuery)
})

// With options
watch(
  () => props.itemId,
  async (newId) => {
    if (newId) await loadItem(newId)
  },
  { immediate: true }
)

// Multiple sources
watch(
  [firstName, lastName],
  ([first, last]) => {
    fullName.value = `${first} ${last}`
  }
)
```

## Lifecycle Hooks

```typescript
onMounted(() => {
  // DOM ready, fetch data, add listeners
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Cleanup
  window.removeEventListener('resize', handleResize)
})

onBeforeMount(() => {})
onBeforeUnmount(() => {})
```

## Composable Pattern

```typescript
export const useFeature = () => {
  // State
  const state = useState<FeatureState>('feature', () => initialState)

  // Computed (readonly exports)
  const isReady = computed(() => !state.value.isLoading)

  // Methods
  const doSomething = async () => {
    state.value.isLoading = true
    try {
      // ...
    } finally {
      state.value.isLoading = false
    }
  }

  return {
    // Expose state as readonly if mutations should go through methods
    state: readonly(state),
    isReady,
    doSomething,
  }
}
```

## Nuxt-Specific

### Page metadata
```typescript
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

useHead({
  title: 'Page Title | App Name',
})
```

### Data fetching
```typescript
// Server-side + client hydration
const { data, pending, error, refresh } = await useFetch('/api/items')

// With typing
const { data } = await useFetch<Item[]>('/api/items')

// With options
const { data } = await useFetch('/api/items', {
  query: { page: currentPage },
  watch: [currentPage],
})
```

### Auth-wrapped fetch
```typescript
const { authFetch } = useAuth()

// Automatically includes Authorization header
const data = await authFetch<ResponseType>('/api/v1/endpoint', {
  method: 'POST',
  body: JSON.stringify(payload),
})
```

### Route and navigation
```typescript
const route = useRoute()
const router = useRouter()

// Access params
const id = route.params.id

// Navigate
await navigateTo('/dashboard')
await navigateTo({ name: 'user-id', params: { id: '123' } })
```

## Template Patterns

### Conditional rendering
```vue
<div v-if="isLoading">Loading...</div>
<div v-else-if="error">{{ error }}</div>
<div v-else>{{ data }}</div>
```

### List rendering
```vue
<ul>
  <li v-for="item in items" :key="item.id">
    {{ item.name }}
  </li>
</ul>
```

### Dynamic classes
```vue
<!-- Object syntax -->
<div :class="{ 'is-active': isActive, 'is-disabled': disabled }">

<!-- Array syntax -->
<div :class="[baseClass, isActive ? 'bg-main-500' : 'bg-neutral-100']">

<!-- Computed -->
<div :class="buttonClasses">
```

### Event handling
```vue
<button @click="handleClick">
<button @click.prevent="handleSubmit">
<input @keyup.enter="submit">
<div @click.stop="preventBubble">
```

### Slots
```vue
<!-- Parent -->
<Card>
  <template #header>Title</template>
  <template #default>Content</template>
  <template #footer>Actions</template>
</Card>

<!-- Child (Card.vue) -->
<div class="card">
  <header><slot name="header" /></header>
  <main><slot /></main>
  <footer><slot name="footer" /></footer>
</div>
```

## SOLID Principles Applied

### Single Responsibility
- One component = one purpose
- Extract complex logic into composables
- Keep components under 200 lines

### Open/Closed
- Use props for variation, not code changes
- Expose slots for content customization
- Use provide/inject for deep customization

### Liskov Substitution
- Components with same props interface are interchangeable
- Maintain consistent emit signatures

### Interface Segregation
- Don't force components to accept unused props
- Split large prop interfaces into smaller ones

### Dependency Inversion
- Components depend on composables, not concrete implementations
- Use provide/inject for swappable dependencies

## Clean Code Checklist

- [ ] Component name matches file name (PascalCase)
- [ ] Props are typed with interfaces
- [ ] Emits are typed with strict signatures
- [ ] Complex logic extracted to composables
- [ ] No magic numbers/strings (use constants)
- [ ] Comments explain "why", not "what"
- [ ] Template is readable (< 100 lines ideal)
- [ ] Semantic HTML elements used
- [ ] Accessibility attributes included (aria-*, role)
