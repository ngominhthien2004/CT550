<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'

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

// Track local like/bookmark state per artwork
const localLikes = ref({})
const localBookmarks = ref({})

const rankings = computed(() => feedStore.rankings)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function loadRankings(append = false) {
  if (append) {
    loadingMore.value = true
  }
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

  await router.replace({
    path: '/rankings',
    query: { period: p, type: t },
  })
  
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
    case 'daily':
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      return yesterday.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    case 'weekly':
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    case 'monthly':
      const monthAgo = new Date(now)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return `${monthAgo.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    case 'rookie':
      return 'All-time rookie artworks'
    default:
      return ''
  }
})

const emptyStateMessage = computed(() => {
  const periodLabel_map = {
    daily: 'No artworks ranked in the last 24 hours',
    weekly: 'No artworks ranked in the last 7 days',
    monthly: 'No artworks ranked in the last 30 days',
    rookie: 'No artworks from rookie creators yet'
  }
  return periodLabel_map[period.value] || 'No rankings found for this category.'
})

async function handleLikeToggle(item) {
  if (!authStore.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: '/rankings' } })
    return
  }
  
  const id = item._id
  const currentStatus = localLikes.value[id] !== undefined ? localLikes.value[id] : Boolean(item.isLiked)
  if (likeStore.isTogglingLike(id)) return
  
  // Optimistic update
  localLikes.value[id] = !currentStatus
  if (!localLikes.value[id]) {
    item.likeCount = Math.max(0, (item.likeCount || 0) - 1)
  } else {
    item.likeCount = (item.likeCount || 0) + 1
  }
  
  try {
    await likeStore.toggleLikeByArtwork(id)
    localLikes.value[id] = likeStore.getLikeStatus(id)
  } catch {
    // Revert on error
    localLikes.value[id] = currentStatus
    item.likeCount = currentStatus ? (item.likeCount || 0) + 1 : Math.max(0, (item.likeCount || 0) - 1)
  }
}

async function handleBookmarkToggle(item) {
  if (!authStore.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: '/rankings' } })
    return
  }
  
  const id = item._id
  const currentStatus = localBookmarks.value[id] !== undefined ? localBookmarks.value[id] : Boolean(item.isBookmarked)
  if (bookmarkStore.isTogglingBookmark(id)) return
  
  // Optimistic update
  localBookmarks.value[id] = !currentStatus
  if (!localBookmarks.value[id]) {
    item.bookmarkCount = Math.max(0, (item.bookmarkCount || 0) - 1)
  } else {
    item.bookmarkCount = (item.bookmarkCount || 0) + 1
  }
  
  try {
    await bookmarkStore.toggleBookmarkByArtwork(id)
    localBookmarks.value[id] = bookmarkStore.getBookmarkStatus(id)
  } catch {
    // Revert on error
    localBookmarks.value[id] = currentStatus
    item.bookmarkCount = currentStatus ? (item.bookmarkCount || 0) + 1 : Math.max(0, (item.bookmarkCount || 0) - 1)
  }
}

function getLikeStatus(item) {
  const id = item._id
  if (localLikes.value[id] !== undefined) return localLikes.value[id]
  return Boolean(item.isLiked)
}

function getBookmarkStatus(item) {
  const id = item._id
  if (localBookmarks.value[id] !== undefined) return localBookmarks.value[id]
  return Boolean(item.isBookmarked)
}

function isTogglingLike(item) {
  return likeStore.isTogglingLike(item._id)
}

function isTogglingBookmark(item) {
  return bookmarkStore.isTogglingBookmark(item._id)
}

function formatCount(num) {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

onMounted(async () => {
  normalizeFromRoute()
  await loadRankings(false)
})

watch(() => [route.query.period, route.query.type], async () => {
  normalizeFromRoute()
  await loadRankings(false)
})

function pickCover(item) {
  return item?.images?.[0] || 'https://via.placeholder.com/200x200?text=No+Image'
}

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
    _cover: pickCover(item),
    _viewCount: formatCount(item.viewCount || 0),
    _likeCount: formatCount(item.likeCount || 0),
    _bookmarkCount: formatCount(item.bookmarkCount || 0),
    _likeStatus: getLikeStatus(item),
    _bookmarkStatus: getBookmarkStatus(item),
    _togglingLike: isTogglingLike(item),
    _togglingBookmark: isTogglingBookmark(item),
  }))
)
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="rankings-container">
      <!-- Pixiv-style Header Tabs -->
      <nav class="type-tabs">
        <button 
          v-for="opt in TYPE_OPTIONS" 
          :key="opt.value"
          type="button"
          class="type-tab-btn"
          :class="{ active: type === opt.value }"
          @click="updateFilter(null, opt.value)"
        >
          {{ opt.label }}
        </button>
      </nav>

      <div class="period-bar">
        <div class="period-tabs">
          <button type="button" 
            v-for="opt in PERIOD_OPTIONS" 
            :key="opt.value"
            class="period-tab-btn"
            :class="{ active: period === opt.value }"
            @click="updateFilter(opt.value, null)"
          >
            {{ opt.label }}
          </button>
        </div>
        <div class="date-indicator">
          {{ periodLabel }}
        </div>
      </div>

      <!-- Ranking Content -->
      <section class="ranking-content">
        <div v-if="feedStore.loading && rankings.length === 0" class="loading-overlay">
          <div class="spinner"></div>
        </div>

        <div v-else-if="feedStore.error && rankings.length === 0" class="empty-state">
          <div class="empty-icon error">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 class="empty-title">Something went wrong</h3>
          <p class="empty-desc">{{ feedStore.error }}</p>
          <button type="button" class="empty-retry-btn" @click="loadRankings(false)">
            <i class="fa-solid fa-rotate-right"></i> Try Again
          </button>
        </div>

        <div v-else-if="rankings.length === 0 && !feedStore.loading" class="empty-state">
          <div class="empty-icon">
            <i class="fa-solid fa-chart-line"></i>
          </div>
          <h3 class="empty-title">No artworks ranked</h3>
          <p class="empty-desc">{{ emptyStateMessage }}</p>
          <div class="empty-hints">
            <p class="empty-hint-label">Try:</p>
            <div class="empty-hint-chips">
              <button type="button" 
                v-for="opt in PERIOD_OPTIONS.filter(o => o.value !== period)" 
                :key="opt.value"
                class="hint-chip"
                @click="updateFilter(opt.value, null)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="ranking-list">
          <article v-for="(item, index) in processedRankings" :key="item._id" class="ranking-item">
            <div class="rank-side">
              <span class="rank-number" :class="item._rankClass">{{ index + 1 }}</span>
              <div class="rank-trend">
                <i class="fas fa-minus"></i>
              </div>
            </div>

            <router-link :to="`/artworks/${item._id}`" class="rank-image-link">
              <img :src="item._cover" :alt="item.title" class="rank-thumb" loading="lazy" />
            </router-link>

            <div class="rank-info">
              <h3 class="rank-title">
                <router-link :to="`/artworks/${item._id}`">{{ item.title }}</router-link>
              </h3>
              <div class="rank-author">
                <router-link :to="`/users/${item.user?._id}/profile`" class="author-link">
                   <img :src="item.user?.avatar || 'https://via.placeholder.com/24'" :alt="item.user?.displayName || item.user?.username || 'User'" class="author-avatar" />
                  <span class="author-name">{{ item.user?.displayName || item.user?.username }}</span>
                </router-link>
              </div>
              <div class="rank-stats-row">
                <span class="stat-label">
                  <i class="fa-regular fa-eye"></i>
                  {{ item._viewCount }}
                </span>
                <span class="stat-label">
                  <i class="fa-regular fa-heart"></i>
                  {{ item._likeCount }}
                </span>
                <span class="stat-label">
                  <i class="fa-regular fa-bookmark"></i>
                  {{ item._bookmarkCount }}
                </span>
              </div>
            </div>

            <div class="rank-actions">
              <button type="button" 
                class="action-btn like-btn" 
                :class="{ 'is-active': item._likeStatus }"
                :disabled="item._togglingLike"
                @click="handleLikeToggle(item)"
                aria-label="Like"
              >
                <i :class="item._likeStatus ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
                <span>{{ item._likeCount }}</span>
              </button>
              <button type="button" 
                class="action-btn bookmark-btn" 
                :class="{ 'is-active': item._bookmarkStatus }"
                :disabled="item._togglingBookmark"
                @click="handleBookmarkToggle(item)"
                aria-label="Bookmark"
              >
                <i :class="item._bookmarkStatus ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'"></i>
              </button>
            </div>
          </article>
        </div>

        <!-- Load More -->
        <div v-if="feedStore.rankingsPage < feedStore.rankingsPages" class="load-more-wrap">
          <button type="button" 
            class="load-more-btn" 
            :disabled="loadingMore"
            @click="loadMore"
          >
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

/* Type Tabs */
.type-tabs {
  display: flex;
  gap: 8px;
  margin-top: 24px;
  border-bottom: 1px solid var(--line);
}

.type-tab-btn {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 700;
  color: var(--muted);
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.type-tab-btn:hover {
  color: var(--accent);
}

.type-tab-btn.active {
  color: var(--accent);
}

.type-tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent);
  border-radius: 3px 3px 0 0;
}

/* Period Bar */
.period-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 8px 0;
}

.period-tabs {
  display: flex;
  gap: 4px;
  background: var(--surface-alt);
  padding: 4px;
  border-radius: 8px;
}

.period-tab-btn {
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.period-tab-btn:hover {
  color: var(--text);
}

.period-tab-btn.active {
  background: var(--surface);
  color: var(--accent);
  box-shadow: var(--shadow-sm);
}

.date-indicator {
  font-size: 14px;
  color: var(--muted);
  font-weight: 500;
}

/* List Items */
.ranking-content {
  margin-top: 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  min-height: 600px;
  position: relative;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--line);
  transition: background 0.2s;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-item:hover {
  background: var(--surface-alt);
}

.rank-side {
  width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.rank-number {
  font-size: 24px;
  font-weight: 900;
  color: var(--muted);
}

.rank-top-1 { color: #facc15; font-size: 32px; }
.rank-top-2 { color: #94a3b8; font-size: 28px; }
.rank-top-3 { color: #d97706; font-size: 26px; }

.rank-trend {
  font-size: 10px;
  color: var(--muted);
  margin-top: 4px;
}

.rank-image-link {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-alt);
  display: block;
}

.rank-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.rank-thumb:hover {
  transform: scale(1.05);
}

.rank-info {
  flex: 1;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rank-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.rank-title a {
  color: var(--text);
  text-decoration: none;
}

.rank-title a:hover {
  text-decoration: underline;
}

.rank-author {
  display: flex;
  align-items: center;
}

.author-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--muted);
  font-size: 14px;
}

.author-link:hover .author-name {
  color: var(--accent);
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.rank-stats-row {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--muted);
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rank-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  width: 100%;
}

.action-btn:hover {
  background: var(--surface-alt);
  border-color: var(--accent);
  color: var(--accent);
}

.action-btn.is-active {
  color: #ef4444;
  border-color: #fecaca;
  background: #fef2f2;
}

.action-btn.is-active:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bookmark-btn.is-active {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
}

.like-btn span {
  font-size: 13px;
}

/* Load More */
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

.load-more-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--surface-alt);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid var(--line);
  border-top: 2px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

/* Empty & Error States */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  min-height: 400px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  font-size: 32px;
  color: var(--muted);
}

.empty-icon.error {
  background: #fef2f2;
  color: var(--danger);
}

.empty-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.empty-desc {
  margin: 0 0 24px;
  font-size: 15px;
  color: var(--muted);
  max-width: 360px;
  line-height: 1.5;
}

.empty-hints {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-hint-label {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}

.empty-hint-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.hint-chip {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.hint-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--surface-alt);
}

.empty-retry-btn {
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-retry-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--surface-alt);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--line);
  border-top: 3px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .rankings-container {
    padding: 0 16px 40px;
  }
  .rank-image-link {
    width: 120px;
    height: 120px;
  }
  .ranking-item {
    padding: 16px;
  }
  .rank-info {
    padding: 0 12px;
  }
  .rank-actions {
    width: 60px;
  }
  .action-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
  .rank-stats-row {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
