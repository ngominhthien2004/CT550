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
  <button
    type="button"
    class="bookstore-category-card"
    :style="{ '--cat-accent': accent }"
    @click="handleClick"
  >
    <span class="bookstore-category-icon">
      <i :class="['fa-solid', icon]"></i>
    </span>
    <span class="bookstore-category-meta">
      <span class="bookstore-category-name">{{ name }}</span>
      <span v-if="count > 0" class="bookstore-category-count">{{ count }} {{ count === 1 ? 'book' : 'books' }}</span>
    </span>
  </button>
</template>

<style scoped src="../../assets/styles/bookstore.css"></style>
