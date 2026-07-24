<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSeriesStore } from '@/stores/series.store'
import { useI18n } from 'vue-i18n'
import { formatLongDate } from '../../utils/date.js'
import CreateSeriesModal from './CreateSeriesModal.vue'
import { useSeriesCover } from '@/composables/useSeriesCover'

// Wrapper for template use — composable returns a ComputedRef; .value unwraps it.
function getCover(series) {
  return useSeriesCover(series).value
}

const router = useRouter()
const seriesStore = useSeriesStore()
const { t, locale } = useI18n()
const showCreateModal = ref(false)
const createType = ref('manga')
const sortOrder = ref('newest')

function changeSort(event) {
  sortOrder.value = event.target.value
  seriesStore.fetchMySeries(null, sortOrder.value)
}

// Edit modal state
const showEditModal = ref(false)
const editingSeries = ref(null)

// Delete state
const showDeleteConfirm = ref(false)
const deletingSeries = ref(null)
const deleting = ref(false)

// Card menu state
const openMenuId = ref(null)

function openCreateModal(type) {
  createType.value = type
  showCreateModal.value = true
}

function handleSeriesCreated() {
  showCreateModal.value = false
  seriesStore.fetchMySeries(null, sortOrder.value)
}

function openEditModal(series) {
  editingSeries.value = series
  showEditModal.value = true
  openMenuId.value = null
}

function openDeleteConfirm(series) {
  deletingSeries.value = series
  showDeleteConfirm.value = true
  openMenuId.value = null
}

async function confirmDelete() {
  if (!deletingSeries.value) return
  deleting.value = true
  try {
    await seriesStore.deleteSeries(deletingSeries.value._id)
    showDeleteConfirm.value = false
    deletingSeries.value = null
    seriesStore.fetchMySeries(null, sortOrder.value)
  } catch {
    // error handled by store
  } finally {
    deleting.value = false
  }
}

function handleSeriesUpdated() {
  showEditModal.value = false
  editingSeries.value = null
  seriesStore.fetchMySeries(null, sortOrder.value)
}

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function goToSeriesDetail(seriesId) {
  if (!seriesId) return
  router.push(`/series/${seriesId}`)
}

function formatDate(dateStr) {
  return formatLongDate(dateStr, locale.value)
}

function getSeriesIcon(type) {
  switch (type) {
    case 'manga': return 'fa-solid fa-book'
    case 'novel': return 'fa-solid fa-pen-fancy'
    case 'illust': return 'fa-solid fa-image'
    default: return 'fa-solid fa-book'
  }
}

const processedSeriesList = computed(() =>
  seriesStore.seriesList.map(series => ({
    ...series,
    _icon: getSeriesIcon(series.type),
    _createdAt: formatDate(series.createdAt),
  }))
)

onMounted(() => {
  seriesStore.fetchMySeries(null, sortOrder.value)
})
</script>

<template>
  <div class="series-panel">
    <!-- Header with sort and create button -->
    <div class="series-header">
      <div class="series-sort">
        <select class="series-sort-select" :value="sortOrder" @change="changeSort" :aria-label="$t('dashboard.sortSeries')">
          <option value="newest">{{ $t('dashboard.newestFirst') }}</option>
          <option value="oldest">{{ $t('dashboard.oldestFirst') }}</option>
        </select>
      </div>
      <div class="series-actions">
        <div class="create-dropdown">
          <button type="button" class="create-series-btn" @click="openCreateModal('manga')">
            {{ $t('series.createSeriesShort') }} <i class="fa-solid fa-chevron-down"></i>
          </button>
          <div class="create-dropdown-menu">
            <button type="button" class="dropdown-item" @click="openCreateModal('manga')">
              {{ $t('dashboard.createMangaSeries') }}
            </button>
            <button type="button" class="dropdown-item" @click="openCreateModal('novel')">
              {{ $t('dashboard.createNovelSeries') }}
            </button>
            <button type="button" class="dropdown-item" @click="openCreateModal('illust')">
              {{ $t('dashboard.createIllustSeries') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <p v-if="seriesStore.error" class="state-note state-note--error">
      {{ seriesStore.error }}
    </p>

    <!-- Loading -->
    <p v-if="seriesStore.listLoading && seriesStore.seriesList.length === 0" class="state-note">
      {{ $t('dashboard.loadingSeries') }}
    </p>

    <!-- Empty state -->
    <div v-else-if="seriesStore.seriesList.length === 0" class="series-empty">
      <p class="empty-title">{{ $t('dashboard.emptySeriesTitle') }}</p>
      <div class="empty-actions">
        <button type="button" class="empty-btn" @click="openCreateModal('manga')">
          {{ $t('dashboard.createMangaSeries') }}
        </button>
        <button type="button" class="empty-btn" @click="openCreateModal('novel')">
          {{ $t('dashboard.createNovelSeries') }}
        </button>
        <button type="button" class="empty-btn" @click="openCreateModal('illust')" @keydown.enter.prevent="openCreateModal('illust')" @keydown.space.prevent="openCreateModal('illust')">
          {{ $t('dashboard.createIllustSeries') }}
        </button>
      </div>
    </div>

    <!-- Series list -->
    <div v-else class="series-grid">
      <div v-for="series in processedSeriesList" :key="series._id" class="series-card" role="button" tabindex="0" @click="goToSeriesDetail(series._id)" @keydown.enter="goToSeriesDetail(series._id)">
        <!-- Card menu (top-right corner) -->
        <div class="series-card-menu">
          <button type="button" class="card-menu-btn" @click.stop="toggleMenu(series._id)">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <div v-if="openMenuId === series._id" class="card-menu-dropdown">
            <button type="button" class="menu-dropdown-item" @click.stop="openEditModal(series)">
              <i class="fa-solid fa-pen"></i> {{ $t('common.edit') }}
            </button>
            <button type="button" class="menu-dropdown-item menu-dropdown-item--danger" @click.stop="openDeleteConfirm(series)">
              <i class="fa-solid fa-trash"></i> {{ $t('common.delete') }}
            </button>
          </div>
        </div>

        <div class="series-card-cover">
          <img
            v-if="getCover(series)"
            :src="getCover(series)"
            :alt="series.title"
            loading="lazy"
          />
          <div v-else class="series-card-nothumb">
            <i :class="series._icon"></i>
          </div>
        </div>
        <div class="series-card-info">
          <h4 class="series-card-title">{{ series.title }}</h4>
          <div class="series-card-meta">
            <span class="series-card-date">{{ series._createdAt }}</span>
            <span class="series-card-separator">&middot;</span>
            <span class="series-card-episodes">{{ $t('dashboard.episodeCount', { count: series.artworkCount || 0 }) }}</span>
          </div>
          <div class="series-card-stats">
            <div class="stat-item">
              <i class="fa-regular fa-bookmark"></i>
              <span>{{ series.totalBookmarks || 0 }}</span>
            </div>
            <div class="stat-item">
              <i class="fa-solid fa-heart"></i>
              <span>{{ series.totalLikes || 0 }}</span>
            </div>
            <div class="stat-item">
              <i class="fa-solid fa-eye"></i>
              <span>{{ series.totalViews || 0 }}</span>
            </div>
            <div class="stat-item">
              <i class="fa-solid fa-comment"></i>
              <span>{{ series.totalComments || 0 }}</span>
            </div>
          </div>
          <div class="series-card-status">
            <i v-if="series.isCompleted" class="fa-solid fa-check" aria-hidden="true"></i>
            <i v-else class="fa-solid fa-play" aria-hidden="true"></i>
            <span>{{ series.isCompleted ? $t('series.completed') : $t('series.ongoing') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create modal -->
    <CreateSeriesModal
      v-if="showCreateModal"
      :type="createType"
      @close="showCreateModal = false"
      @created="handleSeriesCreated"
    />

    <!-- Edit modal -->
    <CreateSeriesModal
      v-if="showEditModal"
      :edit-series="editingSeries"
      @close="showEditModal = false"
      @created="handleSeriesUpdated"
      @updated="handleSeriesUpdated"
    />

    <!-- Delete confirmation -->
    <div v-if="showDeleteConfirm" class="del-backdrop" @click.self="showDeleteConfirm = false" @keydown.enter.prevent="showDeleteConfirm = false" @keydown.space.prevent="showDeleteConfirm = false" tabindex="0" role="button">
      <div class="delete-confirm-dialog">
        <h3 class="delete-confirm-title">{{ $t('dashboard.deleteSeriesHeading') }}</h3>
        <p class="delete-confirm-text">{{ $t('dashboard.deleteSeriesConfirm', { name: deletingSeries?.title }) }}</p>
        <div class="delete-confirm-actions">
          <button type="button" class="del-btn del-btn--cancel" @click="showDeleteConfirm = false">{{ $t('common.cancel') }}</button>
          <button type="button" class="del-btn del-btn--delete" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? $t('common.saving') : $t('common.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../../assets/styles/dashboard-panel.css"></style>
<style scoped>
.series-panel {
  margin-top: 0.5rem;
}

.series-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.series-sort {
  display: flex;
  align-items: center;
}

.series-sort-select {
  appearance: none;
  -webkit-appearance: none;
  padding: 0.4rem 2rem 0.4rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background-color: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.series-sort-select:hover {
  border-color: var(--muted);
}

.series-sort-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.create-dropdown {
  position: relative;
}

.create-series-btn {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 999px;
  height: 34px;
  padding: 0 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.create-series-btn:hover {
  background: var(--surface-alt);
  border-color: var(--muted);
}

.create-dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  min-width: 200px;
  z-index: 20;
  overflow: hidden;
}

.create-dropdown:hover .create-dropdown-menu {
  display: block;
}

.dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 0.65rem 1rem;
  font-size: 0.82rem;
  color: var(--text);
  cursor: pointer;
  transition: background 0.1s;
}

.dropdown-item:hover {
  background: var(--surface-alt);
}

.series-empty {
  text-align: center;
  padding: 4rem 1rem;
}

.empty-title {
  font-size: 1.1rem;
  color: var(--muted);
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.empty-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.empty-btn {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 999px;
  height: 40px;
  min-width: 220px;
  padding: 0 1.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.empty-btn:hover {
  background: var(--surface-alt);
  border-color: var(--muted);
}

.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}

.series-card {
  position: relative;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface);
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.series-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.series-card-cover {
  position: relative;
  z-index: 4;
  aspect-ratio: 1;
  background: var(--surface-alt);
  overflow: hidden;
}

.series-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.series-card-nothumb {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--line);
  font-size: 2.5rem;
}

/* Card menu */
.series-card-menu {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.series-card-info {
  padding: 0.75rem;
}

.series-card-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.35rem;
  line-height: 1.3;
}

.series-card-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--muted);
  margin-bottom: 0.5rem;
}

.series-card-separator {
  color: var(--line);
}

.series-card-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--muted);
}

.stat-item i {
  font-size: 0.7rem;
  width: 14px;
  text-align: center;
}

.stat-item:nth-child(1) i { color: #f59e0b; }
.stat-item:nth-child(2) i { color: var(--danger); }
.stat-item:nth-child(3) i { color: #6366f1; }
.stat-item:nth-child(4) i { color: #10b981; }

.series-card-status {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--muted);
  padding-top: 0.35rem;
  border-top: 1px solid var(--line);
}

.series-card-status i {
  font-size: 0.7rem;
}

.series-card-status .fa-check {
  color: #10b981;
}

.series-card-status .fa-play {
  color: #f59e0b;
}

.state-note {
  color: var(--muted);
  font-weight: 600;
  text-align: center;
  padding: 2rem;
}

</style>
