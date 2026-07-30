<script setup>
import { computed, ref, watch } from 'vue'

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

function addTag() {
  const raw = String(form.value.tagInput || '').trim()
  if (!raw) return

  const tags = raw.split(',').map((t) => t.trim().replace(/\s+/g, '_').toLowerCase()).filter(Boolean)
  for (const tag of tags) {
    if (!form.value.tags.includes(tag)) {
      form.value.tags.push(tag)
    }
  }
  form.value.tagInput = ''
}

function removeTag(index) {
  form.value.tags.splice(index, 1)
}

function handleTagKeydown(event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTag()
  }
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
      <input v-model="form.title" type="text" class="form-control" placeholder="Book title" required />
    </div>

    <div>
      <label class="form-label">Description</label>
      <textarea v-model="form.description" class="form-control" rows="4" placeholder="Tell readers what this book is about"></textarea>
    </div>

    <div>
      <label class="form-label">Price ($)</label>
      <input v-model.number="form.price" type="number" class="form-control" min="0" step="0.01" required />
    </div>

    <div>
      <label class="form-label">Tags</label>
      <div class="tag-input-wrap">
        <input
          v-model="form.tagInput"
          type="text"
          class="form-control"
          placeholder="Add tags separated by comma"
          @keydown="handleTagKeydown"
        />
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="addTag">Add</button>
      </div>
      <div class="tag-list">
        <span v-for="(tag, index) in form.tags" :key="tag" class="tag-chip">
          {{ tag }}
          <button type="button" class="tag-remove" @click="removeTag(index)"><i class="fa-solid fa-xmark"></i></button>
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
  display: flex;
  gap: 0.5rem;
}

.tag-input-wrap .form-control {
  flex: 1;
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
}

.tag-remove {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: 0.75rem;
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
