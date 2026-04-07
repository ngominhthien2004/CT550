<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayoutTemplate from '../components/layout/MainLayoutTemplate.vue'
import { navItems } from '../constants/navigation'
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
}

function handleMediaFilesChange(event) {
  form.images = Array.from(event.target.files || [])
}

function handleCoverFilesChange(event) {
  form.coverImages = Array.from(event.target.files || [])
}

function addTagFromInput() {
  const tags = String(form.tagInput || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (tags.length === 0) {
    return
  }

  tags.forEach((tag) => {
    if (form.tags.length < 10 && !form.tags.includes(tag)) {
      form.tags.push(tag)
    }
  })

  form.tagInput = ''
}

function handleTagInputKeydown(event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTagFromInput()
  }
}

function removeTag(index) {
  form.tags.splice(index, 1)
}

function validateForm() {
  if (!form.title.trim()) {
    return 'Title is required.'
  }

  if (!isNovel.value && !form.caption.trim()) {
    return 'Caption is required for image posts.'
  }

  if (isNovel.value && !form.novelText.trim() && !form.caption.trim()) {
    return 'Add novel text or a fallback caption.'
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

  const description = isNovel.value ? form.novelText.trim() || form.caption.trim() : form.caption.trim()

  try {
    await artworkStore.submitArtwork({
      title: form.title.trim(),
      description,
      type: currentKind.value,
      ageRating: form.ageRating,
      tags: form.tags,
      images: isNovel.value ? form.coverImages : form.images,
    })
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

onMounted(() => {
  artworkStore.resetCreateState()
})

onBeforeUnmount(() => {
  artworkStore.resetCreateState()
})
</script>

<template>
  <MainLayoutTemplate :nav-items="navItems" :is-nav-collapsed="isNavCollapsed" site-name="IlluWrl" @toggle-sidebar="toggleLeftNav">
    <section class="upload-page page-block p-3 p-md-4">
      <header class="upload-hero">
        <h1 class="upload-title">Post {{ currentMeta.title }}</h1>
        <p class="upload-subtitle mb-0">{{ currentMeta.hero }}</p>

        <nav class="type-tabs" aria-label="Upload type tabs">
          <router-link to="/upload/illust" class="type-tab" :class="{ active: currentKind === 'illust' }">Illustrations</router-link>
          <router-link to="/upload/ugoira" class="type-tab" :class="{ active: currentKind === 'ugoira' }">Ugoira (animation)</router-link>
          <router-link to="/upload/manga" class="type-tab" :class="{ active: currentKind === 'manga' }">Manga</router-link>
          <router-link to="/upload/novel" class="type-tab" :class="{ active: currentKind === 'novel' }">Novels</router-link>
        </nav>

        <div v-if="isMediaPage" class="upload-dropzone">
          <label for="upload-media" class="form-label text-light mb-2">Upload image files</label>
          <input
            id="upload-media"
            type="file"
            class="form-control"
            accept=".jpg,.jpeg,.png,.webp,image/*"
            multiple
            aria-describedby="upload-media-help"
            @change="handleMediaFilesChange"
          />
          <p id="upload-media-help" class="small text-light-emphasis mt-2 mb-0" aria-live="polite">{{ form.images.length }} file(s) selected</p>
        </div>

        <div v-if="isNovel" class="cover-upload-row">
          <div class="cover-upload-input">
            <label for="upload-cover" class="form-label text-light mb-2">Cover image (required)</label>
            <input
              id="upload-cover"
              type="file"
              class="form-control"
              accept=".jpg,.jpeg,.png,.webp,image/*"
              multiple
              aria-describedby="upload-cover-help"
              @change="handleCoverFilesChange"
            />
            <p id="upload-cover-help" class="small text-light-emphasis mt-2 mb-0" aria-live="polite">{{ form.coverImages.length }} cover file(s) selected</p>
          </div>
          <div class="cover-preview-box" role="img" aria-label="Cover preview placeholder">Cover Preview</div>
        </div>
      </header>

      <form class="d-grid gap-3 mt-3" @submit.prevent="submitArtwork" novalidate>
        <div v-if="isManga" class="settings-card">
          <div class="d-flex flex-column flex-md-row gap-2 align-items-md-center justify-content-between">
            <div>
              <strong>Series</strong>
              <p class="text-secondary mb-0 small">Link this manga post to an existing series or create one.</p>
            </div>
            <div class="d-flex gap-2 w-100 w-md-auto">
              <input v-model="form.mangaSeriesName" type="text" class="form-control" placeholder="Series name" />
              <button type="button" class="btn btn-outline-secondary">Create series</button>
            </div>
          </div>
        </div>

        <div v-if="isUgoira" class="settings-card">
          <strong>Ugoira upload steps</strong>
          <div class="chips-row mt-2" aria-label="Ugoira upload steps">
            <span class="step-chip active">1. Upload frames</span>
            <span class="step-chip">2. Verify order</span>
            <span class="step-chip">3. Confirm settings</span>
          </div>
          <label for="ugoira-notes" class="form-label mt-3">Extra notes</label>
          <textarea id="ugoira-notes" v-model="form.ugoiraNotes" class="form-control" rows="3" placeholder="Playback notes, frame timing notes, or loop info."></textarea>
          <ul class="small text-secondary mt-2 mb-0 ps-3">
            <li>Use sequential names for files for safer frame ordering.</li>
            <li>Keep source frames in a single ratio for smoother playback.</li>
            <li>Large uploads can take longer to process after posting.</li>
          </ul>
        </div>

        <div class="settings-card">
          <div class="d-flex justify-content-between align-items-center gap-2">
            <label for="upload-title" class="form-label mb-0">Title</label>
            <span class="counter">{{ titleCount }}/{{ titleMax }}</span>
          </div>
          <input id="upload-title" v-model="form.title" type="text" class="form-control" :maxlength="titleMax" required aria-required="true" />
        </div>

        <div v-if="isNovel" class="settings-card">
          <strong>Posting format</strong>
          <div class="d-flex flex-wrap gap-3 mt-2" role="radiogroup" aria-label="Novel posting format">
            <label class="form-check">
              <input v-model="form.novelFormat" class="form-check-input" type="radio" name="novelFormat" value="series" />
              <span class="form-check-label">Series</span>
            </label>
            <label class="form-check">
              <input v-model="form.novelFormat" class="form-check-input" type="radio" name="novelFormat" value="oneshot" />
              <span class="form-check-label">One-shot</span>
            </label>
          </div>
          <div class="d-flex flex-column flex-md-row gap-2 mt-3">
            <input v-model="form.novelSeriesName" type="text" class="form-control" placeholder="Series name" />
            <button type="button" class="btn btn-outline-secondary">Create series</button>
          </div>
        </div>

        <div v-if="isNovel" class="settings-card">
          <div class="d-flex justify-content-between align-items-center gap-2">
            <label for="upload-novel-text" class="form-label mb-0">Main novel text</label>
            <span class="counter">{{ novelTextCount }}/300000</span>
          </div>
          <textarea id="upload-novel-text" v-model="form.novelText" class="form-control" rows="10" maxlength="300000" placeholder="Write your novel here."></textarea>
        </div>

        <div class="settings-card">
          <div class="d-flex justify-content-between align-items-center gap-2">
            <label for="upload-caption" class="form-label mb-0">{{ isNovel ? 'Caption (optional)' : 'Caption / Description' }}</label>
            <span class="counter">{{ captionCount }}/3000</span>
          </div>
          <textarea id="upload-caption" v-model="form.caption" class="form-control" rows="4" maxlength="3000"></textarea>
        </div>

        <div class="settings-card">
          <div class="d-flex justify-content-between align-items-center gap-2">
            <label for="upload-tags" class="form-label mb-0">Tags</label>
            <span class="counter">{{ tagsCount }}/10</span>
          </div>
          <div class="d-flex gap-2">
            <input
              id="upload-tags"
              v-model="form.tagInput"
              type="text"
              class="form-control"
              placeholder="Type a tag and press Enter"
              :disabled="!form.allowTagEdit"
              @keydown="handleTagInputKeydown"
            />
            <button type="button" class="btn btn-outline-secondary" :disabled="!form.allowTagEdit" @click="addTagFromInput">Add</button>
          </div>
          <p class="small text-secondary mt-2 mb-2">Recommended tags: original, fanart, portrait, character, background.</p>
          <div class="tag-list">
            <button v-for="(tag, index) in form.tags" :key="`${tag}-${index}`" type="button" class="tag-pill" :aria-label="`Remove tag ${tag}`" @click="removeTag(index)">
              #{{ tag }}
              <span aria-hidden="true">x</span>
            </button>
          </div>
          <label class="form-check mt-3 mb-0">
            <input v-model="form.allowTagEdit" class="form-check-input" type="checkbox" />
            <span class="form-check-label">Allow users to edit tags</span>
          </label>
        </div>

        <div class="settings-card">
          <strong class="d-block mb-2">Visible to</strong>
          <div class="d-flex flex-wrap gap-3" role="radiogroup" aria-label="Visible to age setting">
            <label class="form-check">
              <input v-model="form.ageRating" class="form-check-input" type="radio" name="ageRating" value="all" />
              <span class="form-check-label">All ages</span>
            </label>
            <label class="form-check">
              <input v-model="form.ageRating" class="form-check-input" type="radio" name="ageRating" value="r-18" />
              <span class="form-check-label">R-18</span>
            </label>
            <label class="form-check">
              <input v-model="form.ageRating" class="form-check-input" type="radio" name="ageRating" value="r-18g" />
              <span class="form-check-label">R-18G</span>
            </label>
          </div>

          <strong class="d-block mt-3 mb-2">AI-generated work</strong>
          <div class="d-flex flex-wrap gap-3" role="radiogroup" aria-label="AI generated setting">
            <label class="form-check">
              <input v-model="form.aiGenerated" class="form-check-input" type="radio" name="aiGenerated" value="yes" />
              <span class="form-check-label">Yes</span>
            </label>
            <label class="form-check">
              <input v-model="form.aiGenerated" class="form-check-input" type="radio" name="aiGenerated" value="no" />
              <span class="form-check-label">No</span>
            </label>
          </div>
        </div>

        <div class="settings-card">
          <strong class="d-block mb-2">Open to</strong>
          <div class="d-flex flex-wrap gap-3" role="radiogroup" aria-label="Post visibility setting">
            <label class="form-check">
              <input v-model="form.openTo" class="form-check-input" type="radio" name="openTo" value="public" />
              <span class="form-check-label">Public</span>
            </label>
            <label class="form-check">
              <input v-model="form.openTo" class="form-check-input" type="radio" name="openTo" value="logged-in" />
              <span class="form-check-label">Logged-in</span>
            </label>
            <label class="form-check">
              <input v-model="form.openTo" class="form-check-input" type="radio" name="openTo" value="mypixiv" />
              <span class="form-check-label">My pixiv only</span>
            </label>
            <label class="form-check">
              <input v-model="form.openTo" class="form-check-input" type="radio" name="openTo" value="private" />
              <span class="form-check-label">Private</span>
            </label>
          </div>

          <strong class="d-block mt-3 mb-2">Comments</strong>
          <div class="d-flex flex-wrap gap-3" role="radiogroup" aria-label="Comments setting">
            <label class="form-check">
              <input v-model="form.comments" class="form-check-input" type="radio" name="comments" value="on" />
              <span class="form-check-label">ON</span>
            </label>
            <label class="form-check">
              <input v-model="form.comments" class="form-check-input" type="radio" name="comments" value="off" />
              <span class="form-check-label">OFF</span>
            </label>
          </div>

          <div class="d-grid gap-2 mt-3">
            <label class="form-check mb-0">
              <input v-model="form.allowCollections" class="form-check-input" type="checkbox" />
              <span class="form-check-label">Allow feature in others collections</span>
            </label>
            <label class="form-check mb-0">
              <input v-model="form.isOriginalWork" class="form-check-input" type="checkbox" />
              <span class="form-check-label">Original work</span>
            </label>
          </div>

          <label for="work-language" class="form-label mt-3">Work language</label>
          <select id="work-language" v-model="form.language" class="form-select">
            <option v-for="language in languageOptions" :key="language" :value="language">{{ language }}</option>
          </select>

          <div class="schedule-row mt-3">
            <label class="form-check mb-0">
              <input v-model="form.scheduleEnabled" class="form-check-input" type="checkbox" />
              <span class="form-check-label">Scheduled post</span>
            </label>
            <div class="d-flex flex-column flex-sm-row gap-2" :class="{ 'opacity-50': !form.scheduleEnabled }">
              <input v-model="form.scheduleDate" type="date" class="form-control" :disabled="!form.scheduleEnabled" aria-label="Schedule date" />
              <input v-model="form.scheduleTime" type="time" class="form-control" :disabled="!form.scheduleEnabled" aria-label="Schedule time" />
            </div>
          </div>

          <p v-if="isNovel" class="small text-secondary mt-3 mb-0">Advanced settings for novel publication are applied from the same visibility and language options.</p>
        </div>

        <div v-if="localError || artworkStore.createError" class="alert alert-danger mb-0" role="alert" aria-live="assertive">
          {{ localError || artworkStore.createError }}
        </div>

        <div v-if="artworkStore.createSuccess" class="alert alert-success mb-0" role="status" aria-live="polite">
          Post created successfully.
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

.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.step-chip {
  padding: 0.26rem 0.62rem;
  border-radius: 999px;
  border: 1px solid #d7deea;
  background: #f5f7fb;
  font-size: 0.8rem;
}

.step-chip.active {
  background: #e9f0ff;
  border-color: #7ea4f8;
  color: #1e40af;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.tag-pill {
  border: 1px solid #d2dae6;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  font-size: 0.84rem;
  padding: 0.28rem 0.56rem;
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
}

.schedule-row {
  display: grid;
  gap: 0.55rem;
}

@media (max-width: 767px) {
  .upload-hero {
    padding: 0.85rem;
  }

  .cover-upload-row {
    grid-template-columns: 1fr;
  }

  .settings-card {
    padding: 0.8rem;
  }
}
</style>
