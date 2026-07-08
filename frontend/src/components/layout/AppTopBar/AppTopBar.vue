<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SearchOptionsModal from '../../search/SearchOptionsModal.vue'
import { useAuthStore } from '../../../stores/auth.store'
import { useFollowStore } from '../../../stores/follow.store'
import { useNotificationStore } from '../../../stores/notification.store'
import {
  getMyNotifications,
  markAllNotificationsRead,
} from '../../../services/api'
import { useMessageStore } from '../../../stores/message.store'
import { useSocket } from '../../../composables/useSocket'
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
    default: '',
  },
})

const { t } = useI18n()

const emit = defineEmits(['toggle-sidebar'])
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const messageStore = useMessageStore()
const followStore = useFollowStore()
const selectedSearchScope = ref('illust')
const isSearchOptionsOpen = ref(false)
const searchOptionsDraft = ref({
  includeAll: '',
  includeAny: '',
  exclude: '',
  target: 'tag_partial',
  type: 'illust',
})

const searchScopeKeys = {
  illust: 'nav.illustrations',
  manga: 'nav.manga',
  gif: 'nav.gif',
  novel: 'nav.novels',
  user: 'search.accounts',
}

const searchScopes = [
  { key: 'illust', label: 'Illustrations', icon: 'fa-regular fa-image', queryType: 'illust' },
  { key: 'manga', label: 'Manga', icon: '/manga-icon.png', queryType: 'manga' },
  { key: 'gif', label: 'GIF', icon: 'fa-solid fa-film', queryType: 'gif' },
  { key: 'novel', label: 'Novels', icon: 'fa-solid fa-book-open', queryType: 'novel' },
  { key: 'user', label: 'User', icon: 'fa-regular fa-user', queryType: 'user' },
]

const translatedSearchScopes = computed(() =>
  searchScopes.map(s => ({ ...s, label: t(searchScopeKeys[s.key] || 'common.unknown') }))
)

const serviceLinks = computed(() => {
  return [
    {
      key: 'draw',
      label: t('nav.drawing'),
      description: t('topbar.createDigitalDrawings'),
      to: '/draw',
      thumbnail: '/service-draw.png',
    },
  ]
})

const userMainLinks = computed(() => {
  const baseLinks = [
    { label: t('nav.dashboard'), to: '/dashboard' },
    { label: t('nav.requests'), to: '/requests/manage' },
  ]

  const adminLink = currentUser.value?.role === 'admin' ? { label: t('nav.adminManagement'), to: '/admin' } : null

  return adminLink ? [adminLink, ...baseLinks] : baseLinks
})

const userLibraryLinks = computed(() => [
  { label: t('nav.myFavorite'), to: '/favorites' },
  { label: t('nav.bookmarks'), to: '/bookmarks' },
  { label: t('nav.browsingHistory'), to: '/history' },
])

const userSettingLinks = computed(() => [
  { label: t('common.settings'), to: '/account' },
])

const siteLabel = computed(() => props.siteName || 'IlluWrl')
const currentUser = computed(() => authStore.user)
const userId = computed(() => currentUser.value?._id || '')
const userAvatar = computed(() => currentUser.value?.avatar || '')
const userDisplayName = computed(() => currentUser.value?.username || t('common.unknown'))
const userStats = computed(() => ({
  following: followStore.followingCount,
  followers: followStore.followersCount,
}))

const isMessageMenuOpen = ref(false)
const isNotificationMenuOpen = ref(false)
const forceCloseUserMenu = ref(false)
const notificationPreviewItems = ref([])
const notificationPreviewLoading = ref(false)
const notificationPreviewLoadingMore = ref(false)
const notificationPreviewError = ref('')
const notificationUnreadCount = ref(0)
const notificationPreviewPage = ref(1)
const notificationPreviewHasMore = ref(true)

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

  selectedSearchScope.value = 'illust'
}

watch(
  () => [route.path, route.query.type],
  syncSearchScopeFromRoute,
  { immediate: true },
)

const { connect, disconnect, on, off, isConnected } = useSocket()
const notificationStore = useNotificationStore()

function handleNewNotification(notification) {
  notificationStore.addRealtimeNotification(notification)
  notificationPreviewItems.value = [notification, ...notificationPreviewItems.value]
  if (!notification.isRead) {
    notificationUnreadCount.value += 1
  }
}

function handleNewMessageForBadge(message) {
  if (!message || !message._id) return
  const myId = userId.value
  if (String(message.recipient?._id || '') !== String(myId)) return
  loadMessagePreview()
}

onMounted(() => {
  loadNotificationPreview()
  loadMessagePreview()
  startNotificationPolling()

  // Connect Socket.IO and listen for real-time notifications
  connect()
  on('notification:new', handleNewNotification)
  on('message:new', handleNewMessageForBadge)
})

onBeforeUnmount(() => {
  stopNotificationPolling()
  off('notification:new', handleNewNotification)
  off('message:new', handleNewMessageForBadge)
  disconnect()
})

let notificationPollTimer = null
const NOTIFICATION_POLL_INTERVAL = 30000

function startNotificationPolling() {
  stopNotificationPolling()
  notificationPollTimer = setInterval(() => {
    if (authStore.isAuthenticated && !notificationPreviewLoading.value) {
      loadNotificationPreview()
    }
  }, NOTIFICATION_POLL_INTERVAL)
}

function stopNotificationPolling() {
  if (notificationPollTimer) {
    clearInterval(notificationPollTimer)
    notificationPollTimer = null
  }
}

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
  notificationPreviewPage.value = 1
  notificationPreviewHasMore.value = true

  try {
    const { data } = await getMyNotifications({ limit: 10, page: 1 })
    notificationPreviewItems.value = data?.notifications || []
    notificationUnreadCount.value = Number(data?.unreadCount || 0)
    notificationPreviewHasMore.value = notificationPreviewItems.value.length < (data?.total || 0)
  } catch (error) {
    notificationPreviewError.value = error?.response?.data?.message || t('notification.loadFailed')
    notificationPreviewItems.value = []
  } finally {
    notificationPreviewLoading.value = false
  }
}

async function loadMoreNotificationPreview() {
  if (!authStore.isAuthenticated || !notificationPreviewHasMore.value || notificationPreviewLoadingMore.value) {
    return
  }

  notificationPreviewLoadingMore.value = true
  notificationPreviewError.value = ''

  try {
    const nextPage = notificationPreviewPage.value + 1
    const { data } = await getMyNotifications({ limit: 10, page: nextPage })
    const newItems = data?.notifications || []
    notificationPreviewItems.value = [...notificationPreviewItems.value, ...newItems]
    notificationPreviewPage.value = nextPage
    notificationPreviewHasMore.value = notificationPreviewItems.value.length < (data?.total || 0)
  } catch (error) {
    notificationPreviewError.value = error?.response?.data?.message || t('notification.loadMoreFailed')
  } finally {
    notificationPreviewLoadingMore.value = false
  }
}

function handleMessageMenuToggle(event) {
  isMessageMenuOpen.value = event.target.open
  if (isMessageMenuOpen.value) {
    isNotificationMenuOpen.value = false
    forceCloseUserMenu.value = true
    loadMessagePreview()
  }
}

function handleNotificationMenuToggle(event) {
  isNotificationMenuOpen.value = event.target.open
  if (isNotificationMenuOpen.value) {
    isMessageMenuOpen.value = false
    forceCloseUserMenu.value = true
    loadNotificationPreview()
  }
}

function handleUserMenuToggle(event) {
  if (event.target.open) {
    isMessageMenuOpen.value = false
    isNotificationMenuOpen.value = false
  }
}

async function handleMarkMessageRead(messageId) {
  try {
    await messageStore.readMessage(messageId)
  } catch {
    // Error is surfaced through messageStore.error in template binding
  }
}

async function handleMarkAllNotificationsRead() {
  try {
    await markAllNotificationsRead()
    notificationPreviewItems.value = notificationPreviewItems.value.map((item) => ({
      ...item,
      isRead: true,
    }))
    notificationUnreadCount.value = 0
  } catch (error) {
    notificationPreviewError.value = error?.response?.data?.message || t('notification.markAllReadFailed')
  }
}

function openSearchOptions() {
  const query = router.currentRoute.value.query
  searchOptionsDraft.value = {
    includeAll: typeof query.qall === 'string' ? query.qall : (typeof query.q === 'string' ? query.q : ''),
    includeAny: typeof query.qany === 'string' ? query.qany : '',
    exclude: typeof query.qnot === 'string' ? query.qnot : '',
    target: typeof query.target === 'string' ? query.target : 'tag_partial',
    type: typeof query.type === 'string' ? query.type : 'illust',
    series: typeof query.series === 'string' ? query.series : 'all',
  }
  isSearchOptionsOpen.value = true
}

async function applySearchOptions(payload) {
  const query = {
    type: payload.type || 'illust',
  }

  if (payload.includeAll) {
    query.q = payload.includeAll
  } else {
    const currentQ = typeof router.currentRoute.value.query.q === 'string' ? router.currentRoute.value.query.q.trim() : ''
    if (currentQ) query.q = currentQ
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
  if (payload.series && payload.series !== 'all') {
    query.series = payload.series
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
        :search-placeholder="props.searchPlaceholder || $t('topbar.search')"
        :search-scopes="translatedSearchScopes"
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
      <router-link v-else to="/messages" class="icon-round" :aria-label="$t('topbar.messages')" :title="$t('topbar.messages')">
        <i class="fa-regular fa-envelope" aria-hidden="true"></i>
      </router-link>

      <AppTopBarNotificationPanel
        v-if="authStore.isAuthenticated"
        :open="isNotificationMenuOpen"
        :unread-count="notificationUnreadCount"
        :items="notificationPreviewItems"
        :loading="notificationPreviewLoading"
        :loading-more="notificationPreviewLoadingMore"
        :has-more="notificationPreviewHasMore"
        :error="notificationPreviewError"
        :format-time="formatPanelTime"
        @toggle="handleNotificationMenuToggle"
        @mark-all-read="handleMarkAllNotificationsRead"
        @load-more="loadMoreNotificationPreview"
      />
      <router-link v-else to="/notifications" class="icon-round" :aria-label="$t('topbar.notifications')" :title="$t('topbar.notifications')">
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
        :force-close="forceCloseUserMenu"
        @logout="handleLogout"
        @toggle="handleUserMenuToggle"
      />

      <router-link v-else to="/login" class="action-pill action-pill--auth" :aria-label="$t('topbar.logIn')">{{ $t('topbar.logIn') }}</router-link>

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
