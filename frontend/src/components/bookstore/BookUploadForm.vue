<script setup>
import { computed, ref, watch } from 'vue'
import { getTags } from '@/services/api.js'

const props = defineProps({
  initialBook: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])

const MAX_TAGS = 10

const form = ref({
  title: '',
  description: '',
  price: 0,
  stock: -1,
  status: 'published',
  tags: [],
  tagInput: '',
  coverImage: null,
  ebookFile: null,
})

const coverPreview = ref('')
const ebookName = ref('')
const isDraggingCover = ref(false)
const isDraggingEbook = ref(false)

const coverInputRef = ref(null)
const ebookInputRef = ref(null)

// Tag autocomplete state
const tagSuggestions = ref([])
const tagSuggestionLoading = ref(false)
const showTagSuggestions = ref(false)
const tagWrapperRef = ref(null)

let tagDebounceTimer = null

const isEdit = computed(() => Boolean(props.initialBook))

watch(
  () => props.initialBook,
  (book) => {
    if (!book) return
    form.value = {
      title: book.title || '',
      description: book.description || '',
      price: book.price || 0,
      stock: Number.isFinite(book.stock) ? book.stock : -1,
      status: book.status || 'published',
      tags: Array.isArray(book.tags) ? book.tags : [],
      tagInput: '',
      coverImage: null,
      ebookFile: null,
    }
    coverPreview.value = book.coverImage || ''
    ebookName.value = book.ebookFileName || ''
  },
  { immediate: true },
)

watch(
  () => form.value.tagInput,
  (keyword) => {
    clearTimeout(tagDebounceTimer)
    const trimmed = String(keyword || '').trim()
    if (!trimmed) {
      tagSuggestions.value = []
      tagSuggestionLoading.value = false
      showTagSuggestions.value = false
      return
    }
    tagSuggestionLoading.value = true
    showTagSuggestions.value = true
    tagDebounceTimer = setTimeout(async () => {
      try {
        const { data } = await getTags({ q: trimmed, limit: 8 })
        const items = Array.isArray(data) ? data : Array.isArray(data?.tags) ? data.tags : []
        tagSuggestions.value = items.filter((s) => !form.value.tags.includes(s.name))
      } catch {
        tagSuggestions.value = []
      } finally {
        tagSuggestionLoading.value = false
      }
    }, 180)
  },
)

function onCoverChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  form.value.coverImage = file
  if (coverPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(coverPreview.value)
  }
  coverPreview.value = URL.createObjectURL(file)
}

function onEbookChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  form.value.ebookFile = file
  ebookName.value = file.name
}

function normalizeTag(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''
  return trimmed
    .replace(/^#/, '')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

function commitTag(raw) {
  const tag = normalizeTag(raw)
  if (!tag || form.value.tags.includes(tag)) return
  if (form.value.tags.length >= MAX_TAGS) return
  form.value.tags.push(tag)
  form.value.tagInput = ''
  tagSuggestions.value = []
  showTagSuggestions.value = false
}

function commitMultipleTags(raw) {
  const parts = String(raw || '').split(',')
  for (const part of parts) {
    commitTag(part)
  }
}

function handleTagKeydown(event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    commitMultipleTags(form.value.tagInput)
  } else if (event.key === ' ') {
    if (String(form.value.tagInput || '').trim()) {
      event.preventDefault()
      commitTag(form.value.tagInput)
    }
  } else if (event.key === 'Escape') {
    showTagSuggestions.value = false
  }
}

function selectSuggestion(name) {
  commitTag(name)
}

function removeTag(index) {
  form.value.tags.splice(index, 1)
}

function onTagInputBlur(event) {
  if (!event.currentTarget?.contains(event.relatedTarget)) {
    showTagSuggestions.value = false
  }
}

function onPriceInput(event) {
  let raw = event.target.value
  // Strip everything except digits and dot
  raw = raw.replace(/[^0-9.]/g, '')
  // Ensure only one decimal point
  const parts = raw.split('.')
  if (parts.length > 2) {
    raw = parts[0] + '.' + parts.slice(1).join('')
  }
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    raw = parts[0] + '.' + parts[1].slice(0, 2)
  }
  form.value.price = raw === '' ? '' : Number(raw)
  event.target.value = raw
}

function submit() {
  emit('submit', { ...form.value })
}

function handleCoverDragOver(e) {
  e.preventDefault()
  isDraggingCover.value = true
}

function handleCoverDragLeave() {
  isDraggingCover.value = false
}

function handleCoverDrop(e) {
  e.preventDefault()
  isDraggingCover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  const dt = new DataTransfer()
  dt.items.add(file)
  const pseudoEvent = { target: { files: dt.files } }
  onCoverChange(pseudoEvent)
}

function handleEbookDragOver(e) {
  e.preventDefault()
  isDraggingEbook.value = true
}

function handleEbookDragLeave() {
  isDraggingEbook.value = false
}

function handleEbookDrop(e) {
  e.preventDefault()
  isDraggingEbook.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  const dt = new DataTransfer()
  dt.items.add(file)
  const pseudoEvent = { target: { files: dt.files } }
  onEbookChange(pseudoEvent)
}
</script>

<template>
  <form class="upload-form d-grid gap-3" @submit.prevent="submit">
    <div>
      <label class="form-label">Title</label>
      <input v-model="form.title" type="text" class="form-control" placeholder="Book title" required maxlength="100" />
    </div>

    <div>
      <label class="form-label">Description</label>
      <textarea v-model="form.description" class="form-control" rows="4" placeholder="Tell readers what this book is about"></textarea>
    </div>

    <div>
      <label class="form-label">Price ($)</label>
      <input
        :value="form.price"
        type="text"
        class="form-control"
        inputmode="decimal"
        placeholder="0.00"
        required
        @input="onPriceInput"
      />
    </div>

    <div>
      <label class="form-label">Tags</label>
      <div ref="tagWrapperRef" class="tag-input-wrap" @focusout="onTagInputBlur">
        <input
          v-model="form.tagInput"
          type="text"
          class="form-control tag-input-field"
          :placeholder="form.tags.length >= MAX_TAGS ? 'Max tags reached' : 'Type a tag and press Enter'"
          :disabled="form.tags.length >= MAX_TAGS"
          @keydown="handleTagKeydown"
          @focus="form.tagInput.trim() && (showTagSuggestions = true)"
        />
        <span class="counter-badge">{{ form.tags.length }}/{{ MAX_TAGS }}</span>

        <!-- Suggestions dropdown -->
        <div v-if="showTagSuggestions" class="tag-suggestion-panel" role="listbox" aria-label="Tag suggestions">
          <p v-if="tagSuggestionLoading" class="suggestion-loading">Loading...</p>
          <template v-else>
            <button
              v-for="suggestion in tagSuggestions"
              :key="suggestion.name"
              type="button"
              class="tag-suggestion-item"
              @mousedown.prevent="selectSuggestion(suggestion.name)"
            >
              <span class="tag-suggestion-name">#{{ suggestion.name }}</span>
              <span class="tag-suggestion-count">{{ suggestion.usageCount || 0 }} uses</span>
            </button>
            <p v-if="!tagSuggestionLoading && tagSuggestions.length === 0" class="suggestion-empty">
              No matching tags
            </p>
          </template>
        </div>
      </div>

      <div v-if="form.tags.length > 0" class="tag-list">
        <span
          v-for="(tag, index) in form.tags"
          :key="`${tag}-${index}`"
          class="tag-chip"
          @click="removeTag(index)"
        >
          #{{ tag }}
          <span class="tag-remove-x">&times;</span>
        </span>
      </div>
    </div>

    <div class="row g-3">
      <div
        class="col-md-6"
        :class="{ 'drop-zone--active': isDraggingCover }"
        @dragover="handleCoverDragOver"
        @dragleave="handleCoverDragLeave"
        @drop="handleCoverDrop"
      >
        <label class="form-label">Cover Image</label>
        <input ref="coverInputRef" type="file" class="form-control" accept="image/*" @change="onCoverChange" />
        <div v-if="coverPreview" class="preview-wrap mt-2">
          <img :src="coverPreview" alt="Cover preview" class="cover-preview" />
        </div>
        <div v-if="isDraggingCover" class="drop-overlay">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <span>Drop cover image here</span>
        </div>
      </div>
      <div
        class="col-md-6"
        :class="{ 'drop-zone--active': isDraggingEbook }"
        @dragover="handleEbookDragOver"
        @dragleave="handleEbookDragLeave"
        @drop="handleEbookDrop"
      >
        <label class="form-label">E-book File</label>
        <input ref="ebookInputRef" type="file" class="form-control" accept=".pdf,.epub,.mobi" @change="onEbookChange" />
        <p v-if="ebookName" class="file-name mt-2 mb-0">
          <i class="fa-solid fa-file-lines me-1"></i> {{ ebookName }}
        </p>
        <div v-if="isDraggingEbook" class="drop-overlay">
          <i class="fa-solid fa-file-arrow-up"></i>
          <span>Drop ebook file here</span>
        </div>
      </div>
    </div>

    <div class="d-flex gap-2 pt-2">
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Saving...' : (isEdit ? 'Update Book' : 'Upload Book') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.upload-form {
  max-width: 800px;
}

.col-md-6 {
  position: relative;
}

.col-md-6.drop-zone--active {
  outline: 2px dashed #6366f1;
  outline-offset: 4px;
  border-radius: 8px;
}

.drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.9rem;
  z-index: 10;
  pointer-events: none;
}

.drop-overlay i {
  font-size: 2rem;
  color: #6366f1;
}

.tag-input-wrap {
  position: relative;
  display: flex;
  gap: 0.5rem;
}

.tag-input-wrap .tag-input-field {
  flex: 1;
  padding-right: 3.5rem;
}

.counter-badge {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 0.8rem;
  pointer-events: none;
  user-select: none;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-chip:hover {
  background: #fce8e6;
  border-color: #ea4335;
  color: #c5221f;
}

.tag-remove-x {
  font-size: 0.9rem;
  line-height: 1;
  font-weight: bold;
}

/* === Suggestion panel === */
.tag-suggestion-panel {
  position: absolute;
  z-index: 10;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  padding: 0.35rem;
  box-shadow: var(--shadow-md);
  display: grid;
  gap: 0.2rem;
  max-height: 220px;
  overflow-y: auto;
}

.tag-suggestion-item {
  border: 0;
  border-radius: 4px;
  text-align: left;
  padding: 0.5rem 0.65rem;
  font-size: 0.86rem;
  background: var(--surface);
  color: var(--text);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.tag-suggestion-item:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.tag-suggestion-name {
  font-weight: 500;
}

.tag-suggestion-count {
  color: var(--muted);
  font-size: 0.8rem;
}

.suggestion-loading,
.suggestion-empty {
  color: var(--muted);
  font-size: 0.85rem;
  margin: 0;
  padding: 0.5rem 0.65rem;
}

.preview-wrap {
  width: 140px;
}

.cover-preview {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--line);
}

.file-name {
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
