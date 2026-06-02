<script setup>
const DEFAULT_PROFILE_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const props = defineProps({
  users: {
    type: Array,
    default: () => [],
  },
  isAuthenticated: {
    type: Boolean,
    default: false,
  },
  isFollowingUser: {
    type: Function,
    required: true,
  },
  isTogglingFollow: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['toggle-follow'])

function getUserLabel(item) {
  return item.displayName || item.username || 'Unknown user'
}

function getUserHandle(item) {
  if (!item.username) {
    return '@member'
  }
  return `@${item.username}`
}

function profileLink(userId) {
  return userId ? `/account?user=${userId}` : '/account'
}

function profileAvatar(item) {
  return item?.avatar || DEFAULT_PROFILE_AVATAR
}

function handleAvatarError(event) {
  if (event.target?.src !== DEFAULT_PROFILE_AVATAR) {
    event.target.src = DEFAULT_PROFILE_AVATAR
  }
}
</script>

<template>
  <section class="recommend-users">
    <header class="section-head">
      <div>
        <h3>Recommended users</h3>
        <span class="head-note">Artists you may want to follow</span>
      </div>
      <router-link to="/account" class="head-link">Profile</router-link>
    </header>

    <p v-if="!users.length" class="empty-state mb-0">No recommended users available yet.</p>

    <div v-else class="user-grid">
      <article v-for="item in users" :key="item._id" class="user-card">
        <router-link :to="profileLink(item._id)" class="user-main-link">
          <img class="avatar avatar--sm user-avatar" :src="profileAvatar(item)" :alt="getUserLabel(item)" @error="handleAvatarError" />
          <div class="user-meta">
            <strong>{{ getUserLabel(item) }}</strong>
            <small>{{ getUserHandle(item) }}</small>
            <span class="user-stats">{{ item.artworkCount || 0 }} works</span>
          </div>
        </router-link>

        <button
          v-if="isAuthenticated"
          type="button"
          class="follow-btn"
          :class="isFollowingUser(item._id) ? 'following' : 'not-following'"
          :disabled="isTogglingFollow(item._id)"
          :aria-label="isFollowingUser(item._id) ? 'Unfollow user' : 'Follow user'"
          @click="emit('toggle-follow', item._id)"
        >
          {{ isFollowingUser(item._id) ? 'Following' : 'Follow' }}
        </button>
        <router-link
          v-else
          to="/login"
          class="follow-btn not-following text-decoration-none"
          aria-label="Go to login to follow"
        >
          Follow
        </router-link>
      </article>
    </div>
  </section>
</template>

<style scoped>
.recommend-users {
  display: grid;
  gap: 0.75rem;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  padding: 1rem;
  max-height: calc(100vh - 1rem);
  overflow: auto;
}

.section-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.65rem;
}

.section-head h3 {
  margin: 0;
  font-size: 1rem;
}

.head-note {
  color: var(--muted);
  font-size: 0.8rem;
}

.head-link {
  text-decoration: none;
  color: var(--accent);
  font-size: 0.84rem;
  font-weight: 700;
}

.empty-state {
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 0.9rem;
  color: var(--muted);
  background: var(--surface);
}

.user-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
}

.user-card {
  border-radius: 14px;
  padding: 0.75rem;
  display: grid;
  gap: 0.65rem;
  background: var(--surface-alt);
}

.user-main-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.user-meta {
  display: grid;
  min-width: 0;
}

.user-meta strong {
  font-size: 0.9rem;
  color: var(--brand);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta small {
  font-size: 0.77rem;
  color: var(--muted);
}

.user-stats {
  font-size: 0.75rem;
  color: var(--muted);
}

.follow-btn {
  border-radius: 999px;
  font-size: 0.77rem;
  font-weight: 700;
  padding: 0.28rem 0.75rem;
  justify-self: start;
}

.follow-btn.not-following {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
}

.follow-btn.following {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
}

@media (max-width: 1120px) {
  .recommend-users {
    padding: 0.9rem;
  }
}
</style>
