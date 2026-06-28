<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getFeed } from '../services/api'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { ArtworkCard } from '@/components/artwork'


const artworks = ref([])
const totalArtworks = ref(0)
const loading = ref(false)
const error = ref('')

const isNavCollapsed = ref(true)

const currentPage = ref(1)
const totalPages = ref(1)

const subTabsLeft = [
  { id: 'all', label: 'Illustrations and Manga' }, // Pixiv groups these
  { id: 'novel', label: 'Novels' },
  { id: 'collection', label: 'Collections' },
]

const r18Tabs = [
  { id: 'all_age', label: 'All' },
  { id: 'r18', label: 'R-18' },
]

const activeLeftTab = ref('all')
const activeR18Tab = ref('all_age')

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function loadFeedData(page = 1, append = false) {
  loading.value = true
  error.value = ''
  try {
    const params = { page, limit: 30 }
    
    const { data } = await getFeed(params)
    
    const feedItems = Array.isArray(data.artworks)
      ? data.artworks.map((item) => ({
          ...item,
          image: item.images?.[0] || '',
        }))
      : []

    if (append) {
      artworks.value = [...artworks.value, ...feedItems]
    } else {
      artworks.value = feedItems
    }
    
    totalArtworks.value = data.total || 0
    currentPage.value = data.page || page
    totalPages.value = data.pages || 0
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to load newest artworks from your followed users.'
    if (!append) {
      artworks.value = []
    }
  } finally {
    loading.value = false
  }
}

const visibleItems = computed(() => {
  let filtered = artworks.value
  
  if (activeLeftTab.value === 'all') {
    filtered = filtered.filter(item => item.type === 'illust' || item.type === 'manga' || !item.type)
  } else {
    filtered = filtered.filter(item => item.type === activeLeftTab.value)
  }

  // Handle R-18 display
  if (activeR18Tab.value === 'all_age') {
    filtered = filtered.filter(item => !item.isR18 && !item.tags?.includes('R-18'))
  } else if (activeR18Tab.value === 'r18') {
    filtered = filtered.filter(item => item.isR18 || item.tags?.includes('R-18'))
  }

  return filtered
})

function loadMore() {
  if (currentPage.value < totalPages.value) {
    loadFeedData(currentPage.value + 1, true)
  }
}

onMounted(() => {
  loadFeedData(1, false)
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="following-newest-page">
      <h1 class="page-title">Following</h1>

      <div class="filter-bar">
        <div class="left-pills">
          <button type="button"
            v-for="tab in subTabsLeft"
            :key="tab.id"
            class="pill-btn"
            :class="{ active: activeLeftTab === tab.id }"
            @click="activeLeftTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="right-pills">
          <button type="button"
            v-for="tab in r18Tabs"
            :key="tab.id"
            class="pill-btn"
            :class="{ active: activeR18Tab === tab.id }"
            @click="activeR18Tab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="content-block">
        <p v-if="loading && artworks.length === 0" class="state-note mt-3">Loading artworks...</p>
        <p v-else-if="error" class="state-note error mt-3">{{ error }}</p>

        <div v-if="visibleItems.length > 0" class="result-grid mt-4">
          <ArtworkCard v-for="item in visibleItems" :key="item._id" :item="item" />
        </div>
        <p v-else-if="!loading && artworks.length === 0" class="state-note mt-4">
          No new artworks found. Follow more users to see their newest works here!
        </p>

        <div class="load-more-container mt-4" v-if="currentPage < totalPages">
          <button type="button" class="btn btn-primary" @click="loadMore" :disabled="loading">
            {{ loading ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.following-newest-page {
  width: 100%;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  margin-bottom: 1.5rem;
}

.left-pills, .right-pills {
  display: flex;
  gap: 0.5rem;
}

.pill-btn {
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 0.42rem 0.72rem;
  border-radius: 999px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.2s ease;
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

.content-block {
  padding: 0 0 2rem;
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
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

@media (max-width: 920px) {
  .result-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
