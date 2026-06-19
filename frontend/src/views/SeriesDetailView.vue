<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSeriesStore } from '@/stores/series.store'
import { useAuthStore } from '@/stores/auth.store'
import { getChapters, createChapter, deleteChapter, updateChapter } from '@/services/api'
import MainLayoutTemplate from '@/components/layout/MainLayoutTemplate.vue'


const route = useRoute()
const router = useRouter()
const seriesStore = useSeriesStore()
const authStore = useAuthStore()

const isNavCollapsed = ref(true)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
}

const chapters = ref([])
const chaptersLoading = ref(false)

// Chapter management state
const showAddForm = ref(false)
const submitting = ref(false)
const editingChapterId = ref(null)
const deleteChapterTarget = ref(null)
const showDeleteConfirm = ref(false)
const chapterError = ref('')
const seriesLoadError = ref('')
const successMsg = ref('')
let successTimeout = null

function showSuccess(msg) {
  successMsg.value = msg
  if (successTimeout) clearTimeout(successTimeout)
  successTimeout = setTimeout(() => { successMsg.value = '' }, 3000)
}

const newChapterForm = ref({
  title: '',
  content: '',
})

const editChapterForm = ref({
  title: '',
  content: '',
})

const series = computed(() => seriesStore.currentSeries)

const isOwner = computed(() => {
  if (!series.value || !authStore.user) return false
  const seriesUser = series.value.user?._id || series.value.user
  return String(seriesUser) === String(authStore.user._id)
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getSeriesIcon(type) {
  switch (type) {
    case 'manga': return 'fa-solid fa-book'
    case 'novel': return 'fa-solid fa-pen-fancy'
    case 'illust': return 'fa-solid fa-image'
    default: return 'fa-solid fa-book'
  }
}

async function loadChapters() {
  if (!series.value?.novelArtwork?._id) return
  chaptersLoading.value = true
  try {
    const { data } = await getChapters(series.value.novelArtwork._id)
    chapters.value = Array.isArray(data) ? data : []
  } catch (err) {
    chapters.value = []
    chapterError.value = err?.response?.data?.message || 'Failed to load chapters'
  } finally {
    chaptersLoading.value = false
  }
}

async function submitNewChapter() {
  chapterError.value = ''
  if (!newChapterForm.value.title.trim() || !newChapterForm.value.content.trim()) return
  submitting.value = true
  try {
    await createChapter(series.value.novelArtwork._id, {
      title: newChapterForm.value.title.trim(),
      content: newChapterForm.value.content.trim(),
    })
    showSuccess('Chapter created successfully!')
    showAddForm.value = false
    newChapterForm.value = { title: '', content: '' }
    await loadChapters()
  } catch (err) {
    chapterError.value = err?.response?.data?.message || 'Failed to create chapter'
  } finally {
    submitting.value = false
  }
}

function startEditChapter(chapter) {
  editingChapterId.value = chapter._id
  editChapterForm.value = {
    title: chapter.title,
    content: chapter.content,
  }
}

async function submitEditChapter(chapterId) {
  chapterError.value = ''
  if (!editChapterForm.value.title.trim() || !editChapterForm.value.content.trim()) return
  submitting.value = true
  try {
    await updateChapter(series.value.novelArtwork._id, chapterId, {
      title: editChapterForm.value.title.trim(),
      content: editChapterForm.value.content.trim(),
    })
    showSuccess('Chapter updated successfully!')
    editingChapterId.value = null
    editChapterForm.value = { title: '', content: '' }
    await loadChapters()
  } catch (err) {
    chapterError.value = err?.response?.data?.message || 'Failed to update chapter'
  } finally {
    submitting.value = false
  }
}

function cancelEditChapter() {
  editingChapterId.value = null
  editChapterForm.value = { title: '', content: '' }
}

function confirmDeleteChapter(chapter) {
  deleteChapterTarget.value = chapter
  showDeleteConfirm.value = true
}

async function executeDeleteChapter() {
  if (!deleteChapterTarget.value) return
  submitting.value = true
  try {
    await deleteChapter(series.value.novelArtwork._id, deleteChapterTarget.value._id)
    showSuccess('Chapter deleted successfully!')
    showDeleteConfirm.value = false
    deleteChapterTarget.value = null
    await loadChapters()
  } catch (err) {
    chapterError.value = err?.response?.data?.message || 'Failed to delete chapter'
  } finally {
    submitting.value = false
  }
}

function goToArtwork(artworkId) {
  router.push(`/artworks/${artworkId}`)
}

function goToChapter(chapter) {
  // Navigate to novel detail with chapter selected
  router.push(`/novels/${series.value.novelArtwork._id}?chapter=${chapter._id}`)
}

function goBack() {
  router.back()
}

onMounted(async () => {
  try {
    await seriesStore.fetchSeriesById(route.params.id)
    if (series.value?.type === 'novel') {
      await loadChapters()
    }
  } catch (err) {
    seriesLoadError.value = err?.response?.data?.message || 'Failed to load series'
  }
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <div class="series-detail-page" v-if="!seriesStore.detailLoading || series">
      <!-- Loading -->
      <div v-if="!series && seriesStore.detailLoading" class="state-loading">
        <p>Loading series...</p>
      </div>

      <!-- Error -->
      <div v-else-if="!series" class="state-error">
        <h2>Series not found</h2>
        <p>The series you're looking for doesn't exist or has been removed.</p>
        <button type="button" class="back-btn" @click="goBack">Go back</button>
      </div>

      <!-- Series content -->
      <div v-else class="series-content">
        <!-- Back button -->
        <button type="button" class="back-link" @click="goBack">
          <i class="fa-solid fa-arrow-left"></i> Back
        </button>

        <!-- Success message -->
        <div v-if="successMsg" class="alert alert-success alert-dismissible fade show" role="alert">
          <i class="fa-solid fa-check-circle me-1"></i> {{ successMsg }}
          <button type="button" class="btn-close" @click="successMsg = ''" aria-label="Close"></button>
        </div>

        <!-- Series load error -->
        <div v-if="seriesLoadError" class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="fa-solid fa-exclamation-triangle me-1"></i> {{ seriesLoadError }}
          <button type="button" class="btn-close" @click="seriesLoadError = ''" aria-label="Close"></button>
        </div>

        <!-- Hero section -->
        <div class="series-hero">
          <div class="series-hero-cover">
            <img
              v-if="series.coverImage"
              :src="series.coverImage"
              :alt="series.title"
            />
            <div v-else class="series-hero-nothumb">
              <i :class="getSeriesIcon(series.type)"></i>
            </div>
          </div>
          <div class="series-hero-info">
            <div class="series-hero-type">
              <span class="type-badge" :class="'type-' + series.type">
                <i :class="getSeriesIcon(series.type)"></i>
                {{ series.type }}
              </span>
              <span v-if="series.isCompleted" class="status-badge status-completed">
                <i class="fa-solid fa-check-circle"></i> Completed
              </span>
              <span v-else class="status-badge status-ongoing">
                <i class="fa-solid fa-play-circle"></i> Ongoing
              </span>
            </div>
            <h1 class="series-hero-title">{{ series.title }}</h1>
            <p v-if="series.description" class="series-hero-desc">{{ series.description }}</p>

            <!-- Stats -->
            <div class="series-hero-stats">
              <div class="hero-stat">
                <i class="fa-solid fa-eye"></i>
                <span>{{ series.totalViews?.toLocaleString() || 0 }}</span>
                <span class="hero-stat-label">views</span>
              </div>
              <div class="hero-stat">
                <i class="fa-solid fa-heart"></i>
                <span>{{ series.totalLikes?.toLocaleString() || 0 }}</span>
                <span class="hero-stat-label">likes</span>
              </div>
              <div class="hero-stat">
                <i class="fa-solid fa-comment"></i>
                <span>{{ series.totalComments?.toLocaleString() || 0 }}</span>
                <span class="hero-stat-label">comments</span>
              </div>
              <div class="hero-stat">
                <i class="fa-regular fa-calendar"></i>
                <span>{{ formatDate(series.createdAt) }}</span>
              </div>
            </div>

            <div class="series-hero-episodes">
              {{ series.artworkCount || 0 }} {{ series.type === 'novel' ? 'chapter(s)' : 'episode(s)' }}
            </div>
          </div>
        </div>

        <!-- Manga / Illust: Artworks grid -->
        <div v-if="series.type !== 'novel'" class="series-works-section">
          <h2 class="section-title">Works in this series</h2>
          <div v-if="series.artworks?.length > 0" class="artworks-grid">
            <div
              v-for="artwork in series.artworks"
              :key="artwork._id"
              class="artwork-card"
              @click="goToArtwork(artwork._id)"
              @keydown.enter.prevent="goToArtwork(artwork._id)"
              @keydown.space.prevent="goToArtwork(artwork._id)"
              tabindex="0"
              role="button"
            >
              <div class="artwork-card-thumb">
                <img
                  v-if="artwork.images?.length > 0"
                  :src="artwork.images[0]?.thumbnail || artwork.images[0]"
                  :alt="artwork.title"
                  loading="lazy"
                />
                <div v-else class="artwork-card-nothumb">
                  <i :class="getSeriesIcon(artwork.type || series.type)"></i>
                </div>
              </div>
              <div class="artwork-card-title">{{ artwork.title }}</div>
              <div class="artwork-card-meta">
                <span v-if="artwork.viewCount !== undefined">{{ artwork.viewCount }} views</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-section">
            <p>No works in this series yet.</p>
          </div>
        </div>

        <!-- Novel: Chapters list -->
        <div v-else class="series-chapters-section">
          <div class="chapters-section-header">
            <h2 class="section-title">Chapters</h2>
            <button type="button" v-if="isOwner" class="add-chapter-btn" @click="showAddForm = !showAddForm">
              <i class="fa-solid fa-plus"></i> {{ showAddForm ? 'Cancel' : 'Add Chapter' }}
            </button>
          </div>

          <!-- Chapter error -->
          <p v-if="chapterError" class="chapter-error">{{ chapterError }}</p>

          <!-- Add chapter form -->
          <div v-if="showAddForm" class="chapter-form">
            <input
              v-model="newChapterForm.title"
              type="text"
              placeholder="Chapter title"
              class="chapter-form-input"
              maxlength="200"
              aria-label="Chapter title"
            />
            <textarea
              v-model="newChapterForm.content"
              placeholder="Write your chapter content here..."
              class="chapter-form-textarea"
              rows="8"
              maxlength="500000"
              aria-label="Chapter content"
            ></textarea>
            <div class="chapter-form-actions">
              <button type="button" class="chapter-form-btn chapter-form-btn--cancel" @click="showAddForm = false">Cancel</button>
              <button type="button"
                class="chapter-form-btn chapter-form-btn--submit"
                @click="submitNewChapter"
                :disabled="submitting || !newChapterForm.title.trim() || !newChapterForm.content.trim()"
              >
                {{ submitting ? 'Saving...' : 'Save Chapter' }}
              </button>
            </div>
          </div>

          <div v-if="chaptersLoading" class="state-loading">
            <p>Loading chapters...</p>
          </div>
          <div v-else-if="chapters.length > 0" class="chapters-list">
            <div
              v-for="chapter in chapters"
              :key="chapter._id"
              class="chapter-row"
            >
              <!-- Inline edit mode -->
              <template v-if="editingChapterId === chapter._id">
                <div class="chapter-edit-form">
                  <input
                    v-model="editChapterForm.title"
                    type="text"
                    class="chapter-form-input"
                    maxlength="200"
                    aria-label="Edit chapter title"
                  />
                  <textarea
                    v-model="editChapterForm.content"
                    class="chapter-form-textarea"
                    rows="6"
                    maxlength="500000"
                    aria-label="Edit chapter content"
                  ></textarea>
                  <div class="chapter-form-actions">
                    <button type="button" class="chapter-form-btn chapter-form-btn--cancel" @click="cancelEditChapter">Cancel</button>
                    <button type="button"
                      class="chapter-form-btn chapter-form-btn--submit"
                      @click="submitEditChapter(chapter._id)"
                      :disabled="submitting || !editChapterForm.title.trim() || !editChapterForm.content.trim()"
                    >
                      {{ submitting ? 'Saving...' : 'Update' }}
                    </button>
                  </div>
                </div>
              </template>

              <!-- Read mode -->
              <template v-else>
                <div class="chapter-number">{{ chapter.chapterNumber }}</div>
                <div class="chapter-info" @click="goToChapter(chapter)" @keydown.enter.prevent="goToChapter(chapter)" @keydown.space.prevent="goToChapter(chapter)" tabindex="0" role="button">
                  <div class="chapter-title">{{ chapter.title }}</div>
                  <div class="chapter-meta">
                    <span>{{ chapter.wordCount?.toLocaleString() || 0 }} words</span>
                    <span class="chapter-sep">&middot;</span>
                    <span>{{ formatDate(chapter.createdAt) }}</span>
                  </div>
                </div>
                <div v-if="isOwner" class="chapter-actions">
                  <button type="button" class="chapter-action-btn" @click="startEditChapter(chapter)" title="Edit">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button type="button" class="chapter-action-btn chapter-action-btn--danger" @click="confirmDeleteChapter(chapter)" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
                <div class="chapter-arrow" @click="goToChapter(chapter)" @keydown.enter.prevent="goToChapter(chapter)" @keydown.space.prevent="goToChapter(chapter)" tabindex="0" role="button">
                  <i class="fa-solid fa-chevron-right"></i>
                </div>
              </template>
            </div>
          </div>
          <div v-else class="empty-section">
            <p>No chapters yet.</p>
          </div>
        </div>

        <!-- Delete chapter confirmation -->
        <div v-if="showDeleteConfirm" class="delete-overlay" @click.self="showDeleteConfirm = false" @keydown.enter.prevent="showDeleteConfirm = false" @keydown.space.prevent="showDeleteConfirm = false" tabindex="0" role="button">
          <div class="delete-dialog">
            <h3>Delete Chapter</h3>
            <p>Are you sure you want to delete "{{ deleteChapterTarget?.title }}"? This cannot be undone.</p>
            <div class="delete-dialog-actions">
              <button type="button" class="chapter-form-btn chapter-form-btn--cancel" @click="showDeleteConfirm = false">Cancel</button>
              <button type="button" class="chapter-form-btn chapter-form-btn--danger" @click="executeDeleteChapter" :disabled="submitting">
                {{ submitting ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Owner actions -->
        <div v-if="isOwner" class="owner-actions">
          <router-link
            :to="'/dashboard?tab=works'"
            class="owner-btn owner-btn--edit"
          >
            <i class="fa-solid fa-pen"></i> Manage in Dashboard
          </router-link>
        </div>
      </div>
    </div>
  </MainLayoutTemplate>
</template>

<style scoped>
.series-detail-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  min-height: 60vh;
}

.state-loading,
.state-error {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b7280;
}

.state-error h2 {
  color: #ef4444;
  margin-bottom: 0.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  background: transparent;
  color: #6366f1;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0;
  margin-bottom: 1rem;
  transition: opacity 0.15s;
}

.back-link:hover {
  opacity: 0.75;
}

.back-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 999px;
  height: 38px;
  padding: 0 1.5rem;
  cursor: pointer;
  margin-top: 1rem;
}

.back-btn:hover {
  background: #f9fafb;
}

/* Hero */
.series-hero {
  display: flex;
  gap: 1.5rem;
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}

.series-hero-cover {
  flex-shrink: 0;
  width: 220px;
  height: 220px;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
}

.series-hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.series-hero-nothumb {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #d1d5db;
  font-size: 3rem;
}

.series-hero-info {
  flex: 1;
  min-width: 0;
}

.series-hero-type {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #6366f1;
}

.type-novel {
  background: #fdf2f8;
  color: #ec4899;
}

.type-manga {
  background: #f0fdf4;
  color: #22c55e;
}

.type-illust {
  background: #eef2ff;
  color: #6366f1;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
}

.status-completed {
  background: #f0fdf4;
  color: #16a34a;
}

.status-ongoing {
  background: #fef3c7;
  color: #d97706;
}

.series-hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem;
  line-height: 1.3;
}

.series-hero-desc {
  font-size: 0.88rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 1rem;
}

.series-hero-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.hero-stat {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.hero-stat i {
  font-size: 0.8rem;
  width: 16px;
  text-align: center;
}

.hero-stat i.fa-eye { color: #6366f1; }
.hero-stat i.fa-heart { color: #ef4444; }
.hero-stat i.fa-comment { color: #10b981; }

.hero-stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.series-hero-episodes {
  font-size: 0.8rem;
  color: #9ca3af;
}

/* Section */
.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem;
}

/* Artworks grid */
.artworks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.artwork-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
}

.artwork-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.artwork-card-thumb {
  aspect-ratio: 1;
  background: #f3f4f6;
  overflow: hidden;
}

.artwork-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-card-nothumb {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #d1d5db;
  font-size: 2rem;
}

.artwork-card-title {
  padding: 0.5rem 0.65rem 0.25rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artwork-card-meta {
  padding: 0 0.65rem 0.5rem;
  font-size: 0.72rem;
  color: #9ca3af;
}

/* Chapters list */
.chapters-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.chapter-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eef2ff;
  color: #6366f1;
  font-weight: 700;
  font-size: 0.85rem;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-right: 0.85rem;
}

.chapter-info {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.2rem;
}

.chapter-meta {
  font-size: 0.75rem;
  color: #9ca3af;
  display: flex;
  gap: 0.35rem;
}

.chapter-sep {
  color: #d1d5db;
}

.chapter-arrow {
  color: #d1d5db;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.empty-section {
  text-align: center;
  padding: 3rem 1rem;
  background: #fff;
  border-radius: 12px;
  color: #9ca3af;
  font-size: 0.9rem;
}

/* Owner actions */
.owner-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
}

.owner-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  height: 38px;
  padding: 0 1.25rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.12s;
}

.owner-btn--edit {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.owner-btn--edit:hover {
  background: #f9fafb;
}

/* Responsive */
@media (max-width: 640px) {
  .series-hero {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .series-hero-cover {
    width: 160px;
    height: 160px;
  }
  .series-hero-stats {
    justify-content: center;
  }
  .series-hero-type {
    justify-content: center;
  }
  .artworks-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Chapter management */
.chapters-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.add-chapter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 999px;
  height: 34px;
  padding: 0 1rem;
  cursor: pointer;
  transition: all 0.15s;
}

.add-chapter-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.chapter-error {
  color: #dc2626;
  font-size: 0.82rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border-radius: 8px;
}

.chapter-form {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.chapter-form-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-size: 0.88rem;
  color: #1f2937;
  margin-bottom: 0.75rem;
  box-sizing: border-box;
}

.chapter-form-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.chapter-form-textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-size: 0.85rem;
  color: #1f2937;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  box-sizing: border-box;
}

.chapter-form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.chapter-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.chapter-form-btn {
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 999px;
  height: 36px;
  padding: 0 1.25rem;
  cursor: pointer;
  transition: background 0.12s, opacity 0.12s;
}

.chapter-form-btn--cancel {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.chapter-form-btn--cancel:hover {
  background: #f9fafb;
}

.chapter-form-btn--submit {
  background: #6366f1;
  color: #fff;
}

.chapter-form-btn--submit:hover:not(:disabled) {
  background: #4f46e5;
}

.chapter-form-btn--submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chapter-form-btn--danger {
  background: #dc2626;
  color: #fff;
}

.chapter-form-btn--danger:hover:not(:disabled) {
  background: #b91c1c;
}

.chapter-form-btn--danger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chapter-row {
  display: flex;
  align-items: center;
  padding: 0.85rem 1rem;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid #f3f4f6;
}

.chapter-row:has(.chapter-edit-form) {
  cursor: default;
}

.chapter-actions {
  display: flex;
  gap: 0.25rem;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.chapter-action-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  font-size: 0.72rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.12s;
}

.chapter-action-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.chapter-action-btn--danger:hover {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fca5a5;
}

/* Edit form inside chapter row */
.chapter-edit-form {
  flex: 1;
  padding: 0.5rem 0;
}

.chapter-edit-form .chapter-form-input,
.chapter-edit-form .chapter-form-textarea {
  margin-bottom: 0.5rem;
}

/* Delete confirmation */
.delete-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 150;
  display: grid;
  place-items: center;
  padding: 1rem;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.delete-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
}

.delete-dialog h3 {
  font-weight: 700;
  font-size: 1rem;
  color: #1f2937;
  margin: 0 0 0.5rem;
}

.delete-dialog p {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.5;
}

.delete-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
