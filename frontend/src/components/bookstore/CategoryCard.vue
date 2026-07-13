<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: {
    type: [Object, String],
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['select'])

const name = computed(() => props.category?.name || props.category || 'Category')
const slug = computed(() => props.category?.slug || props.category?._id || props.category?.id || name.value)
const icon = computed(() => props.category?.icon || 'fa-book')
const accent = computed(() => props.category?.accent || 'var(--accent)')

function handleClick() {
  emit('select', { name: name.value, slug: slug.value })
}
</script>

<template>
  <button type="button" class="category-card" :style="{ '--cat-accent': accent }" @click="handleClick">
    <span class="category-icon">
      <i :class="['fa-solid', icon]"></i>
    </span>
    <span class="category-meta">
      <span class="category-name">{{ name }}</span>
      <span v-if="count > 0" class="category-count">{{ count }} {{ count === 1 ? 'book' : 'books' }}</span>
    </span>
  </button>
</template>

<style scoped>
.category-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  text-align: left;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  box-shadow: var(--shadow-sm);
  font-family: inherit;
  color: inherit;
}

.category-card:hover {
  transform: translateY(-3px);
  border-color: var(--cat-accent, var(--accent));
  box-shadow: var(--shadow-md);
}

.category-card:focus-visible {
  outline: none;
  border-color: var(--cat-accent, var(--accent));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cat-accent, var(--accent)) 22%, transparent);
}

.category-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--cat-accent, var(--accent)) 12%, var(--surface));
  color: var(--cat-accent, var(--accent));
  font-size: 1.15rem;
  flex-shrink: 0;
}

.category-card:hover .category-icon {
  background: color-mix(in srgb, var(--cat-accent, var(--accent)) 18%, var(--surface));
}

.category-meta {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.category-name {
  font-weight: 700;
  color: var(--brand);
  font-size: 0.95rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-count {
  font-size: 0.75rem;
  color: var(--muted);
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
