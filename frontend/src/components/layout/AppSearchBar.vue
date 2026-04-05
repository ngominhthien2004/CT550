<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArtworks } from '../../services/api'

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
const searchValue = ref(typeof route.query.q === 'string' ? route.query.q : '')
const featuredArtworks = ref([])
const activeIndex = ref(0)
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
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  if (import.meta.env.DEV && imagePath.startsWith('/uploads/')) {
    return `http://127.0.0.1:5000${imagePath}`
  }

  return imagePath
}

async function submitSearch() {
  const normalizedQuery = searchValue.value.trim()
  await router.push({
    path: '/feed',
    query: normalizedQuery ? { q: normalizedQuery } : {},
  })
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
  if (props.variant === 'showcase' || props.backgroundOnly) {
    await loadLatestArtworkCovers()
    startRotation()
  }
})

onBeforeUnmount(() => {
  stopRotation()
})
</script>

<template>
  <div class="search-shell" :class="[`search-shell--${props.variant}`, { 'search-shell--background-only': props.backgroundOnly }]">
    <div v-if="props.variant === 'showcase' || props.backgroundOnly" class="showcase-bg" :style="showcaseBackground"></div>
    <div class="search-overlay"></div>

    <form v-if="!props.backgroundOnly" class="search-content" @submit.prevent="submitSearch">
      <label class="search-field" aria-label="Search artworks">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input v-model="searchValue" type="search" :placeholder="props.placeholder" aria-label="Search artworks" />
      </label>
      <button type="submit" class="search-submit">Search</button>
    </form>

    <p v-if="!props.backgroundOnly && props.variant === 'showcase' && activeArtwork" class="showcase-caption mb-0">
      <span class="showcase-caption-title">{{ activeArtwork.title }}</span>
      <span class="showcase-caption-author">by {{ activeArtwork.author }}</span>
    </p>
  </div>
</template>

<style scoped>
.search-shell {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
}

.search-shell--compact {
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
}

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
  background-size: cover;
  background-position: center;
  transition: background-image 0.55s ease;
}

.search-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(15, 23, 42, 0.22), rgba(30, 41, 59, 0));
}

.search-shell--compact .search-overlay {
  display: none;
}

.search-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem;
}

.search-shell--showcase .search-content {
  padding: 0.9rem;
}

.search-field {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  border: 1px solid rgba(203, 213, 225, 0.95);
  padding: 0.42rem 0.8rem;
  color: #475569;
}

.search-shell--compact .search-field {
  border: none;
  background: transparent;
  padding-block: 0.15rem;
}

.search-field input {
  flex: 1;
  border: none;
  background: transparent;
  color: #0f172a;
  font-size: 0.95rem;
}

.search-field input:focus {
  outline: none;
}

.search-submit {
  border: none;
  border-radius: 999px;
  padding: 0.46rem 0.95rem;
  background: #1d4ed8;
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}

.search-shell--compact .search-submit {
  display: none;
}

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

  .search-shell--showcase .search-content {
    padding: 0.7rem;
  }
}
</style>
