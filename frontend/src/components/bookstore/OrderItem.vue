<script setup>
import { computed } from 'vue'
import { useBookStore } from '@/stores/book.store.js'
import { useToast } from '@/composables/useToast.js'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  orderId: {
    type: String,
    default: '',
  },
  showDownload: {
    type: Boolean,
    default: true,
  },
})

const bookStore = useBookStore()
const { showSuccess, showError } = useToast()

const book = computed(() => props.item?.book || {})
const coverUrl = computed(() =>
  props.item?.coverImage
  || props.item?.book?.coverImages?.[0]
  || '/default-book-cover.png',
)
const isDownloadable = computed(() => props.showDownload && props.orderId && props.item._id)

async function download() {
  if (!isDownloadable.value) return

  try {
    await bookStore.downloadPaidBook(props.orderId, props.item._id)
    showSuccess('Download started')
  } catch (error) {
    showError(error?.response?.data?.message || 'Failed to download')
  }
}
</script>

<template>
  <div class="order-item">
    <img :src="coverUrl" :alt="book.title" class="order-item-cover" />
    <div class="order-item-info">
      <h4 class="order-item-title">{{ book.title }}</h4>
      <p class="order-item-seller">{{ book.seller?.displayName || book.seller?.username }}</p>
      <span class="order-item-price">${{ Number(item.priceAtPurchase || item.priceAtAdd || 0).toFixed(2) }}</span>
    </div>
    <div class="order-item-actions">
      <button v-if="isDownloadable" type="button" class="btn btn-primary btn-sm" @click="download">
        <i class="fa-solid fa-download me-1"></i> Download
      </button>
    </div>
  </div>
</template>

<style scoped>
.order-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}

.order-item-cover {
  width: 56px;
  height: 84px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.order-item-info {
  flex: 1;
  min-width: 0;
}

.order-item-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.2rem;
  color: var(--text);
}

.order-item-seller {
  font-size: 0.78rem;
  color: var(--muted);
  margin: 0 0 0.3rem;
}

.order-item-price {
  font-weight: 700;
  color: var(--accent);
  font-size: 0.9rem;
}

.order-item-actions {
  flex-shrink: 0;
}
</style>
