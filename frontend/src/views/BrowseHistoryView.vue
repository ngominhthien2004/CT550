<script setup>
import { onMounted, computed } from 'vue'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'
import { useBrowseHistoryStore } from '@/stores/browseHistory.store'
import { useAuthStore } from '@/stores/auth.store'

import { formatShortDate } from '../utils/date.js'


const browseHistoryStore = useBrowseHistoryStore()
const authStore = useAuthStore()

const historyEntries = computed(() => browseHistoryStore.entries)
const loading = computed(() => browseHistoryStore.loading)
const error = computed(() => browseHistoryStore.error)
const total = computed(() => browseHistoryStore.total)
const currentPage = computed(() => browseHistoryStore.page)
const totalPages = computed(() => browseHistoryStore.pages)

const processedHistory = computed(() =>
  historyEntries.value.map(entry => ({
    ...entry,
    _timeAgo: timeAgo(entry.createdAt),
  }))
)

onMounted(() => {
  browseHistoryStore.fetchHistory(1)
})

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    browseHistoryStore.fetchHistory(page)
  }
}

function handleClearHistory() {
  if (confirm('Are you sure you want to clear your browsing history?')) {
    browseHistoryStore.clearHistory()
  }
}

function formatDate(dateStr) {
  return formatShortDate(dateStr)
}

function timeAgo(dateStr) {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}
</script>

<template>
  <MainLayoutTemplate>
    <div class="browse-history-page">
      <div class="page-header">
        <h1><i class="fa-regular fa-clock me-2"></i>Browsing History</h1>
        <p class="text-muted">Artworks you've viewed recently</p>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

      <div v-else-if="historyEntries.length === 0" class="empty-state text-center py-5">
        <i class="fa-regular fa-clock fa-3x text-muted mb-3"></i>
        <h4 class="text-muted">No browsing history yet</h4>
        <p class="text-muted">Artworks you view will appear here</p>
        <router-link to="/discovery" class="btn btn-primary mt-2">
          <i class="fa-regular fa-compass me-1"></i> Explore artworks
        </router-link>
      </div>

      <div v-else>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="text-muted small">{{ total }} artwork{{ total !== 1 ? 's' : '' }} viewed</span>
          <button type="button" class="btn btn-outline-danger btn-sm" @click="handleClearHistory">
            <i class="fa-regular fa-trash-can me-1"></i> Clear history
          </button>
        </div>

        <div class="history-grid">
          <div
            v-for="entry in processedHistory"
            :key="entry._id"
            class="history-card"
          >
            <router-link :to="`/artworks/${entry.artwork._id}`" class="history-card-link">
              <div class="history-thumb">
                <img
                  :src="entry.artwork.images?.[0] || 'https://via.placeholder.com/200'"
                  :alt="entry.artwork.title"
                />
                <span class="history-time-badge">{{ entry._timeAgo }}</span>
              </div>
              <div class="history-info">
                <h5 class="history-title">{{ entry.artwork.title }}</h5>
                <div class="history-author">
                  <img
                    :src="entry.artwork.user?.avatar || 'https://s.pximg.net/common/images/no_profile.png'"
                    :alt="entry.artwork.user?.displayName || entry.artwork.user?.username || 'User'"
                    class="author-avatar"
                  />
                  <span>{{ entry.artwork.user?.displayName || entry.artwork.user?.username || 'Unknown' }}</span>
                </div>
                <div class="history-tags" v-if="entry.artwork.tags?.length">
                  <span class="tag-chip" v-for="tag in entry.artwork.tags.slice(0, 4)" :key="tag._id">
                    #{{ tag.name }}
                  </span>
                </div>
                <div class="history-meta">
                  <span><i class="fa-regular fa-heart me-1"></i>{{ entry.artwork.likeCount || 0 }}</span>
                  <span><i class="fa-regular fa-bookmark me-1"></i>{{ entry.artwork.bookmarkCount || 0 }}</span>
                  <span><i class="fa-regular fa-eye me-1"></i>{{ entry.artwork.viewCount || 0 }}</span>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="mt-4">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage <= 1 }">
              <button type="button" class="page-link" @click="goToPage(currentPage - 1)">Previous</button>
            </li>
            <li
              v-for="p in totalPages"
              :key="p"
              class="page-item"
              :class="{ active: p === currentPage }"
            >
              <button type="button" class="page-link" @click="goToPage(p)">{{ p }}</button>
            </li>
            <li class="page-item" :class="{ disabled: currentPage >= totalPages }">
              <button type="button" class="page-link" @click="goToPage(currentPage + 1)">Next</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.browse-history-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem 0;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
}

.empty-state {
  opacity: 0.7;
}

.history-grid {
  display: grid;
  gap: 0.75rem;
}

.history-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
}

.history-card:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

.history-card-link {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  text-decoration: none;
  color: inherit;
}

.history-thumb {
  position: relative;
  flex-shrink: 0;
  width: 120px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
}

.history-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.history-time-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0,0,0,0.65);
  color: #fff;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-author {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--muted);
  margin-bottom: 0.35rem;
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.history-tags {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-bottom: 0.35rem;
}

.tag-chip {
  font-size: 0.7rem;
  background: var(--surface-alt);
  color: var(--accent);
  padding: 1px 7px;
  border-radius: 999px;
}

.history-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--muted);
}

@media (max-width: 600px) {
  .history-thumb {
    width: 90px;
    height: 68px;
  }

  .history-card-link {
    padding: 0.5rem;
    gap: 0.6rem;
  }
}
</style>
