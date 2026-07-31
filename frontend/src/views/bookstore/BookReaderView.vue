<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BookstoreLayout from '@/components/bookstore/BookstoreLayout.vue'
import { getBookById, getDownloadUrl } from '@/services/book.api.js'
import { useToast } from '@/composables/useToast.js'
import { translateError } from '@/utils/translateError.js'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { showError } = useToast()

const blobUrl = ref('')
const loading = ref(true)
const loadingText = ref('')
const error = ref('')
const zoom = ref(100)
const isFullscreen = ref(false)
const controlsVisible = ref(true)
let controlsTimer = null
let activeBlob = null
let activeEbookFile = null

// ── Comic / artbook mode state ──
const comicPages = ref([])
const currentPage = ref(1)
const downloadUrl = ref('')
const readerContainer = ref(null)
const isComic = computed(() => comicPages.value.length > 0)
let comicObserver = null
let comicProgressRestored = false

const bookTitle = computed(() => route.query.title || t('bookstore.readBook'))
const bookId = computed(() => route.query.bookId)
const orderId = computed(() => route.query.orderId)
const itemId = computed(() => route.query.itemId)

// Pages are sorted by the backend; sort defensively so the reader never
// depends on upload order.
const sortedComicPages = computed(() =>
  [...comicPages.value].sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0))
)

// Zoom acts on the image width as a percentage of the container.
const comicZoomStyle = computed(() => ({ maxWidth: `${zoom.value}%` }))

const isFirstComicPage = computed(() => {
  const index = sortedComicPages.value.findIndex((p) => p.pageNumber === currentPage.value)
  return sortedComicPages.value.length === 0 || index <= 0
})

const isLastComicPage = computed(() => {
  const index = sortedComicPages.value.findIndex((p) => p.pageNumber === currentPage.value)
  return sortedComicPages.value.length === 0 || index < 0 || index >= sortedComicPages.value.length - 1
})

function getExtFromMimeType(mime) {
  const map = {
    'application/pdf': '.pdf',
    'application/epub+zip': '.epub',
    'application/zip': '.zip',
    'image/png': '.png',
    'image/jpeg': '.jpg',
  }
  return map[mime] || ''
}

function downloadEbook() {
  if (!activeBlob) return
  const ext = getExtFromMimeType(activeBlob.type)
  const safeTitle = bookTitle.value.replace(/[^\w\s.-]/g, '').trim() || 'ebook'
  const originalName = (activeEbookFile?.originalName || '').replace(/[^\w\s.-]/g, '').trim()
  const baseName = originalName || safeTitle
  const filename = ext && !baseName.toLowerCase().endsWith(ext) ? `${baseName}${ext}` : baseName
  const url = URL.createObjectURL(activeBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const ZOOM_MIN = 50
const ZOOM_MAX = 200
const ZOOM_STEP = 25

function zoomIn() {
  zoom.value = Math.min(zoom.value + ZOOM_STEP, ZOOM_MAX)
}

function zoomOut() {
  zoom.value = Math.max(zoom.value - ZOOM_STEP, ZOOM_MIN)
}

function resetZoom() {
  zoom.value = 100
}

function toggleFullscreen() {
  const el = document.querySelector(isComic.value ? '.comic-viewer' : '.reader-content')
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen().then(() => {
      isFullscreen.value = true
    }).catch(() => { /* ignore */ })
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
    }).catch(() => { /* ignore */ })
  }
}

function handleFullscreenChange() {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

function showControls() {
  controlsVisible.value = true
  clearTimeout(controlsTimer)
  controlsTimer = setTimeout(() => {
    controlsVisible.value = false
  }, 3000)
}

function handleMouseMove() {
  showControls()
}

function goBack() {
  router.push({ name: 'book-library' })
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    if (isFullscreen.value) {
      document.exitFullscreen()
    } else {
      goBack()
    }
  }
  if (e.key === 'ArrowLeft' && isComic.value) {
    e.preventDefault()
    goPrevComicPage()
  }
  if (e.key === 'ArrowRight' && isComic.value) {
    e.preventDefault()
    goNextComicPage()
  }
  if (e.key === '+' || e.key === '=') {
    e.preventDefault()
    zoomIn()
  }
  if (e.key === '-') {
    e.preventDefault()
    zoomOut()
  }
  if (e.key === '0') {
    e.preventDefault()
    resetZoom()
  }
}

/**
 * Sniff the blob content for known file magic bytes when the book detail
 * (which carries the real mime type) is unavailable. Cloudinary serves the
 * file as application/octet-stream, so this is our fallback source of truth.
 */
async function detectMimeFromBlob(blob) {
  if (!blob || blob.size < 5) return ''
  try {
    const head = await blob.slice(0, 5).text()
    return head.startsWith('%PDF') ? 'application/pdf' : ''
  } catch {
    return ''
  }
}

/* ── Comic / artbook mode ──────────────────────────────────────── */

function comicProgressKey() {
  return bookId.value ? `illuwrl:book-progress:${bookId.value}` : ''
}

function persistComicProgress(pageNumber) {
  const key = comicProgressKey()
  if (!key) return
  try {
    localStorage.setItem(key, String(pageNumber))
  } catch {
    // Storage may be unavailable (private browsing); reading still works.
  }
}

function setupComicObserver() {
  disconnectComicObserver()
  const container = readerContainer.value
  if (!container || sortedComicPages.value.length === 0) return
  comicObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const pageNumber = Number(entry.target.dataset.page)
        if (!Number.isInteger(pageNumber) || pageNumber === currentPage.value) continue
        currentPage.value = pageNumber
        persistComicProgress(pageNumber)
      }
    },
    {
      root: container,
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0,
    }
  )
  container.querySelectorAll('[data-page]').forEach((el) => comicObserver.observe(el))
}

function disconnectComicObserver() {
  if (comicObserver) {
    comicObserver.disconnect()
    comicObserver = null
  }
}

function scrollToPage(pageNumber) {
  const container = readerContainer.value
  if (!container) return
  const el = container.querySelector(`[data-page="${pageNumber}"]`)
  if (!el) return
  if (el.offsetTop === 0 && el.offsetHeight === 0 && sortedComicPages.value.length > 1) {
    // Lazy images above have not sized in yet — estimate by proportion.
    const index = sortedComicPages.value.findIndex((p) => p.pageNumber === pageNumber)
    const ratio = index / Math.max(sortedComicPages.value.length - 1, 1)
    container.scrollTop = Math.round(ratio * (container.scrollHeight - container.clientHeight))
  } else {
    el.scrollIntoView({ block: 'start' })
  }
}

function tryRestoreComicProgress() {
  if (comicProgressRestored) return
  comicProgressRestored = true
  const key = comicProgressKey()
  if (!key) return
  let saved = NaN
  try {
    saved = Number(localStorage.getItem(key))
  } catch {
    return
  }
  if (!Number.isInteger(saved) || saved < 1) return
  if (!sortedComicPages.value.some((p) => p.pageNumber === saved)) return
  scrollToPage(saved)
}

function onComicPageLoad() {
  // First image sizing in is a good moment to restore reading progress.
  tryRestoreComicProgress()
}

function goToComicPage(index) {
  const pages = sortedComicPages.value
  if (pages.length === 0) return
  const clamped = Math.min(Math.max(index, 0), pages.length - 1)
  const page = pages[clamped]
  currentPage.value = page.pageNumber
  scrollToPage(page.pageNumber)
  persistComicProgress(page.pageNumber)
}

function goPrevComicPage() {
  const pages = sortedComicPages.value
  const index = pages.findIndex((p) => p.pageNumber === currentPage.value)
  if (index > 0) goToComicPage(index - 1)
}

function goNextComicPage() {
  const pages = sortedComicPages.value
  const index = pages.findIndex((p) => p.pageNumber === currentPage.value)
  if (index >= 0 && index < pages.length - 1) goToComicPage(index + 1)
}

/**
 * Comic mode still offers ZIP download via the order's Cloudinary URL.
 * Fetch the URL and keep the resulting blob so downloadEbook() works.
 */
async function prepareComicDownload(url, bookEbookFile) {
  if (!url) return
  downloadUrl.value = url
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    activeBlob = await resp.blob()
    activeEbookFile = bookEbookFile
  } catch {
    // The reader still works — only the Download button may be unavailable.
  }
}

async function loadEbook() {
  if (!orderId.value || !itemId.value) {
    error.value = t('bookstore.ebookLoadFailed')
    loading.value = false
    return
  }

  try {
    loadingText.value = t('bookstore.loadingEbook')

    // Step 1: fetch the book detail (real mime type + original filename)
    // and the Cloudinary download URL in parallel.
    const bookDetailTask = bookId.value
      ? getBookById(bookId.value).catch(() => null)
      : Promise.resolve(null)
    const [bookDetail, download] = await Promise.all([
      bookDetailTask,
      getDownloadUrl(orderId.value, itemId.value),
    ])

    const bookEbookFile = bookDetail?.data?.ebookFile || null

    // Comic/artbook mode: the book detail carries an ordered list of pages
    // as direct Cloudinary image URLs — render those directly, no blob needed.
    comicPages.value = Array.isArray(bookDetail?.data?.pages) ? bookDetail.data.pages : []
    if (comicPages.value.length > 0) {
      loading.value = false
      // The Download button still needs the ZIP blob; fetch it in the
      // background (non-blocking) so it is ready when the user clicks.
      prepareComicDownload(download?.data?.downloadUrl, bookEbookFile)
      await nextTick()
      setupComicObserver()
      // Give the first images a moment to size in before restoring progress.
      setTimeout(tryRestoreComicProgress, 400)
      return
    }

    const url = download?.data?.downloadUrl
    if (!url) {
      error.value = t('bookstore.noEbookAvailable')
      loading.value = false
      return
    }

    // Legacy fallback: if no pages and the file is not PDF, the book is unreadable.
    const bookMime = bookEbookFile?.mimeType || ''
    const isPdf = bookMime === 'application/pdf' || (url && /\.pdf(\?|$)/i.test(url))
    if (!isPdf) {
      error.value = t('bookstore.unreadableBook')
      loading.value = false
      return
    }

    loadingText.value = t('bookstore.loadingEbook')

    // Step 2: fetch the actual file via fetch() so the browser handles
    // Content-Type correctly and we get a proper blob for the iframe.
    const resp = await fetch(url)
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`)
    }
    const rawBlob = await resp.blob()

    // Cloudinary serves the file as application/octet-stream with a
    // download-only Content-Disposition, which the iframe can't render.
    // Use the real mime type from the book detail, or sniff the blob
    // content as a fallback, then re-wrap the blob so the browser's
    // built-in PDF viewer can display it.
    const detectedMime = await detectMimeFromBlob(rawBlob)
    const mime = bookEbookFile?.mimeType || detectedMime || rawBlob.type
    const blob = rawBlob.type === mime ? rawBlob : new Blob([rawBlob], { type: mime })

    // Clean up previous blob URL
    if (activeBlob) {
      URL.revokeObjectURL(blobUrl.value)
    }
    activeEbookFile = bookEbookFile
    activeBlob = blob
    blobUrl.value = URL.createObjectURL(blob)
  } catch (err) {
    error.value = translateError(err, t, 'bookstore.ebookLoadFailed')
    showError(error.value)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleKeydown)
  await loadEbook()
  showControls()
})

onUnmounted(() => {
  disconnectComicObserver()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleKeydown)
  clearTimeout(controlsTimer)
  // Clean up blob URL
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value)
  }
})
</script>

<template>
  <section
    class="reader-page"
    @mousemove="handleMouseMove"
  >
      <!-- Top bar -->
      <header
        class="reader-header"
        :class="{ 'reader-header--hidden': !controlsVisible && !loading && (blobUrl || isComic) }"
      >
        <button
          type="button"
          class="reader-header-btn"
          :aria-label="t('bookstore.backToLibrary')"
          @click="goBack"
        >
          <i class="fa-solid fa-arrow-left"></i>
          <span class="reader-header-label">{{ t('bookstore.backToLibrary') }}</span>
        </button>

        <h1 class="reader-title">{{ bookTitle }}</h1>

        <div class="reader-header-actions">
          <button
            v-if="blobUrl || isComic"
            type="button"
            class="reader-header-btn"
            :aria-label="t('bookstore.downloadEbook')"
            @click="downloadEbook"
          >
            <i class="fa-solid fa-download"></i>
          </button>
          <button
            type="button"
            class="reader-header-btn"
            :aria-label="isFullscreen ? t('bookstore.exitFullscreen') : t('bookstore.fullscreen')"
            @click="toggleFullscreen"
          >
            <i :class="isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"></i>
          </button>
        </div>
      </header>

      <!-- Loading state -->
      <div v-if="loading" class="reader-state">
        <div class="reader-state-inner">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <p class="reader-state-text">{{ loadingText }}</p>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="reader-state">
        <div class="reader-state-inner">
          <i class="fa-solid fa-triangle-exclamation reader-state-icon"></i>
          <p class="reader-state-text">{{ error }}</p>
          <button
            type="button"
            class="btn action-pill action-pill--post"
            @click="goBack"
          >
            <i class="fa-solid fa-arrow-left me-1"></i>
            {{ t('bookstore.backToLibrary') }}
          </button>
        </div>
      </div>

      <!-- Comic viewer -->
      <div v-else-if="isComic" ref="readerContainer" class="comic-viewer">
        <img
          v-for="page in sortedComicPages"
          :key="page.pageNumber"
          :src="page.url"
          :data-page="page.pageNumber"
          :alt="`${bookTitle} - ${page.pageNumber}`"
          class="comic-page"
          :style="comicZoomStyle"
          loading="lazy"
          @load="onComicPageLoad"
        />
      </div>

      <!-- Ebook viewer -->
      <div v-else-if="blobUrl" class="reader-content">
        <div
          class="reader-iframe-wrapper"
          :style="{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }"
        >
          <iframe
            :src="blobUrl"
            class="reader-iframe"
            frameborder="0"
            allow="fullscreen"
            :title="bookTitle"
          ></iframe>
        </div>
      </div>

      <!-- Zoom controls -->
      <div
        v-if="(blobUrl || isComic) && !loading"
        class="reader-zoom"
        :class="{ 'reader-zoom--hidden': !controlsVisible }"
      >
        <button
          type="button"
          class="reader-zoom-btn"
          :aria-label="t('bookstore.zoomOut')"
          :disabled="zoom <= ZOOM_MIN"
          @click="zoomOut"
        >
          <i class="fa-solid fa-minus"></i>
        </button>
        <span class="reader-zoom-label">{{ zoom }}%</span>
        <button
          type="button"
          class="reader-zoom-btn"
          :aria-label="t('bookstore.zoomIn')"
          :disabled="zoom >= ZOOM_MAX"
          @click="zoomIn"
        >
          <i class="fa-solid fa-plus"></i>
        </button>
        <button
          type="button"
          class="reader-zoom-btn reader-zoom-reset"
          :aria-label="t('bookstore.resetZoom')"
          @click="resetZoom"
        >
          <i class="fa-solid fa-expand"></i>
        </button>
      </div>

      <!-- Comic page indicator + navigation -->
      <div
        v-if="isComic && !loading"
        class="comic-nav"
        :class="{ 'comic-nav--hidden': !controlsVisible }"
      >
        <button
          type="button"
          class="comic-nav-btn"
          :aria-label="t('bookstore.prevPage')"
          :disabled="isFirstComicPage"
          @click="goPrevComicPage"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span class="comic-nav-label">{{ currentPage }} / {{ comicPages.length }}</span>
        <button
          type="button"
          class="comic-nav-btn"
          :aria-label="t('bookstore.nextPage')"
          :disabled="isLastComicPage"
          @click="goNextComicPage"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
  </section>
</template>

<style scoped>
.reader-page {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  overflow: hidden;
}

/* ── Header ── */
.reader-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 1rem;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  z-index: 20;
  flex-shrink: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.reader-header--hidden {
  opacity: 0;
  transform: translateY(-100%);
  pointer-events: none;
}

.reader-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 0.85rem;
  font-family: 'Sora', 'Noto Sans', sans-serif;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}

.reader-header-btn:hover {
  background: var(--surface-alt);
  color: var(--accent);
}

.reader-header-label {
  display: inline;
}

.reader-title {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Sora', 'Noto Sans', sans-serif;
}

.reader-header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* ── State (loading / error) ── */
.reader-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reader-state-inner {
  text-align: center;
}

.reader-state-icon {
  font-size: 2.5rem;
  color: var(--line);
  margin-bottom: 1rem;
}

.reader-state-text {
  font-size: 0.9rem;
  color: var(--muted);
  margin: 0 0 1rem;
}

/* ── Content ── */
.reader-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  justify-content: center;
  background: #52565c;
}

.reader-iframe-wrapper {
  width: 100%;
  height: 100%;
  transition: transform 0.15s ease;
}

.reader-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

/* ── Comic viewer ── */
.comic-viewer {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: #17181b;
  scrollbar-width: none;
}

.comic-viewer::-webkit-scrollbar {
  display: none;
}

.comic-page {
  max-width: 100%;
  width: 100%;
  display: block;
}

/* ── Zoom controls ── */
.reader-zoom {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.65rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  z-index: 30;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.reader-zoom--hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
  pointer-events: none;
}

.reader-zoom-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.reader-zoom-btn:hover:not(:disabled) {
  background: var(--surface-alt);
  color: var(--accent);
  border-color: var(--accent);
}

.reader-zoom-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.reader-zoom-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
  min-width: 3rem;
  text-align: center;
  font-family: 'Sora', 'Noto Sans', sans-serif;
}

.reader-zoom-reset {
  margin-left: 0.15rem;
}

/* ── Comic nav ── */
.comic-nav {
  position: fixed;
  bottom: 6rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.65rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  z-index: 30;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.comic-nav--hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
  pointer-events: none;
}

.comic-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.comic-nav-btn:hover:not(:disabled) {
  background: var(--surface-alt);
  color: var(--accent);
  border-color: var(--accent);
}

.comic-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.comic-nav-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
  min-width: 3rem;
  text-align: center;
  font-family: 'Sora', 'Noto Sans', sans-serif;
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .reader-header-label {
    display: none;
  }

  .reader-title {
    font-size: 0.82rem;
  }
}
</style>
