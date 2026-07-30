<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { bookApi } from '@/services/book.api'
import BookCard from './BookCard.vue'

const { t } = useI18n()
const relatedBooks = ref([])
const loading = ref(true)

const props = defineProps({
  bookId: { type: String, required: true },
  tags: { type: Array, default: () => [] }
})

async function loadRelated() {
  if (!props.bookId || props.tags.length === 0) {
    loading.value = false
    return
  }
  try {
    const { data } = await bookApi.getRelatedBooks(props.bookId, props.tags)
    relatedBooks.value = (data.data || []).filter(b => b._id !== props.bookId).slice(0, 8)
  } catch {
    relatedBooks.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadRelated)
</script>

<template>
  <section v-if="!loading && relatedBooks.length > 0" class="related-books-section">
    <h3 class="related-heading">{{ t('bookstore.relatedBooks') }}</h3>
    <div class="related-grid">
      <BookCard v-for="book in relatedBooks" :key="book._id" :book="book" />
    </div>
  </section>
</template>

<style scoped>
.related-books-section {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border, rgba(255,255,255,0.08));
}
.related-heading {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: var(--text, #e2e8f0);
}
.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.25rem;
}
@media (max-width: 640px) {
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}
</style>
