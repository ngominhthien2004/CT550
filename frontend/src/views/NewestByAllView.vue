<script setup>
import { computed, onMounted, ref } from 'vue'
import { getDiscovery } from '../services/api'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { ArtworkCard } from '@/components/artwork'
import { navItems } from '../constants/navigation'

const artworks = ref([])
const loading = ref(false)
const error = ref('')
const isNavCollapsed = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)

const subTabs = [
  { id: 'illust', label: 'Illustrations' },
  { id: 'manga', label: 'Manga' },
  { id: 'novel', label: 'Novels' },
]

const r18Tabs = [
  { id: 'all_age', label: 'General' },
  { id: 'r18', label: 'R-18' },
]

const activeTab = ref('illust')
const activeR18Tab = ref('all_age')

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

async function loadFeedData(page = 1, append = false) {
  loading.value = true
  error.value = ''
  try {
    const params = {
      page,
      limit: 30,
      type: activeTab.value !== 'all' ? activeTab.value : undefined,
    }

    const { data } = await getDiscovery(params)

    const feedItems = Array.isArray(data.artworks) ? data.artworks : []

    if (append) {
      artworks.value = [...artworks.value, ...feedItems]
    } else {
      artworks.value = feedItems
    }

    currentPage.value = data.page || page
    totalPages.value = data.pages || 0
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to load artworks.'
    if (!append) artworks.value = []
  } finally {
    loading.value = false
  }
}

const visibleItems = computed(() => {
  let filtered = artworks.value

  // Local fallback type filter (API also filters, this handles edge cases)
  if (activeTab.value && activeTab.value !== 'all') {
    filtered = filtered.filter((item) => item.type === activeTab.value)
  }

  // Age rating filter
  if (activeR18Tab.value === 'all_age') {
    filtered = filtered.filter((item) => item.ageRating === 'all' || !item.ageRating)
  } else if (activeR18Tab.value === 'r18') {
    filtered = filtered.filter(
      (item) => item.ageRating === 'r-18' || item.ageRating === 'r-18g',
    )
  }

  return filtered
})

function loadMore() {
  if (currentPage.value < totalPages.value) {
    loadFeedData(currentPage.value + 1, true)
  }
}

function handleTabChange(tabId) {
  activeTab.value = tabId
  loadFeedData(1, false)
}

onMounted(() => loadFeedData(1, false))
</script>

<template>
  <MainLayoutTemplate
    :nav-items="navItems"
    :is-nav-collapsed="isNavCollapsed"
    site-name="IlluWrl"
    @toggle-sidebar="toggleLeftNav"
  >
    <section class="newest-all-page">
      <h1 class="page-title">New from All users</h1>

      <!-- Navigation bar -->
      <div class="navigation-bar">
        <nav class="sub-tabs">
          <button
            v-for="tab in subTabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="handleTabChange(tab.id)"
          >
            {{ tab.label }}
          </button>
        </nav>

        <div class="r18-pills">
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

      <!-- Content -->
      <div class="content-area">
        <p v-if="loading && artworks.length === 0" class="state-note">Loading artworks...</p>
        <p v-else-if="error" class="state-note error">{{ error }}</p>

        <div v-if="visibleItems.length > 0" class="artwork-grid">
          <ArtworkCard v-for="item in visibleItems" :key="item._id" :item="item" />
        </div>

        <p v-else-if="!loading && artworks.length === 0" class="state-note">
          No works found in this category.
        </p>

        <div v-if="currentPage < totalPages" class="pagination-footer">
          <button class="load-more-btn" :disabled="loading" @click="loadMore">
            {{ loading ? 'Loading...' : 'Show more' }}
          </button>
        </div>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.newest-all-page {
  padding: 0 72px 48px;
}

.page-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #18181b;
  margin: 20px 0 16px;
}

/* ─── Navigation bar ─── */
.navigation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e4e7;
  margin-bottom: 24px;
}

.sub-tabs {
  display: flex;
  gap: 28px;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 12px 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #71717a;
  cursor: pointer;
  position: relative;
  transition: color 0.15s;
}

.tab-btn:hover {
  color: #18181b;
}

.tab-btn.active {
  color: #18181b;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: #0096fa;
  border-radius: 3px 3px 0 0;
}

/* ─── R-18 pills ─── */
.r18-pills {
  display: flex;
  gap: 6px;
  padding-bottom: 8px;
}

.pill-btn {
  padding: 5px 14px;
  border-radius: 999px;
  border: none;
  font-size: 0.82rem;
  font-weight: 700;
  background: transparent;
  color: #52525b;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.pill-btn:hover {
  background: #f4f4f5;
}

.pill-btn.active {
  background: #f4f4f5;
  color: #18181b;
}

/* ─── Grid ─── */
.artwork-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 20px 14px;
}

/* ─── States ─── */
.state-note {
  text-align: center;
  color: #71717a;
  margin: 40px 0;
}

.state-note.error {
  color: #ef4444;
}

/* ─── Pagination ─── */
.pagination-footer {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.load-more-btn {
  padding: 9px 48px;
  border-radius: 999px;
  border: 1px solid #e4e4e7;
  background: #f4f4f5;
  font-weight: 700;
  font-size: 0.9rem;
  color: #18181b;
  cursor: pointer;
  transition: background 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #e4e4e7;
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Responsive ─── */
@media (max-width: 1400px) {
  .artwork-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .artwork-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .newest-all-page {
    padding: 0 16px 40px;
  }
  .artwork-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .artwork-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
