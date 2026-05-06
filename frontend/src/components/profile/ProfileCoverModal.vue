<script setup>
import { computed, ref, watch } from 'vue'

const DEFAULT_COVER = 'linear-gradient(135deg, #f1f5f9 0%, #dbeafe 52%, #fef3c7 100%)'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: () => ({}),
  },
  coverImage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'save'])

const coverPreview = ref('')
const selectedFile = ref(null)
const errorMessage = ref('')
const currentCover = computed(() => props.coverImage || props.user?.coverImage || '')

watch(
  () => props.show,
  (visible) => {
    if (!visible) {
      coverPreview.value = ''
      selectedFile.value = null
      errorMessage.value = ''
      return
    }
    coverPreview.value = currentCover.value
  },
  { immediate: true },
)

watch(currentCover, (nextCover) => {
  if (!selectedFile.value) {
    coverPreview.value = nextCover
  }
})

function handleCoverChange(event) {
  const file = event.target.files?.[0]
  if (!file) {
    return
  }

  errorMessage.value = ''

  // Validate format
  const validFormats = ['image/jpeg', 'image/png', 'image/gif']
  if (!validFormats.includes(file.type)) {
    errorMessage.value = 'Invalid format. Please upload JPEG, PNG, or GIF.'
    return
  }

  // Validate size (8MB)
  if (file.size > 8 * 1024 * 1024) {
    errorMessage.value = 'File size exceeds 8MB.'
    return
  }

  // Validate resolution (4096 x 4096)
  const img = new Image()
  img.onload = () => {
    if (img.width > 4096 || img.height > 4096) {
      errorMessage.value = `Resolution exceeds maximum allowed (4096 x 4096). Yours is ${img.width}x${img.height}.`
      URL.revokeObjectURL(img.src)
      return
    }

    coverPreview.value = img.src
    selectedFile.value = file
  }
  img.onerror = () => {
    errorMessage.value = 'Failed to read image file.'
    URL.revokeObjectURL(img.src)
  }
  img.src = URL.createObjectURL(file)
}

function handleUpload() {
  if (!selectedFile.value) {
    errorMessage.value = 'Please select an image first.'
    return
  }

  const formData = new FormData()
  formData.append('coverImage', selectedFile.value)
  emit('save', formData)
}
</script>

<template>
  <div v-if="show" class="cover-modal-backdrop" @click.self="emit('close')">
    <div class="cover-modal-card">
      <header class="cover-modal-header">
        <h2 class="cover-modal-title">Edit cover image</h2>
        <button type="button" class="cover-modal-close" aria-label="Close" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </header>

      <div
        class="cover-preview"
        :style="coverPreview ? { backgroundImage: `url(${coverPreview})` } : { background: DEFAULT_COVER }"
      >
        <label class="cover-upload-overlay">
          <input type="file" accept="image/jpeg, image/png, image/gif" hidden @change="handleCoverChange">
          <div class="overlay-content">
            <i class="fa-solid fa-camera" aria-hidden="true"></i>
            <span>Drop the file or click to choose cover image here</span>
          </div>
        </label>
      </div>

      <div class="cover-modal-body">
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
            <span class="spec-value">4096 x 4096</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Recommended aspect ratio</span>
            <span class="spec-value">2:1</span>
          </div>
        </div>

        <div class="info-box">
          <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
          <span>The uploaded image might be cropped depending on its aspect ratio and the device it's displayed on.</span>
        </div>

        <p class="guidelines-text">
          Please do not upload R18 images or works that violate the <a href="#">Guidelines</a>. If your cover image falls into any of those categories, the settings will be disabled.
        </p>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <button type="button" class="upload-btn" @click="handleUpload">
          Agree and upload
        </button>
        
        <button type="button" class="cancel-btn" @click="emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cover-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px;
  background: rgba(0, 0, 0, 0.4);
  overflow-y: auto;
}

.cover-modal-card {
  width: min(400px, 100%);
  margin: auto;
  background: #fff;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.cover-modal-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  flex-shrink: 0;
}

.cover-modal-title {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.cover-modal-close {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #999;
  font-size: 1.15rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.2s, color 0.2s;
}

.cover-modal-close:hover {
  background: #f1f5f9;
  color: #333;
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

.cover-upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.cover-preview:hover .cover-upload-overlay {
  opacity: 1;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  font-weight: 700;
  text-align: center;
}

.overlay-content i {
  font-size: 1.5rem;
}

.cover-modal-body {
  padding: 24px;
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

.info-box {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  color: #666;
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 24px;
}

.info-box i {
  margin-top: 2px;
  color: #999;
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

.upload-btn {
  display: block;
  width: 100%;
  padding: 12px;
  background: #a3d4f7;
  color: #fff;
  font-weight: 700;
  text-align: center;
  border-radius: 999px;
  cursor: pointer;
  margin-bottom: 12px;
  transition: background 0.2s;
  box-sizing: border-box;
}

.upload-btn:hover {
  background: #89cbf5;
}

.error-msg {
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-align: center;
}

.cancel-btn {
  display: block;
  width: 100%;
  padding: 12px;
  background: #f1f5f9;
  color: #333;
  font-weight: 700;
  text-align: center;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: #e2e8f0;
}

@media (max-width: 640px) {
  .cover-modal-backdrop {
    padding: 16px;
  }
  
  .cover-preview {
    height: 140px;
  }
}
</style>