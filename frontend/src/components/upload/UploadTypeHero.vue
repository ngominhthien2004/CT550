<script setup>
const props = defineProps({
  currentKind: {
    type: String,
    required: true,
  },
  currentMeta: {
    type: Object,
    required: true,
  },
  isMediaPage: {
    type: Boolean,
    default: false,
  },
  isNovel: {
    type: Boolean,
    default: false,
  },
  isUgoira: {
    type: Boolean,
    default: false,
  },
  mediaCount: {
    type: Number,
    default: 0,
  },
  coverCount: {
    type: Number,
    default: 0,
  },
  previewUrl: {
    type: String,
    default: '',
  },
  previewAlt: {
    type: String,
    default: 'Image preview',
  },
  aiWarning: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['media-change', 'cover-change'])

const mediaAccept = '.jpg,.jpeg,.png,.webp,.gif,image/*'

function handleMediaFilesChange(event) {
  emit('media-change', event)
}

function handleCoverFilesChange(event) {
  emit('cover-change', event)
}
</script>

<template>
  <header class="upload-hero">
    <h1 class="upload-title">Post {{ props.currentMeta.title }}</h1>
    <p class="upload-subtitle mb-0">{{ props.currentMeta.hero }}</p>

    <nav class="type-tabs" aria-label="Upload type tabs">
      <router-link to="/upload/illust" class="type-tab" :class="{ active: props.currentKind === 'illust' }">Illustrations</router-link>
      <router-link to="/upload/ugoira" class="type-tab" :class="{ active: props.currentKind === 'ugoira' }">Ugoira (animation)</router-link>
      <router-link to="/upload/manga" class="type-tab" :class="{ active: props.currentKind === 'manga' }">Manga</router-link>
      <router-link to="/upload/novel" class="type-tab" :class="{ active: props.currentKind === 'novel' }">Novels</router-link>
    </nav>

    <div v-if="props.isMediaPage" class="upload-dropzone">
      <label for="upload-media" class="form-label text-light mb-2">Upload image or GIF files</label>
      <input
        id="upload-media"
        type="file"
        class="form-control"
        accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
        multiple
        aria-describedby="upload-media-help"
        @change="handleMediaFilesChange"
      />
      <p id="upload-media-help" class="small text-light-emphasis mt-2 mb-0" aria-live="polite">{{ props.mediaCount }} file(s) selected</p>
    </div>

    <div v-if="props.isMediaPage && props.previewUrl" class="upload-preview">
      <img :src="props.previewUrl" :alt="props.previewAlt" class="preview-image" />
      <p v-if="props.aiWarning" class="ai-warning" role="alert">{{ props.aiWarning }}</p>
    </div>

    <div v-if="props.isNovel" class="cover-upload-row">
      <div class="cover-upload-input">
        <label for="upload-cover" class="form-label text-light mb-2">Cover image (required)</label>
        <input
          id="upload-cover"
          type="file"
          class="form-control"
        accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
          multiple
          aria-describedby="upload-cover-help"
          @change="handleCoverFilesChange"
        />
        <p id="upload-cover-help" class="small text-light-emphasis mt-2 mb-0" aria-live="polite">{{ props.coverCount }} cover file(s) selected</p>
      </div>
      <div class="cover-preview-box" role="img" :aria-label="props.previewUrl ? 'Cover preview' : 'Cover preview placeholder'">
        <img v-if="props.previewUrl" :src="props.previewUrl" :alt="props.previewAlt" class="cover-preview-image" />
        <span v-else>Cover Preview</span>
      </div>
    </div>
    <p v-if="props.isNovel && props.previewUrl && props.aiWarning" class="ai-warning ai-warning--spaced" role="alert">{{ props.aiWarning }}</p>
  </header>
</template>

<style scoped>
.upload-hero {
  background: linear-gradient(180deg, #1d2233 0%, #131822 100%);
  color: #eff4ff;
  border-radius: 0.9rem;
  padding: 1rem;
}

.upload-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.upload-subtitle {
  margin-top: 0.4rem;
  color: #cad6ef;
}

.type-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.85rem;
}

.type-tab {
  text-decoration: none;
  color: #cfd8ec;
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #334052;
  background: #1f2736;
  font-size: 0.88rem;
}

.type-tab.active {
  background: #3d7eff;
  border-color: #3d7eff;
  color: #fff;
}

.upload-dropzone {
  margin-top: 0.95rem;
  border: 1px dashed #475673;
  border-radius: 0.72rem;
  padding: 0.8rem;
  background: #1b2331;
}

.cover-upload-row {
  margin-top: 0.95rem;
  display: grid;
  gap: 0.8rem;
  grid-template-columns: 1.8fr 1fr;
}

.cover-preview-box {
  border: 1px dashed #4d5d7d;
  border-radius: 0.72rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cad6ef;
  background: #1b2331;
  padding: 0.35rem;
}

.upload-preview {
  margin-top: 0.85rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #324057;
  background: #1b2331;
  display: grid;
  gap: 0.6rem;
}

.preview-image {
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: 0.5rem;
  background: #0f1724;
}

.cover-preview-image {
  width: 100%;
  height: 100%;
  max-height: 160px;
  object-fit: cover;
  border-radius: 0.5rem;
}

.ai-warning {
  margin: 0;
  font-size: 0.85rem;
  color: #ffd67a;
}

.ai-warning--spaced {
  margin-top: 0.45rem;
}

@media (max-width: 767px) {
  .upload-hero {
    padding: 0.85rem;
  }

  .cover-upload-row {
    grid-template-columns: 1fr;
  }
}
</style>
