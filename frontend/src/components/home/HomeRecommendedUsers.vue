<script setup>
import { computed } from 'vue'
import SkeletonLoader from '../common/SkeletonLoader.vue'

const DEFAULT_PROFILE_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const props = defineProps({
  users: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
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

const processedUsers = computed(() =>
  props.users.map(item => ({
    ...item,
    _profileLink: profileLink(item._id),
    _profileAvatar: profileAvatar(item),
    _label: getUserLabel(item),
    _handle: getUserHandle(item),
    _isFollowing: props.isFollowingUser(item._id),
    _isToggling: props.isTogglingFollow(item._id),
  }))
)

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
        <h3>{{ $t('home.recommendedUsers') }}</h3>
      </div>
    </header>

    <SkeletonLoader v-if="loading" type="user-card" :count="4" />

    <p v-else-if="!users.length" class="empty-state mb-0">No recommended users available yet.</p>

    <div v-else class="user-grid">
      <article v-for="item in processedUsers" :key="item._id" class="user-card">
        <router-link :to="item._profileLink" class="user-main-link">
          <img class="avatar avatar--sm user-avatar" :src="item._profileAvatar" :alt="item._label" @error="handleAvatarError" />
          <div class="user-meta">
            <strong>{{ item._label }}</strong>
            <small>{{ item._handle }}</small>
            <span class="user-stats">{{ item.artworkCount || 0 }} works</span>
          </div>
        </router-link>

        <button
          v-if="isAuthenticated"
          type="button"
          class="follow-btn"
          :class="item._isFollowing ? 'following' : 'not-following'"
          :disabled="item._isToggling"
          :aria-label="item._isFollowing ? 'Unfollow user' : 'Follow user'"
          @click="emit('toggle-follow', item._id)"
        >
          {{ item._isFollowing ? 'Following' : 'Follow' }}
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
  overflow-y: auto;
  scrollbar-width: none;
}

.recommend-users::-webkit-scrollbar {
  display: none;
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
