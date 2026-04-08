<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppSearchBar from './AppSearchBar.vue'
import { useAuthStore } from '../../stores/auth.store'
import SearchOptionsModal from '../search/SearchOptionsModal.vue'

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

const siteLabel = computed(() => props.siteName || 'IlluWrl')

const serviceLinks = [
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

const userMainLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'My works', to: '/feed' },
  { label: 'Manage requests', to: '/messages' },
]

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

const currentUser = computed(() => authStore.user)
const userInitial = computed(() => {
  const source = currentUser.value?.username || currentUser.value?.email || 'U'
  return source.charAt(0).toUpperCase()
})
const userDisplayName = computed(() => currentUser.value?.username || 'User')
const userHandle = computed(() => `@${currentUser.value?.username || 'member'}`)

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
      <details class="post-menu">
        <summary class="post-btn" aria-label="Create new post" title="Create new post">
          Post
          <i class="fa-solid fa-caret-down" aria-hidden="true"></i>
        </summary>
        <div class="post-menu-list" role="menu" aria-label="Post type menu">
          <router-link to="/upload/illust" class="post-menu-item" role="menuitem" aria-label="Post illustration">Illustration</router-link>
          <router-link to="/upload/manga" class="post-menu-item" role="menuitem" aria-label="Post manga">Manga</router-link>
          <router-link to="/upload/ugoira" class="post-menu-item" role="menuitem" aria-label="Post ugoira animation">Ugoira</router-link>
          <router-link to="/upload/novel" class="post-menu-item" role="menuitem" aria-label="Post novel">Novel</router-link>
        </div>
      </details>
      <router-link to="/messages" class="icon-round" aria-label="Messages" title="Messages">
        <i class="fa-regular fa-envelope" aria-hidden="true"></i>
      </router-link>
      <router-link to="/notifications" class="icon-round" aria-label="Notifications" title="Notifications">
        <i class="fa-regular fa-bell" aria-hidden="true"></i>
      </router-link>

      <details class="user-menu" v-if="authStore.isAuthenticated">
        <summary class="user-menu-trigger" aria-label="Open user menu" title="User menu">
          <a href="/account" class="user-avatar-link" aria-label="Go to account" @click.prevent.stop="goAccountFromAvatar">
            <span class="user-avatar">{{ userInitial }}</span>
          </a>
          <i class="fa-solid fa-caret-down" aria-hidden="true"></i>
        </summary>
        <div class="user-menu-panel" role="menu" aria-label="User menu">
          <div class="user-hero">
            <span class="user-avatar large">{{ userInitial }}</span>
            <div class="user-hero-meta">
              <p class="mb-0 fw-bold">{{ userDisplayName }}</p>
              <p class="mb-0 small text-secondary">user_{{ userDisplayName.toLowerCase() }}</p>
              <div class="user-stats">
                <span><strong>{{ userStats.following }}</strong> Following</span>
                <span><strong>{{ userStats.followers }}</strong> Followers</span>
              </div>
            </div>
          </div>

          <div class="menu-group">
            <router-link
              v-for="item in userMainLinks"
              :key="item.label"
              :to="item.to"
              class="user-menu-item"
              role="menuitem"
            >
              {{ item.label }}
            </router-link>
          </div>

          <div class="menu-group">
            <router-link
              v-for="item in userLibraryLinks"
              :key="item.label"
              :to="item.to"
              class="user-menu-item"
              role="menuitem"
            >
              {{ item.label }}
            </router-link>
          </div>

          <div class="menu-group">
            <router-link
              v-for="item in userBusinessLinks"
              :key="item.label"
              :to="item.to"
              class="user-menu-item"
              role="menuitem"
            >
              {{ item.label }}
            </router-link>
          </div>

          <p class="menu-label" role="presentation">Language</p>
          <button type="button" class="user-menu-item" role="menuitem">English</button>
          <button type="button" class="user-menu-item toggle-row" role="menuitem" aria-label="Toggle dark theme">
            Dark Theme
            <span class="switch" aria-hidden="true">
              <span class="switch-knob"></span>
            </span>
          </button>

          <div class="menu-group">
            <router-link
              v-for="item in userSettingLinks"
              :key="item.label"
              :to="item.to"
              class="user-menu-item"
              role="menuitem"
            >
              {{ item.label }}
            </router-link>
          </div>

          <button type="button" class="user-menu-item danger" role="menuitem" @click="handleLogout">Log out</button>
        </div>
      </details>

      <router-link v-else to="/login" class="post-btn" aria-label="Go to login" title="Go to login">Log in</router-link>

      <details class="services-menu">
        <summary class="icon-round app-grid-btn" aria-label="Related services" title="Related services">
          <span class="app-grid-icon" aria-hidden="true">
            <span v-for="dot in 9" :key="dot" class="app-grid-dot"></span>
          </span>
        </summary>
        <div class="services-panel" role="menu" aria-label="Related services menu">
          <p class="services-title">{{ siteLabel }} services</p>
          <router-link
            v-for="item in serviceLinks"
            :key="item.key"
            :to="item.to"
            class="services-item"
            role="menuitem"
          >
            <img :src="item.thumbnail" :alt="item.label" class="services-thumb" loading="lazy" />
            <span class="services-copy">
              <strong>{{ siteLabel }} {{ item.label }}</strong>
              <small>{{ item.description }}</small>
            </span>
          </router-link>
        </div>
      </details>
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
  padding: 0.55rem 0.8rem;
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

.app-grid-btn {
  padding: 0;
  list-style: none;
}

.app-grid-btn::-webkit-details-marker {
  display: none;
}

.app-grid-icon {
  display: grid;
  grid-template-columns: repeat(3, 4px);
  gap: 2px;
}

.app-grid-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #6b7280;
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
}

.post-btn::-webkit-details-marker {
  display: none;
}

.post-menu {
  position: relative;
}

.post-menu-list {
  position: absolute;
  right: 0;
  top: calc(100% + 0.4rem);
  display: flex;
  flex-direction: column;
  min-width: 180px;
  padding: 0.35rem;
  border: 1px solid #dce3ec;
  border-radius: 0.72rem;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  z-index: 20;
}

.post-menu-item {
  text-decoration: none;
  color: #1f2937;
  padding: 0.45rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.post-menu-item:hover,
.post-menu-item:focus-visible {
  background: #f1f5f9;
}

.user-menu {
  position: relative;
}

.user-menu-trigger {
  list-style: none;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid #dce3ec;
  background: #fff;
  border-radius: 999px;
  padding: 0.2rem 0.42rem;
  cursor: pointer;
}

.user-avatar-link {
  text-decoration: none;
  display: inline-flex;
}

.user-menu-trigger::-webkit-details-marker {
  display: none;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: linear-gradient(135deg, #93c5fd, #60a5fa);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.user-menu-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 0.4rem);
  width: 216px;
  max-height: min(76vh, 498px);
  overflow-y: auto;
  padding: 0 0 1.2rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.1);
  z-index: 22;
}

.user-hero {
  display: grid;
  justify-items: center;
  gap: 0.38rem;
  padding: 1rem 0.8rem 0.9rem;
}

.user-hero-meta {
  min-width: 0;
  display: grid;
  gap: 0.08rem;
  justify-items: center;
  text-align: center;
}

.user-avatar.large {
  width: 64px;
  height: 64px;
  font-size: 1rem;
}

.user-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.76rem;
  color: #6b7280;
}

.menu-group {
  margin-top: 0.7rem;
}

.user-menu-item {
  text-decoration: none;
  border: none;
  background: transparent;
  color: #1f2937;
  text-align: left;
  border-radius: 0;
  padding: 0 1rem;
  height: 40px;
  line-height: 40px;
  font-size: 0.9rem;
  width: 100%;
  display: flex;
  align-items: center;
}

.user-menu-item:hover,
.user-menu-item:focus-visible {
  background: rgba(0, 0, 0, 0.05);
}

.user-menu-item.danger {
  color: #dc2626;
}

.menu-label {
  margin: 0.7rem 0 0;
  padding: 0.28rem 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #858585;
}

.toggle-row {
  justify-content: space-between;
}

.switch {
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: #d1d5db;
  padding: 2px;
  display: inline-flex;
  align-items: center;
}

.switch-knob {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.24);
}

.services-menu {
  position: relative;
}

.services-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 0.4rem);
  width: 292px;
  max-height: min(76vh, 500px);
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
  z-index: 22;
  padding: 0.45rem;
  display: grid;
  gap: 0.3rem;
}

.services-title {
  margin: 0;
  padding: 0.35rem 0.42rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #6b7280;
}

.services-item {
  text-decoration: none;
  color: #1f2937;
  border-radius: 10px;
  padding: 0.46rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.services-item:hover,
.services-item:focus-visible {
  background: #f1f5f9;
}

.services-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.services-copy {
  display: grid;
  min-width: 0;
}

.services-copy strong {
  font-size: 0.86rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.25;
}

.services-copy small {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.25;
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
