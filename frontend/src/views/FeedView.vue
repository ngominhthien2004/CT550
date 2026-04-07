<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArtworks } from '../services/api'
import SearchOptionsModal from '../components/search/SearchOptionsModal.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const feedItems = ref([])
const sortMode = ref('latest')
const showTags = ref(true)
const isSearchOptionsOpen = ref(false)
const searchOptionsDraft = ref({
  includeAll: '',
  includeAny: '',
  exclude: '',
  target: 'all',
  type: 'illust',
})

const keyword = computed(() => {
  const q = typeof route.query.q === 'string' ? route.query.q.trim() : ''
  return q || 'discover'
})

const activeType = computed(() => (typeof route.query.type === 'string' ? route.query.type : 'illust'))

const currentSearchOptions = computed(() => ({
  includeAll: typeof route.query.qall === 'string' ? route.query.qall : '',
  includeAny: typeof route.query.qany === 'string' ? route.query.qany : '',
  exclude: typeof route.query.qnot === 'string' ? route.query.qnot : '',
  target: typeof route.query.target === 'string' ? route.query.target : 'all',
  type: typeof route.query.type === 'string' ? route.query.type : 'illust',
}))

const relatedTags = computed(() => {
  const bucket = new Map()

  for (const item of feedItems.value) {
    for (const tag of item.tags || []) {
      const name = tag?.name?.trim()
      if (!name) {
        continue
      }

      const normalized = name.toLowerCase()
      const count = bucket.get(normalized)?.count || 0
      bucket.set(normalized, {
        label: name,
        count: count + 1,
      })
    }
  }

  return Array.from(bucket.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 9)
})

const visibleItems = computed(() => {
  const source = [...feedItems.value]

  if (sortMode.value === 'popular') {
    source.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
  }

  return source
})

function normalizeKeywords(raw) {
  return String(raw || '')
    .toLowerCase()
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildTargetText(item, target) {
  const title = item.title || ''
  const description = item.description || ''
  const tags = (item.tags || []).map((tag) => tag?.name || '').join(' ')
  const author = `${item.user?.displayName || ''} ${item.user?.username || ''}`

  if (target === 'title') {
    return title.toLowerCase()
  }
  if (target === 'tags') {
    return tags.toLowerCase()
  }
  if (target === 'artist') {
    return author.toLowerCase()
  }
  if (target === 'description') {
    return description.toLowerCase()
  }

  return `${title} ${description} ${tags} ${author}`.toLowerCase()
}

function openSearchOptions() {
  searchOptionsDraft.value = { ...currentSearchOptions.value }
  isSearchOptionsOpen.value = true
}

async function applySearchOptions(payload) {
  const query = {}
  const currentSimpleQuery = typeof route.query.q === 'string' ? route.query.q.trim() : ''

  if (currentSimpleQuery) {
    query.q = currentSimpleQuery
  }
  if (payload.type) {
    query.type = payload.type
  }
  if (payload.includeAll) {
    query.qall = payload.includeAll
  }
  if (payload.includeAny) {
    query.qany = payload.includeAny
  }
  if (payload.exclude) {
    query.qnot = payload.exclude
  }
  if (payload.target && payload.target !== 'all') {
    query.target = payload.target
  }

  await router.push({
    path: '/feed',
    query,
  })
}

async function loadFeed() {
  loading.value = true
  error.value = ''

  try {
    const q = typeof route.query.q === 'string' ? route.query.q : ''
    const type = typeof route.query.type === 'string' ? route.query.type : 'illust'
    const includeAllRaw = typeof route.query.qall === 'string' ? route.query.qall : ''
    const includeAnyRaw = typeof route.query.qany === 'string' ? route.query.qany : ''
    const excludeRaw = typeof route.query.qnot === 'string' ? route.query.qnot : ''
    const target = typeof route.query.target === 'string' ? route.query.target : 'all'
    const { data } = await getArtworks()
    const normalizedQuery = q.trim().toLowerCase()
    const includeAllTokens = [...normalizeKeywords(normalizedQuery), ...normalizeKeywords(includeAllRaw)]
    const includeAnyTokens = normalizeKeywords(includeAnyRaw)
    const excludeTokens = normalizeKeywords(excludeRaw)

    const baseItems = Array.isArray(data)
      ? data.map((item) => ({
          ...item,
          image: item.images?.[0] || '',
        }))
      : []

    feedItems.value = baseItems.filter((item) => {
      const matchesType = type ? item.type === type : true
      const haystack = buildTargetText(item, target)
      const matchesAll = includeAllTokens.every((token) => haystack.includes(token))
      const matchesAny = includeAnyTokens.length ? includeAnyTokens.some((token) => haystack.includes(token)) : true
      const matchesExclude = excludeTokens.every((token) => !haystack.includes(token))
      return matchesType && matchesAll && matchesAny && matchesExclude
    })
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to fetch artworks'
    feedItems.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFeed()
})

watch(
  () => route.query,
  () => {
    loadFeed()
  },
  { deep: true },
)
</script>

<template>
  <section class="search-page page-block">
    <header class="search-header">
      <h1>{{ keyword }}</h1>
      <button type="button" class="show-tag-btn" @click="showTags = !showTags">{{ showTags ? 'Hide tag' : 'Show tag' }}</button>
    </header>

    <div class="tag-strip" v-if="showTags && relatedTags.length">
      <span v-for="tag in relatedTags" :key="tag.label" class="tag-chip">#{{ tag.label }}</span>
    </div>

    <nav class="result-tabs" aria-label="Result tabs">
      <span class="tab-item" :class="{ active: activeType === 'illust' }">Illustrations</span>
      <span class="tab-item" :class="{ active: activeType === 'manga' }">Manga</span>
      <span class="tab-item" :class="{ active: activeType === 'novel' }">Novels</span>
      <span class="tab-item">User</span>
      <button type="button" class="search-option-note" @click="openSearchOptions">Search option</button>
    </nav>

    <div class="toolbar">
      <label class="toolbar-select">
        <span>Order</span>
        <select v-model="sortMode">
          <option value="latest">Newest</option>
          <option value="popular">Sort by popularity</option>
        </select>
      </label>
      <span class="toolbar-hint">Include {{ activeType === 'manga' ? 'illustration' : 'manga' }}</span>
      <span class="result-count">{{ visibleItems.length.toLocaleString() }} results</span>
    </div>

    <aside class="search-callout" v-if="visibleItems.length">
      <strong>Search option</strong>
      <p class="mb-0">You can now refine your search with more specific filters.</p>
    </aside>

    <p v-if="loading" class="state-note">Loading results...</p>
    <p v-else-if="error" class="state-note error">{{ error }}</p>

    <div v-else-if="visibleItems.length" class="result-grid">
      <article v-for="item in visibleItems" :key="item._id" class="result-card">
        <router-link :to="`/artworks/${item._id}`" class="thumb-link">
          <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
          <div v-else class="thumb-fallback"></div>
        </router-link>
        <router-link :to="`/artworks/${item._id}`" class="title-link">{{ item.title }}</router-link>
        <p class="author-name">{{ item.user?.displayName || item.user?.username || 'Unknown artist' }}</p>
      </article>
    </div>

    <p v-else class="state-note">No search result found.</p>

    <SearchOptionsModal
      v-model="isSearchOptionsOpen"
      :initial-values="searchOptionsDraft"
      @apply="applySearchOptions"
    />
  </section>
</template>

<style scoped>
.search-page {
  display: grid;
  gap: 0.95rem;
  padding: 1.3rem;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.search-header h1 {
  margin: 0;
  font-size: 2.1rem;
}

.show-tag-btn {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #334155;
  font-weight: 700;
  padding: 0.45rem 0.72rem;
}

.tag-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-chip {
  border-radius: 8px;
  color: #fff;
  font-size: 0.92rem;
  font-weight: 700;
  padding: 0.42rem 0.72rem;
}

.tag-chip:nth-child(4n + 1) {
  background: #c084fc;
}

.tag-chip:nth-child(4n + 2) {
  background: #60a5fa;
}

.tag-chip:nth-child(4n + 3) {
  background: #fb7185;
}

.tag-chip:nth-child(4n + 4) {
  background: #a3e635;
  color: #334155;
}

.result-tabs {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.2rem;
}

.tab-item {
  color: #64748b;
  font-weight: 700;
  padding-bottom: 0.65rem;
}

.tab-item.active {
  color: #0f172a;
  border-bottom: 3px solid #1695f0;
}

.search-option-note {
  border: none;
  background: transparent;
  cursor: pointer;
  margin-left: auto;
  color: #334155;
  font-size: 0.95rem;
  font-weight: 700;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.toolbar-select {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #334155;
  font-weight: 700;
}

.toolbar-select select {
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #334155;
  padding: 0.38rem 0.72rem;
}

.toolbar-hint {
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 0.35rem 0.72rem;
}

.result-count {
  margin-left: auto;
  color: #475569;
  font-weight: 700;
}

.search-callout {
  justify-self: end;
  width: min(340px, 100%);
  border-radius: 16px;
  background: #1695f0;
  color: #fff;
  padding: 0.78rem 0.9rem;
  box-shadow: 0 8px 18px rgba(22, 149, 240, 0.36);
}

.search-callout strong {
  display: block;
  font-size: 1rem;
  margin-bottom: 0.2rem;
}

.search-callout p {
  font-size: 0.92rem;
}

.state-note {
  margin: 0;
  color: #64748b;
}

.state-note.error {
  color: #dc2626;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(178px, 1fr));
  gap: 0.95rem;
}

.result-card {
  display: grid;
  gap: 0.42rem;
}

.thumb-link {
  display: block;
  border-radius: 12px;
  overflow: hidden;
  background: #e2e8f0;
  aspect-ratio: 4 / 5;
}

.thumb-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.thumb-link:hover img {
  transform: scale(1.03);
}

.thumb-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #cbd5e1, #e2e8f0);
}

.title-link {
  text-decoration: none;
  color: #0f172a;
  font-weight: 700;
  font-size: 0.95rem;
}

.author-name {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
}

@media (max-width: 920px) {
  .search-page {
    padding: 0.9rem;
  }

  .search-header h1 {
    font-size: 1.6rem;
  }

  .search-option-note {
    display: none;
  }

  .search-callout {
    justify-self: stretch;
  }

  .result-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
