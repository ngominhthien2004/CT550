<script setup>
import { computed, onMounted } from 'vue'
import { useFollowStore } from '../../stores/follow.store.js'
import { useAuthStore } from '../../stores/auth.store.js'

const DEFAULT_PROFILE_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const followStore = useFollowStore()
const authStore = useAuthStore()

/**
 * Backend returns Follow documents:
 *   { _id, follower, following: { _id, username, displayName, avatar }, createdAt }
 * So the actual user data is inside `.following`.
 */
const following = computed(() => {
  return (followStore.following || []).map((follow) => ({
    ...follow,
    ...follow.following,
    _followId: follow._id,
    _userId: follow.following?._id,
  }))
})

function avatarSrc(user) {
  return user?.avatar || DEFAULT_PROFILE_AVATAR
}

function label(user) {
  return user?.displayName || user?.username || 'Unknown'
}

function profileLink(user) {
  const userId = user._userId || user._id
  return `/account?user=${userId}`
}

function onAvatarError(event) {
  if (event.target?.src !== DEFAULT_PROFILE_AVATAR) {
    event.target.src = DEFAULT_PROFILE_AVATAR
  }
}

onMounted(() => {
  if (authStore.isAuthenticated && authStore.user?._id) {
    followStore.fetchFollowing(authStore.user._id)
  }
})
</script>

<template>
  <section v-if="following.length" class="following-strip">
    <div class="following-strip-inner">
      <router-link
        v-for="user in following"
        :key="user._followId"
        :to="profileLink(user)"
        class="following-strip-item"
      >
        <div class="following-strip-avatar-ring">
          <img
            :src="avatarSrc(user)"
            :alt="label(user)"
            class="following-strip-avatar"
            @error="onAvatarError"
          />
        </div>
        <span class="following-strip-name">{{ label(user) }}</span>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.following-strip {
  overflow-x: auto;
  scrollbar-width: none;
  padding: 0.5rem 0;
}

.following-strip::-webkit-scrollbar {
  display: none;
}

.following-strip-inner {
  display: flex;
  gap: 1rem;
  flex-wrap: nowrap;
  min-width: 0;
}

.following-strip-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
  width: 80px;
}

.following-strip-avatar-ring {
  width: 64px;
  height: 64px;
  border-radius: 9999px;
  background: var(--accent);
  padding: 2.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.following-strip-item:hover .following-strip-avatar-ring {
  transform: scale(1.08);
}

.following-strip-avatar {
  width: 58px;
  height: 58px;
  border-radius: 9999px;
  object-fit: cover;
  border: 2px solid var(--surface);
  background: var(--line);
}

.following-strip-name {
  font-size: 0.75rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
  text-align: center;
  line-height: 1.3;
}
</style>
