<script setup>
import { computed, toRefs } from 'vue'

const emit = defineEmits(['toggle-like', 'toggle-bookmark'])

const props = defineProps({
  artwork: { type: Object, required: true },
  uploadedAtLabel: { type: String, default: '' },
  isLiked: { type: Boolean, default: false },
  isBookmarked: { type: Boolean, default: false },
  likeLoading: { type: Boolean, default: false },
  bookmarkLoading: { type: Boolean, default: false },
  likeError: { type: String, default: '' },
  bookmarkError: { type: String, default: '' },
})

const { artwork } = toRefs(props)

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0)
}

const tagList = computed(() => (Array.isArray(artwork.value?.tags) ? artwork.value.tags : []))
</script>

<template>
  <figcaption class="caption-card d-grid gap-2">
    <h1 class="h4 mb-0 title">{{ artwork.title }}</h1>

    <div v-if="tagList.length" class="tag-row">
      <router-link
        v-for="tag in tagList"
        :key="tag._id || tag.name"
        :to="`/tags/${encodeURIComponent(tag.name)}`"
        class="tag-link"
      >
        #{{ tag.name }}
      </router-link>
    </div>

    <div class="pixiv-stats text-secondary small">
      <span class="stat-inline"><i class="fa-regular fa-eye" aria-hidden="true"></i> {{ formatNumber(artwork.viewCount) }}</span>
      <button
        type="button"
        class="stat-inline stat-button"
        :class="{ active: isLiked }"
        :disabled="likeLoading"
        :aria-label="isLiked ? 'Remove like' : 'Add like'"
        @click="emit('toggle-like')"
      >
        <i :class="[isLiked ? 'fa-solid' : 'fa-regular', 'fa-heart']" aria-hidden="true"></i>
        {{ formatNumber(artwork.likeCount) }}
      </button>
      <button
        type="button"
        class="stat-inline stat-button"
        :class="{ active: isBookmarked }"
        :disabled="bookmarkLoading"
        :aria-label="isBookmarked ? 'Remove bookmark' : 'Add bookmark'"
        @click="emit('toggle-bookmark')"
      >
        <i :class="[isBookmarked ? 'fa-solid' : 'fa-regular', 'fa-bookmark']" aria-hidden="true"></i>
        {{ formatNumber(artwork.bookmarkCount) }}
      </button>
      <span class="stat-inline"><i class="fa-regular fa-comment" aria-hidden="true"></i> {{ formatNumber(artwork.commentCount) }}</span>
    </div>

    <p v-if="uploadedAtLabel" class="text-secondary small mb-0">{{ uploadedAtLabel }}</p>
    <p class="text-secondary small mb-0">{{ artwork.type }} · {{ artwork.ageRating }}</p>

    <p v-if="artwork.description" class="description mb-0">{{ artwork.description }}</p>

    <p v-if="likeError" class="small text-danger mb-0">{{ likeError }}</p>
    <p v-if="bookmarkError" class="small text-danger mb-0">{{ bookmarkError }}</p>
  </figcaption>
</template>

<style scoped>
.caption-card {
  background: transparent;
  padding: 0;
}

.title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.4;
  color: #1a1a1a;
}

.description {
  color: #1a1a1a;
  line-height: 1.6;
  white-space: pre-wrap;
  font-size: 0.95rem;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.tag-link {
  text-decoration: none;
  color: #3b82f6;
  font-weight: 400;
  font-size: 0.875rem;
}

.tag-link:hover {
  text-decoration: underline;
}

.pixiv-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-top: 0.5rem;
  color: #5c5c5c;
}

.stat-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
}

.stat-button {
  border: 0;
  background: transparent;
  padding: 0;
  color: inherit;
  cursor: pointer;
  transition: color 0.2s;
}

.stat-button:hover {
  color: #1a1a1a;
}

.stat-button.active {
  color: #f91880; /* Twitter/Pixiv like pink-red for likes */
}
</style>
