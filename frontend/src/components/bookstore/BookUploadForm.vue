<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
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
const newPagePreviews = ref([])
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

const existingPages = computed(() => {
  if (!props.initialBook?.pages?.length) return []
  return [...props.initialBook.pages].sort((a, b) => a.pageNumber - b.pageNumber)
})

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
    coverPreview.value = book.coverImages?.[0] || ''
    ebookName.value = book.ebookFile?.originalName || ''
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
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  // Clean up old previews
  newPagePreviews.value.forEach(p => URL.revokeObjectURL(p.url))
  newPagePreviews.value = []

  form.value.ebookFile = files.length === 1 ? files[0] : files
  ebookName.value = files.length === 1 ? files[0].name : `${files.length} images`

  // Create previews for image files (not ZIPs)
  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  newPagePreviews.value = imageFiles.map((f, i) => ({
    url: URL.createObjectURL(f),
    name: f.name,
    index: i + 1,
  }))
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
  const files = Array.from(e.dataTransfer?.files || [])
  if (!files.length) return
  const dt = new DataTransfer()
  files.forEach(f => dt.items.add(f))
  const pseudoEvent = { target: { files: dt.files } }
  onEbookChange(pseudoEvent)
}

// Cleanup blob URLs on unmount
onUnmounted(() => {
  if (coverPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(coverPreview.value)
  }
  newPagePreviews.value.forEach(p => URL.revokeObjectURL(p.url))
})
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
          class="tag-pill tag-pill--selected"
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
        <label class="form-label">Book Pages</label>
        <p class="file-name mt-1 mb-2" style="color: var(--muted);">
          Upload a ZIP archive of page images, or select multiple image files (JPG, PNG, GIF, WEBP).
        </p>
        <input
          ref="ebookInputRef"
          type="file"
          class="form-control"
          accept=".zip,image/jpeg,image/png,image/gif,image/webp"
          multiple
          @change="onEbookChange"
        />
        <p v-if="ebookName" class="file-name mt-2 mb-0">
          <i class="fa-solid fa-file-lines me-1"></i> {{ ebookName }}
        </p>
        <div v-if="isDraggingEbook" class="drop-overlay">
          <i class="fa-solid fa-file-arrow-up"></i>
          <span>Drop book files here</span>
        </div>
      </div>
    </div>

    <!-- Existing pages preview (edit mode only) -->
    <div v-if="isEdit && existingPages.length > 0" class="existing-pages-section">
      <label class="form-label">
        Current Pages ({{ existingPages.length }})
        <span class="text-muted fw-normal ms-2">— upload new files above to replace</span>
      </label>
      <div class="existing-pages-grid">
        <div v-for="page in existingPages" :key="page._id || page.pageNumber" class="existing-page-thumb">
          <img :src="page.url" :alt="`Page ${page.pageNumber}`" loading="lazy" />
          <span class="page-number-badge">{{ page.pageNumber }}</span>
        </div>
      </div>
    </div>

    <!-- New pages preview (when selecting images) -->
    <div v-if="newPagePreviews.length > 0" class="existing-pages-section">
      <label class="form-label">
        New Pages to Upload ({{ newPagePreviews.length }})
      </label>
      <div class="existing-pages-grid">
        <div v-for="preview in newPagePreviews" :key="preview.index" class="existing-page-thumb">
          <img :src="preview.url" :alt="preview.name" loading="lazy" />
          <span class="page-number-badge">{{ preview.index }}</span>
        </div>
      </div>
    </div>

    <div class="d-flex gap-2 pt-2">
      <button type="submit" class="action-pill action-pill--post" :disabled="loading">
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
  outline: 2px dashed var(--accent);
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
  color: var(--accent);
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

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--text);
  font-size: 0.84rem;
  padding: 0.28rem 0.65rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-pill--selected {
  background: #e6f4ea;
  border-color: #34a853;
  color: #137333;
}

.tag-pill--selected:hover {
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

/* Existing pages preview */
.existing-pages-section {
  margin-top: 0.25rem;
}

.existing-pages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
}

.existing-page-thumb {
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--line);
}

.existing-page-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-number-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  line-height: 1.3;
}
</style>
