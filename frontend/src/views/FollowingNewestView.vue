<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getFeed } from '../services/api'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'

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
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="following-newest-page">
      
      <div class="top-nav-container">
        <nav class="top-nav-tabs" aria-label="Top level tabs">
          <router-link to="/newest_by_followed" class="top-tab active">Users you are following</router-link>
          <a href="#" class="top-tab disabled">Works on Watchlist</a>
          <a href="#" class="top-tab disabled">My pixiv</a>
        </nav>
      </div>

      <div class="filter-bar">
        <div class="left-pills">
          <button
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
          <button
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
          <article v-for="item in visibleItems" :key="item._id" class="result-card">
            <router-link :to="`/artworks/${item._id}`" class="thumb-link">
              <span v-if="item.isR18 || item.tags?.includes('R-18')" class="r18-badge">R-18</span>
              <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
              <div v-else class="thumb-fallback"></div>
            </router-link>
            <router-link :to="`/artworks/${item._id}`" class="title-link">{{ item.title }}</router-link>
            <div class="author-info">
              <div class="author-avatar"></div>
              <p class="author-name">{{ item.user?.displayName || item.user?.username || 'Unknown artist' }}</p>
            </div>
          </article>
        </div>
        <p v-else-if="!loading && artworks.length === 0" class="state-note mt-4">
          No new artworks found. Follow more users to see their newest works here!
        </p>

        <div class="load-more-container mt-4" v-if="currentPage < totalPages">
          <button type="button" class="load-more-btn" @click="loadMore" :disabled="loading">
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

.top-nav-container {
  padding: 0;
}

.top-nav-tabs {
  display: flex;
  gap: 1.5rem;
  padding-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.top-tab {
  font-size: 1rem;
  font-weight: 700;
  color: #71717a;
  text-decoration: none;
  padding-bottom: 0.6rem;
  border-bottom: 3px solid transparent;
}

.top-tab.active {
  color: #18181b;
  border-bottom: 3px solid #0096fa;
}

.top-tab.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
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
  background: transparent;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 99px;
  font-weight: 700;
  color: #52525b;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.pill-btn.active {
  background: #f4f4f5;
  color: #18181b;
}

.pill-btn:hover:not(.active) {
  background: #fafafa;
}

.content-block {
  padding: 0 0 2rem;
}

.state-note {
  margin: 0;
  color: #71717a;
}

.state-note.error {
  color: #ef4444;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
}

.result-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.thumb-link {
  display: block;
  border-radius: 6px;
  overflow: hidden;
  background: #f4f4f5;
  aspect-ratio: 1; /* Pixiv uses squares for the feed generally */
  position: relative;
}

.r18-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 10;
}

.thumb-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.thumb-link:hover img {
  transform: scale(1.05);
}

.thumb-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e4e4e7, #f4f4f5);
}

.title-link {
  text-decoration: none;
  color: #18181b;
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #d4d4d8;
}

.author-name {
  margin: 0;
  color: #71717a;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.load-more-btn {
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  color: #18181b;
  padding: 0.6rem 2rem;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #e4e4e7;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 920px) {
  .result-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
