<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchOptionsModal from '../components/search/SearchOptionsModal.vue'
import { getArtworks, userApi } from '../services/api'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
import { useAuthStore } from '../stores/auth.store'
import { useFollowStore } from '../stores/follow.store'

const DEFAULT_PROFILE_AVATAR = 'https://s.pximg.net/common/images/no_profile.png'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const followStore = useFollowStore()
const isNavCollapsed = ref(true)
const loading = ref(false)
const error = ref('')
const searchItems = ref([])
const userResults = ref([])
const userTotal = ref(0)
const userLoading = ref(false)
const userError = ref('')
const activeUserMenuId = ref('')
const blockedUserIds = ref([])
const requestModalUser = ref(null)
const requestMessage = ref('')
const requestSubmitting = ref(false)
const requestError = ref('')
const requestSuccess = ref('')
const blockSubmittingId = ref('')
const sortMode = ref(typeof route.query.order === 'string' ? route.query.order : 'newest')
const showTags = ref(true)
const isSearchOptionsOpen = ref(false)

// Novel-specific filters
const novelSortBy = ref('newest')
const novelFormatFilter = ref('all')
const novelMinWords = ref('')
const novelMaxWords = ref('')
const searchOptionsDraft = ref({
  includeAll: '',
  includeAny: '',
  exclude: '',
  target: 'all',
  type: 'illust',
})

const searchKeyword = computed(() => {
  const q = typeof route.query.q === 'string' ? route.query.q.trim() : ''
  const nick = typeof route.query.nick === 'string' ? route.query.nick.trim() : ''
  return q || nick
})

const keyword = computed(() => searchKeyword.value || 'discover')
const activeType = computed(() => {
  if (route.path === '/search/users') {
    return 'user'
  }

  return typeof route.query.type === 'string' ? route.query.type : 'illust'
})
const ageFilter = computed(() => (typeof route.query.age === 'string' ? route.query.age : 'all'))
const isUserSearch = computed(() => activeType.value === 'user')
const isNovelSearch = computed(() => activeType.value === 'novel')

const searchTypeTabs = [
  { key: 'illust', label: 'Illustrations' },
  { key: 'manga', label: 'Manga' },
  { key: 'novel', label: 'Novels' },
  { key: 'user', label: 'User' },
]

const currentSearchOptions = computed(() => ({
  includeAll: typeof route.query.qall === 'string' ? route.query.qall : '',
  includeAny: typeof route.query.qany === 'string' ? route.query.qany : '',
  exclude: typeof route.query.qnot === 'string' ? route.query.qnot : '',
  target: typeof route.query.target === 'string' ? route.query.target : 'all',
  type: typeof route.query.type === 'string' ? route.query.type : 'illust',
}))

const baseSearchQuery = computed(() => {
  const query = {}
  const q = searchKeyword.value
  const qall = typeof route.query.qall === 'string' ? route.query.qall : ''
  const qany = typeof route.query.qany === 'string' ? route.query.qany : ''
  const qnot = typeof route.query.qnot === 'string' ? route.query.qnot : ''
  const target = typeof route.query.target === 'string' ? route.query.target : ''
  const order = typeof route.query.order === 'string' ? route.query.order : ''
  const age = typeof route.query.age === 'string' ? route.query.age : ''

  if (q) query.q = q
  if (qall) query.qall = qall
  if (qany) query.qany = qany
  if (qnot) query.qnot = qnot
  if (target && target !== 'all') query.target = target
  if (order && order !== 'newest') query.order = order
  if (age && age !== 'all') query.age = age

  return query
})

const relatedTags = computed(() => {
  const bucket = new Map()

  for (const item of searchItems.value) {
    for (const tag of item.tags || []) {
      const name = tag?.name?.trim()
      if (!name) {
        continue
      }

      const normalized = name.toLowerCase()
      const count = bucket.get(normalized)?.count || 0
      bucket.set(normalized, {
        label: name,
        count: count + 1,
      })
    }
  }

  return Array.from(bucket.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
})

const fallbackTags = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  const base = ['new', 'original character', 'manga', 'illustration', 'fanart', 'anime']
  const merged = q ? [q, ...base] : base
  return [...new Set(merged)].slice(0, 10)
})

const displayTags = computed(() => {
  if (relatedTags.value.length) {
    return relatedTags.value.map((tag) => tag.label)
  }
  return fallbackTags.value
})

const typeCounts = computed(() => {
  const counts = {
    illust: 0,
    manga: 0,
    novel: 0,
  }

  for (const item of searchItems.value) {
    const type = String(item.type || '').toLowerCase()
    if (Object.hasOwn(counts, type)) {
      counts[type] += 1
    }
  }

  return counts
})

const userCount = computed(() => userTotal.value || userResults.value.length)

const tabCounts = computed(() => ({
  ...typeCounts.value,
  user: userCount.value,
}))

const visibleItems = computed(() => {
  const source = searchItems.value.filter((item) => {
    if (activeType.value && item.type !== activeType.value) {
      return false
    }

    const isR18 = item.ageRating === 'r-18' || item.ageRating === 'r-18g' || item.isR18 === true
    if (ageFilter.value === 'safe' && isR18) {
      return false
    }
    if (ageFilter.value === 'r18' && !isR18) {
      return false
    }

    return true
  })

  if (sortMode.value === 'popular') {
    return source.toSorted((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
  } else {
    return source.toSorted((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  }
})

const resultTotal = computed(() => (isUserSearch.value ? userCount.value : visibleItems.value.length))

const normalizedArtworkItems = computed(() =>
  searchItems.value.map((item) => ({
    ...item,
    image: item.image || item.images?.[0] || '',
  })),
)

const userPreviewMap = computed(() => {
  const bucket = new Map()

  for (const item of normalizedArtworkItems.value) {
    const userId = item.user?._id
    if (!userId) {
      continue
    }

    if (!bucket.has(userId)) {
      bucket.set(userId, [])
    }

    if (bucket.get(userId).length < 4) {
      bucket.get(userId).push(item)
    }
  }

  return bucket
})

const enrichedUserResults = computed(() =>
  userResults.value
    .filter((user) => !blockedUserIds.value.includes(user._id))
    .map((user) => ({
      ...user,
      previews: userPreviewMap.value.get(user._id) || [],
    })),
)

const novelSortLabel = computed(() => (sortMode.value === 'popular' ? 'Popular novels' : 'Newest novels'))

const searchResultPageClass = computed(() => ({
  'search-result-page--users': isUserSearch.value,
}))
const requestMessageCount = computed(() => requestMessage.value.length)
const requestModalUserName = computed(() => (requestModalUser.value ? getUserDisplayName(requestModalUser.value) : 'this user'))

const placeholderCount = computed(() => {
  if (loading.value || error.value || !visibleItems.value.length) {
    return 0
  }

  return Math.min(18, Math.max(0, 30 - visibleItems.value.length))
})

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function normalizeKeywords(raw) {
  return String(raw || '')
    .toLowerCase()
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildTargetText(item, target) {
  const title = item.title || ''
  const description = item.description || ''
  const tags = (item.tags || []).map((tag) => tag?.name || '').join(' ')
  const author = `${item.user?.displayName || ''} ${item.user?.username || ''}`

  if (target === 'title') {
    return title.toLowerCase()
  }
  if (target === 'tags') {
    return tags.toLowerCase()
  }
  if (target === 'artist') {
    return author.toLowerCase()
  }
  if (target === 'description') {
    return description.toLowerCase()
  }

  return `${title} ${description} ${tags} ${author}`.toLowerCase()
}

function buildTypeRoute(type) {
  if (type === 'user') {
    return {
      path: '/search/users',
      query: searchKeyword.value
        ? {
            nick: searchKeyword.value,
            s_mode: 's_usr',
          }
        : {
            s_mode: 's_usr',
          },
    }
  }

  return {
    path: '/search',
    query: {
      ...baseSearchQuery.value,
      type,
      s_mode: type === 'novel' ? 'tag_tc' : undefined,
    },
  }
}

async function setAgeFilter(value) {
  const query = {
    ...route.query,
    age: value === 'all' ? undefined : value,
  }

  await router.replace({
    path: '/search',
    query,
  })
}

async function handleSortChange() {
  const query = {
    ...route.query,
    order: sortMode.value === 'newest' ? undefined : sortMode.value,
  }

  await router.replace({
    path: '/search',
    query,
  })
}

async function applySearchTag(tagLabel) {
  const query = {
    ...route.query,
    q: tagLabel,
  }

  await router.push({
    path: '/search',
    query,
  })
}

function openSearchOptions() {
  searchOptionsDraft.value = { ...currentSearchOptions.value }
  isSearchOptionsOpen.value = true
}

function toggleUserMenu(userId) {
  activeUserMenuId.value = activeUserMenuId.value === userId ? '' : userId
}

function closeUserMenu() {
  activeUserMenuId.value = ''
}

async function ensureAuthenticated() {
  if (authStore.isAuthenticated) {
    return true
  }

  await router.push({
    name: 'login',
    query: { redirect: route.fullPath },
  })
  return false
}

async function openIlluWrlRequest(user) {
  if (!(await ensureAuthenticated())) {
    return
  }

  requestModalUser.value = user
  requestMessage.value = ''
  requestError.value = ''
  requestSuccess.value = ''
  closeUserMenu()
}

function closeIlluWrlRequest() {
  if (requestSubmitting.value) {
    return
  }

  requestModalUser.value = null
  requestMessage.value = ''
  requestError.value = ''
  requestSuccess.value = ''
}

async function submitIlluWrlRequest() {
  if (!requestModalUser.value || requestSubmitting.value) {
    return
  }

  if (requestMessage.value.length > 10000) {
    requestError.value = 'Message must be 10000 characters or fewer.'
    return
  }

  requestSubmitting.value = true
  requestError.value = ''
  requestSuccess.value = ''

  try {
    await userApi.sendIlluWrlRequest(requestModalUser.value._id, {
      message: requestMessage.value,
    })
    requestSuccess.value = `Request sent to ${getUserDisplayName(requestModalUser.value)}.`
    setTimeout(() => {
      closeIlluWrlRequest()
    }, 850)
  } catch (submitError) {
    requestError.value = submitError?.response?.data?.message || 'Failed to send request'
  } finally {
    requestSubmitting.value = false
  }
}

async function blockSearchUser(user) {
  if (!(await ensureAuthenticated())) {
    return
  }

  const confirmed = window.confirm(`Block ${getUserDisplayName(user)}? You will no longer follow each other, and pending requests will be cancelled.`)
  if (!confirmed) {
    closeUserMenu()
    return
  }

  blockSubmittingId.value = user._id
  requestError.value = ''

  try {
    await userApi.block(user._id)
    blockedUserIds.value = [...new Set([...blockedUserIds.value, user._id])]
  } catch (blockError) {
    userError.value = blockError?.response?.data?.message || 'Failed to block user'
  } finally {
    blockSubmittingId.value = ''
    closeUserMenu()
  }
}

function getUserDisplayName(user) {
  return user?.displayName || user?.username || 'Unknown user'
}

function getUserName(user) {
  return user?.username || 'member'
}

function getUserAvatar(user) {
  return user?.avatar || DEFAULT_PROFILE_AVATAR
}

function getShortUserBio(user) {
  const bio = String(user?.bio || '').trim()
  if (!bio) {
    return 'This creator has not added a short bio yet.'
  }

  return bio.length > 142 ? `${bio.slice(0, 142)}...` : bio
}

function handleAvatarError(event) {
  if (event.target?.src !== DEFAULT_PROFILE_AVATAR) {
    event.target.src = DEFAULT_PROFILE_AVATAR
  }
}

async function applySearchOptions(payload) {
  const query = {}
  const currentSimpleQuery = typeof route.query.q === 'string' ? route.query.q.trim() : ''

  if (currentSimpleQuery) {
    query.q = currentSimpleQuery
  }
  if (payload.type) {
    query.type = payload.type
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

async function loadSearchItems() {
  loading.value = true
  error.value = ''

  try {
    const q = searchKeyword.value
    const includeAllRaw = typeof route.query.qall === 'string' ? route.query.qall : ''
    const includeAnyRaw = typeof route.query.qany === 'string' ? route.query.qany : ''
    const excludeRaw = typeof route.query.qnot === 'string' ? route.query.qnot : ''
    const target = typeof route.query.target === 'string' ? route.query.target : 'all'

    const { data } = await getArtworks()
    const normalizedQuery = q.trim().toLowerCase()
    const includeAllTokens = [...normalizeKeywords(normalizedQuery), ...normalizeKeywords(includeAllRaw)]
    const includeAnyTokens = normalizeKeywords(includeAnyRaw)
    const excludeTokens = normalizeKeywords(excludeRaw)

    const baseItems = Array.isArray(data)
      ? data.map((item) => ({
          ...item,
          image: item.images?.[0] || '',
        }))
      : []

    searchItems.value = baseItems.filter((item) => {
      const haystack = buildTargetText(item, target)
      const matchesAll = includeAllTokens.every((token) => haystack.includes(token))
      const matchesAny = includeAnyTokens.length ? includeAnyTokens.some((token) => haystack.includes(token)) : true
      const matchesExclude = excludeTokens.every((token) => !haystack.includes(token))
      return matchesAll && matchesAny && matchesExclude
    })
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to fetch artworks'
    searchItems.value = []
  } finally {
    loading.value = false
  }
}

async function loadUserResults() {
  if (!isUserSearch.value) {
    userResults.value = []
    userTotal.value = 0
    userError.value = ''
    userLoading.value = false
    return
  }

  userLoading.value = true
  userError.value = ''

  try {
    const q = searchKeyword.value
    const { data } = await userApi.searchPublic({
      q: q || undefined,
      limit: 30,
    })

    const users = Array.isArray(data?.users) ? data.users : []
    userResults.value = users
    userTotal.value = typeof data?.total === 'number' ? data.total : users.length

    if (authStore.isAuthenticated) {
      await Promise.all(users.map((user) => followStore.fetchFollowStatus(user._id).catch(() => null)))
    }
  } catch (fetchError) {
    userError.value = fetchError?.response?.data?.message || 'Failed to fetch users'
    userResults.value = []
    userTotal.value = 0
  } finally {
    userLoading.value = false
  }
}

async function handleToggleFollow(userId) {
  if (!authStore.isAuthenticated) {
    await router.push({
      name: 'login',
      query: { redirect: route.fullPath },
    })
    return
  }

  await followStore.toggleFollowByUser(userId)
}

onMounted(() => {
  loadSearchItems()
  loadUserResults()
})

watch(
  () => route.query.order,
  (value) => {
    sortMode.value = value === 'popular' ? 'popular' : 'newest'
  },
)

watch(
  () => route.query,
  () => {
    loadSearchItems()
    loadUserResults()
  },
  { deep: true },
)
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="search-result-page page-block" :class="searchResultPageClass">
      <header class="result-header">
        <div class="result-title-stack">
          <h1>{{ keyword }}</h1>
          <p class="result-count-head">
            <strong v-if="isUserSearch">{{ resultTotal.toLocaleString() }}</strong>
            <template v-else>{{ resultTotal.toLocaleString() }}</template>
            {{ isUserSearch ? 'Accounts' : isNovelSearch ? 'novels' : 'works' }}
          </p>
        </div>
        <button v-if="!isUserSearch" type="button" class="show-tag-btn" @click="showTags = !showTags">
          {{ showTags ? 'Hide tag' : 'Show tag' }}
        </button>
      </header>

      <div class="tag-strip" v-if="!isUserSearch && showTags && displayTags.length">
        <button
          v-for="tag in displayTags"
          :key="tag"
          type="button"
          class="tag-chip"
          @click="applySearchTag(tag)"
        >
          #{{ tag }}
        </button>
      </div>

      <nav class="result-tabs" aria-label="Result tabs">
        <router-link
          v-for="tab in searchTypeTabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeType === tab.key }"
          :to="buildTypeRoute(tab.key)"
        >
          {{ tab.label }} <span v-if="!isUserSearch" class="tab-count">{{ tabCounts[tab.key].toLocaleString() }}</span>
        </router-link>
        <button v-if="!isUserSearch" type="button" class="search-option-note" @click="openSearchOptions">Search option</button>
      </nav>

      <div v-if="isUserSearch" class="user-search-filter-row">
        <div class="user-filter-tabs" aria-label="User search filters">
          <button type="button" class="user-filter-chip is-active">Creators</button>
          <button type="button" class="user-filter-link">All accounts</button>
        </div>
        <button type="button" class="search-option-note user-search-option" @click="openSearchOptions">
          <i class="fa-solid fa-list" aria-hidden="true"></i>
          Search option
        </button>
      </div>

      <div v-if="!isUserSearch" class="filter-row">
        <label class="order-select">
          <select v-model="sortMode" @change="handleSortChange">
            <option value="newest">Newest</option>
            <option value="popular">Sort by popularity</option>
          </select>
        </label>
        <button type="button" class="filter-chip" :class="{ 'is-active': ageFilter === 'safe' }" @click="setAgeFilter('safe')">All-Ages</button>
        <button type="button" class="filter-chip" :class="{ 'is-active': ageFilter === 'r18' }" @click="setAgeFilter('r18')">R-18</button>
        <button type="button" class="filter-chip" :class="{ 'is-active': ageFilter === 'all' }" @click="setAgeFilter('all')">All</button>
        <span class="include-note">Tag match mode: {{ currentSearchOptions.target === 'all' ? 'all fields' : currentSearchOptions.target }}</span>

        <!-- Novel-specific filter controls -->
        <template v-if="isNovelSearch">
          <span class="filter-separator" aria-hidden="true"></span>
          <label class="novel-sort-select">
            <select v-model="novelSortBy">
              <option value="newest">Newest</option>
              <option value="views">Most viewed</option>
              <option value="likes">Most liked</option>
              <option value="longest">Longest</option>
              <option value="shortest">Shortest</option>
            </select>
          </label>
          <div class="novel-format-tabs">
            <button
              type="button"
              class="format-chip"
              :class="{ 'is-active': novelFormatFilter === 'all' }"
              @click="novelFormatFilter = 'all'"
            >All</button>
            <button
              type="button"
              class="format-chip"
              :class="{ 'is-active': novelFormatFilter === 'oneshot' }"
              @click="novelFormatFilter = 'oneshot'"
            >One-shot</button>
            <button
              type="button"
              class="format-chip"
              :class="{ 'is-active': novelFormatFilter === 'series' }"
              @click="novelFormatFilter = 'series'"
            >Series</button>
          </div>
          <label class="word-range-label">
            <input
              v-model="novelMinWords"
              type="number"
              class="word-range-input"
              placeholder="Min words"
              min="0"
            />
            <span class="word-range-sep">–</span>
            <input
              v-model="novelMaxWords"
              type="number"
              class="word-range-input"
              placeholder="Max words"
              min="0"
            />
          </label>
        </template>
      </div>

      <template v-if="isUserSearch">
        <p v-if="userLoading" class="state-note">Loading users...</p>
        <p v-else-if="userError" class="state-note error">{{ userError }}</p>
        <section v-else-if="enrichedUserResults.length" class="user-result-section">
          <h2>User <span>{{ resultTotal.toLocaleString() }}</span></h2>

          <article v-for="user in enrichedUserResults" :key="user._id" class="user-search-row">
            <div class="user-profile-column">
              <img :src="getUserAvatar(user)" :alt="getUserDisplayName(user)" class="avatar avatar--xl user-avatar-large" @error="handleAvatarError" />
              <div class="user-profile-copy">
                <h3>{{ getUserDisplayName(user) }}</h3>
                <p class="user-bio">{{ getShortUserBio(user) }}</p>
                <div class="user-actions">
                  <button
                    type="button"
                    class="follow-btn-large"
                    :class="{ 'is-following': followStore.isFollowingUser(user._id) }"
                    :disabled="followStore.isTogglingFollow(user._id)"
                    @click="handleToggleFollow(user._id)"
                  >
                    {{ followStore.isFollowingUser(user._id) ? 'Following' : 'Follow' }}
                  </button>
                  <div class="user-more-wrap">
                    <button
                      type="button"
                      class="more-user-btn"
                      :aria-label="`More actions for ${getUserDisplayName(user)}`"
                      :aria-expanded="activeUserMenuId === user._id"
                      @click="toggleUserMenu(user._id)"
                    >
                    <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
                    </button>
                    <div v-if="activeUserMenuId === user._id" class="user-action-menu" role="menu">
                      <button type="button" role="menuitem" @click="closeUserMenu">Follow privately</button>
                      <button type="button" role="menuitem" @click="openIlluWrlRequest(user)">IlluWrl request</button>
                      <span class="menu-separator" aria-hidden="true"></span>
                      <button type="button" role="menuitem" @click="closeUserMenu">Mute setting</button>
                      <button type="button" role="menuitem" :disabled="blockSubmittingId === user._id" @click="blockSearchUser(user)">
                        {{ blockSubmittingId === user._id ? 'Blocking...' : 'Block' }}
                      </button>
                      <button type="button" role="menuitem" @click="closeUserMenu">Report a problem</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="user-preview-rail">
              <router-link
                v-for="item in user.previews.slice(0, 4)"
                :key="item._id"
                :to="`/artworks/${item._id}`"
                class="user-preview-card"
              >
                <div class="user-preview-thumb">
                  <img v-if="item.image" :src="item.image" :alt="item.title || 'Artwork preview'" loading="lazy" />
                  <div v-else class="user-preview-fallback"></div>
                  <i class="fa-regular fa-heart preview-heart" aria-hidden="true"></i>
                </div>
                <strong>{{ item.title || 'Untitled work' }}</strong>
              </router-link>

              <div v-for="idx in Math.max(0, 4 - user.previews.length)" :key="`empty-preview-${user._id}-${idx}`" class="user-preview-card user-preview-card--empty">
                <div class="user-preview-thumb user-preview-fallback"></div>
                <strong>No public work yet</strong>
              </div>
            </div>
          </article>
        </section>
        <p v-else class="state-note">No users found for this search.</p>
      </template>
      <template v-else-if="isNovelSearch">
        <p v-if="loading" class="state-note">Loading novels...</p>
        <p v-else-if="error" class="state-note error">{{ error }}</p>

        <p v-else-if="!visibleItems.length" class="state-note">No novels found for this tag. Try another keyword or search option.</p>

        <div v-else class="novel-result-stack">
          <div class="novel-section-head">
            <h2>{{ novelSortLabel }}</h2>
            <span>{{ visibleItems.length.toLocaleString() }} entries</span>
          </div>

          <article v-for="item in visibleItems" :key="item._id" class="novel-card" style="position:relative;">
            <router-link :to="`/artworks/${item._id}`" class="novel-cover">
              <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
              <div v-else class="novel-cover-fallback">
                <i class="fa-solid fa-book-open" aria-hidden="true"></i>
              </div>
              <!-- Format badge -->
              <span v-if="item.novelFormat === 'series'" class="novel-cover-badge">Series</span>
              <span v-else class="novel-cover-badge">One-shot</span>
              <!-- Word count badge -->
              <span v-if="item.wordCount > 0" class="novel-word-badge">
                <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
                {{ (item.wordCount || 0).toLocaleString() }}
              </span>
            </router-link>
            <div class="novel-body">
              <div class="novel-title-row">
                <img v-if="item.user" :src="item.user?.avatar || item.user?.profileImage || item.user?.image || ''" alt="author avatar" class="novel-author-avatar" />
                <router-link :to="`/artworks/${item._id}`" class="novel-title">{{ item.title }}</router-link>
              </div>
              <div class="novel-author-row">
                <router-link :to="`/account?user=${item.user?._id}`" class="novel-author">{{ item.user?.displayName || item.user?.username || 'Unknown writer' }}</router-link>
              </div>
              <p class="novel-excerpt">{{ item.description ? item.description.slice(0, 150) + (item.description.length > 150 ? '...' : '') : 'No synopsis has been added for this novel yet.' }}</p>
              <div class="novel-tags" v-if="item.tags?.length">
                <button
                  v-for="tag in item.tags.slice(0, 6)"
                  :key="tag._id || tag.name"
                  type="button"
                  @click="applySearchTag(tag.name)"
                >
                  #{{ tag.name }}
                </button>
              </div>
              <footer class="novel-meta">
                <span class="novel-meta-stat">
                  <i class="fa-regular fa-eye" aria-hidden="true"></i>
                  {{ (item.viewCount || 0).toLocaleString() }}
                </span>
                <span class="novel-meta-stat">
                  <i class="fa-regular fa-heart" aria-hidden="true"></i>
                  {{ (item.likeCount || 0).toLocaleString() }}
                </span>
                <span class="novel-meta-stat">
                  <i class="fa-regular fa-bookmark" aria-hidden="true"></i>
                  {{ (item.bookmarkCount || 0).toLocaleString() }}
                </span>
                <span v-if="item.wordCount > 0" class="novel-meta-stat">
                  <i class="fa-regular fa-clock" aria-hidden="true"></i>
                  {{ Math.ceil((item.wordCount || 0) / 200) }} min read
                </span>
                <span v-if="item.novelFormat === 'series'" class="novel-meta-stat">
                  {{ item.chapterCount || 1 }} {{ (item.chapterCount || 1) > 1 ? 'chapters' : 'chapter' }}
                </span>
                <span>{{ new Date(item.createdAt || Date.now()).toLocaleDateString() }}</span>
              </footer>
            </div>
            <button type="button" class="novel-bookmark-btn" :aria-label="`bookmark-${item._id}`">
              <i class="fa-regular fa-bookmark"></i>
            </button>
          </article>
        </div>
      </template>
      <template v-else>
        <p v-if="loading" class="state-note">Loading results...</p>
        <p v-else-if="error" class="state-note error">{{ error }}</p>

        <p v-else-if="!visibleItems.length" class="state-note">No works found for this filter. Try another tag or switch tab.</p>

        <div v-else class="result-grid-wrap">
          <article v-for="item in visibleItems" :key="item._id" class="result-card">
            <router-link :to="`/artworks/${item._id}`" class="thumb-link">
              <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
              <div v-else class="thumb-fallback"></div>
            </router-link>
            <router-link :to="`/artworks/${item._id}`" class="title-link">{{ item.title }}</router-link>
            <p class="author-name">{{ item.user?.displayName || item.user?.username || 'Unknown artist' }}</p>
          </article>

          <article v-for="idx in placeholderCount" :key="`placeholder-${idx}`" class="result-card placeholder-card">
            <div class="thumb-placeholder"></div>
            <div class="line-placeholder long"></div>
            <div class="line-placeholder short"></div>
          </article>
        </div>
      </template>

      <SearchOptionsModal
        v-model="isSearchOptionsOpen"
        :initial-values="searchOptionsDraft"
        @apply="applySearchOptions"
      />

      <div v-if="requestModalUser" class="request-modal-backdrop" role="presentation" @click.self="closeIlluWrlRequest">
        <section class="illuwrl-request-modal" role="dialog" aria-modal="true" aria-labelledby="illuwrl-request-title">
          <button type="button" class="request-modal-close" aria-label="Close request dialog" @click="closeIlluWrlRequest">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
          <h2 id="illuwrl-request-title">Request as IlluWrl</h2>
          <p>You will send an IlluWrl request to {{ requestModalUserName }}.</p>
          <label class="request-message-box" aria-label="Enter a message">
            <textarea
              v-model="requestMessage"
              maxlength="10000"
              placeholder="Enter a message"
              :disabled="requestSubmitting"
            ></textarea>
            <span>{{ requestMessageCount }}/10000</span>
          </label>
          <p v-if="requestError" class="request-feedback request-feedback--error">{{ requestError }}</p>
          <p v-if="requestSuccess" class="request-feedback request-feedback--success">{{ requestSuccess }}</p>
          <button type="button" class="request-submit-btn" :disabled="requestSubmitting || requestMessageCount > 10000" @click="submitIlluWrlRequest">
            {{ requestSubmitting ? 'Requesting...' : 'Request' }}
          </button>
          <button type="button" class="request-cancel-btn" :disabled="requestSubmitting" @click="closeIlluWrlRequest">Cancel</button>
        </section>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.search-result-page {
  display: grid;
  gap: 0.95rem;
  padding: 1.05rem 1.15rem 1.25rem;
}

.search-result-page--users {
  gap: 1.55rem;
  width: calc(100% + 144px);
  margin: 0 -72px;
  padding: 1.35rem 1.8rem 1.75rem;
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: #fff;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  justify-content: space-between;
}

.result-title-stack {
  display: flex;
  align-items: baseline;
  gap: 0.72rem;
  min-width: 0;
}

.search-result-page--users .result-title-stack {
  display: grid;
  align-items: start;
  gap: 0.48rem;
}

.result-header h1 {
  margin: 0;
  text-transform: lowercase;
  font-size: 2rem;
  color: #111827;
}

.search-result-page--users .result-header h1 {
  font-size: 1.45rem;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: 0;
}

.result-count-head {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 700;
}

.search-result-page--users .result-count-head {
  color: #6b7280;
  font-size: 1.08rem;
  font-weight: 500;
}

.search-result-page--users .result-count-head strong {
  color: #334155;
  font-weight: 800;
}

.show-tag-btn {
  border: none;
  background: transparent;
  color: #475569;
  font-weight: 600;
  font-size: 0.88rem;
}

.tag-strip {
  display: flex;
  gap: 0.52rem;
  overflow: auto;
  padding-bottom: 0.3rem;
}

.tag-chip {
  border: none;
  color: #fff;
  border-radius: 4px;
  padding: 0.38rem 0.75rem;
  white-space: nowrap;
  font-size: 0.84rem;
  font-weight: 700;
}

.tag-chip:nth-child(5n + 1) { background: #94b96d; }
.tag-chip:nth-child(5n + 2) { background: #66b4b1; }
.tag-chip:nth-child(5n + 3) { background: #9a73c9; }
.tag-chip:nth-child(5n + 4) { background: #6f84c8; }
.tag-chip:nth-child(5n + 5) { background: #c48f75; }

.result-tabs {
  display: flex;
  align-items: flex-end;
  gap: 1.35rem;
  border-bottom: 1px solid #e2e8f0;
}

.search-result-page--users .result-tabs {
  width: min(560px, 100%);
  gap: 3.75rem;
  border-bottom: none;
  align-items: stretch;
  margin-top: -0.35rem;
}

.tab-item {
  text-decoration: none;
  padding-bottom: 0.62rem;
  color: #64748b;
  font-weight: 700;
  border-bottom: 3px solid transparent;
}

.search-result-page--users .tab-item {
  position: relative;
  padding: 1rem 0 0;
  min-width: 4.55rem;
  color: #7a7f87;
  text-align: center;
  font-size: 1.08rem;
  line-height: 1;
}

.search-result-page--users .tab-item.active {
  color: #111827;
  border-bottom-color: transparent;
}

.search-result-page--users .tab-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 6.4rem;
  max-width: 100%;
  height: 4px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #1695f0;
}

.tab-count {
  color: #94a3b8;
  font-size: 0.72rem;
  margin-left: 0.2rem;
}

.tab-item.active {
  color: #0f172a;
  border-bottom-color: #1695f0;
}

.tab-muted {
  color: #9ca3af;
}

.search-option-note {
  margin-left: auto;
  border: none;
  background: transparent;
  color: #4b5563;
  font-weight: 700;
}

.user-search-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.15rem;
}

.user-filter-tabs {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-filter-chip,
.user-filter-link {
  border: none;
  font-size: 0.92rem;
  font-weight: 800;
}

.user-filter-chip {
  min-width: 128px;
  border-radius: 999px;
  padding: 0.86rem 1.45rem;
  background: #f5f5f5;
  color: #333;
}

.user-filter-link {
  background: transparent;
  color: #70757d;
}

.user-search-option {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  margin-left: 0;
  color: #333;
  font-size: 0.92rem;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.order-select select {
  border: none;
  background: #f8fafc;
  border-radius: 999px;
  padding: 0.35rem 0.62rem;
  font-weight: 700;
  color: #374151;
}

.filter-chip {
  border: none;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.78rem;
  padding: 0.3rem 0.58rem;
}

.filter-chip.is-active {
  color: #2563eb;
  background: #eff6ff;
}

.include-note {
  color: #6b7280;
  font-size: 0.8rem;
}

.filter-separator {
  display: inline-block;
  width: 1px;
  height: 1.2rem;
  background: #d1d5db;
  margin: 0 0.35rem;
}

.novel-sort-select select {
  border: none;
  background: #f8fafc;
  border-radius: 999px;
  padding: 0.35rem 0.62rem;
  font-weight: 700;
  color: #374151;
  font-size: 0.78rem;
}

.novel-format-tabs {
  display: inline-flex;
  gap: 0.2rem;
}

.format-chip {
  border: none;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.78rem;
  padding: 0.3rem 0.58rem;
  font-weight: 700;
  cursor: pointer;
}

.format-chip.is-active {
  color: #2563eb;
  background: #eff6ff;
}

.word-range-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.word-range-input {
  width: 72px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.28rem 0.45rem;
  font-size: 0.78rem;
  color: #374151;
  background: #fff;
}

.word-range-input::placeholder {
  color: #9ca3af;
}

.word-range-sep {
  color: #9ca3af;
  font-size: 0.82rem;
}

.state-note {
  margin: 0;
  color: #64748b;
}

.state-note.error {
  color: #dc2626;
}

.user-result-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.user-result-section {
  display: grid;
  gap: 1.8rem;
  border-bottom: 1px solid #eef0f3;
  padding-bottom: 1.75rem;
}

.user-result-section h2 {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  color: #111827;
  font-size: 1.45rem;
  line-height: 1;
  font-weight: 800;
}

.user-result-section h2 span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.68rem;
  height: 1.68rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: #a9aeb5;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 800;
}

.user-search-row {
  display: grid;
  grid-template-columns: minmax(360px, 32vw) minmax(0, 1fr);
  gap: 3rem;
  align-items: start;
}

.user-profile-column {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 1.22rem;
  align-items: start;
  min-width: 0;
}

.user-profile-copy {
  display: grid;
  gap: 0.68rem;
  min-width: 0;
}

.user-profile-copy h3 {
  margin: 0;
  color: #111827;
  font-size: 1.08rem;
  line-height: 1.2;
  font-weight: 800;
}

.user-bio {
  margin: 0;
  max-width: 360px;
  color: #2f3540;
  font-size: 0.88rem;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-top: 0.2rem;
}

.follow-btn-large {
  min-width: 114px;
  border: none;
  border-radius: 999px;
  padding: 0.72rem 1.35rem;
  background: #1695f0;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
}

.follow-btn-large.is-following {
  background: #e5e7eb;
  color: #334155;
}

.more-user-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #858b93;
  font-size: 1.05rem;
}

.user-more-wrap {
  position: relative;
}

.user-action-menu {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.55rem);
  z-index: 20;
  display: grid;
  min-width: 202px;
  padding: 0.85rem 0.7rem;
  border: 1px solid #e4e7eb;
  border-radius: 9px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
  transform: translateX(-50%);
}

.user-action-menu button {
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #333;
  padding: 0.68rem 0.72rem;
  text-align: left;
  font-size: 1rem;
  line-height: 1.2;
}

.user-action-menu button:hover,
.user-action-menu button:focus-visible {
  background: #f5f5f5;
}

.user-action-menu button:disabled {
  color: #9ca3af;
}

.menu-separator {
  height: 1px;
  margin: 0.42rem 0.35rem;
  background: #e5e7eb;
}

.user-preview-rail {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 1.9rem;
  min-width: 0;
}

.user-preview-card {
  display: grid;
  gap: 0.72rem;
  min-width: 0;
  color: #111827;
  text-decoration: none;
}

.user-preview-thumb {
  position: relative;
  aspect-ratio: 1.38 / 1;
  border-radius: 6px;
  overflow: hidden;
  background: #f6f6f6;
}

.user-preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-preview-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
}

.preview-heart {
  position: absolute;
  right: 0.35rem;
  bottom: 0.28rem;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #222;
  font-size: 1.55rem;
  filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.65));
}

.user-preview-card strong {
  color: #111827;
  font-size: 0.95rem;
  line-height: 1.22;
  font-weight: 800;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.user-preview-card--empty {
  opacity: 0.72;
}

.user-search-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 0.9rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.user-search-card :deep(.follow-user-card) {
  border-top: none;
  padding-top: 0;
}

.user-search-card :deep(.preview-grid) {
  margin-top: 0.4rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.request-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.45);
}

.illuwrl-request-modal {
  position: relative;
  width: min(550px, 100%);
  display: grid;
  gap: 1rem;
  border-radius: 24px;
  background: #fff;
  padding: 1.8rem 1.9rem 2rem;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.2);
}

.illuwrl-request-modal h2 {
  margin: 0;
  color: #2f2f2f;
  text-align: center;
  font-size: 1.08rem;
  font-weight: 800;
}

.illuwrl-request-modal p {
  margin: 0;
  color: #555;
  font-size: 1rem;
  line-height: 1.45;
}

.request-modal-close {
  position: absolute;
  top: 0.65rem;
  right: 0.85rem;
  border: none;
  background: transparent;
  color: #aaa;
  font-size: 1.85rem;
  line-height: 1;
}

.request-message-box {
  display: grid;
  border-radius: 5px;
  background: #f5f5f5;
  overflow: hidden;
}

.request-message-box textarea {
  min-height: 128px;
  resize: vertical;
  border: none;
  background: transparent;
  color: #333;
  padding: 1rem 0.95rem 0.35rem;
  font: inherit;
  line-height: 1.45;
}

.request-message-box textarea:focus {
  outline: none;
}

.request-message-box textarea::placeholder {
  color: #858585;
}

.request-message-box span {
  justify-self: end;
  padding: 0 0.7rem 0.75rem;
  color: #858585;
  font-size: 0.95rem;
}

.request-feedback {
  border-radius: 7px;
  padding: 0.62rem 0.8rem;
  font-weight: 700;
}

.request-feedback--error {
  background: #fef2f2;
  color: #dc2626;
}

.request-feedback--success {
  background: #ecfdf5;
  color: #059669;
}

.request-submit-btn,
.request-cancel-btn {
  min-height: 50px;
  border: none;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 800;
}

.request-submit-btn {
  margin-top: 0.35rem;
  background: #a8dcfb;
  color: #fff;
}

.request-submit-btn:not(:disabled):hover {
  background: #1695f0;
}

.request-submit-btn:disabled {
  opacity: 0.74;
}

.request-cancel-btn {
  background: #f5f5f5;
  color: #4b4b4b;
}

.novel-result-stack {
  display: grid;
  gap: 0.8rem;
  max-width: 920px;
}

.novel-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.2rem;
}

.novel-section-head h2 {
  margin: 0;
  color: #111827;
  font-size: 1.08rem;
  font-weight: 800;
}

.novel-section-head span {
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 700;
}

.novel-card {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 0.6rem;
  border-bottom: 1px solid #edf2f7;
  padding: 0.3rem 0 0.8rem;
  align-items: start;
}

.novel-cover {
  display: block;
  width: 80px;
  height: 112px;
  border-radius: 8px;
  overflow: hidden;
  background: #eef2f7;
  text-decoration: none;
  position: relative;
}

.novel-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.novel-cover-fallback {
  height: 100%;
  display: grid;
  place-items: center;
  color: #94a3b8;
  font-size: 1.4rem;
  background:
    linear-gradient(135deg, rgba(22, 149, 240, 0.06), rgba(148, 185, 109, 0.08)),
    #f8fafc;
}

.novel-body {
  display: grid;
  align-content: start;
  gap: 0.25rem;
  min-width: 0;
}

.novel-title {
  color: #111827;
  text-decoration: none;
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.2;
  display: inline-block;
  vertical-align: middle;
}

.novel-title:hover {
  color: #1695f0;
}

.novel-excerpt {
  margin: 0;
  color: #4b5563;
  font-size: 0.82rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.novel-title-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.novel-author-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  flex: 0 0 28px;
}

.novel-author-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.novel-bookmark-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #111827;
}

.novel-cover-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 0.64rem;
  font-weight: 700;
  line-height: 1.2;
  pointer-events: none;
}

.novel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.novel-tags button {
  border: none;
  border-radius: 4px;
  background: #f1f5f9;
  color: #2563eb;
  padding: 0.22rem 0.42rem;
  font-size: 0.74rem;
  font-weight: 700;
}

.novel-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  color: #94a3b8;
  font-size: 0.74rem;
  font-weight: 700;
}

.novel-meta-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
}

.novel-meta-stat i {
  font-size: 0.7rem;
}

.novel-author {
  color: #2563eb;
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
}

.novel-author:hover {
  text-decoration: underline;
}

.novel-cover-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.3;
  pointer-events: none;
}

.novel-word-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.3;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.novel-word-badge i {
  font-size: 0.6rem;
}

.novel-cover {
  position: relative;
}

.result-grid-wrap {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.72rem;
}

.result-card {
  display: grid;
  gap: 0.3rem;
}

.thumb-link {
  display: block;
  border-radius: 6px;
  overflow: hidden;
  background: #e5e7eb;
  aspect-ratio: 1 / 1;
}

.thumb-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #cbd5e1, #e2e8f0);
}

.title-link {
  text-decoration: none;
  color: #111827;
  font-size: 0.77rem;
  font-weight: 700;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.author-name {
  margin: 0;
  color: #6b7280;
  font-size: 0.7rem;
}

.placeholder-card {
  opacity: 0.55;
}

.thumb-placeholder {
  border-radius: 6px;
  background: #e5e7eb;
  aspect-ratio: 1 / 1;
}

.line-placeholder {
  border-radius: 999px;
  background: #e5e7eb;
  height: 8px;
}

.line-placeholder.long {
  width: 90%;
}

.line-placeholder.short {
  width: 62%;
}

@media (max-width: 1200px) {
  .search-result-page--users {
    width: calc(100% + 80px);
    margin: 0 -40px;
  }

  .user-search-row {
    grid-template-columns: minmax(320px, 36vw) minmax(0, 1fr);
    gap: 1.5rem;
  }

  .user-preview-rail {
    gap: 1rem;
  }

  .result-grid-wrap {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .search-result-page {
    padding: 0.86rem;
  }

  .search-result-page--users {
    width: calc(100% + 36px);
    margin: 0 -18px;
    padding: 1rem 1rem 1.35rem;
  }

  .result-title-stack {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.15rem;
  }

  .user-result-list {
    grid-template-columns: 1fr;
  }

  .search-result-page--users .result-tabs {
    gap: 1.2rem;
    overflow-x: auto;
    width: 100%;
  }

  .user-search-filter-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .user-search-row {
    grid-template-columns: 1fr;
    gap: 1.1rem;
  }

  .user-profile-column {
    grid-template-columns: 74px minmax(0, 1fr);
    gap: 0.85rem;
  }

  .user-avatar-large {
    width: 74px;
    height: 74px;
  }

  .user-preview-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .novel-card {
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 0.68rem;
  }

  .result-grid-wrap {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
