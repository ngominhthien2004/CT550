<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLikeStore } from '../../stores/like.store'
import { useAuthStore } from '../../stores/auth.store'
import R18BlurOverlay from '../common/R18BlurOverlay.vue'

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
  const previousCount = props.item.likeCount || 0
  const nextStatus = !previousStatus

  // Optimistic: flip immediately
  if (likeStore.statusByArtwork[props.item._id] === undefined) {
    likeStore.statusByArtwork[props.item._id] = previousStatus
  }
  likeStore.statusByArtwork[props.item._id] = nextStatus
  props.item.likeCount = Math.max(0, previousCount + (nextStatus ? 1 : -1))

  try {
    await likeStore.toggleLikeByArtwork(props.item._id)
  } catch (error) {
    // Rollback on failure
    likeStore.statusByArtwork[props.item._id] = previousStatus
    props.item.likeCount = previousCount
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
    <div class="card-cover-wrapper">
      <div v-if="item.isHidden" class="artwork-hidden-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        <span>{{ $t('artwork.hiddenByAdmin') }}</span>
      </div>
      <R18BlurOverlay :artwork="item" :showBadgeOnly="true">
        <router-link :to="`/artworks/${item._id}`" class="card-cover-link">
          <img
            v-if="getImage(item)"
            :src="getImage(item)"
            :alt="item.title"
            loading="lazy"
          />
          <div v-else class="card-placeholder"></div>
          <span v-if="getImageCount(item) > 1" class="badge-count">
            <i class="fa-regular fa-clone"></i> {{ getImageCount(item) }}
          </span>
        </router-link>
      </R18BlurOverlay>

      <router-link
        v-if="item.series"
        :to="`/series/${item.series}`"
        class="card-series-badge"
        :aria-label="$t('series.series')"
        :title="$t('series.series')"
        @click.stop
      >
        <span class="card-series-badge-text">{{ $t('series.series') }}</span>
      </router-link>

      <button type="button" class="btn-like" :class="{ 'is-active': isLiked }" :aria-label="$t('artwork.like')" @click.prevent="handleLike" :disabled="isToggling">
        <i :class="isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
      </button>
    </div>

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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

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

.card-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, var(--surface-alt), var(--surface));
}

.card-cover-wrapper {
  position: relative;
  /* Match the cover link’s rounded shape so absolutely positioned children
     (Series ribbon, R-18 badge, like button) are clipped to the cover boundary. */
  border-radius: 12px;
  overflow: hidden;
}

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

/* Triangle corner ribbon for "Series" pinned to the top-left of the cover.
   The badge lives inside .card-cover-wrapper, which has overflow:hidden and
   the same border-radius as the cover, so the ribbon is clipped by the cover
   boundary and cannot leak outside. */
.card-series-badge {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 5;
  width: 92px;
  height: 92px;
  background: linear-gradient(to bottom right, #facc15, #f59e0b);
  clip-path: polygon(0 0, 100% 0, 0 100%);
  text-decoration: none;
  pointer-events: auto;
  transition: filter 0.2s ease;
}

.card-series-badge:hover {
  filter: brightness(1.06);
}

.card-series-badge-text {
  position: absolute;
  top: 30px;
  left: 30px;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  transform: translate(-50%, -50%) rotate(-45deg);
  transform-origin: center center;
  white-space: nowrap;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
  text-decoration: none;
  pointer-events: none;
}

.card-series-badge:focus-visible {
  outline: 2px solid #f59e0b;
  outline-offset: 2px;
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

.btn-like.is-active {
  color: #ef4444;
}

.artwork-hidden-banner {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; color: #fff; font-size: 0.85rem; z-index: 2;
  border-radius: inherit;
}
.artwork-hidden-banner svg { opacity: 0.7; }

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
