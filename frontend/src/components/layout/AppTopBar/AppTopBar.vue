<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchOptionsModal from '../../search/SearchOptionsModal.vue'
import { useAuthStore } from '../../../stores/auth.store'
import { useFollowStore } from '../../../stores/follow.store'
import {
  getMyNotifications,
  markNotificationRead,
} from '../../../services/api'
import { useMessageStore } from '../../../stores/message.store'
import AppTopBarPostMenu from './AppTopBarPostMenu.vue'
import AppTopBarMessagePanel from './AppTopBarMessagePanel.vue'
import AppTopBarNotificationPanel from './AppTopBarNotificationPanel.vue'
import AppTopBarUserMenu from './AppTopBarUserMenu.vue'
import { formatShortDate } from '../../../utils/date.js'
import AppTopBarServicesMenu from './AppTopBarServicesMenu.vue'
import AppTopBarSearchControls from './AppTopBarSearchControls.vue'

const props = defineProps({
  siteName: {
    type: String,
    default: 'IlluWrl',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search by title, tag, or artist',
  },
})

const emit = defineEmits(['toggle-sidebar'])
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const messageStore = useMessageStore()
const followStore = useFollowStore()
const selectedSearchScope = ref('artworks')
const isSearchOptionsOpen = ref(false)
const searchOptionsDraft = ref({
  includeAll: '',
  includeAny: '',
  exclude: '',
  target: 'all',
  type: 'illust',
})

const searchScopes = [
  { key: 'artworks', label: 'Illustrations and Manga', icon: 'fa-regular fa-image', queryType: 'illust' },
  { key: 'novel', label: 'Novels', icon: 'fa-solid fa-book-open', queryType: 'novel' },
  { key: 'user', label: 'User', icon: 'fa-regular fa-user', queryType: 'user' },
]

const serviceLinks = computed(() => {
  return [
    {
      key: 'draw',
      label: 'Vẽ tranh',
      description: 'Create digital drawings and sketches',
      to: '/draw',
      thumbnail: '/service-draw.png',
    },
  ]
})

const userMainLinks = computed(() => {
  const baseLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Manage requests', to: '/requests/manage' },
  ]

  const adminLink = currentUser.value?.role === 'admin' ? { label: 'Admin management', to: '/admin' } : null

  return adminLink ? [adminLink, ...baseLinks] : baseLinks
})

const userLibraryLinks = [
  { label: 'My Favorite', to: '/favorites' },
  { label: 'Bookmarks', to: '/bookmarks' },
  { label: 'Browsing history', to: '/history' },
]

const userSettingLinks = [
  { label: 'Settings', to: '/account' },
]

const siteLabel = computed(() => props.siteName || 'IlluWrl')
const currentUser = computed(() => authStore.user)
const userId = computed(() => currentUser.value?._id || '')
const userAvatar = computed(() => currentUser.value?.avatar || '')
const userDisplayName = computed(() => currentUser.value?.username || 'User')
const userStats = computed(() => ({
  following: followStore.followingCount,
  followers: followStore.followersCount,
}))

const isMessageMenuOpen = ref(false)
const isNotificationMenuOpen = ref(false)
const notificationPreviewItems = ref([])
const notificationPreviewLoading = ref(false)
const notificationPreviewError = ref('')
const notificationUnreadCount = ref(0)

function handleToggleSidebar() {
  emit('toggle-sidebar')
}

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}

watch(
  () => userId.value,
  async (id) => {
    if (!authStore.isAuthenticated || !id) {
      followStore.fetchFollowing('')
      followStore.fetchFollowers('')
      return
    }

    await Promise.all([followStore.fetchFollowing(id), followStore.fetchFollowers(id)])
  },
  { immediate: true },
)

function chooseSearchScope(scopeKey) {
  selectedSearchScope.value = scopeKey
}

function syncSearchScopeFromRoute() {
  if (route.path === '/search/users' || route.query.type === 'user') {
    selectedSearchScope.value = 'user'
    return
  }

  if (route.query.type === 'novel') {
    selectedSearchScope.value = 'novel'
    return
  }

  selectedSearchScope.value = 'artworks'
}

watch(
  () => [route.path, route.query.type],
  syncSearchScopeFromRoute,
  { immediate: true },
)

function formatPanelTime(value) {
  return formatShortDate(value)
}

async function loadMessagePreview() {
  if (!authStore.isAuthenticated) return

  const now = Date.now()
  const inboxAge = now - (messageStore.lastFetchedAtInbox || 0)
  const sentAge = now - (messageStore.lastFetchedAtSent || 0)
  const stale = inboxAge > 60000 || sentAge > 60000
  const empty = !messageStore.inboxItems.length && !messageStore.sentItems.length

  if (stale || empty) {
    await messageStore.fetchPreview()
  }
}

async function loadNotificationPreview() {
  if (!authStore.isAuthenticated) {
    return
  }

  notificationPreviewLoading.value = true
  notificationPreviewError.value = ''

  try {
    const { data } = await getMyNotifications({ limit: 5 })
    notificationPreviewItems.value = data?.notifications || []
    notificationUnreadCount.value = Number(data?.unreadCount || 0)
  } catch (error) {
    notificationPreviewError.value = error?.response?.data?.message || 'Failed to load notifications'
    notificationPreviewItems.value = []
  } finally {
    notificationPreviewLoading.value = false
  }
}

function handleMessageMenuToggle(event) {
  isMessageMenuOpen.value = event.target.open
  if (isMessageMenuOpen.value) {
    isNotificationMenuOpen.value = false
    loadMessagePreview()
  }
}

function handleNotificationMenuToggle(event) {
  isNotificationMenuOpen.value = event.target.open
  if (isNotificationMenuOpen.value) {
    isMessageMenuOpen.value = false
    loadNotificationPreview()
  }
}

async function handleMarkMessageRead(messageId) {
  try {
    await messageStore.readMessage(messageId)
  } catch {
    // Error is surfaced through messageStore.error in template binding
  }
}

async function handleMarkNotificationRead(notificationId) {
  try {
    await markNotificationRead(notificationId)
    notificationPreviewItems.value = notificationPreviewItems.value.map((item) => {
      if (item._id !== notificationId) {
        return item
      }
      return {
        ...item,
        isRead: true,
      }
    })
    if (notificationUnreadCount.value > 0) {
      notificationUnreadCount.value -= 1
    }
  } catch (error) {
    notificationPreviewError.value = error?.response?.data?.message || 'Failed to mark notification as read'
  }
}

function openSearchOptions() {
  const query = router.currentRoute.value.query
  searchOptionsDraft.value = {
    includeAll: typeof query.qall === 'string' ? query.qall : '',
    includeAny: typeof query.qany === 'string' ? query.qany : '',
    exclude: typeof query.qnot === 'string' ? query.qnot : '',
    target: typeof query.target === 'string' ? query.target : 'all',
    type: typeof query.type === 'string' ? query.type : 'illust',
  }
  isSearchOptionsOpen.value = true
}

async function applySearchOptions(payload) {
  const query = {
    type: payload.type || 'illust',
  }

  if (payload.includeAll) {
    query.qall = payload.includeAll
  }
  if (payload.includeAny) {
    query.qany = payload.includeAny
  }
  if (payload.exclude) {
    query.qnot = payload.exclude
  }
  if (payload.target && payload.target !== 'all') {
    query.target = payload.target
  }

  await router.push({
    path: '/search',
    query,
  })
}
</script>

<template>
  <header class="top-nav page-block">
    <div class="top-nav-left">
      <button type="button" class="icon-btn ghost" aria-label="Toggle sidebar" @click="handleToggleSidebar">
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
      </button>
      <router-link to="/" class="top-site-name">{{ props.siteName }}</router-link>

      <AppTopBarSearchControls
        :search-placeholder="props.searchPlaceholder"
        :search-scopes="searchScopes"
        :selected-search-scope="selectedSearchScope"
        @select-scope="chooseSearchScope"
        @open-search-options="openSearchOptions"
      />
    </div>

    <div class="top-nav-actions">
      <AppTopBarPostMenu />

      <AppTopBarMessagePanel
        v-if="authStore.isAuthenticated"
        :open="isMessageMenuOpen"
        :unread-count="messageStore.inboxUnreadCount"
        :items="messageStore.previewItems"
        :loading="messageStore.loading"
        :error="messageStore.error"
        :format-time="formatPanelTime"
        @toggle="handleMessageMenuToggle"
        @mark-read="handleMarkMessageRead"
      />
      <router-link v-else to="/messages" class="icon-round" aria-label="Messages" title="Messages">
        <i class="fa-regular fa-envelope" aria-hidden="true"></i>
      </router-link>

      <AppTopBarNotificationPanel
        v-if="authStore.isAuthenticated"
        :open="isNotificationMenuOpen"
        :unread-count="notificationUnreadCount"
        :items="notificationPreviewItems"
        :loading="notificationPreviewLoading"
        :error="notificationPreviewError"
        :format-time="formatPanelTime"
        @toggle="handleNotificationMenuToggle"
        @mark-read="handleMarkNotificationRead"
      />
      <router-link v-else to="/notifications" class="icon-round" aria-label="Notifications" title="Notifications">
        <i class="fa-regular fa-bell" aria-hidden="true"></i>
      </router-link>

      <AppTopBarUserMenu
        v-if="authStore.isAuthenticated"
        :user-id="userId"
        :user-avatar="userAvatar"
        :user-display-name="userDisplayName"
        :user-stats="userStats"
        :user-main-links="userMainLinks"
        :user-library-links="userLibraryLinks"
        :user-setting-links="userSettingLinks"
        @logout="handleLogout"
      />

      <router-link v-else to="/login" class="action-pill action-pill--auth" aria-label="Go to login" title="Go to login">Log in</router-link>

      <AppTopBarServicesMenu :site-label="siteLabel" :service-links="serviceLinks" />
    </div>
  </header>

  <SearchOptionsModal
    v-model="isSearchOptionsOpen"
    :initial-values="searchOptionsDraft"
    @apply="applySearchOptions"
  />
</template>

<style scoped>
.top-nav {
  padding: 0.55rem 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  height: 72px;
}

.top-nav.page-block {
  border: none;
  box-shadow: none;
}

.top-nav-left {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  flex: 1 1 auto;
}

.top-site-name {
  text-decoration: none;
  font-size: clamp(1.2rem, 2vw + 0.5rem, 2rem);
  line-height: 1;
  color: var(--accent);
  letter-spacing: -0.01em;
  white-space: nowrap;
  flex-shrink: 0;
}

.top-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-btn {
  border: none;
  background: var(--surface);
  border-radius: 10px;
  width: 36px;
  height: 36px;
  font-size: 1rem;
  cursor: pointer;
}

.icon-btn.ghost {
  background: var(--surface-alt);
}

.icon-round {
  text-decoration: none;
  color: inherit;
  border: none;
  background: var(--surface);
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

@media (max-width: 920px) {
  .top-nav-left {
    flex-wrap: nowrap;
  }

  .top-site-name {
    display: none;
  }

  .top-nav-actions {
    gap: 0.35rem;
  }
}

@media (max-width: 600px) {
  .top-nav {
    padding: 0.4rem 0;
  }

  .top-nav-actions {
    gap: 0.3rem;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .top-nav-actions::-webkit-scrollbar {
    display: none;
  }
}
</style>
