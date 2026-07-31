<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BookstoreLayout from '@/components/bookstore/BookstoreLayout.vue'
import { useBookStore } from '@/stores/book.store.js'
import { formatShortDate } from '@/utils/date.js'
import { useToast } from '@/composables/useToast.js'
import { translateError } from '../../utils/translateError.js'

const { t } = useI18n()
const router = useRouter()
const bookStore = useBookStore()
const { showSuccess, showError } = useToast()
const searchQuery = ref('')
const downloadingItemId = ref('')

const loading = computed(() => bookStore.ordersLoading)

/**
 * Extract unique purchased books from all paid/completed orders.
 * Each book entry carries the orderId + itemId needed for download,
 * plus display metadata (title, seller, cover, price, purchase date).
 */
const purchasedBooks = computed(() => {
  const paidOrders = (bookStore.orders || []).filter(
    (o) => o.status === 'paid' || o.status === 'completed',
  )

  const seen = new Map()

  for (const order of paidOrders) {
    for (const item of order.items || []) {
      const bookId = item.book?._id || item.book
      if (!bookId) continue

      // Keep the most recent purchase if a book appears in multiple orders
      if (seen.has(bookId)) continue

      seen.set(bookId, {
        bookId,
        orderId: order._id,
        itemId: item._id,
        title: item.book?.title || 'Untitled',
        seller: item.seller?.displayName || item.seller?.username || t('bookstore.unknownSeller'),
        coverImage: item.coverImage || item.book?.coverImages?.[0] || '/default-book-cover.png',
        price: Number(item.price || 0).toFixed(2),
        purchaseDate: order.createdAt,
        ebookFileUrl: item.ebookFileUrl || null,
      })
    }
  }

  return Array.from(seen.values())
})

const filteredBooks = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return purchasedBooks.value
  return purchasedBooks.value.filter((b) => b.title.toLowerCase().includes(q))
})

async function downloadBook(book) {
  if (downloadingItemId.value) return
  downloadingItemId.value = book.itemId

  try {
    await bookStore.downloadPaidBook(book.orderId, book.itemId, book.title)
    showSuccess('Download started')
  } catch (error) {
    showError(translateError(error, null, 'error.loadFailed'))
  } finally {
    downloadingItemId.value = ''
  }
}

function goToBookstore() {
  router.push('/bookstore')
}

onMounted(() => {
  bookStore.fetchOrders()
})
</script>

<template>
  <BookstoreLayout>
    <section class="bookstore-page page-block p-3 p-md-4">
      <!-- Header -->
      <div class="library-header">
        <div>
          <h1 class="page-title">{{ t('bookstore.myLibrary') }}</h1>
          <p class="page-subtitle">
            {{ t('bookstore.libraryDescription') }}
          </p>
        </div>
        <span v-if="purchasedBooks.length > 0" class="book-count-badge">
          {{ t('bookstore.booksCount', { count: purchasedBooks.length }) }}
        </span>
      </div>

      <!-- Error -->
      <div v-if="bookStore.ordersError" class="alert alert-danger" role="alert">
        {{ bookStore.ordersError }}
      </div>

      <!-- Loading -->
      <div v-if="loading && purchasedBooks.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <!-- Empty state -->
      <div v-else-if="purchasedBooks.length === 0 && !loading" class="empty-state">
        <i class="fa-solid fa-book-open empty-icon"></i>
        <p class="empty-text">{{ t('bookstore.noBooksInLibrary') }}</p>
        <button type="button" class="btn btn-primary action-pill action-pill--post" @click="goToBookstore">
          <i class="fa-solid fa-store me-1"></i>
          {{ t('bookstore.browseBooks') }}
        </button>
      </div>

      <!-- Search bar -->
      <div v-if="purchasedBooks.length > 0" class="library-search panel">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="t('bookstore.searchBooks')"
        />
      </div>

      <!-- Book grid -->
      <div v-if="filteredBooks.length > 0" class="library-grid">
        <div v-for="book in filteredBooks" :key="book.bookId" class="library-card">
          <router-link :to="`/bookstore/${book.bookId}`" class="library-card-cover-link">
            <img
              :src="book.coverImage"
              :alt="book.title"
              class="library-card-cover"
              loading="lazy"
            />
          </router-link>
          <div class="library-card-body">
            <router-link :to="`/bookstore/${book.bookId}`" class="library-card-title-link">
              <h3 class="library-card-title">{{ book.title }}</h3>
            </router-link>
            <p class="library-card-seller">{{ book.seller }}</p>
            <p class="library-card-price">${{ book.price }}</p>
            <p class="library-card-date">
              {{ t('bookstore.purchasedOn') }} {{ formatShortDate(book.purchaseDate) }}
            </p>
            <div class="library-card-actions">
              <button
                type="button"
                class="btn action-pill action-pill--post action-pill--small library-card-read"
                @click="router.push({ name: 'book-read', query: { bookId: book.bookId, orderId: book.orderId, itemId: book.itemId, title: book.title } })"
              >
                <i class="fa-solid fa-book-open me-1"></i>
                {{ t('bookstore.read') }}
              </button>
              <button
                type="button"
                class="btn action-pill action-pill--post action-pill--small library-card-download"
                :disabled="downloadingItemId === book.itemId"
                @click="downloadBook(book)"
              >
                <i v-if="downloadingItemId === book.itemId" class="fa-solid fa-spinner fa-spin me-1"></i>
                <i v-else class="fa-solid fa-download me-1"></i>
                {{ downloadingItemId === book.itemId ? t('bookstore.loading') : t('bookstore.download') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No search results -->
      <div v-else-if="purchasedBooks.length > 0 && filteredBooks.length === 0" class="empty-state">
        <i class="fa-solid fa-magnifying-glass empty-icon"></i>
        <p class="empty-text">{{ t('bookstore.noBooks') }}</p>
      </div>
    </section>
  </BookstoreLayout>
</template>

<style scoped>
.bookstore-page {
  max-width: 1100px;
  margin: 0 auto;
}

/* ── Header ── */
.library-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 0.2rem;
}

.page-subtitle {
  font-size: 0.85rem;
  color: var(--muted);
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

/* ── Search ── */
.library-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.85rem;
  margin-bottom: 1rem;
}

.search-icon {
  color: var(--muted);
  font-size: 0.85rem;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.88rem;
  color: var(--text);
  outline: none;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--muted);
}

/* ── Grid ── */
.library-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

@media (max-width: 900px) {
  .library-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .library-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 400px) {
  .library-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Card ── */
.library-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  display: flex;
  flex-direction: column;
}

.library-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.library-card-cover-link {
  display: block;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: var(--surface-alt);
}

.library-card-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.library-card-body {
  padding: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.library-card-title-link {
  text-decoration: none;
  color: inherit;
}

.library-card-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
}

.library-card-title-link:hover .library-card-title {
  color: var(--brand);
}

.library-card-seller {
  font-size: 0.78rem;
  color: var(--muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.library-card-price {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent);
  margin: 0.15rem 0 0;
}

.library-card-date {
  font-size: 0.78rem;
  color: var(--muted);
  margin: 0;
}

.library-card-actions {
  margin-top: auto;
  display: flex;
  gap: 0.35rem;
  padding-top: 0.45rem;
}

.library-card-read,
.library-card-download {
  flex: 1;
  justify-content: center;
  font-size: 0.78rem;
  padding: 0.35rem 0.5rem;
}

/* ── Empty ── */
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
