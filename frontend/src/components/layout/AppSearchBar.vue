<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArtworks } from '../../services/api'
import AppSearchHistoryPanel from './AppSearchHistoryPanel.vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search by title, tag, or artist',
  },
  variant: {
    type: String,
    default: 'compact',
    validator: (value) => ['compact', 'showcase'].includes(value),
  },
  backgroundOnly: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const route = useRoute()
const SEARCH_HISTORY_KEY = 'illuwrl.searchHistory'
const SEARCH_HISTORY_LIMIT = 8
const searchValue = ref(typeof route.query.q === 'string' ? route.query.q : '')
const featuredArtworks = ref([])
const activeIndex = ref(0)
const searchHistory = ref([])
const isHistoryOpen = ref(false)
const searchShellRef = ref(null)
const defaultSuggestions = ['landscape', 'character design', 'fanart', 'manga panel', 'novel cover']
let rotationTimer = null

const activeArtwork = computed(() => featuredArtworks.value[activeIndex.value] || null)

const showcaseBackground = computed(() => {
  if (!activeArtwork.value?.image) {
    return {
      backgroundImage: 'linear-gradient(120deg, rgba(15, 23, 42, 0.78), rgba(30, 41, 59, 0.48))',
    }
  }

  return {
    backgroundImage: `linear-gradient(120deg, rgba(15, 23, 42, 0.74), rgba(30, 41, 59, 0.34)), url('${activeArtwork.value.image}')`,
  }
})

function normalizeImagePath(imagePath) {
  if (!imagePath) {
    return ''
  }
  return imagePath
}

async function submitSearch() {
  const normalizedQuery = searchValue.value.trim()
  if (normalizedQuery) {
    rememberSearchQuery(normalizedQuery)
  }

  isHistoryOpen.value = false
  await router.push({
    path: '/search',
    query: normalizedQuery ? { q: normalizedQuery } : {},
  })
}

function loadSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY)
    const parsed = JSON.parse(raw || '[]')
    searchHistory.value = Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string' && item.trim()) : []
  } catch (_error) {
    searchHistory.value = []
  }
}

function saveSearchHistory() {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value.slice(0, SEARCH_HISTORY_LIMIT)))
}

function rememberSearchQuery(query) {
  const normalized = query.trim()
  if (!normalized) {
    return
  }

  const deduped = [normalized, ...searchHistory.value.filter((item) => item !== normalized)]
  searchHistory.value = deduped.slice(0, SEARCH_HISTORY_LIMIT)
  saveSearchHistory()
}

const filteredSuggestions = computed(() => {
  const keyword = searchValue.value.trim().toLowerCase()
  if (!keyword) {
    return defaultSuggestions
  }

  return defaultSuggestions.filter((item) => item.toLowerCase().includes(keyword)).slice(0, 5)
})

function deleteHistoryItem(item) {
  searchHistory.value = searchHistory.value.filter((entry) => entry !== item)
  saveSearchHistory()
}

function clearSearchHistory() {
  searchHistory.value = []
  saveSearchHistory()
}

async function chooseHistoryItem(item) {
  searchValue.value = item
  await submitSearch()
}

function openHistoryPanel() {
  if (!props.backgroundOnly) {
    isHistoryOpen.value = true
  }
}

function closeHistoryPanelOnOutsideClick(event) {
  if (!searchShellRef.value) {
    return
  }

  if (!searchShellRef.value.contains(event.target)) {
    isHistoryOpen.value = false
  }
}

async function loadLatestArtworkCovers() {
  try {
    const response = await getArtworks({ limit: 4 })
    featuredArtworks.value = (response.data || []).map((artwork) => ({
      id: artwork._id,
      title: artwork.title || 'Untitled artwork',
      author: artwork.user?.displayName || artwork.user?.username || 'Unknown artist',
      image: normalizeImagePath(artwork.images?.[0]),
    }))
  } catch (_error) {
    featuredArtworks.value = []
  }
}

function startRotation() {
  if (rotationTimer || featuredArtworks.value.length < 2) {
    return
  }

  rotationTimer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % featuredArtworks.value.length
  }, 4000)
}

function stopRotation() {
  if (!rotationTimer) {
    return
  }

  clearInterval(rotationTimer)
  rotationTimer = null
}

watch(
  () => route.query.q,
  (value) => {
    searchValue.value = typeof value === 'string' ? value : ''
  },
)

watch(featuredArtworks, () => {
  activeIndex.value = 0
  stopRotation()
  startRotation()
})

onMounted(async () => {
  loadSearchHistory()

  if (!props.backgroundOnly) {
    document.addEventListener('mousedown', closeHistoryPanelOnOutsideClick)
  }

  if (props.variant === 'showcase' || props.backgroundOnly) {
    await loadLatestArtworkCovers()
    startRotation()
  }
})

onBeforeUnmount(() => {
  if (!props.backgroundOnly) {
    document.removeEventListener('mousedown', closeHistoryPanelOnOutsideClick)
  }
  stopRotation()
})
</script>

<template>
  <div ref="searchShellRef" class="search-shell" :class="[`search-shell--${props.variant}`, { 'search-shell--background-only': props.backgroundOnly }]">
    <div v-if="props.variant === 'showcase' || props.backgroundOnly" class="showcase-bg" :style="showcaseBackground"></div>
    <div class="search-overlay"></div>

    <form v-if="!props.backgroundOnly" class="search-content" @submit.prevent="submitSearch">
      <label class="search-field" aria-label="Search artworks">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input
          v-model="searchValue"
          type="search"
          :placeholder="props.placeholder"
          aria-label="Search artworks"
          @focus="openHistoryPanel"
          @click="openHistoryPanel"
        />
      </label>
      <button v-if="props.variant === 'showcase'" type="submit" class="search-submit">Search</button>

      <AppSearchHistoryPanel
        v-if="isHistoryOpen"
        :search-history="searchHistory"
        :filtered-suggestions="filteredSuggestions"
        @choose-item="chooseHistoryItem"
        @delete-item="deleteHistoryItem"
        @clear-history="clearSearchHistory"
      />
    </form>

    <p v-if="!props.backgroundOnly && props.variant === 'showcase' && activeArtwork" class="showcase-caption mb-0">
      <span class="showcase-caption-title">{{ activeArtwork.title }}</span>
      <span class="showcase-caption-author">by {{ activeArtwork.author }}</span>
    </p>
  </div>
</template>

<style scoped>
/* ========================================
   Pixiv Charcoal Search Bar Design System
   ======================================== */

.search-shell {
  position: relative;
  border-radius: 22px;
  overflow: visible;
}

/* --- Compact Variant (Pixiv-style) --- */
.search-shell--compact {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #ffffff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-shell--compact:focus-within {
  border-color: #0096fa;
  box-shadow: 0 0 0 3px rgba(0, 150, 250, 0.12);
}

/* --- Showcase Variant (unchanged hero style) --- */
.search-shell--showcase {
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
  min-height: 132px;
  background: linear-gradient(120deg, rgba(15, 23, 42, 0.78), rgba(30, 41, 59, 0.48));
}

.search-shell--background-only {
  position: absolute;
  inset: 0;
  border: none;
  border-radius: 0;
  min-height: 100%;
  box-shadow: none;
}

.showcase-bg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-size: cover;
  background-position: center;
  transition: background-image 0.55s ease;
}

.search-overlay {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(120deg, rgba(15, 23, 42, 0.22), rgba(30, 41, 59, 0));
}

.search-shell--compact .search-overlay {
  display: none;
}

/* --- Search Content Layout --- */
.search-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem;
}

.search-shell--compact .search-content {
  padding: 0.3rem 0.5rem;
}

.search-shell--showcase .search-content {
  padding: 0.9rem;
}

/* --- Search Field (the input wrapper) --- */
.search-field {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 8px;
  border: 1px solid rgba(203, 213, 225, 0.95);
  padding: 0.42rem 0.8rem;
  color: #475569;
}

.search-shell--compact .search-field {
  border: none;
  background: transparent;
  padding: 0.2rem 0.5rem;
  gap: 0.4rem;
}

/* Magnifying glass icon */
.search-shell--compact .search-field i {
  color: #858585;
  font-size: 16px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

/* --- Input Element --- */
.search-field input {
  flex: 1;
  border: none;
  background: transparent;
  color: #1f1f1f;
  font-size: 0.9rem;
  line-height: 1.4;
}

.search-field input:focus {
  outline: none;
}

.search-field input::placeholder {
  color: #858585;
  opacity: 1;
}

/* --- Submit Button (showcase only) --- */
.search-submit {
  border: none;
  border-radius: 8px;
  padding: 0.46rem 0.95rem;
  background: #1d4ed8;
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}

/* --- Showcase Caption --- */
.showcase-caption {
  position: relative;
  z-index: 1;
  color: #f8fafc;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0 0.95rem 0.82rem;
  text-shadow: 0 2px 8px rgba(15, 23, 42, 0.5);
}

.showcase-caption-title {
  font-weight: 700;
  font-size: 0.95rem;
}

.showcase-caption-author {
  font-size: 0.83rem;
  opacity: 0.92;
}

@media (max-width: 920px) {
  .search-shell--showcase {
    min-height: 122px;
  }

  .search-content {
    padding: 0.5rem;
  }

  .search-shell--compact .search-content {
    padding: 0.25rem 0.4rem;
  }

  .search-shell--showcase .search-content {
    padding: 0.7rem;
  }
}
</style>
