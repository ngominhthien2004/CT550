<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BookstoreLayout from '@/components/bookstore/BookstoreLayout.vue'
import BookGrid from '@/components/bookstore/BookGrid.vue'
import { useBookStore } from '@/stores/book.store.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()

const sellerId = computed(() => route.params.id)
const profile = computed(() => bookStore.publicSellerProfile)
const loading = computed(() => bookStore.publicSellerLoading)
const error = computed(() => bookStore.publicSellerError)
const books = computed(() => bookStore.sellerPublishedBooks)
const booksLoading = computed(() => bookStore.sellerPublishedBooksLoading)
const booksError = computed(() => bookStore.sellerPublishedBooksError)
const pagination = computed(() => bookStore.sellerPublishedBooksPagination)

const sellerAvatar = computed(() => {
  return profile.value?.user?.avatar || '/default-avatar.png'
})

const sellerDisplayName = computed(() => {
  const user = profile.value?.user
  return user?.displayName || user?.username || t('bookstore.unknownSeller')
})

const sellerBio = computed(() => profile.value?.bio || '')
const booksCount = computed(() => pagination.value.total)

function goToPage(page) {
  if (page < 1 || page > pagination.value.pages) return
  bookStore.fetchSellerPublishedBooks(sellerId.value, page, pagination.value.limit)
}

function goBack() {
  router.push('/bookstore')
}

onMounted(() => {
  if (sellerId.value) {
    bookStore.fetchPublicSellerProfile(sellerId.value)
    bookStore.fetchSellerPublishedBooks(sellerId.value)
  }
})

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      bookStore.fetchPublicSellerProfile(newId)
      bookStore.fetchSellerPublishedBooks(newId)
    }
  }
)
</script>

<template>
  <BookstoreLayout>
    <div class="bookstore-page page-block p-3 p-md-4">
      <!-- Loading state -->
      <div v-if="loading" class="seller-loading">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="seller-error">
        <div class="seller-error-card">
          <i class="fa-solid fa-circle-exclamation seller-error-icon"></i>
          <p class="seller-error-msg">{{ t('bookstore.sellerNotFound') }}</p>
          <p class="seller-error-detail">{{ error }}</p>
          <button type="button" class="seller-back-btn" @click="goBack">
            <i class="fa-solid fa-arrow-left me-1"></i> {{ t('bookstore.backToStore') }}
          </button>
        </div>
      </div>

      <!-- Seller profile -->
      <template v-else-if="profile">
        <section class="seller-header">
          <img
            :src="sellerAvatar"
            :alt="sellerDisplayName"
            class="seller-avatar"
          />
          <div class="seller-header-info">
            <h2 class="seller-name">{{ sellerDisplayName }}</h2>
            <p v-if="sellerBio" class="seller-bio">{{ sellerBio }}</p>
            <p class="seller-stats">
              <i class="fa-solid fa-book me-1"></i>
              {{ t('bookstore.booksCount', { count: booksCount }) }}
            </p>
          </div>
        </section>

        <!-- Published books section -->
        <section class="seller-books-section">
          <header class="bookstore-section-head">
            <h3 class="bookstore-section-title">
              <i class="fa-solid fa-book-open bookstore-section-title-icon"></i>
              {{ t('bookstore.publishedBooks') }}
            </h3>
          </header>

          <div v-if="booksError" class="alert alert-danger" role="alert">
            {{ booksError }}
          </div>

          <BookGrid :books="books" :loading="booksLoading" />

          <!-- Empty state -->
          <div v-if="!booksLoading && books.length === 0 && !booksError" class="bookstore-section-empty">
            <i class="fa-solid fa-book me-1"></i>
            {{ t('bookstore.noBooksFromSeller') }}
          </div>

          <!-- Pagination -->
          <nav v-if="pagination.pages > 1" class="bookstore-pagination-wrap bookstore-pagination" :aria-label="t('bookstore.publishedBooks')">
            <ul class="pagination mb-0">
              <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
                <button type="button" class="page-link" :disabled="pagination.page <= 1" @click="goToPage(pagination.page - 1)">{{ t('bookstore.previous') }}</button>
              </li>
              <li v-for="page in pagination.pages" :key="page" class="page-item" :class="{ active: page === pagination.page }">
                <button type="button" class="page-link" @click="goToPage(page)">{{ page }}</button>
              </li>
              <li class="page-item" :class="{ disabled: pagination.page >= pagination.pages }">
                <button type="button" class="page-link" :disabled="pagination.page >= pagination.pages" @click="goToPage(pagination.page + 1)">{{ t('bookstore.next') }}</button>
              </li>
            </ul>
          </nav>
        </section>
      </template>
    </div>
  </BookstoreLayout>
</template>

<style scoped>
.bookstore-page {
  max-width: 900px;
  margin: 0 auto;
}

.seller-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.seller-error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.seller-error-card {
  text-align: center;
  max-width: 400px;
}

.seller-error-icon {
  font-size: 2.5rem;
  color: var(--danger, #ef4444);
  margin-bottom: 1rem;
}

.seller-error-msg {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.5rem;
}

.seller-error-detail {
  font-size: 0.9rem;
  color: var(--muted);
  margin: 0 0 1.25rem;
}

.seller-back-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  color: #fff;
  background: var(--accent);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.18s ease;
}

.seller-back-btn:hover {
  background: var(--accent-hover);
}

/* ── Seller header ── */
.seller-header {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 2rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  margin-bottom: 2rem;
}

.seller-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid var(--line);
}

.seller-header-info {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.seller-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--brand);
  margin: 0;
  letter-spacing: -0.01em;
}

.seller-bio {
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.55;
  margin: 0;
  white-space: pre-line;
}

.seller-stats {
  color: var(--muted);
  font-size: 0.88rem;
  margin: 0.25rem 0 0;
}

/* ── Books section ── */
.seller-books-section {
  display: grid;
  gap: 1.25rem;
}

.seller-books-section .bookstore-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.seller-books-section .bookstore-section-title {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brand);
  letter-spacing: -0.01em;
  margin: 0;
}

.seller-books-section .bookstore-section-title-icon {
  font-size: 1rem;
  color: var(--accent);
}

.seller-books-section .bookstore-section-empty {
  padding: 1rem;
  border: 1px dashed var(--line);
  border-radius: var(--radius, 10px);
  color: var(--muted);
  text-align: center;
  font-size: 0.9rem;
  background: var(--surface);
}

.seller-books-section .bookstore-pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
}

.seller-books-section .bookstore-pagination .page-link {
  background: var(--surface);
  border-color: var(--line);
  color: var(--text);
}

.seller-books-section .bookstore-pagination .page-item.active .page-link {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.seller-books-section .bookstore-pagination .page-item.disabled .page-link {
  opacity: 0.5;
}

@media (max-width: 600px) {
  .seller-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem;
  }

  .seller-avatar {
    width: 96px;
    height: 96px;
  }
}
</style>
