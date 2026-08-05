<script setup>
import { computed, ref, onMounted } from 'vue'
import { formatShortDate } from '../../utils/date.js'
import { useSeriesCover } from '@/composables/useSeriesCover'
import { useI18n } from 'vue-i18n'
import { watchlistApi } from '@/services/api.js'
import { useAuthStore } from '@/stores/auth.store.js'

const props = defineProps({
  series: { type: Object, required: true },
  totalLikesOverride: { type: Number, default: null },
  isOwner: { type: Boolean, default: false },
  seriesId: { type: String, default: '' },
})

const emit = defineEmits(['upload-cover'])

const { t, locale } = useI18n()
const coverUrl = useSeriesCover(props.series)
const authStore = useAuthStore()

const fileInput = ref(null)
const isUploading = ref(false)
const isWatching = ref(false)
const watchlistLoading = ref(false)
const watchlistCount = ref(0)

function openFilePicker() {
  fileInput.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('coverImage', file)

  isUploading.value = true
  emit('upload-cover', { formData, onDone: () => { isUploading.value = false }, fileInput })
}

const likesDisplay = computed(() => {
  const n = props.totalLikesOverride ?? props.series.totalLikes ?? 0
  return n.toLocaleString()
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

async function checkWatchlistStatus() {
  if (!authStore.isAuthenticated || !props.seriesId) return
  try {
    const { data } = await watchlistApi.checkStatus(props.seriesId)
    isWatching.value = data?.isWatching || false
  } catch {
    // Silently fail
  }
}

async function getWatchlistCount() {
  if (!props.seriesId) return
  try {
    const { data } = await watchlistApi.getCount(props.seriesId)
    watchlistCount.value = data?.count || 0
  } catch {
    // Silently fail
  }
}

async function toggleWatchlist() {
  if (!authStore.isAuthenticated) return
  watchlistLoading.value = true
  try {
    if (isWatching.value) {
      await watchlistApi.remove(props.seriesId)
      isWatching.value = false
      watchlistCount.value = Math.max(0, watchlistCount.value - 1)
    } else {
      await watchlistApi.add(props.seriesId)
      isWatching.value = true
      watchlistCount.value += 1
    }
  } catch {
    // Silently fail
  } finally {
    watchlistLoading.value = false
  }
}

onMounted(() => {
  checkWatchlistStatus()
  getWatchlistCount()
})
</script>

<template>
  <div class="series-hero">
    <div class="series-hero-cover">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="series.title"
      />
      <div v-else class="series-hero-nothumb">
        <i :class="getSeriesIcon(series.type)"></i>
      </div>
      <button
        v-if="isOwner"
        type="button"
        class="cover-edit-btn"
        :aria-label="t('series.editCover')"
        :disabled="isUploading"
        @click="openFilePicker"
      >
        <i v-if="isUploading" class="fa-solid fa-spinner fa-spin"></i>
        <i v-else class="fa-solid fa-pen"></i>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="sr-only"
        @change="handleFileChange"
      />
    </div>
    <div class="series-hero-info">
      <div class="series-hero-type">
        <span class="type-badge" :class="'type-' + series.type">
          <i :class="getSeriesIcon(series.type)"></i>
          {{ series.type }}
        </span>
        <span v-if="series.isCompleted" class="status-badge status-completed">
          <i class="fa-solid fa-check-circle"></i> {{ $t('series.completed') }}
        </span>
        <span v-else class="status-badge status-ongoing">
          <i class="fa-solid fa-play-circle"></i> {{ $t('series.ongoing') }}
        </span>
      </div>
      <h1 class="series-hero-title">{{ series.title }}</h1>
      <p v-if="series.description" class="series-hero-desc">{{ series.description }}</p>

      <div v-if="series.tags && series.tags.length > 0" class="series-hero-tags">
        <router-link
          v-for="tag in series.tags"
          :key="tag._id || tag.name || tag"
          :to="{ path: '/search', query: { q: tag.name || tag } }"
          class="series-tag-item"
        >
          #{{ tag.name || tag }}
        </router-link>
      </div>

      <div class="series-hero-stats">
        <div class="hero-stat">
          <i class="fa-solid fa-eye"></i>
          <span>{{ series.totalViews?.toLocaleString() || 0 }}</span>
          <span class="hero-stat-label">{{ $t('series.views') }}</span>
        </div>
        <div class="hero-stat">
          <i class="fa-solid fa-heart"></i>
          <span>{{ likesDisplay }}</span>
          <span class="hero-stat-label">{{ $t('series.likes') }}</span>
        </div>
        <div class="hero-stat">
          <i class="fa-solid fa-comment"></i>
          <span>{{ series.totalComments?.toLocaleString() || 0 }}</span>
          <span class="hero-stat-label">{{ $t('series.comments') }}</span>
        </div>
        <div class="hero-stat">
          <i class="fa-regular fa-calendar"></i>
          <span>{{ formatDate(series.createdAt) }}</span>
        </div>
      </div>

      <div class="series-hero-episodes">
        {{ series.artworkCount || 0 }} {{ series.type === 'novel' ? $t('series.chapters') : $t('series.episodes') }}
      </div>

      <div class="series-hero-actions" v-if="authStore.isAuthenticated && !isOwner">
        <button
          class="watchlist-btn"
          :class="{ 'is-watching': isWatching }"
          :disabled="watchlistLoading"
          @click="toggleWatchlist"
        >
          <i v-if="watchlistLoading" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else-if="isWatching" class="fa-solid fa-eye"></i>
          <i v-else class="fa-regular fa-eye"></i>
          {{ isWatching ? $t('series.watching') : $t('series.addToWatchlist') }}
        </button>
        <span class="watchlist-count" v-if="watchlistCount > 0">
          {{ watchlistCount }} {{ $t('series.watchers') }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.series-hero {
  display: flex;
  gap: 1.5rem;
  background: var(--surface);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}

.series-hero-cover {
  flex-shrink: 0;
  width: 220px;
  height: 220px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-alt);
  position: relative;
}

.series-hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.series-hero-nothumb {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--line);
  font-size: 3rem;
}

.cover-edit-btn {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  z-index: 1;
  border: none;
  background: rgba(15, 23, 42, 0.45);
  color: #fff;
  font-size: 0.9rem;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  backdrop-filter: blur(8px);
  cursor: pointer;
  display: grid;
  place-items: center;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.series-hero-cover:hover .cover-edit-btn {
  opacity: 1;
}

.cover-edit-btn:hover {
  background: rgba(15, 23, 42, 0.65);
}

.cover-edit-btn:disabled {
  cursor: not-allowed;
  opacity: 1;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.series-hero-info {
  flex: 1;
  min-width: 0;
}

.series-hero-type {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: var(--surface-alt, #eff6ff);
  color: var(--accent);
}

.type-novel { background: #fdf2f8; color: #ec4899; }
.type-manga { background: #f0fdf4; color: #22c55e; }
.type-illust { background: var(--surface-alt, #eff6ff); color: var(--accent); }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
}

.status-completed { background: #f0fdf4; color: #16a34a; }
.status-ongoing { background: #fef3c7; color: #d97706; }

.series-hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 0.5rem;
  line-height: 1.3;
}

.series-hero-desc {
  font-size: 0.88rem;
  color: var(--muted);
  line-height: 1.5;
  margin: 0 0 1rem;
}

.series-hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.85rem;
}

.series-tag-item {
  display: inline-flex;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--accent);
  background: var(--surface-alt, #f3f4f6);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.series-tag-item:hover {
  background: var(--accent);
  color: #ffffff;
}

.series-hero-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.hero-stat {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.hero-stat i { font-size: 0.8rem; width: 16px; text-align: center; }
.hero-stat i.fa-eye { color: var(--accent); }
.hero-stat i.fa-heart { color: #ef4444; }
.hero-stat i.fa-comment { color: #10b981; }

.hero-stat-label { font-size: 0.75rem; color: var(--muted); }

.series-hero-episodes { font-size: 0.8rem; color: var(--muted); }

.series-hero-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.watchlist-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--line, #e5e7eb);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.watchlist-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--surface-alt);
}

.watchlist-btn.is-watching {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.watchlist-btn.is-watching:hover {
  background: color-mix(in srgb, var(--accent) 85%, #000);
}

.watchlist-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.watchlist-count {
  font-size: 0.8rem;
  color: var(--muted);
}
</style>
