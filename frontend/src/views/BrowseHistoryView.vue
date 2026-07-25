<script setup>
import { onMounted, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import { useBrowseHistoryStore } from '@/stores/browseHistory.store'
import { useAuthStore } from '@/stores/auth.store'
import ArtworkCard from '@/components/artwork/ArtworkCard.vue'

import { formatShortDate } from '../utils/date.js'
import { typeLabelMap, buildTypeTabs } from '../utils/typeTabs'


const { t } = useI18n()
const browseHistoryStore = useBrowseHistoryStore()
const authStore = useAuthStore()

const isNavCollapsed = ref(true)
function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

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

const activeType = ref('')

const currentPageCount = computed(() => historyEntries.value.filter(entry => entry.artwork).length)

const typeTabs = computed(() => {
  const allTab = currentPageCount.value > 0 ? [{ value: '', label: 'All', count: currentPageCount.value }] : []
  return [
    ...allTab,
    ...buildTypeTabs(historyEntries.value, (entry) => String(entry.artwork?.type || '').toLowerCase()),
  ]
})

function selectType(type) {
  activeType.value = activeType.value === type ? '' : type
}

const processedHistory = computed(() => {
  let items = historyEntries.value
    .filter(entry => entry.artwork)
    .map(entry => ({
      ...entry,
      _timeAgo: timeAgo(entry.createdAt),
    }))
  if (activeType.value) {
    items = items.filter(entry => String(entry.artwork.type || '').toLowerCase() === activeType.value)
  }
  return items
})

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
  if (confirm(t('browseHistory.clearConfirm'))) {
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

</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="browse-history-page">
      <div class="page-header">
        <div class="section-head">
          <h3><i class="fa-regular fa-clock me-2"></i>{{ $t('browseHistory.title') }}</h3>
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
              <i class="fa-regular fa-trash-can"></i> {{ $t('browseHistory.clearHistory') }}
            </button>
          </div>
        </div>
        <p class="page-subtitle">
          Showing {{ currentPageCount }} of <strong>{{ total }}</strong> artworks viewed
          <span v-if="totalPages > 1">— page {{ currentPage }} of {{ totalPages }}</span>
        </p>
      </div>

      <!-- Type Tabs -->
      <div v-if="typeTabs.length > 1" class="type-tabs">
        <button
          v-for="tab in typeTabs"
          :key="tab.value"
          type="button"
          class="type-tab"
          :class="{ active: activeType === tab.value }"
          @click="selectType(tab.value)"
        >
          {{ tab.label }} <span class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Search + Filters -->
      <div class="toolbar" v-if="historyEntries.length > 0 || hasActiveFilters">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            :value="searchQuery"
            :placeholder="$t('browseHistory.searchByTitle')"
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
            <label class="filter-label">{{ $t('common.from') }}</label>
            <input
              type="date"
              v-model="dateFrom"
              class="filter-input"
              @change="applyDateFilter"
            />
          </div>
          <div class="filter-row">
            <label class="filter-label">{{ $t('common.to') }}</label>
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
            <i class="fa-solid fa-xmark"></i> {{ $t('common.reset') }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="card-grid">
          <div v-for="i in 6" :key="'sk-' + i" class="skeleton-card skeleton-pulse">
            <div class="skeleton-thumb"></div>
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
        <div class="card-grid">
          <div v-for="i in 6" :key="'empty-' + i" class="history-card empty-card">
            <div class="card-cover-wrapper">
              <div class="card-placeholder empty-placeholder">
                <i class="fa-regular fa-clock"></i>
              </div>
            </div>
            <div class="card-meta">
              <span class="empty-label">{{ $t('browseHistory.noHistory') }}</span>
            </div>
          </div>
        </div>
        <div class="empty-overlay">
          <i class="fa-regular fa-clock"></i>
          <h3>{{ $t('browseHistory.noHistory') }}</h3>
          <p>Artworks you view will appear here</p>
          <router-link to="/discovery" class="btn-explore">
            <i class="fa-regular fa-compass"></i> Explore artworks
          </router-link>
        </div>
      </div>

      <!-- Grid -->
      <div v-else class="card-grid">
        <div
          v-for="entry in processedHistory"
          :key="entry._id"
          class="history-card"
        >
          <ArtworkCard :item="entry.artwork" hide-series-badge />
          <div class="card-footer">
            <span class="time-badge"><i class="fa-regular fa-clock"></i> {{ entry._timeAgo }}</span>
          </div>
        </div>
      </div>

      <!-- Pagination (hidden when filtering by type — client-side filter vs server-side pagination don't mix) -->
      <nav v-if="totalPages > 1 && !activeType" class="pagination-bar">
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
  width: 100%;
  justify-self: center;
  margin: 0;
  padding: 1.5rem 0;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-subtitle {
  font-size: 0.82rem;
  color: var(--muted);
  margin: 0.25rem 0 0;
}

.type-tabs {
  display: flex;
  gap: 0.4rem;
  margin: 0.75rem 0;
  flex-wrap: wrap;
}

.type-tab {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  border-radius: 20px;
  padding: 0.3rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.type-tab:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.type-tab.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.tab-count {
  margin-left: 0.3rem;
  opacity: 0.7;
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

.time-badge {
  font-size: 0.72rem;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.15rem;
}

/* Skeleton */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton-pulse { animation: pulse 1.5s ease-in-out infinite; }

.skeleton-card {
  background: var(--surface-alt);
  border-radius: 12px;
  overflow: hidden;
}

.skeleton-thumb {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--line);
}

/* Empty / Error */
.empty-state {
  position: relative;
}

.empty-card {
  pointer-events: none;
}

.empty-placeholder {
  display: grid;
  place-items: center;
  background: var(--surface-alt);
  color: var(--muted);
  font-size: 2rem;
  opacity: 0.4;
}

.empty-label {
  font-size: 0.78rem;
  color: var(--muted);
  opacity: 0.5;
}

.empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(var(--bg-rgb, 15, 23, 42), 0.85);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  text-align: center;
  padding: 2rem;
}

.empty-overlay i {
  font-size: 2.5rem;
  color: var(--muted);
  margin-bottom: 0.75rem;
}

.empty-overlay h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.3rem;
}

.empty-overlay p {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0 0 1.25rem;
}

.error-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--muted);
}

.error-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
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
}
</style>
