<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDiscovery } from '../services/api'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { ArtworkCard } from '@/components/artwork'

const route = useRoute()
const router = useRouter()

const artworks = ref([])
const loading = ref(false)
const error = ref('')
const isNavCollapsed = ref(true)

const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)

const tabs = [
  { key: 'illust', label: 'Illustrations' },
  { key: 'manga', label: 'Manga' },
  { key: 'gif', label: 'GIF' },
  { key: 'novel', label: 'Novels' },
]

const activeType = computed(() => (typeof route.query.type === 'string' ? route.query.type : 'illust'))
const activePage = computed(() => parseInt(route.query.page, 10) || 1)

const r18Filter = ref('all')
const LIMIT = 30

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

function buildTypeRoute(type, page = 1) {
  return {
    path: '/discovery',
    query: { type, page },
  }
}

async function loadArtworks() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await getDiscovery({ type: activeType.value, page: activePage.value, limit: LIMIT })
    const items = Array.isArray(data.artworks)
      ? data.artworks.map((item) => ({
          ...item,
          image: item.images?.[0] || '',
        }))
      : []
    artworks.value = items
    totalItems.value = data.total || 0
    totalPages.value = data.pages || 1
    currentPage.value = data.page || activePage.value
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to load artworks.'
    artworks.value = []
  } finally {
    loading.value = false
  }
}

const visibleItems = computed(() => {
  if (r18Filter.value === 'r18') {
    return artworks.value.filter((item) => item.ageRating === 'r-18')
  }
  return artworks.value.filter((item) => item.ageRating !== 'r-18')
})

const pageNumbers = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  router.push({ path: '/discovery', query: { type: activeType.value, page } })
}

watch(
  () => route.query,
  () => {
    loadArtworks()
  },
)

onMounted(() => {
  loadArtworks()
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="discovery-page">
      <h1 class="page-title">Discovery</h1>

      <!-- Tabs -->
      <nav class="type-tabs" aria-label="Content type tabs">
        <router-link
          v-for="tab in tabs"
          :key="tab.key"
          class="type-tab"
          :class="{ active: activeType === tab.key }"
          :to="buildTypeRoute(tab.key)"
        >
          {{ tab.label }}
        </router-link>
      </nav>

      <!-- R-18 filter -->
      <div class="filter-bar">
        <button
          type="button"
          class="pill-btn"
          :class="{ active: r18Filter === 'all' }"
          @click="r18Filter = 'all'"
        >
          All
        </button>
        <button
          type="button"
          class="pill-btn"
          :class="{ active: r18Filter === 'r18' }"
          @click="r18Filter = 'r18'"
        >
          R-18
        </button>
      </div>

      <!-- Content -->
      <div class="content-block">
        <p v-if="loading" class="state-note">Loading...</p>
        <p v-else-if="error" class="state-note error">{{ error }}</p>

        <div v-else-if="visibleItems.length" class="artwork-grid">
          <ArtworkCard v-for="item in visibleItems" :key="item._id" :item="item" />
        </div>
        <p v-else class="state-note">No artworks found.</p>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="pagination" aria-label="Pagination">
          <button
            type="button"
            class="page-btn"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <template v-for="(p, idx) in pageNumbers" :key="idx">
            <span v-if="p === '...'" class="page-ellipsis">...</span>
            <button
              v-else
              type="button"
              class="page-btn"
              :class="{ active: p === currentPage }"
              @click="goToPage(p)"
            >
              {{ p }}
            </button>
          </template>
          <button
            type="button"
            class="page-btn"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </nav>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.discovery-page {
  width: 100%;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0;
  padding: 0.5rem 0;
}

.type-tabs {
  display: flex;
  gap: 1.5rem;
  border-bottom: 1px solid var(--line);
  margin-bottom: 1rem;
}

.type-tab {
  font-size: 1rem;
  font-weight: 700;
  color: var(--muted);
  text-decoration: none;
  padding-bottom: 0.6rem;
  border-bottom: 3px solid transparent;
}

.type-tab.active {
  color: var(--brand);
  border-bottom-color: var(--accent);
}

.type-tab:hover:not(.active) {
  color: var(--text);
}

.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.pill-btn {
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
}

.pill-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.pill-btn:hover:not(.active) {
  background: var(--surface-alt);
  border-color: var(--accent);
  color: var(--brand);
}

.artwork-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.25rem;
}

.state-note {
  margin: 0;
  color: var(--muted);
}

.state-note.error {
  color: var(--danger);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin-top: 2rem;
  padding-bottom: 1.5rem;
}

.page-btn {
  min-width: 2rem;
  height: 2rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled):not(.active) {
  background: var(--surface-alt);
  border-color: var(--accent);
}

.page-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-ellipsis {
  min-width: 1.5rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
}

@media (max-width: 700px) {
  .artwork-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
}
</style>
