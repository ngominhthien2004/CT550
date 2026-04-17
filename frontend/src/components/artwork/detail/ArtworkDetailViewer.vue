<script setup>
import { computed, ref, toRefs, watch } from 'vue'

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

const imageList = computed(() => {
  if (!Array.isArray(artwork.value?.images)) {
    return []
  }

  return artwork.value.images.filter((item) => typeof item === 'string' && item.trim())
})

const mainImage = computed(() => imageList.value[selectedImageIndex.value] || '')

function selectImage(index) {
  if (index < 0 || index >= imageList.value.length) {
    return
  }
  selectedImageIndex.value = index
}

watch(
  () => artwork.value?._id,
  () => {
    selectedImageIndex.value = 0
  },
  { immediate: true },
)
</script>

<template>
  <div class="viewer-card">
    <img v-if="mainImage" class="img-fluid rounded-3 border w-100 main-image" :src="mainImage" :alt="artwork.title" loading="lazy" />

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
      <button type="button" class="icon-btn" aria-label="Share" disabled>
        <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>
      </button>
      <button type="button" class="icon-btn" aria-label="More options" disabled>
        <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
      </button>
    </div>

    <div v-if="imageList.length > 1" class="d-grid gap-2 mt-3">
      <div class="d-flex align-items-center justify-content-between">
        <p class="small text-secondary mb-0">Image {{ selectedImageIndex + 1 }} / {{ imageList.length }}</p>
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
  </div>
</template>

<style scoped>
.viewer-card {
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.main-image {
  max-width: 100%;
  max-height: 85vh; /* Larger limit like Pixiv */
  object-fit: contain; /* Avoid cropping artwork */
  background: #f0f0f0;
  cursor: zoom-in;
}

.viewer-actions {
  display: flex;
  justify-content: center; /* Center like Pixiv for focal actions */
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 0.5rem;
}

.icon-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid transparent;
  background: #f0f2f5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1a1a1a;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) {
  background: #e4e6eb;
}

.icon-btn.active {
  color: #fff;
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
  background: #f8fafc;
  overflow: hidden;
  transition: border-color 0.2s;
}

.thumb-button img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.thumb-button.active {
  border-color: #3b82f6;
}
</style>
