<script setup>
const emit = defineEmits(['toggle-follow'])

defineProps({
  displayAuthor: { type: String, default: 'Unknown artist' },
  artistId: { type: String, default: '' },
  isOwnArtist: { type: Boolean, default: false },
  isFollowing: { type: Boolean, default: false },
  followLoading: { type: Boolean, default: false },
})
</script>

<template>
  <section class="author-row">
    <div class="d-flex align-items-center gap-2">
      <span class="avatar-dot" aria-hidden="true"></span>
      <router-link v-if="artistId" :to="`/account?user=${artistId}`" class="author-name">
        {{ displayAuthor }}
      </router-link>
      <span v-else class="author-name">{{ displayAuthor }}</span>
    </div>

    <div class="d-flex align-items-center gap-2">
      <button
        v-if="!isOwnArtist"
        type="button"
        class="btn btn-sm author-follow"
        :class="isFollowing ? 'btn-outline-secondary' : 'btn-primary'"
        :disabled="followLoading"
        :aria-label="isFollowing ? 'Unfollow artist' : 'Follow artist'"
        @click="emit('toggle-follow')"
      >
        {{ isFollowing ? 'Following' : 'Follow' }}
      </button>
      <router-link v-if="artistId" :to="`/account?user=${artistId}`" class="view-all">
        View all works
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.author-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.25rem 0;
}

.avatar-dot {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 999px;
  display: inline-block;
  background: linear-gradient(135deg, #ffb3b3, #ffd7a8);
}

.author-name {
  font-weight: 700;
  text-decoration: none;
  color: #0f172a;
}

.author-name:hover {
  text-decoration: underline;
}

.view-all {
  font-size: 0.85rem;
  text-decoration: none;
}
</style>
