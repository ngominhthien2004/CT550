<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import UploadTagSelector from '../components/upload/UploadTagSelector.vue'
import api, { getArtworkById, getTags } from '../services/api'
import { useArtworkStore } from '../stores/artwork.store'
import { toggleNavCollapsed } from '../utils/viewNavigation'

const route = useRoute()
const router = useRouter()
const artworkStore = useArtworkStore()
const isNavCollapsed = ref(true)

const loading = ref(true)
const error = ref('')
const artwork = ref(null)
const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)

const tagSuggestions = ref([])
const tagSuggestionLoading = ref(false)
let tagSuggestionTimer = null

const form = reactive({
  title: '',
  description: '',
  ageRating: 'all',
  tags: [],
  tagInput: '',
})

const TITLE_MAX = 200
const DESC_MAX = 5000
const titleCount = computed(() => form.title.length)
const descCount = computed(() => form.description.length)
const tagsCount = computed(() => form.tags.length)
const canSubmit = computed(() => form.title.trim().length > 0 && !submitting.value)

function toggleLeftNav() {
  toggleNavCollapsed(isNavCollapsed)
}

function normalizeTagName(rawValue) {
  return String(rawValue || '')
    .trim()
    .replace(/^#+/, '')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

function clearTagSuggestionTimer() {
  if (tagSuggestionTimer) {
    clearTimeout(tagSuggestionTimer)
    tagSuggestionTimer = null
  }
}

function resetTagSuggestionState() {
  clearTagSuggestionTimer()
  tagSuggestions.value = []
  tagSuggestionLoading.value = false
}

function commitTag(tagValue, clearInput = true) {
  const normalizedTag = normalizeTagName(tagValue)
  if (!normalizedTag) return
  if (form.tags.includes(normalizedTag)) {
    if (clearInput) form.tagInput = ''
    resetTagSuggestionState()
    return
  }
  if (form.tags.length >= 10) {
    submitError.value = 'You can use up to 10 tags.'
    return
  }
  form.tags.push(normalizedTag)
  submitError.value = ''
  if (clearInput) form.tagInput = ''
  resetTagSuggestionState()
}

function removeTag(index) {
  form.tags.splice(index, 1)
}

function handleSelectSuggestion(suggestion) {
  commitTag(suggestion)
}

function handleTagInputKeydown(event) {
  if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
    event.preventDefault()
    commitTag(form.tagInput)
  }
}

async function fetchTagSuggestions(keyword) {
  tagSuggestionLoading.value = true
  try {
    const { data } = await getTags({ q: keyword, limit: 8 })
    const normalizedSuggestions = Array.isArray(data)
      ? data
          .map((item) => ({
            name: normalizeTagName(item?.name),
            usageCount: Number(item?.usageCount || 0),
          }))
          .filter((item) => Boolean(item.name))
      : []
    const uniqueByName = new Map()
    normalizedSuggestions.forEach((item) => {
      if (!uniqueByName.has(item.name)) {
        uniqueByName.set(item.name, item)
      }
    })
    tagSuggestions.value = Array.from(uniqueByName.values()).filter(
      (item) => !form.tags.includes(item.name),
    )
  } catch {
    tagSuggestions.value = []
  } finally {
    tagSuggestionLoading.value = false
  }
}

async function loadArtwork() {
  const artworkId = route.params.id
  if (!artworkId) {
    error.value = 'No artwork ID provided.'
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data } = await getArtworkById(artworkId)
    artwork.value = data
    form.title = data.title || ''
    form.description = data.description || ''
    form.ageRating = data.ageRating || 'all'
    form.tags = (data.tags || [])
      .map((t) => (typeof t === 'string' ? t : t.name || ''))
      .filter(Boolean)
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to load artwork.'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!canSubmit.value || !artwork.value) return
  submitting.value = true
  submitError.value = ''
  submitSuccess.value = false

  try {
    await artworkStore.updateArtwork(artwork.value._id, {
      title: form.title.trim(),
      description: form.description.trim(),
      ageRating: form.ageRating,
      tags: form.tags,
    })
    submitSuccess.value = true
    setTimeout(() => { submitSuccess.value = false }, 3000)
  } catch (err) {
    submitError.value = err?.response?.data?.message || 'Failed to update artwork.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!artwork.value) return
  deleting.value = true
  try {
    await artworkStore.deleteArtwork(artwork.value._id)
    await router.push('/dashboard')
  } catch {
    submitError.value = 'Failed to delete artwork.'
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

onMounted(() => {
  loadArtwork()
})

onBeforeUnmount(() => {
  clearTagSuggestionTimer()
})
</script>

<template>
  <MainLayoutTemplate :is-nav-collapsed="isNavCollapsed" @toggle-sidebar="toggleLeftNav">
    <section class="edit-page">
      <div class="edit-wrap">
        <p v-if="loading" class="state-note">Loading artwork...</p>
        <p v-else-if="error" class="state-note state-note--error">{{ error }}</p>

        <template v-else-if="artwork">
          <div class="edit-hero">
            <div class="edit-hero-inner">
              <p class="edit-hero-kicker">Edit artwork</p>
              <h1 class="edit-hero-title">{{ artwork.title }}</h1>
              <div class="edit-hero-meta">
                <span class="meta-pill">{{ artwork.type }}</span>
                <span class="meta-pill">{{ artwork.images?.length || 0 }} image{{ (artwork.images?.length || 0) !== 1 ? 's' : '' }}</span>
                <span class="meta-pill">{{ artwork.viewCount?.toLocaleString() || 0 }} views</span>
              </div>
            </div>
            <router-link :to="`/artworks/${artwork._id}`" class="back-link">
              <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> View artwork
            </router-link>
          </div>

          <div class="edit-preview" v-if="artwork.images?.length">
            <div class="preview-strip">
              <img
                v-for="(img, idx) in artwork.images.slice(0, 5)"
                :key="idx"
                :src="img"
                :alt="`${artwork.title} image ${idx + 1}`"
                class="preview-thumb"
                loading="lazy"
              />
              <span v-if="artwork.images.length > 5" class="preview-more">+{{ artwork.images.length - 5 }}</span>
            </div>
          </div>

          <form class="edit-form" @submit.prevent="handleSubmit">
            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-label">
                  <span class="placeholder-badge"></span>
                  <span class="label-text">Type of Work</span>
                </div>
                <div class="settings-options">
                  <span class="type-badge">{{ artwork.type }}</span>
                </div>
              </div>
            </div>

            <div class="form-card">
              <div class="title-row-wrap">
                <input
                  v-model="form.title"
                  type="text"
                  class="title-input"
                  :maxlength="TITLE_MAX"
                  required
                  placeholder="Title"
                />
                <span class="counter-badge">{{ titleCount }}/{{ TITLE_MAX }}</span>
              </div>
              <div class="separator"></div>
              <div class="caption-row-wrap">
                <textarea
                  v-model="form.description"
                  class="caption-textarea"
                  :maxlength="DESC_MAX"
                  rows="5"
                  placeholder="Caption"
                ></textarea>
                <span class="counter-badge counter-badge--bottom">{{ descCount }}/{{ DESC_MAX }}</span>
              </div>
            </div>

            <UploadTagSelector
              :tags="form.tags"
              :tag-input="form.tagInput"
              :allow-tag-edit="true"
              :tags-count="tagsCount"
              :suggestions="tagSuggestions"
              :suggestion-loading="tagSuggestionLoading"
              @update:tag-input="form.tagInput = $event"
              @update:allow-tag-edit="() => {}"
              @input-keydown="handleTagInputKeydown"
              @add-tag="() => commitTag(form.tagInput)"
              @remove-tag="removeTag"
              @select-suggestion="handleSelectSuggestion"
            />

            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-label">
                  <span class="required-badge">Required</span>
                  <span class="label-text label-text--required">Visible to</span>
                </div>
                <div class="settings-options">
                  <label class="custom-radio">
                    <input v-model="form.ageRating" type="radio" name="ageRating" value="all" />
                    <span class="radio-dot"></span>
                    <span>All ages</span>
                  </label>
                  <label class="custom-radio">
                    <input v-model="form.ageRating" type="radio" name="ageRating" value="r-18" />
                    <span class="radio-dot"></span>
                    <span>R-18</span>
                  </label>
                </div>
              </div>
            </div>

            <p v-if="submitError" class="error-msg">{{ submitError }}</p>
            <p v-if="submitSuccess" class="success-msg">Artwork updated successfully.</p>

            <div class="form-actions">
              <button type="button" class="btn btn--delete" @click="showDeleteConfirm = true">
                <i class="fa-solid fa-trash" aria-hidden="true"></i> Delete
              </button>
              <button type="submit" class="btn btn--save" :disabled="!canSubmit">
                {{ submitting ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </template>
      </div>

      <div v-if="showDeleteConfirm" class="modal-backdrop" @click.self="showDeleteConfirm = false">
        <div class="modal-dialog">
          <h3 class="modal-title">Delete artwork</h3>
          <p class="modal-text">Are you sure you want to delete "{{ artwork?.title }}"? This action cannot be undone.</p>
          <div class="modal-actions">
            <button type="button" class="btn btn--cancel" @click="showDeleteConfirm = false">Cancel</button>
            <button type="button" class="btn btn--danger" @click="handleDelete" :disabled="deleting">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.edit-page {
  display: block;
  padding: 0.4rem 0;
}

.edit-wrap {
  display: grid;
  gap: 0.85rem;
  max-width: 780px;
  margin: 0 auto;
}

.state-note {
  padding: 0.95rem 1rem;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--muted);
  font-weight: 600;
}

.state-note--error {
  color: #b42318;
  background: rgba(180, 35, 24, 0.06);
  border-color: rgba(180, 35, 24, 0.16);
}

.edit-hero {
  border-radius: 16px;
  background: linear-gradient(135deg, #0096fa 0%, #7c3aed 100%);
  padding: 2rem 2rem 1.8rem;
  color: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.edit-hero-inner {
  max-width: 500px;
}

.edit-hero-kicker {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.8;
  margin: 0 0 0.4rem;
}

.edit-hero-title {
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0 0 0.6rem;
  color: inherit;
}

.edit-hero-meta {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.meta-pill {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: capitalize;
}

.back-link {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.82rem;
  text-decoration: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: background 0.15s ease;
  flex-shrink: 0;
}

.back-link:hover {
  background: rgba(255, 255, 255, 0.25);
}

.edit-preview {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 1rem;
}

.preview-strip {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
}

.preview-thumb {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--line);
  flex-shrink: 0;
}

.preview-more {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: var(--surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--muted);
  flex-shrink: 0;
}

.form-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
}

.title-row-wrap {
  position: relative;
  padding: 0.85rem 4.5rem 0.85rem 1rem;
}

.title-input {
  width: 100%;
  border: none;
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--text);
  background: transparent;
  outline: none;
  padding: 0.2rem 0;
}

.title-input::placeholder {
  color: var(--muted);
  font-weight: 400;
}

.separator {
  height: 1px;
  background: var(--line);
}

.caption-row-wrap {
  position: relative;
  padding: 0.85rem 1rem 2rem 1rem;
}

.caption-textarea {
  width: 100%;
  border: none;
  font-size: 0.95rem;
  color: var(--text);
  background: transparent;
  outline: none;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.caption-textarea::placeholder {
  color: var(--muted);
}

.counter-badge {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 0.78rem;
  pointer-events: none;
}

.counter-badge--bottom {
  top: auto;
  bottom: 0.6rem;
  transform: none;
}

.settings-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
}

.settings-row {
  display: grid;
  grid-template-columns: 240px 1fr;
  align-items: center;
  padding: 0.95rem 1.25rem;
}

.settings-label {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.required-badge {
  background: #ff3b30;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.22rem 0.45rem;
  border-radius: 4px;
  text-transform: uppercase;
  min-width: 62px;
  text-align: center;
}

.label-text {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text);
}

.label-text--required {
  color: #ef4444;
}

.placeholder-badge {
  display: inline-block;
  min-width: 62px;
  height: 1px;
}

.type-badge {
  background: var(--surface-alt);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.3rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text);
  text-transform: capitalize;
}

.settings-options {
  display: flex;
  gap: 1.5rem;
  padding-left: 0.5rem;
}

.custom-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--text);
}

.custom-radio input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.radio-dot {
  position: relative;
  width: 18px;
  height: 18px;
  border: 1.5px solid #cbd5e1;
  border-radius: 50%;
  transition: all 0.2s ease-in-out;
}

.custom-radio:hover .radio-dot {
  border-color: var(--accent);
}

.custom-radio input:checked ~ .radio-dot {
  border-color: var(--accent);
}

.radio-dot::after {
  content: '';
  position: absolute;
  display: none;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
}

.custom-radio input:checked ~ .radio-dot::after {
  display: block;
}

.error-msg {
  color: var(--danger);
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
}

.success-msg {
  color: #15803d;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.5rem;
}

.btn {
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  border-radius: 999px;
  height: 40px;
  padding: 0 1.5rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.15s, opacity 0.15s;
}

.btn--save {
  background: var(--accent);
  color: #fff;
}

.btn--save:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn--save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn--delete {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--danger);
}

.btn--delete:hover {
  background: rgba(220, 38, 38, 0.06);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 150;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.modal-dialog {
  background: var(--surface);
  border-radius: 14px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-lg);
}

.modal-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.5rem;
}

.modal-text {
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.2rem;
}

.btn--cancel {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
}

.btn--cancel:hover {
  background: var(--surface-alt);
}

.btn--danger {
  background: var(--danger);
  color: #fff;
}

.btn--danger:hover:not(:disabled) {
  opacity: 0.9;
}

.btn--danger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .edit-hero {
    flex-direction: column;
    padding: 1.4rem 1.2rem;
  }

  .edit-hero-title {
    font-size: 1.25rem;
  }

  .settings-row {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }
}
</style>
