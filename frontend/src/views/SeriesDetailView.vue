<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSeriesStore } from '@/stores/series.store'
import { useAuthStore } from '@/stores/auth.store'
import { getChapters } from '@/services/api'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import SeriesHero from '@/components/series/SeriesHero.vue'
import SeriesArtworksGrid from '@/components/series/SeriesArtworksGrid.vue'
import SeriesChaptersList from '@/components/series/SeriesChaptersList.vue'

const route = useRoute()
const router = useRouter()
const seriesStore = useSeriesStore()
const authStore = useAuthStore()

const isNavCollapsed = ref(true)
const chapters = ref([])
const chaptersLoading = ref(false)
const seriesLoadError = ref('')
const successMsg = ref('')
let successTimeout = null

function showSuccess(msg) {
  successMsg.value = msg
  if (successTimeout) clearTimeout(successTimeout)
  successTimeout = setTimeout(() => { successMsg.value = '' }, 3000)
}

const series = computed(() => seriesStore.currentSeries)

const processedArtworks = computed(() => {
  if (!series.value?.artworks?.length) return []
  return series.value.artworks.map(artwork => ({
    ...artwork,
    _icon: getSeriesIcon(artwork.type || series.value?.type),
  }))
})

const processedChapters = computed(() =>
  chapters.value.map(chapter => ({
    ...chapter,
    _formattedDate: formatDate(chapter.createdAt),
    _wordCount: (chapter.wordCount || 0).toLocaleString(),
  }))
)

const isOwner = computed(() => {
  if (!series.value || !authStore.user) return false
  const seriesUser = series.value.user?._id || series.value.user
  return String(seriesUser) === String(authStore.user._id)
})

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

async function loadChapters() {
  if (!series.value?.novelArtwork?._id) return
  chaptersLoading.value = true
  try {
    const { data } = await getChapters(series.value.novelArtwork._id)
    chapters.value = Array.isArray(data) ? data : []
  } catch (err) {
    chapters.value = []
  } finally {
    chaptersLoading.value = false
  }
}

function goToArtwork(artworkId) {
  router.push(`/artworks/${artworkId}`)
}

function navigateTo(path) {
  router.push(path)
}

function goBack() {
  router.back()
}

onMounted(async () => {
  try {
    await seriesStore.fetchSeriesById(route.params.id)
    if (series.value?.type === 'novel') {
      await loadChapters()
    }
  } catch (err) {
    seriesLoadError.value = err?.response?.data?.message || 'Failed to load series'
  }
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="isNavCollapsed = !isNavCollapsed">
    <div class="series-detail-page" v-if="!seriesStore.detailLoading || series">
      <div v-if="!series && seriesStore.detailLoading" class="state-loading">
        <p>Loading series...</p>
      </div>

      <div v-else-if="!series" class="state-error">
        <h2>Series not found</h2>
        <p>The series you're looking for doesn't exist or has been removed.</p>
        <button type="button" class="back-btn" @click="goBack">Go back</button>
      </div>

      <div v-else class="series-content">
        <button type="button" class="back-link" @click="goBack">
          <i class="fa-solid fa-arrow-left"></i> Back
        </button>

        <div v-if="successMsg" class="alert alert-success alert-dismissible fade show" role="alert">
          <i class="fa-solid fa-check-circle me-1"></i> {{ successMsg }}
          <button type="button" class="btn-close" @click="successMsg = ''" aria-label="Close"></button>
        </div>

        <div v-if="seriesLoadError" class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="fa-solid fa-exclamation-triangle me-1"></i> {{ seriesLoadError }}
          <button type="button" class="btn-close" @click="seriesLoadError = ''" aria-label="Close"></button>
        </div>

        <SeriesHero :series="series" />

        <SeriesArtworksGrid
          v-if="series.type !== 'novel'"
          :artworks="processedArtworks"
          @select="goToArtwork"
        />

        <SeriesChaptersList
          v-else
          :series="series"
          :chapters="processedChapters"
          :loading="chaptersLoading"
          :is-owner="isOwner"
          @refresh="loadChapters"
          @navigate="navigateTo"
        />

        <div v-if="isOwner" class="owner-actions">
          <router-link
            :to="'/dashboard?tab=works'"
            class="owner-btn owner-btn--edit"
          >
            <i class="fa-solid fa-pen"></i> Manage in Dashboard
          </router-link>
        </div>
      </div>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.series-detail-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  min-height: 60vh;
}

.state-loading,
.state-error {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b7280;
}

.state-error h2 { color: #ef4444; margin-bottom: 0.5rem; }

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  background: transparent;
  color: #6366f1;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0;
  margin-bottom: 1rem;
}

.back-link:hover { opacity: 0.75; }

.back-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 999px;
  height: 38px;
  padding: 0 1.5rem;
  cursor: pointer;
  margin-top: 1rem;
}

.back-btn:hover { background: #f9fafb; }

.owner-actions {
  margin-top: 1.5rem;
  display: flex;
}

.owner-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
}

.owner-btn--edit {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.owner-btn--edit:hover { background: #f9fafb; }
</style>
