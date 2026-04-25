<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBookmarkStore } from '../../stores/bookmark.store'
import { useAuthStore } from '../../stores/auth.store'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const bookmarkStore = useBookmarkStore()
const authStore = useAuthStore()

const isBookmarked = computed(() => {
  if (bookmarkStore.statusByArtwork[props.item._id] !== undefined) {
    return bookmarkStore.getBookmarkStatus(props.item._id)
  }
  return Boolean(props.item.isBookmarked)
})

const isToggling = computed(() => bookmarkStore.isTogglingBookmark(props.item._id))

async function handleLike() {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (isToggling.value) return

  try {
    if (bookmarkStore.statusByArtwork[props.item._id] === undefined) {
       bookmarkStore.statusByArtwork[props.item._id] = Boolean(props.item.isBookmarked)
    }
    await bookmarkStore.toggleBookmarkByArtwork(props.item._id)
  } catch (error) {
    console.error('Failed to toggle bookmark:', error)
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
      <button class="btn-like" :class="{ 'is-liked': isBookmarked }" aria-label="Like" @click.prevent="handleLike" :disabled="isToggling">
        <i :class="isBookmarked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
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
  border-radius: 14px;
  overflow: hidden;
  background: #f3f4f6;
  text-decoration: none;
}

.card-cover-link img {
  width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
}

.card-cover-link:hover img {
  transform: scale(1.05);
}

/* Placeholder when no image */
.card-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, #e4e4e7, #f4f4f5);
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
  background: rgba(255, 255, 255, 0.92);
  color: #111827;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s, color 0.15s;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
  font-size: 0.88rem;
}

.btn-like:hover {
  transform: scale(1.05);
  background: #fff;
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
  color: #111827;
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
  color: #6b7280;
  font-size: 0.78rem;
  min-width: 0;
}

.card-author:hover {
  color: #0096fa;
}

.author-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: #d4d4d8;
}

.card-author span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
