<script setup>
defineProps({
  likeCount: { type: Number, default: 0 },
  bookmarkCount: { type: Number, default: 0 },
  isLiked: { type: Boolean, default: false },
  isBookmarked: { type: Boolean, default: false },
  likeLoading: { type: Boolean, default: false },
  bookmarkLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-like', 'toggle-bookmark'])

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0)
}

function handleShare() {
  navigator.clipboard.writeText(window.location.href)
  alert('Đã sao chép liên kết trang Novel này vào clipboard!')
}
</script>

<template>
  <div class="novel-action-toolbar">
    <button type="button"
      class="action-btn like-btn"
      :class="{ 'is-active': isLiked, 'is-loading': likeLoading }"
      :disabled="likeLoading"
      @click="emit('toggle-like')"
    >
      <span class="btn-icon">❤️</span>
      <span class="btn-count">{{ formatNumber(likeCount) }}</span>
    </button>

    <button type="button"
      class="action-btn bookmark-btn"
      :class="{ 'is-active': isBookmarked, 'is-loading': bookmarkLoading }"
      :disabled="bookmarkLoading"
      @click="emit('toggle-bookmark')"
    >
      <span class="btn-icon">🔖</span>
      <span class="btn-count">{{ formatNumber(bookmarkCount) }}</span>
    </button>

    <button type="button" class="action-btn share-btn" @click="handleShare" title="Copy link to share">
      <span class="btn-icon">🔗</span>
      <span class="btn-text">Share</span>
    </button>
  </div>
</template>

<style scoped>
.novel-action-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--novel-border);
  margin-top: 2.5rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2.6rem;
  padding: 0 1.25rem;
  border: 1px solid var(--novel-border);
  border-radius: 20px;
  background: var(--novel-surface);
  color: var(--novel-text-color);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.like-btn:hover {
  border-color: #f43f5e;
  background-color: color-mix(in srgb, #f43f5e 8%, var(--novel-surface));
  color: #f43f5e;
}

.like-btn.is-active {
  background-color: #f43f5e;
  border-color: #f43f5e;
  color: #ffffff;
}

.bookmark-btn:hover {
  border-color: #eab308;
  background-color: color-mix(in srgb, #eab308 8%, var(--novel-surface));
  color: #ca8a04;
}

.bookmark-btn.is-active {
  background-color: #eab308;
  border-color: #eab308;
  color: #ffffff;
}

.share-btn:hover {
  border-color: var(--novel-accent);
  background-color: color-mix(in srgb, var(--novel-accent) 8%, var(--novel-surface));
  color: var(--novel-accent);
}

.action-btn.is-loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-count {
  font-size: 0.8rem;
  font-weight: 700;
  font-family: ui-monospace, 'SF Mono', monospace;
  opacity: 0.9;
}
</style>
