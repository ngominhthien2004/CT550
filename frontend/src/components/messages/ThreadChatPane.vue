<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import MessageBubble from './MessageBubble.vue'
import ComposeForm from './ComposeForm.vue'

const props = defineProps({
  selectedThreadId: { type: String, default: '' },
  headerTitle: { type: String, default: '' },
  headerAvatar: { type: String, default: '' },
  presenceState: { type: Object, default: () => ({ online: false, typing: false, lastSeen: null }) },
  threadSearchQuery: { type: String, default: '' },
  searchActive: { type: Boolean, default: false },
  displayedTimeline: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  content: { type: String, default: '' },
  sending: { type: Boolean, default: false },
  selectedImages: { type: Array, default: () => [] },
  replyingTo: { type: Object, default: null },
  isDragging: { type: Boolean, default: false },
  currentUserId: { type: String, default: '' },
  parseMessageContent: { type: Function, required: true },
})

const emit = defineEmits([
  'back', 'search', 'clear-search', 'update:threadSearchQuery',
  'reply', 'delete', 'mark-read', 'scroll-images', 'scroll',
  'update:content', 'send', 'typing', 'image-select', 'clear-images',
  'dragover', 'dragleave', 'drop',
  'report', 'block',
])

const chatBodyRef = ref(null)
const showMenu = ref(false)
const menuWrapperRef = ref(null)
let searchDebounce = null

function scrollToBottom() {
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}

function onBodyScroll() {
  if (!chatBodyRef.value) return
  const el = chatBodyRef.value
  emit('scroll', {
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  })
}

function onSearchInput(value) {
  emit('update:threadSearchQuery', value)
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    if (value.trim()) emit('search')
    else emit('clear-search')
  }, 350)
}

function closeMenu() { showMenu.value = false }

function onClickOutside(e) {
  if (menuWrapperRef.value && !menuWrapperRef.value.contains(e.target)) {
    showMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

defineExpose({ scrollToBottom })
</script>

<template>
  <section
    class="thread-pane"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave', $event)"
    @drop="emit('drop', $event)"
  >
    <header class="pane-head thread-head">
      <div class="thread-head-left">
        <button v-if="selectedThreadId" type="button" class="icon-btn ghost mobile-back" @click="emit('back')">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <img v-if="headerAvatar" class="thread-head-avatar" :src="headerAvatar" :alt="headerTitle || 'Conversation partner'" @error="(e) => e.target.style.display = 'none'" />
        <h2 class="h6 mb-0 thread-head-title">
          {{ headerTitle }}
          <span v-if="selectedThreadId && presenceState.online" class="presence-indicator">
            <span class="presence-dot" :class="{ online: !presenceState.typing, typing: presenceState.typing }"></span>
            <span class="presence-text">{{ presenceState.typing ? 'typing...' : 'Online' }}</span>
          </span>
          <span v-else-if="selectedThreadId && !presenceState.online && presenceState.lastSeen" class="presence-indicator">
            <span class="presence-dot offline"></span>
            <span class="presence-text">Offline</span>
          </span>
        </h2>
      </div>
      <div class="thread-head-right">
        <div class="thread-search-box" :class="{ active: searchActive }">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            :value="threadSearchQuery"
            placeholder="Search..."
            aria-label="Search this conversation"
            class="thread-search-input"
            @input="onSearchInput($event.target.value)"
          />
          <button v-if="searchActive" type="button" class="search-clear-btn" @click="emit('clear-search')" aria-label="Clear search">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="thread-menu-wrapper" v-if="selectedThreadId" ref="menuWrapperRef">
          <button type="button" class="icon-btn ghost" @click="showMenu = !showMenu" aria-label="More options">
            <i class="fa-solid fa-ellipsis"></i>
          </button>
          <div v-if="showMenu" class="dd-panel">
            <button type="button" class="dd-item" @click="emit('report'); closeMenu()">
              <i class="fa-solid fa-flag"></i> Report
            </button>
            <button type="button" class="dd-item dd-item--danger" @click="emit('block'); closeMenu()">
              <i class="fa-solid fa-ban"></i> Block
            </button>
          </div>
        </div>
      </div>
    </header>

    <div v-if="isDragging" class="drag-drop-overlay">
      <div class="drag-drop-box">
        <i class="fa-regular fa-image drag-icon"></i>
        <p>Drop images here to attach</p>
      </div>
    </div>

    <div class="thread-body" ref="chatBodyRef" @scroll="onBodyScroll">
      <div v-if="loading" class="skeleton-flow" aria-hidden="true">
        <div v-for="i in 4" :key="'sk-bubble-' + i" class="skeleton-bubble-wrap" :class="i % 2 === 0 ? 'outgoing' : 'incoming'">
          <div class="skeleton-bubble shimmer"></div>
        </div>
      </div>

      <div v-else-if="displayedTimeline.length" class="message-flow">
        <template v-for="row in displayedTimeline" :key="row.key">
          <p v-if="row.type === 'day'" class="day-separator">{{ row.label }}</p>
          <MessageBubble
            v-else
            :row="row"
            :current-user-id="currentUserId"
            @reply="emit('reply', $event)"
            @delete="emit('delete', $event)"
            @mark-read="emit('mark-read', $event)"
            @scroll-images="scrollToBottom"
          />
        </template>
      </div>
      <p v-else class="pane-note">No conversation selected. Pick a user from the left to start chatting.</p>
    </div>

    <div v-if="replyingTo" class="reply-context-bar">
      <div class="reply-context-info">
        <i class="fa-solid fa-reply reply-icon"></i>
        <div class="reply-context-text">
          <span class="reply-to-user">Replying to <strong>@{{ replyingTo.sender?.username || 'user' }}</strong></span>
          <p class="reply-to-snippet">{{ parseMessageContent(replyingTo.content).body }}</p>
        </div>
      </div>
      <button type="button" class="btn-close-reply" @click="$emit('reply', null)" aria-label="Cancel reply">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <ComposeForm
      :content="content"
      :sending="sending"
      :selected-thread-id="selectedThreadId"
      :selected-images="selectedImages"
      @update:content="emit('update:content', $event)"
      @send="emit('send')"
      @typing="emit('typing')"
      @image-select="emit('image-select', $event)"
      @clear-images="emit('clear-images')"
    />
  </section>
</template>

<style scoped src="../../assets/styles/dropdown.css"></style>
<style scoped>
.thread-pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: var(--surface);
}

.pane-head {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--line);
}

.thread-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.thread-head-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.thread-head-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-head-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.thread-head-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.thread-search-box {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.3rem 0.5rem;
  background: var(--surface-alt);
  transition: border-color 0.2s, box-shadow 0.2s, width 0.2s;
  width: 160px;
}

.thread-search-box:focus-within,
.thread-search-box.active {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
  background: var(--surface);
}

.search-icon {
  font-size: 0.7rem;
  color: var(--muted);
  flex-shrink: 0;
}

.thread-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.8rem;
  width: 100%;
  min-width: 0;
  color: var(--text);
}

.thread-search-input::placeholder {
  color: var(--muted);
}

.search-clear-btn {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.search-clear-btn:hover {
  color: #6366f1;
}

.thread-menu-wrapper {
  position: relative;
}

/* Thread menu item sizing override */
.dd-panel .dd-item {
  padding: 0.55rem 0.75rem;
  font-size: 0.82rem;
  gap: 0.5rem;
}

.presence-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--muted);
}

.presence-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--muted);
}

.presence-dot.online { background: #22c55e; }
.presence-dot.typing { background: #f59e0b; animation: pulse 1s infinite; }
.presence-dot.offline { background: var(--muted); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.drag-drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(99, 102, 241, 0.12);
  display: grid;
  place-items: center;
  z-index: 10;
}

.drag-drop-box {
  background: var(--surface);
  border: 2px dashed #6366f1;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.drag-icon {
  font-size: 2rem;
  color: #6366f1;
  margin-bottom: 0.5rem;
}

.thread-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  min-height: 0;
  scrollbar-width: none; /* Firefox */
}
.thread-body::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Edge */
}

.skeleton-flow {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-bubble-wrap.outgoing {
  display: flex;
  justify-content: flex-end;
}

.skeleton-bubble {
  width: 60%;
  height: 40px;
  border-radius: 16px;
  background: var(--line);
}

.skeleton-bubble-wrap.outgoing .skeleton-bubble {
  background: rgba(99, 102, 241, 0.2);
}

.shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

.message-flow {
  display: flex;
  flex-direction: column;
}

.day-separator {
  text-align: center;
  font-size: 0.78rem;
  color: var(--muted);
  margin: 1rem 0;
}

.pane-note {
  text-align: center;
  padding: 2rem;
  color: var(--muted);
}

.reply-context-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: rgba(99, 102, 241, 0.08);
  border-top: 1px solid rgba(99, 102, 241, 0.2);
}

.reply-context-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reply-icon { color: #6366f1; }

.reply-to-user {
  font-size: 0.82rem;
  color: #6366f1;
}

.reply-to-snippet {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-close-reply {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.mobile-back {
  display: none;
}

@media (max-width: 768px) {
  .mobile-back { display: inline-flex; }
  .thread-search-box { width: 120px; }
}
</style>
