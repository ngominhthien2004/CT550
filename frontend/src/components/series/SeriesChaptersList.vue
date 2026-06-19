<script setup>
import { ref } from 'vue'
import { createChapter, deleteChapter, updateChapter } from '@/services/api'

const props = defineProps({
  series: { type: Object, required: true },
  chapters: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  isOwner: { type: Boolean, default: false },
})

const emit = defineEmits(['refresh', 'navigate'])

const showAddForm = ref(false)
const submitting = ref(false)
const editingChapterId = ref(null)
const deleteChapterTarget = ref(null)
const showDeleteConfirm = ref(false)
const chapterError = ref('')

const newChapterForm = ref({ title: '', content: '' })
const editChapterForm = ref({ title: '', content: '' })

function goToChapter(chapter) {
  emit('navigate', `/novels/${props.series.novelArtwork._id}?chapter=${chapter._id}`)
}

async function submitNewChapter() {
  chapterError.value = ''
  if (!newChapterForm.value.title.trim() || !newChapterForm.value.content.trim()) return
  submitting.value = true
  try {
    await createChapter(props.series.novelArtwork._id, {
      title: newChapterForm.value.title.trim(),
      content: newChapterForm.value.content.trim(),
    })
    showAddForm.value = false
    newChapterForm.value = { title: '', content: '' }
    emit('refresh')
  } catch (err) {
    chapterError.value = err?.response?.data?.message || 'Failed to create chapter'
  } finally {
    submitting.value = false
  }
}

function startEditChapter(chapter) {
  editingChapterId.value = chapter._id
  editChapterForm.value = { title: chapter.title, content: chapter.content }
}

async function submitEditChapter(chapterId) {
  chapterError.value = ''
  if (!editChapterForm.value.title.trim() || !editChapterForm.value.content.trim()) return
  submitting.value = true
  try {
    await updateChapter(props.series.novelArtwork._id, chapterId, {
      title: editChapterForm.value.title.trim(),
      content: editChapterForm.value.content.trim(),
    })
    editingChapterId.value = null
    editChapterForm.value = { title: '', content: '' }
    emit('refresh')
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
    await deleteChapter(props.series.novelArtwork._id, deleteChapterTarget.value._id)
    showDeleteConfirm.value = false
    deleteChapterTarget.value = null
    emit('refresh')
  } catch (err) {
    chapterError.value = err?.response?.data?.message || 'Failed to delete chapter'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="series-chapters-section">
    <div class="chapters-section-header">
      <h2 class="section-title">Chapters</h2>
      <button type="button" v-if="isOwner" class="add-chapter-btn" @click="showAddForm = !showAddForm">
        <i class="fa-solid fa-plus"></i> {{ showAddForm ? 'Cancel' : 'Add Chapter' }}
      </button>
    </div>

    <p v-if="chapterError" class="chapter-error">{{ chapterError }}</p>

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

    <div v-if="loading" class="state-loading">
      <p>Loading chapters...</p>
    </div>
    <div v-else-if="chapters.length > 0" class="chapters-list">
      <div
        v-for="chapter in chapters"
        :key="chapter._id"
        class="chapter-row"
      >
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

        <template v-else>
          <div class="chapter-number">{{ chapter.chapterNumber }}</div>
          <div class="chapter-info" @click="goToChapter(chapter)" @keydown.enter.prevent="goToChapter(chapter)" @keydown.space.prevent="goToChapter(chapter)" tabindex="0" role="button">
            <div class="chapter-title">{{ chapter.title }}</div>
            <div class="chapter-meta">
              <span>{{ chapter._wordCount }} words</span>
              <span class="chapter-sep">&middot;</span>
              <span>{{ chapter._formattedDate }}</span>
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
  </div>
</template>

<style scoped>
.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.chapters-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.add-chapter-btn {
  border: none;
  background: #6366f1;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.add-chapter-btn:hover { background: #4f46e5; }

.chapter-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.chapter-form {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.chapter-form-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.chapter-form-textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  resize: vertical;
  margin-bottom: 0.75rem;
}

.chapter-form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.chapter-form-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.chapter-form-btn--cancel {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.chapter-form-btn--submit {
  border: none;
  background: #6366f1;
  color: #fff;
}

.chapter-form-btn--submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chapter-form-btn--danger {
  border: none;
  background: #dc2626;
  color: #fff;
}

.chapters-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.chapter-row {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
}

.chapter-row:last-child { border-bottom: none; }

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
  cursor: pointer;
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

.chapter-sep { color: #d1d5db; }

.chapter-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 0.75rem;
}

.chapter-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.chapter-action-btn:hover { background: #e5e7eb; }
.chapter-action-btn--danger { color: #dc2626; }
.chapter-action-btn--danger:hover { background: #fef2f2; }

.chapter-arrow {
  color: #d1d5db;
  font-size: 0.8rem;
  margin-left: 0.5rem;
  cursor: pointer;
}

.chapter-edit-form {
  width: 100%;
}

.state-loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.empty-section {
  text-align: center;
  padding: 3rem 1rem;
  background: #fff;
  border-radius: 12px;
  color: #9ca3af;
  font-size: 0.9rem;
}

.delete-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: grid;
  place-items: center;
  z-index: 100;
}

.delete-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}

.delete-dialog h3 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

.delete-dialog p {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0 0 1.25rem;
}

.delete-dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
