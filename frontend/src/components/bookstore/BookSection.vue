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
  <section class="bookstore-section">
    <header class="bookstore-section-head">
      <h2 class="bookstore-section-title">
        <i :class="['fa-solid', icon]" class="bookstore-section-title-icon"></i>
        {{ title }}
      </h2>
      <a
        v-if="showMore"
        :href="moreHref || '#'"
        class="bookstore-section-more"
        @click.prevent="handleShowMore"
      >
        Show more
        <i class="fa-solid fa-arrow-right bookstore-section-more-icon" aria-hidden="true"></i>
      </a>
    </header>

    <BookGrid
      :books="visibleBooks(books, limit)"
      :loading="loading"
    />

    <div v-if="!loading && (books?.length || 0) === 0" class="bookstore-section-empty">
      No books here yet.
    </div>
  </section>
</template>

<style scoped src="../../assets/styles/bookstore.css"></style>

<style scoped>
/* BookSection-specific override: shift "Show more" icon on hover for affordance. */
.bookstore-section-more:hover {
  transform: translateX(2px);
}

.bookstore-section-more:hover .bookstore-section-more-icon {
  transform: translateX(2px);
}
</style>
