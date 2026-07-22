<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import StarRating from '@/components/bookstore/StarRating.vue'

const props = defineProps({
  book: {
    type: Object,
    required: true,
  },
})

const router = useRouter()

const coverUrl = computed(() => {
  const images = props.book?.coverImages
  if (Array.isArray(images) && images.length > 0) return images[0]
  return props.book?.coverImage || '/default-book-cover.png'
})

const price = computed(() => Number(props.book?.price || 0))
const originalPrice = computed(() => Number(props.book?.originalPrice || 0))
const hasDiscount = computed(() => originalPrice.value > 0 && originalPrice.value > price.value)
const avgRating = computed(() => Number(props.book?.rating || 0))

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
      <span v-if="hasDiscount" class="book-badge">Sale</span>
    </div>
    <div class="book-meta">
      <h3 class="book-title">{{ book.title }}</h3>
      <p class="book-seller">{{ book.seller?.displayName || book.seller?.username || 'Unknown seller' }}</p>
      <div v-if="avgRating > 0" class="book-rating">
        <StarRating :value="avgRating" :max="5" size="small" />
        <span>{{ avgRating.toFixed(1) }}</span>
      </div>
      <div class="book-price-row">
        <span class="book-price">${{ price.toFixed(2) }}</span>
        <span v-if="hasDiscount" class="book-original-price">${{ originalPrice.toFixed(2) }}</span>
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
}

.book-seller {
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0 0 0.45rem;
}

.book-price-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  margin-bottom: 0.35rem;
}
</style>
