<script setup>
defineProps({
  tag: {
    type: [Object, String],
    required: true,
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
})

const emit = defineEmits(['select'])

function handleClick(event) {
  emit('select', event.currentTarget.dataset.tag)
}
</script>

<template>
  <button
    type="button"
    class="tag-pill"
    :class="`tag-pill--${size}`"
    :data-tag="typeof tag === 'string' ? tag : tag.name"
    @click="handleClick"
  >
    <span class="tag-pill-hash" aria-hidden="true">#</span>
    <span class="tag-pill-label">{{ typeof tag === 'string' ? tag : tag.name }}</span>
  </button>
</template>

<style scoped>
.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  white-space: nowrap;
}

.tag-pill--sm {
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
}

.tag-pill--md {
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
}

.tag-pill--lg {
  padding: 0.55rem 1.1rem;
  font-size: 0.95rem;
}

.tag-pill:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
  border-color: var(--accent);
  color: var(--accent);
}

.tag-pill:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
}

.tag-pill-hash {
  color: var(--muted);
  font-weight: 700;
}

.tag-pill:hover .tag-pill-hash {
  color: var(--accent);
}
</style>
