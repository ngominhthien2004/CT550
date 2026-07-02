<script setup>
import { ref, onMounted, watch } from 'vue'
import { getCreatorReactions } from '../../services/api'
import { useToast } from '../../composables/useToast'
import { formatShortDate } from '../../utils/date.js'

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
    <div class="subtab-bar">
      <button
        type="button"
        class="subtab-btn"
        :class="{ 'subtab-btn--active': currentTab === 'comments' }"
        @click="setTab('comments')"
      >
        Comments
      </button>
      <button
        type="button"
        class="subtab-btn"
        :class="{ 'subtab-btn--active': currentTab === 'likes' }"
        @click="setTab('likes')"
      >
        Likes
      </button>
      <button
        type="button"
        class="subtab-btn"
        :class="{ 'subtab-btn--active': currentTab === 'bookmarks' }"
        @click="setTab('bookmarks')"
      >
        Bookmarks
      </button>
    </div>

    <!-- Content area -->
    <div class="reactions-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading reactions...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <span>{{ error }}</span>
        <button type="button" class="retry-btn" @click="fetchReactions">
          <i class="fa-solid fa-rotate" aria-hidden="true"></i> Retry
        </button>
      </div>

      <div v-else-if="reactions.length === 0" class="empty-state">
        <div class="empty-icon-wrap">
          <i v-if="currentTab === 'comments'" class="fa-regular fa-comment" aria-hidden="true"></i>
          <i v-else-if="currentTab === 'likes'" class="fa-regular fa-heart" aria-hidden="true"></i>
          <i v-else class="fa-regular fa-bookmark" aria-hidden="true"></i>
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
                  <span v-if="item.emoji" class="comment-emoji">{{ item.emoji }}</span>
                  <span class="comment-content">{{ item.content }}</span>
                </div>
              </template>
              <template v-else-if="currentTab === 'likes'">
                <span class="action-text">
                  <i class="fa-solid fa-heart" aria-hidden="true"></i>
                  liked your work
                </span>
              </template>
              <template v-else>
                <span class="action-text">
                  <i class="fa-solid fa-bookmark" aria-hidden="true"></i>
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
            <span class="artwork-title">Deleted work</span>
          </span>
        </div>
      </div>

      <!-- Pagination -->
      <nav v-if="totalPages > 1 && !loading" class="pagination-container" aria-label="Reactions pagination">
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

<style scoped src="./dashboard-panel-styles.css"></style>
<style scoped>
.reactions-panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 1.25rem;
}

.reactions-content {
  margin-top: 1rem;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 0.75rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: rgba(180, 35, 24, 0.06);
  border: 1px solid rgba(180, 35, 24, 0.16);
  color: #b42318;
  font-size: 0.88rem;
  font-weight: 600;
}

.retry-btn {
  border: 1px solid #b42318;
  background: transparent;
  color: #b42318;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.retry-btn:hover {
  background: rgba(180, 35, 24, 0.08);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  text-align: center;
  color: var(--muted);
}

.empty-icon-wrap {
  font-size: 3rem;
  margin-bottom: 0.8rem;
  color: var(--line);
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
  border-bottom: 1px solid var(--line);
  transition: background-color 0.15s ease;
}

.reaction-item:hover {
  background-color: var(--surface-alt);
}

.user-avatar-link {
  flex-shrink: 0;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--line);
}

.user-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-alt);
  color: var(--muted);
  font-size: 1.2rem;
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
  color: var(--text);
  text-decoration: none;
}

.user-name:hover {
  text-decoration: underline;
  color: var(--accent);
}

.reaction-time {
  font-size: 0.72rem;
  color: var(--muted);
}

.reaction-detail-text {
  font-size: 0.85rem;
  color: var(--text);
}

.action-text {
  color: var(--muted);
}

.action-text i {
  margin-right: 0.25rem;
}

.action-text i.fa-heart {
  color: var(--danger);
}

.action-text i.fa-bookmark {
  color: var(--accent);
}

.comment-bubble {
  background-color: var(--surface-alt);
  padding: 0.4rem 0.75rem;
  border-radius: 12px;
  display: inline-block;
  max-width: 100%;
  word-break: break-word;
}

.comment-emoji {
  font-size: 1.1rem;
  vertical-align: middle;
  margin-right: 0.2rem;
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
  color: var(--muted);
}

.artwork-preview:hover .artwork-title {
  text-decoration: underline;
  color: var(--accent);
}

.artwork-thumb-wrap {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.artwork-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--line);
}

.artwork-thumb--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-alt);
  color: var(--muted);
  font-size: 1.1rem;
}

.artwork-preview--deleted {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 76px;
  flex-shrink: 0;
  color: var(--muted);
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
  margin-top: 1.5rem;
}

.pag-btn {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
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
  background: var(--surface-alt);
  border-color: var(--muted);
}

.pag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted);
}
</style>
