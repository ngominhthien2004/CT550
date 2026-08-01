<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import StarRating from '@/components/bookstore/StarRating.vue'
import BookBookmarkButton from '@/components/bookstore/BookBookmarkButton.vue'

const props = defineProps({
  book: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const { locale, t } = useI18n()

const coverUrl = computed(() => {
  const images = props.book?.coverImages
  if (Array.isArray(images) && images.length > 0) return images[0]
  return props.book?.coverImage || '/default-book-cover.png'
})

const price = computed(() => Number(props.book?.price || 0))
const originalPrice = computed(() => Number(props.book?.originalPrice || 0))
const hasDiscount = computed(() => originalPrice.value > 0 && originalPrice.value > price.value)
const avgRating = computed(() => Number(props.book?.rating || 0))

// Format prices using the current locale + book currency so the UI
// reads naturally across en/vi/ja and respects non-USD currencies.
function formatPrice(value) {
  if (!Number.isFinite(value)) return ''
  const currency = props.book?.currency || 'USD'
  try {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency,
    }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}

const priceFormatted = computed(() => formatPrice(price.value))
const originalPriceFormatted = computed(() => formatPrice(originalPrice.value))

function navigateToDetail() {
  const id = props.book?._id || props.book?.id
  if (!id) return
  router.push(`/bookstore/${id}`)
}
</script>

<template>
  <article class="book-card" @click="navigateToDetail">
    <div class="book-cover-wrap">
      <img :src="coverUrl" :alt="book.title" class="book-cover" loading="lazy" />
      <BookBookmarkButton :book="book" />
      <span v-if="hasDiscount" class="book-badge">{{ t('bookstore.sale') }}</span>
    </div>
    <div class="book-meta">
      <h3 class="book-title">{{ book.title }}</h3>
      <p class="book-seller">
        <router-link
          v-if="book.seller?._id"
          :to="{ name: 'book-seller-public', params: { id: book.seller._id } }"
          class="seller-link"
          @click.stop
        >
          <img
            :src="book.seller.avatar || 'https://s.pximg.net/common/images/no_profile.png'"
            class="seller-avatar"
            :alt="book.seller.displayName || book.seller.username"
            @error="(e) => (e.target.src = 'https://s.pximg.net/common/images/no_profile.png')"
          />
          <span>{{ book.seller.displayName || book.seller.username || t('bookstore.unknownSeller') }}</span>
        </router-link>
        <span v-else>{{ t('bookstore.unknownSeller') }}</span>
      </p>
      <div class="book-footer">
        <div class="book-price-row">
          <span class="book-price">{{ priceFormatted }}</span>
          <span v-if="hasDiscount" class="book-original-price">{{ originalPriceFormatted }}</span>
        </div>
        <div v-if="avgRating > 0" class="book-rating">
          <StarRating :value="avgRating" :max="5" size="small" />
          <span>{{ avgRating.toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.book-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.book-cover-wrap {
  position: relative;
  aspect-ratio: 2 / 3;
  background: var(--surface-alt);
  overflow: hidden;
}

.book-cover {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.book-card:hover .book-cover {
  transform: scale(1.04);
}

.book-badge {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.book-meta {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.book-title {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 0.35rem;
  color: var(--text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* Reserve exactly 2 lines so 1-line titles still align the author row below */
  min-height: 2.6em;
}

.book-seller {
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0 0 0.45rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seller-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;
  min-width: 0;
}
.seller-link:hover {
  color: var(--brand, #0096fa);
  text-decoration: underline;
}

.seller-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--surface-alt);
}

.book-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 1.4rem;
}

.book-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  min-width: 0;
}

.book-price {
  font-weight: 700;
  color: var(--accent);
  font-size: 1rem;
}

.book-original-price {
  font-size: 0.8rem;
  color: var(--muted);
  text-decoration: line-through;
}

.book-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--muted);
  white-space: nowrap;
}
</style>
