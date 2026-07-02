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
  router.push(`/artworks/${artworkId}/edit`)
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
        <i class="fa-regular fa-images" aria-hidden="true"></i>
        <p>You haven't posted any works yet.</p>
      </div>
      <div v-else class="works-grid">
        <div v-for="artwork in artworks" :key="artwork._id" class="work-card" @click="goToArtworkDetail(artwork._id)">
          <!-- Card menu -->
          <div class="work-card-menu">
            <button type="button" class="card-menu-btn" @click.stop="toggleMenu(artwork._id)">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <div v-if="openMenuId === artwork._id" class="card-menu-dropdown">
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
    <div v-if="showDeleteConfirm" class="del-backdrop" @click.self="showDeleteConfirm = false">
      <div class="delete-confirm-dialog">
        <h3 class="delete-confirm-title">Delete artwork</h3>
        <p class="delete-confirm-text">Are you sure you want to delete "{{ deletingArtwork?.title }}"? This action cannot be undone.</p>
        <div class="delete-confirm-actions">
          <button type="button" class="del-btn del-btn--cancel" @click="showDeleteConfirm = false">Cancel</button>
          <button type="button" class="del-btn del-btn--delete" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./dashboard-panel-styles.css"></style>
<style scoped>
.works-panel {
  margin-top: 0.5rem;
}

.works-subtabs {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.5rem;
}

.subtab-btn {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 0.88rem;
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
  color: var(--text);
  background: var(--surface-alt);
}

.subtab-btn--active {
  color: var(--accent);
  background: var(--surface-alt);
}

.subtab-badge {
  background: var(--accent);
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
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.work-card:hover {
  box-shadow: var(--shadow-md);
}

/* Card menu */
.work-card-menu {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.work-card-thumb {
  aspect-ratio: 1;
  background: var(--surface-alt);
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
  color: var(--muted);
  font-size: 1.5rem;
}

.work-card-info {
  padding: 0.5rem 0.65rem;
}

.work-card-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.work-card-type {
  font-size: 0.7rem;
  color: var(--muted);
  text-transform: capitalize;
}

.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--muted);
}

.empty-state i {
  font-size: 2rem;
  color: var(--line);
  margin-bottom: 0.5rem;
}

.state-note {
  color: var(--muted);
  font-weight: 600;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
}

</style>
