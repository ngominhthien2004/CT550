<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBookBookmarkStore } from '@/stores/bookBookmark.store.js'
import { useAuthStore } from '@/stores/auth.store.js'

const props = defineProps({
  book: {
    type: Object,
    required: true,
  },
  variant: {
    type: String,
    default: 'cover', // 'cover' = small circular on card, 'detail' = pill button on detail page
  },
})

const router = useRouter()
const bookmarkStore = useBookBookmarkStore()
const authStore = useAuthStore()

const bookId = computed(() => props.book?._id || props.book?.id)
const isBookmarked = computed(() => bookmarkStore.isBookmarked(bookId.value))
const isToggling = computed(() => bookmarkStore.isToggling(bookId.value))

async function handleToggle(e) {
  e.preventDefault()
  e.stopPropagation()
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (isToggling.value) return
  try {
    await bookmarkStore.toggleBookmark(bookId.value)
  } catch {
    // Error handled in store
  }
}
</script>

<template>
  <button
    type="button"
    class="book-bookmark-btn"
    :class="['book-bookmark-btn--' + variant, { 'is-active': isBookmarked }]"
    :aria-label="isBookmarked ? 'Remove bookmark' : 'Bookmark'"
    @click="handleToggle"
    :disabled="isToggling"
  >
    <i :class="isBookmarked ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'"></i>
    <span v-if="variant === 'detail'" class="bookmark-label">
      {{ isBookmarked ? $t('bookstore.bookmarked') : $t('bookstore.bookmark') }}
    </span>
  </button>
</template>

<style scoped>
.book-bookmark-btn {
  position: absolute;
  border-radius: 999px;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s, color 0.15s;
}

/* Cover variant — small circle overlay on the card */
.book-bookmark-btn--cover {
  right: 0.5rem;
  bottom: 0.5rem;
  width: 2rem;
  height: 2rem;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 0.85rem;
  z-index: 2;
}

.book-bookmark-btn--cover:hover {
  transform: scale(1.1);
  background: rgba(0, 0, 0, 0.65);
}

/* Detail variant — pill button on the detail page */
.book-bookmark-btn--detail {
  position: relative;
  width: auto;
  min-width: 150px;
  height: auto;
  padding: 0.6rem 1.2rem;
  background: var(--surface-alt);
  border: 1px solid var(--line);
  color: var(--text);
  font-size: 0.9rem;
  gap: 0.5rem;
  justify-content: center;
}

.book-bookmark-btn--detail:hover {
  background: var(--brand);
  color: #fff;
  border-color: var(--brand);
}

.bookmark-label {
  font-weight: 600;
  white-space: nowrap;
}

/* Shared active state */
.book-bookmark-btn.is-active {
  color: #3b82f6;
}

.book-bookmark-btn--cover.is-active {
  background: rgba(0, 0, 0, 0.65);
}

.book-bookmark-btn--detail.is-active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.book-bookmark-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
