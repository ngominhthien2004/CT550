<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({
  isLiked: { type: Boolean, default: false },
  isBookmarked: { type: Boolean, default: false },
  likeLoading: { type: Boolean, default: false },
  bookmarkLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-like', 'toggle-bookmark', 'report'])

const showMoreMenu = ref(false)
const toastMessage = ref('')
const showToast = ref(false)

function handleShare() {
  if (navigator.share) {
    navigator.share({ title: document.title, url: window.location.href }).catch(() => {})
  } else {
    handleCopyLink()
  }
}

function toggleMoreMenu() {
  showMoreMenu.value = !showMoreMenu.value
}

async function handleCopyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = window.location.href
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  showToastMessage('Link copied!')
  showMoreMenu.value = false
}

function handleReport() {
  emit('report')
  showMoreMenu.value = false
}

function showToastMessage(msg) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

function onClickOutside(event) {
  if (showMoreMenu.value) {
    const target = event.target
    if (!target.closest('.dd-panel') && !target.closest('.icon-btn[aria-label="More options"]')) {
      showMoreMenu.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <div class="novel-action-toolbar">
    <button
      type="button"
      class="icon-btn"
      :class="{ active: isLiked }"
      :disabled="likeLoading"
      aria-label="Like"
      @click="emit('toggle-like')"
    >
      <i :class="[isLiked ? 'fa-solid' : 'fa-regular', 'fa-heart']" aria-hidden="true"></i>
    </button>

    <button
      type="button"
      class="icon-btn"
      :class="{ active: isBookmarked }"
      :disabled="bookmarkLoading"
      aria-label="Bookmark"
      @click="emit('toggle-bookmark')"
    >
      <i :class="[isBookmarked ? 'fa-solid' : 'fa-regular', 'fa-bookmark']" aria-hidden="true"></i>
    </button>

    <button type="button" class="icon-btn" aria-label="Share" @click="handleShare">
      <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>
    </button>

    <div class="more-btn-wrapper">
      <button type="button" class="icon-btn" aria-label="More options" @click="toggleMoreMenu">
        <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
      </button>
      <div v-if="showMoreMenu" class="dd-panel">
        <button type="button" class="dd-item" @click="handleCopyLink">Copy link</button>
        <button type="button" class="dd-item" @click="handleReport">Report</button>
      </div>
    </div>
  </div>

  <div v-if="showToast" class="toast-notification">{{ toastMessage }}</div>
</template>

<style scoped src="../../assets/styles/dropdown.css"></style>

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

.icon-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid transparent;
  background: var(--novel-surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--novel-text-color);
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) {
  background: var(--novel-border);
}

.icon-btn.active {
  color: var(--novel-surface);
  background: #f91880;
  border-color: #f91880;
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.more-btn-wrapper {
  position: relative;
}

/* Novel more menu item sizing override */
.dd-panel .dd-item {
  padding: 8px 14px;
  font-size: 0.85rem;
}

.toast-notification {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface);
  color: var(--text);
  padding: 10px 24px;
  border-radius: 999px;
  font-size: 0.9rem;
  box-shadow: var(--shadow-lg);
  z-index: 9999;
  animation: toastFadeIn 0.3s ease-out;
}

@keyframes toastFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
