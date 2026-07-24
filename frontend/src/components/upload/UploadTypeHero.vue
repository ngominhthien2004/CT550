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
  isGif: {
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
  maxMediaFiles: {
    type: Number,
    default: 50,
  },
  mediaPreviews: {
    type: Array,
    default: () => [],
  },
  coverPreviews: {
    type: Array,
    default: () => [],
  },
  previewUrl: {
    type: String,
    default: '',
  },
  previewAlt: {
    type: String,
    default: 'Image preview',
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
    <h1 class="upload-title">{{ $t('upload.pageTitle') }} {{ props.currentMeta.title }}</h1>
    <p class="upload-subtitle mb-0">{{ props.currentMeta.hero }}</p>

    <nav class="type-tabs" :aria-label="$t('upload.pageTitle')">
      <router-link to="/upload/illust" class="type-tab" :class="{ active: props.currentKind === 'illust' }">{{ $t('nav.illustrations') }}</router-link>
      <router-link to="/upload/manga" class="type-tab" :class="{ active: props.currentKind === 'manga' }">{{ $t('nav.manga') }}</router-link>
      <router-link to="/upload/gif" class="type-tab" :class="{ active: props.currentKind === 'gif' }">{{ $t('nav.gif') }}</router-link>
      <router-link to="/upload/novel" class="type-tab" :class="{ active: props.currentKind === 'novel' }">{{ $t('nav.novels') }}</router-link>
    </nav>

    <div v-if="props.isMediaPage" class="upload-dropzone">
      <label for="upload-media" class="form-label text-light mb-2">{{ $t('upload.uploadImagesGif') }}</label>
      <input
        id="upload-media"
        type="file"
        class="form-control"
        accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
        multiple
        aria-describedby="upload-media-help"
        @change="handleMediaFilesChange"
        aria-label="Upload media files"
      />
      <p id="upload-media-help" class="small text-light-emphasis mt-2 mb-0" aria-live="polite">
        {{ $t('upload.mediaCount', { count: props.mediaCount, max: props.maxMediaFiles }) }}
      </p>
    </div>

    <div v-if="props.isMediaPage && props.mediaPreviews.length" class="upload-preview">
      <div class="preview-heading">
        <span>{{ $t('upload.artworkPages') }}</span>
        <strong>{{ props.mediaPreviews.length }}</strong>
      </div>
      <div class="page-preview-grid" aria-label="Selected artwork pages">
        <figure v-for="(item, index) in props.mediaPreviews" :key="item.id || `${item.name}-${index}`" class="page-preview-card">
          <img :src="item.url" :alt="`Selected page ${index + 1}: ${item.name}`" class="preview-image" />
          <figcaption>
            <span>{{ index + 1 }}</span>
            <p>{{ item.name }}</p>
          </figcaption>
        </figure>
      </div>
    </div>

    <div v-if="props.isNovel" class="cover-upload-row">
      <div class="cover-upload-input">
        <label for="upload-cover" class="form-label text-light mb-2">{{ $t('upload.uploadCover') }}</label>
        <input
          id="upload-cover"
          type="file"
          class="form-control"
          accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
          multiple
          aria-describedby="upload-cover-help"
          @change="handleCoverFilesChange"
          aria-label="Upload cover image"
        />
        <p id="upload-cover-help" class="small text-light-emphasis mt-2 mb-0" aria-live="polite">{{ $t('upload.fileCount', { count: props.coverCount }) }}</p>
      </div>
      <div class="cover-preview-box" role="img" :aria-label="props.previewUrl ? $t('upload.coverPreview') : $t('upload.coverPreviewPlaceholder')">
        <img v-if="props.previewUrl" :src="props.previewUrl" :alt="props.previewAlt" class="cover-preview-image" />
        <span v-else>{{ $t('upload.coverPreview') }}</span>
      </div>
    </div>
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

.preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: #eff4ff;
  font-weight: 700;
}

.preview-heading strong {
  min-width: 2rem;
  height: 1.5rem;
  border-radius: 999px;
  background: #3d7eff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
}

.page-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 0.6rem;
}

.page-preview-card {
  margin: 0;
  min-width: 0;
  border: 1px solid #334052;
  border-radius: 0.55rem;
  overflow: hidden;
  background: #0f1724;
}

.preview-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  background: #0f1724;
}

.page-preview-card figcaption {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem;
  color: #cad6ef;
  font-size: 0.76rem;
}

.page-preview-card figcaption span {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 999px;
  background: #263246;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
}

.page-preview-card figcaption p {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-preview-image {
  width: 100%;
  max-height: 160px;
  object-fit: contain;
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
