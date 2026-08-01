<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BookstoreLayout from '@/components/bookstore/BookstoreLayout.vue'
import BookGrid from '@/components/bookstore/BookGrid.vue'
import { useBookBookmarkStore } from '@/stores/bookBookmark.store.js'
import { useToast } from '@/composables/useToast.js'

const { t } = useI18n()
const router = useRouter()
const bookmarkStore = useBookBookmarkStore()
const { showError } = useToast()

const loading = computed(() => bookmarkStore.loading)
const error = computed(() => bookmarkStore.error)

/** Extract book objects from populated bookmark items. */
const books = computed(() =>
  bookmarkStore.items
    .map((item) => item.bookId)
    .filter(Boolean)
)

function goToBookstore() {
  router.push('/bookstore')
}

onMounted(() => {
  bookmarkStore.fetchMyBookBookmarks()
})
</script>

<template>
  <BookstoreLayout>
    <section class="bookstore-page page-block p-3 p-md-4">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">
          <i class="fa-solid fa-bookmark me-2"></i>{{ t('bookstore.bookmarks') }}
        </h1>
        <span v-if="books.length > 0" class="book-count-badge">
          {{ t('bookstore.booksCount', { count: books.length }) }}
        </span>
      </div>

      <!-- Error -->
      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <!-- Loading -->
      <div v-if="loading && books.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <!-- Empty state -->
      <div v-else-if="books.length === 0 && !loading" class="empty-state">
        <i class="fa-regular fa-bookmark empty-icon"></i>
        <p class="empty-text">{{ t('bookstore.noBookmarks') }}</p>
        <button type="button" class="btn btn-primary" @click="goToBookstore">
          <i class="fa-solid fa-store me-1"></i>
          {{ t('bookstore.browseBooks') }}
        </button>
      </div>

      <!-- Book grid -->
      <BookGrid v-else :books="books" :loading="loading" />
    </section>
  </BookstoreLayout>
</template>

<style scoped>
.bookstore-page {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0;
}

.book-count-badge {
  flex-shrink: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--brand);
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--line);
}

.empty-text {
  font-size: 0.95rem;
  margin: 0 0 1rem;
}
</style>
