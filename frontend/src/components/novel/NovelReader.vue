<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

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
})

const emit = defineEmits(['progress-change', 'select-chapter', 'toggle-like', 'toggle-bookmark'])

// ── Font Size ──────────────────────────────────────────────────────
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

// ── Dark Mode ──────────────────────────────────────────────────────
const isDarkMode = ref(localStorage.getItem('novel-dark-mode') === 'true')

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('novel-dark-mode', String(isDarkMode.value))
}

// ── Reading Progress ───────────────────────────────────────────────
const progressPercent = ref(0)
const readingArea = ref(null)
let scrollTimer = null

function onScroll() {
  const el = readingArea.value
  if (!el) {
    return
  }

  const scrollTop = el.scrollTop
  const scrollHeight = el.scrollHeight - el.clientHeight

  if (scrollHeight <= 0) {
    progressPercent.value = 100
  } else {
    progressPercent.value = Math.min(100, Math.round((scrollTop / scrollHeight) * 100))
  }

  if (scrollTimer) {
    clearTimeout(scrollTimer)
  }
  scrollTimer = setTimeout(() => {
    emit('progress-change', { progressPercent: progressPercent.value })
  }, 3000)
}

// ── Utility Formatting ─────────────────────────────────────────────
function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0)
}

function onSelectChapter(event) {
  emit('select-chapter', event.target.value)
}

// ── Chapter Selector Value ─────────────────────────────────────────
const selectedChapterId = ref('')

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(() => {
  if (props.chapters.length > 0 && props.chapters[0]._id) {
    selectedChapterId.value = props.chapters[0]._id
  }
})

onUnmounted(() => {
  if (scrollTimer) {
    clearTimeout(scrollTimer)
  }
})

// ── Share Action ──────────────────────────────────────────────────
const isShared = ref(false)
function handleShare() {
  navigator.clipboard.writeText(window.location.href)
  isShared.value = true
  alert('Đã sao chép liên kết trang Novel này vào clipboard!')
}
</script>

<template>
  <article
    class="novel-reader-shell"
    :class="{ 'novel-dark': isDarkMode }"
    :style="{ '--novel-font-size': fontSize }"
  >
    <!-- Reading Progress Bar -->
    <div class="reading-progress-bar-container">
      <div class="reading-progress-bar" :style="{ width: `${Math.round(progressPercent)}%` }">
        <span class="progress-label">{{ Math.round(progressPercent) }}%</span>
      </div>
    </div>

    <!-- Controls Bar -->
    <div class="novel-controls-bar">
      <div class="controls-group">
        <button
          class="ctrl-btn font-btn"
          :class="{ disabled: !canDecrease }"
          :disabled="!canDecrease"
          title="Decrease font size"
          @click="decreaseFontSize"
        >
          <span class="ctrl-label">A</span><span class="ctrl-modifier">–</span>
        </button>
        <span class="font-size-indicator">{{ fontSize }}</span>
        <button
          class="ctrl-btn font-btn"
          :class="{ disabled: !canIncrease }"
          :disabled="!canIncrease"
          title="Increase font size"
          @click="increaseFontSize"
        >
          <span class="ctrl-label">A</span><span class="ctrl-modifier">+</span>
        </button>
      </div>

      <div class="controls-group">
        <button class="ctrl-btn theme-btn" title="Toggle dark mode" @click="toggleDarkMode">
          <span v-if="isDarkMode" class="ctrl-icon" aria-hidden="true">☀️</span>
          <span v-else class="ctrl-icon" aria-hidden="true">🌙</span>
        </button>
      </div>
    </div>

    <!-- Cover & Header -->
    <div class="novel-header">
      <div class="novel-cover-wrapper">
        <img
          v-if="artwork.images?.[0]"
          :src="artwork.images[0]"
          :alt="artwork.title"
          class="novel-cover"
          loading="lazy"
        />
        <div v-else class="novel-cover-placeholder">
          <span class="placeholder-icon">📖</span>
        </div>
      </div>

      <div class="novel-header-info">
        <h1 class="novel-title">{{ artwork.title || 'Untitled' }}</h1>

        <!-- Author Row -->
        <div v-if="artwork.user" class="novel-author-row">
          <img 
            :src="artwork.user.avatar || 'https://s.pximg.net/common/images/no_profile.png'" 
            :alt="artwork.user.displayName || artwork.user.username" 
            class="header-author-avatar" 
          />
          <router-link :to="`/account?user=${artwork.user._id}`" class="header-author-name">
            {{ artwork.user.displayName || artwork.user.username }}
          </router-link>
        </div>

        <!-- Meta: Word count, Reading time -->
        <div class="novel-meta-reading-time">
          <span class="meta-item">📝 {{ formatNumber(wordCount) }} words</span>
          <span class="meta-separator">·</span>
          <span class="meta-item">⏱️ {{ readingTime }} min read</span>
        </div>

        <!-- Tags -->
        <div v-if="artwork.tags?.length" class="novel-tags">
          <router-link
            v-for="tag in artwork.tags"
            :key="tag._id || tag.name"
            :to="`/tags/${encodeURIComponent(tag.name)}`"
            class="novel-tag"
          >
            #{{ tag.name }}
          </router-link>
        </div>

        <!-- Stats -->
        <div class="novel-stats">
          <span class="stat-item" title="Views">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {{ formatNumber(artwork.viewCount) }}
          </span>
          <span class="stat-item" title="Likes">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {{ formatNumber(artwork.likeCount) }}
          </span>
          <span class="stat-item" title="Bookmarks">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            {{ formatNumber(artwork.bookmarkCount) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Chapter Selector -->
    <div v-if="chapters.length > 1" class="chapter-selector-group">
      <label for="novel-chapter-select" class="chapter-label">Chapter</label>
      <select
        id="novel-chapter-select"
        class="chapter-select"
        :value="selectedChapterId"
        @change="onSelectChapter"
      >
        <option
          v-for="ch in chapters"
          :key="ch._id"
          :value="ch._id"
        >
          Chapter {{ ch.chapterNumber }}: {{ ch.title || 'Untitled' }}
        </option>
      </select>
    </div>

    <!-- Divider -->
    <div class="novel-divider" />

    <!-- Novel Text Content -->
    <div
      ref="readingArea"
      class="novel-reading-area"
      @scroll="onScroll"
    >
      <template v-if="formattedParagraphs.length">
        <p v-for="(p, index) in formattedParagraphs" :key="index" class="novel-p">
          {{ p }}
        </p>
      </template>
      <template v-else>
        {{ novelContent }}
      </template>
    </div>

    <!-- End marker -->
    <div v-if="novelContent" class="novel-end-marker">
      <div class="end-marker-line" />
      <span class="end-marker-text">The End</span>
      <div class="end-marker-line" />
    </div>

    <!-- Interactive Action Toolbar -->
    <div v-if="novelContent" class="novel-action-toolbar">
      <button 
        class="action-btn like-btn" 
        :class="{ 'is-active': isLiked, 'is-loading': likeLoading }"
        :disabled="likeLoading"
        @click="emit('toggle-like')"
      >
        <span class="btn-icon">❤️</span>
        <span class="btn-count">{{ formatNumber(artwork.likeCount) }}</span>
      </button>

      <button 
        class="action-btn bookmark-btn" 
        :class="{ 'is-active': isBookmarked, 'is-loading': bookmarkLoading }"
        :disabled="bookmarkLoading"
        @click="emit('toggle-bookmark')"
      >
        <span class="btn-icon">🔖</span>
        <span class="btn-count">{{ formatNumber(artwork.bookmarkCount) }}</span>
      </button>

      <button class="action-btn share-btn" @click="handleShare" title="Copy link to share">
        <span class="btn-icon">🔗</span>
        <span class="btn-text">Share</span>
      </button>
    </div>
  </article>
</template>

<style scoped>
/* ── Base Shell ─────────────────────────────────────────────────── */
.novel-reader-shell {
  --novel-text-color: #1f2937;
  --novel-bg: #ffffff;
  --novel-accent: #0096fa;
  --novel-accent-hover: #007bd0;
  --novel-muted: #6b7280;
  --novel-border: #e5e7eb;
  --novel-surface: #f9fafb;
  --novel-progress-bg: #e5e7eb;
  --novel-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

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

/* ── Dark Theme ─────────────────────────────────────────────────── */
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

/* ── Reading Progress Bar ───────────────────────────────────────── */
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
  transition: width 0.15s ease-out;
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

/* ── Controls Bar ───────────────────────────────────────────────── */
.novel-controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--novel-border);
}

.controls-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.2rem;
  height: 2.2rem;
  padding: 0 0.5rem;
  border: 1px solid var(--novel-border);
  border-radius: 6px;
  background: var(--novel-surface);
  color: var(--novel-text-color);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  line-height: 1;
  user-select: none;
}

.ctrl-btn:hover:not(.disabled) {
  background: var(--novel-accent);
  color: #ffffff;
  border-color: var(--novel-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 150, 250, 0.25);
}

.ctrl-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.font-btn .ctrl-label {
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 700;
  font-size: 1rem;
}

.font-btn .ctrl-modifier {
  font-size: 0.8rem;
  margin-left: 1px;
}

.font-size-indicator {
  font-size: 0.75rem;
  font-family: ui-monospace, 'SF Mono', monospace;
  color: var(--novel-muted);
  min-width: 3.5rem;
  text-align: center;
}

.theme-btn {
  font-size: 1rem;
  padding: 0 0.6rem;
}

/* ── Split Cover & Header ───────────────────────────────────────── */
.novel-header {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 1.5rem;
  align-items: start;
  text-align: left;
  padding: 1.5rem;
  background: var(--novel-surface);
  border-radius: 8px;
  border: 1px solid var(--novel-border);
  margin-bottom: 2rem;
}

.novel-cover-wrapper {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
  background: var(--novel-bg);
}

.novel-cover {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
}

.novel-cover-placeholder {
  width: 100%;
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--novel-surface);
  color: var(--novel-muted);
}

.placeholder-icon {
  font-size: 2.5rem;
  opacity: 0.5;
}

.novel-header-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.novel-title {
  font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
  color: var(--novel-text-color);
}

/* Author Row */
.novel-author-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.2rem 0;
}

.header-author-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--novel-border);
}

.header-author-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--novel-text-color);
  text-decoration: none;
  transition: color 0.2s;
}

.header-author-name:hover {
  color: var(--novel-accent);
}

/* Stats & Meta */
.novel-meta-reading-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--novel-muted);
  font-weight: 500;
}

.meta-separator {
  color: var(--novel-border);
}

.novel-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--novel-muted);
  margin-top: 0.25rem;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.stat-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* ── Tags ───────────────────────────────────────────────────────── */
.novel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.2rem 0;
}

.novel-tag {
  text-decoration: none;
  color: var(--novel-accent);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: color-mix(in srgb, var(--novel-accent) 8%, transparent);
  transition: background 0.2s ease, color 0.2s ease;
}

.novel-tag:hover {
  background: var(--novel-accent);
  color: #ffffff;
  text-decoration: none;
}

/* ── Chapter Selector ───────────────────────────────────────────── */
.chapter-selector-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  justify-content: center;
}

.chapter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--novel-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chapter-select {
  padding: 0.45rem 2rem 0.45rem 0.75rem;
  border: 1px solid var(--novel-border);
  border-radius: 6px;
  background: var(--novel-surface);
  color: var(--novel-text-color);
  font-size: 0.9rem;
  cursor: pointer;
  appearance: auto;
  max-width: 100%;
  transition: border-color 0.2s ease;
}

.chapter-select:hover {
  border-color: var(--novel-accent);
}

/* ── Divider ────────────────────────────────────────────────────── */
.novel-divider {
  width: 60px;
  height: 2px;
  background: var(--novel-border);
  margin: 1.5rem auto 2rem;
  border-radius: 1px;
}

/* ── Reading Area ───────────────────────────────────────────────── */
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
  text-indent: 1.5rem; /* Traditional reading layout indentation */
  text-align: justify;
}

/* ── End Marker ─────────────────────────────────────────────────── */
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

/* ── Interactive Action Toolbar ─────────────────────────────────── */
.novel-action-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--novel-border);
  margin-top: 2.5rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2.6rem;
  padding: 0 1.25rem;
  border: 1px solid var(--novel-border);
  border-radius: 20px;
  background: var(--novel-surface);
  color: var(--novel-text-color);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.like-btn:hover {
  border-color: #f43f5e;
  background-color: color-mix(in srgb, #f43f5e 8%, var(--novel-surface));
  color: #f43f5e;
}

.like-btn.is-active {
  background-color: #f43f5e;
  border-color: #f43f5e;
  color: #ffffff;
}

.bookmark-btn:hover {
  border-color: #eab308;
  background-color: color-mix(in srgb, #eab308 8%, var(--novel-surface));
  color: #ca8a04;
}

.bookmark-btn.is-active {
  background-color: #eab308;
  border-color: #eab308;
  color: #ffffff;
}

.share-btn:hover {
  border-color: var(--novel-accent);
  background-color: color-mix(in srgb, var(--novel-accent) 8%, var(--novel-surface));
  color: var(--novel-accent);
}

.action-btn.is-loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-count {
  font-size: 0.8rem;
  font-weight: 700;
  font-family: ui-monospace, 'SF Mono', monospace;
  opacity: 0.9;
}

/* ── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .novel-reader-shell {
    padding: 1.25rem;
    border-radius: 0;
    border-left: none;
    border-right: none;
    margin: 0;
  }

  .novel-header {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 1rem;
    padding: 1rem;
  }

  .novel-cover-wrapper {
    width: 120px;
    margin: 0 auto;
  }

  .novel-author-row {
    justify-content: center;
  }

  .novel-meta-reading-time {
    justify-content: center;
  }

  .novel-stats {
    justify-content: center;
    gap: 0.75rem;
  }

  .novel-tags {
    justify-content: center;
  }

  .novel-reading-area {
    font-size: calc(var(--novel-font-size, 1.05rem) * 0.95);
  }

  .novel-action-toolbar {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .action-btn {
    flex: 1 1 calc(50% - 0.5rem);
    min-width: 120px;
  }

  .share-btn {
    flex: 1 1 100%;
  }
}

/* ── Print Styles ───────────────────────────────────────────────── */
@media print {
  .novel-reader-shell {
    max-width: 100%;
    padding: 0;
    background: #ffffff;
    color: #000000;
    box-shadow: none;
    border: none;
  }

  .novel-reader-shell.novel-dark {
    background: #ffffff;
    color: #000000;
    --novel-text-color: #000000;
  }

  .reading-progress-bar-container,
  .novel-controls-bar,
  .chapter-selector-group,
  .novel-action-toolbar {
    display: none;
  }

  .novel-header {
    grid-template-columns: 100px 1fr;
    background: none;
    border: none;
    padding: 0;
  }

  .novel-cover-wrapper {
    box-shadow: none;
  }

  .novel-reading-area {
    max-width: 100%;
    font-size: 12pt;
    line-height: 1.7;
  }

  .novel-p {
    text-indent: 1.5rem;
  }

  .novel-end-marker {
    opacity: 0.4;
  }
}
</style>
