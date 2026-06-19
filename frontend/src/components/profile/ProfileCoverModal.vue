<script setup>
import { computed, watch } from 'vue'
import { useImageUpload } from '@/composables/useImageUpload'

const DEFAULT_COVER = 'linear-gradient(135deg, #f1f5f9 0%, #dbeafe 52%, #fef3c7 100%)'

const props = defineProps({
  show: { type: Boolean, default: false },
  user: { type: Object, default: () => ({}) },
  coverImage: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save'])

const upload = useImageUpload({
  maxSize: 8 * 1024 * 1024,
  maxWidth: 1920,
  maxHeight: 960,
  formats: ['image/jpeg', 'image/png', 'image/gif'],
})

const currentCover = computed(() => props.coverImage || props.user?.coverImage || '')

watch(
  () => props.show,
  (visible) => {
    if (!visible) {
      upload.reset()
      return
    }
    upload.setPreview(currentCover.value)
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
  emit('save', fd)
}
</script>

<template>
  <div v-if="show" class="modal-backdrop modal-backdrop--top" @click.self="emit('close')" @keydown.enter.prevent="emit('close')" @keydown.space.prevent="emit('close')" tabindex="0" role="button">
    <div class="modal-card cover-card">
      <header class="modal-header">
        <h2 class="modal-title">Edit cover image</h2>
        <button type="button" class="modal-close" aria-label="Close" @click="emit('close')">
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

        <button type="button" class="modal-btn modal-btn--primary" @click="handleUpload">
          Agree and upload
        </button>
        
        <button type="button" class="modal-btn modal-btn--secondary" @click="emit('close')">Cancel</button>
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
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
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
  color: #000;
  font-weight: 700;
}

.spec-value {
  color: #666;
}

.guidelines-text {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
  margin: 0 0 24px 0;
}

.guidelines-text a {
  color: #0096fa;
  text-decoration: none;
}

.guidelines-text a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .cover-preview {
    height: 140px;
  }
}
</style>
