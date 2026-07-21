<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '@/stores/book.store.js'
import { useToast } from '@/composables/useToast.js'
import { translateError } from '../../utils/translateError.js'

const props = defineProps({
  book: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['updated', 'deleted'])

const router = useRouter()
const bookStore = useBookStore()
const { showSuccess, showError } = useToast()
const deleting = ref(false)
const toggling = ref(false)

const coverUrl = computed(() => {
  const images = props.book?.coverImages
  if (Array.isArray(images) && images.length > 0) return images[0]
  return props.book?.coverImage || '/default-book-cover.png'
})
const status = computed(() => props.book?.status || 'draft')

function editBook() {
  router.push(`/bookstore/upload?edit=${props.book._id}`)
}

async function toggleStatus() {
  toggling.value = true
  const nextStatus = status.value === 'published' ? 'draft' : 'published'

  try {
    await bookStore.updateBookById(props.book._id, {
      title: props.book.title,
      description: props.book.description,
      price: props.book.price,
      originalPrice: props.book.originalPrice,
      stock: props.book.stock,
      status: nextStatus,
      tags: props.book.tags || [],
    })
    showSuccess(`Book ${nextStatus === 'published' ? 'published' : 'unpublished'}`)
    emit('updated')
  } catch (error) {
    showError(translateError(error, null, 'error.saveFailed'))
  } finally {
    toggling.value = false
  }
}

async function removeBook() {
  if (!confirm('Delete this book permanently?')) return

  deleting.value = true
  try {
    await bookStore.removeBook(props.book._id)
    showSuccess('Book deleted')
    emit('deleted')
  } catch (error) {
    showError(translateError(error, null, 'error.deleteFailed'))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="seller-book-row">
    <img :src="coverUrl" :alt="book.title" class="seller-book-cover" />
    <div class="seller-book-info">
      <h4 class="seller-book-title">{{ book.title }}</h4>
      <p class="seller-book-meta">
        <span class="badge" :class="status === 'published' ? 'bg-success' : 'bg-secondary'">{{ status }}</span>
        <span class="seller-book-price">${{ Number(book.price || 0).toFixed(2) }}</span>
      </p>
    </div>
    <div class="seller-book-actions">
      <button type="button" class="btn btn-outline-primary btn-sm" :disabled="toggling" @click="toggleStatus">
        {{ status === 'published' ? 'Unpublish' : 'Publish' }}
      </button>
      <button type="button" class="btn btn-outline-secondary btn-sm" @click="editBook">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button type="button" class="btn btn-outline-danger btn-sm" :disabled="deleting" @click="removeBook">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.seller-book-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}

.seller-book-cover {
  width: 56px;
  height: 84px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.seller-book-info {
  flex: 1;
  min-width: 0;
}

.seller-book-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.4rem;
  color: var(--text);
}

.seller-book-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
}

.seller-book-price {
  font-weight: 700;
  color: var(--accent);
}

.seller-book-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 600px) {
  .seller-book-row {
    flex-wrap: wrap;
  }

  .seller-book-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
