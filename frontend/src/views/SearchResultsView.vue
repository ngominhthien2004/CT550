<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchOptionsModal from '../components/search/SearchOptionsModal.vue'
import { getArtworks } from '../services/api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const searchItems = ref([])
const sortMode = ref('newest')
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

const searchTypeTabs = [
  { key: 'illust', label: 'Illustrations' },
  { key: 'manga', label: 'Manga' },
  { key: 'novel', label: 'Novels' },
]

const currentSearchOptions = computed(() => ({
  includeAll: typeof route.query.qall === 'string' ? route.query.qall : '',
  includeAny: typeof route.query.qany === 'string' ? route.query.qany : '',
  exclude: typeof route.query.qnot === 'string' ? route.query.qnot : '',
  target: typeof route.query.target === 'string' ? route.query.target : 'all',
  type: typeof route.query.type === 'string' ? route.query.type : 'illust',
}))

const baseSearchQuery = computed(() => {
  const query = {}
  const q = typeof route.query.q === 'string' ? route.query.q.trim() : ''
  const qall = typeof route.query.qall === 'string' ? route.query.qall : ''
  const qany = typeof route.query.qany === 'string' ? route.query.qany : ''
  const qnot = typeof route.query.qnot === 'string' ? route.query.qnot : ''
  const target = typeof route.query.target === 'string' ? route.query.target : ''

  if (q) query.q = q
  if (qall) query.qall = qall
  if (qany) query.qany = qany
  if (qnot) query.qnot = qnot
  if (target && target !== 'all') query.target = target

  return query
})

const relatedTags = computed(() => {
  const bucket = new Map()

  for (const item of searchItems.value) {
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
    .slice(0, 12)
})

const visibleItems = computed(() => {
  const source = [...searchItems.value]

  if (sortMode.value === 'popular') {
    source.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
  } else {
    source.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  }

  return source
})

const placeholderCount = computed(() => {
  if (loading.value || error.value || !visibleItems.value.length) {
    return 0
  }

  return Math.min(18, Math.max(0, 30 - visibleItems.value.length))
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

function buildTypeRoute(type) {
  return {
    path: '/search',
    query: {
      ...baseSearchQuery.value,
      type,
    },
  }
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
    path: '/search',
    query,
  })
}

async function loadSearchItems() {
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

    searchItems.value = baseItems.filter((item) => {
      const matchesType = type ? item.type === type : true
      const haystack = buildTargetText(item, target)
      const matchesAll = includeAllTokens.every((token) => haystack.includes(token))
      const matchesAny = includeAnyTokens.length ? includeAnyTokens.some((token) => haystack.includes(token)) : true
      const matchesExclude = excludeTokens.every((token) => !haystack.includes(token))
      return matchesType && matchesAll && matchesAny && matchesExclude
    })
  } catch (fetchError) {
    error.value = fetchError?.response?.data?.message || 'Failed to fetch artworks'
    searchItems.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSearchItems()
})

watch(
  () => route.query,
  () => {
    loadSearchItems()
  },
  { deep: true },
)
</script>

<template>
  <section class="search-result-page page-block">
    <header class="result-header">
      <h1>{{ keyword }}</h1>
      <button type="button" class="show-tag-btn" @click="showTags = !showTags">
        {{ showTags ? 'Hide tag' : 'Show tag' }}
      </button>
    </header>

    <div class="tag-strip" v-if="showTags && relatedTags.length">
      <button v-for="tag in relatedTags" :key="tag.label" type="button" class="tag-chip">#{{ tag.label }}</button>
    </div>

    <nav class="result-tabs" aria-label="Result tabs">
      <router-link
        v-for="tab in searchTypeTabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeType === tab.key }"
        :to="buildTypeRoute(tab.key)"
      >
        {{ tab.label }}
      </router-link>
      <span class="tab-item tab-muted">User</span>
      <button type="button" class="search-option-note" @click="openSearchOptions">Search option</button>
    </nav>

    <div class="filter-row">
      <label class="order-select">
        <select v-model="sortMode">
          <option value="newest">Newest</option>
          <option value="popular">Sort by popularity</option>
        </select>
      </label>
      <button type="button" class="filter-chip is-active">All-Ages</button>
      <button type="button" class="filter-chip">R-18</button>
      <span class="include-note">Include manga</span>
    </div>

    <p v-if="loading" class="state-note">Loading results...</p>
    <p v-else-if="error" class="state-note error">{{ error }}</p>

    <div v-else class="result-grid-wrap">
      <article v-for="item in visibleItems" :key="item._id" class="result-card">
        <router-link :to="`/artworks/${item._id}`" class="thumb-link">
          <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
          <div v-else class="thumb-fallback"></div>
        </router-link>
        <router-link :to="`/artworks/${item._id}`" class="title-link">{{ item.title }}</router-link>
        <p class="author-name">{{ item.user?.displayName || item.user?.username || 'Unknown artist' }}</p>
      </article>

      <article v-for="idx in placeholderCount" :key="`placeholder-${idx}`" class="result-card placeholder-card">
        <div class="thumb-placeholder"></div>
        <div class="line-placeholder long"></div>
        <div class="line-placeholder short"></div>
      </article>
    </div>

    <SearchOptionsModal
      v-model="isSearchOptionsOpen"
      :initial-values="searchOptionsDraft"
      @apply="applySearchOptions"
    />
  </section>
</template>

<style scoped>
.search-result-page {
  display: grid;
  gap: 0.95rem;
  padding: 1.05rem 1.15rem 1.25rem;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.result-header h1 {
  margin: 0;
  text-transform: lowercase;
  font-size: 2rem;
  color: #111827;
}

.show-tag-btn {
  border: none;
  background: transparent;
  color: #475569;
  font-weight: 600;
  font-size: 0.88rem;
}

.tag-strip {
  display: flex;
  gap: 0.52rem;
  overflow: auto;
  padding-bottom: 0.3rem;
}

.tag-chip {
  border: none;
  color: #fff;
  border-radius: 4px;
  padding: 0.38rem 0.75rem;
  white-space: nowrap;
  font-size: 0.84rem;
  font-weight: 700;
}

.tag-chip:nth-child(5n + 1) { background: #94b96d; }
.tag-chip:nth-child(5n + 2) { background: #66b4b1; }
.tag-chip:nth-child(5n + 3) { background: #9a73c9; }
.tag-chip:nth-child(5n + 4) { background: #6f84c8; }
.tag-chip:nth-child(5n + 5) { background: #c48f75; }

.result-tabs {
  display: flex;
  align-items: flex-end;
  gap: 1.35rem;
  border-bottom: 1px solid #e2e8f0;
}

.tab-item {
  text-decoration: none;
  padding-bottom: 0.62rem;
  color: #64748b;
  font-weight: 700;
  border-bottom: 3px solid transparent;
}

.tab-item.active {
  color: #0f172a;
  border-bottom-color: #1695f0;
}

.tab-muted {
  color: #9ca3af;
}

.search-option-note {
  margin-left: auto;
  border: none;
  background: transparent;
  color: #4b5563;
  font-weight: 700;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.order-select select {
  border: none;
  background: #f8fafc;
  border-radius: 999px;
  padding: 0.35rem 0.62rem;
  font-weight: 700;
  color: #374151;
}

.filter-chip {
  border: none;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.78rem;
  padding: 0.3rem 0.58rem;
}

.filter-chip.is-active {
  color: #ea580c;
  background: #fff7ed;
}

.include-note {
  color: #6b7280;
  font-size: 0.8rem;
}

.state-note {
  margin: 0;
  color: #64748b;
}

.state-note.error {
  color: #dc2626;
}

.result-grid-wrap {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.72rem;
}

.result-card {
  display: grid;
  gap: 0.3rem;
}

.thumb-link {
  display: block;
  border-radius: 6px;
  overflow: hidden;
  background: #e5e7eb;
  aspect-ratio: 1 / 1;
}

.thumb-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #cbd5e1, #e2e8f0);
}

.title-link {
  text-decoration: none;
  color: #111827;
  font-size: 0.77rem;
  font-weight: 700;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.author-name {
  margin: 0;
  color: #6b7280;
  font-size: 0.7rem;
}

.placeholder-card {
  opacity: 0.55;
}

.thumb-placeholder {
  border-radius: 6px;
  background: #e5e7eb;
  aspect-ratio: 1 / 1;
}

.line-placeholder {
  border-radius: 999px;
  background: #e5e7eb;
  height: 8px;
}

.line-placeholder.long {
  width: 90%;
}

.line-placeholder.short {
  width: 62%;
}

@media (max-width: 1200px) {
  .result-grid-wrap {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .search-result-page {
    padding: 0.86rem;
  }

  .result-grid-wrap {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
