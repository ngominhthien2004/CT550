<script setup>
import { onMounted, computed, ref } from 'vue'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import { useBrowseHistoryStore } from '@/stores/browseHistory.store'
import { useAuthStore } from '@/stores/auth.store'

import { formatShortDate } from '../utils/date.js'


const browseHistoryStore = useBrowseHistoryStore()
const authStore = useAuthStore()

const historyEntries = computed(() => browseHistoryStore.entries)
const loading = computed(() => browseHistoryStore.loading)
const error = computed(() => browseHistoryStore.error)
const total = computed(() => browseHistoryStore.total)
const currentPage = computed(() => browseHistoryStore.page)
const totalPages = computed(() => browseHistoryStore.pages)

const searchQuery = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const showFilters = ref(false)
let searchDebounce = null

const hasActiveFilters = computed(() =>
  browseHistoryStore.search || browseHistoryStore.filterFrom || browseHistoryStore.filterTo
)

const processedHistory = computed(() =>
  historyEntries.value.map(entry => ({
    ...entry,
    _timeAgo: timeAgo(entry.createdAt),
  }))
)

onMounted(() => {
  browseHistoryStore.fetchHistory(1)
})

function onSearchInput(value) {
  searchQuery.value = value
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    browseHistoryStore.setSearch(value)
  }, 350)
}

function applyDateFilter() {
  browseHistoryStore.setFilters({ from: dateFrom.value, to: dateTo.value })
}

function clearAllFilters() {
  searchQuery.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  showFilters.value = false
  browseHistoryStore.clearFilters()
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    browseHistoryStore.fetchHistory(page)
  }
}

function handleClearHistory() {
  if (confirm('Are you sure you want to clear your browsing history?')) {
    browseHistoryStore.clearHistory()
  }
}

function formatDate(dateStr) {
  return formatShortDate(dateStr)
}

function timeAgo(dateStr) {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

function getImage(item) {
  if (!item?.artwork) return ''
  const images = item.artwork.images
  if (Array.isArray(images) && images.length > 0) return images[0]
  if (typeof images === 'string' && images) return images
  return ''
}
</script>

<template>
  <MainLayoutTemplate>
    <div class="browse-history-page">
      <div class="page-header">
        <div class="page-header-top">
          <h1><i class="fa-regular fa-clock me-2"></i>Browsing History</h1>
          <div class="header-actions">
            <button
              type="button"
              class="btn-filter"
              :class="{ active: showFilters || hasActiveFilters }"
              @click="showFilters = !showFilters"
            >
              <i class="fa-solid fa-sliders"></i> Filter
            </button>
            <button
              v-if="historyEntries.length > 0"
              type="button"
              class="btn-clear"
              @click="handleClearHistory"
            >
              <i class="fa-regular fa-trash-can"></i> Clear
            </button>
          </div>
        </div>
        <p class="page-subtitle">{{ total }} artwork{{ total !== 1 ? 's' : '' }} viewed</p>
      </div>

      <!-- Search + Filters -->
      <div class="toolbar" v-if="historyEntries.length > 0 || hasActiveFilters">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            :value="searchQuery"
            placeholder="Search by title..."
            class="search-input"
            @input="onSearchInput($event.target.value)"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="search-clear"
            @click="onSearchInput('')"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div v-if="showFilters" class="filter-panel">
          <div class="filter-row">
            <label class="filter-label">From</label>
            <input
              type="date"
              v-model="dateFrom"
              class="filter-input"
              @change="applyDateFilter"
            />
          </div>
          <div class="filter-row">
            <label class="filter-label">To</label>
            <input
              type="date"
              v-model="dateTo"
              class="filter-input"
              @change="applyDateFilter"
            />
          </div>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="btn-clear-filters"
            @click="clearAllFilters"
          >
            <i class="fa-solid fa-xmark"></i> Clear filters
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="card-grid">
          <div v-for="i in 6" :key="'sk-' + i" class="history-card skeleton">
            <div class="card-cover skeleton-pulse"></div>
            <div class="card-meta">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line author"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>{{ error }}</p>
      </div>

      <!-- Empty -->
      <div v-else-if="historyEntries.length === 0" class="empty-state">
        <i class="fa-regular fa-clock"></i>
        <h3>No browsing history yet</h3>
        <p>Artworks you view will appear here</p>
        <router-link to="/discovery" class="btn-explore">
          <i class="fa-regular fa-compass"></i> Explore artworks
        </router-link>
      </div>

      <!-- Grid -->
      <div v-else class="card-grid">
        <article
          v-for="entry in processedHistory"
          :key="entry._id"
          class="history-card"
        >
          <div class="card-cover-wrapper">
            <router-link :to="`/artworks/${entry.artwork._id}`" class="card-cover-link">
              <img
                v-if="getImage(entry)"
                :src="getImage(entry)"
                :alt="entry.artwork.title"
                loading="lazy"
              />
              <div v-else class="card-placeholder"></div>
            </router-link>
            <span class="time-badge">{{ entry._timeAgo }}</span>
          </div>
          <div class="card-meta">
            <router-link :to="`/artworks/${entry.artwork._id}`" class="card-title">
              {{ entry.artwork.title }}
            </router-link>
            <router-link
              v-if="entry.artwork.user?._id"
              :to="`/account?user=${entry.artwork.user._id}`"
              class="card-author"
            >
              <img
                :src="entry.artwork.user?.avatar || 'https://s.pximg.net/common/images/no_profile.png'"
                class="author-avatar"
                :alt="entry.artwork.user?.displayName || entry.artwork.user?.username"
                @error="(e) => (e.target.src = 'https://s.pximg.net/common/images/no_profile.png')"
              />
              <span>{{ entry.artwork.user?.displayName || entry.artwork.user?.username }}</span>
            </router-link>
            <div class="card-stats">
              <span><i class="fa-regular fa-heart"></i> {{ entry.artwork.likeCount || 0 }}</span>
              <span><i class="fa-regular fa-bookmark"></i> {{ entry.artwork.bookmarkCount || 0 }}</span>
              <span><i class="fa-regular fa-eye"></i> {{ entry.artwork.viewCount || 0 }}</span>
            </div>
          </div>
        </article>
      </div>

      <!-- Pagination -->
      <nav v-if="totalPages > 1" class="pagination-bar">
        <button
          type="button"
          class="page-btn"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          type="button"
          class="page-btn"
          :class="{ active: p === currentPage }"
          @click="goToPage(p)"
        >
          {{ p }}
        </button>
        <button
          type="button"
          class="page-btn"
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </nav>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.browse-history-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 0;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.page-subtitle {
  font-size: 0.82rem;
  color: var(--muted);
  margin: 0.25rem 0 0;
}

.btn-clear {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  border-radius: 8px;
  padding: 0.4rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: background 0.15s, color 0.15s;
}

.btn-clear:hover {
  background: var(--surface-alt);
  color: var(--danger);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-filter {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  border-radius: 8px;
  padding: 0.4rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: background 0.15s, color 0.15s;
}

.btn-filter:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.btn-filter.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* Toolbar: search + filters */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  background: var(--surface);
  transition: border-color 0.2s;
}

.search-box:focus-within {
  border-color: var(--accent);
}

.search-icon {
  color: var(--muted);
  font-size: 0.8rem;
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  color: var(--text);
  flex: 1;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--muted);
}

.search-clear {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.search-clear:hover {
  color: var(--text);
}

.filter-panel {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.75rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-alt);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.filter-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
}

.filter-input {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  font-size: 0.78rem;
  color: var(--text);
  background: var(--surface);
}

.filter-input:focus {
  outline: none;
  border-color: var(--accent);
}

.btn-clear-filters {
  border: none;
  background: transparent;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.btn-clear-filters:hover {
  text-decoration: underline;
}

/* Grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.25rem;
}

/* Card */
.history-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.card-cover-wrapper {
  position: relative;
}

.card-cover-link {
  display: block;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-alt);
  text-decoration: none;
}

.card-cover-link img {
  width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.card-cover-link:hover img {
  transform: scale(1.03);
}

.card-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, var(--surface-alt), var(--surface));
}

.time-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  pointer-events: none;
}

/* Meta */
.card-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.card-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--brand);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.35;
}

.card-title:hover {
  text-decoration: underline;
}

.card-author {
  display: flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  color: var(--muted);
  font-size: 0.76rem;
  min-width: 0;
}

.card-author:hover {
  color: var(--accent);
}

.author-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--surface-alt);
}

.card-author span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-stats {
  display: flex;
  gap: 0.65rem;
  font-size: 0.72rem;
  color: var(--muted);
  margin-top: 0.15rem;
}

/* Skeleton */
.skeleton .card-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: var(--line);
}

.skeleton-line.title { width: 70%; }
.skeleton-line.author { width: 50%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton-pulse { animation: pulse 1.5s ease-in-out infinite; }

/* Empty / Error */
.empty-state,
.error-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--muted);
}

.empty-state i,
.error-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
}

.empty-state h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.3rem;
}

.empty-state p {
  font-size: 0.85rem;
  margin: 0 0 1.25rem;
}

.btn-explore {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;
}

.btn-explore:hover {
  opacity: 0.9;
}

/* Pagination */
.pagination-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
  margin-top: 2rem;
}

.page-btn {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  border-radius: 8px;
  min-width: 34px;
  height: 34px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, color 0.12s;
}

.page-btn:hover:not(:disabled) {
  background: var(--surface-alt);
}

.page-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 600px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.85rem;
  }

  .page-header h1 {
    font-size: 1.25rem;
  }
}
</style>
