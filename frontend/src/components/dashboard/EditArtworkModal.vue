<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useArtworkStore } from '@/stores/artwork.store'
import { getTags } from '@/services/api'

const props = defineProps({
  artwork: { type: Object, required: true },
})

const emit = defineEmits(['close', 'updated'])

const artworkStore = useArtworkStore()

const title = ref('')
const description = ref('')
const ageRating = ref('all')
const tagList = ref([])
const tagInput = ref('')
const tagSuggestions = ref([])
const tagSuggestionLoading = ref(false)
let tagSuggestionTimer = null

const submitting = ref(false)
const errorMsg = ref('')

const TITLE_MAX = 200
const DESC_MAX = 5000
const titleChars = computed(() => title.value.length)
const descChars = computed(() => description.value.length)
const canSubmit = computed(() => title.value.trim().length > 0 && !submitting.value)
const tagsCount = computed(() => tagList.value.length)
const showSuggestionPanel = computed(() => tagInput.value.trim().length > 0)

function normalizeTagName(rawValue) {
  return String(rawValue || '')
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, '_')
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
  if (tagList.value.includes(normalizedTag)) {
    if (clearInput) tagInput.value = ''
    resetTagSuggestionState()
    return
  }
  if (tagList.value.length >= 10) {
    errorMsg.value = 'You can use up to 10 tags.'
    return
  }
  tagList.value.push(normalizedTag)
  errorMsg.value = ''
  if (clearInput) tagInput.value = ''
  resetTagSuggestionState()
}

function removeTag(index) {
  tagList.value.splice(index, 1)
}

function handleTagInputKeydown(event) {
  if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
    event.preventDefault()
    commitTag(tagInput.value)
  }
}

function handleSelectSuggestion(suggestionName) {
  commitTag(suggestionName)
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
      (item) => !tagList.value.includes(item.name),
    )
  } catch {
    tagSuggestions.value = []
  } finally {
    tagSuggestionLoading.value = false
  }
}

function handleTagInputChange() {
  clearTagSuggestionTimer()
  const keyword = tagInput.value.trim()
  if (!keyword) {
    tagSuggestions.value = []
    return
  }
  tagSuggestionTimer = setTimeout(() => {
    fetchTagSuggestions(keyword)
  }, 300)
}

function handleKeydown(e) {
  if (e.key === 'Escape') emit('close')
}

async function handleSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  errorMsg.value = ''

  try {
    await artworkStore.updateArtwork(props.artwork._id, {
      title: title.value.trim(),
      description: description.value.trim(),
      ageRating: ageRating.value,
      tags: tagList.value,
    })
    emit('updated')
  } catch (err) {
    errorMsg.value =
      err?.response?.data?.message || err?.message || 'Failed to update artwork'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  title.value = props.artwork.title || ''
  description.value = props.artwork.description || ''
  ageRating.value = props.artwork.ageRating || 'all'
  tagList.value = (props.artwork.tags || [])
    .map((t) => (typeof t === 'string' ? t : t.name || ''))
    .filter(Boolean)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  clearTagSuggestionTimer()
})
</script>

<template>
  <Teleport to="body">
  <div class="ea-backdrop" @click.self="emit('close')">
    <div class="ea-dialog" role="dialog" aria-modal="true" aria-label="Edit artwork">
      <div class="ea-header">
        <h3 class="ea-header-title">Edit artwork</h3>
        <button type="button" class="ea-close" @click="emit('close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form class="ea-body" @submit.prevent="handleSubmit">
        <div class="ea-field">
          <label class="ea-label">
            Title <span class="ea-required">* Required</span>
          </label>
          <div class="ea-input-wrap">
            <input
              v-model="title"
              type="text"
              class="ea-input"
              :maxlength="TITLE_MAX"
              placeholder="Artwork title"
            />
            <span class="ea-counter" :class="{ 'ea-counter--over': titleChars > TITLE_MAX }">
              {{ titleChars }}/{{ TITLE_MAX }}
            </span>
          </div>
        </div>

        <div class="ea-field">
          <label class="ea-label">Description</label>
          <div class="ea-input-wrap ea-textarea-wrap">
            <textarea
              v-model="description"
              class="ea-input ea-textarea"
              :maxlength="DESC_MAX"
              placeholder="Describe your artwork..."
              rows="4"
            ></textarea>
            <span class="ea-counter ea-counter--textarea" :class="{ 'ea-counter--over': descChars > DESC_MAX }">
              {{ descChars }}/{{ DESC_MAX }}
            </span>
          </div>
        </div>

        <div class="ea-field">
          <label class="ea-label">Age Rating</label>
          <div class="ea-radio-group">
            <label class="ea-radio-label">
              <input type="radio" v-model="ageRating" value="all" class="ea-radio" />
              <span class="ea-radio-text">All ages</span>
            </label>
            <label class="ea-radio-label">
              <input type="radio" v-model="ageRating" value="r-18" class="ea-radio" />
              <span class="ea-radio-text">R-18</span>
            </label>
          </div>
        </div>

        <div class="ea-field">
          <div class="ea-tag-header">
            <span class="ea-tag-count">{{ tagsCount }}/10</span>
          </div>
          <div class="ea-tag-wrap">
            <div class="ea-tag-input-row">
              <input
                v-model="tagInput"
                type="text"
                class="ea-input ea-tag-input"
                placeholder="Tags"
                @input="handleTagInputChange"
                @keydown="handleTagInputKeydown"
              />
            </div>
            <div v-if="showSuggestionPanel" class="ea-suggestion-panel" role="listbox" aria-label="Tag suggestions">
              <p v-if="tagSuggestionLoading" class="ea-suggestion-loading">Loading suggestions...</p>
              <template v-else>
                <button
                  v-for="suggestion in tagSuggestions"
                  :key="suggestion.name"
                  type="button"
                  class="ea-suggestion-item"
                  @click="handleSelectSuggestion(suggestion.name)"
                >
                  <span class="ea-suggestion-name">#{{ suggestion.name }}</span>
                  <span class="ea-suggestion-count">{{ suggestion.usageCount || 0 }} results</span>
                </button>
                <p v-if="tagSuggestions.length === 0" class="ea-suggestion-empty">
                  No matching tag. Press Space/Enter to create new tag.
                </p>
              </template>
            </div>
          </div>
          <div v-if="tagList.length > 0" class="ea-tag-list">
            <button
              v-for="(tag, index) in tagList"
              :key="`${tag}-${index}`"
              type="button"
              class="ea-tag-pill"
              @click="removeTag(index)"
            >
              #{{ tag }}
              <span class="ea-tag-remove">&times;</span>
            </button>
          </div>
        </div>

        <p v-if="errorMsg" class="ea-error">{{ errorMsg }}</p>

        <div class="ea-actions">
          <button type="button" class="ea-btn ea-btn--cancel" @click="emit('close')">
            Cancel
          </button>
          <button type="submit" class="ea-btn ea-btn--save" :disabled="!canSubmit">
            {{ submitting ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  </Teleport>
</template>

<style scoped>
.ea-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: eaFadeIn 0.15s ease;
}

@keyframes eaFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.ea-dialog {
  background: #fff;
  border-radius: 16px;
  width: min(520px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: eaSlideUp 0.2s ease;
}

@keyframes eaSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.ea-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 0;
  flex-shrink: 0;
}

.ea-header-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.ea-close {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 1.15rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  transition: background 0.12s, color 0.12s;
}

.ea-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.ea-body {
  padding: 1.25rem 1.5rem 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.ea-field {
  margin-bottom: 1.25rem;
}

.ea-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.4rem;
}

.ea-required {
  color: #0096fa;
  font-weight: 600;
}

.ea-input-wrap {
  position: relative;
}

.ea-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  padding-right: 4rem;
  font-size: 0.88rem;
  font-family: inherit;
  color: #1f2937;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
  outline: none;
}

.ea-input:focus {
  border-color: #0096fa;
  box-shadow: 0 0 0 3px rgba(0, 150, 250, 0.12);
}

.ea-input::placeholder {
  color: #9ca3af;
}

.ea-textarea {
  resize: vertical;
  min-height: 80px;
}

.ea-textarea-wrap .ea-counter--textarea {
  bottom: 0.6rem;
  right: 0.75rem;
}

.ea-counter {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
  pointer-events: none;
}

.ea-counter--over {
  color: #dc2626;
}

.ea-radio-group {
  display: flex;
  gap: 1.25rem;
}

.ea-radio-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #374151;
}

.ea-radio {
  accent-color: #0096fa;
}

.ea-radio-text {
  font-weight: 500;
}

/* Tag section */
.ea-tag-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.35rem;
}

.ea-tag-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
}

.ea-tag-wrap {
  position: relative;
}

.ea-tag-input-row {
  display: flex;
  align-items: center;
}

.ea-tag-input {
  padding-right: 0.85rem !important;
}

.ea-suggestion-panel {
  position: absolute;
  z-index: 10;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  padding: 0.35rem;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 0.2rem;
  max-height: 220px;
  overflow-y: auto;
}

.ea-suggestion-loading,
.ea-suggestion-empty {
  font-size: 0.8rem;
  color: #94a3b8;
  padding: 0.5rem 0.65rem;
  margin: 0;
}

.ea-suggestion-item {
  border: 0;
  border-radius: 6px;
  text-align: left;
  padding: 0.5rem 0.65rem;
  font-size: 0.86rem;
  background: #fff;
  color: #334155;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.ea-suggestion-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.ea-suggestion-name {
  font-weight: 500;
}

.ea-suggestion-count {
  color: #94a3b8;
  font-size: 0.8rem;
}

.ea-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.5rem;
}

.ea-tag-pill {
  border: 1px solid #d2dae6;
  border-radius: 999px;
  background: #e6f4ea;
  color: #137333;
  font-size: 0.84rem;
  padding: 0.28rem 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: all 0.15s;
}

.ea-tag-pill:hover {
  background: #fce8e6;
  border-color: #ea4335;
  color: #c5221f;
}

.ea-tag-remove {
  font-size: 0.95rem;
  line-height: 1;
  font-weight: bold;
}

.ea-error {
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

.ea-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

.ea-btn {
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 999px;
  height: 38px;
  padding: 0 1.5rem;
  cursor: pointer;
  transition: background 0.12s, opacity 0.12s;
}

.ea-btn--cancel {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.ea-btn--cancel:hover {
  background: #f9fafb;
}

.ea-btn--save {
  background: #0096fa;
  color: #fff;
}

.ea-btn--save:hover:not(:disabled) {
  background: #2563eb;
}

.ea-btn--save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
