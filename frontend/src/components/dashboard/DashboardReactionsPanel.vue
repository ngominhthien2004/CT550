<script setup>
import { ref, onMounted, watch } from 'vue'
import { getCreatorReactions } from '../../services/api'
import { useToast } from '../../composables/useToast'

const currentTab = ref('comments') // 'comments' | 'likes' | 'bookmarks'
const reactions = ref([])
const loading = ref(false)
const error = ref('')
const requestId = ref(0)

// Pagination
const page = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const limit = 10

const { showError } = useToast()

async function fetchReactions() {
  const id = ++requestId.value
  loading.value = true
  error.value = ''
  try {
    const { data } = await getCreatorReactions({
      type: currentTab.value,
      page: page.value,
      limit,
    })
    if (id !== requestId.value) return  // stale response ignored
    reactions.value = data.data || []
    totalPages.value = data.pages || 1
    totalItems.value = data.total || 0
  } catch (err) {
    if (id !== requestId.value) return  // stale error ignored
    error.value = err?.response?.data?.message || 'Failed to load reactions'
    showError(error.value)
    reactions.value = []
  } finally {
    if (id === requestId.value) {
      loading.value = false
    }
  }
}

// Watchers
watch([currentTab, page], () => {
  fetchReactions()
})

// Trigger fetch when tab changes to reset page to 1
function setTab(tab) {
  if (currentTab.value !== tab) {
    currentTab.value = tab
    page.value = 1
  }
}

onMounted(() => {
  fetchReactions()
})

function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getArtworkLink(artwork) {
  if (!artwork) return '#'
  return artwork.type === 'novel' ? `/novels/${artwork._id}` : `/artworks/${artwork._id}`
}

function getArtworkThumb(artwork) {
  if (!artwork || !artwork.images || artwork.images.length === 0) {
    return '' // empty string → we'll use CSS fallback
  }
  return artwork.images[0]
}
</script>

<template>
  <div class="reactions-panel">
    <!-- Sub-tabs header -->
    <div class="sub-tabs">
      <button
        type="button"
        class="sub-tab"
        :class="{ 'sub-tab--active': currentTab === 'comments' }"
        @click="setTab('comments')"
      >
        Comments
      </button>
      <button
        type="button"
        class="sub-tab"
        :class="{ 'sub-tab--active': currentTab === 'likes' }"
        @click="setTab('likes')"
      >
        Likes
      </button>
      <button
        type="button"
        class="sub-tab"
        :class="{ 'sub-tab--active': currentTab === 'bookmarks' }"
        @click="setTab('bookmarks')"
      >
        Bookmarks
      </button>
    </div>

    <!-- Content area -->
    <div class="reactions-content mt-3">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-secondary mt-2">Loading reactions...</p>
      </div>

      <div v-else-if="error" class="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
        <span>{{ error }}</span>
        <button type="button" class="btn btn-sm btn-outline-danger" @click="fetchReactions">
          <i class="fa-solid fa-rotate me-1" aria-hidden="true"></i>Retry
        </button>
      </div>

      <div v-else-if="reactions.length === 0" class="empty-state">
        <div class="empty-icon-wrap">
          <i v-if="currentTab === 'comments'" class="fa-regular fa-comment" aria-hidden="true"></i>
          <i v-else-if="currentTab === 'likes'" class="fa-regular fa-thumbs-up" aria-hidden="true"></i>
          <i v-else class="fa-regular fa-heart" aria-hidden="true"></i>
        </div>
        <p class="empty-text">
          <span v-if="currentTab === 'comments'">You haven't received any comments yet</span>
          <span v-else-if="currentTab === 'likes'">You haven't received any likes yet</span>
          <span v-else>You haven't received any bookmarks yet</span>
        </p>
      </div>

      <div v-else class="reaction-list">
        <div v-for="item in reactions" :key="item._id" class="reaction-item">
          <!-- User info -->
          <router-link :to="`/account?user=${item.user?._id}`" class="user-avatar-link">
            <img
              v-if="item.user?.avatar"
              :src="item.user.avatar"
              alt="User avatar"
              class="user-avatar"
              loading="lazy"
            />
            <div v-else class="user-avatar user-avatar--placeholder">
              <i class="fa-regular fa-user" aria-hidden="true"></i>
            </div>
          </router-link>

          <div class="reaction-body">
            <div class="reaction-header">
              <router-link :to="`/account?user=${item.user?._id}`" class="user-name">
                {{ item.user?.displayName || item.user?.username || 'Guest' }}
              </router-link>
              <span class="reaction-time">{{ formatTime(item.createdAt) }}</span>
            </div>

            <!-- Reaction details -->
            <div class="reaction-detail-text">
              <template v-if="currentTab === 'comments'">
                <div class="comment-bubble">
                  <span v-if="item.emoji" class="comment-emoji me-1">{{ item.emoji }}</span>
                  <span class="comment-content">{{ item.content }}</span>
                </div>
              </template>
              <template v-else-if="currentTab === 'likes'">
                <span class="action-text text-secondary">
                  <i class="fa-solid fa-thumbs-up text-primary me-1" aria-hidden="true"></i>
                  liked your work
                </span>
              </template>
              <template v-else>
                <span class="action-text text-secondary">
                  <i class="fa-solid fa-heart text-danger me-1" aria-hidden="true"></i>
                  bookmarked your work
                </span>
              </template>
            </div>
          </div>

          <!-- Target Artwork -->
          <template v-if="item.artwork">
            <router-link :to="getArtworkLink(item.artwork)" class="artwork-preview">
              <div class="artwork-thumb-wrap">
                <img
                  v-if="getArtworkThumb(item.artwork)"
                  :src="getArtworkThumb(item.artwork)"
                  alt="Artwork thumbnail"
                  class="artwork-thumb"
                  loading="lazy"
                />
                <div v-else class="artwork-thumb artwork-thumb--placeholder">
                  <i class="fa-regular fa-image" aria-hidden="true"></i>
                </div>
              </div>
              <span class="artwork-title" :title="item.artwork.title">{{ item.artwork.title }}</span>
            </router-link>
          </template>
          <span v-else class="artwork-preview artwork-preview--deleted">
            <div class="artwork-thumb-wrap">
              <div class="artwork-thumb artwork-thumb--placeholder">
                <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
              </div>
            </div>
            <span class="artwork-title text-muted">Deleted work</span>
          </span>
        </div>
      </div>

      <!-- Pagination -->
      <nav v-if="totalPages > 1 && !loading" class="pagination-container mt-4" aria-label="Reactions pagination">
        <button
          type="button"
          class="pag-btn"
          :disabled="page === 1"
          @click="page--"
          aria-label="Previous page"
        >
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i> Prev
        </button>
        <span class="page-indicator">Page {{ page }} of {{ totalPages }}</span>
        <button
          type="button"
          class="pag-btn"
          :disabled="page === totalPages"
          @click="page++"
          aria-label="Next page"
        >
          Next <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.reactions-panel {
  background: #fff;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  padding: 1.25rem;
}

.sub-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0.2rem;
}

.sub-tab {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  cursor: pointer;
  position: relative;
  transition: color 0.15s ease;
}

.sub-tab:hover {
  color: #111827;
}

.sub-tab--active {
  color: #007cff;
}

.sub-tab--active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #007cff;
  border-radius: 99px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4.5rem 1rem;
  text-align: center;
  color: #9ca3af;
}

.empty-icon-wrap {
  font-size: 3rem;
  margin-bottom: 0.8rem;
  color: #cbd5e1;
}

.empty-text {
  font-size: 0.95rem;
  font-weight: 600;
}

.reaction-list {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.reaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.95rem 0.5rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.15s ease;
}

.reaction-item:hover {
  background-color: #fafafa;
}

.user-avatar-link {
  flex-shrink: 0;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}

.reaction-body {
  flex-grow: 1;
  min-width: 0;
}

.reaction-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}

.user-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: #1f2937;
  text-decoration: none;
}

.user-name:hover {
  text-decoration: underline;
  color: #007cff;
}

.reaction-time {
  font-size: 0.72rem;
  color: #9ca3af;
}

.reaction-detail-text {
  font-size: 0.85rem;
  color: #374151;
}

.comment-bubble {
  background-color: #f3f4f6;
  padding: 0.4rem 0.75rem;
  border-radius: 12px;
  display: inline-block;
  max-width: 100%;
  word-break: break-word;
}

.comment-emoji {
  font-size: 1.1rem;
  vertical-align: middle;
}

.comment-content {
  vertical-align: middle;
}

.artwork-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 76px;
  flex-shrink: 0;
  text-decoration: none;
  color: #4b5563;
}

.artwork-preview:hover .artwork-title {
  text-decoration: underline;
  color: #007cff;
}

.artwork-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.user-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 1.2rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
}

.artwork-thumb-wrap {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.artwork-thumb--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 1.1rem;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.artwork-preview--deleted {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 76px;
  flex-shrink: 0;
  color: #9ca3af;
}

.artwork-title {
  font-size: 0.68rem;
  text-align: center;
  margin-top: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
}

.pag-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.15s ease;
}

.pag-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.pag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
}
</style>
