<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useWatchlistStore } from '@/stores/watchlist.store'
import { formatRelativeTime } from '@/utils/date.js'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'

const router = useRouter()
const { t } = useI18n()
const watchlistStore = useWatchlistStore()

const isNavCollapsed = ref(true)
const activeFilter = ref('all')

const filterTabs = computed(() => [
  { key: 'all', label: t('series.all') },
  { key: 'illust', label: t('series.illustration') },
  { key: 'manga', label: t('series.manga') },
  { key: 'novel', label: t('series.novel') },
])

const filteredItems = computed(() => {
  if (activeFilter.value === 'all') return watchlistStore.items
  return watchlistStore.items.filter(
    (item) => item.series?.type === activeFilter.value
  )
})

function getSeriesIcon(type) {
  switch (type) {
    case 'manga': return 'fa-solid fa-book'
    case 'novel': return 'fa-solid fa-pen-fancy'
    case 'illust': return 'fa-solid fa-image'
    default: return 'fa-solid fa-book'
  }
}

function goToSeries(seriesId) {
  router.push(`/series/${seriesId}`)
}

async function removeFromWatchlist(seriesId) {
  try {
    await watchlistStore.removeFromWatchlist(seriesId)
  } catch {
    // Error handled by store
  }
}

function getEpisodeLabel(series) {
  const count = series.artworkCount || 0
  if (series.type === 'novel') {
    return `${count} ${t('series.chapters')}`
  }
  return `${count} ${t('series.episodes')}`
}

function getRelativeDate(series) {
  const date = series.updatedAt || series.createdAt
  return formatRelativeTime(date)
}

function getCoverUrl(series) {
  if (series.coverImage) return series.coverImage
  const artworks = series.artworks
  if (artworks && artworks.length > 0 && artworks[0]?.images?.length > 0) {
    return artworks[0].images[0]
  }
  return ''
}

onMounted(() => {
  watchlistStore.fetchWatchlist()
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="isNavCollapsed = !isNavCollapsed">
    <div class="watchlist-page">
      <h2 class="page-title">
        <i class="fa-regular fa-eye page-title-icon"></i>
        {{ $t('nav.watchlist') }}
      </h2>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          type="button"
          class="filter-tab"
          :class="{ active: activeFilter === tab.key }"
          @click="activeFilter = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="watchlistStore.loading" class="state-loading">
        <div class="loading-spinner"></div>
        <p>{{ $t('common.loading') }}...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="watchlistStore.error" class="state-error">
        <div class="error-icon">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <p>{{ watchlistStore.error }}</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredItems.length === 0" class="state-empty">
        <div class="empty-icon">
          <i class="fa-regular fa-eye"></i>
        </div>
        <h3>{{ $t('series.watchlistEmpty') }}</h3>
        <p>{{ $t('series.watchlistEmptyDesc') }}</p>
      </div>

      <!-- Watchlist list -->
      <div v-else class="watchlist-list">
        <div
          v-for="item in filteredItems"
          :key="item._id"
          class="watchlist-card"
        >
          <div class="watchlist-card-cover" @click="goToSeries(item.series._id)">
            <img
              v-if="getCoverUrl(item.series)"
              :src="getCoverUrl(item.series)"
              :alt="item.series.title"
            />
            <div v-else class="watchlist-card-nothumb">
              <i :class="getSeriesIcon(item.series.type)"></i>
            </div>
            <span class="type-badge" :class="'type-' + item.series.type">
              {{ item.series.type === 'illust' ? 'ILLUST' : item.series.type.toUpperCase() }}
            </span>
          </div>

          <div class="watchlist-card-body">
            <span class="series-label">{{ $t('series.series') }}</span>

            <h4
              class="watchlist-card-title"
              @click="goToSeries(item.series._id)"
            >
              {{ item.series.title }}
            </h4>

            <div v-if="item.series.user" class="watchlist-card-author">
              <img
                v-if="item.series.user.avatar"
                :src="item.series.user.avatar"
                :alt="item.series.user.displayName || item.series.user.username"
                class="author-avatar"
              />
              <div v-else class="author-avatar author-avatar-fallback">
                {{ (item.series.user.displayName || item.series.user.username || '?')[0] }}
              </div>
              <span class="author-name">
                {{ item.series.user.displayName || item.series.user.username }}
              </span>
            </div>

            <div class="watchlist-card-meta">
              <span class="meta-episodes">{{ getEpisodeLabel(item.series) }}</span>
              <span class="meta-separator">&middot;</span>
              <span class="meta-date">{{ getRelativeDate(item.series) }}</span>
            </div>

            <div class="watchlist-card-actions">
              <button
                type="button"
                class="view-btn"
                @click="goToSeries(item.series._id)"
              >
                <i class="fa-solid fa-arrow-right-to-bracket"></i>
                {{ $t('series.viewSeries') }}
              </button>
              <button
                type="button"
                class="unwatch-btn"
                :title="$t('series.unwatch')"
                @click="removeFromWatchlist(item.series._id)"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Load more -->
      <div v-if="watchlistStore.hasMore && !watchlistStore.loading" class="load-more">
        <button
          type="button"
          class="load-more-btn"
          :disabled="watchlistStore.loadingMore"
          @click="watchlistStore.loadMoreWatchlist()"
        >
          <span v-if="watchlistStore.loadingMore" class="loading-spinner-sm"></span>
          {{ watchlistStore.loadingMore ? $t('common.loading') + '...' : $t('common.loadMore') }}
        </button>
      </div>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.watchlist-page {
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 0;
  min-height: 60vh;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.page-title-icon {
  color: var(--accent);
  font-size: 1.3rem;
}

/* ── Filter Tabs ── */
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filter-tab {
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.filter-tab:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.filter-tab.active {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}

/* ── States ── */
.state-loading,
.state-error,
.state-empty {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--muted);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.4rem;
  vertical-align: middle;
}

.error-icon {
  font-size: 2.5rem;
  color: var(--danger);
  margin-bottom: 1rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.25rem;
  color: var(--line);
}

.state-empty h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.5rem;
}

.state-empty p {
  font-size: 0.9rem;
  color: var(--muted);
  margin: 0;
  max-width: 340px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
}

/* ── Watchlist List ── */
.watchlist-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ── Card ── */
.watchlist-card {
  display: flex;
  width: 100%;
  gap: 1.25rem;
  padding: 1rem 1.25rem;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.watchlist-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* ── Cover ── */
.watchlist-card-cover {
  flex-shrink: 0;
  width: 140px;
  height: 190px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-alt);
  position: relative;
  cursor: pointer;
}

.watchlist-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.watchlist-card-cover:hover img {
  transform: scale(1.03);
}

.watchlist-card-nothumb {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--line);
  font-size: 1.8rem;
}

.type-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
  letter-spacing: 0.03em;
}

.type-novel { color: #ec4899; }
.type-manga { color: #16a34a; }
.type-illust, .type-ILLUST { color: var(--accent); }

/* ── Card Body ── */
.watchlist-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  justify-content: center;
}

.series-label {
  font-size: 0.7rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.watchlist-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s ease;
}

.watchlist-card-title:hover {
  color: var(--accent);
}

/* ── Author ── */
.watchlist-card-author {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.author-avatar-fallback {
  display: grid;
  place-items: center;
  background: var(--accent);
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 700;
}

.author-name {
  font-size: 0.8rem;
  color: var(--muted);
}

/* ── Meta ── */
.watchlist-card-meta {
  font-size: 0.8rem;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.meta-separator {
  opacity: 0.5;
}

/* ── Actions ── */
.watchlist-card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.3rem;
}

.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 8px;
  background: var(--accent);
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  font-family: inherit;
}

.view-btn:hover {
  background: var(--accent-hover);
}

.unwatch-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.6rem;
  font-size: 0.78rem;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
  font-family: inherit;
}

.unwatch-btn:hover {
  color: var(--danger);
  border-color: var(--danger);
}

/* ── Load More ── */
.load-more {
  text-align: center;
  margin-top: 1.5rem;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.load-more-btn:hover {
  background: var(--surface-alt);
  border-color: var(--accent);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
