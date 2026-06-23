<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useArtworkStore } from '@/stores/artwork.store'
import { useSeriesStore } from '@/stores/series.store'
import { getArtworks } from '@/services/api'
import DashboardSeriesPanel from './DashboardSeriesPanel.vue'
import EditArtworkModal from './EditArtworkModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const artworkStore = useArtworkStore()
const seriesStore = useSeriesStore()
const user = computed(() => authStore.user)

const activeSubTab = ref('works')
const artworks = ref([])
const loadingArtworks = ref(false)

// Menu state
const openMenuId = ref(null)

// Edit modal state
const showEditModal = ref(false)
const editingArtwork = ref(null)

// Delete confirmation state
const showDeleteConfirm = ref(false)
const deletingArtwork = ref(null)
const deleting = ref(false)

async function loadArtworks() {
  if (!user.value?._id) return
  loadingArtworks.value = true
  try {
    const { data } = await getArtworks({ user: user.value._id, limit: 120 })
    artworks.value = Array.isArray(data) ? data : []
  } catch {
    artworks.value = []
  } finally {
    loadingArtworks.value = false
  }
}

onMounted(() => {
  loadArtworks()
  seriesStore.fetchMySeries()
})

watch(() => user.value?._id, () => {
  loadArtworks()
  seriesStore.fetchMySeries()
})

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function goToArtworkDetail(artworkId) {
  if (!artworkId) return
  router.push(`/artworks/${artworkId}`)
}

function openEditModal(artwork) {
  editingArtwork.value = artwork
  showEditModal.value = true
  openMenuId.value = null
}

function openDeleteConfirm(artwork) {
  deletingArtwork.value = artwork
  showDeleteConfirm.value = true
  openMenuId.value = null
}

async function confirmDelete() {
  if (!deletingArtwork.value) return
  deleting.value = true
  try {
    await artworkStore.deleteArtwork(deletingArtwork.value._id)
    showDeleteConfirm.value = false
    deletingArtwork.value = null
    await loadArtworks()
  } catch {
    // error handled by store
  } finally {
    deleting.value = false
  }
}

function handleArtworkUpdated() {
  showEditModal.value = false
  editingArtwork.value = null
  loadArtworks()
}
</script>

<template>
  <div class="works-panel">
    <!-- Sub-tabs: Works / Series -->
    <div class="works-subtabs">
      <button
        type="button"
        class="subtab-btn"
        :class="{ 'subtab-btn--active': activeSubTab === 'works' }"
        @click="activeSubTab = 'works'"
      >
        Works
      </button>
      <button
        type="button"
        class="subtab-btn"
        :class="{ 'subtab-btn--active': activeSubTab === 'series' }"
        @click="activeSubTab = 'series'"
      >
        Series
        <span v-if="seriesStore.seriesList.length" class="subtab-badge">
          {{ seriesStore.seriesList.length }}
        </span>
      </button>
    </div>

    <!-- Works content -->
    <div v-if="activeSubTab === 'works'" class="works-content">
      <p v-if="loadingArtworks" class="state-note">Loading works...</p>
      <div v-else-if="artworks.length === 0" class="empty-state">
        <p>You haven't posted any works yet.</p>
      </div>
      <div v-else class="works-grid">
        <div v-for="artwork in artworks" :key="artwork._id" class="work-card" @click="goToArtworkDetail(artwork._id)">
          <!-- Card menu -->
          <div class="work-card-menu">
            <button type="button" class="work-card-menu-btn" @click.stop="toggleMenu(artwork._id)">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <div v-if="openMenuId === artwork._id" class="work-card-menu-dropdown">
              <button type="button" class="menu-dropdown-item" @click.stop="openEditModal(artwork)">
                <i class="fa-solid fa-pen"></i> Edit
              </button>
              <button type="button" class="menu-dropdown-item menu-dropdown-item--danger" @click.stop="openDeleteConfirm(artwork)">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>

          <div class="work-card-thumb">
            <img
              v-if="artwork.images && artwork.images[0]"
              :src="artwork.images[0]"
              :alt="artwork.title"
              loading="lazy"
            />
            <div v-else class="work-card-nothumb">
              <i class="fa-solid fa-pen-nib"></i>
            </div>
          </div>
          <div class="work-card-info">
            <h4 class="work-card-title">{{ artwork.title }}</h4>
            <span class="work-card-type">{{ artwork.type }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Series content -->
    <DashboardSeriesPanel v-if="activeSubTab === 'series'" />

    <!-- Edit modal -->
    <EditArtworkModal
      v-if="showEditModal"
      :artwork="editingArtwork"
      @close="showEditModal = false"
      @updated="handleArtworkUpdated"
    />

    <!-- Delete confirmation -->
    <div v-if="showDeleteConfirm" class="ea-backdrop" @click.self="showDeleteConfirm = false">
      <div class="delete-confirm-dialog">
        <h3 class="delete-confirm-title">Delete artwork</h3>
        <p class="delete-confirm-text">Are you sure you want to delete "{{ deletingArtwork?.title }}"? This action cannot be undone.</p>
        <div class="delete-confirm-actions">
          <button type="button" class="dc-btn dc-btn--cancel" @click="showDeleteConfirm = false">Cancel</button>
          <button type="button" class="dc-btn dc-btn--delete" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.works-panel {
  margin-top: 1rem;
}

.works-subtabs {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.subtab-btn {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 999px;
  height: 32px;
  padding: 0 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.subtab-btn:hover {
  color: #374151;
  background: #f1f5f9;
}

.subtab-btn--active {
  color: #111827;
  background: #e5e7eb;
}

.subtab-badge {
  background: #9ca3af;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 999px;
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.work-card {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.work-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* Card menu */
.work-card-menu {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.work-card-menu-btn {
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

.work-card-menu-btn:hover {
  background: rgba(255,255,255,1);
}

.work-card-menu-dropdown {
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

.work-card-thumb {
  aspect-ratio: 1;
  background: #f3f4f6;
  overflow: hidden;
}

.work-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.work-card-nothumb {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #9ca3af;
  font-size: 1.5rem;
}

.work-card-info {
  padding: 0.5rem 0.65rem;
}

.work-card-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.work-card-type {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: capitalize;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #6b7280;
}

.state-note {
  color: #4b5563;
  font-weight: 600;
}

/* Delete confirmation */
.ea-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 150;
  display: grid;
  place-items: center;
  padding: 1rem;
  animation: eaFadeIn 0.15s ease;
}

@keyframes eaFadeIn {
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
  animation: eaSlideUp 0.2s ease;
}

@keyframes eaSlideUp {
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

.dc-btn {
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 999px;
  height: 38px;
  padding: 0 1.5rem;
  cursor: pointer;
  transition: background 0.12s, opacity 0.12s;
}

.dc-btn--cancel {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.dc-btn--cancel:hover {
  background: #f9fafb;
}

.dc-btn--delete {
  background: #dc2626;
  color: #fff;
}

.dc-btn--delete:hover:not(:disabled) {
  background: #b91c1c;
}

.dc-btn--delete:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
