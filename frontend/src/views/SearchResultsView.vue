<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchOptionsModal from '../components/search/SearchOptionsModal.vue'
import SearchResultHeader from '../components/search/SearchResultHeader.vue'
import SearchFilterBar from '../components/search/SearchFilterBar.vue'
import UserSearchFilters from '../components/search/UserSearchFilters.vue'
import UserSearchResults from '../components/search/UserSearchResults.vue'
import NovelSearchResults from '../components/search/NovelSearchResults.vue'
import ArtworkSearchResults from '../components/search/ArtworkSearchResults.vue'
import { getArtworks, userApi } from '../services/api'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'

import { useAuthStore } from '../stores/auth.store'
import { useFollowStore } from '../stores/follow.store'

import { formatShortDate } from '../utils/date.js'
import { useTagStore } from '../stores/tag.store'

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
const blockSubmittingId = ref('')
const sortMode = computed(() => {
  const order = typeof route.query.order === 'string' ? route.query.order : 'newest'
  return order === 'popular' ? 'popular' : 'newest'
})
const showTags = ref(true)
const isSearchOptionsOpen = ref(false)
const userFilterType = ref('creator')
const userSortMode = ref('newest')
const userPage = ref(1)
const userHasMore = ref(false)
const userLoadingMore = ref(false)

const tagStore = useTagStore()

const isTagContext = computed(() => route.query.tag === '1')

// Favorite tag (localStorage-based, same as TagDetailView)
const FAVORITE_TAG_KEY = 'illuwrl.favoriteTags'
const favoriteTagKey = computed(() => {
  const userId = authStore.user?._id || 'guest'
  return `${FAVORITE_TAG_KEY}.${userId}`
})
const isFavoriteTag = ref(false)

const tagNameForFav = computed(() => searchKeyword.value.trim())

function loadFavoriteTagStatus() {
  if (!tagNameForFav.value) {
    isFavoriteTag.value = false
    return
  }
  try {
    const raw = localStorage.getItem(favoriteTagKey.value)
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) {
      isFavoriteTag.value = false
      return
    }
    isFavoriteTag.value = parsed.some((tag) => tag?.label === tagNameForFav.value)
  } catch (_error) {
    isFavoriteTag.value = false
  }
}

async function toggleFavoriteTag() {
  if (!authStore.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (!tagNameForFav.value) return
  try {
    const raw = localStorage.getItem(favoriteTagKey.value)
    const parsed = JSON.parse(raw || '[]')
    const list = Array.isArray(parsed) ? parsed.filter((t) => t?.label) : []
    const existingIndex = list.findIndex((t) => t.label === tagNameForFav.value)
    if (existingIndex >= 0) {
      list.splice(existingIndex, 1)
      localStorage.setItem(favoriteTagKey.value, JSON.stringify(list))
      isFavoriteTag.value = false
      return
    }
    if (list.length >= 10) return
    list.unshift({ label: tagNameForFav.value, sub: `#${tagNameForFav.value}` })
    localStorage.setItem(favoriteTagKey.value, JSON.stringify(list))
    isFavoriteTag.value = true
  } catch (_error) {
    // Ignore storage errors.
  }
}

const novelSortBy = ref('newest')
const novelMinWords = ref('')
const novelMaxWords = ref('')
const searchOptionsDraft = ref({
  includeAll: '',
  includeAny: '',
  exclude: '',
  target: 'tag_partial',
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
  target: typeof route.query.target === 'string' ? route.query.target : 'tag_partial',
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
  const bucket = {}
  for (const item of searchItems.value) {
    for (const tag of item.tags || []) {
      const name = tag?.name?.trim()
      if (!name) continue
      const normalized = name.toLowerCase()
      const existing = bucket[normalized]
      bucket[normalized] = {
        label: name,
        count: (existing?.count || 0) + 1,
      }
    }
  }
  return Object.values(bucket)
    .toSorted((a, b) => b.count - a.count)
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
  const counts = { illust: 0, manga: 0, novel: 0 }
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

const processedSearchTypeTabs = computed(() =>
  searchTypeTabs.map(tab => ({
    ...tab,
    _route: buildTypeRoute(tab.key),
    _count: tabCounts.value[tab.key]?.toLocaleString(),
  }))
)

const visibleItems = computed(() => {
  const source = searchItems.value.filter((item) => {
    if (activeType.value && item.type !== activeType.value) return false
    const isR18 = item.ageRating === 'r-18' || item.isR18 === true
    if (ageFilter.value === 'safe' && isR18) return false
    if (ageFilter.value === 'r18' && !isR18) return false
    return true
  })
  if (sortMode.value === 'popular') {
    return source.toSorted((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
  }
  return source.toSorted((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
})

const processedVisibleItems = computed(() =>
  visibleItems.value.map(item => ({
    ...item,
    _excerpt: item.description
      ? item.description.slice(0, 150) + (item.description.length > 150 ? '...' : '')
      : 'No synopsis has been added for this novel yet.',
    _tags: (item.tags || []).slice(0, 6),
    _readTime: Math.ceil((item.wordCount || 0) / 200),
    _formattedDate: formatShortDate(item.createdAt),
  }))
)

const resultTotal = computed(() => (isUserSearch.value ? userCount.value : visibleItems.value.length))

const normalizedArtworkItems = computed(() =>
  searchItems.value.map((item) => ({
    ...item,
    image: item.image || item.images?.[0] || '',
  }))
)

const userPreviewMap = computed(() => {
  const previews = {}
  for (const item of normalizedArtworkItems.value) {
    const userId = item.user?._id
    if (!userId) continue
    const existing = previews[userId] || []
    if (existing.length >= 4) continue
    previews[userId] = [...existing, item]
  }
  return new Map(Object.entries(previews))
})

const enrichedUserResults = computed(() =>
  userResults.value
    .filter((user) => !blockedUserIds.value.includes(user._id))
    .map((user) => ({
      ...user,
      previews: userPreviewMap.value.get(user._id) || [],
      _avatar: getUserAvatar(user),
      _displayName: getUserDisplayName(user),
      _shortBio: getShortUserBio(user),
    }))
)

const novelSortLabel = computed(() => (sortMode.value === 'popular' ? 'Popular novels' : 'Newest novels'))

const searchResultPageClass = computed(() => ({
  'search-result-page--users': isUserSearch.value,
}))

const placeholderCount = computed(() => {
  if (loading.value || error.value || !visibleItems.value.length) return 0
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
  if (target === 'title') return title.toLowerCase()
  if (target === 'tags') return tags.toLowerCase()
  if (target === 'artist') return author.toLowerCase()
  if (target === 'description') return description.toLowerCase()
  if (target === 'title_caption') return `${title} ${description}`.toLowerCase()
  if (target === 'tag_partial' || target === 'tag_exact') return tags.toLowerCase()
  return `${title} ${description} ${tags} ${author}`.toLowerCase()
}

function buildTypeRoute(type) {
  if (type === 'user') {
    return {
      path: '/search/users',
      query: searchKeyword.value
        ? { nick: searchKeyword.value, s_mode: 's_usr' }
        : { s_mode: 's_usr' },
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

async function handleFilterSortChange(value) {
  const query = { ...route.query, order: value === 'newest' ? undefined : value }
  await router.replace({ path: '/search', query })
}

async function handleAgeFilterChange(value) {
  const query = { ...route.query, age: value === 'all' ? undefined : value }
  await router.replace({ path: '/search', query })
}

async function applySearchTag(tagLabel) {
  await router.push({ path: '/search', query: { ...route.query, q: tagLabel } })
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
  if (authStore.isAuthenticated) return true
  await router.push({ name: 'login', query: { redirect: route.fullPath } })
  return false
}

async function blockSearchUser(user) {
  if (!(await ensureAuthenticated())) return
  const confirmed = window.confirm(`Block ${getUserDisplayName(user)}? You will no longer follow each other, and pending requests will be cancelled.`)
  if (!confirmed) { closeUserMenu(); return }
  blockSubmittingId.value = user._id
  userError.value = ''
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

function getUserAvatar(user) {
  return user?.avatar || DEFAULT_PROFILE_AVATAR
}

function getShortUserBio(user) {
  const bio = String(user?.bio || '').trim()
  if (!bio) return 'This creator has not added a short bio yet.'
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
  if (currentSimpleQuery) query.q = currentSimpleQuery
  if (payload.type) query.type = payload.type
  if (payload.includeAll) query.qall = payload.includeAll
  if (payload.includeAny) query.qany = payload.includeAny
  if (payload.exclude) query.qnot = payload.exclude
  if (payload.target && payload.target !== 'all') query.target = payload.target
  await router.push({ path: '/search', query })
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
    const baseItems = Array.isArray(data) ? data.map((item) => ({ ...item, image: item.images?.[0] || '' })) : []
    const isExactTag = target === 'tag_exact'
    searchItems.value = baseItems.filter((item) => {
      const haystack = buildTargetText(item, target)
      const itemTagNames = (item.tags || []).map(t => t?.name?.toLowerCase()).filter(Boolean)

      function tokenMatches(token) {
        if (isExactTag) {
          return itemTagNames.includes(token)
        }
        return haystack.includes(token)
      }

      const matchesAll = includeAllTokens.every(tokenMatches)
      const matchesAny = includeAnyTokens.length ? includeAnyTokens.some(tokenMatches) : true
      const matchesExclude = excludeTokens.every((token) => !tokenMatches(token))
      return matchesAll && matchesAny && matchesExclude
    })
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to fetch artworks'
    searchItems.value = []
  } finally {
    loading.value = false
  }
}

async function loadUserResults(loadMore) {
  if (!loadMore) userPage.value = 1
  userLoading.value = !loadMore
  userError.value = ''
  try {
    const q = searchKeyword.value
    const params = {
      q: q || undefined,
      limit: 30,
      page: userPage.value,
      sort: userSortMode.value,
      role: userFilterType.value,
    }
    const { data } = await userApi.searchPublic(params)
    const users = Array.isArray(data?.users) ? data.users : []
    if (loadMore) {
      userResults.value = [...userResults.value, ...users]
    } else {
      userResults.value = users
    }
    userTotal.value = typeof data?.total === 'number' ? data.total : users.length
    userHasMore.value = typeof data?.pages === 'number' ? data.page < data.pages : false
    if (authStore.isAuthenticated) {
      await Promise.all(users.map((user) => followStore.fetchFollowStatus(user._id).catch(() => null)))
    }
  } catch (fetchError) {
    userError.value = fetchError?.response?.data?.message || 'Failed to fetch users'
    if (!loadMore) {
      userResults.value = []
      userTotal.value = 0
    }
    userHasMore.value = false
  } finally {
    userLoading.value = false
    userLoadingMore.value = false
  }
}

async function handleToggleFollow(userId) {
  if (!authStore.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  await followStore.toggleFollowByUser(userId)
}

async function loadMoreUsers() {
  if (userLoadingMore.value || !userHasMore.value) return
  userLoadingMore.value = true
  userPage.value++
  await loadUserResults(true)
  userLoadingMore.value = false
}

function reloadUserSearch() {
  userPage.value = 1
  userResults.value = []
  userHasMore.value = false
  loadUserResults()
}

onMounted(() => {
  loadSearchItems()
  loadUserResults()
  if (searchKeyword.value) {
    tagStore.fetchTagDetail(searchKeyword.value)
    loadFavoriteTagStatus()
  }
})

watch(
  () => ({ ...route.query }),
  () => {
    loadSearchItems()
    loadUserResults()
    if (searchKeyword.value) {
      tagStore.fetchTagDetail(searchKeyword.value)
      loadFavoriteTagStatus()
    }
  },
)
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="search-result-page page-block" :class="searchResultPageClass">
      <SearchResultHeader
        :keyword="keyword"
        :result-total="resultTotal"
        :is-user-search="isUserSearch"
        :is-novel-search="isNovelSearch"
        :show-tags="showTags"
        :display-tags="displayTags"
        :show-favorite-tag="!!searchKeyword && !isUserSearch"
        :is-favorite-tag="isFavoriteTag"
        @toggle-tags="showTags = !showTags"
        @search-tag="applySearchTag"
        @toggle-favorite="toggleFavoriteTag"
      />

      <nav class="result-tabs" aria-label="Result tabs">
        <router-link
          v-for="tab in processedSearchTypeTabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeType === tab.key }"
          :to="tab._route"
        >
          {{ tab.label }} <span class="tab-count">{{ tab._count }}</span>
        </router-link>
        <button v-if="!isUserSearch" type="button" class="search-option-note" @click="openSearchOptions">Search option</button>
      </nav>

      <UserSearchFilters
        v-if="isUserSearch"
        :user-filter-type="userFilterType"
        :user-sort-mode="userSortMode"
        @update:user-filter-type="userFilterType = $event"
        @update:user-sort-mode="userSortMode = $event"
        @reload="reloadUserSearch"
      />

      <SearchFilterBar
        v-if="!isUserSearch"
        :sort-mode="sortMode"
        :age-filter="ageFilter"
        :current-search-options="currentSearchOptions"
        :is-novel-search="isNovelSearch"
        :novel-sort-by="novelSortBy"
        :novel-min-words="novelMinWords"
        :novel-max-words="novelMaxWords"
        @update:sort-mode="handleFilterSortChange"
        @update:age-filter="handleAgeFilterChange"
        @update:novel-sort-by="novelSortBy = $event"
        @update:novel-min-words="novelMinWords = $event"
        @update:novel-max-words="novelMaxWords = $event"
      />

      <UserSearchResults
        v-if="isUserSearch"
        :users="enrichedUserResults"
        :loading="userLoading"
        :error="userError"
        :loading-more="userLoadingMore"
        :has-more="userHasMore"
        :active-user-menu-id="activeUserMenuId"
        :block-submitting-id="blockSubmittingId"
        :total="resultTotal"
        @toggle-follow="handleToggleFollow"
        @toggle-menu="toggleUserMenu"
        @close-menu="closeUserMenu"
        @block-user="blockSearchUser"
        @load-more="loadMoreUsers"
        @avatar-error="handleAvatarError"
      />

      <NovelSearchResults
        v-else-if="isNovelSearch"
        :items="processedVisibleItems"
        :loading="loading"
        :error="error"
        :sort-label="novelSortLabel"
        @search-tag="applySearchTag"
      />

      <ArtworkSearchResults
        v-else
        :items="visibleItems"
        :loading="loading"
        :error="error"
        :placeholder-count="placeholderCount"
      />

      <SearchOptionsModal
        v-model="isSearchOptionsOpen"
        :initial-values="searchOptionsDraft"
        @apply="applySearchOptions"
      />
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
  background: var(--surface);
}

.result-tabs {
  display: flex;
  align-items: flex-end;
  gap: 1.35rem;
  border-bottom: 1px solid var(--line);
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
  color: var(--muted);
  font-weight: 700;
  border-bottom: 3px solid transparent;
}

.search-result-page--users .tab-item {
  position: relative;
  padding: 1rem 0 0;
  min-width: 4.55rem;
  color: var(--muted);
  text-align: center;
  font-size: 1.08rem;
  line-height: 1;
}

.search-result-page--users .tab-item.active {
  color: var(--brand);
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
  color: var(--muted);
  font-size: 0.72rem;
  margin-left: 0.2rem;
}

.tab-item.active {
  color: var(--brand);
  border-bottom-color: #1695f0;
}

.search-option-note {
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--muted);
  font-weight: 700;
}


</style>
