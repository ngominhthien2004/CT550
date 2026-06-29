<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'

import { useAuthStore } from '../stores/auth.store'
import { useNotificationStore } from '../stores/notification.store'
import { formatRelativeTime } from '../utils/date'

const isNavCollapsed = ref(true)
const unreadOnly = ref(false)
const sentinelRef = ref(null)
let observer = null
let pollTimer = null

const POLL_INTERVAL = 30000

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.items)

async function goLogin() {
  await router.push('/login')
}

async function loadNotifications() {
  if (!authStore.isAuthenticated) {
    return
  }

  await notificationStore.fetchNotifications({
    unread: unreadOnly.value,
    limit: 20,
  })
}

async function loadMore() {
  if (!authStore.isAuthenticated || !notificationStore.hasMore) return
  await notificationStore.loadMoreNotifications({
    unread: unreadOnly.value,
    limit: 20,
  })
}

async function markAllAsRead() {
  await notificationStore.readAllNotifications()
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function setupObserver() {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !notificationStore.loadingMore) {
        loadMore()
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinelRef.value) {
    observer.observe(sentinelRef.value)
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(() => {
    if (!notificationStore.loading && authStore.isAuthenticated) {
      loadNotifications()
    }
  }, POLL_INTERVAL)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(async () => {
  await loadNotifications()
  await nextTick()
  setupObserver()
  startPolling()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  stopPolling()
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section v-if="authStore.isAuthenticated" class="page-block p-3 p-md-4 d-grid gap-3">
      <header class="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h1 class="h4 mb-1">Notifications</h1>
          <p class="text-secondary mb-0">Unread: {{ notificationStore.unreadCount }}</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <label class="form-check mb-0">
            <input v-model="unreadOnly" class="form-check-input" type="checkbox" @change="loadNotifications" aria-label="Unread only" />
            <span class="form-check-label">Unread only</span>
          </label>
          <button
            v-if="notificationStore.unreadCount > 0"
            type="button"
            class="action-pill action-pill--small"
            @click="markAllAsRead"
          >
            Mark all read
          </button>
          <button type="button" class="action-pill action-pill--small" @click="loadNotifications">Refresh</button>
        </div>
      </header>

      <p v-if="notificationStore.loading" class="text-secondary mb-0">Loading notifications...</p>
      <p v-else-if="notificationStore.error" class="text-danger mb-0">{{ notificationStore.error }}</p>

      <div v-else-if="notifications.length" class="d-grid gap-2">
        <article
          v-for="item in notifications"
          :key="item._id"
          class="card border-0 shadow-sm"
          :class="{ 'notif-unread': !item.isRead }"
        >
          <div class="card-body d-flex align-items-start justify-content-between gap-3">
            <div class="d-flex align-items-start gap-3">
              <div class="notif-avatar">
                <img
                  v-if="item.actor?.avatar"
                  :src="item.actor.avatar"
                  :alt="item.actor.displayName || item.actor.username"
                  @error="(e) => e.target.style.display = 'none'"
                />
                <i v-else class="fa-regular fa-user" aria-hidden="true"></i>
              </div>
              <div>
              <p class="mb-1 fw-semibold">{{ item.message }}</p>
              <p class="mb-1 text-secondary small">
                {{ item.actor?.displayName || item.actor?.username || 'System' }} · {{ formatRelativeTime(item.createdAt) }}
              </p>
              <router-link
                v-if="item.artwork?._id"
                class="small text-decoration-none"
                :to="`/artworks/${item.artwork._id}`"
              >
                Open related artwork
              </router-link>
              </div>
            </div>

          </div>
        </article>

        <div ref="sentinelRef" class="scroll-sentinel">
          <p v-if="notificationStore.loadingMore" class="text-secondary mb-0">Loading more...</p>
          <p v-else-if="!notificationStore.hasMore" class="text-secondary mb-0">No more notifications.</p>
        </div>
      </div>

      <p v-else class="text-secondary mb-0">No notifications yet.</p>
    </section>

    <section v-else class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Notifications</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button type="button" class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.notif-unread {
  position: relative;
  background: rgba(59, 130, 246, 0.04);
}
.notif-unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: #3b82f6;
}
.scroll-sentinel {
  padding: 1rem;
  text-align: center;
}
.notif-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--surface-alt, #f1f5f9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted, #64748b);
  font-size: 1rem;
}
.notif-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
