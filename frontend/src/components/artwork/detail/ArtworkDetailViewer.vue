<script setup>
import { computed, nextTick, onBeforeUpdate, onMounted, onUnmounted, ref, toRefs, watch } from 'vue'

const props = defineProps({
  artwork: {
    type: Object,
    required: true,
  },
  isLiked: { type: Boolean, default: false },
  isBookmarked: { type: Boolean, default: false },
  likeLoading: { type: Boolean, default: false },
  bookmarkLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-like', 'toggle-bookmark'])

const { artwork, isLiked, isBookmarked, likeLoading, bookmarkLoading } = toRefs(props)

const selectedImageIndex = ref(0)
const imageRefs = ref([])
const showAllImages = ref(false)

const imageList = computed(() => {
  if (!Array.isArray(artwork.value?.images)) {
    return []
  }

  return artwork.value.images.filter((item) => typeof item === 'string' && item.trim())
})

const visibleImages = computed(() => (showAllImages.value ? imageList.value : imageList.value.slice(0, 1)))

function setImageRef(element, index) {
  if (element) {
    imageRefs.value[index] = element
  }
}

async function selectImage(index) {
  if (index < 0 || index >= imageList.value.length) {
    return
  }
  showAllImages.value = true
  selectedImageIndex.value = index
  await nextTick()
  imageRefs.value[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function revealAllImages() {
  showAllImages.value = true
  await nextTick()
  imageRefs.value[1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

onBeforeUpdate(() => {
  imageRefs.value = []
})

const showMoreMenu = ref(false)
const toastMessage = ref('')
const showToast = ref(false)

function handleShare() {
  if (navigator.share) {
    navigator.share({ title: artwork.value.title, url: window.location.href }).catch(() => {})
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

function handleDownload() {
  const firstImage = imageList.value[0]
  if (firstImage) {
    window.open(firstImage, '_blank')
  }
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
    if (!target.closest('.more-dropdown') && !target.closest('.icon-btn[aria-label="More options"]')) {
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

watch(
  () => artwork.value?._id,
  () => {
    selectedImageIndex.value = 0
    showAllImages.value = false
  },
  { immediate: true },
)
</script>

<template>
  <div class="viewer-card">
    <div v-if="imageList.length > 0" class="image-stack" :class="{ collapsed: !showAllImages && imageList.length > 1 }" :aria-label="`${artwork.title} pages`">
      <figure
        v-for="(image, index) in visibleImages"
        :key="`${artwork._id}-page-${index}`"
        :ref="(element) => setImageRef(element, index)"
        class="artwork-page"
      >
        <span v-if="imageList.length > 1" class="page-counter">{{ index + 1 }} / {{ imageList.length }}</span>
        <img
          class="img-fluid w-100 page-image"
          :src="image"
          :alt="imageList.length > 1 ? `${artwork.title} page ${index + 1}` : artwork.title"
          :loading="index === 0 ? 'eager' : 'lazy'"
          decoding="async"
        />
      </figure>
      <div class="viewer-actions">
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
          <div v-if="showMoreMenu" class="more-dropdown">
            <button @click="handleCopyLink">Copy link</button>
            <button @click="handleDownload">Download</button>
            <button disabled>Report</button>
          </div>
        </div>
      </div>
      <button
        v-if="imageList.length > 1 && !showAllImages"
        type="button"
        class="show-all-button"
        @click="revealAllImages"
      >
        Show all
        <span>{{ imageList.length }} images</span>
      </button>
    </div>
    <div v-else class="empty-viewer">
      <i class="fa-regular fa-image" aria-hidden="true"></i>
      <span>No image available</span>
    </div>

    <div v-if="imageList.length > 1 && showAllImages" class="d-grid gap-2 mt-3">
      <div class="d-flex align-items-center justify-content-between">
        <p class="small text-secondary mb-0">Jump to image {{ selectedImageIndex + 1 }} / {{ imageList.length }}</p>
      </div>
      <div class="thumbnail-strip">
        <button
          v-for="(image, index) in imageList"
          :key="`${artwork._id}-thumb-${index}`"
          type="button"
          class="thumb-button"
          :class="{ active: selectedImageIndex === index }"
          :aria-label="`Open image ${index + 1}`"
          @click="selectImage(index)"
        >
          <img :src="image" :alt="`${artwork.title} thumbnail ${index + 1}`" loading="lazy" />
        </button>
      </div>
    </div>

    <div v-if="showToast" class="toast-notification">{{ toastMessage }}</div>
  </div>
</template>

<style scoped>
.viewer-card {
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.image-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
}

.image-stack.collapsed {
  padding-bottom: 5.5rem;
}

.artwork-page {
  width: 100%;
  margin: 0;
  position: relative;
  display: flex;
  justify-content: center;
  scroll-margin-top: 88px;
}

.page-image {
  max-width: 100%;
  max-height: none;
  object-fit: contain;
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 6px;
  cursor: zoom-in;
}

.page-counter {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.62);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.32rem 0.55rem;
  pointer-events: none;
}

.empty-viewer {
  min-height: 320px;
  border: 1px dashed var(--line);
  border-radius: 6px;
  background: var(--surface-alt);
  color: var(--muted);
  display: grid;
  place-items: center;
  gap: 0.5rem;
  align-content: center;
}

.empty-viewer i {
  font-size: 1.8rem;
}

.show-all-button {
  position: absolute;
  left: 50%;
  bottom: 3.25rem;
  transform: translateX(-50%);
  min-width: 168px;
  border: 0;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.9);
  color: #fff;
  font-weight: 700;
  font-size: 0.88rem;
  line-height: 1.1;
  padding: 0.72rem 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.24);
  cursor: pointer;
  z-index: 2;
}

.show-all-button:hover {
  background: rgba(17, 24, 39, 1);
}

.show-all-button span {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.72);
}

.viewer-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1rem 0.75rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.55));
  border-bottom: none;
  margin-bottom: 0;
  z-index: 3;
}

.image-stack .viewer-actions .icon-btn {
  color: #fff;
  background: transparent;
  border-color: transparent;
}

.image-stack .viewer-actions .icon-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.15);
}

.image-stack .viewer-actions .icon-btn.active {
  color: #fff;
  background: #f91880;
  border-color: #f91880;
}

.icon-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid transparent;
  background: var(--surface-alt);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) {
  background: var(--line);
}

.icon-btn.active {
  color: var(--surface);
  background: #f91880; /* Consistent with caption */
  border-color: #f91880;
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.thumbnail-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.thumb-button {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0;
  background: var(--surface-alt);
  overflow: hidden;
  transition: border-color 0.2s;
}

.thumb-button img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.thumb-button.active {
  border-color: var(--accent);
}

.more-btn-wrapper {
  position: relative;
}

.more-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 4px;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 10;
}

.more-dropdown button {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 0.85rem;
  text-align: left;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.more-dropdown button:hover:not(:disabled) {
  background: var(--surface-alt);
  color: var(--brand);
}

.more-dropdown button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toast-notification {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: #f1f5f9;
  padding: 10px 24px;
  border-radius: 999px;
  font-size: 0.9rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
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

@media (max-width: 640px) {
  .image-stack {
    gap: 8px;
  }

  .page-image {
    border-radius: 4px;
  }

  .viewer-actions {
    gap: 0.75rem;
    padding: 1.25rem 0.75rem 0.5rem;
  }

  .thumbnail-strip {
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  }
}
</style>
