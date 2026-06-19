<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSeriesStore } from '@/stores/series.store'
import CreateSeriesModal from './CreateSeriesModal.vue'

const router = useRouter()
const seriesStore = useSeriesStore()
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
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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
        <select class="series-sort-select" :value="sortOrder" @change="changeSort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
      <div class="series-actions">
        <div class="create-dropdown">
          <button type="button" class="create-series-btn" @click="openCreateModal('manga')">
            Create series <i class="fa-solid fa-chevron-down"></i>
          </button>
          <div class="create-dropdown-menu">
            <button type="button" class="dropdown-item" @click="openCreateModal('manga')">
              Create manga series
            </button>
            <button type="button" class="dropdown-item" @click="openCreateModal('novel')">
              Create novel series
            </button>
            <button type="button" class="dropdown-item" @click="openCreateModal('illust')">
              Create illustration series
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
      Loading series...
    </p>

    <!-- Empty state -->
    <div v-else-if="seriesStore.seriesList.length === 0" class="series-empty">
      <p class="empty-title">Try creating a series and use it to collect your works</p>
      <div class="empty-actions">
        <button type="button" class="empty-btn" @click="openCreateModal('manga')">
          Create manga series
        </button>
        <button type="button" class="empty-btn" @click="openCreateModal('novel')">
          Create novel series
        </button>
        <button type="button" class="empty-btn" @click="openCreateModal('illust')">
          Create illustration series
        </button>
      </div>
    </div>

    <!-- Series list -->
    <div v-else class="series-grid">
      <div v-for="series in processedSeriesList" :key="series._id" class="series-card" @click="goToSeriesDetail(series._id)">
        <!-- Card menu (top-right corner) -->
        <div class="series-card-menu">
          <button type="button" class="series-card-menu-btn" @click.stop="toggleMenu(series._id)">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <div v-if="openMenuId === series._id" class="series-card-menu-dropdown">
            <button type="button" class="menu-dropdown-item" @click.stop="openEditModal(series)">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button type="button" class="menu-dropdown-item menu-dropdown-item--danger" @click.stop="openDeleteConfirm(series)">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </div>

        <div class="series-card-cover">
          <img
            v-if="series.coverImage"
            :src="series.coverImage"
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
            <span class="series-card-episodes">{{ series.artworkCount || 0 }} episode(s)</span>
          </div>
          <div class="series-card-stats">
            <div class="stat-item">
              <i class="fa-regular fa-face-smile"></i>
              <span>{{ series.totalReactions || 0 }}</span>
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
            <i :class="series.isCompleted ? 'fa-solid fa-check' : 'fa-solid fa-minus'"></i>
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
    <div v-if="showDeleteConfirm" class="cs-backdrop" @click.self="showDeleteConfirm = false">
      <div class="delete-confirm-dialog">
        <h3 class="delete-confirm-title">Delete series</h3>
        <p class="delete-confirm-text">Are you sure you want to delete "{{ deletingSeries?.title }}"? This action cannot be undone.</p>
        <div class="delete-confirm-actions">
          <button type="button" class="cs-btn cs-btn--cancel" @click="showDeleteConfirm = false">Cancel</button>
          <button type="button" class="cs-btn cs-btn--delete" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

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
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 0.82rem;
  border-radius: 8px;
  height: 34px;
  padding: 0 0.75rem;
  cursor: pointer;
  transition: border-color 0.15s;
}

.series-sort-select:hover {
  border-color: #9ca3af;
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
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
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
  background: #f9fafb;
  border-color: #9ca3af;
}

.create-dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
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
  color: #374151;
  cursor: pointer;
  transition: background 0.1s;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.series-empty {
  text-align: center;
  padding: 4rem 1rem;
}

.empty-title {
  font-size: 1.1rem;
  color: #6b7280;
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
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
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
  background: #f9fafb;
  border-color: #9ca3af;
}

.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}

.series-card {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.series-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.series-card-cover {
  position: relative;
  z-index: 4;
  aspect-ratio: 1;
  background: #f3f4f6;
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
  color: #d1d5db;
  font-size: 2.5rem;
}

/* Card menu */
.series-card-menu {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.series-card-menu-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  color: #374151;
  font-size: 0.75rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.12s;
}

.series-card-menu-btn:hover {
  background: rgba(255,255,255,1);
}

.series-card-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  min-width: 120px;
  overflow: hidden;
  z-index: 10;
}

.menu-dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: #374151;
  cursor: pointer;
  transition: background 0.1s;
}

.menu-dropdown-item:hover {
  background: #f3f4f6;
}

.menu-dropdown-item--danger {
  color: #dc2626;
}

.menu-dropdown-item--danger:hover {
  background: #fef2f2;
}

.series-card-info {
  padding: 0.75rem;
}

.series-card-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.35rem;
  line-height: 1.3;
}

.series-card-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.series-card-separator {
  color: #d1d5db;
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
  color: #6b7280;
}

.stat-item i {
  font-size: 0.7rem;
  width: 14px;
  text-align: center;
}

.stat-item:nth-child(1) i { color: #f59e0b; }
.stat-item:nth-child(2) i { color: #ef4444; }
.stat-item:nth-child(3) i { color: #6366f1; }
.stat-item:nth-child(4) i { color: #10b981; }

.series-card-status {
  font-size: 0.75rem;
  color: #9ca3af;
  padding-top: 0.35rem;
  border-top: 1px solid #f3f4f6;
}

.series-card-status i {
  font-size: 0.7rem;
}

.series-card-status .fa-check {
  color: #10b981;
}

.state-note {
  color: #4b5563;
  font-weight: 600;
  text-align: center;
  padding: 2rem;
}

/* Delete confirmation */
.cs-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 150;
  display: grid;
  place-items: center;
  padding: 1rem;
  animation: csFadeIn 0.15s ease;
}

@keyframes csFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.delete-confirm-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
  animation: csSlideUp 0.2s ease;
}

@keyframes csSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.delete-confirm-title {
  font-weight: 700;
  font-size: 1rem;
  color: #1f2937;
  margin: 0 0 0.5rem;
}

.delete-confirm-text {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.5;
}

.delete-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.cs-btn {
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 999px;
  height: 38px;
  padding: 0 1.5rem;
  cursor: pointer;
  transition: background 0.12s, opacity 0.12s;
}

.cs-btn--cancel {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.cs-btn--cancel:hover {
  background: #f9fafb;
}

.cs-btn--delete {
  background: #dc2626;
  color: #fff;
}

.cs-btn--delete:hover:not(:disabled) {
  background: #b91c1c;
}

.cs-btn--delete:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
