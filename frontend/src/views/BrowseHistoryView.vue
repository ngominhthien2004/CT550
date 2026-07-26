<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import { useBrowseHistoryStore } from '@/stores/browseHistory.store'
import ArtworkCard from '@/components/artwork/ArtworkCard.vue'
import BrowseHistoryFilters from '@/components/browseHistory/BrowseHistoryFilters.vue'

import { formatShortDate } from '@/utils/date.js'
import { typeLabelMap } from '@/utils/typeTabs'

const { t } = useI18n()
const browseHistoryStore = useBrowseHistoryStore()
const {
  entries: historyEntries,
  loading,
  error,
  total,
  page: currentPage,
  pages: totalPages,
} = storeToRefs(browseHistoryStore)

const isNavCollapsed = ref(true)
const showFilters = ref(false)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

const activeType = ref('')
const cachedFullTotal = ref(0)

watch(() => browseHistoryStore.total, (newTotal) => {
  if (!browseHistoryStore.filterType && !browseHistoryStore.loading && newTotal) {
    cachedFullTotal.value = newTotal
  }
})

const allTotal = computed(() => cachedFullTotal.value || total.value)

const typeTabs = computed(() => {
  const counts = browseHistoryStore.typeCounts || {}
  if (!allTotal.value && !Object.keys(counts).length) return []

  const tabs = [{ value: '', label: 'All', count: allTotal.value }]
  const order = Object.keys(typeLabelMap)

  const sorted = Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))

  for (const [type, count] of sorted) {
    tabs.push({
      value: type,
      label: typeLabelMap[type] || type.charAt(0).toUpperCase() + type.slice(1),
      count,
    })
  }
  return tabs
})

function selectType(type) {
  const newType = activeType.value === type ? '' : type
  activeType.value = newType
  browseHistoryStore.setType(newType)
}

const processedHistory = computed(() =>
  historyEntries.value
    .filter(entry => entry.artwork)
    .map(entry => ({ ...entry, _timeAgo: timeAgo(entry.createdAt) }))
)

onMounted(() => {
  browseHistoryStore.filterType = ''
  activeType.value = ''
  browseHistoryStore.fetchHistory(1)
})

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
  return formatShortDate(dateStr)
}
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="browse-history-page">
      <div class="page-header">
        <div class="section-head">
          <h3><i class="fa-regular fa-clock me-2"></i>{{ t('browseHistory.title') }}</h3>
          <div class="header-actions">
            <button
              type="button"
              class="btn-filter"
              :class="{ active: showFilters || browseHistoryStore.filterFrom || browseHistoryStore.filterTo }"
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
              <i class="fa-regular fa-trash-can"></i> {{ t('browseHistory.clearHistory') }}
            </button>
          </div>
        </div>
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
      <BrowseHistoryFilters :has-entries="historyEntries.length > 0" :show-filters="showFilters" @clear-filters="showFilters = false" />

      <!-- Loading -->
      <div v-if="loading" class="card-grid">
        <div v-for="i in 6" :key="'sk-' + i" class="skeleton-card skeleton-pulse">
          <div class="skeleton-thumb"></div>
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
        <h3>{{ t('browseHistory.noHistory') }}</h3>
        <p>Artworks you view will appear here</p>
        <router-link to="/discovery" class="btn-explore">
          <i class="fa-regular fa-compass"></i> Explore artworks
        </router-link>
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

      <!-- Pagination -->
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

<style scoped src="../assets/styles/buttons.css"></style>
<style scoped src="../assets/styles/content-grid.css"></style>
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

.history-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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
</style>
