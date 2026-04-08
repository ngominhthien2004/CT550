<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { useAuthStore } from '../stores/auth.store'
import { useNotificationStore } from '../stores/notification.store'

const isNavCollapsed = ref(true)
const unreadOnly = ref(false)

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
    limit: 50,
  })
}

async function markAsRead(notificationId) {
  await notificationStore.readNotification(notificationId)
}

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

onMounted(() => {
  loadNotifications()
})
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section v-if="authStore.isAuthenticated" class="page-block p-3 p-md-4 d-grid gap-3">
      <header class="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h1 class="h4 mb-1">Notifications</h1>
          <p class="text-secondary mb-0">Unread: {{ notificationStore.unreadCount }}</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <label class="form-check mb-0">
            <input v-model="unreadOnly" class="form-check-input" type="checkbox" @change="loadNotifications" />
            <span class="form-check-label">Unread only</span>
          </label>
          <button class="btn btn-outline-secondary btn-sm" @click="loadNotifications">Refresh</button>
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
            <div>
              <p class="mb-1 fw-semibold">{{ item.message }}</p>
              <p class="mb-1 text-secondary small">
                {{ item.actor?.displayName || item.actor?.username || 'System' }} · {{ new Date(item.createdAt).toLocaleString() }}
              </p>
              <router-link
                v-if="item.artwork?._id"
                class="small text-decoration-none"
                :to="`/artworks/${item.artwork._id}`"
              >
                Open related artwork
              </router-link>
            </div>
            <button
              v-if="!item.isRead"
              class="btn btn-sm btn-outline-primary"
              @click="markAsRead(item._id)"
            >
              Mark read
            </button>
          </div>
        </article>
      </div>

      <p v-else class="text-secondary mb-0">No notifications yet.</p>
    </section>

    <section v-else class="page-block p-3 p-md-4 d-grid gap-2">
      <h1 class="h4 mb-0">Notifications</h1>
      <p class="text-secondary mb-0">You are not logged in.</p>
      <button class="btn btn-primary btn-sm justify-self-start" @click="goLogin">Go to login</button>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.notif-unread {
  border-left: 4px solid #3b82f6;
}
</style>
