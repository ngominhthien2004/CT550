<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { UploadTypeHero, UploadTagSelector, UploadContentDetails, UploadPublicationSettings } from '@/components/upload'
import { navItems } from '../constants/navigation'
import api, { getTags } from '../services/api'
import { useArtworkStore } from '../stores/artwork.store'
import { getApiErrorMessage } from '../utils/apiErrors'
import { toggleNavCollapsed } from '../utils/viewNavigation'

const uploadKinds = ['illust', 'manga', 'gif', 'novel']
const mediaKinds = ['illust', 'manga', 'gif']
const maxArtworkImages = 50

const kindMeta = {
  illust: {
    title: 'Illustrations',
    hero: 'Drop images or choose files to upload your illustration.',
  },
  manga: {
    title: 'Manga',
    hero: 'Upload manga pages in order and prepare your post details.',
  },
  gif: {
    title: 'GIF (animation)',
    hero: 'Upload a GIF animation or multiple image files for your artwork.',
  },
  novel: {
    title: 'Novels',
    hero: 'Prepare your novel content, settings, and cover before posting.',
  },
}

const languageOptions = ['English', 'Japanese', 'Vietnamese', 'Korean', 'Chinese', 'Other']

const route = useRoute()
const router = useRouter()
const artworkStore = useArtworkStore()
const isNavCollapsed = ref(true)
const localError = ref('')
const tagSuggestions = ref([])
const tagSuggestionLoading = ref(false)
let tagSuggestionTimer = null
const previewUrl = ref('')
const mediaPreviewItems = ref([])
const coverPreviewItems = ref([])
const aiDetection = ref(null)
const aiDetectionError = ref('')
const aiDetectionLoading = ref(false)
const detectRequestId = ref(0)
const defaultAiThreshold = 70

const createDefaultForm = () => ({
  title: '',
  caption: '',
  novelText: '',
  tags: [],
  tagInput: '',
  allowTagEdit: true,
  ageRating: 'all',
  aiGenerated: 'no',
  openTo: 'public',
  comments: 'on',
  allowCollections: true,
  isOriginalWork: false,
  language: 'English',
  scheduleEnabled: false,
  scheduleDate: '',
  scheduleTime: '',
  mangaSeriesName: '',
  gifNotes: '',
  novelFormat: 'oneshot',
  novelSeriesName: '',
  images: [],
  coverImages: [],
})

const form = reactive(createDefaultForm())

const currentKind = computed(() => {
  const value = String(route.params.kind || 'illust')
  return uploadKinds.includes(value) ? value : 'illust'
})

const currentMeta = computed(() => kindMeta[currentKind.value])
const isNovel = computed(() => currentKind.value === 'novel')
const isManga = computed(() => currentKind.value === 'manga')
const isGif = computed(() => currentKind.value === 'gif')
const isMediaPage = computed(() => mediaKinds.includes(currentKind.value))

const titleMax = computed(() => (isNovel.value ? 100 : 32))
const titleCount = computed(() => form.title.length)
const captionCount = computed(() => form.caption.length)
const novelTextCount = computed(() => form.novelText.length)
const tagsCount = computed(() => form.tags.length)
const aiThreshold = computed(() => {
  const value = Number(aiDetection.value?.threshold)
  return Number.isFinite(value) ? value : defaultAiThreshold
})
const showAiWarning = computed(() => {
  const confidence = Number(aiDetection.value?.confidence)
  if (!Number.isFinite(confidence)) return false
  return aiDetection.value?.isAI === true && confidence >= aiThreshold.value
})
const aiWarningMessage = computed(() =>
  showAiWarning.value
    ? 'Chúng tôi đã bật "Yes" trong mục "AI-generated work" nếu bạn cho là nhầm lẫn có thể tắt thủ công'
    : '',
)

watch(showAiWarning, (newValue) => {
  if (newValue) {
    form.aiGenerated = 'yes'
  }
})

function toggleLeftNav() {
  toggleNavCollapsed(isNavCollapsed)
}

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

function resetForm() {
  Object.assign(form, createDefaultForm())
  resetPreviewState()
  clearPreviewItems(mediaPreviewItems)
  clearPreviewItems(coverPreviewItems)
  resetTagSuggestionState()
}

function handleFilesChange(targetKey, event) {
  const files = Array.from(event.target.files || [])
  if (files.length > maxArtworkImages) {
    localError.value = `You can upload up to ${maxArtworkImages} images in one artwork.`
    event.target.value = ''
    return
  }

  localError.value = ''
  form[targetKey] = files
  setPreviewItems(targetKey, files)
  handlePrimaryFileChange(files[0])
}

function clearPreviewItems(itemsRef) {
  itemsRef.value.forEach((item) => {
    if (item.url?.startsWith('blob:')) {
      URL.revokeObjectURL(item.url)
    }
  })
  itemsRef.value = []
}

function setPreviewItems(targetKey, files) {
  const itemsRef = targetKey === 'coverImages' ? coverPreviewItems : mediaPreviewItems
  clearPreviewItems(itemsRef)
  itemsRef.value = files.map((file, index) => ({
    id: `${file.name}-${file.lastModified}-${index}`,
    name: file.name,
    url: URL.createObjectURL(file),
  }))
}

function resetPreviewState() {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = ''
  aiDetection.value = null
  aiDetectionError.value = ''
  aiDetectionLoading.value = false
  detectRequestId.value += 1
}

function handlePrimaryFileChange(file) {
  resetPreviewState()
  if (!file) {
    return
  }
  previewUrl.value = URL.createObjectURL(file)
  runAiDetection(file)
}

async function runAiDetection(file) {
  const requestId = (detectRequestId.value += 1)
  aiDetectionLoading.value = true
  aiDetectionError.value = ''
  aiDetection.value = null

  try {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.post('/ai/detect-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    if (requestId !== detectRequestId.value) return
    const payload = data?.data ?? data
    aiDetection.value = {
      ...payload,
      isAI: Boolean(payload?.isAI),
      confidence: Number(payload?.confidence),
      threshold: Number(payload?.threshold),
    }
  } catch (error) {
    if (requestId !== detectRequestId.value) return
    aiDetectionError.value = getApiErrorMessage(error, 'Failed to analyze image.')
    aiDetection.value = null
  } finally {
    if (requestId === detectRequestId.value) {
      aiDetectionLoading.value = false
    }
  }
}

function extractCanonicalTag(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value.name) return value.name
  return ''
}

function commitTag(tagValue, clearInput = true) {
  const normalizedTag = normalizeTagName(tagValue)

  if (!normalizedTag) {
    return
  }

  if (form.tags.includes(normalizedTag)) {
    if (clearInput) {
      form.tagInput = ''
    }
    resetTagSuggestionState()
    return
  }

  if (form.tags.length >= 10) {
    localError.value = 'You can use up to 10 tags.'
    return
  }

  form.tags.push(normalizedTag)
  localError.value = ''

  if (clearInput) {
    form.tagInput = ''
  }

  resetTagSuggestionState()
}

function addTagFromInput() {
  const candidates = String(form.tagInput || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (candidates.length === 0) {
    return
  }

  candidates.forEach((candidate) => {
    commitTag(candidate, false)
  })

  form.tagInput = ''
  resetTagSuggestionState()
}

function handleTagInputKeydown(event) {
  if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
    event.preventDefault()
    commitTag(form.tagInput)
  }
}

function removeTag(index) {
  form.tags.splice(index, 1)
}

function handleSelectSuggestion(suggestion) {
  commitTag(suggestion)
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

    tagSuggestions.value = Array.from(uniqueByName.values()).filter((item) => !form.tags.includes(item.name))
  } catch (_error) {
    tagSuggestions.value = []
  } finally {
    tagSuggestionLoading.value = false
  }
}

function validateForm() {
  if (!form.title.trim()) {
    return 'Title is required.'
  }

  if (isNovel.value && !form.novelText.trim()) {
    return 'Main novel text is required for novel posts.'
  }

  if (!Array.isArray(form.tags) || form.tags.length > 10) {
    return 'You can use up to 10 tags.'
  }

  if (!form.ageRating) {
    return 'Visible to setting is required.'
  }

  if (form.scheduleEnabled && (!form.scheduleDate || !form.scheduleTime)) {
    return 'Scheduled post requires both date and time.'
  }

  if (isNovel.value && form.coverImages.length < 1) {
    return 'Please upload at least one cover image for novels.'
  }

  if (!isNovel.value && form.images.length < 1) {
    return 'Please upload at least one image file.'
  }

  if (!isNovel.value && form.images.length > maxArtworkImages) {
    return `You can upload up to ${maxArtworkImages} images in one artwork.`
  }

  return ''
}

function handleDraftClick() {
  localError.value = 'Draft saving is not available yet. Use Post when ready.'
}

function handlePreviewClick() {
  localError.value = 'Preview is not available yet. Please review in the form before posting.'
}

async function submitArtwork() {
  localError.value = ''

  const validationError = validateForm()
  if (validationError) {
    localError.value = validationError
    return
  }

  const description = isNovel.value ? form.novelText.trim() : form.caption.trim()

  try {
    const createdArtwork = await artworkStore.submitArtwork({
      title: form.title.trim(),
      description,
      type: currentKind.value,
      ageRating: form.ageRating,
      tags: form.tags,
      images: isNovel.value ? form.coverImages : form.images,
      gifNotes: isGif.value ? form.gifNotes : undefined,
      novelContent: isNovel.value ? form.novelText.trim() : undefined,
      novelFormat: isNovel.value ? form.novelFormat : undefined,
      novelSeriesName: isNovel.value ? form.novelSeriesName : undefined,
    })

    const responseAiDetection = createdArtwork?.aiDetection
    const canonicalTag = extractCanonicalTag(responseAiDetection?.canonicalTag)
    if (responseAiDetection?.tagged && canonicalTag) {
      commitTag(canonicalTag, false)
    }

    const createdArtworkId = createdArtwork?._id || createdArtwork?.id
    if (createdArtworkId) {
      await router.push(`/artworks/${createdArtworkId}`)
      return
    }

    resetForm()
  } catch (_error) {
    // Store state already contains backend error details.
  }
}

watch(
  () => route.params.kind,
  (kind) => {
    if (!uploadKinds.includes(String(kind || ''))) {
      router.replace('/upload/illust')
      return
    }

    localError.value = ''
    artworkStore.resetCreateState()
    resetForm()
  },
  { immediate: true },
)

watch(
  () => form.tagInput,
  (value) => {
    const keyword = normalizeTagName(value).replace(/_/g, ' ')

    clearTagSuggestionTimer()

    if (!keyword) {
      tagSuggestions.value = []
      tagSuggestionLoading.value = false
      return
    }

    tagSuggestionTimer = setTimeout(() => {
      fetchTagSuggestions(keyword)
    }, 180)
  },
)

onMounted(() => {
  artworkStore.resetCreateState()
})

onBeforeUnmount(() => {
  artworkStore.resetCreateState()
  resetTagSuggestionState()
  resetPreviewState()
  clearPreviewItems(mediaPreviewItems)
  clearPreviewItems(coverPreviewItems)
})
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="upload-page page-block p-3 p-md-4">
      <UploadTypeHero
        :current-kind="currentKind"
        :current-meta="currentMeta"
        :is-media-page="isMediaPage"
        :is-novel="isNovel"
        :is-gif="isGif"
        :media-count="form.images.length"
        :cover-count="form.coverImages.length"
        :max-media-files="maxArtworkImages"
        :media-previews="mediaPreviewItems"
        :cover-previews="coverPreviewItems"
        :preview-url="previewUrl"
        :preview-alt="form.title ? `Preview for ${form.title}` : 'Artwork preview'"
        :ai-warning="aiWarningMessage"
        @media-change="handleFilesChange('images', $event)"
        @cover-change="handleFilesChange('coverImages', $event)"
      />

      <form class="d-grid gap-3 mt-3" @submit.prevent="submitArtwork" novalidate>
        <UploadContentDetails
          :form="form"
          :is-manga="isManga"
          :is-gif="isGif"
          :is-novel="isNovel"
          :title-max="titleMax"
          :title-count="titleCount"
          :caption-count="captionCount"
          :novel-text-count="novelTextCount"
        />

        <UploadTagSelector
          :tags="form.tags"
          :tag-input="form.tagInput"
          :allow-tag-edit="form.allowTagEdit"
          :tags-count="tagsCount"
          :suggestions="tagSuggestions"
          :suggestion-loading="tagSuggestionLoading"
          @update:tag-input="form.tagInput = $event"
          @update:allow-tag-edit="form.allowTagEdit = $event"
          @input-keydown="handleTagInputKeydown"
          @add-tag="addTagFromInput"
          @remove-tag="removeTag"
          @select-suggestion="handleSelectSuggestion"
        />

        <UploadPublicationSettings
          :form="form"
          :is-novel="isNovel"
          :language-options="languageOptions"
          :show-ai-warning="showAiWarning"
        />

        <div v-if="localError || artworkStore.createError" class="alert alert-danger mb-0" role="alert" aria-live="assertive">
          {{ localError || artworkStore.createError }}
        </div>

        <div class="d-flex flex-wrap gap-2">
          <template v-if="isNovel">
            <button type="button" class="btn btn-outline-secondary action-pill action-pill--post" :disabled="artworkStore.createLoading" @click="handleDraftClick">Save draft</button>
            <button type="button" class="btn btn-outline-secondary action-pill action-pill--post" :disabled="artworkStore.createLoading" @click="handlePreviewClick">Preview</button>
          </template>
          <button type="submit" class="btn btn-primary action-pill action-pill--post" :disabled="artworkStore.createLoading" :aria-busy="artworkStore.createLoading">
            {{ artworkStore.createLoading ? 'Posting...' : 'Post' }}
          </button>
          <button v-if="!isNovel" type="button" class="btn btn-outline-secondary action-pill action-pill--post" :disabled="artworkStore.createLoading" @click="resetForm">Reset</button>
        </div>
      </form>
    </section>
  </MainLayoutTemplate>
</template>

<style scoped>
.upload-page {
  max-width: 1040px;
  margin: 0 auto;
}

.settings-card {
  border: 1px solid #dbe2ec;
  border-radius: 0.75rem;
  padding: 0.9rem;
  background: #fff;
}

.counter {
  color: #6b7280;
  font-size: 0.84rem;
}

@media (max-width: 767px) {
  .settings-card {
    padding: 0.8rem;
  }
}
</style>
