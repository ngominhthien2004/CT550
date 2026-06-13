<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useSeriesStore } from '@/stores/series.store'
import { getArtworks } from '@/services/api'
import DashboardSeriesPanel from './DashboardSeriesPanel.vue'

const authStore = useAuthStore()
const seriesStore = useSeriesStore()
const user = computed(() => authStore.user)

const activeSubTab = ref('works')
const artworks = ref([])
const loadingArtworks = ref(false)

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
        <div v-for="artwork in artworks" :key="artwork._id" class="work-card">
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
</style>
