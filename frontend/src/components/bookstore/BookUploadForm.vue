<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  initialBook: {
    type: Object,
    default: null,
  },
  categories: {
    type: Array,
    default: () => [],
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
  originalPrice: 0,
  stock: -1,
  categories: [],
  status: 'draft',
  tags: [],
  tagInput: '',
  coverImage: null,
  ebookFile: null,
})

const coverPreview = ref('')
const ebookName = ref('')

const isEdit = computed(() => Boolean(props.initialBook))

watch(
  () => props.initialBook,
  (book) => {
    if (!book) return
    form.value = {
      title: book.title || '',
      description: book.description || '',
      price: book.price || 0,
      originalPrice: book.originalPrice || book.price || 0,
      stock: Number.isFinite(book.stock) ? book.stock : -1,
      categories: Array.isArray(book.categories) ? book.categories.map((c) => c._id || c) : [],
      status: book.status || 'draft',
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
</script>

<template>
  <form class="upload-form d-grid gap-3" @submit.prevent="submit">
    <div class="row g-3">
      <div class="col-md-8">
        <label class="form-label">Title</label>
        <input v-model="form.title" type="text" class="form-control" placeholder="Book title" required />
      </div>
      <div class="col-md-4">
        <label class="form-label">Status</label>
        <select v-model="form.status" class="form-select">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
    </div>

    <div>
      <label class="form-label">Description</label>
      <textarea v-model="form.description" class="form-control" rows="4" placeholder="Tell readers what this book is about"></textarea>
    </div>

    <div class="row g-3">
      <div class="col-md-4">
        <label class="form-label">Price ($)</label>
        <input v-model.number="form.price" type="number" class="form-control" min="0" step="0.01" required />
      </div>
      <div class="col-md-4">
        <label class="form-label">Original Price ($)</label>
        <input v-model.number="form.originalPrice" type="number" class="form-control" min="0" step="0.01" />
      </div>
      <div class="col-md-4">
        <label class="form-label">Stock (-1 for unlimited)</label>
        <input v-model.number="form.stock" type="number" class="form-control" min="-1" />
      </div>
    </div>

    <div>
      <label class="form-label">Categories</label>
      <select v-model="form.categories" class="form-select" multiple size="4">
        <option v-for="category in categories" :key="category._id || category" :value="category._id || category">
          {{ category.name || category }}
        </option>
      </select>
      <small class="text-muted">Hold Ctrl/Cmd to select multiple</small>
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
      <div class="col-md-6">
        <label class="form-label">Cover Image</label>
        <input type="file" class="form-control" accept="image/*" @change="onCoverChange" />
        <div v-if="coverPreview" class="preview-wrap mt-2">
          <img :src="coverPreview" alt="Cover preview" class="cover-preview" />
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-label">E-book File</label>
        <input type="file" class="form-control" accept=".pdf,.epub,.mobi" @change="onEbookChange" />
        <p v-if="ebookName" class="file-name mt-2 mb-0">
          <i class="fa-solid fa-file-lines me-1"></i> {{ ebookName }}
        </p>
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
