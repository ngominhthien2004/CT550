<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import RankingFilters from '../components/rankings/RankingFilters.vue'
import RankingItem from '../components/rankings/RankingItem.vue'
import RankingEmptyState from '../components/rankings/RankingEmptyState.vue'

import { useFeedStore } from '../stores/feed.store'
import { useLikeStore } from '../stores/like.store'
import { useBookmarkStore } from '../stores/bookmark.store'
import { useAuthStore } from '../stores/auth.store'

const TYPE_OPTIONS = [
  { value: 'all', label: 'Overall' },
  { value: 'illust', label: 'Illustrations' },
  { value: 'manga', label: 'Manga' },
  { value: 'novel', label: 'Novels' },
]

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'rookie', label: 'Rookie' },
]

const route = useRoute()
const router = useRouter()
const feedStore = useFeedStore()
const likeStore = useLikeStore()
const bookmarkStore = useBookmarkStore()
const authStore = useAuthStore()

const isNavCollapsed = ref(true)
const period = ref('daily')
const type = ref('all')
const loadingMore = ref(false)
const localLikes = ref({})
const localBookmarks = ref({})

const rankings = computed(() => feedStore.rankings)

function toggleLeftNav() { isNavCollapsed.value = !isNavCollapsed.value }

async function loadRankings(append = false) {
  if (append) loadingMore.value = true
  await feedStore.fetchRankings({
    period: period.value,
    type: type.value === 'all' ? undefined : type.value,
    page: append ? feedStore.rankingsPage + 1 : 1,
    append
  })
  loadingMore.value = false
}

function loadMore() {
  if (loadingMore.value || feedStore.rankingsPage >= feedStore.rankingsPages) return
  loadRankings(true)
}

async function updateFilter(newPeriod, newType) {
  const p = newPeriod || period.value
  const t = newType || type.value
  if (p === period.value && t === type.value) return
  period.value = p
  type.value = t
  await router.replace({ path: '/rankings', query: { period: p, type: t } })
  await loadRankings(false)
}

function normalizeFromRoute() {
  const qPeriod = route.query.period || 'daily'
  const qType = route.query.type || 'all'
  period.value = PERIOD_OPTIONS.some(o => o.value === qPeriod) ? qPeriod : 'daily'
  type.value = TYPE_OPTIONS.some(o => o.value === qType) ? qType : 'all'
}

const periodLabel = computed(() => {
  const now = new Date()
  switch (period.value) {
    case 'daily': {
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
      return yesterday.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    case 'weekly': {
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
      return `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    case 'monthly': {
      const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1)
      return `${monthAgo.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    }
    case 'rookie': return 'All-time rookie artworks'
    default: return ''
  }
})

const emptyStateMessage = computed(() => ({
  daily: 'No artworks ranked in the last 24 hours',
  weekly: 'No artworks ranked in the last 7 days',
  monthly: 'No artworks ranked in the last 30 days',
  rookie: 'No artworks from rookie creators yet'
})[period.value] || 'No rankings found for this category.')

async function handleLikeToggle(item) {
  if (!authStore.isAuthenticated) { await router.push({ name: 'login', query: { redirect: '/rankings' } }); return }
  const id = item._id
  const currentStatus = localLikes.value[id] !== undefined ? localLikes.value[id] : Boolean(item.isLiked)
  if (likeStore.isTogglingLike(id)) return
  localLikes.value[id] = !currentStatus
  if (!localLikes.value[id]) item.likeCount = Math.max(0, (item.likeCount || 0) - 1)
  else item.likeCount = (item.likeCount || 0) + 1
  try {
    await likeStore.toggleLikeByArtwork(id)
    localLikes.value[id] = likeStore.getLikeStatus(id)
  } catch {
    localLikes.value[id] = currentStatus
    item.likeCount = currentStatus ? (item.likeCount || 0) + 1 : Math.max(0, (item.likeCount || 0) - 1)
  }
}

async function handleBookmarkToggle(item) {
  if (!authStore.isAuthenticated) { await router.push({ name: 'login', query: { redirect: '/rankings' } }); return }
  const id = item._id
  const currentStatus = localBookmarks.value[id] !== undefined ? localBookmarks.value[id] : Boolean(item.isBookmarked)
  if (bookmarkStore.isTogglingBookmark(id)) return
  localBookmarks.value[id] = !currentStatus
  if (!localBookmarks.value[id]) item.bookmarkCount = Math.max(0, (item.bookmarkCount || 0) - 1)
  else item.bookmarkCount = (item.bookmarkCount || 0) + 1
  try {
    await bookmarkStore.toggleBookmarkByArtwork(id)
    localBookmarks.value[id] = bookmarkStore.getBookmarkStatus(id)
  } catch {
    localBookmarks.value[id] = currentStatus
    item.bookmarkCount = currentStatus ? (item.bookmarkCount || 0) + 1 : Math.max(0, (item.bookmarkCount || 0) - 1)
  }
}

function formatCount(num) {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

function getLikeStatus(item) { return localLikes.value[item._id] !== undefined ? localLikes.value[item._id] : Boolean(item.isLiked) }
function getBookmarkStatus(item) { return localBookmarks.value[item._id] !== undefined ? localBookmarks.value[item._id] : Boolean(item.isBookmarked) }

function getRankClass(rank) {
  if (rank === 1) return 'rank-top-1'
  if (rank === 2) return 'rank-top-2'
  if (rank === 3) return 'rank-top-3'
  return ''
}

const processedRankings = computed(() =>
  rankings.value.map((item, index) => ({
    ...item,
    _rankClass: getRankClass(index + 1),
    _cover: item?.images?.[0] || 'https://via.placeholder.com/200x200?text=No+Image',
    _viewCount: formatCount(item.viewCount || 0),
    _likeCount: formatCount(item.likeCount || 0),
    _bookmarkCount: formatCount(item.bookmarkCount || 0),
    _likeStatus: getLikeStatus(item),
    _bookmarkStatus: getBookmarkStatus(item),
    _togglingLike: likeStore.isTogglingLike(item._id),
    _togglingBookmark: bookmarkStore.isTogglingBookmark(item._id),
  }))
)

const emptyStateType = computed(() => {
  if (feedStore.loading && rankings.value.length === 0) return 'loading'
  if (feedStore.error && rankings.value.length === 0) return 'error'
  if (rankings.value.length === 0 && !feedStore.loading) return 'empty'
  return null
})

onMounted(async () => { normalizeFromRoute(); await loadRankings(false) })
watch(() => [route.query.period, route.query.type], async () => { normalizeFromRoute(); await loadRankings(false) })
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="rankings-container">
      <RankingFilters
        :type-options="TYPE_OPTIONS"
        :period-options="PERIOD_OPTIONS"
        :active-type="type"
        :active-period="period"
        :period-label="periodLabel"
        @update:type="updateFilter(null, $event)"
        @update:period="updateFilter($event, null)"
      />

      <section class="ranking-content">
        <RankingEmptyState
          v-if="emptyStateType"
          :type="emptyStateType"
          :message="emptyStateMessage"
          :error="feedStore.error"
          :period-options="PERIOD_OPTIONS"
          :active-period="period"
          @retry="loadRankings(false)"
          @filter-period="updateFilter($event, null)"
        />

        <div v-else class="ranking-list">
          <RankingItem
            v-for="(item, index) in processedRankings"
            :key="item._id"
            :item="item"
            :rank="index + 1"
            @like="handleLikeToggle"
            @bookmark="handleBookmarkToggle"
          />
        </div>

        <div v-if="feedStore.rankingsPage < feedStore.rankingsPages" class="load-more-wrap">
          <button type="button" class="load-more-btn" :disabled="loadingMore" @click="loadMore">
            <span v-if="loadingMore" class="spinner-sm"></span>
            <span v-else>Load More</span>
          </button>
        </div>
      </section>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.rankings-container {
  padding: 0 72px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.ranking-content {
  margin-top: 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  min-height: 600px;
  position: relative;
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  padding: 24px;
  border-top: 1px solid var(--line);
}

.load-more-btn {
  padding: 10px 40px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.load-more-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--surface-alt); }
.load-more-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid var(--line);
  border-top: 2px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .rankings-container { padding: 0 16px 40px; }
}
</style>
