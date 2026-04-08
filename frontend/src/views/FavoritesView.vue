<script setup>
import { onMounted } from 'vue'
import { useLikeStore } from '../stores/like.store'

const likeStore = useLikeStore()

const removeLatestLike = async () => {
  if (!likeStore.items.length) {
    likeStore.error = 'No favorite item available to delete'
    return
  }

  await likeStore.removeLike(likeStore.items[0]._id)
}

onMounted(() => {
  likeStore.fetchMyLikes()
})
</script>

<template>
  <section class="page d-grid gap-3">
    <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
      <h2 class="mb-0">My Favorite</h2>
      <button class="btn btn-outline-secondary btn-sm" @click="removeLatestLike">Delete latest</button>
    </div>

    <p v-if="likeStore.loading" class="text-secondary mb-0">Loading favorite works...</p>
    <p v-else-if="likeStore.error" class="text-danger mb-0">{{ likeStore.error }}</p>

    <div v-else-if="likeStore.items.length" class="row g-3">
      <article v-for="entry in likeStore.items" :key="entry._id" class="col-12 col-md-6 col-xl-4">
        <div class="card h-100 border-0 shadow-sm overflow-hidden">
          <img
            v-if="entry.artwork?.images?.[0]"
            class="card-img-top thumb"
            :src="entry.artwork.images[0]"
            :alt="entry.artwork.title"
            loading="lazy"
          />
          <div class="card-body d-grid gap-1">
            <router-link :to="`/artworks/${entry.artwork?._id}`" class="text-decoration-none fw-semibold text-dark">
              {{ entry.artwork?.title || 'Untitled artwork' }}
            </router-link>
            <p class="mb-0 text-secondary small">
              {{ entry.artwork?.type || 'illust' }} · {{ entry.artwork?.ageRating || 'all' }}
            </p>
            <p class="mb-0 text-secondary small">
              <i class="fa-regular fa-heart me-1" aria-hidden="true"></i>
              {{ entry.artwork?.likeCount || 0 }} likes
            </p>
          </div>
        </div>
      </article>
    </div>

    <p v-else class="text-secondary mb-0">No favorite works yet.</p>
  </section>
</template>

<style scoped>
.page {
  padding: 0.25rem 0;
}

.thumb {
  aspect-ratio: 4 / 3;
  object-fit: cover;
}
</style>