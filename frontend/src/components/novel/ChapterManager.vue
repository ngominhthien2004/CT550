<script setup>
import { ref, reactive } from 'vue'
import { createChapter, deleteChapter } from '../../services/api'
import { formatShortDate } from '../../utils/date.js'

const props = defineProps({
  artworkId: { type: String, required: true },
  chapters: { type: Array, default: () => [] },
  isOwnArtwork: { type: Boolean, default: false },
})

const emit = defineEmits(['chapters-updated'])

const showAddForm = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const error = ref('')
const deleteError = ref('')
const deleteTarget = ref(null)

const newChapter = reactive({
  title: '',
  content: '',
})

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0)
}

async function submitChapter() {
  error.value = ''
  if (!newChapter.title.trim() || !newChapter.content.trim()) return

  submitting.value = true
  try {
    await createChapter(props.artworkId, {
      title: newChapter.title.trim(),
      content: newChapter.content.trim(),
    })
    showAddForm.value = false
    newChapter.title = ''
    newChapter.content = ''
    emit('chapters-updated')
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to create chapter'
  } finally {
    submitting.value = false
  }
}

function confirmDelete(chapter) {
  deleteTarget.value = chapter
}

async function executeDelete() {
  deleteError.value = ''
  if (!deleteTarget.value) return

  deleting.value = true
  try {
    await deleteChapter(props.artworkId, deleteTarget.value._id)
    deleteTarget.value = null
    emit('chapters-updated')
  } catch (err) {
    deleteError.value = err?.response?.data?.message || 'Failed to delete chapter'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div v-if="isOwnArtwork" class="chapter-manager">
    <div class="chapter-manager-header">
      <h3 class="manager-heading">Manage Chapters ({{ chapters.length }})</h3>
      <button type="button" class="btn-add-chapter" @click="showAddForm = true">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Chapter
      </button>
    </div>

    <!-- Chapter List -->
    <div class="chapter-list">
      <div
        v-for="ch in chapters"
        :key="ch._id"
        class="chapter-item"
      >
        <div class="chapter-info">
          <span class="chapter-number">Ch. {{ ch.chapterNumber }}</span>
          <span class="chapter-title">{{ ch.title }}</span>
          <span class="chapter-meta">
            <span class="chapter-words">{{ formatNumber(ch.wordCount) }} words</span>
            <span class="chapter-date">{{ formatShortDate(ch.createdAt) }}</span>
          </span>
        </div>
        <div class="chapter-actions">
          <button type="button" class="btn-delete" title="Delete chapter" @click="confirmDelete(ch)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>

      <div v-if="chapters.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        <p class="empty-text">No chapters yet. Add your first chapter!</p>
      </div>
    </div>

    <!-- Add Chapter Modal -->
    <Teleport to="body">
      <div v-if="showAddForm" class="modal-overlay" @click.self="showAddForm = false" @keydown.enter.prevent="showAddForm = false" @keydown.space.prevent="showAddForm = false" tabindex="0" role="button">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Add New Chapter</h3>
            <button type="button" class="modal-close" @click="showAddForm = false" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="form-group">
            <label class="form-label" for="chapter-title">Chapter Title</label>
            <input
              id="chapter-title"
              v-model="newChapter.title"
              class="form-input"
              placeholder="Enter chapter title..."
              maxlength="200"
              aria-label="Chapter title"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="chapter-content">Content</label>
            <textarea
              id="chapter-content"
              v-model="newChapter.content"
              class="form-textarea"
              placeholder="Write chapter content..."
              rows="15"
              maxlength="500000"
              aria-label="Chapter content"
            ></textarea>
            <span class="char-count">{{ newChapter.content.length }}/500000</span>
          </div>

          <p v-if="error" class="error-message">{{ error }}</p>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showAddForm = false">Cancel</button>
            <button type="button"
              class="btn-submit"
              :disabled="!newChapter.title.trim() || !newChapter.content.trim() || submitting"
              @click="submitChapter"
            >
              {{ submitting ? 'Saving...' : 'Add Chapter' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null" @keydown.enter.prevent="deleteTarget = null" @keydown.space.prevent="deleteTarget = null" tabindex="0" role="button">
        <div class="modal-content confirm-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Delete Chapter {{ deleteTarget.chapterNumber }}?</h3>
          </div>

          <p class="confirm-text">
            Are you sure you want to delete <strong>"{{ deleteTarget.title }}"</strong>?
            This cannot be undone.
          </p>

          <p v-if="deleteError" class="error-message">{{ deleteError }}</p>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="deleteTarget = null">Cancel</button>
            <button type="button"
              class="btn-delete-confirm"
              :disabled="deleting"
              @click="executeDelete"
            >
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── Manager Shell ──────────────────────────────────────────────── */
.chapter-manager {
  --cm-bg: #ffffff;
  --cm-text: #1a1a1a;
  --cm-muted: #6b7280;
  --cm-border: #e5e7eb;
  --cm-surface: #f9fafb;
  --cm-accent: #3b82f6;
  --cm-accent-hover: #2563eb;
  --cm-danger: #ef4444;
  --cm-danger-hover: #dc2626;
  --cm-radius: 8px;
  --cm-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  background: var(--cm-bg);
  border: 1px solid var(--cm-border);
  border-radius: var(--cm-radius);
  box-shadow: var(--cm-shadow);
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────── */
.chapter-manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--cm-border);
  gap: 0.75rem;
}

.manager-heading {
  font-size: 1rem;
  font-weight: 600;
  color: var(--cm-text);
  margin: 0;
}

.btn-add-chapter {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border: none;
  border-radius: 6px;
  background: var(--cm-accent);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  white-space: nowrap;
}

.btn-add-chapter:hover {
  background: var(--cm-accent-hover);
  transform: translateY(-1px);
}

.btn-add-chapter:active {
  transform: translateY(0);
}

.btn-icon {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}

/* ── Chapter List ───────────────────────────────────────────────── */
.chapter-list {
  max-height: 480px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--cm-border) transparent;
}

.chapter-list::-webkit-scrollbar {
  width: 5px;
}

.chapter-list::-webkit-scrollbar-track {
  background: transparent;
}

.chapter-list::-webkit-scrollbar-thumb {
  background-color: var(--cm-border);
  border-radius: 3px;
}

.chapter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--cm-border);
  transition: background 0.15s ease;
  gap: 0.75rem;
}

.chapter-item:last-child {
  border-bottom: none;
}

.chapter-item:hover {
  background: var(--cm-surface);
}

/* ── Chapter Info ───────────────────────────────────────────────── */
.chapter-info {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem 0.75rem;
  min-width: 0;
  flex: 1;
}

.chapter-number {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--cm-accent);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  flex-shrink: 0;
}

.chapter-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--cm-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.chapter-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.75rem;
  color: var(--cm-muted);
  white-space: nowrap;
}

.chapter-words {
  font-family: ui-monospace, 'SF Mono', monospace;
}

.chapter-date {
  font-family: ui-monospace, 'SF Mono', monospace;
}

/* ── Chapter Actions ────────────────────────────────────────────── */
.chapter-actions {
  flex-shrink: 0;
}

.btn-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--cm-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete svg {
  width: 1.05em;
  height: 1.05em;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.08);
  color: var(--cm-danger);
  border-color: rgba(239, 68, 68, 0.2);
}

/* ── Empty State ────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1.25rem;
  color: var(--cm-muted);
}

.empty-icon {
  width: 2.5rem;
  height: 2.5rem;
  margin-bottom: 0.75rem;
  opacity: 0.4;
}

.empty-text {
  font-size: 0.9rem;
  margin: 0;
  text-align: center;
}

/* ── Modal Overlay ──────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.modal-content {
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--cm-bg);
  border-radius: 12px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  animation: modal-in 0.2s ease-out;
}

.confirm-dialog {
  max-width: 440px;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  gap: 0.75rem;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--cm-text);
  margin: 0;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--cm-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modal-close svg {
  width: 1.15em;
  height: 1.15em;
}

.modal-close:hover {
  background: var(--cm-surface);
  color: var(--cm-text);
}

/* ── Form Elements ──────────────────────────────────────────────── */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--cm-text);
  margin-bottom: 0.35rem;
}

.form-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-surface);
  color: var(--cm-text);
  font-size: 0.9rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--cm-accent);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.form-textarea {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-surface);
  color: var(--cm-text);
  font-size: 0.9rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
  min-height: 200px;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--cm-accent);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.char-count {
  display: block;
  text-align: right;
  font-size: 0.75rem;
  font-family: ui-monospace, 'SF Mono', monospace;
  color: var(--cm-muted);
  margin-top: 0.3rem;
}

/* ── Error Message ──────────────────────────────────────────────── */
.error-message {
  font-size: 0.85rem;
  color: var(--cm-danger);
  margin: 0.5rem 0;
  padding: 0.5rem 0.75rem;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 6px;
}

.confirm-text {
  font-size: 0.9rem;
  color: var(--cm-muted);
  margin: 0 0 1rem;
  line-height: 1.5;
}

/* ── Modal Actions ──────────────────────────────────────────────── */
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.25rem;
}

.btn-cancel {
  padding: 0.5rem 1rem;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-bg);
  color: var(--cm-text);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: var(--cm-surface);
  border-color: var(--cm-muted);
}

.btn-submit {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 6px;
  background: var(--cm-accent);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
}

.btn-submit:hover:not(:disabled) {
  background: var(--cm-accent-hover);
  transform: translateY(-1px);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete-confirm {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 6px;
  background: var(--cm-danger);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
}

.btn-delete-confirm:hover:not(:disabled) {
  background: var(--cm-danger-hover);
  transform: translateY(-1px);
}

.btn-delete-confirm:active:not(:disabled) {
  transform: translateY(0);
}

.btn-delete-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .chapter-manager-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
  }

  .btn-add-chapter {
    justify-content: center;
  }

  .chapter-info {
    flex-direction: column;
    gap: 0.25rem;
  }

  .chapter-title {
    white-space: normal;
  }

  .chapter-meta {
    flex-wrap: wrap;
  }

  .modal-content {
    max-height: 85vh;
    padding: 1.25rem;
    border-radius: 8px;
    margin: 0.5rem;
  }

  .modal-actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .modal-actions button {
    width: 100%;
    justify-content: center;
  }
}
</style>
