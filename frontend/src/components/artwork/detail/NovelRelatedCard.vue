<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLikeStore } from '../../../stores/like.store'
import { useAuthStore } from '../../../stores/auth.store'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const likeStore = useLikeStore()
const authStore = useAuthStore()

const isLiked = computed(() => {
  if (likeStore.statusByArtwork[props.item._id] !== undefined) {
    return likeStore.getLikeStatus(props.item._id)
  }
  return Boolean(props.item.isLiked)
})

const isToggling = computed(() => likeStore.isTogglingLike(props.item._id))

async function handleLike(e) {
  e.preventDefault()
  e.stopPropagation()

  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (isToggling.value) return

  const previousStatus = isLiked.value
  const nextStatus = !previousStatus

  // Optimistic: flip immediately
  if (likeStore.statusByArtwork[props.item._id] === undefined) {
    likeStore.statusByArtwork[props.item._id] = previousStatus
  }
  likeStore.statusByArtwork[props.item._id] = nextStatus

  try {
    await likeStore.toggleLikeByArtwork(props.item._id)
  } catch {
    // Rollback on failure
    likeStore.statusByArtwork[props.item._id] = previousStatus
  }
}

const coverUrl = computed(() => {
  const i = props.item
  if (i?.image) return i.image
  if (Array.isArray(i?.images) && i.images.length > 0) return i.images[0]
  return ''
})

const rawWordCount = computed(() => {
  let count = Number(props.item?.wordCount || 0)
  if (!count) {
    const text = String(props.item?.novelContent || props.item?.description || '')
    if (text.trim()) count = text.split(/\s+/).filter(Boolean).length
  }
  return count
})

const wordCount = computed(() => rawWordCount.value ? rawWordCount.value.toLocaleString() : '0')

const readingTime = computed(() => {
  if (!rawWordCount.value) return ''
  const minutes = Math.max(1, Math.ceil(rawWordCount.value / 400))
  return `${minutes} mins`
})

const excerpt = computed(() => {
  const text = String(props.item?.description || props.item?.novelContent || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length > 120 ? `${text.slice(0, 120).trimEnd()}...` : text
})

const visibleTags = computed(() => {
  const tags = props.item?.tags
  if (!tags?.length) return []
  return tags.slice(0, 3).map((tag) => {
    const label = String(tag?.label || tag?.name || '').replace(/^#/, '').trim()
    return { label, link: { path: '/search', query: { type: 'novel', q: label } } }
  }).filter((t) => t.label)
})
</script>

<template>
  <article class="nrc">
    <router-link :to="`/novels/${item._id}`" class="nrc-thumb">
      <img v-if="coverUrl" :src="coverUrl" :alt="item.title" loading="lazy" />
      <div v-else class="nrc-fallback">
        <i class="fa-solid fa-book-open" aria-hidden="true"></i>
      </div>
    </router-link>

    <div class="nrc-body">
      <router-link :to="`/novels/${item._id}`" class="nrc-title">{{ item.title || 'Untitled novel' }}</router-link>
      <span class="nrc-author">{{ item.authorName || item.user?.displayName || item.user?.username || 'Unknown' }}</span>
      <span class="nrc-stats">{{ wordCount }} character(s) {{ readingTime }}</span>
      <p v-if="visibleTags.length" class="nrc-tags">
        <router-link
          v-for="tag in visibleTags"
          :key="tag.label"
          :to="tag.link"
          class="nrc-tag"
        >#{{ tag.label }}</router-link>
      </p>
      <p v-if="excerpt" class="nrc-excerpt">{{ excerpt }}</p>
    </div>

    <button
      type="button"
      class="nrc-heart"
      :class="{ 'is-active': isLiked }"
      :aria-label="isLiked ? $t('artwork.unlike') : $t('artwork.like')"
      :disabled="isToggling"
      @click="handleLike"
    >
      <i :class="isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'" aria-hidden="true"></i>
    </button>
  </article>
</template>

<style scoped>
.nrc {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  gap: 0 0.75rem;
  align-items: start;
}

.nrc-thumb {
  display: block;
  width: 88px;
  height: 117px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-alt);
  flex-shrink: 0;
  text-decoration: none;
}

.nrc-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.nrc-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--muted);
  font-size: 1.4rem;
  background: linear-gradient(135deg, rgba(22, 149, 240, 0.08), rgba(148, 185, 109, 0.16));
}

.nrc-body {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
}

.nrc-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.35;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nrc-title:hover {
  color: var(--accent);
}

.nrc-author {
  font-size: 0.76rem;
  color: var(--muted);
}

.nrc-stats {
  font-size: 0.73rem;
  color: var(--muted);
}

.nrc-tags {
  margin: 0.18rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
}

.nrc-tag {
  color: #0078d4;
  text-decoration: none;
  font-size: 0.76rem;
}

.nrc-tag:hover {
  text-decoration: underline;
}

.nrc-excerpt {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: var(--muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nrc-heart {
  appearance: none;
  background: transparent;
  border: none;
  padding: 0;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  padding-top: 0.1rem;
  color: var(--muted);
  font-size: 0.95rem;
  transition: color 0.15s, transform 0.15s;
}

.nrc:hover .nrc-heart {
  color: var(--accent);
}

.nrc-heart:hover {
  color: var(--accent);
  transform: scale(1.08);
}

.nrc-heart.is-active {
  color: #ef4444;
}

.nrc:hover .nrc-heart.is-active,
.nrc-heart.is-active:hover {
  color: #ef4444;
}

.nrc-heart:disabled {
  opacity: 0.6;
  cursor: wait;
}

@media (max-width: 600px) {
  .nrc {
    grid-template-columns: 68px minmax(0, 1fr) auto;
    gap: 0 0.55rem;
  }
  .nrc-thumb {
    width: 68px;
    height: 90px;
  }
}
</style>
