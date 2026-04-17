<script setup>
import { computed, toRefs } from 'vue'

const emit = defineEmits(['toggle-follow'])

const props = defineProps({
  displayAuthor: { type: String, default: 'Unknown artist' },
  artistId: { type: String, default: '' },
  isOwnArtist: { type: Boolean, default: false },
  isFollowing: { type: Boolean, default: false },
  followLoading: { type: Boolean, default: false },
  followError: { type: String, default: '' },
  artistFollowersCount: { type: Number, default: 0 },
  artistFollowingCount: { type: Number, default: 0 },
  sameAuthorWorks: { type: Array, default: () => [] },
})

const { sameAuthorWorks } = toRefs(props)

const hasSameAuthorWorks = computed(() => Array.isArray(sameAuthorWorks.value) && sameAuthorWorks.value.length > 0)
</script>

<template>
  <aside class="right-col d-grid gap-3">
    <section class="sidebar-card d-grid gap-2">
      <div class="d-flex align-items-center justify-content-between gap-2">
        <div class="d-flex align-items-center gap-2">
          <span class="avatar-dot" aria-hidden="true"></span>
          <div class="d-grid">
            <router-link v-if="artistId" :to="`/account?user=${artistId}`" class="fw-semibold text-decoration-none text-dark">
              {{ displayAuthor }}
            </router-link>
            <span v-else class="fw-semibold">{{ displayAuthor }}</span>
          </div>
        </div>
      </div>

      <button
        v-if="!isOwnArtist"
        type="button"
        class="btn btn-sm w-100"
        :class="isFollowing ? 'btn-outline-secondary' : 'btn-primary'"
        :disabled="followLoading"
        :aria-label="isFollowing ? 'Unfollow artist' : 'Follow artist'"
        @click="emit('toggle-follow')"
      >
        {{ isFollowing ? 'Following' : 'Follow' }}
      </button>

      <div class="d-flex align-items-center justify-content-between">
        <p class="mb-0 text-secondary x-small">Followers {{ artistFollowersCount }} · Following {{ artistFollowingCount }}</p>
        <router-link v-if="artistId" :to="`/account?user=${artistId}`" class="small text-decoration-none">
          View all works
        </router-link>
      </div>

      <p v-if="followError" class="small text-danger mb-0">{{ followError }}</p>
    </section>

    <section v-if="hasSameAuthorWorks" class="sidebar-card d-grid gap-2">
      <header class="d-flex align-items-center justify-content-between">
        <h2 class="h6 mb-0">More works</h2>
        <router-link v-if="artistId" :to="`/account?user=${artistId}`" class="small text-decoration-none">View all</router-link>
      </header>
      <div class="mini-grid">
        <router-link
          v-for="item in sameAuthorWorks"
          :key="item._id"
          :to="`/artworks/${item._id}`"
          class="mini-cover"
          :aria-label="item.title"
          :title="item.title"
        >
          <img v-if="item.images?.[0]" :src="item.images[0]" :alt="item.title" loading="lazy" />
        </router-link>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.right-col {
  min-width: 0;
  align-self: start;
}

.sidebar-card {
  background: #fff;
  border-radius: 4px; /* Flatter look */
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
}

.avatar-dot {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-block;
  background: linear-gradient(135deg, #ffb3b3, #ffd7a8);
}

.x-small {
  font-size: 11px;
  color: #5c5c5c;
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.mini-cover {
  display: block;
  border-radius: 2px;
  overflow: hidden;
  background: #f8fafc;
}

.mini-cover img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  display: block;
  transition: opacity 0.2s;
}

.mini-cover img:hover {
  opacity: 0.8;
}

@media (max-width: 1000px) {
  .sidebar-card {
    position: static;
    border: none;
    border-bottom: 1px solid #e2e8f0;
    border-radius: 0;
    padding: 1rem 0;
  }
}
</style>
