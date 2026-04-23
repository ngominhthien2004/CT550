<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import UploadTypeHero from '../components/upload/UploadTypeHero.vue'
import UploadTagSelector from '../components/upload/UploadTagSelector.vue'
import UploadContentDetails from '../components/upload/UploadContentDetails.vue'
import UploadPublicationSettings from '../components/upload/UploadPublicationSettings.vue'
import { navItems } from '../constants/navigation'
import { getTags } from '../services/api'
import { useArtworkStore } from '../stores/artwork.store'

const uploadKinds = ['illust', 'manga', 'ugoira', 'novel']
const mediaKinds = ['illust', 'manga', 'ugoira']

const kindMeta = {
  illust: {
    title: 'Illustrations',
    hero: 'Drop images or choose files to upload your illustration.',
  },
  manga: {
    title: 'Manga',
    hero: 'Upload manga pages in order and prepare your post details.',
  },
  ugoira: {
    title: 'Ugoira (animation)',
    hero: 'Upload animation source images and set playback-related notes.',
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

const form = reactive({
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
  ugoiraNotes: '',
  novelFormat: 'oneshot',
  novelSeriesName: '',
  images: [],
  coverImages: [],
})

const currentKind = computed(() => {
  const value = String(route.params.kind || 'illust')
  return uploadKinds.includes(value) ? value : 'illust'
})

const currentMeta = computed(() => kindMeta[currentKind.value])
const isNovel = computed(() => currentKind.value === 'novel')
const isManga = computed(() => currentKind.value === 'manga')
const isUgoira = computed(() => currentKind.value === 'ugoira')
const isMediaPage = computed(() => mediaKinds.includes(currentKind.value))

const titleMax = computed(() => (isNovel.value ? 100 : 32))
const titleCount = computed(() => form.title.length)
const captionCount = computed(() => form.caption.length)
const novelTextCount = computed(() => form.novelText.length)
const tagsCount = computed(() => form.tags.length)

function toggleLeftNav() {
  isNavCollapsed.value = !isNavCollapsed.value
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
  form.title = ''
  form.caption = ''
  form.novelText = ''
  form.tags = []
  form.tagInput = ''
  form.allowTagEdit = true
  form.ageRating = 'all'
  form.aiGenerated = 'no'
  form.openTo = 'public'
  form.comments = 'on'
  form.allowCollections = true
  form.isOriginalWork = false
  form.language = 'English'
  form.scheduleEnabled = false
  form.scheduleDate = ''
  form.scheduleTime = ''
  form.mangaSeriesName = ''
  form.ugoiraNotes = ''
  form.novelFormat = 'oneshot'
  form.novelSeriesName = ''
  form.images = []
  form.coverImages = []
  resetTagSuggestionState()
}

function handleMediaFilesChange(event) {
  form.images = Array.from(event.target.files || [])
}

function handleCoverFilesChange(event) {
  form.coverImages = Array.from(event.target.files || [])
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
    })

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
        :media-count="form.images.length"
        :cover-count="form.coverImages.length"
        @media-change="handleMediaFilesChange"
        @cover-change="handleCoverFilesChange"
      />

      <form class="d-grid gap-3 mt-3" @submit.prevent="submitArtwork" novalidate>
        <UploadContentDetails
          :form="form"
          :is-manga="isManga"
          :is-ugoira="isUgoira"
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

        <UploadPublicationSettings :form="form" :is-novel="isNovel" :language-options="languageOptions" />

        <div v-if="localError || artworkStore.createError" class="alert alert-danger mb-0" role="alert" aria-live="assertive">
          {{ localError || artworkStore.createError }}
        </div>

        <div v-if="isNovel" class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-outline-secondary" :disabled="artworkStore.createLoading" @click="handleDraftClick">Save draft</button>
          <button type="button" class="btn btn-outline-secondary" :disabled="artworkStore.createLoading" @click="handlePreviewClick">Preview</button>
          <button type="submit" class="btn btn-primary" :disabled="artworkStore.createLoading" :aria-busy="artworkStore.createLoading">
            {{ artworkStore.createLoading ? 'Posting...' : 'Post' }}
          </button>
        </div>

        <div v-else class="d-flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary" :disabled="artworkStore.createLoading" :aria-busy="artworkStore.createLoading">
            {{ artworkStore.createLoading ? 'Posting...' : 'Post' }}
          </button>
          <button type="button" class="btn btn-outline-secondary" :disabled="artworkStore.createLoading" @click="resetForm">Reset</button>
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
