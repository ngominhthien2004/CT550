<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import NovelControls from './NovelControls.vue'
import NovelHeader from './NovelHeader.vue'
import NovelChapterSelector from './NovelChapterSelector.vue'
import NovelActionToolbar from './NovelActionToolbar.vue'
import { useTheme } from '../../composables/useTheme'

const props = defineProps({
  artwork: { type: Object, required: true },
  novelContent: { type: String, default: '' },
  chapters: { type: Array, default: () => [] },
  wordCount: { type: Number, default: 0 },
  readingTime: { type: Number, default: 0 },
  isBookmarked: { type: Boolean, default: false },
  isLiked: { type: Boolean, default: false },
  likeLoading: { type: Boolean, default: false },
  bookmarkLoading: { type: Boolean, default: false },
  initialScrollPosition: { type: Number, default: 0 },
  lastReadAt: { type: String, default: '' },
})

const emit = defineEmits(['progress-change', 'select-chapter', 'toggle-like', 'toggle-bookmark', 'scroll-change'])

const DEFAULT_FONT_SIZE = '1.05rem'
const fontSize = ref(localStorage.getItem('novel-font-size') || DEFAULT_FONT_SIZE)

function decreaseFontSize() {
  const current = parseFloat(fontSize.value)
  if (current > 0.85) {
    const newSize = Math.max(0.85, current - 0.05)
    fontSize.value = `${newSize}rem`
    localStorage.setItem('novel-font-size', fontSize.value)
  }
}

function increaseFontSize() {
  const current = parseFloat(fontSize.value)
  if (current < 1.5) {
    const newSize = Math.min(1.5, current + 0.05)
    fontSize.value = `${newSize}rem`
    localStorage.setItem('novel-font-size', fontSize.value)
  }
}

const canDecrease = computed(() => parseFloat(fontSize.value) > 0.85)
const canIncrease = computed(() => parseFloat(fontSize.value) < 1.5)

const formattedParagraphs = computed(() => {
  if (!props.novelContent) return []
  return props.novelContent.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
})

const { isDark: isDarkMode } = useTheme()

const progressPercent = ref(0)
const scrollPosition = ref(0)
const readingArea = ref(null)
let scrollTimer = null

const lastReadDisplay = computed(() => {
  if (!props.lastReadAt) return ''
  const diff = Date.now() - new Date(props.lastReadAt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
})

function onScroll() {
  const el = readingArea.value
  if (!el) return
  scrollPosition.value = el.scrollTop
  const scrollTop = el.scrollTop
  const scrollHeight = el.scrollHeight - el.clientHeight
  if (scrollHeight <= 0) {
    progressPercent.value = 100
  } else {
    progressPercent.value = Math.min(100, Math.round((scrollTop / scrollHeight) * 100))
  }
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    emit('progress-change', { progressPercent: progressPercent.value, scrollPosition: scrollPosition.value })
    emit('scroll-change', scrollPosition.value)
  }, 3000)
}

const selectedChapterId = ref('')

onMounted(() => {
  if (props.chapters.length > 0 && props.chapters[0]._id) {
    selectedChapterId.value = props.chapters[0]._id
  }
  if (props.initialScrollPosition > 0 && readingArea.value) {
    nextTick(() => { readingArea.value.scrollTop = props.initialScrollPosition })
  }
})

onUnmounted(() => {
  if (scrollTimer) clearTimeout(scrollTimer)
})
</script>

<template>
  <article
    class="novel-reader-shell"
    :class="{ 'novel-dark': isDarkMode }"
    :style="{ '--novel-font-size': fontSize }"
  >
    <div class="reading-progress-bar-container">
      <div class="reading-progress-bar" :style="{ transform: `scaleX(${Math.round(progressPercent) / 100})` }">
        <span class="progress-label">{{ Math.round(progressPercent) }}%</span>
      </div>
    </div>

    <div v-if="lastReadDisplay" class="last-read-indicator">
      <i class="fa-regular fa-clock" aria-hidden="true"></i> Last read {{ lastReadDisplay }}
    </div>

    <NovelControls
      :font-size="fontSize"
      :can-decrease="canDecrease"
      :can-increase="canIncrease"
      @decrease-font="decreaseFontSize"
      @increase-font="increaseFontSize"
    />

    <NovelHeader
      :artwork="artwork"
      :word-count="wordCount"
      :reading-time="readingTime"
    />

    <NovelChapterSelector
      :chapters="chapters"
      :selected-chapter-id="selectedChapterId"
      @select="emit('select-chapter', $event)"
    />

    <div class="novel-divider" />

    <div ref="readingArea" class="novel-reading-area" @scroll="onScroll">
      <template v-if="formattedParagraphs.length">
        <p v-for="(p, index) in formattedParagraphs" :key="'p-' + index" class="novel-p">
          {{ p }}
        </p>
      </template>
      <template v-else>
        {{ novelContent }}
      </template>
    </div>

    <div v-if="novelContent" class="novel-end-marker">
      <div class="end-marker-line" />
      <span class="end-marker-text">The End</span>
      <div class="end-marker-line" />
    </div>

    <NovelActionToolbar
      v-if="novelContent"
      :like-count="artwork.likeCount"
      :bookmark-count="artwork.bookmarkCount"
      :is-liked="isLiked"
      :is-bookmarked="isBookmarked"
      :like-loading="likeLoading"
      :bookmark-loading="bookmarkLoading"
      @toggle-like="emit('toggle-like')"
      @toggle-bookmark="emit('toggle-bookmark')"
    />
  </article>
</template>

<style scoped>
.novel-reader-shell {
  --novel-text-color: var(--text);
  --novel-bg: var(--surface);
  --novel-accent: var(--accent);
  --novel-accent-hover: #007bd0;
  --novel-muted: var(--muted);
  --novel-border: var(--line);
  --novel-surface: var(--surface-alt);
  --novel-progress-bg: var(--line);
  --novel-shadow: var(--shadow-sm);

  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--novel-bg);
  color: var(--novel-text-color);
  border-radius: 12px;
  border: 1px solid var(--novel-border);
  box-shadow: var(--novel-shadow);
  transition: background 0.35s ease, color 0.35s ease;
  min-height: 100vh;
  position: relative;
}

.novel-reader-shell.novel-dark {
  --novel-text-color: #e0e0e0;
  --novel-bg: #1a1a1a;
  --novel-accent: #38bdf8;
  --novel-accent-hover: #0ea5e9;
  --novel-muted: #9ca3af;
  --novel-border: #2d2d2d;
  --novel-surface: #222222;
  --novel-progress-bg: #2d2d2d;
  --novel-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.reading-progress-bar-container {
  position: sticky;
  top: 0;
  z-index: 20;
  width: 100%;
  height: 4px;
  background: var(--novel-progress-bg);
  border-radius: 0 0 2px 2px;
  overflow: visible;
  margin-bottom: 1.5rem;
}

.reading-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--novel-accent), #93c5fd);
  border-radius: 0 2px 2px 0;
  transform-origin: left;
  transition: transform 0.15s ease-out;
  position: relative;
  min-width: 0;
}

.progress-label {
  position: absolute;
  right: -2.5rem;
  top: -1.4rem;
  font-size: 0.7rem;
  font-family: ui-monospace, 'SF Mono', monospace;
  color: var(--novel-accent);
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s ease;
  white-space: nowrap;
  pointer-events: none;
}

.reading-progress-bar-container:hover .progress-label {
  opacity: 1;
}

.last-read-indicator {
  text-align: center;
  font-size: 0.8rem;
  color: var(--novel-muted);
  margin-bottom: 1rem;
}

.novel-divider {
  width: 60px;
  height: 2px;
  background: var(--novel-border);
  margin: 1.5rem auto 2rem;
  border-radius: 1px;
}

.novel-reading-area {
  font-family: 'Lora', Georgia, 'Noto Serif', 'Times New Roman', serif;
  font-size: var(--novel-font-size, 1.05rem);
  line-height: 1.95;
  max-width: 680px;
  margin: 0 auto;
  padding: 0;
  color: var(--novel-text-color);
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-height: 40vh;
  scroll-behavior: smooth;
}

.novel-p {
  margin-bottom: 1.5rem;
  text-indent: 1.5rem;
  text-align: justify;
}

.novel-end-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin: 4rem auto 2rem;
  max-width: 300px;
  opacity: 0.6;
}

.end-marker-line {
  flex: 1;
  height: 1px;
  background: var(--novel-border);
}

.end-marker-text {
  font-family: Georgia, 'Noto Serif', serif;
  font-size: 0.85rem;
  font-style: italic;
  color: var(--novel-muted);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .novel-reader-shell {
    padding: 1rem;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
</style>
