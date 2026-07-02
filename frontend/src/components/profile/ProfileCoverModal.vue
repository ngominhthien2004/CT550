<script setup>
import { computed, watch, inject } from 'vue'
import { useImageUpload } from '@/composables/useImageUpload'

const DEFAULT_COVER = 'linear-gradient(135deg, #f1f5f9 0%, #dbeafe 52%, #fef3c7 100%)'

const show = inject('showCoverModal')
const user = inject('profileUser')
const coverImage = inject('profileCoverImage')
const close = inject('closeCoverModal')
const save = inject('saveCover')

function handleClose() {
  try {
    if (typeof close === 'function') {
      close()
    } else {
      show.value = false
    }
  } catch (e) {
    show.value = false
  }
}

const upload = useImageUpload({
  maxSize: 8 * 1024 * 1024,
  maxWidth: 1920,
  maxHeight: 960,
  formats: ['image/jpeg', 'image/png', 'image/gif'],
})

const currentCover = computed(() => coverImage || user?.coverImage || '')

watch(
  show,
  (visible) => {
    try {
      if (!visible) {
        upload.reset()
        return
      }
      upload.setPreview(currentCover.value)
    } catch (e) {
      // swallow watcher errors to prevent modal close from failing
    }
  },
  { immediate: true },
)

watch(currentCover, (next) => {
  if (!upload.file.value) upload.setPreview(next)
})

function handleUpload() {
  const fd = upload.toFormData('coverImage')
  if (!fd) {
    upload.error.value = 'Please select an image first.'
    return
  }
  save(fd)
}
</script>

<template>
  <div v-if="show" class="modal-backdrop modal-backdrop--top" @click.self="handleClose">
    <div class="modal-card cover-card">
      <header class="modal-header">
        <h2 class="modal-title">Edit cover image</h2>
        <button type="button" class="modal-close" aria-label="Close" @click="handleClose">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </header>

      <div
        class="cover-preview"
        :style="upload.preview.value ? { backgroundImage: `url(${upload.preview.value})` } : { background: DEFAULT_COVER }"
      >
        <label class="upload-overlay">
          <input type="file" accept="image/jpeg, image/png, image/gif" hidden @change="upload.selectFile" aria-label="Upload cover image">
          <div class="upload-overlay-content">
            <i class="fa-solid fa-camera" aria-hidden="true"></i>
            <span>Drop the file or click to choose cover image here</span>
          </div>
        </label>
      </div>

      <div class="modal-body">
        <div class="specs-list">
          <div class="spec-item">
            <span class="spec-label">Supported formats</span>
            <span class="spec-value">JPEG / PNG / GIF</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Maximum file size</span>
            <span class="spec-value">8MB</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Maximum resolution</span>
            <span class="spec-value">1920 x 960</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Recommended aspect ratio</span>
            <span class="spec-value">2:1</span>
          </div>
        </div>

        <div class="modal-info-box">
          <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
          <span>The uploaded image might be cropped depending on its aspect ratio and the device it's displayed on.</span>
        </div>

        <p class="guidelines-text">
          Please do not upload R18 images or works that violate the <a href="#">Guidelines</a>. If your cover image falls into any of those categories, the settings will be disabled.
        </p>

        <p v-if="upload.error.value" class="modal-error">{{ upload.error.value }}</p>

        <div class="modal-footer--row">
          <button type="button" class="action-pill" @click="handleClose">Cancel</button>
          <button type="button" class="action-pill action-pill--post" @click="handleUpload">
            Agree and upload
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../../assets/styles/modal.css';

.cover-card {
  width: min(400px, 100%);
  margin: auto;
}

.cover-preview {
  position: relative;
  width: 100%;
  height: 180px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.cover-preview:hover .upload-overlay {
  opacity: 1;
}

.specs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  font-size: 0.85rem;
}

.spec-item {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: flex-start;
  gap: 16px;
}

.spec-label {
  color: var(--brand);
  font-weight: 700;
}

.spec-value {
  color: var(--muted);
}

.guidelines-text {
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.5;
  margin: 0 0 24px 0;
}

.guidelines-text a {
  color: var(--accent, #0096fa);
  text-decoration: none;
}

.guidelines-text a:hover {
  text-decoration: underline;
}

.modal-footer--row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

@media (max-width: 640px) {
  .cover-preview {
    height: 140px;
  }
}
</style>
