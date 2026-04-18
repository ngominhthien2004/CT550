<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppSearchBar from '../AppSearchBar.vue'
import SearchOptionsModal from '../../search/SearchOptionsModal.vue'
import { useAuthStore } from '../../../stores/auth.store'
import {
  getMyMessages,
  getMyNotifications,
  markMessageRead,
  markNotificationRead,
} from '../../../services/api'
import AppTopBarPostMenu from './AppTopBarPostMenu.vue'
import AppTopBarMessagePanel from './AppTopBarMessagePanel.vue'
import AppTopBarNotificationPanel from './AppTopBarNotificationPanel.vue'
import AppTopBarUserMenu from './AppTopBarUserMenu.vue'
import AppTopBarServicesMenu from './AppTopBarServicesMenu.vue'

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
const authStore = useAuthStore()
const isSearchScopeOpen = ref(false)
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
  { key: 'artworks', label: 'Illustrations and Manga' },
  { key: 'novel', label: 'Novels' },
  { key: 'user', label: 'User' },
]
const userStats = {
  following: 300,
  followers: 10,
}

const serviceLinks = computed(() => {
  const links = [
  {
    key: 'daily',
    label: 'Daily Feed',
    description: 'Artwork stream from artists you follow',
    to: '/feed',
    thumbnail: 'https://picsum.photos/seed/ct550-daily/96/96',
  },
  {
    key: 'ranking',
    label: 'Rankings',
    description: 'Trending illustrations and manga',
    to: '/rankings',
    thumbnail: 'https://picsum.photos/seed/ct550-ranking/96/96',
  },
  {
    key: 'favorite',
    label: 'My Favorite',
    description: 'Works you liked and want to revisit',
    to: '/favorites',
    thumbnail: 'https://picsum.photos/seed/ct550-favorites/96/96',
  },
  {
    key: 'bookmarks',
    label: 'Bookmarks',
    description: 'Saved works and reading list',
    to: '/bookmarks',
    thumbnail: 'https://picsum.photos/seed/ct550-bookmarks/96/96',
  },
  {
    key: 'upload',
    label: 'Create Artwork',
    description: 'Post illustration, manga, ugoira, or novel',
    to: '/upload/illust',
    thumbnail: 'https://picsum.photos/seed/ct550-upload/96/96',
  },
  ]

  if (currentUser.value?.role === 'admin') {
    links.unshift({
      key: 'admin',
      label: 'Admin',
      description: 'Manage users, artworks, and moderation',
      to: '/admin',
      thumbnail: 'https://picsum.photos/seed/ct550-admin/96/96',
    })
  }

  return links
})

const userMainLinks = computed(() => {
  const links = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'My works', to: '/feed' },
    { label: 'Manage requests', to: '/messages' },
  ]

  if (currentUser.value?.role === 'admin') {
    links.unshift({ label: 'Admin management', to: '/admin' })
  }

  return links
})

const userLibraryLinks = [
  { label: 'My Favorite', to: '/favorites' },
  { label: 'Bookmarks', to: '/bookmarks' },
  { label: 'Browsing history', to: '/feed' },
  { label: 'Markers', to: '/rankings' },
]

const userBusinessLinks = [{ label: 'Money management', to: '/account' }]

const userSettingLinks = [
  { label: 'Settings', to: '/account' },
  { label: 'Send feedback', to: '/messages' },
]

const siteLabel = computed(() => props.siteName || 'IlluWrl')
const currentUser = computed(() => authStore.user)
const userInitial = computed(() => {
  const source = currentUser.value?.username || currentUser.value?.email || 'U'
  return source.charAt(0).toUpperCase()
})
const userDisplayName = computed(() => currentUser.value?.username || 'User')

const isMessageMenuOpen = ref(false)
const isNotificationMenuOpen = ref(false)
const messagePreviewItems = ref([])
const notificationPreviewItems = ref([])
const messagePreviewLoading = ref(false)
const notificationPreviewLoading = ref(false)
const messagePreviewError = ref('')
const notificationPreviewError = ref('')
const messageUnreadCount = ref(0)
const notificationUnreadCount = ref(0)

function handleToggleSidebar() {
  emit('toggle-sidebar')
}

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}

async function goAccountFromAvatar() {
  await router.push('/account')
}

function toggleSearchScopeMenu() {
  isSearchScopeOpen.value = !isSearchScopeOpen.value
}

function chooseSearchScope(scopeKey) {
  selectedSearchScope.value = scopeKey
  isSearchScopeOpen.value = false
}

function formatPanelTime(value) {
  if (!value) {
    return ''
  }
  return new Date(value).toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadMessagePreview() {
  if (!authStore.isAuthenticated) {
    return
  }

  messagePreviewLoading.value = true
  messagePreviewError.value = ''

  try {
    const { data } = await getMyMessages({ box: 'inbox', limit: 5 })
    messagePreviewItems.value = data?.messages || []
    messageUnreadCount.value = Number(data?.unreadCount || 0)
  } catch (error) {
    messagePreviewError.value = error?.response?.data?.message || 'Failed to load messages'
    messagePreviewItems.value = []
  } finally {
    messagePreviewLoading.value = false
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
    await markMessageRead(messageId)
    messagePreviewItems.value = messagePreviewItems.value.map((item) => {
      if (item._id !== messageId) {
        return item
      }
      return {
        ...item,
        isRead: true,
        readAt: new Date().toISOString(),
      }
    })
    if (messageUnreadCount.value > 0) {
      messageUnreadCount.value -= 1
    }
  } catch (error) {
    messagePreviewError.value = error?.response?.data?.message || 'Failed to mark message as read'
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
        readAt: new Date().toISOString(),
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
    path: '/feed',
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

      <AppSearchBar class="top-search" :placeholder="props.searchPlaceholder" variant="compact" />

      <div class="inline-menu" @keydown.esc="isSearchScopeOpen = false">
        <button
          type="button"
          class="icon-round"
          aria-label="Media"
          title="Media"
          :aria-expanded="isSearchScopeOpen"
          @click="toggleSearchScopeMenu"
        >
          <i class="fa-regular fa-image" aria-hidden="true"></i>
        </button>
        <div v-if="isSearchScopeOpen" class="inline-menu-panel" role="menu" aria-label="Search scope menu">
          <button
            v-for="scope in searchScopes"
            :key="scope.key"
            type="button"
            class="inline-menu-item"
            :class="{ 'is-active': selectedSearchScope === scope.key }"
            role="menuitem"
            @click="chooseSearchScope(scope.key)"
          >
            <i v-if="selectedSearchScope === scope.key" class="fa-solid fa-check" aria-hidden="true"></i>
            <span v-else class="inline-menu-spacer" aria-hidden="true"></span>
            {{ scope.label }}
          </button>
        </div>
      </div>

      <button type="button" class="icon-round" aria-label="More" title="More" @click="openSearchOptions">
        <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
      </button>
      <router-link to="/signup" class="premium-pill">Premium Free Trial</router-link>
    </div>

    <div class="top-nav-actions">
      <AppTopBarPostMenu />

      <AppTopBarMessagePanel
        v-if="authStore.isAuthenticated"
        :open="isMessageMenuOpen"
        :unread-count="messageUnreadCount"
        :items="messagePreviewItems"
        :loading="messagePreviewLoading"
        :error="messagePreviewError"
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
        :user-initial="userInitial"
        :user-display-name="userDisplayName"
        :user-stats="userStats"
        :user-main-links="userMainLinks"
        :user-library-links="userLibraryLinks"
        :user-business-links="userBusinessLinks"
        :user-setting-links="userSettingLinks"
        @open-account="goAccountFromAvatar"
        @logout="handleLogout"
      />

      <router-link v-else to="/login" class="post-btn" aria-label="Go to login" title="Go to login">Log in</router-link>

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
  justify-content: space-between;
  gap: 0.75rem;
  height: 72px;
}

.top-nav-left {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.top-site-name {
  text-decoration: none;
  font-size: 2rem;
  line-height: 1;
  color: #1695f0;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.top-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.icon-btn {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 10px;
  width: 36px;
  height: 36px;
  font-size: 1rem;
  cursor: pointer;
}

.icon-btn.ghost {
  background: #f8fafc;
}

.top-search {
  flex: 1 1 340px;
  min-width: 220px;
}

.icon-round {
  text-decoration: none;
  color: inherit;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.post-btn {
  list-style: none;
  border: 1px solid #d5dbe3;
  border-radius: 999px;
  padding: 0.42rem 0.72rem;
  background: #eef2f7;
  color: #1f2937;
  font-weight: 700;
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  gap: 0.36rem;
  cursor: pointer;
  text-decoration: none;
}

.inline-menu {
  position: relative;
}

.inline-menu-panel {
  position: absolute;
  left: 0;
  top: calc(100% + 0.4rem);
  min-width: 238px;
  border: 1px solid #dce3ec;
  border-radius: 0.72rem;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  z-index: 24;
  padding: 0.35rem;
  display: grid;
  gap: 0.1rem;
}

.inline-menu-item {
  border: none;
  background: transparent;
  color: #374151;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  line-height: 1.2;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.46rem;
  padding: 0.45rem 0.54rem;
}

.inline-menu-item:hover,
.inline-menu-item:focus-visible,
.inline-menu-item.is-active {
  background: #f1f5f9;
}

.inline-menu-item i,
.inline-menu-spacer {
  width: 1rem;
  text-align: center;
  flex-shrink: 0;
}

.premium-pill {
  text-decoration: none;
  color: #f59e0b;
  font-weight: 800;
  font-size: 0.9rem;
  white-space: nowrap;
}

@media (max-width: 920px) {
  .top-nav-left {
    flex-wrap: wrap;
  }

  .top-search {
    flex-basis: 100%;
  }

  .top-nav-actions {
    flex-wrap: wrap;
  }
}
</style>
