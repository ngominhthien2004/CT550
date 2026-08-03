<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSeriesStore } from '@/stores/series.store'
import { useAuthStore } from '@/stores/auth.store'
import { useLikeStore } from '@/stores/like.store'
import { seriesApi } from '@/services/api'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import SeriesHero from '@/components/series/SeriesHero.vue'
import SeriesArtworksGrid from '@/components/series/SeriesArtworksGrid.vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { translateError } from '../utils/translateError.js'
import { formatShortDate } from '../utils/date.js'

const route = useRoute()
const router = useRouter()
const seriesStore = useSeriesStore()
const authStore = useAuthStore()
const likeStore = useLikeStore()
const { t, locale } = useI18n()

const { showError } = useToast()

const isNavCollapsed = ref(true)
const seriesLoadError = ref('')
const successMsg = ref('')
let successTimeout = null

function showSuccess(msg) {
  successMsg.value = msg
  if (successTimeout) clearTimeout(successTimeout)
  successTimeout = setTimeout(() => { successMsg.value = '' }, 3000)
}

const seriesId = computed(() => route.params.id)
const series = computed(() => seriesStore.currentSeries)

const processedArtworks = computed(() => {
  if (!series.value?.artworks?.length) return []
  const seriesUser = series.value.user
  return series.value.artworks.map(artwork => ({
    ...artwork,
    _icon: getSeriesIcon(artwork.type || series.value?.type),
    user: seriesUser,
  }))
})

// Số artwork của series được user like tại thời điểm load (snapshot ban đầu).
const likedCountAtLoad = ref(0)

// Số artwork của series hiện đang được user like (reactive theo likeStore).
const currentlyLiked = computed(() => {
  if (!series.value?.artworks?.length) return 0
  return series.value.artworks.filter((a) => likeStore.getLikeStatus(a._id)).length
})

// Tổng like hiển thị trên hero: base + delta (dương/âm khi like/unlike ngay trên trang).
const displayTotalLikes = computed(() => {
  const base = series.value?.totalLikes ?? 0
  return base - likedCountAtLoad.value + currentlyLiked.value
})

const isOwner = computed(() => {
  if (!series.value || !authStore.user) return false
  const seriesUser = series.value.user?._id || series.value.user
  return String(seriesUser) === String(authStore.user._id)
})

function formatDate(dateStr) {
  return formatShortDate(dateStr, locale.value)
}

function getSeriesIcon(type) {
  switch (type) {
    case 'manga': return 'fa-solid fa-book'
    case 'novel': return 'fa-solid fa-pen-fancy'
    case 'illust': return 'fa-solid fa-image'
    default: return 'fa-solid fa-book'
  }
}

function goToArtwork(artworkId) {
  router.push(`/artworks/${artworkId}`)
}

function goToAddArtwork() {
  if (!series.value?._id) return
  const allowedKinds = ['illust', 'manga', 'novel']
  const kind = allowedKinds.includes(series.value.type) ? series.value.type : 'illust'
  const query = { seriesId: series.value._id }
  const suggested = series.value.suggestedTags
  const tagNames = Array.isArray(suggested) ? suggested.filter(Boolean) : []
  if (tagNames.length > 0) {
    query.tags = tagNames.join(',')
  }
  router.push({ name: 'upload-kind', params: { kind }, query })
}

function navigateTo(path) {
  router.push(path)
}

function goBack() {
  router.back()
}

async function handleReorder(newArtworkIds) {
  if (!series.value?._id) return

  const originalArtworks = [...series.value.artworks]

  // Optimistic update: reorder artworks in the store immediately
  const reorderedArtworks = newArtworkIds
    .map((id) => originalArtworks.find((a) => a._id === id))
    .filter(Boolean)
  seriesStore.currentSeries = { ...series.value, artworks: reorderedArtworks }

  try {
    await seriesApi.reorder(series.value._id, newArtworkIds)
  } catch {
    // Revert to original order on failure
    seriesStore.currentSeries = { ...series.value, artworks: originalArtworks }
    showError(t('series.reorderFailed'))
  }
}

async function loadSeries() {
  seriesLoadError.value = ''
  try {
    await seriesStore.fetchSeriesById(seriesId.value)
    if (authStore.isAuthenticated) {
      // Batch like-status for accurate hearts (replaces 120-limit fallback)
      const artworkIds = (series.value?.artworks || []).map((a) => a._id)
      if (artworkIds.length > 0) {
        await likeStore.fetchLikeStatuses(artworkIds)
      }
      // Keep fetchMyLikes for backwards compat with other views
      await likeStore.fetchMyLikes({ limit: 120 })
    }
    likedCountAtLoad.value = currentlyLiked.value
  } catch (err) {
    seriesLoadError.value = translateError(err, t, 'artwork.noData')
  }
}

watch(seriesId, loadSeries, { immediate: true })
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="isNavCollapsed = !isNavCollapsed">
    <div class="series-detail-page">
      <div v-if="seriesStore.detailLoading && !series" class="state-loading">
        <p>{{ $t('artwork.loadingSeries') }}</p>
      </div>

      <div v-else-if="!series" class="state-error">
        <h2>{{ $t('artwork.seriesNotFound') }}</h2>
        <p>{{ $t('artwork.seriesRemoved') }}</p>
        <button type="button" class="back-btn" @click="goBack">{{ $t('artwork.goBack') }}</button>
      </div>

      <div v-else class="series-content">
        <button type="button" class="back-link" @click="goBack">
          <i class="fa-solid fa-arrow-left"></i> {{ $t('artwork.back') }}
        </button>

        <div v-if="successMsg" class="alert alert-success alert-dismissible fade show" role="alert">
          <i class="fa-solid fa-check-circle me-1"></i> {{ successMsg }}
          <button type="button" class="btn-close" @click="successMsg = ''" aria-label="Close"></button>
        </div>

        <div v-if="seriesLoadError" class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="fa-solid fa-exclamation-triangle me-1"></i> {{ seriesLoadError }}
          <button type="button" class="btn-close" @click="seriesLoadError = ''" aria-label="Close"></button>
        </div>

        <SeriesHero :series="series" :total-likes-override="displayTotalLikes" />

        <SeriesArtworksGrid
          :artworks="processedArtworks"
          :is-owner="isOwner"
          @select="goToArtwork"
          @add-artwork="goToAddArtwork"
          @reorder="handleReorder"
        />

        <div v-if="isOwner" class="owner-actions">
          <router-link
            :to="'/dashboard?tab=works'"
            class="owner-btn owner-btn--edit"
          >
            <i class="fa-solid fa-pen"></i> {{ $t('artwork.manageDashboard') }}
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
  color: var(--muted);
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
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 999px;
  height: 38px;
  padding: 0 1.5rem;
  cursor: pointer;
  margin-top: 1rem;
}

.back-btn:hover { background: var(--surface-alt); }

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
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
}

.owner-btn--edit:hover { background: var(--surface-alt); }
</style>
