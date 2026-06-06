<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLikeStore } from '../../stores/like.store'
import { useAuthStore } from '../../stores/auth.store'

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

  try {
    if (likeStore.statusByArtwork[props.item._id] === undefined) {
       likeStore.statusByArtwork[props.item._id] = Boolean(props.item.isLiked)
    }
    await likeStore.toggleLikeByArtwork(props.item._id)
  } catch (error) {
    console.error('Failed to toggle like:', error)
  }
}

function getImage(item) {
  if (!item) return ''
  if (item.image) return item.image
  if (Array.isArray(item.images) && item.images.length > 0) return item.images[0]
  if (typeof item.images === 'string' && item.images) return item.images
  return ''
}

function getImageCount(item) {
  if (Array.isArray(item?.images)) return item.images.length
  return 0
}
</script>

<template>
  <article class="artwork-card">
    <router-link :to="`/artworks/${item._id}`" class="card-cover-link">
      <img
        v-if="getImage(item)"
        :src="getImage(item)"
        :alt="item.title"
        loading="lazy"
      />
      <div v-else class="card-placeholder"></div>

      <!-- Multi-image badge -->
      <span v-if="getImageCount(item) > 1" class="badge-count">
        <i class="fa-regular fa-clone"></i> {{ getImageCount(item) }}
      </span>

      <!-- Like button -->
      <button class="btn-like" :class="{ 'is-liked': isLiked }" aria-label="Like" @click.prevent="handleLike" :disabled="isToggling">
        <i :class="isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
      </button>
    </router-link>

    <div class="card-meta">
      <router-link :to="`/artworks/${item._id}`" class="card-title">
        {{ item.title }}
      </router-link>
      <router-link
        v-if="item.user?._id"
        :to="`/account?user=${item.user._id}`"
        class="card-author"
      >
        <img
          :src="item.user?.avatar || 'https://s.pximg.net/common/images/no_profile.png'"
          class="author-avatar"
          :alt="item.user?.displayName || item.user?.username"
          @error="(e) => (e.target.src = 'https://s.pximg.net/common/images/no_profile.png')"
        />
        <span>{{ item.user?.displayName || item.user?.username }}</span>
      </router-link>
    </div>
  </article>
</template>

<style scoped>
.artwork-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

/* ─── Thumbnail link ─── */
.card-cover-link {
  display: block;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-alt);
  text-decoration: none;
}

.card-cover-link img {
  width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
  object-fit: cover;
  display: block;
}

.card-cover-link::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.08);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
  border-radius: inherit;
}

.card-cover-link:hover::after {
  opacity: 1;
}

/* Placeholder when no image */
.card-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, var(--surface-alt), var(--surface));
}

/* Badges / overlays */
.badge-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-like {
  position: absolute;
  right: 0.45rem;
  bottom: 0.45rem;
  width: 1.95rem;
  height: 1.95rem;
  border-radius: 999px;
  border: none;
  background: var(--surface);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s, color 0.15s;
  box-shadow: var(--shadow-md);
  font-size: 0.88rem;
}

.btn-like:hover {
  transform: scale(1.05);
  background: var(--surface);
}

.btn-like.is-liked {
  color: #ef4444;
}

/* ─── Meta (title + author) ─── */
.card-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--brand);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.35;
}

.card-title:hover {
  text-decoration: underline;
}

.card-author {
  display: flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  color: var(--muted);
  font-size: 0.78rem;
  min-width: 0;
}

.card-author:hover {
  color: var(--accent);
}

.author-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--surface-alt);
}

.card-author span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
