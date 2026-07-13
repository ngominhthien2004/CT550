<script setup>
import BookGrid from './BookGrid.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'fa-book',
  },
  books: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  limit: {
    type: Number,
    default: 4,
  },
  showMore: {
    type: Boolean,
    default: true,
  },
  moreHref: {
    type: String,
    default: '',
  },
  moreQuery: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['show-more'])

const visibleBooks = (books, limit) => (books || []).slice(0, limit)

function handleShowMore() {
  if (props.moreHref) return
  emit('show-more')
}
</script>

<template>
  <section class="book-section">
    <header class="section-head">
      <h2 class="section-title">
        <i :class="['fa-solid', icon]" class="section-title-icon"></i>
        {{ title }}
      </h2>
      <a
        v-if="showMore"
        :href="moreHref || '#'"
        class="section-more"
        @click.prevent="handleShowMore"
      >
        Show more
        <i class="fa-solid fa-arrow-right section-more-icon" aria-hidden="true"></i>
      </a>
    </header>

    <BookGrid
      :books="visibleBooks(books, limit)"
      :loading="loading"
    />

    <div v-if="!loading && (books?.length || 0) === 0" class="section-empty">
      No books in this category yet.
    </div>
  </section>
</template>

<style scoped>
.book-section {
  display: grid;
  gap: 1rem;
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brand);
  letter-spacing: -0.01em;
}

.section-title-icon {
  font-size: 1rem;
  color: var(--accent);
}

.section-more {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--accent);
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  transition: background 0.18s ease, transform 0.18s ease;
}

.section-more:hover {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  transform: translateX(2px);
}

.section-more-icon {
  font-size: 0.7rem;
  transition: transform 0.18s ease;
}

.section-more:hover .section-more-icon {
  transform: translateX(2px);
}

.section-empty {
  padding: 1rem;
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  color: var(--muted);
  text-align: center;
  font-size: 0.9rem;
  background: var(--surface);
}
</style>
