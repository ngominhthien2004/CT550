<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useWatchlistStore } from '@/stores/watchlist.store'
import { useSeriesCover } from '@/composables/useSeriesCover'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'

const router = useRouter()
const { t } = useI18n()
const watchlistStore = useWatchlistStore()

const isNavCollapsed = ref(true)

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

onMounted(() => {
  watchlistStore.fetchWatchlist()
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="isNavCollapsed = !isNavCollapsed">
    <div class="watchlist-page">
      <h2 class="page-title">{{ $t('nav.watchlist') }}</h2>

      <div v-if="watchlistStore.loading" class="state-loading">
        <p>{{ $t('common.loading') }}...</p>
      </div>

      <div v-else-if="watchlistStore.error" class="state-error">
        <p>{{ watchlistStore.error }}</p>
      </div>

      <div v-else-if="watchlistStore.items.length === 0" class="state-empty">
        <div class="empty-icon">
          <i class="fa-regular fa-eye"></i>
        </div>
        <h3>{{ $t('series.watchlistEmpty') }}</h3>
        <p>{{ $t('series.watchlistEmptyDesc') }}</p>
      </div>

      <div v-else class="watchlist-grid">
        <div
          v-for="item in watchlistStore.items"
          :key="item._id"
          class="watchlist-card"
          @click="goToSeries(item.series._id)"
        >
          <div class="watchlist-card-cover">
            <img
              v-if="item.series.coverImage"
              :src="item.series.coverImage"
              :alt="item.series.title"
            />
            <div v-else class="watchlist-card-nothumb">
              <i :class="getSeriesIcon(item.series.type)"></i>
            </div>
            <span class="type-badge" :class="'type-' + item.series.type">
              {{ item.series.type }}
            </span>
          </div>
          <div class="watchlist-card-info">
            <h4 class="watchlist-card-title">{{ item.series.title }}</h4>
            <div class="watchlist-card-meta">
              <span v-if="item.series.user" class="author-name">
                {{ item.series.user.displayName || item.series.user.username }}
              </span>
              <span class="episode-count">
                {{ item.series.artworkCount || 0 }} {{ item.series.type === 'novel' ? $t('series.chapters') : $t('series.episodes') }}
              </span>
            </div>
            <div class="watchlist-card-status">
              <span v-if="item.series.isCompleted" class="status-badge status-completed">
                {{ $t('series.completed') }}
              </span>
              <span v-else class="status-badge status-ongoing">
                {{ $t('series.ongoing') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="watchlistStore.hasMore && !watchlistStore.loading" class="load-more">
        <button
          type="button"
          class="load-more-btn"
          :disabled="watchlistStore.loadingMore"
          @click="watchlistStore.loadMoreWatchlist()"
        >
          {{ watchlistStore.loadingMore ? $t('common.loading') + '...' : $t('common.loadMore') }}
        </button>
      </div>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.watchlist-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  min-height: 60vh;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 1.5rem;
}

.state-loading,
.state-error,
.state-empty {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
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
}

.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.watchlist-card {
  display: flex;
  gap: 1rem;
  background: var(--surface);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.watchlist-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.watchlist-card-cover {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-alt);
  position: relative;
}

.watchlist-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.watchlist-card-nothumb {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--line);
  font-size: 1.5rem;
}

.type-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
}

.type-novel { color: #ec4899; }
.type-manga { color: #22c55e; }
.type-illust { color: var(--accent); }

.watchlist-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.watchlist-card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.watchlist-card-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--muted);
}

.author-name {
  color: var(--accent);
}

.watchlist-card-status {
  margin-top: auto;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

.status-completed {
  background: #f0fdf4;
  color: #16a34a;
}

.status-ongoing {
  background: #fef3c7;
  color: #d97706;
}

.load-more {
  text-align: center;
  margin-top: 1.5rem;
}

.load-more-btn {
  padding: 0.5rem 1.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
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
