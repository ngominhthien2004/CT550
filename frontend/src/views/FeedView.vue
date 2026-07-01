<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArtworks } from '../services/api.js'
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

const searchTypeTabs = [
  { key: 'illust', label: 'Illustrations' },
  { key: 'manga', label: 'Manga' },
  { key: 'novel', label: 'Novels' },
]

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

const currentSearchOptions = computed(() => ({
  includeAll: typeof route.query.qall === 'string' ? route.query.qall : '',
  includeAny: typeof route.query.qany === 'string' ? route.query.qany : '',
  exclude: typeof route.query.qnot === 'string' ? route.query.qnot : '',
  target: typeof route.query.target === 'string' ? route.query.target : 'all',
  type: typeof route.query.type === 'string' ? route.query.type : 'illust',
}))

function pickTopTags(items) {
  const bucket = {}
  for (const item of items) {
    for (const tag of item.tags || []) {
      const name = tag?.name?.trim()
      if (!name) continue
      const normalized = name.toLowerCase()
      const existing = bucket[normalized]
      bucket[normalized] = {
        label: name,
        count: (existing?.count || 0) + 1,
      }
    }
  }
  return Object.values(bucket)
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 9)
}

const relatedTags = computed(() => pickTopTags(feedItems.value))

function sortByViewCountDesc(items) {
  const copy = items.slice()
  copy.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
  return copy
}

const visibleItems = computed(() => {
  if (sortMode.value === 'popular') {
    return sortByViewCountDesc(feedItems.value)
  }
  return feedItems.value.slice()
})

function normalizeKeywords(raw) {
  return String(raw || '')
    .toLowerCase()
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildTypeRoute(type) {
  return {
    path: '/feed',
    query: {
      ...baseSearchQuery.value,
      type,
    },
  }
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
  if (target === 'title_caption') {
    return `${title} ${description}`.toLowerCase()
  }
  if (target === 'tag_partial' || target === 'tag_exact') {
    return tags.toLowerCase()
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
  () => ({ ...route.query }),
  () => {
    loadFeed()
  },
)
</script>

<template>
  <section class="search-page page-block">
    <header class="search-header">
      <h1>{{ keyword }}</h1>
      <button type="button" class="show-tag-btn" @click="showTags = !showTags">{{ showTags ? 'Hide tag' : 'Show tag' }}</button>
    </header>

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
      <span class="tab-item is-muted">Users</span>
      <button type="button" class="search-option-note" @click="openSearchOptions">Search option</button>
    </nav>

    <div class="tag-strip" v-if="showTags && relatedTags.length">
      <span v-for="tag in relatedTags" :key="tag.label" class="tag-chip">#{{ tag.label }}</span>
    </div>

    <div class="toolbar">
      <label class="toolbar-select">
        <span>Order</span>
        <select v-model="sortMode" aria-label="Sort mode">
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
  text-transform: capitalize;
}

.show-tag-btn {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-alt);
  color: var(--text);
  font-weight: 700;
  padding: 0.45rem 0.72rem;
}

.tag-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: -0.05rem;
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
  color: var(--text);
}

.result-tabs {
  display: flex;
  align-items: flex-end;
  gap: 1.15rem;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.2rem;
}

.tab-item {
  text-decoration: none;
  color: var(--muted);
  font-weight: 700;
  padding-bottom: 0.65rem;
  border-bottom: 3px solid transparent;
}

.tab-item.active {
  color: var(--brand);
  border-bottom: 3px solid var(--accent);
}

.tab-item.is-muted {
  color: var(--muted);
}

.search-option-note {
  border: none;
  background: transparent;
  cursor: pointer;
  margin-left: auto;
  color: var(--text);
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
  color: var(--text);
  font-weight: 700;
}

.toolbar-select select {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  padding: 0.38rem 0.72rem;
}

.toolbar-hint {
  color: var(--muted);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.35rem 0.72rem;
}

.result-count {
  margin-left: auto;
  color: var(--text);
  font-weight: 700;
}

.search-callout {
  justify-self: end;
  width: min(340px, 100%);
  border-radius: 16px;
  background: var(--accent);
  color: var(--surface);
  padding: 0.78rem 0.9rem;
  box-shadow: var(--shadow-md);
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
  color: var(--muted);
}

.state-note.error {
  color: var(--danger);
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
  background: var(--line);
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
  background: linear-gradient(135deg, var(--line), var(--surface-alt));
}

.title-link {
  text-decoration: none;
  color: var(--brand);
  font-weight: 700;
  font-size: 0.95rem;
}

.author-name {
  margin: 0;
  color: var(--muted);
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
