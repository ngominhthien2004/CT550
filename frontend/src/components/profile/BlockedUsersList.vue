<script setup>
import { ref, onMounted } from 'vue'
import { userApi } from '../../services/api'

const blockedUsers = ref([])
const loading = ref(true)
const error = ref('')
const unblockingId = ref('')

async function loadBlocked() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await userApi.getBlockedUsers()
    blockedUsers.value = data
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to load blocked users'
  } finally {
    loading.value = false
  }
}

async function handleUnblock(userId) {
  unblockingId.value = userId
  try {
    await userApi.unblock(userId)
    blockedUsers.value = blockedUsers.value.filter((b) => b.blocked?._id !== userId)
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to unblock user'
  } finally {
    unblockingId.value = ''
  }
}

onMounted(loadBlocked)
</script>

<template>
  <div class="blocked-list">
    <h2>Blocked Users</h2>
    <p v-if="loading" class="state-text">Loading blocked users...</p>
    <p v-else-if="error" class="state-text error">{{ error }}</p>
    <p v-else-if="blockedUsers.length === 0" class="state-text empty">No blocked users.</p>
    <div v-else class="user-list">
      <div v-for="item in blockedUsers" :key="item._id" class="user-row">
        <div class="user-info">
          <img
            :src="item.blocked?.avatar || 'https://s.pximg.net/common/images/no_profile.png'"
            :alt="item.blocked?.displayName || item.blocked?.username"
            class="avatar-sm"
          />
          <div>
            <strong>{{ item.blocked?.displayName || item.blocked?.username || 'Unknown' }}</strong>
            <span v-if="item.blocked?.username" class="username">@{{ item.blocked.username }}</span>
          </div>
        </div>
        <button type="button"
          class="unblock-btn"
          :disabled="unblockingId === item.blocked?._id"
          @click="handleUnblock(item.blocked?._id)"
        >
          {{ unblockingId === item.blocked?._id ? 'Unblocking...' : 'Unblock' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blocked-list {
  max-width: 640px;
  margin: 0 auto;
  padding: 1.5rem;
}
.blocked-list h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #1f2937;
}
.state-text {
  text-align: center;
  color: var(--muted);
  padding: 2rem;
}
.state-text.error {
  color: var(--danger, #dc2626);
}
.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.avatar-sm {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  object-fit: cover;
}
.username {
  display: block;
  font-size: 0.78rem;
  color: var(--muted);
}
.unblock-btn {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--muted);
  padding: 0.35rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}
.unblock-btn:hover:not(:disabled) {
  border-color: var(--danger-line, #fca5a5);
  color: var(--danger, #dc2626);
  background: var(--danger-bg, #fef2f2);
}
.unblock-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
