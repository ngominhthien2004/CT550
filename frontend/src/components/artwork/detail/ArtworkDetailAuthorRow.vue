<script setup>
const emit = defineEmits(['toggle-follow'])

defineProps({
  displayAuthor: { type: String, default: 'Unknown artist' },
  artistId: { type: String, default: '' },
  artistAvatar: { type: String, default: 'https://s.pximg.net/common/images/no_profile.png' },
  isOwnArtist: { type: Boolean, default: false },
  isFollowing: { type: Boolean, default: false },
  followLoading: { type: Boolean, default: false },
})
</script>

<template>
  <section class="author-row">
    <div class="d-flex align-items-center gap-2">
      <img :src="artistAvatar" :alt="displayAuthor" class="avatar avatar--md" @error="(e) => e.target.src = 'https://s.pximg.net/common/images/no_profile.png'" />
      <router-link v-if="artistId" :to="`/account?user=${artistId}`" class="author-name">
        {{ displayAuthor }}
      </router-link>
      <span v-else class="author-name">{{ displayAuthor }}</span>
    </div>

    <div class="d-flex align-items-center gap-2">
      <button
        v-if="!isOwnArtist"
        type="button"
        class="btn btn-sm btn-follow"
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

.author-name {
  font-weight: 700;
  text-decoration: none;
  color: var(--brand);
}

.author-name:hover {
  text-decoration: underline;
}

.btn-follow {
  border-radius: 20px;
  padding: 0.35rem 1.25rem;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.view-all {
  font-size: 0.85rem;
  text-decoration: none;
}
</style>
