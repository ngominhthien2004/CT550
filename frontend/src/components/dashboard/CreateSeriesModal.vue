<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSeriesStore } from '@/stores/series.store'
import { useAuthStore } from '@/stores/auth.store'
import { seriesApi } from '@/services/api'
import ArtworkPickerModal from './ArtworkPickerModal.vue'
import { useI18n } from 'vue-i18n'
import { translateError } from '../../utils/translateError.js'

const props = defineProps({
  type: { type: String, default: 'manga' },
  editSeries: { type: Object, default: null },
})

const emit = defineEmits(['close', 'created', 'updated'])

const seriesStore = useSeriesStore()
const authStore = useAuthStore()

const isEditMode = computed(() => !!props.editSeries)
const { t } = useI18n()

// Form state
const title = ref('')
const description = ref('')
const seriesType = ref(props.type)
const coverImageFile = ref(null)
const coverImagePreview = ref('')
const selectedArtworks = ref([])
const submitting = ref(false)
const errorMsg = ref('')
const isCompleted = ref(false)

// Artwork picker
const showArtworkPicker = ref(false)

// Character limits
const TITLE_MAX = 32
const DESC_MAX = 100

const titleChars = computed(() => title.value.length)
const descChars = computed(() => description.value.length)
const canSubmit = computed(() => title.value.trim().length > 0 && !submitting.value)

const typeLabel = computed(() => {
  const map = { manga: 'manga', novel: 'novel', illust: 'illustration' }
  return map[seriesType.value] || seriesType.value
})

// Watch type prop changes
watch(
  () => props.type,
  (newType) => {
    if (!isEditMode.value) {
      seriesType.value = newType
    }
  },
)

// Cover image handling
function handleCoverClick() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/png,image/webp'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      coverImageFile.value = file
      coverImagePreview.value = URL.createObjectURL(file)
    }
  }
  input.click()
}

function removeCover() {
  if (coverImagePreview.value) {
    URL.revokeObjectURL(coverImagePreview.value)
  }
  coverImageFile.value = null
  coverImagePreview.value = ''
}

// Artwork picker handlers
function openArtworkPicker() {
  showArtworkPicker.value = true
}

function onArtworksSelected(artworks) {
  selectedArtworks.value = artworks
  showArtworkPicker.value = false
}

function removeArtwork(artworkId) {
  selectedArtworks.value = selectedArtworks.value.filter((a) => a._id !== artworkId)
}

// Extract thumbnail URL from an artwork (handles both populated and plain objects)
function getArtworkThumb(artwork) {
  return artwork.images?.[0] || artwork.thumbnailUrl || artwork.imageUrl || artwork.fileUrl || ''
}

// Submit
async function handleSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  errorMsg.value = ''

  try {
    if (isEditMode.value) {
      // Edit mode: update series metadata
      const seriesId = props.editSeries._id
      await seriesApi.update(seriesId, {
        title: title.value.trim(),
        description: description.value.trim(),
        isCompleted: isCompleted.value,
      })

      // Upload cover if changed
      if (coverImageFile.value) {
        const formData = new FormData()
        formData.append('coverImage', coverImageFile.value)
        await seriesApi.uploadCover(seriesId, formData)
      }

      // Diff artworks: find adds and removes
      const originalIds = new Set((props.editSeries.artworks || []).map((a) => a._id))
      const newIds = new Set(selectedArtworks.value.map((a) => a._id))

      // Artworks to add (in new but not in original)
      for (const artwork of selectedArtworks.value) {
        if (!originalIds.has(artwork._id)) {
          await seriesApi.addArtwork(seriesId, artwork._id)
        }
      }

      // Artworks to remove (in original but not in new)
      for (const artwork of (props.editSeries.artworks || [])) {
        if (!newIds.has(artwork._id)) {
          await seriesApi.removeArtwork(seriesId, artwork._id)
        }
      }

      emit('updated')
    } else {
      // Create mode: existing logic
      const { data: series } = await seriesApi.create({
        title: title.value.trim(),
        description: description.value.trim(),
        type: seriesType.value,
      })

      // Series is created — emit immediately so UI updates
      emit('created', series)

      // Upload cover if selected (non-critical)
      if (coverImageFile.value && series._id) {
        try {
          const formData = new FormData()
          formData.append('coverImage', coverImageFile.value)
          await seriesApi.uploadCover(series._id, formData)
        } catch { /* cover upload failed but series exists */ }
      }

      // Add selected artworks to series (non-critical)
      if (selectedArtworks.value.length > 0 && series._id) {
        for (const artwork of selectedArtworks.value) {
          try {
            await seriesApi.addArtwork(series._id, artwork._id)
          } catch { /* artwork add failed but series exists */ }
        }
      }
    }
  } catch (err) {
    errorMsg.value = translateError(err, t, 'error.saveFailed')
  } finally {
    submitting.value = false
  }
}

// Escape key to close
function handleKeydown(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)

  // Pre-fill form in edit mode
  if (isEditMode.value) {
    const s = props.editSeries
    title.value = s.title || ''
    description.value = s.description || ''
    seriesType.value = s.type || props.type
    isCompleted.value = s.isCompleted || false
    coverImagePreview.value = s.coverImage || ''
    selectedArtworks.value = (s.artworks || []).map((a) => ({
      _id: a._id,
      title: a.title,
      thumbnailUrl: getArtworkThumb(a),
      images: a.images || [],
    }))
  } else {
    seriesType.value = props.type
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (coverImagePreview.value && coverImagePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(coverImagePreview.value)
  }
})
</script>

<template>
  <div class="cs-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')" tabindex="0" role="dialog" aria-modal="true">
    <div class="cs-dialog" role="dialog" aria-modal="true" :aria-label="isEditMode ? $t('series.editSeries', { type: typeLabel }) : $t('series.createSeries', { type: typeLabel })">
      <!-- Header -->
      <div class="cs-header">
        <h3 class="cs-header-title">{{ isEditMode ? $t('series.editSeries', { type: typeLabel }) : $t('series.createSeries', { type: typeLabel }) }}</h3>
        <button type="button" class="cs-close" @click="emit('close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Scrollable body -->
      <form class="cs-body" @submit.prevent="handleSubmit">
        <!-- Cover upload -->
        <div class="cs-cover-section">
          <button
            type="button"
            class="cs-cover-upload"
            :class="{ 'cs-cover-upload--has-image': coverImagePreview }"
            @click="handleCoverClick"
          >
            <img
              v-if="coverImagePreview"
              :src="coverImagePreview"
              alt="Cover preview"
              class="cs-cover-preview"
            />
            <template v-else>
              <span class="cs-cover-icon"><i class="fa-solid fa-pen"></i></span>
              <span class="cs-cover-label">{{ $t('dashboard.setCover') }}</span>
            </template>
          </button>
          <p class="cs-cover-note">{{ $t('dashboard.coverHint') }}</p>
          <button
            v-if="coverImagePreview"
            type="button"
            class="cs-cover-remove"
            @click="removeCover"
          >
            {{ $t('dashboard.removeCover') }}
          </button>
        </div>

        <!-- Title -->
        <div class="cs-field">
          <label class="cs-label">
            Title <span class="cs-required">{{ $t('dashboard.required') }}</span>
          </label>
          <div class="cs-input-wrap">
            <input
              v-model="title"
              type="text"
              class="cs-input"
              :maxlength="TITLE_MAX"
              :placeholder="$t('series.seriesName')"
              :aria-label="$t('series.seriesName')"
            />
            <span class="cs-counter" :class="{ 'cs-counter--over': titleChars > TITLE_MAX }">
              {{ titleChars }}/{{ TITLE_MAX }}
            </span>
          </div>
        </div>

        <!-- Summary -->
        <div class="cs-field">
          <label class="cs-label">{{ $t('series.summary') }}</label>
          <div class="cs-input-wrap cs-textarea-wrap">
            <textarea
              v-model="description"
              class="cs-input cs-textarea"
              :maxlength="DESC_MAX"
              :placeholder="$t('series.seriesOverview')"
              rows="3"
              :aria-label="$t('series.summary')"
            ></textarea>
            <span class="cs-counter cs-counter--textarea" :class="{ 'cs-counter--over': descChars > DESC_MAX }">
              {{ descChars }}/{{ DESC_MAX }}
            </span>
          </div>
        </div>

        <!-- Works -->
        <div class="cs-works-section">
          <div class="cs-works-header">
            <span class="cs-label cs-label--plain">{{ $t('dashboard.tabWorks') }}</span>
            <button
              v-if="selectedArtworks.length > 0"
              type="button"
              class="cs-view-all"
              @click="openArtworkPicker"
            >
              {{ $t('dashboard.viewAll') }}
            </button>
          </div>

          <div class="cs-works-body">
            <!-- Add button -->
            <button type="button" class="cs-add-work" @click="openArtworkPicker">
              <i class="fa-solid fa-plus"></i>
            </button>

            <!-- Selected artwork thumbnails -->
            <div
              v-for="artwork in selectedArtworks"
              :key="artwork._id"
              class="cs-work-thumb"
            >
              <img
                :src="getArtworkThumb(artwork)"
                :alt="artwork.title"
                loading="lazy"
              />
              <button
                type="button"
                class="cs-work-remove"
                @click="removeArtwork(artwork._id)"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Status toggle (edit mode only) -->
        <div v-if="isEditMode" class="cs-field">
          <label class="cs-label">Status</label>
          <div class="cs-toggle-row">
            <button
              type="button"
              class="cs-toggle"
              :class="{ 'cs-toggle--on': isCompleted }"
              @click="isCompleted = !isCompleted"
            >
              <span class="cs-toggle-knob"></span>
            </button>
            <span class="cs-toggle-label">{{ isCompleted ? $t('series.completed') : $t('series.ongoing') }}</span>
          </div>
        </div>

        <!-- Error -->
        <p v-if="errorMsg" class="cs-error">{{ errorMsg }}</p>

        <!-- Actions -->
        <div class="cs-actions">
          <button type="button" class="cs-btn cs-btn--cancel" @click="emit('close')">
            {{ $t('series.cancel') }}
          </button>
          <button type="submit" class="cs-btn cs-btn--save" :disabled="!canSubmit">
            {{ submitting ? $t('series.saving') : $t('series.saveChanges') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Artwork picker modal -->
    <ArtworkPickerModal
      v-if="showArtworkPicker"
      :selected-ids="selectedArtworks.map((a) => a._id)"
      :type="seriesType"
      :include-series="isEditMode ? editSeries._id : ''"
      @close="showArtworkPicker = false"
      @select="onArtworksSelected"
    />
  </div>
</template>

<style scoped>
/* Backdrop */
.cs-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 150;
  display: grid;
  place-items: center;
  padding: 1rem;
  animation: csFadeIn 0.15s ease;
}

@keyframes csFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Dialog */
.cs-dialog {
  background: var(--surface, #fff);
  border-radius: 16px;
  width: min(560px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: csSlideUp 0.2s ease;
}

@keyframes csSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Header */
.cs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 0;
  flex-shrink: 0;
}

.cs-header-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--brand, #1f2937);
  margin: 0;
}

.cs-close {
  border: none;
  background: transparent;
  color: var(--muted, #6b7280);
  font-size: 1.15rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  transition: background 0.12s, color 0.12s;
}

.cs-close:hover {
  background: var(--surface-alt, #f3f4f6);
  color: var(--text, #374151);
}

/* Body */
.cs-body {
  padding: 1.25rem 1.5rem 1.5rem;
  overflow-y: auto;
  flex: 1;
}

/* Cover section */
.cs-cover-section {
  margin-bottom: 1.5rem;
}

.cs-cover-upload {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 2px dashed var(--line, #d1d5db);
  border-radius: 12px;
  background: var(--surface-alt, #f9fafb);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  overflow: hidden;
  position: relative;
  transition: border-color 0.15s, background 0.15s;
  padding: 0;
}

.cs-cover-upload:hover {
  border-color: var(--accent, #0096fa);
  background: var(--surface-alt);
}

.cs-cover-upload--has-image {
  border-style: solid;
  border-color: var(--line, #e5e7eb);
  aspect-ratio: 16 / 9;
}

.cs-cover-upload--has-image:hover {
  border-color: var(--accent, #0096fa);
}

.cs-cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cs-cover-icon {
  font-size: 1.25rem;
  color: var(--muted, #9ca3af);
}

.cs-cover-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted, #6b7280);
}

.cs-cover-note {
  font-size: 0.72rem;
  color: var(--muted, #9ca3af);
  margin: 0.5rem 0 0;
  line-height: 1.5;
}

.cs-cover-remove {
  border: none;
  background: transparent;
  color: var(--danger, #dc2626);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0;
  margin-top: 0.25rem;
}

.cs-cover-remove:hover {
  text-decoration: underline;
}

/* Fields */
.cs-field {
  margin-bottom: 1.25rem;
}

.cs-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text, #374151);
  margin-bottom: 0.4rem;
}

.cs-label--plain {
  margin-bottom: 0;
}

.cs-required {
  color: var(--accent, #0096fa);
  font-weight: 600;
}

.cs-input-wrap {
  position: relative;
}

.cs-input {
  width: 100%;
  border: 1px solid var(--line, #d1d5db);
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  padding-right: 4rem;
  font-size: 0.88rem;
  font-family: inherit;
  color: var(--text, #1f2937);
  background: var(--surface, #fff);
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
  outline: none;
}

.cs-input:focus {
  border-color: var(--accent, #0096fa);
  box-shadow: 0 0 0 3px rgba(0, 150, 250, 0.12);
}

.cs-input::placeholder {
  color: var(--muted, #9ca3af);
}

.cs-textarea {
  resize: vertical;
  min-height: 80px;
  padding-right: 4rem;
}

.cs-textarea-wrap .cs-counter--textarea {
  bottom: 0.6rem;
  right: 0.75rem;
}

.cs-counter {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--muted, #9ca3af);
  pointer-events: none;
}

.cs-counter--over {
  color: var(--danger, #dc2626);
}

/* Works section */
.cs-works-section {
  margin-bottom: 1.25rem;
}

.cs-works-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.cs-view-all {
  border: none;
  background: transparent;
  color: var(--accent, #0096fa);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.cs-view-all:hover {
  text-decoration: underline;
}

.cs-works-body {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.cs-works-body::-webkit-scrollbar {
  height: 4px;
}

.cs-works-body::-webkit-scrollbar-track {
  background: transparent;
}

.cs-works-body::-webkit-scrollbar-thumb {
  background: var(--line, #d1d5db);
  border-radius: 4px;
}

.cs-add-work {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border: 2px dashed var(--line, #d1d5db);
  border-radius: 10px;
  background: var(--surface-alt, #f9fafb);
  color: var(--muted, #9ca3af);
  font-size: 1.25rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.cs-add-work:hover {
  border-color: var(--accent, #0096fa);
  color: var(--accent, #0096fa);
  background: var(--surface-alt);
}

.cs-work-thumb {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.cs-work-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cs-work-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.6rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  opacity: 0;
  transition: opacity 0.12s;
}

.cs-work-thumb:hover .cs-work-remove {
  opacity: 1;
}

/* Toggle */
.cs-toggle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cs-toggle {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  background: var(--line);
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  padding: 0;
}

.cs-toggle--on {
  background: var(--accent, #0096fa);
}

.cs-toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--surface);
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.cs-toggle--on .cs-toggle-knob {
  transform: translateX(18px);
}

.cs-toggle-label {
  font-size: 0.82rem;
  color: var(--text, #374151);
  font-weight: 600;
}

/* Error */
.cs-error {
  color: var(--danger, #dc2626);
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

/* Actions */
.cs-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

.cs-btn {
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 999px;
  height: 38px;
  padding: 0 1.5rem;
  cursor: pointer;
  transition: background 0.12s, opacity 0.12s;
}

.cs-btn--cancel {
  border: 1px solid var(--line, #d1d5db);
  background: var(--surface, #fff);
  color: var(--text, #374151);
}

.cs-btn--cancel:hover {
  background: var(--surface-alt, #f9fafb);
}

.cs-btn--save {
  background: var(--accent, #0096fa);
  color: #fff;
}

.cs-btn--save:hover:not(:disabled) {
  background: var(--accent-hover, #2563eb);
}

.cs-btn--save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
