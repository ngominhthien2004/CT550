<script setup>
import { ref, computed, toRefs } from 'vue'

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

const showFullDescription = ref(false)

function toggleDescription() {
  showFullDescription.value = !showFullDescription.value
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0)
}

const tagList = computed(() => (Array.isArray(artwork.value?.tags) ? artwork.value.tags : []))

const displayNumbers = computed(() => {
  const fmt = (v) => new Intl.NumberFormat().format(Number(v) || 0)
  const a = artwork.value || {}
  return {
    viewCount: fmt(a.viewCount),
    likeCount: fmt(a.likeCount),
    bookmarkCount: fmt(a.bookmarkCount),
    commentCount: fmt(a.commentCount),
  }
})

// Novel synopsis truncation
const truncatedDescription = computed(() => {
  const desc = artwork.value?.description || ''
  if (!showFullDescription.value && desc.length > 200) {
    return desc.substring(0, 200)
  }
  return desc
})

const isDescriptionLong = computed(() => (artwork.value?.description || '').length > 200)
</script>

<template>
  <figcaption class="caption-card d-grid gap-2">
    <h1 class="h4 mb-0 title">{{ artwork.title }}</h1>

    <!-- Unified description for all artwork types -->
    <p v-if="artwork.description" class="description mb-0">
      {{ truncatedDescription }}<span v-if="isDescriptionLong" class="read-more-link" role="button" tabindex="0" @click="toggleDescription">{{ showFullDescription ? 'Show less' : '... Read more' }}</span>
    </p>

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

    <div class="stats-row text-secondary small">
      <span class="stat-inline"><i class="fa-regular fa-eye" aria-hidden="true"></i> {{ displayNumbers.viewCount }}</span>
      <button
        type="button"
        class="stat-inline stat-button"
        :class="{ active: isLiked }"
        :disabled="likeLoading"
        :aria-label="isLiked ? 'Remove like' : 'Add like'"
        @click="emit('toggle-like')"
      >
        <i :class="[isLiked ? 'fa-solid' : 'fa-regular', 'fa-heart']" aria-hidden="true"></i>
        {{ displayNumbers.likeCount }}
      </button>
      <button
        type="button"
        class="stat-inline stat-button bookmark-btn"
        :class="{ active: isBookmarked }"
        :disabled="bookmarkLoading"
        :aria-label="isBookmarked ? 'Remove bookmark' : 'Add bookmark'"
        @click="emit('toggle-bookmark')"
      >
        <i :class="[isBookmarked ? 'fa-solid' : 'fa-regular', 'fa-bookmark']" aria-hidden="true"></i>
        {{ displayNumbers.bookmarkCount }}
      </button>
      <span class="stat-inline"><i class="fa-regular fa-comment" aria-hidden="true"></i> {{ displayNumbers.commentCount }}</span>
    </div>

    <p v-if="uploadedAtLabel" class="text-secondary small mb-0">{{ uploadedAtLabel }}</p>
    <p class="text-secondary small mb-0">{{ artwork.type }} · {{ artwork.ageRating }}</p>

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
  color: var(--brand);
}

.description {
  color: var(--text);
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
  color: var(--accent);
  font-weight: 400;
  font-size: 0.875rem;
}

.tag-link:hover {
  text-decoration: underline;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-top: 0.5rem;
  color: var(--muted);
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
  color: var(--text);
}

.stat-button.active {
  color: #f91880; /* Like accent */
}

.stat-button.active.bookmark-btn {
  color: #3b82f6; /* Bookmark accent */
}

.read-more-link {
  color: var(--accent);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.read-more-link:hover {
  text-decoration: underline;
}
</style>
