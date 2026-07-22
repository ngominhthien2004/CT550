<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BookstoreLayout from '@/components/bookstore/BookstoreLayout.vue'
import AddToCartButton from '@/components/bookstore/AddToCartButton.vue'
import ReviewSection from '@/components/bookstore/ReviewSection.vue'
import { useBookStore } from '@/stores/book.store.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()

const bookId = computed(() => route.params.id)
const book = computed(() => bookStore.currentBook)
const loading = computed(() => bookStore.bookLoading)
const error = computed(() => bookStore.bookError)

const coverUrl = computed(() => {
  const images = book.value?.coverImages
  if (Array.isArray(images) && images.length > 0) return images[0]
  return book.value?.coverImage || '/default-book-cover.png'
})
const price = computed(() => Number(book.value?.price || 0))
const originalPrice = computed(() => Number(book.value?.originalPrice || 0))
const hasDiscount = computed(() => originalPrice.value > 0 && originalPrice.value > price.value)
const isUnlimited = computed(() => book.value?.stock === -1)

const avgRating = computed(() => Number(book.value?.rating || 0))
const reviewCount = computed(() => Number(book.value?.reviewCount || 0))

const sellerInfo = computed(() => {
  const s = book.value?.seller
  if (!s) return null
  // If it's a populated object
  if (typeof s === 'object') {
    return {
      id: s._id,
      name: s.displayName || s.username || 'Unknown',
      avatar: s.avatar || '/default-avatar.png',
    }
  }
  // If it's a string (ObjectId), we don't have name/avatar info
  return { id: s, name: 'Seller', avatar: '/default-avatar.png' }
})

function visitSeller() {
  const sellerId = sellerInfo.value?.id
  if (!sellerId) return
  router.push(`/users/${sellerId}`)
}

onMounted(() => {
  if (bookId.value) {
    bookStore.fetchBookDetail(bookId.value)
  }
})
</script>

<template>
  <BookstoreLayout>
    <section class="bookstore-page page-block p-3 p-md-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div v-else-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <div v-else-if="book" class="detail-grid">
        <div class="detail-cover-wrap">
          <img :src="coverUrl" :alt="book.title" class="detail-cover" />
        </div>

        <div class="detail-info">
          <h1 class="detail-title">{{ book.title }}</h1>
          <div class="detail-meta">
            <button v-if="sellerInfo" type="button" class="seller-pill" @click="visitSeller">
              <img :src="sellerInfo.avatar" alt="" class="seller-avatar" />
              <span>{{ sellerInfo.name }}</span>
            </button>
          </div>

          <!-- BLOCK 1: Price & Rating (info to view) -->
          <div class="detail-summary">
            <div class="detail-price-row">
              <span class="detail-price">${{ price.toFixed(2) }}</span>
              <span v-if="hasDiscount" class="detail-original-price">${{ originalPrice.toFixed(2) }}</span>
            </div>
            <div
              v-if="avgRating > 0 && reviewCount > 0"
              class="detail-rating"
              :aria-label="`${avgRating.toFixed(1)} ${t('bookstore.outOf5')} — ${reviewCount} ${t('bookstore.reviews')}`"
              role="img"
            >
              <span class="rating-stars" aria-hidden="true">
                <span v-for="n in 5" :key="n" class="rstar" :class="{ filled: n <= Math.round(avgRating) }">★</span>
              </span>
              <span class="rating-value" aria-hidden="true">{{ avgRating.toFixed(1) }}</span>
              <span class="rating-count" aria-hidden="true">({{ reviewCount }} {{ $t('bookstore.reviews') }})</span>
            </div>
          </div>

          <!-- BLOCK 2: Stock & Add to Cart (action) -->
          <div class="detail-purchase">
            <p class="detail-stock">
              {{ $t('bookstore.stock') }}
              <strong>{{ isUnlimited ? $t('bookstore.unlimited') : book.stock }}</strong>
            </p>
            <div class="detail-actions">
              <AddToCartButton :book-id="book._id" :disabled="book.status !== 'published'" />
            </div>
          </div>

          <!-- BLOCK 3: Description & Tags (info) -->
          <div class="detail-content">
            <h3 class="detail-section-title">{{ $t('bookstore.description') }}</h3>
            <p>{{ book.description || $t('bookstore.noDescription') }}</p>

            <div v-if="book.tags?.length" class="detail-tags">
              <span v-for="tag in book.tags" :key="tag" class="tag-chip">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

      <!-- Reviews Section -->
      <ReviewSection v-if="book" :book-id="book._id" />
  </BookstoreLayout>
</template>

<style scoped>
.bookstore-page {
  max-width: 900px;
  margin: 0 auto;
}

.detail-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 2rem;
  max-width: 800px;
}

.detail-cover-wrap {
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.detail-cover {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  display: block;
}

.detail-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 0.75rem;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.seller-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--line);
  background: var(--surface-alt);
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.seller-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
}

.detail-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.detail-price {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent);
}

.detail-original-price {
  font-size: 1.1rem;
  color: var(--muted);
  text-decoration: line-through;
}

.detail-stock {
  color: var(--muted);
  margin-bottom: 1rem;
}

.detail-actions {
  margin-bottom: 1.5rem;
}

.detail-summary {
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--line);
}

.detail-purchase {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--line);
}

.detail-content {
  /* content block, no special styles needed */
}

.detail-section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--brand);
}

.detail-content p {
  color: var(--text);
  line-height: 1.6;
  white-space: pre-line;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag-chip {
  background: var(--surface-alt);
  border: 1px solid var(--line);
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  font-size: 0.8rem;
  color: var(--muted);
}

.detail-rating {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.rating-stars {
  display: flex;
  gap: 0.1rem;
}

.rstar {
  font-size: 1.2rem;
  color: var(--line);
}

.rstar.filled {
  color: #f59e0b;
}

.rating-value {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text);
}

.rating-count {
  font-size: 0.85rem;
  color: var(--muted);
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-cover-wrap {
    max-width: 260px;
    margin: 0 auto;
  }
}
</style>
