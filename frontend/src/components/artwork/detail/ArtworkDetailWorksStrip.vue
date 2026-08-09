<script setup>
import { useLikeStore } from '@/stores/like.store.js'
import { useAuthStore } from '@/stores/auth.store.js'
import { useRouter } from 'vue-router'

defineProps({
  works: { type: Array, default: () => [] },
})

const likeStore = useLikeStore()
const authStore = useAuthStore()
const router = useRouter()

function isLiked(item) {
  if (likeStore.statusByArtwork[item._id] !== undefined) {
    return likeStore.getLikeStatus(item._id)
  }
  return Boolean(item.isLiked)
}

async function handleLike(item) {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (likeStore.isTogglingLike(item._id)) return

  const previousStatus = isLiked(item)
  const nextStatus = !previousStatus

  if (likeStore.statusByArtwork[item._id] === undefined) {
    likeStore.statusByArtwork[item._id] = previousStatus
  }
  likeStore.statusByArtwork[item._id] = nextStatus

  try {
    await likeStore.toggleLikeByArtwork(item._id)
  } catch {
    likeStore.statusByArtwork[item._id] = previousStatus
  }
}
</script>

<template>
  <section v-if="works.length" class="strip-shell">
    <div class="strip">
      <router-link v-for="item in works" :key="item._id" :to="`/artworks/${item._id}`" class="strip-item" :title="item.title">
        <img v-if="item.images?.[0]" :src="item.images[0]" :alt="item.title" loading="lazy" />
        <button class="heart" @click.stop.prevent="handleLike(item)" aria-label="Toggle like">
          <i :class="isLiked(item) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
        </button>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.strip {
  display: flex;
  gap: 0.65rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.strip-item {
  position: relative;
  flex: 0 0 auto;
  width: 84px;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--surface);
}

.strip-item img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  display: block;
}

.heart {
  position: absolute;
  right: 0.45rem;
  bottom: 0.4rem;
  width: 1.9rem;
  height: 1.9rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  color: var(--text);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s ease;
}

.heart i {
  transition: color 0.2s ease, transform 0.2s ease;
}

.heart:has(i.fa-solid) {
  color: #fa577a;
}
</style>
