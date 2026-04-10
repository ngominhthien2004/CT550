<script setup>
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
</script>

<template>
  <section class="recommend-users">
    <header class="section-head">
      <h3>Recommended users</h3>
      <span class="head-note">Artists you may want to follow</span>
    </header>

    <p v-if="!users.length" class="empty-state mb-0">No recommended users available yet.</p>

    <div v-else class="user-grid">
      <article v-for="item in users" :key="item._id" class="user-card">
        <router-link :to="`/account?user=${item._id}`" class="user-main-link">
          <span class="user-avatar" aria-hidden="true">{{ (item.username || 'U').charAt(0).toUpperCase() }}</span>
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
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.65rem;
}

.section-head h3 {
  margin: 0;
  font-size: 1rem;
}

.head-note {
  color: #64748b;
  font-size: 0.8rem;
}

.empty-state {
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 0.9rem;
  color: var(--muted);
  background: #fff;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.user-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem;
  display: grid;
  gap: 0.65rem;
  background: #fff;
}

.user-main-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.user-avatar {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #bfdbfe, #93c5fd);
  color: #1e3a8a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.user-meta {
  display: grid;
  min-width: 0;
}

.user-meta strong {
  font-size: 0.9rem;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta small {
  font-size: 0.77rem;
  color: #64748b;
}

.user-stats {
  font-size: 0.75rem;
  color: #64748b;
}

.follow-btn {
  border-radius: 999px;
  font-size: 0.77rem;
  font-weight: 700;
  padding: 0.28rem 0.75rem;
  justify-self: start;
}

.follow-btn.not-following {
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: #fff;
}

.follow-btn.following {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
}

@media (max-width: 1024px) {
  .user-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .user-grid {
    grid-template-columns: 1fr;
  }
}
</style>
