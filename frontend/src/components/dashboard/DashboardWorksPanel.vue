<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useArtworkStore } from '@/stores/artwork.store'
import { getArtworks } from '@/services/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const artworkStore = useArtworkStore()
const user = computed(() => authStore.user)
const { t } = useI18n()

const artworks = ref([])
const loadingArtworks = ref(false)

// Menu state
const openMenuId = ref(null)

// Delete confirmation state
const showDeleteConfirm = ref(false)
const deletingArtwork = ref(null)
const deleting = ref(false)

const activeType = computed(() => route.query.type || 'all')

const typeFilters = computed(() => [
  { key: 'all', label: t('dashboard.tabAll') },
  { key: 'illust', label: t('dashboard.tabIllustration') },
  { key: 'manga', label: t('dashboard.tabManga') },
  { key: 'gif', label: t('dashboard.tabGif') },
  { key: 'novel', label: t('dashboard.tabNovel') },
])

async function loadArtworks() {
  if (!user.value?._id) return
  loadingArtworks.value = true
  try {
    const params = { user: user.value._id, limit: 120 }
    if (activeType.value !== 'all') {
      params.type = activeType.value
    }
    const { data } = await getArtworks(params)
    artworks.value = Array.isArray(data) ? data : []
  } catch {
    artworks.value = []
  } finally {
    loadingArtworks.value = false
  }
}

function setTypeFilter(type) {
  if (type === 'all') {
    router.push({ name: 'dashboard-works' })
  } else {
    router.push({ name: 'dashboard-works', query: { type } })
  }
}

onMounted(() => {
  loadArtworks()
})

watch(() => user.value?._id, () => {
  loadArtworks()
})

watch(activeType, () => {
  loadArtworks()
})

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function goToArtworkDetail(artworkId) {
  if (!artworkId) return
  router.push(`/artworks/${artworkId}/edit`)
}

function goToArtworkEdit(artwork) {
  if (artwork?._id) {
    router.push(`/artworks/${artwork._id}/edit`)
  }
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
  loadArtworks()
}
</script>

<template>
  <div class="works-panel">
    <!-- Type filter bar -->
    <div class="filter-bar">
      <button
        v-for="filter in typeFilters"
        :key="filter.key"
        type="button"
        class="filter-btn"
        :class="{ 'filter-btn--active': activeType === filter.key }"
        @click="setTypeFilter(filter.key)"
      >
        {{ filter.label }}
      </button>
    </div>

    <!-- Works content -->
    <p v-if="loadingArtworks" class="state-note">{{ $t('dashboard.loadingWorks') }}</p>
    <div v-else-if="artworks.length === 0" class="empty-state">
      <i class="fa-regular fa-images" aria-hidden="true"></i>
      <p>{{ $t('dashboard.noWorks') }}</p>
    </div>
    <div v-else class="works-grid">
      <div v-for="artwork in artworks" :key="artwork._id" class="work-card" @click="goToArtworkDetail(artwork._id)">
        <!-- Card menu -->
        <div class="work-card-menu">
          <button type="button" class="card-menu-btn" @click.stop="toggleMenu(artwork._id)">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <div v-if="openMenuId === artwork._id" class="card-menu-dropdown">
            <button type="button" class="menu-dropdown-item" @click.stop="goToArtworkEdit(artwork)">
              <i class="fa-solid fa-pen"></i> {{ $t('common.edit') }}
            </button>
            <button type="button" class="menu-dropdown-item menu-dropdown-item--danger" @click.stop="openDeleteConfirm(artwork)">
              <i class="fa-solid fa-trash"></i> {{ $t('common.delete') }}
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

    <!-- Delete confirmation -->
    <div v-if="showDeleteConfirm" class="del-backdrop" @click.self="showDeleteConfirm = false">
      <div class="delete-confirm-dialog">
        <h3 class="delete-confirm-title">{{ $t('dashboard.deleteArtworkHeading') }}</h3>
        <p class="delete-confirm-text">{{ $t('dashboard.deleteArtworkConfirm', { name: deletingArtwork?.title }) }}</p>
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
.works-panel {
  margin-top: 0.5rem;
}

/* Filter bar */
.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 0.25rem;
}

.filter-bar::-webkit-scrollbar {
  display: none;
}

.filter-btn {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 999px;
  height: 32px;
  padding: 0 0.85rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-btn:hover {
  border-color: var(--muted);
  color: var(--text);
}

.filter-btn--active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
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
