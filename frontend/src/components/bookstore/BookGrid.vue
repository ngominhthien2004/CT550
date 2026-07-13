<script setup>
import BookCard from './BookCard.vue'

const props = defineProps({
  books: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="book-grid">
    <BookCard v-for="book in books" :key="book._id || book.id" :book="book" />
    <div v-for="n in 6" :key="`skeleton-${n}`" v-if="loading && books.length === 0" class="book-card skeleton">
      <div class="skeleton-cover"></div>
      <div class="skeleton-meta">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

@media (min-width: 768px) {
  .book-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.25rem;
  }
}

.skeleton {
  pointer-events: none;
}

.skeleton-cover {
  aspect-ratio: 2 / 3;
  background: linear-gradient(90deg, var(--surface-alt) 25%, var(--line) 50%, var(--surface-alt) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

.skeleton-meta {
  padding: 0.75rem;
  display: grid;
  gap: 0.45rem;
}

.skeleton-line {
  height: 0.8rem;
  border-radius: 4px;
  background: var(--line);
}

.skeleton-line.short {
  width: 60%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
