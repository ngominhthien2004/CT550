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
  inputAriaControls: {
    type: String,
    default: undefined,
  },
  inputAriaExpanded: {
    type: [Boolean, String],
    default: undefined,
  },
  inputAriaHaspopup: {
    type: String,
    default: undefined,
  },
  searchScope: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['history-closed'])

const router = useRouter()
const route = useRoute()
const SEARCH_HISTORY_KEY = 'illuwrl.searchHistory'
const SEARCH_HISTORY_LIMIT = 8
function getRouteSearchValue() {
  if (typeof route.query.q === 'string') {
    return route.query.q
  }

  return typeof route.query.nick === 'string' ? route.query.nick : ''
}

const searchValue = ref(getRouteSearchValue())
const featuredArtworks = ref([])
const activeIndex = ref(0)
const searchHistory = ref([])
const isHistoryOpen = ref(false)
const searchShellRef = ref(null)
const searchInputRef = ref(null)
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

  closeHistoryPanel()
  const scopeType = props.searchScope?.trim()
  const query = {}
  let path = '/search'

  if (scopeType === 'user') {
    path = '/search/users'
    if (normalizedQuery) {
      query.nick = normalizedQuery
    }
    query.s_mode = 's_usr'
  } else {
    if (normalizedQuery) {
      query.q = normalizedQuery
    }
    if (scopeType) {
      query.type = scopeType
    }
    if (scopeType === 'novel') {
      query.s_mode = 'tag_tc'
    }
  }

  await router.push({
    path,
    query,
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

function closeHistoryPanel() {
  if (!isHistoryOpen.value) {
    return
  }

  isHistoryOpen.value = false
  emit('history-closed')
}

function closeHistoryPanelOnOutsideClick(event) {
  if (!searchShellRef.value) {
    return
  }

  if (!searchShellRef.value.contains(event.target)) {
    closeHistoryPanel()
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
  () => [route.query.q, route.query.nick],
  () => {
    searchValue.value = getRouteSearchValue()
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

defineExpose({
  closeHistory: closeHistoryPanel,
  focusInput: () => searchInputRef.value?.focus(),
})
</script>

<template>
  <div ref="searchShellRef" class="search-shell" :class="[`search-shell--${props.variant}`, { 'search-shell--background-only': props.backgroundOnly }]">
    <div v-if="props.variant === 'showcase' || props.backgroundOnly" class="showcase-bg" :style="showcaseBackground"></div>
    <div class="search-overlay"></div>

    <form v-if="!props.backgroundOnly" class="search-content" @submit.prevent="submitSearch">
      <div v-if="props.variant === 'compact'" class="search-compact-control">
        <label class="search-field" aria-label="Search artworks">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            ref="searchInputRef"
            v-model="searchValue"
            type="search"
            :placeholder="props.placeholder"
            :aria-controls="props.inputAriaControls"
            :aria-expanded="props.inputAriaExpanded"
            :aria-haspopup="props.inputAriaHaspopup"
            aria-label="Search artworks"
            @focus="openHistoryPanel"
            @click="openHistoryPanel"
          />
        </label>
        <div v-if="$slots['trailing-control']" class="search-compact-trailing">
          <slot name="trailing-control" />
        </div>
      </div>
      <template v-else>
        <label class="search-field" aria-label="Search artworks">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            ref="searchInputRef"
            v-model="searchValue"
            type="search"
            :placeholder="props.placeholder"
            :aria-controls="props.inputAriaControls"
            :aria-expanded="props.inputAriaExpanded"
            :aria-haspopup="props.inputAriaHaspopup"
            aria-label="Search artworks"
            @focus="openHistoryPanel"
            @click="openHistoryPanel"
          />
        </label>
        <button type="submit" class="search-submit">Search</button>
      </template>

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
  border-radius: 4px;
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
  padding: 0;
}

.search-shell--showcase .search-content {
  padding: 0.9rem;
}

.search-compact-control {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  height: 40px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.08);
  transition: background-color 0.2s, box-shadow 0.2s;
  width: 100%;
  position: relative;
}

.search-compact-control:hover {
  background-color: rgba(0, 0, 0, 0.0784);
}

.search-compact-control:focus-within {
  box-shadow: 0 0 0 3px rgba(0, 150, 250, 0.12);
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
  padding: 0.2rem 0.35rem 0.2rem 0.1rem;
  gap: 0.35rem;
}

/* Magnifying glass icon */
.search-shell--compact .search-field i {
  color: #858585;
  font-size: 16px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.search-compact-trailing {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 0 1 auto;
}

/* --- Input Element --- */
.search-field input {
  flex: 1;
  border: none;
  background: transparent;
  color: #474747;
  font-size: 0.875rem;
  line-height: 1.4;
}

.search-field input:focus {
  outline: none;
}

.search-field input::placeholder {
  color: #474747;
  opacity: 1;
}

.search-compact-trailing :deep(.icon-round) {
  height: 28px;
  min-width: 28px;
  width: auto;
  padding: 0 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
}

.search-compact-trailing :deep(.icon-round:hover) {
  background: rgba(0, 0, 0, 0.08);
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
    padding: 0;
  }

  .search-shell--showcase .search-content {
    padding: 0.7rem;
  }
}
</style>
